// Static source port, not an execution of Asura or an Arena integration.
// Inputs are the component fields AFTER actor/controller updates. In particular,
// predicate5cfa60 is not an enemy-presence test. Scene and entry effects are external.
// Byte evidence: evidence/native-grid-config-route.json; earlier clock/pointer
// evidence: native-rules-research.json. Numeric states deliberately have no phase names.
const f=Math.fround;
const word=value=>{if(!Number.isInteger(value)||value<0||value>65535)throw Error('Native uint16 required');return value;};
const uint=value=>{if(!Number.isInteger(value)||value<0||value>0xffffffff)throw Error('Native uint32 required');return value;};
const byte=value=>{if(!Number.isInteger(value)||value<0||value>255)throw Error('Native byte required');return value;};
const bool=value=>{if(typeof value!=='boolean')throw Error('Explicit native boolean required');return value;};
// Preserve float32 infinities/NaN, including COMISS unordered -> JBE (no expiry).
const scalar=value=>{if(typeof value!=='number')throw Error('Native float required');return f(value);};
export const NATIVE_TRAP_DEFAULT_THRESHOLD=f(1e30);

//619ba0: missing FNTR is checked before the jump table, including states8/9.
export function nativeTrapThreshold(state,fntrFields,count374){
 word(state);
 if(fntrFields===null)return NATIVE_TRAP_DEFAULT_THRESHOLD;
 const field={2:'0x160',3:'0x158',4:'0x164',5:'0x15c',6:'0x168'}[state];
 if(field)return scalar(fntrFields[field]);
 if(state===8)return uint(count374)===0?f(.1):f(1);
 if(state===9)return f(5);
 return NATIVE_TRAP_DEFAULT_THRESHOLD;
}

//619af0: FNTR flags are actual bytes, not inferred animation/eligibility labels.
export function nativeTrapNext(state,predicate5cfa60,fntrFlags){
 word(state);const p=bool(predicate5cfa60);
 switch(state){
  case 0:case 1:case 5:case 6:case 9:return Number(p);
  case 2:return p?3:4;
  case 3:return 4;
  case 4:return fntrFlags!==null&&byte(fntrFlags['0x18c'])!==0?7:5;
  case 8:return fntrFlags!==null&&byte(fntrFlags['0x18f'])!==0?1:2;
  default:return 1;
 }
}

//613d90..613e4c: one decision per call. The caller supplies the real clock/stamp,
// actor-updated state, count3e4, and custom-controller virtual30/38 result.
// This function does NOT implement earlier6175b0/617820 nor618240 side effects.
export function nativeTrapStateDecision({state332,timestamp334,clock,
 globalAvailable,controllerNextState,predicate5cfa60,count3e4,count374,fntrFields,fntrFlags}){
 const state=word(state332),stamp=scalar(timestamp334);
 if(!bool(globalAvailable))return {stateBefore:state,requestedState:state,timestampBefore:stamp,clockForCommit:null,changed:false,reason:'global-guard',threshold:null};
 const now=scalar(clock);
 let next=state,threshold=null,reason='hold';
 if(controllerNextState!==null){next=word(controllerNextState);reason='controller';}
 else{
  const p=bool(predicate5cfa60);
  if(state===3&&(!p||uint(count3e4)!==0)){
   next=nativeTrapNext(state,p,fntrFlags);reason='state3-early';
  }else{
   threshold=nativeTrapThreshold(state,fntrFields,count374);
   // Original subtracts duration from clock, then compares with timestamp.
   // (clock - timestamp) > duration is NOT an equivalent float32 operation.
   if(f(now-threshold)>stamp){next=nativeTrapNext(state,p,fntrFlags);reason='expired';}
   else if(state===0&&p){next=1;reason='predicate';}
   else if(state===1&&!p){next=0;reason='predicate';}
  }
 }
 const changed=next!==state;
 // This is the requested state, NOT the final state after618240. Entry into1
 // calls618080 and may immediately enter9 or take61ad00; success bypasses the
 // outer timestamp write. Normal6185c8 uses CURRENT clock, without overshoot.
 return {stateBefore:state,requestedState:next,timestampBefore:stamp,clockForCommit:changed?now:null,changed,reason,threshold};
}

//613000 tests two distinct masks: component+b8/c8..dc THEN+28/38..4c.
// These are sensor/controller masks, not the FNTR footprint queried by5d2ff0.
function maskContains(mask,cell){
 const {min,max,words}=mask;
 if(!Array.isArray(min)||!Array.isArray(max)||min.length!==3||max.length!==3)throw Error('Native mask bounds required');
 for(const value of [...min,...max])if(!Number.isInteger(value)||value< -2147483648||value>2147483647)throw Error('Int32 mask bounds required');
 if(min[0]>max[0]||min[1]>max[1])return false;
 if(cell[0]<min[0]||cell[0]>max[0]||cell[1]!==min[1]||cell[2]<min[2]||cell[2]>max[2])return false;
 const index=(Math.imul((max[0]-min[0]+1)|0,(cell[2]-min[2])|0)-min[0]+cell[0])>>>0;
 if(!Array.isArray(words)||(index>>>5)>=words.length)throw Error('Native mask word missing; do not infer membership');
 return ((uint(words[index>>>5])>>>(index&31))&1)!==0;
}
export function nativeTrapPositionTest({cell,maskb8,mask28}){
 if(!Array.isArray(cell)||cell.length!==3||cell.some(x=>!Number.isInteger(x)||x< -2147483648||x>2147483647))throw Error('Native int32 actor cell required');
 return maskContains(maskb8,cell)&&maskContains(mask28,cell);
}
