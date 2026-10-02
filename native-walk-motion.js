// Deliberately limited to this decoded linear walk. No inferred curve or tuning.
// Native velocity/retarget operations: evidence/native-animation-code.json.
export function readInvestigatorWalkMotion(clip,bindBones){
 const channel=clip.tracks.find(t=>t.role==='extra-root-motion-inferred-from-flag-0x10');
 if(clip.name!=='Investigator_walk_revolvers_01'||!channel||channel.positionTimes.length!==2||channel.positionTimes[0]!==0||channel.positionTimes[1]!==clip.duration||channel.rotations.length!==1||channel.rotations[0].some((v,i)=>v!==[0,0,0,1][i]))throw Error('Unsupported native walk channel');
 const scalars=clip.tracks.slice(0,2).map(t=>t.nativeBoneLengthScalar);
 const referenceIndex=scalars[0]<Math.fround(.1)&&scalars[0]<scalars[1]?1:0;
 const sourceScalar=scalars[referenceIndex],target=bindBones[referenceIndex];
 if(!target)throw Error('Missing native retarget reference bone');
 const retarget=sourceScalar>Math.fround(.01)?Math.hypot(...target.translation)/sourceScalar:1;
 const displacement=channel.positionDeltas[1].map((v,i)=>(v-channel.positionDeltas[0][i])*retarget);
 if(displacement[0]!==0||displacement[1]!==0||displacement[2]<=0)throw Error('Native walk is not forward linear motion');
 return {origin:'native-extra-channel-derived',sourceSha256:clip.sourceSha256,
  duration:clip.duration,referenceIndex,retarget,displacement,
  velocityLocal:displacement.map(v=>v/clip.duration),forwardSpeed:displacement[2]/clip.duration,
  worldMapping:'Native +Z forward mapped to arena +X by the existing object yaw; planar scene scale 1, no reverse/mirror/trajectory. This is reconstructed scene configuration, not verified runtime inputs.'};
}
