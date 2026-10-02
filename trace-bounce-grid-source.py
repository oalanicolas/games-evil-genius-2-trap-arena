#!/usr/bin/env python3
"""Proof of a native grid/collision route; static source only, no game execution."""
import hashlib,json,struct
from pathlib import Path
import pefile
from capstone import Cs,CS_ARCH_X86,CS_MODE_64
HERE=Path(__file__).resolve().parent
exe=Path.home()/'Games/SteamReferences/evil-genius-2/bin/evilgenius_vulkan.exe'
raw=exe.read_bytes();sha=hashlib.sha256(raw).hexdigest()
assert sha=='c52e656a6bbdfdf4f59aa03bfa0f11425854299e61fb078744e5865847c79042'
pe=pefile.PE(data=raw,fast_load=True);base=pe.OPTIONAL_HEADER.ImageBase;md=Cs(CS_ARCH_X86,CS_MODE_64)
def window(name,a,z,code=True):
 b=pe.get_data(a-base,z-a);assert len(b)==z-a
 r={'name':name,'vaStart':hex(a),'vaEndExclusive':hex(z),'fileOffset':pe.get_offset_from_rva(a-base),'bytes':b.hex(),'sha256':hashlib.sha256(b).hexdigest()}
 if code:
  ins=list(md.disasm(b,a));assert sum(i.size for i in ins)==len(b),(name,'instruction extent')
  r['disassembly']=[f'{hex(i.address)}: {i.bytes.hex()} {i.mnemonic} {i.op_str}' for i in ins]
 return r
ranges=[window(n,a,z) for n,a,z in [
 ('Motion update resolves current motion record and owner guard',0x140543370,0x1405433fd),
 ('Motion update calls perpendicular prestep then grid-contact routine',0x140543505,0x1405435b6),
 ('Native centering axis, cell shift and threshold',0x140543c10,0x140543cfe),
 ('Native centering coefficient and first classified-cell branch',0x140543d0e,0x140543deb),
 ('Native escape-helper and second classified-cell branch',0x140543df0,0x140543ebe),
 ('Contact lookahead and floor/XZ cell lookup',0x1405449e0,0x140544be0),
 ('Matching-object and state guards before socket search',0x140544c09,0x140544c89),
 ('Socket lookup, transformed nearest distance and guard',0x140544ca0,0x140544d89),
 ('Socket branch applies resource174 offset and holds motion',0x140544d89,0x140544e07),
 ('Backward grid-cell search and nine-neighbor limit',0x140544e07,0x140544efb),
 ('Boundary and terminal-center native arithmetic',0x140544f7e,0x14054512a),
 ('Class2 pinning and TrapBouncePosition event',0x14054512a,0x1405452c1),
 ('Class1 escape handling and pinned position',0x1405452c1,0x140545377),
 ('Native cell classifier kind0/1/2 with geometry/furniture guards',0x1405453a0,0x1405454b3),
 ('Per-owner motion record lookup',0x1405445f0,0x140544671),
 ('Grid scale is read from typed configuration',0x1405a71c0,0x1405a72c0),
 ('Grid floor allocation and level values',0x1405a7309,0x1405a7430),
]]
constants=[('centeringThreshold',0x140b4afc4,.05),('negativeCenteringThreshold',0x140b4b580,-.05),
 ('centeringCoefficient',0x140b4b3e0,20),('contactDirectionOffset',0x140b4b024,.1),
 ('midpointHeightOffset',0x140b4aed0,.005),('terminalHeightOffset',0x140b4af08,.01),
 ('half',0x140b4b148,.5),('negativeHalf',0x140b4b5b4,-.5),('unknownLookaheadSentinel',0x140b4b530,1e30)]
data=[window(n,va,va+4,False) for n,va,v in constants]
for n,va,v in constants:assert pe.get_data(va-base,4)==struct.pack('<f',v)
data.append(window('Mutable grid scale image defaults X/Y/Z',0x141a1e608,0x141a1e614,False))
assert struct.unpack('<3f',pe.get_data(0x1a1e608,12))==(1.,-1.,1.)
report={'schema':'eg2-native-bounce-grid-route/1','originalExecuted':False,
 'source':{'filename':exe.name,'sha256':sha},'generatorSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
 'ranges':ranges,'dataRanges':data,
 'constants':[{'name':n,'VA':hex(va),'float32':struct.unpack('<f',pe.get_data(va-base,4))[0],
               'unit':'Native coordinate/coefficient role; no new seconds/metres assertion.'} for n,va,v in constants],
 'confirmed':{
 'callRoute':'543370 obtains per-owner motion record via5445f0.543556 calls543c10(actor motion component,record+48,raw step input,correction output).543569 calls5449e0 with same direction, correction result and record.',
 'holdFlags':'After contact call,54359c tests actor+5c1bit0 and5435a9 actor+5c2bit1; either skips normal translation branch to543bdc. Flags govern route, not a new trap duration.',
 'prestep':'Direction.X nonzero chooses offset onZ; otherwise offset onX. Center=(component integer cell+.5)*mutable axis scale. Compare offset to +/-.05 and shift neighbor by one int32, emit opposing axis sign. Unchanged cell returns zero/false.',
 'limiter':'factor20; when rawStep*20>abs(offset)-.05 and rawStep*20>0, factor=(abs(offset)-.05)/(rawStep*20)*20 using scalar float32. Query first neighbor; nonzero classifier returns scaled correction. Otherwise escape helper can cancel; failing that, query second neighbor shifted along direction sign, then return scaled correction only for nonzero kind.',
 'lookahead':'544a65 computes P+D*s where s=min(record+4,1), except f32(1e30) selects1. Floors come from runtime level table; X/Z divide by mutable scale then use native floor conversion and guarded grid lookup.',
 'classifier':'5453a0 returns1 for negative signed bytecell+4a. Else signed bytecell+48, bit0, scene lookup5f4820 and furniture lookups determine2 or0. Some furniture states2..4, per-cellflag+15 and resource+7c!=34264a participate. No mapping of kind to a human label assumed.5f4820 reads a coordinate-keyed scene table; no cell refresh write has been established.',
 'gridSearch':'Fallback544e07 scans backwards relative to direction sign, preserving current axis cell, until first classifier other than1, missing cell, or nine probed neighbors. A run still kind1 at the limit clears hold flags. Invalid row/column/floor/pointer branches do not invent solid cells.',
 'coordinates':'544f7e..545125 computes midpoint and terminal center with mutable cellX/Z scale, floor int32 values, offsets. Xmid=.5*(terminalXcenter+lastXcenter)-D.x*.1; Zmid=.5*(lastZ+1+terminalZ)*scaleZ-D.z*.1. Heights -.5*floor-.005 and -floor-.01. Without prestep correction, cross-axis returns current actor position.',
 'dispatch':'Class2 branch sets5c2bit1, clears5c1bit0 and saves terminal or midpoint by terminal classification. Without previous5c1bit0, it emits TrapBouncePosition ID4a28681e toward conditional current/midpoint target. Class1 branch543ef0 can produce a dynamic escape target; otherwise sets5c1bit0, clears5c2bit1 and saves midpoint.',
 'gridScale':'5a71c0 reads namespace212de4f7/group2666f252, float property hashes8b99f777/cdd5fd96/d4aba755. Writes a1e608/a1e60c/a1e610; Y negated. Image and missing-config defaults1,-1,1 do not establish selected map scale.',
 'port':'native-grid-transport.js translates only the closed prestep arithmetic/probe route and boundary arithmetic. Native classifier and escape callbacks are required inputs. Not integrated into Arena.'},
 'unresolved':['Selected configuration resource, final live grid scale and floor/cell contents.','Cell classification provider: scene refresh, furniture and native level population.','Socket/escape provider and resource174 value for the selected collision.','Actual motion record flags/step input and concrete object transform binding.','Native timeline progress and eligibility of BounceOff in the original client.','Original-client execution and five-device chain equivalence.'],
 'nextRoute':'Decode the configuration group and the native level/cell reader; supply actual classification and ownership before integrating the source port.'}
(HERE/'evidence/native-bounce-grid-route.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'codeWindows':len(ranges),'dataWindows':len(data),'originalExecuted':False}))
