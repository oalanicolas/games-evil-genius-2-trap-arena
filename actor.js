import * as THREE from 'three';

export {nativeEightWeights} from './native-skinning.js';
import {nativeEightWeights} from './native-skinning.js';
import {applyNativeClipPose} from './native-player.js';
import {attachInvestigatorRevolvers} from './native-weapon-attachments.js';

/** Extracted walk and reaction loop poses; event scheduling/world motion reconstructed. */
export class Investigator {
 constructor(rig,cloneModel,walkClip,reactionClips){
  if(!walkClip?.tracks?.length)throw Error("Native investigator walk clip is required");
  this.nativeBones=rig.bones;this.walkClip=walkClip;this.reactionClips=reactionClips;
  this.root=new THREE.Group();this.pose=new THREE.Group();this.root.add(this.pose);
  this.bones=rig.bones.map(b=>{const bone=new THREE.Bone();bone.name=b.name;bone.position.set(b.translation[0],-b.translation[1],b.translation[2]);bone.quaternion.set(-b.rotation[0],b.rotation[1],-b.rotation[2],b.rotation[3]).normalize();return bone;});
  rig.bones.forEach((b,i)=>{if(b.parent===null)this.pose.add(this.bones[i]);else this.bones[b.parent].add(this.bones[i]);});
  this.rest=this.bones.map(b=>({position:b.position.clone(),rotation:b.quaternion.clone()}));
  this.joints=Object.fromEntries(this.bones.map((b,i)=>[b.name,i]));
  this.skeleton=new THREE.Skeleton(this.bones);this.pose.updateMatrixWorld(true);this.skeleton.calculateInverses();
  this.meshes=[];
  // The investigator body already contains a hat. Adding counteragent hair intersected it.
  for(const name of ['ma_bodyhands_investigator','ma_head_white01']){
   const native=cloneModel(name),skin=rig.models[name];
   const indices=[],extraIndices=[],weights=[],extraWeights=[];
   for(let i=0;i<skin.vertices;i++){indices.push(...skin.indices.slice(i*8,i*8+4));extraIndices.push(...skin.indices.slice(i*8+4,i*8+8));weights.push(...skin.weights.slice(i*8,i*8+4).map(w=>w/255));extraWeights.push(...skin.weights.slice(i*8+4,i*8+8).map(w=>w/255));}
   for(const part of native.children){const geo=part.geometry.clone();geo.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(indices,4));geo.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));geo.setAttribute('skinIndexExtra',new THREE.Uint16BufferAttribute(extraIndices,4));geo.setAttribute('skinWeightExtra',new THREE.Float32BufferAttribute(extraWeights,4));
    const mesh=new THREE.SkinnedMesh(geo,nativeEightWeights(part.material.clone()));mesh.customDepthMaterial=nativeEightWeights(new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking}));mesh.castShadow=true;mesh.receiveShadow=true;mesh.frustumCulled=false;this.pose.add(mesh);mesh.bind(this.skeleton,new THREE.Matrix4());this.meshes.push(mesh);
   }
  }
  this.weapons=attachInvestigatorRevolvers(this.bones,cloneModel);
  this.root.rotation.y=Math.PI/2;this.phase=0;this.mode='walk';this.lastFootOffset=0;this.transitionTime=-1;
 }
 animate(agent,time){
  if(this.mode!==agent.state){this.transitionTime=time;this.previousPose=this.bones.map(b=>b.quaternion.clone());this.previousBonePositions=this.bones.map(b=>b.position.clone());this.previousRotation=this.pose.quaternion.clone();this.previousPosition=this.pose.position.clone();}
  this.previousMode=this.mode;this.mode=agent.state;
  this.bones.forEach((b,i)=>{b.position.copy(this.rest[i].position);b.quaternion.copy(this.rest[i].rotation);});
  this.pose.position.set(0,0,0);this.pose.rotation.set(0,0,0);
  const type=agent.state==='walk'?null:agent.hits.at(-1);
  const reaction=type?this.reactionClips[type]:null;
  const clip=reaction?.clip||this.walkClip;
  const elapsed=agent.state==='walk'?agent.walkTime:Math.max(0,time-agent.stateStart);
  const clipTime=elapsed%clip.duration;
  this.activeClip=clip;this.activeReaction=reaction?.binding||null;
  this.nativeSample=applyNativeClipPose(this.bones,this.nativeBones,clip,clipTime);
  this.phase=clipTime/clip.duration*Math.PI*2;
  // Bypass Three.js slerp after the transition: it normalizes even at t=1.
  // Preserve original static quaternion values and signs once blending ends.
  if(this.previousPose&&time-this.transitionTime<.18){const raw=THREE.MathUtils.clamp((time-this.transitionTime)/.18,0,1),blend=raw*raw*(3-2*raw);this.bones.forEach((b,i)=>{b.quaternion.copy(this.previousPose[i].clone().slerp(b.quaternion,blend));b.position.lerpVectors(this.previousBonePositions[i],b.position.clone(),blend);});this.pose.quaternion.copy(this.previousRotation.clone().slerp(this.pose.quaternion,blend));this.pose.position.lerpVectors(this.previousPosition,this.pose.position.clone(),blend);}
  this.pose.updateMatrixWorld(true);this.skeleton.update();
  // Extracted bone translations already carry the walking pose; no authored foot lift.
  this.lastFootOffset=0;
  this.root.updateMatrixWorld(true);this.skeleton.update();
 }
 diagnostics(){return {mode:this.mode,phase:this.phase,bones:this.bones.length,skinnedMeshes:this.meshes.length,
  weapons:this.weapons.map(({bone,object})=>({bone,localPosition:object.position.toArray(),localRotation:object.quaternion.toArray(),scale:object.scale.toArray()})),
  animationOrigin:'extracted-native-clip',nativeClip:this.activeClip?.name||null,nativeSourceSha256:this.activeClip?.sourceSha256||null,nativeSample:this.nativeSample,reactionBinding:this.activeReaction,
  localPositions:this.bones.map(b=>b.position.toArray()),localRotations:this.bones.map(b=>b.quaternion.toArray()),
  leftHip:this.bones[this.joints.bn_L_upLeg].quaternion.toArray(),rightHip:this.bones[this.joints.bn_R_upLeg].quaternion.toArray(),footOffset:this.lastFootOffset};}
 dispose(){for(const mesh of this.meshes){mesh.geometry.dispose();mesh.material.dispose();mesh.customDepthMaterial.dispose();}this.skeleton.dispose();}
}
