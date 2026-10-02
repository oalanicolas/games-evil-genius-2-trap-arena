import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {nativeTrapThreshold,nativeTrapNext,nativeTrapStateDecision,nativeTrapPositionTest,NATIVE_TRAP_DEFAULT_THRESHOLD} from './native-trap-state.js';
import {nativeClassifyCell} from './native-grid-transport.js';
const f=Math.fround,sha=path=>crypto.createHash('sha256').update(fs.readFileSync(new URL(path,import.meta.url))).digest('hex');
let checks=0;const check=(v,message)=>{assert(v,message);checks++;};
const route=JSON.parse(fs.readFileSync(new URL('./evidence/native-grid-config-route.json',import.meta.url)));
const expected={FanTrap:[.5,4.5,.5,50,30],BoxingGlove:[3,0,1.533,40,30],BubbleBlower:[.5,2,1.333,50,30],SoapTrap:[.5,2.5,1,40,30],LaserWall:[0,5,.5,40,30]};
const advanceF32=value=>{const b=new ArrayBuffer(4),v=new DataView(b);v.setFloat32(0,value,true);v.setUint32(0,v.getUint32(0,true)+1,true);return v.getFloat32(0,true);};
const flags={'0x18c':0,'0x18f':0}; // Explicit fixture;18c producer still unknown.
const inputs={state332:2,timestamp334:0,clock:0,globalAvailable:true,controllerNextState:null,predicate5cfa60:true,count3e4:0,count374:0,fntrFields:null,fntrFlags:flags};
for(const config of route.trapConfigs){
 const thresholds=expected[config.name];
 for(let index=0;index<thresholds.length;index++){
  const state=index+2,d=thresholds[index],threshold=nativeTrapThreshold(state,config.fields,0);
  check(threshold===f(d),config.name+' native threshold enum'+state);
  const equal=nativeTrapStateDecision({...inputs,state332:state,clock:threshold,fntrFields:config.fields});
  check(!equal.changed&&equal.reason==='hold','exact threshold never expires '+config.name+'/'+state);
  const next=nativeTrapStateDecision({...inputs,state332:state,clock:advanceF32(threshold),fntrFields:config.fields});
  check(next.changed&&next.reason==='expired'&&next.clockForCommit===advanceF32(threshold),'first positive float32 after threshold expires '+config.name+'/'+state);
 }
 check(config.flag18c===null,'no fabricated flag18c from serialized neighbouring fields');
 const source=fs.readFileSync(new URL('../../'+config.source.extracted_file,import.meta.url));
 check(config.flag18f.raw===source[config.bodyAnchor+330]&&config.flag18f.value===Number(source[config.bodyAnchor+330]!==0),'native serialized18f source bytes');
}
// Exact native subtract order: nonzero stamp exposes a real rounding difference.
const glove=route.trapConfigs.find(r=>r.name==='BoxingGlove');
const roundedClock=f(128+f(1.533));
check(f(roundedClock-128)>glove.fields['0x164'],'fixture would expire with the wrong elapsed-time subtraction');
let decision=nativeTrapStateDecision({...inputs,state332:4,timestamp334:128,clock:roundedClock,fntrFields:glove.fields});
check(!decision.changed,'clock minus duration rounds to stamp, preserving native JBE');
decision=nativeTrapStateDecision({...inputs,state332:4,timestamp334:128,clock:advanceF32(roundedClock),fntrFields:glove.fields});
check(decision.changed&&decision.requestedState===5,'next float32 clock exceeds stamp in native subtraction order');
for(const state of [0,1,7,10,65535])check(nativeTrapThreshold(state,glove.fields,0)===NATIVE_TRAP_DEFAULT_THRESHOLD,'default for non-threshold enum'+state);
for(const state of [2,3,4,5,6,8,9])check(nativeTrapThreshold(state,null,0)===NATIVE_TRAP_DEFAULT_THRESHOLD,'missing resource guard precedes dispatch'+state);
check(nativeTrapThreshold(8,glove.fields,0)===f(.1),'state8 empty count');
check(nativeTrapThreshold(8,glove.fields,1)===1&&nativeTrapThreshold(8,glove.fields,0xffffffff)===1,'state8 nonempty count');
check(nativeTrapThreshold(9,glove.fields,0)===5,'state9 constant');
const tableFalse=[0,0,4,4,5,0,0,1,2,0],tableTrue=[1,1,3,4,5,1,1,1,2,1];
for(let state=0;state<10;state++){
 check(nativeTrapNext(state,false,flags)===tableFalse[state],'false predicate native jump table');
 check(nativeTrapNext(state,true,flags)===tableTrue[state],'true predicate native jump table');
}
check(nativeTrapNext(4,true,{'0x18c':255,'0x18f':0})===7,'nonzero18c selects7');
check(nativeTrapNext(8,true,{'0x18c':0,'0x18f':255})===1,'nonzero18f selects1');
check(nativeTrapNext(4,true,null)===5&&nativeTrapNext(8,true,null)===2,'missing FNTR next-state branch');
check(nativeTrapNext(65535,false,null)===1,'out of range fallback');
for(const v of [{predicate5cfa60:false,count3e4:0},{predicate5cfa60:true,count3e4:1},{predicate5cfa60:true,count3e4:0xffffffff}]){
 decision=nativeTrapStateDecision({...inputs,state332:3,timestamp334:100,clock:100,fntrFields:glove.fields,...v});
 check(decision.requestedState===4&&decision.reason==='state3-early'&&decision.threshold===null,'state3 early guard skips duration');
}
decision=nativeTrapStateDecision({...inputs,state332:2,clock:100,fntrFields:glove.fields});
check(decision.requestedState===3&&decision.clockForCommit===100,'single decision does not consume later thresholds or carry overshoot');
decision=nativeTrapStateDecision({...inputs,state332:0,clock:0});
check(decision.requestedState===1&&decision.reason==='predicate'&&decision.stateBefore===0,'initial predicate switch is a REQUEST, entry side effects not executed');
decision=nativeTrapStateDecision({...inputs,state332:1,predicate5cfa60:false});
check(decision.requestedState===0,'predicate disables state1 without expiry');
decision=nativeTrapStateDecision({...inputs,state332:1});
check(!decision.changed&&decision.clockForCommit===null,'same state does not reset stamp');
decision=nativeTrapStateDecision({...inputs,globalAvailable:false,predicate5cfa60:null,clock:null});
check(!decision.changed&&decision.reason==='global-guard','global guard skips controller/predicate/clock inputs');
decision=nativeTrapStateDecision({...inputs,controllerNextState:8,predicate5cfa60:null});
check(decision.requestedState===8&&decision.reason==='controller'&&decision.threshold===null,'controller overrides base decision');
decision=nativeTrapStateDecision({...inputs,state332:8,controllerNextState:8,timestamp334:19});
check(!decision.changed&&decision.timestampBefore===19&&decision.clockForCommit===null,'controller same-state guard');
for(const v of [NaN,Infinity]){
 decision=nativeTrapStateDecision({...inputs,clock:v,fntrFields:{...glove.fields,'0x160':v}});
 check(!decision.changed,'unordered subtract/comparison does not expire');
}
// Mask fixtures: native intersection, same floor, word31/32 boundary and no
// radius fallback. These are explicit inputs, not recovered scene membership.
const wide={min:[-10,2,-3],max:[29,2,-2],words:[0x80000001,1,1]};
const selective={...wide,words:[0x80000000,1,0]};
for(let z=-4;z<=-1;z++)for(let x=-11;x<=30;x++)for(const floor of [1,2,3]){
 const index=(z+3)*40+x+10;
 const member=floor===2&&z>=-3&&z<=-2&&x>=-10&&x<=29&&[31,32].includes(index);
 check(nativeTrapPositionTest({cell:[x,floor,z],maskb8:wide,mask28:selective})===member,'cell mask intersection across signed bounds and word boundary');
}
check(!nativeTrapPositionTest({cell:[-11,2,-3],maskb8:wide,mask28:null}),'first mask rejects before touching second');
check(!nativeTrapPositionTest({cell:[0,0,0],maskb8:{min:[1,0,0],max:[0,0,0],words:[]},mask28:null}),'inverted mask bounds reject');
for(const input of [{cell:[-10,2,-3],maskb8:{...wide,words:[]},mask28:wide},{cell:[.5,2,-3],maskb8:wide,mask28:wide}]){assert.throws(()=>nativeTrapPositionTest(input));checks++;}
// Source pointer join: actual classifier's component78 state is the trap enum.
// Explicit fixtures at state2..5 prove the dependency, not scene integration.
for(const state of [1,2,3,4,5,6,8,9]){
 const result=nativeClassifyCell({cell:{flags4a:4,flags48:128,coordinates:[0,0,0],ownerID:1,floorID:0},resolveFloor:()=>null,ownerMapLookup:()=>{},lookupOwner:()=>({component78:{state332:state},componenta0:null}),queryFootprint:()=>({flag15:1})});
 check(result.kind===([2,3,4].includes(state)?2:0),'source state332 conditions active fan footprint');
}
for(const action of [()=>nativeTrapThreshold(65536,glove.fields,0),()=>nativeTrapNext(4,true,{'0x18c':null}),()=>nativeTrapStateDecision({...inputs,predicate5cfa60:1}),()=>nativeTrapThreshold(2,{},0)]){assert.throws(action);checks++;}
const report={schema:'eg2-native-trap-state-qa/1',checks,allPassed:true,originalExecuted:false,arenaIntegrated:false,
 sourceRouteSha256:sha('./evidence/native-grid-config-route.json'),codeSha256:sha('./native-trap-state.js'),testSha256:sha('./test-native-trap-state.mjs'),
 scope:'Conditional source decision and two-mask position test with explicit native field fixtures. No actor selection, entry effects, masks/clock live binding or original execution.',
 remaining:['FNTR18c producer','Sensor mask/actor collection producers','615210 eligibility and616d80 selection','618240 nested state entry effects','Live scene and simulation clock binding','Complete original five-device chain']};
fs.writeFileSync(new URL('./evidence/native-trap-state-qa.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
