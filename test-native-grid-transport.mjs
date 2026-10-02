import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {nativePrestep,nativeBoundaryCoordinates,nativeApplyTypeFlags,nativeClassifyCellPrefix,nativeClassifyCell,nativeFootprintQuery} from './native-grid-transport.js';
const f=Math.fround;let checks=0;const check=(value,message)=>{assert(value,message);checks++;};
// Expected observations use the independently decoded native constants and
// source branch distinctions, never the authored Arena velocities/durations.
const common={position:[.5,0,.5],direction:[1,0,0],cell:[0,0,0],cellSize:[1,1],stepScale:.01,escapeCell:()=>false};
let v=nativePrestep({...common,classifyCell:()=>2});check(!v.found&&v.probes.length===0,'cell center skips lookup');
v=nativePrestep({...common,position:[.5,0,.55],classifyCell:()=>1});check(v.found&&v.vector[2]<0,'float32.55-.5 exceeds native.05; no epsilon was added');
v=nativePrestep({...common,position:[.5,0,.75],classifyCell:()=>2});check(v.found&&v.vector[2]===-20,'large offset uses native20 limit');
v=nativePrestep({...common,position:[.5,0,.5625],stepScale:.01,classifyCell:()=>1});check(v.vector[2]===f(-1.25),'step limiter preserves independently evaluated native float32 ratio');
v=nativePrestep({...common,position:[.5,0,.25],classifyCell:()=>1});check(v.vector[2]===20&&v.probes[0].cell[2]===-1,'negative cross-axis offset probes opposite neighbor');
v=nativePrestep({...common,position:[.75,0,.5],direction:[0,0,1],classifyCell:()=>1});check(v.vector[0]===-20&&v.vector[2]===0,'Z direction centers X');
v=nativePrestep({...common,position:[.5,0,.75],classifyCell:at=>at[0]===1?2:0});check(v.found&&v.probes.length===2&&v.probes[1].cell[0]===1,'empty first probe follows direction for second probe');
v=nativePrestep({...common,position:[.5,0,.75],classifyCell:()=>0,escapeCell:()=>true});check(!v.found&&v.probes.length===1,'successful escape helper cancels correction');
v=nativePrestep({...common,position:[.5,0,.75],classifyCell:()=>null});check(!v.found&&v.probes.length===2&&v.vector.every(x=>x===0),'missing cells do not gain arbitrary solidity');
v=nativePrestep({...common,position:[.5,0,.75],classifyCell:()=>null,escapeCell:()=>{throw Error('Missing cell must not call furniture helper');}});check(!v.found,'null pointer guard skips native escape lookup');
v=nativePrestep({...common,position:[.5,0,.75],stepScale:0,classifyCell:()=>1});check(v.vector[2]===-20,'zero step preserves source coefficient; actual caller multiplies time elsewhere');
const base={position:[.75,0,.625],direction:[1,0,0],cellSize:[1,1],lastCell:[0,0,0],terminalCell:[-1,0,0],floorLevelRaw:0,pinnedFloorLevelRaw:0,crossCorrectionActive:false};
let b=nativeBoundaryCoordinates(base);check(b.midpoint[0]===f(-.1)&&b.midpoint[2]===f(.625),'boundary midpoint and preserved cross-axis');
check(b.midpoint[1]===f(-.005)&&b.terminalCenter[1]===f(-.01),'distinct native height offsets');
b=nativeBoundaryCoordinates({...base,direction:[0,0,-1],crossCorrectionActive:true,lastCell:[0,2,2],terminalCell:[0,2,3],floorLevelRaw:4,pinnedFloorLevelRaw:4});check(b.midpoint[2]===f(3.1)&&b.midpoint[1]===f(-2.005)&&b.terminalCenter[1]===f(-4.01),'floor conversion and Z direction');
b=nativeBoundaryCoordinates({...base,cellSize:[2,4],crossCorrectionActive:true});check(b.midpoint[0]===f(-.1)&&b.midpoint[2]===2,'explicit supplied grid scales');
b=nativeBoundaryCoordinates({...base,floorLevelRaw:null,pinnedFloorLevelRaw:null});check(b.midpoint[1]===0&&b.terminalCenter[1]===0,'missing floor record uses source zero branch');
for(const input of [{...common,cellSize:[0,1],classifyCell:()=>1},{...common,position:[NaN,0,0],classifyCell:()=>1},{...common,position:[.5,0,.75],classifyCell:()=>3}]){assert.throws(()=>nativePrestep(input));checks++;}
const cellTable=JSON.parse(fs.readFileSync(new URL('./evidence/native-cell-types.json',import.meta.url)));
for(const record of cellTable.extracted.records){
 const flags=nativeApplyTypeFlags(4,{resource96:Number(record.resource96.value),resource98:Number(record.resource98.value)});
 check(flags===record.constructedCellFlags4a,'all59 source-derived primary type flags');
 const classified=nativeClassifyCellPrefix({flags4a:flags,flags48:0});
 check(classified.kind===record.classifierWithConstructorFlags48&&!classified.requiresScene,'all59 constructor baseline classes');
}
for(let old=0;old<256;old++){
 for(let bits=0;bits<4;bits++)check(nativeApplyTypeFlags(old,{resource96:(bits>>1)&1,resource98:bits&1})===(old%64)+bits*64,'preserve other six bits for all byte states');
 check(nativeApplyTypeFlags(old,null)===old%64,'missing primary clears bits6/7');
}
check(nativeClassifyCellPrefix({flags4a:132,flags48:129}).kind===1,'class1 precedes occupied class2');
check(nativeClassifyCellPrefix({flags4a:4,flags48:129}).kind===2,'occupied bit0 class2');
check(nativeClassifyCellPrefix({flags4a:4,flags48:128}).requiresScene,'unresolved scene branch never silently classified');
check(nativeClassifyCellPrefix({flags4a:68,flags48:0}).kind===0,'bit6 alone is not class1');
for(const action of [()=>nativeApplyTypeFlags(-1,null),()=>nativeApplyTypeFlags(4,{resource96:NaN,resource98:0}),()=>nativeClassifyCellPrefix({flags4a:4,flags48:256})]){assert.throws(action);checks++;}
const footprintTable=JSON.parse(fs.readFileSync(new URL('./evidence/native-footprints.json',import.meta.url)));
for(const trap of footprintTable.records){
 const records=trap.parsed.cells;
 // Fixture dimensions are explicit; source coordinate extents are not proof
 // of any particular placed object's origin, orientation or overrides.
 const dimensions=[Math.max(...records.map(c=>c.planarX.value))+1,Math.max(...records.map(c=>c.planarY.value))+1];
 for(const delta of [[1,0],[0,1],[-1,0],[0,-1]]){
  for(let row=0;row<dimensions[1];row++)for(let col=0;col<dimensions[0];col++){
   const origin=[20,3,30];
   const targetCell=[20+col*delta[0]-row*delta[1],3,30-col*delta[1]-row*delta[0]];
   const selected=nativeFootprintQuery({origin,planarDelta:delta,dimensions,resourceDimensionsMatch:true,records,targetCell});
   check(selected===records[row*dimensions[0]+col],'52 source records at four explicit cardinal fixture layouts');
  }
 }
 check(nativeFootprintQuery({origin:[20,3,30],planarDelta:[1,0],dimensions,resourceDimensionsMatch:false,records,targetCell:[20,3,30]})===null,'native resource dimensions mismatch rejects metadata pointer');
 check(nativeFootprintQuery({origin:[20,3,30],planarDelta:[1,0],dimensions,resourceDimensionsMatch:true,records,targetCell:[20,4,30]})===null,'different floor rejects footprint lookup');
}
check(nativeFootprintQuery({origin:[2147483647,0,0],planarDelta:[1,0],dimensions:[2,1],resourceDimensionsMatch:true,records:['a','b'],targetCell:[-2147483648,0,0]})==='b','native int32 planar wrap');
check(nativeFootprintQuery({origin:[0,0,0],planarDelta:[1,0],dimensions:[2,1],resourceDimensionsMatch:true,records:[],targetCell:[1,0,0]})===null,'record index beyond serialized count rejects pointer');
for(const dimensions of [[0,1],[65535,2]]){assert.throws(()=>nativeFootprintQuery({origin:[0,0,0],planarDelta:[1,0],dimensions,resourceDimensionsMatch:true,records:[],targetCell:[0,0,0]}));checks++;}
const contactCell={flags4a:4,flags48:128,ownerID:17,floorID:2,coordinates:[20,2,30]};
const noScene=()=>{throw Error('Native prefix must not touch scene');};
check(nativeClassifyCell({cell:{flags4a:132,flags48:129},resolveFloor:noScene,ownerMapLookup:noScene,lookupOwner:noScene,queryFootprint:noScene}).kind===1,'full classifier primary type precedence');
check(nativeClassifyCell({cell:{flags4a:4,flags48:0}}).kind===0,'full classifier empty prefix needs no scene');
check(nativeClassifyCell({cell:contactCell}).requiresScene,'unbound scene is still unresolved');
for(const trap of footprintTable.records)for(const state of [1,2,3,4,5,65535]){
 const owner={component78:{state332:state},componenta0:null};let queries=0;
 const classified=nativeClassifyCell({cell:contactCell,resolveFloor:()=>null,ownerMapLookup:noScene,
  lookupOwner:(id,include)=>{assert.equal(id,17);assert.equal(include,true);return owner;},
  queryFootprint:(object,coordinates,mode)=>{queries++;assert.equal(mode,3);assert.equal(object,owner);assert.deepEqual(coordinates,contactCell.coordinates);return {flag15:trap.parsed.cells[0].flags['0x15'].value};}});
 check(classified.kind===((state>=2&&state<=4&&trap.name==='FanTrap')?2:0),'source flag15 and guarded native states across five devices');
 check(queries===(state>=2&&state<=4?1:0),'uint16 guard skips footprint query outside states2..4');
}
for(const type of [0,0x34264a,0xffffffff])check(nativeClassifyCell({cell:contactCell,resolveFloor:()=>null,ownerMapLookup:noScene,lookupOwner:()=>({component78:null,componenta0:{type7c:type}}),queryFootprint:noScene}).kind===(type===0x34264a?0:2),'independent componenta0 native exclusion hash');
let ownerReads=0;const changingCell={...contactCell};
check(nativeClassifyCell({cell:changingCell,resolveFloor:()=>({}),ownerMapLookup:()=>{changingCell.flags48=0;},lookupOwner:()=>{ownerReads++;return null;},queryFootprint:noScene}).kind===0&&ownerReads===1,'reread flags after owner-map lookup skips first component branch');
ownerReads=0;
check(nativeClassifyCell({cell:contactCell,resolveFloor:()=>null,ownerMapLookup:noScene,lookupOwner:()=>{ownerReads++;return ownerReads===1?null:{component78:null,componenta0:{type7c:0}};},queryFootprint:noScene}).kind===2&&ownerReads===2,'native second owner lookup preserved');
check(nativeClassifyCell({cell:contactCell,resolveFloor:()=>null,ownerMapLookup:noScene,lookupOwner:()=>({component78:{state332:3},componenta0:null}),queryFootprint:()=>null}).kind===0,'missing footprint metadata does not become contact2');
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(new URL(p,import.meta.url))).digest('hex');
const report={schema:'eg2-native-grid-transport-qa/1',checks,allPassed:true,originalExecuted:false,arenaIntegrated:false,
 sourcePort:'Native float32 transport, primary type flags, full cell classifier and indexed footprint query. Callbacks and world inputs are not recovered scene execution.',
 codeSha256:hash('./native-grid-transport.js'),testSha256:hash('./test-native-grid-transport.mjs'),
 cellTypesSha256:hash('./evidence/native-cell-types.json'),
 footprintsSha256:hash('./evidence/native-footprints.json'),
 knownLimitations:['Classifier and footprint query ported with supplied fixtures; actual cell/owner/instance/state/clock binding unresolved.','Not native executable execution or an engine port.','Raw step coefficient has no newly proven time units.']};
fs.writeFileSync(new URL('./evidence/native-grid-transport-qa.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
