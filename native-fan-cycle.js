import {NativeRig} from './native-player.js';

// Native mesh, skin and HCAN poses; event-to-phase scheduling is reconstructed.
// One visual cycle after a reconstructed hit. This is not the Asura controller.
export class NativeFanCycle {
 constructor(rig,clips,cloneModel){
  this.clips=clips;
  for(const [phase,clip] of Object.entries(clips)){
   if(clip.boneCount!==rig.bones.length||!Number.isFinite(clip.duration)||clip.duration<=0)
    throw Error('Invalid native fan clip '+phase);
   if(clip.tracks.some(t=>t.boneName&&!rig.bones.some(b=>b.name.toLowerCase()===t.boneName.toLowerCase())))
    throw Error('Unmapped native fan bone '+phase);
  }
  this.rig=new NativeRig(rig.bones,{trap_fan:rig},cloneModel);
  this.root=this.rig.root;
  this.sample(0,-99,true);
 }
 sample(time,fired,enabled){
  const elapsed=time-fired,{mount,loop,dismount}=this.clips;
  let phase='idle',clip=dismount,clipTime=dismount.duration;
  if(enabled&&fired>=0&&elapsed>=0){
   if(elapsed<mount.duration){phase='mount';clip=mount;clipTime=elapsed;}
   else if(elapsed<mount.duration+loop.duration){phase='loop';clip=loop;clipTime=elapsed-mount.duration;}
   else if(elapsed<mount.duration+loop.duration+dismount.duration){phase='dismount';clip=dismount;clipTime=elapsed-mount.duration-loop.duration;}
  }
  this.rig.play(clip,clipTime);
  this.last={phase,clipTime,sourceSha256:clip.sourceSha256,
   poseOrigin:'extracted-native-clip',
   schedulingOrigin:'reconstructed one visual cycle after hit; native durations, unverified event binding',
   nativeControllerExecuted:false};
 }
 diagnostics(){return {...this.rig.diagnostics(),...this.last};}
 dispose(){this.rig.dispose();}
}
