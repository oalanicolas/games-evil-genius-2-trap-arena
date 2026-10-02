import * as THREE from 'three';
import {nativeEightWeights} from './native-skinning.js';

// Native HCAN sampler: evidence/native-animation-code.json contains the VA trace.
// Source amplitudes and native timestamps are preserved. No procedural gait.
function interval(times,time){
 let lo=0,hi=times.length-1;
 if(time<=times[0])return [0,0,0];
 if(time>=times[hi])return [hi,hi,0];
 while(hi-lo>1){const mid=(lo+hi)>>1;if(times[mid]<=time)lo=mid;else hi=mid;}
 return [lo,hi,(time-times[lo])/(times[hi]-times[lo])];
}
export function quantizedClipTime(clip,time){
 const u=THREE.MathUtils.clamp(time/clip.duration,0,1)*65535;
 const integer=Math.floor(u),fraction=u-integer;
 const rounded=fraction===.5?(integer%2?integer+1:integer):Math.round(u);
 return rounded/65535*clip.duration;
}
export function sampleTrack(track,time){
 const [a,b,k]=interval(track.rotationTimes,time),qa=track.rotations[a],qb=track.rotations[b];
 const sign=qa.reduce((v,x,i)=>v+x*qb[i],0)<0?-1:1;
 const q=new THREE.Quaternion(...qa);
 if(a!==b&&time!==0)q.set(...qa.map((x,i)=>x*(1-k)+sign*qb[i]*k)).normalize();
 const [c,d,t]=interval(track.positionTimes,time);
 const p=new THREE.Vector3(...track.positionDeltas[c]).lerp(new THREE.Vector3(...track.positionDeltas[d]),t);
 return {q,p};
}
export function nativeLocalPose(track,clip,bind,time){
 const {q,p}=sampleTrack(track,quantizedClipTime(clip,time)),bq=new THREE.Quaternion(...bind.rotation);
 const sourceLength=track.nativeBoneLengthScalar;
 // Renderer 0x1400cd285..320 scales before testing the bind-relative flags.
 if(sourceLength>Math.fround(.01))p.multiplyScalar(Math.hypot(...bind.translation)/sourceLength);
 if(clip.flags&0x200){
  if(clip.flags&0x400){q.premultiply(bq);p.applyQuaternion(bq);}
  p.add(new THREE.Vector3(...bind.translation));
 }
 return {q,p};
}

export function applyNativeClipPose(bones,bindBones,clip,time){
  const joints=new Map(bindBones.map((b,i)=>[b.name.toLowerCase(),i]));
  for(let i=0;i<bones.length;i++){
   const bone=bones[i],bind=bindBones[i];bone.position.set(bind.translation[0],-bind.translation[1],bind.translation[2]);
   bone.quaternion.set(-bind.rotation[0],bind.rotation[1],-bind.rotation[2],bind.rotation[3]).normalize();
  }
  let mapped=0;
  for(const track of clip.tracks){
   if(!track.boneName)continue;
   const index=joints.get(track.boneName.toLowerCase());if(index===undefined)continue;
   const {q,p}=nativeLocalPose(track,clip,bindBones[index],time);
   bones[index].position.set(p.x,-p.y,p.z);bones[index].quaternion.set(-q.x,q.y,-q.z,q.w);mapped++;
  }
  return {clip:clip.name,time,mapped,sourceSha256:clip.sourceSha256};
}

export class NativeRig {
 constructor(bones,models,cloneModel){
  this.nativeBones=bones;this.root=new THREE.Group();this.pose=new THREE.Group();this.root.add(this.pose);
  this.joints=new Map(bones.map((b,i)=>[b.name.toLowerCase(),i]));
  this.bones=bones.map(b=>{const bone=new THREE.Bone();bone.name=b.name;bone.position.set(b.translation[0],-b.translation[1],b.translation[2]);bone.quaternion.set(-b.rotation[0],b.rotation[1],-b.rotation[2],b.rotation[3]).normalize();return bone;});
  bones.forEach((b,i)=>{(b.parent===null?this.pose:this.bones[b.parent]).add(this.bones[i]);});
  this.pose.updateMatrixWorld(true);this.skeleton=new THREE.Skeleton(this.bones);this.skeleton.calculateInverses();this.meshes=[];
  for(const [name,skin] of Object.entries(models)){
   const native=cloneModel(name),indices=[],extraIndices=[],weights=[],extraWeights=[];
   for(let i=0;i<skin.vertices;i++){
    const j=skin.indices.slice(i*8,i*8+8),w=skin.weights.slice(i*8,i*8+8).map(v=>v/255);
    // Unreferenced zero-weight vertices are never drawn; retain the source bytes.
    indices.push(...j.slice(0,4));extraIndices.push(...j.slice(4));weights.push(...w.slice(0,4));extraWeights.push(...w.slice(4));
   }
   for(const part of native.children){
    const geo=part.geometry.clone();
    geo.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(indices,4));geo.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
    geo.setAttribute('skinIndexExtra',new THREE.Uint16BufferAttribute(extraIndices,4));geo.setAttribute('skinWeightExtra',new THREE.Float32BufferAttribute(extraWeights,4));
    const mesh=new THREE.SkinnedMesh(geo,nativeEightWeights(part.material.clone()));
    mesh.customDepthMaterial=nativeEightWeights(new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking}));
    mesh.castShadow=true;mesh.receiveShadow=true;mesh.frustumCulled=false;this.pose.add(mesh);mesh.bind(this.skeleton,new THREE.Matrix4());this.meshes.push(mesh);
   }
  }
 }
 play(clip,time,{rootMotion=false}={}){
  const {mapped}=applyNativeClipPose(this.bones,this.nativeBones,clip,time);
  this.pose.position.set(0,0,0);this.pose.quaternion.identity();
  const extra=clip.tracks.find(t=>t.role==='extra-root-motion-inferred-from-flag-0x10');
  if(rootMotion&&extra){const {q,p}=sampleTrack(extra,quantizedClipTime(clip,time));this.pose.position.set(p.x,-p.y,p.z);this.pose.quaternion.set(-q.x,q.y,-q.z,q.w);}
  this.root.updateMatrixWorld(true);this.skeleton.update();
  this.last={clip:clip.name,time,mapped,nativeTracks:clip.boneCount,rootMotion,
   rootMotionPurpose:'native source channel; world integration inferred',rendererCoordinates:'native Y reflected for Three.js',
   retargetScale:'native bone-length ratio when scalar > f32(0.01); native xmm9=1',
   numericPrecision:'JavaScript float64; native sampler float32',
   unmapped:clip.tracks.filter(t=>t.boneName&&!this.joints.has(t.boneName.toLowerCase())).map(t=>t.boneName)};
 }
 diagnostics(){return {...this.last,bones:this.bones.length,skinInfluences:8,
  localPositions:this.bones.map(b=>b.position.toArray()),localRotations:this.bones.map(b=>b.quaternion.toArray())};}
 dispose(){for(const m of this.meshes){m.geometry.dispose();m.material.dispose();m.customDepthMaterial.dispose();}this.skeleton.dispose();}
}
