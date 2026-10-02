#!/usr/bin/env python3
"""Bounded HCAN22 listener extraction following the static original reader.

Read-only source library. Supports sized kind2 records and base section v5;
unknown subclasses retain their bytes and are never promoted to physics rules.
Bone-table anchors are independently resolved against native HSKN names.
"""
import hashlib, importlib.util, json, math, struct
from pathlib import Path
HERE=Path(__file__).resolve().parent
LIB=HERE.parents[1]/'libraries/evil-genius-2'
VECTOR=0x998715d4
BASE_VERIFIED={VECTOR:0x1400d3ea2,0xd032ec05:0x140598bb1,0x45803af7:0x14059d026}

class Reader:
    def __init__(self,data,start=0,end=None):
        self.data=data;self.p=start;self.end=len(data) if end is None else end
        if not 0<=start<=self.end<=len(data):raise ValueError('invalid reader bounds')
    def take(self,n):
        if n<0 or n>self.end-self.p:raise ValueError('truncated bounded section')
        p=self.p;self.p+=n;return self.data[p:self.p]
    def u32(self):return struct.unpack('<I',self.take(4))[0]
    def f32(self):
        f=struct.unpack('<f',self.take(4))[0]
        if not math.isfinite(f):raise ValueError('nonfinite channel interval')
        return f
    def padded_string(self):
        start=self.p;out=bytearray()
        while True:
            chunk=self.take(4);zero=chunk.find(b'\0')
            if zero>=0:
                out.extend(chunk[:zero]);break
            out.extend(chunk)
        return {'value':out.decode('utf-8'),'offset':start,'bytes':self.data[start:self.p].hex()}
    def done(self):
        if self.p!=self.end:raise ValueError('unconsumed bounded section')

def envelope(r,max_version=None):
    start=r.p;header=r.u32();version=header&0xffffff
    if not header&0x80000000 or header&0x7f000000:raise ValueError('unsupported unsized/envelope flags')
    if max_version is not None and version>max_version:raise ValueError('unsupported section version')
    encoding=r.take(1)[0]
    if encoding!=0:raise ValueError('unsupported section encoding')
    length=r.u32();p=r.p;payload=r.take(length)
    return Reader(r.data,p,p+length),{'offset':start,'version':version,'encoding':encoding,'payloadOffset':p,'payloadBytes':length,'endOffsetExclusive':p+length}

def base_section(r):
    b,meta=envelope(r,5)
    if meta['version']!=5:raise ValueError('base versions other than5 remain unsupported')
    interval_offset=b.p;start=b.f32();end=b.f32()
    field10=b.u32();listener_id=b.u32();field18=b.u32();label=b.padded_string()
    count_offset=b.p;count=b.u32();byte_data=b.take(count).hex()
    event_offset=b.p;event=b.u32();b.done()
    return {'section':meta,'startNormalizedRaw':start,'endNormalizedRaw':end,'intervalOffset':interval_offset,
            'field10Raw':field10,'listenerID':hex(listener_id),'field18Raw':field18,
            'label':label,'byteArrayCountOffset':count_offset,'byteArrayHex':byte_data,
            'eventHash':hex(event),'eventHashOffset':event_offset,
            'intervalScope':'Raw endpoints consumed by normalized native scheduler, not launch velocity or cooldown.'}

def read_record(r):
    p=r.p;kind=r.u32()
    if kind!=2:raise ValueError('only sized kind2 records implemented')
    type_hash=r.u32()
    if type_hash==0:return {'offset':p,'kind':kind,'typeHash':'0x0','null':True,'endOffsetExclusive':r.p}
    size_offset=r.p;size=r.u32();payload_offset=r.p;payload=r.take(size)
    sub=Reader(r.data,payload_offset,payload_offset+size);outer,meta=envelope(sub,4 if type_hash==VECTOR else None);sub.done()
    out={'offset':p,'kind':kind,'typeHash':hex(type_hash),'serializedSizeOffset':size_offset,
         'serializedBytes':size,'payloadOffset':payload_offset,'endOffsetExclusive':r.p,'section':meta,
         'payloadSha256':hashlib.sha256(payload).hexdigest()}
    if type_hash in BASE_VERIFIED:
        out['base']=base_section(outer);out['baseReaderCallVA']=hex(BASE_VERIFIED[type_hash])
        if type_hash==VECTOR:
            if meta['version']!=4:raise ValueError('vector versions other than4 remain unsupported')
            out['modeOffset']=outer.p;out['modeRaw']=outer.u32();outer.done()
            out['subclassDecoded']=True
        else:
            out['subclassDecoded']=False;out['opaqueSubclassOffset']=outer.p
            out['opaqueSubclassBytes']=outer.take(outer.end-outer.p).hex()
    else:
        out['subclassDecoded']=False;out['opaquePayloadHex']=payload.hex()
        out['unverified']='Nested base-like bytes not attributed to fields: concrete subclass reader remains unresolved.'
    return out

def read_u32_array(r):
    p=r.p;version=r.u32()
    if version!=1:raise ValueError('unsupported native u32 array version')
    count=r.u32()
    if count>(r.end-r.p)//4:raise ValueError('array count exceeds bounds')
    return {'offset':p,'version':version,'values':[r.u32() for _ in range(count)],'endOffsetExclusive':r.p}

def read_tail(data,bone_end):
    if len(data)<12 or data[:4]!=b'HCAN' or struct.unpack_from('<I',data,8)[0]!=22:raise ValueError('HCAN22 required')
    r=Reader(data,bone_end);first=read_u32_array(r);kind=r.u32();aliases=read_u32_array(r)
    alias_hash=r.u32();count_offset=r.p;count=r.u32()
    if count>(r.end-r.p)//8:raise ValueError('listener count exceeds bounds')
    listeners=[read_record(r) for _ in range(count)];r.done()
    return {'boneHashEndOffset':bone_end,'firstU32Array':first,'cacheKindRaw':kind,'aliasU32Array':aliases,
            'aliasHash':hex(alias_hash),'listenerCountOffset':count_offset,'listeners':listeners,
            'endOffsetExclusive':r.p,'tailBytes':len(data)-bone_end,'allTailBytesConsumed':True}

def collect():
    bank=json.loads((HERE/'animation-data/index.json').read_text())
    clips=json.loads((LIB/'assets/animations/clips.json').read_text());by_name={c['name']:c for c in clips}
    trpa=json.loads((HERE/'evidence/native-trap-animation-data.json').read_text());references={}
    for rec in trpa['records']+trpa['linkedRecords']:
        for gi,g in enumerate(rec['parsed']['groups']):
            for si,s in enumerate(g['slots']):
                for pi,phase in enumerate(s['entries']):
                    for ref in phase['clipReferences']:
                        for c in ref['clips']:
                            references.setdefault(c['name'],[]).append({'record':rec['name'],'group':gi,'slot':si,'phase':pi,'resourceOffset':ref['offset']})
    names={}
    for file in (LIB/'assets/animations/skeletons').glob('*.json'):
        for bone in json.loads(file.read_text())['bones']:
            h=0
            for ch in bone['name'].lower():h=(h*31+ord(ch))&0xffffffff
            if h in names and names[h].lower()!=bone['name'].lower():raise ValueError('HSKN hash collision')
            names[h]=bone['name']
    spec=importlib.util.spec_from_file_location('hcan',HERE/'decode-animation.py');hcan=importlib.util.module_from_spec(spec);spec.loader.exec_module(hcan)
    anchors={c['name']:c['boneHashOffset'] for c in bank['clips']};selected=sorted(set(anchors)|set(references));records=[]
    for name in selected:
        clip=by_name[name];data=(LIB/clip['raw']).read_bytes();sha=hashlib.sha256(data).hexdigest()
        if sha!=clip['id']:raise ValueError('source sha mismatch')
        if not clip['flagsRaw']&0x1000:raise ValueError('native bone-hash-table flag required')
        bc=clip['boneCountRaw']
        if name in anchors:hp=anchors[name]
        else:
            _,end,_=hcan.read_channels(clip,data);matches=[]
            for p in range(end,len(data)-bc*4+1):
                if struct.unpack_from('<I',data,p)[0] not in names:continue
                hs=struct.unpack_from('<'+str(bc)+'I',data,p)
                if len(set(hs))==bc and all(h in names for h in hs):matches.append(p)
            if len(matches)!=1:raise ValueError((name,'nonunique native bone anchor',matches))
            hp=matches[0]
        hashes=struct.unpack_from('<'+str(bc)+'I',data,hp)
        if len(set(hashes))!=bc or not all(h in names for h in hashes):raise ValueError('bone-name anchor invalid')
        records.append({'name':name,'source':clip['raw'],'sourceSha256':sha,'durationSeconds':clip['durationRaw'],
                        'boneHashOffset':hp,'nativeBoneNames':[names[h] for h in hashes],
                        'trpaReferences':references.get(name,[]),'tail':read_tail(data,hp+4*bc)})
    return records,len(bank['clips']),len(references)

if __name__=='__main__':
    records,bank_count,ref_count=collect()
    out={'schema':'eg2-native-hcan-listeners-data/1','decoderSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
         'clipsIndexSha256':hashlib.sha256((LIB/'assets/animations/clips.json').read_bytes()).hexdigest(),
         'originalExecuted':False,'records':records,'coverage':{'selectedBankClips':bank_count,'uniqueTRPAReferencedClips':ref_count,
         'unionClips':len(records),'listenerRecords':sum(len(r['tail']['listeners']) for r in records),
         'vectorRecords':sum(l['typeHash']==hex(VECTOR) for r in records for l in r['tail']['listeners'])},
         'limits':['Native object/target binding and collision/navigation remain unresolved.','Decoded event records are not an intrinsic trap impulse.','Unknown subclasses preserve bytes; base-like prefixes are not semantic proof.','Source anchor is exact HSKN name-hash run; earlier HCAN tail fields remain outside this parser.']}
    (HERE/'evidence/native-hcan-listeners-data.json').write_text(json.dumps(out,indent=2)+'\n')
    print(json.dumps(out['coverage']))
