import {selectNativeTrapBindings} from './native-trpa-selector.js';

const families={fan:'FanTrap',glove:'BoxingGlove',bubble:'BubbleBlower',slip:'SoapTrap',laser:'LaserWall'};
const LOOP='0x0032c6a4';
/** Source binding operations, with explicitly reconstructed arena inputs.
 * Slot 0 is the recovered constructor default, not a verified live actor value.
 * Bubble/soap need their own resource as alternate because FNTR defaults to Bees.
 * Only the loop pose is integrated here; native event scheduling remains unknown.
 */
export function arenaReactionBindings(data){
 return Object.fromEntries(Object.entries(families).map(([type,family])=>{
  const record=data.records.find(r=>r.name===family);
  const inputs={family,actorIndex:0,phaseKeys:[LOOP],secondaryRequested:false,
   stopFlagInput:false,alternateUID:record.parsed.objectId};
  const result=selectNativeTrapBindings(data,inputs),binding=result.bindings[LOOP];
  if(binding.clips.length!==1||!binding.source)throw Error('Ambiguous native reaction '+family);
  return [type,{clipName:binding.clips[0].name,source:binding.source,inputs,
   inputOrigin:'reconstructed arena configuration; constructor default slot, not observed original actor',
   phaseScheduling:'loop sampled from reconstructed hit time; mount/dismount and event scheduling not integrated'}];
 }));
}
