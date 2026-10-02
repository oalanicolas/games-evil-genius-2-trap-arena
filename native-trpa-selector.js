// Reconstruction of the binding operations at 0x14075ba90 / 0x14075be50.
// Inputs must be supplied explicitly; their producers are still being traced.
export function selectNativeTrapBindings(data, {family, actorIndex, phaseKeys,
 secondaryRequested=false, stopFlagInput=false, alternateUID=null}) {
 if(!Number.isInteger(actorIndex)||actorIndex<0||actorIndex>0xffffffff)
  throw new RangeError('actorIndex must be a native unsigned 32-bit value');
 const furniture=data.records.find(r=>r.name===family);
 if(!furniture)throw new Error('Unknown furniture '+family);
 const resources=new Map([...data.records,...data.linkedRecords].map(r=>[r.parsed.objectId,r]));
 const primaryUID=furniture.FNTRreference.objectId;
 const bindings=new Map(phaseKeys.map(hash=>[hash,{hash:'0x00000000',clips:[],source:null}]));
 const trace=[];let stopOverride=false,actorFlags=null,lastResource=null;
 function apply(uid,secondary,overwriteZero,flagInput) {
  const record=resources.get(uid),groupIndex=secondary?1:0;
  const group=record?.parsed.groups[groupIndex];
  if(!group||actorIndex>=25){trace.push({uid,group:groupIndex,applied:false,reason:!group?'resource/group absent':'index outside native range'});return;}
  const slot=group.slots[actorIndex],flags=group.tail.boolBytes;
  stopOverride=!!(flags[1]||(flagInput&&flags[3]));
  actorFlags={plus733:flags[0],plus734:flags[2]};lastResource=uid;
  const writes=[];
  for(const phaseHash of phaseKeys){
   const entry=slot.entries.find(p=>p.phaseHash===phaseHash),ref=entry?.clipReferences[0];
   const value=ref?.hash||'0x00000000';
   if(overwriteZero||value!=='0x00000000'){
    const source={uid,record:record.name,group:groupIndex,slot:actorIndex,phaseHash,
     offset:ref?.offset??null,resourceSha256:record.source.sha256};
    bindings.set(phaseHash,{hash:value,clips:ref?.clips||[],source});writes.push(phaseHash);
   }
  }
  trace.push({uid,group:groupIndex,slot:actorIndex,applied:true,overwriteZero,stopOverride,writes});
 }
 apply(primaryUID,false,true,stopFlagInput);
 if(secondaryRequested&&!stopOverride)apply(primaryUID,true,true,stopFlagInput);
 if(alternateUID&&alternateUID!=='0x00000000'&&alternateUID!==primaryUID&&!stopOverride)
  apply(alternateUID,secondaryRequested,false,false);
 return {bindings:Object.fromEntries(bindings),trace,actorFlags,lastResource,
  provenance:'Native selection operations reconstructed in JavaScript; supplied actor/interaction values are inspection inputs, not observed original runtime values.'};
}
