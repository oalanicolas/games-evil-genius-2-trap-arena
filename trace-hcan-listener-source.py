#!/usr/bin/env python3
"""Save reproducible static source proof; never run the original executable."""
import hashlib,json,struct
from pathlib import Path
import pefile
from capstone import Cs,CS_ARCH_X86,CS_MODE_64
HERE=Path(__file__).resolve().parent
EXE=Path.home()/'Games/SteamReferences/evil-genius-2/bin/evilgenius_vulkan.exe'
EXPECTED='c52e656a6bbdfdf4f59aa03bfa0f11425854299e61fb078744e5865847c79042'
raw=EXE.read_bytes();assert hashlib.sha256(raw).hexdigest()==EXPECTED
pe=pefile.PE(data=raw,fast_load=True);base=pe.OPTIONAL_HEADER.ImageBase
md=Cs(CS_ARCH_X86,CS_MODE_64)
def window(name,a,z,code=True):
    b=pe.get_data(a-base,z-a)
    r={'name':name,'vaStart':hex(a),'vaEndExclusive':hex(z),'fileOffset':pe.get_offset_from_rva(a-base),'bytes':b.hex(),'sha256':hashlib.sha256(b).hexdigest()}
    if code:
        ins=list(md.disasm(b,a));assert sum(i.size for i in ins)==len(b),(name,'partial disassembly')
        r['disassembly']=[f'{hex(i.address)}: {i.bytes.hex()} {i.mnemonic} {i.op_str}' for i in ins]
    return r
ranges=[window(n,a,z) for n,a,z in [
 ('HCAN bone-name array and following metadata',0x140125859,0x1401259ca),
 ('HCAN version19 and newer polymorphic channels',0x140125a60,0x140125c28),
 ('Version1 u32 array helper',0x1401265c0,0x140126672),
 ('Polymorphic object factory resolution',0x140126680,0x140126718),
 ('Sized section envelope',0x14008e730,0x14008e7de),
 ('Common animation-channel base reader',0x1400d3850,0x1400d3af7),
 ('Vector-channel subclass reader',0x1400d3cf0,0x1400d3fc1),
 ('Vector-channel allocation and vtable assignment',0x1400d5220,0x1400d5256),
 ('Vector-channel registry insertion',0x14002dd60,0x14002ddae),
 ('Base-channel registry insertion',0x14002dd10,0x14002dd5e),
 ('Padded zero-terminated strings',0x140138160,0x14013822e),
 ('Channel0xd032ec05 calls base reader',0x140598b50,0x140598bf0),
 ('Channel0x45803af7 calls base reader',0x14059cfc0,0x14059d209),
 ('Pinned-position query returns actor420 destination and type1',0x1405a2534,0x1405a2607),
 ('Bounce branch stores pinned destination',0x1405451ac,0x1405451e6),
 ('Bounce branch emits position event with native listener ID',0x140545259,0x1405452bc),
 ('Vector-channel type getter',0x1400b70c0,0x1400b70c6),
]]
data_ranges=[window(n,a,z,False) for n,a,z in [
 ('Vector channel descriptor',0x140ad5538,0x140ad5568),
 ('Base channel descriptor',0x140ad5568,0x140ad5598),
 ('Vector channel vtable',0x140ad55c0,0x140ad5600),
 ('Vector descriptor cache pointer',0x1419e6c98,0x1419e6ca0),
 ('Base descriptor cache pointer',0x1419e6c38,0x1419e6c40),
 ('Channel0xd032ec05 vtable',0x140b11c28,0x140b11c68),
 ('Channel0x45803af7 vtable',0x140b122b8,0x140b122f8),
]]
assert struct.unpack('<Q',pe.get_data(0x19e6c98,8))[0]==0x140ad5538
assert struct.unpack('<Q',pe.get_data(0xad5548,8))[0]==0x1400d5220
v=struct.unpack('<8Q',pe.get_data(0xad55c0,64));assert v[0]==0x1400b70c0 and v[6]==0x1400d3cf0
report={'schema':'eg2-native-hcan-listeners-code/1','generatorSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'source':{'filename':EXE.name,'sha256':EXPECTED},'originalExecuted':False,'ranges':ranges,'dataRanges':data_ranges,
 'confirmed':{
 'location':'HCAN22 stores a counted array of polymorphic animation channels after native bone hashes and metadata. Clip+30 count, clip+38 pointer array.',
 'record':'Kind2 is u32kind, u32type, u32size then serialized section; native missing type skips size. Parser intentionally accepts only sized kind2 nonnull records present in this corpus.',
 'factory':'Register998715d4 using descriptor cache1419e6c90; descriptor pointer1419e6c98->ad5538; factory0d5220 allocates58 and sets vtablead55c0; virtual30=0d3cf0.',
 'base':'Outer vector sectionv4 calls base0d3850; basev5 reads start/end f32, fields10/14/18, padded zero-terminated string, byte array count/data, eventhash48. ID14 is copied to listener40 by previously proven0b4e60.',
 'vector':'Vectorv4 reads mode50 after base; event type is base48. Directionf05c69fc and target-positiond87366dd are delivered to the independently verified listeners in native-controller85-route.json.',
 'unknownSubclasses':'d032ec05 and45803af7 demonstrably call the common base reader; their remaining subclass bytes are preserved. Other types are kept wholly opaque without assigning base field semantics.',
 'trapBouncePosition':'BounceOff_Mount_A_01 native channel ID4a28681e, labelTrapBouncePosition, eventd87366dd, raw normalized interval0..f32(.033), mode0. FanTrap TRPA references this clip in20 serialized phase entries. No seconds conversion without progress binding.',
 'pinnedPosition':'Second BounceOff channel ID8437e2f0, labelMoveToPinnedPos, eventd87366dd, intervalf32(.2)..f32(.2), mode0. Controller85 query5a2510 branch5a25bc resolves instance52b1b0, returns actor+420/424/428 and outputtype1.',
 'bounceEvent':'5451d8/5451e0 stores selected vector into actor+420/424/428.5452a4 emits eventhashd87366dd,5452ac ID4a28681e,545297/5452b4 copies selected XYZ,5452b7 calls0b8ed0. Producer has guards and dynamic endpoint choice; this is not a fixed impulse.'},
 'unresolved':['Scene collision/navigation endpoint generation and all guards in parent545xxx routine.','Clock/progress binding and native object transform behind model methods.','Most concrete subclass payload semantics, including guarded/relocated2939715c and a966812b parsers.','Original-client execution and full five-device chain equivalence.'],
 'nextRoute':'Trace callers and endpoint inputs of545xxx bounce producer, instance lookup and scene setters. Consume verified timeline only once clock, target and phase guards are source-backed.'}
(HERE/'evidence/native-hcan-listeners-code.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'codeWindows':len(ranges),'dataWindows':len(data_ranges),'originalExecuted':False}))
