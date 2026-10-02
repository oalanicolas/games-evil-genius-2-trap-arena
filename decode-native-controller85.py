"""Read the selected FNTR prefix and preserve controller85 source windows.

This is static evidence, never an execution of the original client. The prefix
anchor B+355 was recovered previously; only the selected flat v155 variant is
accepted here. Unknown versions or nested encodings fail instead of guessing.
"""
import hashlib
import json
from pathlib import Path
import struct

ROOT = Path(__file__).resolve().parent


def read_prefix(raw, body):
    pos = body + 355
    def take(fmt):
        nonlocal pos
        size = struct.calcsize('<' + fmt)
        if pos + size > len(raw):
            raise ValueError('Truncated selected FNTR prefix')
        value = struct.unpack_from('<' + fmt, raw, pos)[0]
        pos += size
        return value
    fields = {'controllerKey': take('I'), 'field1ac': take('I')}
    header, nested_flag, length = take('I'), take('B'), take('I')
    if header != 0x80000001 or nested_flag != 0 or length < 4:
        raise ValueError('Unsupported selected FNTR array encoding')
    start = pos
    count = take('I')
    if length != 4 + count * 4 or count > (len(raw) - pos) // 4:
        raise ValueError('Invalid selected FNTR array bounds')
    fields['field210'] = [take('I') for _ in range(count)]
    if pos - start != length:
        raise ValueError('FNTR nested payload size mismatch')
    for field, fmt in [('field1f4','B'), ('field1f8','f'), ('field1fc','f'),
                       ('field200','B'), ('field204','f'), ('field208','f')]:
        fields[field] = take(fmt)
    fields['queryModeOffset'] = pos
    fields['queryMode'] = take('I')
    fields['endOffsetExclusive'] = pos
    return fields


def main():
    import pefile
    import capstone
    exe = Path.home() / 'Games/SteamReferences/evil-genius-2/bin/evilgenius_vulkan.exe'
    raw = exe.read_bytes()
    pe = pefile.PE(data=raw, fast_load=True)
    base = pe.OPTIONAL_HEADER.ImageBase
    md = capstone.Cs(capstone.CS_ARCH_X86, capstone.CS_MODE_64)
    def window(name, start, end, code=True):
        data = pe.get_data(start-base, end-start)
        return {'name': name, 'vaStart': hex(start), 'vaEndExclusive': hex(end),
                'fileOffset': pe.get_offset_from_rva(start-base),
                'bytes': data.hex(), 'sha256': hashlib.sha256(data).hexdigest(),
                'disassembly': [f'{i.address:#x}: {i.bytes.hex()} {i.mnemonic} {i.op_str}'
                                for i in md.disasm(data,start)] if code else []}
    rows = [window(*r) for r in [
        ('FNTR prefix from established B+355 anchor',0x140652f45,0x140653199),
        ('Nested u32 array reader',0x1404d4e00,0x1404d4f66),
        ('Controller factory type80..85',0x14059f9e0,0x14059fceb),
        ('Factory registration via RIP-relative pointer, not direct call',0x1592a5ef6,0x1592a5f26),
        ('Controller buffer load, factory and virtual deserialize',0x140101ab0,0x140101c35),
        ('Controller85 vector query',0x1405a2510,0x1405a2899),
        ('Manager parameter vector producer',0x140987590,0x14098788e),
        ('Integer planar vector and record-relative cardinal rotation',0x140612d00,0x140612e16),
        ('Vector normalization',0x14007e590,0x14007e604),
        ('Channel query to vector event construction',0x1405a29a0,0x1405a2e81),
        ('Controller85 setup invokes channel callback',0x14059ed80,0x14059eeed),
        ('Event delivery through receiver virtual+38',0x1400b8ae0,0x1400b8bcf),
        ('Register listener by virtual type hash',0x1400b8190,0x1400b82b5),
        ('Select listeners by event channel ID',0x1400b9780,0x1400b98f0),
        ('Direction listener type hash',0x1400b6f90,0x1400b6f96),
        ('Position listener type hash',0x1400b7010,0x1400b7016),
        ('Direction receiver: vector to target quaternion',0x1400b5980,0x1400b5ac4),
        ('Position receiver: vector to target translation',0x1400b5430,0x1400b5492),
        ('Shared listener channel parameters',0x1400b4e60,0x1400b4f3d),
        ('Listener channel mode copy',0x1400b52a0,0x1400b52d7),
        ('Listener normalized interval and state dispatch',0x1400b5080,0x1400b5263),
        ('Direction listener start',0x1400b5890,0x1400b5928),
        ('Direction listener quaternion interpolation call',0x1400b5930,0x1400b5980),
        ('Position listener start and relative Y mode',0x1400b54d0,0x1400b557d),
        ('Position listener curve progress and target interpolation',0x1400b5580,0x1400b5839),
        ('Extra position sampler with root retarget and mirror',0x1400ce210,0x1400ce2f5),
        ('Direction to basis matrix',0x14015cd90,0x14015cf80),
        ('Basis matrix to xyzw quaternion',0x140086140,0x1400862e6),
    ]]
    data_rows = [window(*r,code=False) for r in [
        ('Controller85 vtable',0x140b0d3e8,0x140b0d450),
        ('Controller factory jump table',0x14059fcec,0x14059fd04),
        ('Vector sign mask',0x140b4bc40,0x140b4bc50),
        ('Direction listener vtable',0x140ad3dc0,0x140ad3e60),
        ('Position listener vtable',0x140ad3e60,0x140ad3f00),
        ('Listener state jump table: six RVAs',0x1400b5264,0x1400b527c),
        ('Direction horizontal-axis threshold',0x140b4adb0,0x140b4adb4),
        ('Direction receiver squared-distance threshold',0x140b4ae0c,0x140b4ae10),
        ('Matrix quaternion half constant',0x140b4b148,0x140b4b14c),
        ('Normalization and interval one constant',0x140b4b224,0x140b4b228),
        ('Direction absolute-value bit mask',0x140b4bc30,0x140b4bc40),
    ]]
    source = json.loads((ROOT/'evidence/native-rules-research.json').read_text())
    records = []
    for record in source['trap_records']:
        path = ROOT.parents[1]/record['origin']['extracted_file']
        content = path.read_bytes()
        assert hashlib.sha256(content).hexdigest() == record['origin']['sha256']
        fields = read_prefix(content, record['alignment_boundary'])
        records.append({'name': record['record'], 'source': record['origin'],
                        'bodyAnchor': record['alignment_boundary'], 'fields': fields,
                        'nativeField': 'FNTR+0x1b0',
                        'query': '0x0e1f74ce',
                        'scope': 'Vector query selector, not an intrinsic speed or phase duration'})
    report = {
        'schema':'eg2-native-controller85-route/1',
        'source':{'filename':exe.name, 'sha256':hashlib.sha256(raw).hexdigest()},
        'originalExecuted':False, 'ranges':rows, 'dataRanges':data_rows, 'records':records,
        'confirmed':{
            'factory':'Type85 allocates0x50, vtableb0d3e8; factory registered at141a430d8 and called indirectly by101b72 before virtual+10 deserialization.',
            'transport':'Vector actor+718/724 comes from808e payload+0c/+18; param+3c is written by98778e→612d00. It is not a fixed scene-axis speed.',
            'integerVector':'612d00 uses component+10 or+1a0 selected by r9b, stored pair+0c, record+0c cardinal rotation, int32 operations, cvtdq2ps and sign xor. Y output is0. Record/guard lookup must succeed.',
            'queryModes':{'0':'query returns false, without a supplied vector',
                          '1':'actor+718 XYZ', '2':'normalized planar target delta via instance lookup',
                          '3':'furniture controller virtual+68 result', '4':'actor+724 XYZ'},
            'queryRotation':'Except phase06343c19, apply primary TRPA+8b8 quaternion when found; if clip/skeleton present, apply sampled HCAN extra quaternion using native0d31f0/0a2430. No forced global+x branch.',
            'queryOutput':'Successful branch returns vector and output type0. Vector-event type0 usesf05c69fc (direction-to-quaternion listener), type1d87366dd (target-translation listener). Neither is an intrinsic speed or impulse.',
            'listenerRegistration':'0b8190 obtains listener virtual+0 hash, stores its bucket under that hash, and inserts the listener.0b8ae0 selects by event+0c hash;0b9780 filters listener+40 by event+10 ID before virtual+38 delivery.',
            'directionReceiver':{'eventHash':'0xf05c69fc','vtable':'0x140ad3dc0',
                'typeGetter':'0x1400b6f90','receiver':'0x1400b5980',
                'payloadXYZOffsets':['0x18','0x1c','0x20'],'outputQuaternionOffset':'0x90',
                'guard':'Reject null event, mismatched hash or listener+3c nonzero. When squared distance to runtime globals142235580/584/588 is below f32(1e-6), return true without changing state or quaternion. Those global runtime values are not established by file bytes.',
                'operation':'Normalize supplied XYZ if norm squared differs from1 and length is nonzero;15cd90 normalizes again and constructs basis;086140 converts basis to xyzw. Store quaternion+90 and state1. No translation or speed store.',
                'application':'0b5890 captures current object matrix via owner+70->+30 virtual48, or applies target matrix via virtual38 when progress>=end.0b5930 interpolates source+80 to target+90 through0b6d80; denominator=end+2c minus captured start+30, numerator=progress minus channel start+28. This interpolation helper is distinct from the HCAN bone nlerp.'},
            'positionReceiver':{'eventHash':'0xd87366dd','vtable':'0x140ad3e60',
                'typeGetter':'0x1400b7010','receiver':'0x1400b5430',
                'payloadXYZOffsets':['0x18','0x1c','0x20'],'outputTranslationOffset':'0x8c',
                'payloadExtraOffset':'0x24','storedExtraOffset':'0xa4',
                'guard':'Reject null event, mismatched hash or listener+3c nonzero.',
                'operation':'Copy target XYZ to listener+8c/90/94, extra scalar to+a4 and set state1.0b54d0 captures object current translation through owner+70->+30 virtual40; if progress>=end, apply target via virtual30 and state5. Otherwise start+80=current translation; when mode+78==1, REPLACE targetY with f32(currentY+extraScalar), preserving targetX/Z.',
                'interpolation':'0b5580 uses scalar length of sampled extra positions at captured start, interval end and current clip progress when valid and unequal endpoint lengths: alpha=abs(currentLength-startLength)/abs(endLength-startLength). Otherwise alpha=(progress-capturedStart)/(end-capturedStart), failing when denominator<=0. Clamp alpha to0..1, output=start+alpha*(target-start) with float32 operations to listener+18/1c/20.',
                'curveSampler':'0ce210 requires motion+10, clip+48, clip flag10 and nonnull output; calls0d29d0 at input progress, applies0d35d0 root retarget when skeleton available and mirrors only X for motion flagbit18. Actual model map+2f0, clip progress+64, endpoints and live root parameters remain unresolved.'},
            'listenerTimeline':'0b4e60 copies channel+8/+c into listener+28/+2c, clamped to0..1, and channel+14 into listener+40.0b52a0 copies channel+50 into mode+78.0b5080 dispatches six listener states, invoking start virtual68, update virtual70 and exit virtual78; it does not establish trap state durations in seconds.',
            'directionBasis':'15cd90 uses f32(1e-12) to choose near-vertical basis when both abs(normalizedX) and abs(normalizedZ) are below threshold; otherwise tangent=normalize([Z,0,-X]). Matrix columns are tangent, cross(direction,tangent), direction.086140 uses trace/maximum-diagonal branches and f32(0.5); matrix is a direction basis, not a velocity tensor.'},
        'unresolved':['Producer of phase event267d5762 and live phase timeline',
                      'Concrete owner transform methods, source channel records and live timeline values for the resolved vector listeners',
                      'Direction receiver runtime comparison globals142235580/584/588 and native quaternion interpolation helper internals',
                      'Live component direction pair, record selection and eligibility guard612ec0',
                      'Native controller buffer via E8 to model source+88/+90/+92',
                      'World reaction physics, collision, recovery and damage'],
        'nextRoute':'Resolve original channel records that supply normalized+8/+c, mode+50 and target channel ID; then owner+70->+30 transform setters and model+2f0 clip progress. These determine trajectory timing and displacement. Do not apply direction events as speed or repeat equalityE8/phase scans.'}
    (ROOT/'evidence/native-controller85-route.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'records':{r['name']:r['fields']['queryMode'] for r in records},
                      'codeWindows':len(rows),'dataWindows':len(data_rows)}))


if __name__ == '__main__':
    main()
