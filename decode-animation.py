#!/usr/bin/env python3
"""Read HCAN22 native channels; inferred codec, with byte-level validation.

No pose correction or generated animation. Writes only this prototype's outputs.
The HCAN tail/event codec remains opaque; bone hashes are located by exact runs
against names extracted from native HSKN29, not by assuming track index order.
"""
import hashlib,json,math,struct
from pathlib import Path

HERE=Path(__file__).resolve().parent
LIB=HERE.parents[1]/'libraries/evil-genius-2'

def name_hash(s):
    h=0
    for c in s.lower(): h=(h*31+ord(c))&0xffffffff
    return h

def unpack(fmt,d,p): return struct.unpack_from('<'+fmt,d,p)

def read_channels(c,d):
    assert d[:4]==b'HCAN' and unpack('I',d,8)[0]==22
    p=c['payloadOffset']; n,nr,np=unpack('3I',d,p+8)
    assert n==c['boneCountRaw']+bool(c['flagsRaw']&0x10)
    records=[unpack('HHII',d,p+20+12*i) for i in range(n)]
    a=p+20+12*n; rt=a+8*nr; pv=rt+2*nr; pt=pv+12*np; end=pt+2*np
    assert end<=len(d) and sum(x[0] for x in records)==nr and sum(x[1] for x in records)==np
    rotations=[]; norm_error=0
    for j in range(nr):
        raw=unpack('4H',d,a+8*j)
        assert all(x<=65534 for x in raw[:3])
        q=[x/32767-1 for x in raw[:3]]+[raw[3]/65535]
        norm_error=max(norm_error,abs(math.sqrt(sum(x*x for x in q))-1))
        rotations.append(q)
    assert norm_error<0.00012, ('quaternion codec validation',norm_error)
    positions=[list(unpack('3f',d,pv+12*j)) for j in range(np)]
    assert all(math.isfinite(x) for v in positions for x in v)
    rtimes=unpack(str(nr)+'H',d,rt); ptimes=unpack(str(np)+'H',d,pt)
    tracks=[]; ir=ip=0
    for i,(cr,cp,ro,po) in enumerate(records):
        assert ro==ir and po==ip and cr>0 and cp>0
        rr=rtimes[ro:ro+cr]; pp=ptimes[po:po+cp]
        assert list(rr)==sorted(rr) and list(pp)==sorted(pp)
        assert rr[0]==0 and pp[0]==0
        # Multi-key channels may end before duration (e.g. hold at last key).
        tracks.append({'trackIndex':i,'boneIndex':None,'boneName':None,
          'rotationTimeU16':list(rr),'rotationTimes':[t/65535*c['durationRaw'] for t in rr],
          'rotations':rotations[ro:ro+cr],'positionTimeU16':list(pp),
          'positionTimes':[t/65535*c['durationRaw'] for t in pp],
          'positionDeltas':positions[po:po+cp],
          'sourceDescriptorOffset':p+20+12*i,'rotationBufferIndex':ro,'positionBufferIndex':po})
        ir+=cr;ip+=cp
    return tracks,end,{'channelTracks':n,'rotationSamples':nr,'positionSamples':np,
        'maxQuaternionNormError':norm_error,'arraysEnd':end,'descriptorExtentValid':True,
        'channelOffsetsContiguous':True,'timeArraysMonotonic':True,'finitePositions':True,
        'rotationValueOffset':a,'rotationTimeOffset':rt,'positionValueOffset':pv,'positionTimeOffset':pt}

def decode(c,names,rigmap):
    d=(LIB/c['raw']).read_bytes();assert hashlib.sha256(d).hexdigest()==c['id']
    tracks,end,validation=read_channels(c,d);bc=c['boneCountRaw']
    matches=[]
    for p in range(end,len(d)-bc*4+1):
        hs=unpack(str(bc)+'I',d,p)
        if all(h in names for h in hs) and len(set(hs))==bc: matches.append((p,hs))
    # A run is accepted only if native HSKN names identify every hash uniquely.
    assert len(matches)==1, ('bone hash run not unique',c['name'],[p for p,_ in matches])
    hp,hs=matches[0]
    for track,h in zip(tracks,hs):
        track.update(boneHash=h,boneName=names[h],boneIndex=rigmap.get(h))
    if len(tracks)>bc:
        tracks[-1]['role']='extra-root-motion-inferred-from-flag-0x10'
        validation['extraChannel']={'trackIndex':bc,'nativeBoneName':None,
          'positionFirst':tracks[-1]['positionDeltas'][0],'positionLast':tracks[-1]['positionDeltas'][-1],
          'rotationFirst':tracks[-1]['rotations'][0],'rotationLast':tracks[-1]['rotations'][-1],
          'semantics':'Additional channel agrees with header flag0x10 and HANM predecessor extra model motion. Not an HSKN bone. World-space purpose/axes are inferred, not client-verified.'}
    validation.update(nativeNamesResolved=bc,actorBonesMapped=sum(t['boneIndex'] is not None for t in tracks),
       boneHashOffset=hp,uniqueNativeHashRun=True,opaqueTailBytes=len(d)-end)
    if c['flagsRaw']&1:
        for track,scalar in zip(tracks,unpack(str(bc)+'f',d,end)):
            track['nativeBoneLengthScalar']=scalar
    relative=bool(c['flagsRaw']&0x200);rotate=relative and bool(c['flagsRaw']&0x400)
    binding={'positionRelativeToBind':relative,'rotatePositionByBind':rotate,
      'quaternionComposeWithBind':rotate,'quaternionOrder':'bind * sample' if rotate else 'sample absolute',
      'positionFormula':'bindPosition + rotate(bindQuaternion, samplePosition)' if rotate else
        'bindPosition + samplePosition' if relative else 'samplePosition absolute',
      'positionDeltasField':'Backward-compatible name; values are native samples, absolute when header0x200 is absent.',
      'interpolation':'Shortest-arc nlerp for quaternion; linear/clamped alpha for position; single-key/time0 quaternion returned unnormalized.',
      'sourceProof':'evidence/native-animation-code.json',
      'sourceVAs':['0x1401251b7','0x1401251ce','0x1400d2cbf','0x1400d2ce9','0x1400d2d00','0x1400d2d26','0x1400d4ac0'],
      'retarget':'Main pose consumer scales samplePosition by targetBindLength/nativeBoneLengthScalar when scalar>f32(0.01), before testing relative flags. Native xmm9 factor is exactly1.'}
    return {'schema':'eg2-hcan-native/1','name':c['name'],'source':c['raw'],'sourceSha256':c['id'],
      'sourceNames':c['sourceNames'],'duration':c['durationRaw'],'flags':c['flagsRaw'],
      'boneCount':bc,'tracks':tracks,'validation':validation,'binding':binding,
      'semantics':{'extracted':'Native counts, descriptors, channel samples, timestamps and exact HSKN-name hashes.',
       'sourceCodeConfirmed':'Quaternion xyzw: xyz=u16/32767-1, w=u16/65535. Header0x200 makes position relative to bind; combined0x200+0x400 applies bind*sample quaternion and rotates samplePosition by bindQ before adding bindP. Without0x200, positions and quaternions are absolute. Quaternion interpolation is shortest-arc nlerp, preserving decoded values for single-key/time0.',
       'inferred':'time=u16/65535*duration in seconds, consistent with native time quantization and30Hz key spacing.',
       'unverified':'Original-client playback, world handedness/axis conversion, all tail events and actor-specific motion/state flags. Canonical w is nonnegative; samples have not been normalized, cleaned or altered.',
       'hash':'h=31*h+ord(lowercase character) modulo 2^32; exact matches to HSKN29 bone names.',
       'sparse':'Unmapped bones stay null; extra motion channel is separate; no index-order mapping.'}}

def run():
    clips=json.loads((LIB/'assets/animations/clips.json').read_text());rig=json.loads((HERE/'actor-rig.json').read_text())
    rigmap={name_hash(b['name']):b['index'] for b in rig['bones']};names={};skeleton_sources={};skeletons=[]
    for p in sorted((LIB/'assets/animations/skeletons').glob('*.json')):
        skeleton=json.loads(p.read_text());skeletons.append((p,skeleton))
        for b in skeleton['bones']:
            h=name_hash(b['name']); assert h not in names or names[h].lower()==b['name'].lower()
            names[h]=b['name'];skeleton_sources.setdefault(h,p.name)
    chosen=[c for c in clips if c['name'] in ['superInvestigator_walk_neutral_01','Captured_B_walk_01','Investigator_walk_revolvers_01'] or
      c['name'].startswith('Giant_Fan_') and (c['name'].endswith(('_A_01','_B_01')) or c['boneCountRaw']==7) or
      (c['name'].startswith('Trap_') and any(s in c['name'] for s in ['GloveOnSpring','GiantFan','BubbleCannon','Bubble_Blower','SlipperySoap','Laser_']) and
       (c['name'].endswith(('_A_01','_B_01')) or c['name'].endswith('_01') and c['boneCountRaw']<=9))]
    out=HERE/'animation-data';out.mkdir(exist_ok=True);report=[];failures=[]
    for c in chosen:
        try:
            obj=decode(c,names,rigmap)
            obj['rigSource']='actor-rig.json';obj['rigSha256']=hashlib.sha256((HERE/'actor-rig.json').read_bytes()).hexdigest()
            obj['nameSources']={t['boneName']:skeleton_sources[t['boneHash']] for t in obj['tracks'] if t.get('boneName')}
            p=out/(c['name']+'.json');p.write_text(json.dumps(obj,separators=(',',':'))+'\n')
            report.append({'name':c['name'],'path':p.relative_to(HERE).as_posix(),'sourceSha256':c['id'],**obj['validation']})
        except (AssertionError,ValueError,struct.error) as e:failures.append({'name':c['name'],'error':str(e)})
    comparisons=[]
    for nm in ['Investigator_walk_revolvers_01','superInvestigator_walk_neutral_01','Trap_GloveOnSpring_Mount_B_01']:
        obj=json.loads((out/(nm+'.json')).read_text());ls={t['boneHash']:t['nativeBoneLengthScalar'] for t in obj['tracks'] if 'nativeBoneLengthScalar' in t}
        ranked=[]
        for path,sk in skeletons:
            by={name_hash(b['name']):b for b in sk['bones']}
            pairs=[(v,math.sqrt(sum(x*x for x in by[h]['translation']))) for h,v in ls.items() if h in by]
            if pairs:
                error=math.sqrt(sum((a-b)**2 for a,b in pairs)/len(pairs))
                ranked.append((len(pairs),error,path,sk,by))
        ranked.sort(key=lambda x:(-x[0],x[1]));count,error,path,sk,by=ranked[0]
        qs=[]
        for t in obj['tracks']:
            if t.get('boneName','') in ['bn_L_weapon','bn_R_weapon'] and t['boneHash'] in by:
                qs.append({'bone':t['boneName'],'channelQuaternion':t['rotations'][0],'candidateBindQuaternion':by[t['boneHash']]['rotation']})
        comparisons.append({'clip':nm,'sourceSha256':obj['sourceSha256'],'rankedSkeletonCandidate':sk['name'],
           'candidatePath':path.relative_to(LIB).as_posix(),'candidateJsonSha256':hashlib.sha256(path.read_bytes()).hexdigest(),
           'matchedNames':count,'nativeNames':obj['boneCount'],'boneLengthRMSE':error,'quaternionComparisons':qs,
           'interpretation':'Name and length consistency proves compatible native rig dimensions; does not certify this is the original authoring skeleton. Original-code trace now proves flag-controlled bind*sample quaternion and rotated bind-relative positions; see native-animation-code.json.'})
    corpus=[];corpus_errors=[]
    # Diverse source-derived controls, independent of the exported trap families.
    controls=sorted(clips,key=lambda c:c['id'])[::max(1,len(clips)//64)]
    for c in controls:
        try:
            _,_,v=read_channels(c,(LIB/c['raw']).read_bytes());corpus.append({'name':c['name'],'sourceSha256':c['id'],**v})
        except (AssertionError,struct.error) as e:corpus_errors.append({'name':c['name'],'error':str(e)})
    codepath=HERE/'evidence/native-animation-code.json';code=json.loads(codepath.read_text())
    evidence={'schema':'eg2-hcan-research/1','decoderSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
      'originalCodeEvidence':{'path':'evidence/native-animation-code.json','reportSha256':hashlib.sha256(codepath.read_bytes()).hexdigest(),'executableSha256':code['source']['sha256'],'confirmed':code['confirmed']},
      'clipsIndexSha256':hashlib.sha256((LIB/'assets/animations/clips.json').read_bytes()).hexdigest(),
      'exports':report,'failures':failures,'independentControls':corpus,'controlFailures':corpus_errors,
      'nativeSkeletonComparisons':comparisons,
      'provenance':'Format first inferred from native HCAN22 corpus, then quantizer/channel layout/nlerp/bind composition confirmed by static original-executable disassembly. No original client execution and no procedural pose generation.',
      'positionEvidence':'superInvestigator walk static leg/arm/foot positions are ~1e-7 while matched HSKN local translations are 0.07–0.37m. Root sample (-.08877,.02756,.00489) differs from rest (0,-.82782,0); bind-relative deltas strongly supported. Glove root sample (0,.007495,-.012984) also lies near zero. Absolute local position interpretation collapses limbs and is rejected by native data.',
      'timeEvidence':'walk duration1.1333333 has35 keys, from0 to65535, matching34 intervals at30Hz; glove duration.30000001 has10 keys matching9 intervals at30Hz. Fan control has irregular native key times and unit quaternions.',
      'quaternionQuantizerEvidence':{'nativeSampleCount':237064,'xyzEncodedRange':[0,65534],'exactZero':32767,'xyzDivisor32767':{'meanNormResidual':7.669588016988882e-8,'normRMSE':4.9582999837364995e-6},'rejectedDivisor32767_5':{'meanNormResidual':-1.974384361727521e-6,'normRMSE':7.89349033959599e-6},'sourceSelection':'sorted clips index by sha256, every123rd clip; all samples'},
      'rotationEvidence':'Original HCAN loader remaps header0x200/0x400 to runtime0x2/0x4. Consumer0x1400d2ce9 calls Hamilton(bindQ,sampleQ);0x1400d2d00 rotates samplePosition by bindQ, then0x1400d2d26 adds bindPosition. Native sampler0x1400d4ac0 implements shortest-arc nlerp. These source-code facts resolve local bind composition independently of visual tuning.',
      'unresolved':['Original-client pose equivalence','Tail events/state metadata','World-up sign and handedness; interaction helpers demonstrably rotate XZ while preserving Y','Concrete scene-transform methods behind known position/matrix slots, navigation/collision and all other flags']}
    (HERE/'evidence/hcan-research.json').write_text(json.dumps(evidence,indent=2)+'\n')
    (out/'index.json').write_text(json.dumps({'schema':'eg2-hcan-native-index/1','clips':report,'failures':failures},indent=2)+'\n')
    print(json.dumps({'exported':len(report),'failures':failures,'controlsPassed':len(corpus),'controlsFailed':corpus_errors}))

if __name__=='__main__':run()
