// Narrow source port: original543c10 centering and544f7e boundary arithmetic.
// Not integrated into Arena: actual cell/owner/instance/clock inputs must
// be bound first. Classification and footprint query are source ports.
// See evidence/native-grid-config-route.json and native-cell-types.json.
const f=Math.fround,add=(a,b)=>f(f(a)+f(b)),sub=(a,b)=>f(f(a)-f(b)),mul=(a,b)=>f(f(a)*f(b)),div=(a,b)=>f(f(a)/f(b));
const requireVector=v=>{if(!Array.isArray(v)||v.length!==3||v.some(x=>!Number.isFinite(x)))throw Error('Finite XYZ required');return v.map(f);};
const requireCell=v=>{if(!Array.isArray(v)||v.length!==3||v.some(x=>!Number.isInteger(x)||x< -2147483648||x>2147483647))throw Error('Int32 cell XYZ required');return [...v];};
const sizeCheck=v=>{if(!Array.isArray(v)||v.length!==2||v.some(x=>!Number.isFinite(x)||x<=0))throw Error('Positive native X/Z grid scales required');return v.map(f);};
const requireByte=v=>{if(!Number.isInteger(v)||v<0||v>255)throw Error('Native unsigned byte required');return v;};

//5fe100: only the primary resource supplies these two cell flag bits.
// Callers must use the source-decoded flags of the actual selected type.
export function nativeApplyTypeFlags(flags4a,primaryResource){
 const previous=requireByte(flags4a);
 if(primaryResource===null)return previous&0x3f;
 const b6=requireByte(primaryResource.resource98)&1,b7=requireByte(primaryResource.resource96)&1;
 return (previous&0x3f)|(b6<<6)|(b7<<7);
}

// Proven prefix of5453a0. Do not fabricate the remaining furniture branch.
export function nativeClassifyCellPrefix({flags4a,flags48}){
 const a=requireByte(flags4a),b=requireByte(flags48);
 if(a&128)return {kind:1,requiresScene:false};
 if(!(b&128))return {kind:0,requiresScene:false};
 if(b&1)return {kind:2,requiresScene:false};
 return {kind:null,requiresScene:true};
}

// Full5453a0 branch translation; callbacks expose actual native inputs,
// not inferred world occupancy. Repeated owner lookup/order are intentional.
export function nativeClassifyCell({cell,resolveFloor,ownerMapLookup,lookupOwner,queryFootprint}){
 const prefix=nativeClassifyCellPrefix(cell);if(!prefix.requiresScene)return prefix;
 if([resolveFloor,ownerMapLookup,lookupOwner,queryFootprint].some(fn=>typeof fn!=='function'))return prefix;
 requireCell(cell.coordinates);
 if(!Number.isInteger(cell.ownerID)||cell.ownerID<0||cell.ownerID>0xffffffff)throw Error('Native cell8c uint32 ID required');
 const floor=resolveFloor(cell.floorID);if(floor!==null)ownerMapLookup(floor,[...cell.coordinates]);
 if(requireByte(cell.flags48)&128){
  const owner=lookupOwner(cell.ownerID,true);
  if(owner!==null&&owner.component78!==null){
   const state=owner.component78.state332;
   if(!Number.isInteger(state)||state<0||state>65535)throw Error('Native component78+332 uint16 required');
   if(((state-2)&65535)<=2){
    const record=queryFootprint(owner,[...cell.coordinates],3);
    if(record!==null&&requireByte(record.flag15)!==0)return {kind:2,requiresScene:false};
   }
  }
 }
 const owner=lookupOwner(cell.ownerID,true);
 if(owner!==null&&owner.componenta0!==null){
  const type=owner.componenta0.type7c;
  if(!Number.isInteger(type)||type<0||type>0xffffffff)throw Error('Native componenta0+7c uint32 required');
  if(type!==0x34264a)return {kind:2,requiresScene:false};
 }
 return {kind:0,requiresScene:false};
}

//5d2ff0 with layout inputs produced by5d3140. Serialized planar coordinates
// are not assumed to be instance/world positions; the source uses index order.
export function nativeFootprintQuery({origin,planarDelta,dimensions,resourceDimensionsMatch,records,targetCell}){
 const start=requireCell(origin),target=requireCell(targetCell);
 if(!Array.isArray(planarDelta)||planarDelta.length!==2||planarDelta.some(x=>!Number.isInteger(x)||x< -2147483648||x>2147483647))throw Error('Native int32 planar deltas required');
 if(!Array.isArray(dimensions)||dimensions.length!==2||dimensions.some(x=>!Number.isInteger(x)||x<1||x>65535)||dimensions[0]*dimensions[1]>65535)throw Error('Nonzero native dimensions fitting the uint16 cursor required');
 if(typeof resourceDimensionsMatch!=='boolean'||!Array.isArray(records))throw Error('Native resource match and record array required');
 const [width,depth]=dimensions,[dx,dz]=planarDelta;let x=start[0],z=start[2];
 for(let index=1;index<=width*depth;index++){
  if(x===target[0]&&start[1]===target[1]&&z===target[2])return resourceDimensionsMatch?(records[index-1]??null):null;
  if(index%width===0){if(dz===0){x=start[0];z=(z-dx)|0;}else{z=start[2];x=(x-dz)|0;}}
  else{x=(x+dx)|0;z=(z-dz)|0;}
 }
 return null;
}

export function nativePrestep({position,direction,cell,cellSize,stepScale,classifyCell,escapeCell}){
 const p=requireVector(position),d=requireVector(direction),c=requireCell(cell),sizes=sizeCheck(cellSize);
 if(!Number.isFinite(stepScale)||typeof classifyCell!=='function'||typeof escapeCell!=='function')throw Error('Native provider inputs required');
 const threshold=f(.05),centerX=mul(add(f(c[0]),.5),sizes[0]),centerZ=mul(add(f(c[2]),.5),sizes[1]);
 const axis=d[0]!==0?2:0,offset=sub(p[axis],axis===2?centerZ:centerX),probe=[...c],vector=[0,0,0];
 if(offset>threshold){probe[axis]=(probe[axis]+1)|0;vector[axis]=-1;}
 else if(offset<f(-.05)){probe[axis]=(probe[axis]-1)|0;vector[axis]=1;}
 if(probe.every((v,i)=>v===c[i]))return {found:false,vector,probes:[],reason:'native-cell-unchanged'};
 const delta=sub(Math.abs(offset),threshold),scaledStep=mul(stepScale,20);
 let factor=f(20);if(scaledStep>delta&&scaledStep>0)factor=mul(div(delta,scaledStep),20);
 const probes=[];
 function kind(at){const value=classifyCell([...at]);if(value!==null&&![0,1,2].includes(value))throw Error('Native classifier kind0/1/2 or null required');probes.push({cell:[...at],kind:value});return value;}
 const success=()=>({found:true,vector:vector.map(v=>mul(v,factor)),probes,factor,reason:'native-nonzero-cell'});
 const firstKind=kind(probe);if(firstKind)return success();
 if(firstKind!==null&&escapeCell([...probe],[...d]))return {found:false,vector:[0,0,0],probes,reason:'native-escape-helper-succeeded'};
 const second=[...probe];const alongAxis=d[0]!==0?0:2;second[alongAxis]=(second[alongAxis]+(d[alongAxis]>0?1:-1))|0;
 if(kind(second))return success();
 return {found:false,vector:[0,0,0],probes,reason:'native-no-classified-cell'};
}

export function nativeBoundaryCoordinates({position,direction,cellSize,lastCell,terminalCell,floorLevelRaw,pinnedFloorLevelRaw,crossCorrectionActive}){
 const p=requireVector(position),d=requireVector(direction),sizes=sizeCheck(cellSize),last=requireCell(lastCell),terminal=requireCell(terminalCell);
 for(const v of [floorLevelRaw,pinnedFloorLevelRaw])if(v!==null&&(!Number.isInteger(v)||v< -2147483648||v>2147483647))throw Error('Native int32 floor value or missing required');
 if(typeof crossCorrectionActive!=='boolean')throw Error('Native prestep result required');
 const lastX=mul(add(f(last[0]),.5),sizes[0]);
 const terminalX=mul(add(f(terminal[0]),.5),sizes[0]);
 const terminalZ=mul(add(f(terminal[2]),.5),sizes[1]);
 const midX=sub(mul(add(terminalX,lastX),.5),mul(d[0],.1));
 const midZ=sub(mul(mul(add(add(f(last[2]),1),f(terminal[2])),sizes[1]),.5),mul(d[2],.1));
 const midY= floorLevelRaw===null?f(0):sub(mul(f(floorLevelRaw),-.5),.005);
 const pinnedY=pinnedFloorLevelRaw===null?f(0):sub(f(-f(pinnedFloorLevelRaw)),.01);
 const midpoint=[midX,midY,midZ],terminalCenter=[terminalX,pinnedY,terminalZ];
 if(!crossCorrectionActive){const axis=d[0]!==0?2:0;midpoint[axis]=p[axis];terminalCenter[axis]=p[axis];}
 return {midpoint,terminalCenter,source:'native544f7e..545125',scope:'Native arithmetic only; does not classify cells, generate traps, select phase or establish live grid/owner binding.'};
}
