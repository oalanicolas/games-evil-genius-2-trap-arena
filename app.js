import * as THREE from 'three';
import {GLTFLoader} from './vendor/three/examples/jsm/loaders/GLTFLoader.js';
import {OrbitControls} from './vendor/three/examples/jsm/controls/OrbitControls.js';
import {decodeMSADPCM} from './vendor/msadpcm.js';
import {Arena} from './simulation.js';
import {Investigator} from './actor.js';
import {readInvestigatorWalkMotion} from './native-walk-motion.js';
import {arenaReactionBindings} from './native-reaction-bindings.js';
import {NativeFanCycle} from './native-fan-cycle.js';

const $=s=>document.querySelector(s), url=p=>'/library/'+p;
const descriptions={fan:'Impulso que inicia o percurso.',glove:'Lança o agente para a próxima armadilha.',bubble:'Suspende o alvo dentro de uma bolha.',slip:'Derruba o alvo e prolonga o deslocamento.',laser:'Feixe transversal que encerra a cadeia.'};
const [rules,manifest,actorRig]=await Promise.all(['rules.json','asset-manifest.json','actor-rig.json'].map(p=>fetch(p).then(r=>{if(!r.ok)throw Error(p);return r.json();})));
const animationIndex=await fetch('animation-data/index.json').then(r=>{if(!r.ok)throw Error('Native animation index');return r.json();});
const walkEntry=animationIndex.clips.find(c=>c.name==='Investigator_walk_revolvers_01');
if(!walkEntry)throw Error('Missing extracted investigator walk');
const walkClip=await fetch(walkEntry.path).then(r=>{if(!r.ok)throw Error('Native investigator walk');return r.json();});
const walkMotion=readInvestigatorWalkMotion(walkClip,actorRig.bones);
const deviceRigs=await fetch('device-rigs.json').then(r=>{if(!r.ok)throw Error('Native device rigs');return r.json();});
const fanClips=Object.fromEntries(await Promise.all(['mount','loop','dismount'].map(async phase=>{
 const name='Giant_Fan_'+phase[0].toUpperCase()+phase.slice(1)+'_01';
 const entry=animationIndex.clips.find(c=>c.name===name);
 if(!entry)throw Error('Missing extracted fan clip '+name);
 const clip=await fetch(entry.path).then(r=>{if(!r.ok)throw Error(entry.path);return r.json();});
 return [phase,clip];
})));
const reactionTable=await fetch('evidence/native-trap-animation-data.json').then(r=>{if(!r.ok)throw Error('Native TRPA bindings');return r.json();});
const reactionBindings=arenaReactionBindings(reactionTable);
const reactionClips=Object.fromEntries(await Promise.all(Object.entries(reactionBindings).map(async([type,binding])=>{
 const entry=animationIndex.clips.find(c=>c.name===binding.clipName);
 if(!entry)throw Error('Missing extracted reaction '+binding.clipName);
 const clip=await fetch(entry.path).then(r=>{if(!r.ok)throw Error(entry.path);return r.json();});
 return [type,{clip,binding}];
})));
const arena=new Arena(rules,walkMotion), templates=new Map(),textures=new Map(), deviceViews=[], agentViews=new Map();
let selected=0,placing=false,audioEnabled=false,audioContext,lastEvent=0,flashUntil=0,followAgent=false;
const soundBuffers=new Map(),scene=new THREE.Scene();scene.background=new THREE.Color('#364347');
const viewport=$('#viewport'), renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});
renderer.localClippingEnabled=true;
renderer.setPixelRatio(window.devicePixelRatio);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
viewport.prepend(renderer.domElement);
const camera=new THREE.PerspectiveCamera(38,1,.1,150),controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;controls.minDistance=3;controls.maxDistance=60;controls.maxPolarAngle=Math.PI*.47;
function restoreCamera(){followAgent=false;camera.position.set(11,18,22);controls.target.set(0,.6,0);controls.update();}
restoreCamera();
scene.add(new THREE.HemisphereLight('#ecf3e2','#63706c',2.2));
const sun=new THREE.DirectionalLight('#fff5d9',3.2);sun.position.set(-6,20,10);sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-20,right:20,top:15,bottom:-15,near:1,far:60});sun.shadow.bias=-.0003;sun.shadow.normalBias=.03;scene.add(sun);
const fill=new THREE.DirectionalLight('#bbdce0',1.1);fill.position.set(5,8,-12);scene.add(fill);
const room=new THREE.Group(),walls=new THREE.Group(),effects=new THREE.Group();scene.add(room,walls,effects);
const gltfLoader=new GLTFLoader(),textureLoader=new THREE.TextureLoader();
const solid=(colour,roughness=.6)=>new THREE.MeshStandardMaterial({color:colour,roughness});
const orange=solid('#bc5929'), dark=solid('#253234'), mint=solid('#a4bf98');
function box(w,h,d,material,x,y,z,parent=room){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function loadTexture(path,colour){const key=path+colour;if(!textures.has(key))textures.set(key,textureLoader.loadAsync(url(path)).then(t=>{t.flipY=false;t.colorSpace=colour?THREE.SRGBColorSpace:THREE.NoColorSpace;t.anisotropy=renderer.capabilities.getMaxAnisotropy();return t;}));return textures.get(key);}
async function loadModel(name){
 const spec=manifest.models[name],gltf=await gltfLoader.loadAsync(url(spec.glb));let original;
 gltf.scene.traverse(o=>{if(o.isMesh)original=o;});
 if(!original)throw Error('Sem malha: '+name);
 const group=new THREE.Group();group.name=name;
 for(const s of spec.submeshes){
   const geometry=original.geometry.clone();geometry.clearGroups();
   geometry.setIndex(Array.from(original.geometry.index.array.slice(s.startIndex,s.startIndex+s.indexCount)));
   // EG2 furniture uses negative Y above the floor. Convert explicitly, preserving UVs.
   geometry.scale(1,-1,1);
   const colour=s.maps.colour,normal=s.maps.normal;
   const mat=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.48,metalness:.08,side:THREE.DoubleSide});
   if(colour)mat.map=await loadTexture(colour.preview,true);
   if(normal){mat.normalMap=await loadTexture(normal.preview,false);mat.normalScale.set(.7,-.7);}
   const cname=colour?.name.toLowerCase()||'';
   if(cname.includes('decals')){mat.transparent=true;mat.alphaTest=.1;mat.depthWrite=false;mat.polygonOffset=true;mat.polygonOffsetFactor=-1;}
   if(cname.includes('glass')){mat.color.set('#aed5d4');mat.transparent=true;mat.opacity=.3;mat.roughness=.12;mat.depthWrite=false;}
   if(cname.includes('glow')){mat.emissive.set('#d5a144');mat.emissiveIntensity=.7;}
   const mesh=new THREE.Mesh(geometry,mat);mesh.name='submesh-'+s.submesh;mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.submesh=s.submesh;group.add(mesh);
 }
 // Fan active pose is authored around its moving hinge, rather than the room floor.
 // Active fan includes an underground box and an embedded floor patch. Its floor is Y=0.
 if(name==='trap_fan_active'){
   const head=group.children.find(m=>m.userData.submesh===0);head.geometry.computeBoundingBox();head.position.y=-head.geometry.boundingBox.min.y;
   group.children.find(m=>m.userData.submesh===2).position.y=.008;
 }
 if(['trap_gloveonspring','trap_bubble_blower'].includes(name)){
   // Native casing geometry is split into left/right leaves; opening motion is authored.
   for(const mesh of [...group.children]){
     if(![3,4].includes(mesh.userData.submesh)&&!(name==='trap_bubble_blower'&&mesh.userData.submesh===2))continue;
     const p=mesh.geometry.attributes.position,index=mesh.geometry.index.array;
     for(const side of [-1,1]){const selected=[];for(let i=0;i<index.length;i+=3){const x=(p.getX(index[i])+p.getX(index[i+1])+p.getX(index[i+2]))/3;if((x<0?-1:1)===side)selected.push(index[i],index[i+1],index[i+2]);}
       const geometry=mesh.geometry.clone();geometry.setIndex(selected);const leaf=new THREE.Mesh(geometry,mesh.material);leaf.castShadow=true;leaf.receiveShadow=true;leaf.userData={submesh:mesh.userData.submesh,doorSide:side};leaf.position.x=side*.6;group.add(leaf);
     }group.remove(mesh);
   }
 }
 templates.set(name,group);return group;
}
function cloneModel(name){return templates.get(name).clone(true);}
function lineBetween(a,b,material,width=.03,parent=effects){const distance=a.distanceTo(b),m=new THREE.Mesh(new THREE.CylinderGeometry(width,width,distance,8),material);m.position.copy(a).lerp(b,.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),b.clone().sub(a).normalize());parent.add(m);return m;}
function buildRoom(){
 box(26,.4,8.3,dark,0,-.27,0);box(26.3,.16,.16,orange,0,-.05,4.12);box(26.3,.16,.16,orange,0,-.05,-4.12);
 const floor=cloneModel('corridor_floor_basic');floor.children.forEach(m=>{m.material=m.material.clone();m.material.roughness=.32;});
 for(let x=-12.5;x<13;x++)for(let z=-3.5;z<4;z++){const tile=floor.clone(true);tile.position.set(x,0,z);room.add(tile);}
 for(let x=-12.5;x<13;x++){const wall=cloneModel('corridor_wall_straight_mid');wall.rotation.y=Math.PI;wall.position.set(x,0,-3.5);walls.add(wall);}
 for(let z=-3.5;z<4;z++){const wall=cloneModel('corridor_wall_straight_mid');wall.rotation.y=-Math.PI/2;wall.position.set(-12.5,0,z);walls.add(wall);}
 for(const x of [-12,12]){
   box(1.1,.04,7.8,orange,x,.02,0);
   for(let z=-3.7;z<4;z+=.65){const stripe=box(.65,.01,.2,dark,x,.047,z);stripe.rotation.y=-.55;}
 }
 // Room labels are authored for the prototype; native geometry is unchanged.
 function floorLabel(text,x,z){const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#485848';ctx.font='bold 62px Arial';ctx.textAlign='center';ctx.fillText(text,256,90);const t=new THREE.CanvasTexture(c);const plane=new THREE.Mesh(new THREE.PlaneGeometry(4,1),new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false}));plane.rotation.x=-Math.PI/2;plane.position.set(x,.025,z);room.add(plane);}
 floorLabel('ENTRADA',-9.5,3);floorLabel('SAÍDA',9.4,3);
 for(let x=-11;x<=11;x+=5.5){const light=new THREE.PointLight('#f2deb0',4,8,2);light.position.set(x,2.8,-3.6);scene.add(light);}
}
function buildDevices(){
 deviceViews.forEach(v=>{v.userData.nativeFan?.dispose();scene.remove(v);});deviceViews.length=0;
 for(const d of arena.traps){
   const group=new THREE.Group();group.userData.device=d.id;
   if(d.type==='fan'){
     group.userData.nativeFan=new NativeFanCycle(deviceRigs.devices.trap_fan,fanClips,cloneModel);
     // Presentation only: the native housing extends below the floor. The thin
     // authored room has no terrain to occlude it; do not move native poses.
     const ground=new THREE.Plane(new THREE.Vector3(0,1,0),0);
     group.userData.nativeFan.root.traverse(o=>{
       if(!o.isMesh)return;
       for(const material of [o.material,o.customDepthMaterial,o.customDistanceMaterial].flat().filter(Boolean)){
         material.clippingPlanes=[ground];material.clipShadows=true;
       }
     });
   }
   const model=group.userData.nativeFan?.root||cloneModel(rules.traps[d.type].model);group.add(model);group.userData.model=model;
   if(d.type==='fan'||d.type==='laser')model.rotation.y=Math.PI;
   if(d.type==='slip'){
     // Buried dispenser, with the soap surface flush to the corridor floor.
     model.position.y=.05;
     const slick=new THREE.Mesh(new THREE.CircleGeometry(1.2,48),new THREE.MeshPhysicalMaterial({color:'#b9dee2',transparent:true,opacity:.3,roughness:.03,metalness:.2,clearcoat:1,depthWrite:false}));slick.rotation.x=-Math.PI/2;slick.position.y=.035;group.add(slick);
   }
   // Wall-mounted native components keep their decoded elevation.
   if(['glove','bubble'].includes(d.type)){const plinth=box(1.75,2.8,.35,dark,0,1.4,-.12,group);box(1.82,.22,.38,orange,0,2.8,-.12,group);plinth.userData.authored=true;}
   const selection=new THREE.Group();const footprint=new THREE.Mesh(new THREE.RingGeometry(.85,1,48),new THREE.MeshBasicMaterial({color:'#efc15f',transparent:true,opacity:.85,side:THREE.DoubleSide,depthWrite:false}));footprint.rotation.x=-Math.PI/2;footprint.position.y=.055;selection.add(footprint);
   const arrow=new THREE.ArrowHelper(new THREE.Vector3(0,0,1),new THREE.Vector3(0,.08,0),2.3,'#efca65',.5,.35);selection.add(arrow);group.add(selection);group.userData.selection=selection;
   group.traverse(o=>o.userData.device=d.id);scene.add(group);deviceViews.push(group);
 }
 syncDevices();
}
function syncNativeDevices(){for(const d of arena.traps)deviceViews[d.id]?.userData.nativeFan?.sample(arena.time,d.fired,d.enabled);}
function syncDevices(){for(const d of arena.traps){const view=deviceViews[d.id];view.position.set(d.x,0,d.z);view.rotation.y=Math.PI/2-d.angle;view.userData.selection.visible=selected===d.id;view.scale.setScalar(d.enabled?1:.97);}syncNativeDevices();}
function makeBench(){
 const thumbRenderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});thumbRenderer.setSize(160,160);thumbRenderer.setPixelRatio(1);thumbRenderer.outputColorSpace=THREE.SRGBColorSpace;thumbRenderer.toneMapping=THREE.ACESFilmicToneMapping;thumbRenderer.toneMappingExposure=1.2;
 const ts=new THREE.Scene();ts.add(new THREE.HemisphereLight('#ffffff','#6a7670',3));const dl=new THREE.DirectionalLight('#fff2d0',3);dl.position.set(4,8,7);ts.add(dl);
 const tc=new THREE.PerspectiveCamera(37,1,.1,100);
 arena.traps.forEach((d,i)=>{const model=cloneModel(rules.traps[d.type].model);if(d.type==='fan'||d.type==='laser')model.rotation.y=Math.PI;ts.add(model);const bound=new THREE.Box3().setFromObject(model),center=bound.getCenter(new THREE.Vector3()),size=bound.getSize(new THREE.Vector3());const extent=Math.max(size.x,size.y,size.z);tc.position.copy(center).add(new THREE.Vector3(extent*.9,extent*.65,extent*1.6));tc.lookAt(center);thumbRenderer.render(ts,tc);const image=thumbRenderer.domElement.toDataURL();ts.remove(model);
  const card=document.createElement('button');card.className='device-card';card.dataset.device=String(i);card.setAttribute('aria-label',rules.traps[d.type].name);card.innerHTML=`<span class="number">0${i+1}</span><img alt="" src="${image}"><div><small>ARMADILHA</small><b>${rules.traps[d.type].name}</b><em id="status-${i}">Pronta</em></div>`;card.onclick=()=>selectDevice(i);$('.bench').append(card);
 });thumbRenderer.dispose();selectDevice(0);
 $('#chain-steps').innerHTML=arena.traps.map(d=>`<span class="step" data-step="${d.type}" title="${rules.traps[d.type].name}">${{fan:'VENT',glove:'LUVA',bubble:'BOLHA',slip:'PISO',laser:'LASER'}[d.type]}</span>`).join('');
}
function selectDevice(i){selected=i;placing=false;$('#move').classList.remove('active');$('#selected-name').textContent=rules.traps[arena.traps[i].type].name;$('#selected-description').textContent=descriptions[arena.traps[i].type];$('#enabled').checked=arena.traps[i].enabled;$('.bench').querySelectorAll('button').forEach((b,j)=>{b.classList.toggle('active',i===j);b.setAttribute('aria-pressed',String(i===j));});$('#editor-hint').textContent='Selecione Reposicionar e clique no piso; gire para mudar o sensor.';syncDevices();}
function updateLayout(){arena.layout=arena.traps.map(({type,x,z,angle,enabled})=>({type,x,z,angle,enabled}));syncDevices();}
function removeAgentView(v){scene.remove(v.group);scene.remove(v.health);scene.remove(v.bubble);v.actor.dispose();v.bubble.geometry.dispose();v.bubble.material.dispose();v.health.children.forEach(m=>{m.geometry.dispose();m.material.dispose();});}
function clearAgents(){for(const v of agentViews.values())removeAgentView(v);agentViews.clear();for(const fx of [...effects.children]){fx.geometry.dispose();if(fx.userData.ownMaterial)fx.material.dispose();}effects.clear();lastEvent=0;flashUntil=0;$('#flash').style.opacity='0';$('#flash').textContent='';$('#event-log').replaceChildren();}
function reset(){clearAgents();arena.reset();syncDevices();$('#pause').textContent='Pausar';updateHUD();}
function announce(text){$('#flash').textContent=text;$('#flash').style.opacity='1';flashUntil=performance.now()+1800;}
function makeAgent(a){
 const actor=new Investigator(actorRig,cloneModel,walkClip,reactionClips),group=actor.root;scene.add(group);
 const bubble=new THREE.Mesh(new THREE.SphereGeometry(1.2,40,24),new THREE.MeshPhysicalMaterial({color:'#c5eff1',transparent:true,opacity:.22,roughness:.05,metalness:.18,clearcoat:1,side:THREE.DoubleSide,depthWrite:false}));scene.add(bubble);
 const hb=new THREE.Group();const back=new THREE.Mesh(new THREE.PlaneGeometry(.9,.085),new THREE.MeshBasicMaterial({color:'#2b3029',depthTest:false}));const bar=new THREE.Mesh(new THREE.PlaneGeometry(.86,.05),new THREE.MeshBasicMaterial({color:'#b7d57c',depthTest:false}));bar.position.z=.01;hb.add(back,bar);scene.add(hb);
 const view={group,actor,bubble,health:hb,bar};agentViews.set(a.id,view);return view;
}
function drawAgents(){for(const a of arena.agents){const done=a.finished&&arena.time-a.finishedAt>2;if(done){const old=agentViews.get(a.id);if(old){removeAgentView(old);agentViews.delete(a.id);}continue;}const v=agentViews.get(a.id)||makeAgent(a);v.group.visible=a.state!=='escaped';v.health.visible=a.alive;v.bubble.visible=a.alive&&a.state==='bubble';v.group.position.set(a.x,a.y,a.z);v.group.rotation.y=Math.PI/2-Math.atan2(a.vz,a.vx);v.actor.animate(a,arena.time);
 v.bubble.position.set(a.x,a.y+1.1,a.z);v.bubble.rotation.y=arena.time*.5;v.health.position.set(a.x,a.y+2.65,a.z);v.health.quaternion.copy(camera.quaternion);v.bar.scale.x=Math.max(.001,a.hp/rules.agent.health);
}}
const windMat=new THREE.MeshBasicMaterial({color:'#d4ebea',transparent:true,opacity:.28,depthWrite:false,side:THREE.DoubleSide}),laserMat=new THREE.MeshBasicMaterial({color:'#ff6548',transparent:true,opacity:.95}),laserGlow=new THREE.MeshBasicMaterial({color:'#ffac69',transparent:true,opacity:.2,depthWrite:false});
function burst(event){const d=arena.traps.find(d=>d.type===event.trap),dir=new THREE.Vector3(Math.cos(d.angle),0,Math.sin(d.angle));
 if(d.type==='fan')for(let i=0;i<7;i++){const ring=new THREE.Mesh(new THREE.TorusGeometry(.7+i*.04,.018,6,40),windMat);ring.position.set(d.x,1.1,d.z);ring.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),dir);ring.userData={life:1.5,age:-i*.08,velocity:dir.clone().multiplyScalar(5)};effects.add(ring);}
 if(d.type==='laser')for(let y=.3;y<2.4;y+=.45){const a=new THREE.Vector3(d.x,y,d.z),b=a.clone().addScaledVector(dir,rules.traps.laser.range);const beam=lineBetween(a,b,laserMat,.025);beam.userData={life:.7,age:0};const glow=lineBetween(a,b,laserGlow,.12);glow.userData={life:.7,age:0};}
 if(d.type==='bubble'||d.type==='slip')for(let i=0;i<12;i++){const bubble=new THREE.Mesh(new THREE.SphereGeometry(.08+Math.random()*.1,12,8),new THREE.MeshBasicMaterial({color:'#d4f1ef',transparent:true,opacity:.6,depthWrite:false}));bubble.position.set(event.x+(Math.random()-.5),.25,event.z+(Math.random()-.5));bubble.userData={life:1.5,age:0,ownMaterial:true,velocity:new THREE.Vector3((Math.random()-.5)*.4,Math.random()+.2,(Math.random()-.5)*.4)};effects.add(bubble);}
 playSound(d.type);
}
function animateDevices(){syncNativeDevices();for(const d of arena.traps){const v=deviceViews[d.id],elapsed=arena.time-d.fired,model=v.userData.model;
 for(const leaf of model.children.filter(m=>m.userData.doorSide)){leaf.position.x=leaf.userData.doorSide*(.6+(elapsed>=0&&elapsed<.8?Math.sin(elapsed/.8*Math.PI)*.25:0));}
 if(d.type==='glove'){const glove=model.children.find(m=>m.userData.submesh===1);if(glove){const base=glove.userData.restZ??glove.position.z;glove.userData.restZ=base;glove.position.z=base+(elapsed>=0&&elapsed<.55?Math.sin(elapsed/.55*Math.PI)*1.7:0);}}
 if(d.type==='bubble'){model.scale.setScalar(elapsed>=0&&elapsed<.5?1+Math.sin(elapsed*8)*.035:1);}
}
 for(const fx of [...effects.children]){const u=fx.userData;u.age+=rules.step;fx.visible=u.age>=0;if(u.velocity&&u.age>=0)fx.position.addScaledVector(u.velocity,rules.step);if(u.age>u.life){effects.remove(fx);fx.geometry.dispose();if(u.ownMaterial)fx.material.dispose();}}
}
async function enableAudio(){audioContext??=new AudioContext();await audioContext.resume();audioEnabled=!audioEnabled;$('#audio').textContent=audioEnabled?'Som ligado':'Som desligado';if(audioEnabled){for(const[key,e]of Object.entries(manifest.audio)){if(soundBuffers.has(key))continue;const bytes=await fetch(url(e.path)).then(r=>r.arrayBuffer());let buffer;try{buffer=await audioContext.decodeAudioData(bytes.slice(0));}catch{const pcm=decodeMSADPCM(bytes);buffer=audioContext.createBuffer(pcm.channels.length,pcm.frames,pcm.sampleRate);pcm.channels.forEach((c,i)=>buffer.copyToChannel(c,i));}soundBuffers.set(key,buffer);}}}
function playSound(key){if(!audioEnabled||!soundBuffers.has(key))return;const src=audioContext.createBufferSource(),gain=audioContext.createGain();gain.gain.value=.28;src.buffer=soundBuffers.get(key);src.connect(gain).connect(audioContext.destination);src.start();src.stop(audioContext.currentTime+Math.min(2,src.buffer.duration));}
function updateHUD(){
 $('#wave').disabled=!!arena.wave;
 $('#health').textContent=`${arena.baseHealth} / ${rules.arena.baseHealth}`;$('#kills').textContent=String(arena.kills).padStart(2,'0');$('#chains').textContent=String(arena.chains).padStart(2,'0');
 const a=arena.agents.at(-1);$('#agent-id').textContent=a?String(a.id).padStart(2,'0'):'—';
 for(const el of $('#chain-steps').children)el.classList.toggle('hit',!!a?.hits.includes(el.dataset.step));
 const distinct=a?new Set(a.hits).size:0;
 const active=a?new Set(a.episode).size:0;
 $('#chain-result').textContent=a?`${distinct} de 5 no histórico · ${active} sem voltar a caminhar${a.state==='escaped'?' · Escapou':a.state==='defeated'?' · Neutralizado':''}`:'Aguardando agente.';
 for(const d of arena.traps){const remaining=Math.max(0,d.ready-arena.time);const el=$('#status-'+d.id);if(el)el.textContent=!d.enabled?'Desligada':remaining>0?`Recarga ${remaining.toFixed(1)}s`:'Pronta';}
 while(lastEvent<arena.events.length){const event=arena.events[lastEvent++];const li=document.createElement('li');li.textContent=`${event.time.toFixed(2)}s · agente ${event.agent} · ${rules.traps[event.trap].name}`;$('#event-log').prepend(li);burst(event);if(event.completedNow)announce('5 DISPOSITIVOS SEM VOLTAR A CAMINHAR');}
}
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),floorPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0),hit=new THREE.Vector3();let down;
renderer.domElement.addEventListener('pointerdown',e=>down=[e.clientX,e.clientY]);
renderer.domElement.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>6)return;const b=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-b.left)/b.width*2-1,-(e.clientY-b.top)/b.height*2+1);raycaster.setFromCamera(pointer,camera);
 if(placing&&raycaster.ray.intersectPlane(floorPlane,hit)){const d=arena.traps[selected];d.x=Math.max(-11,Math.min(11,Math.round(hit.x*2)/2));d.z=Math.max(-3.2,Math.min(3.2,Math.round(hit.z*2)/2));updateLayout();placing=false;$('#move').classList.remove('active');$('#editor-hint').textContent='Montagem alterada. Reinicie para comparar a nova cadeia.';announce('DISPOSITIVO REPOSICIONADO');}
 else{const intersections=raycaster.intersectObjects(deviceViews,true);if(intersections[0])selectDevice(intersections[0].object.userData.device);}
});
$('#spawn').onclick=()=>arena.spawn();$('#wave').onclick=()=>{arena.startWave();announce('ONDA INICIADA · 6 AGENTES');};
$('#pause').onclick=()=>{arena.paused=!arena.paused;$('#pause').textContent=arena.paused?'Continuar':'Pausar';};$('#reset').onclick=reset;
$('#move').onclick=()=>{placing=!placing;$('#move').classList.toggle('active',placing);$('#editor-hint').textContent=placing?'Clique no piso para colocar o dispositivo.':'Selecione uma armadilha na bancada.';};
$('#rotate').onclick=()=>{arena.traps[selected].angle+=Math.PI/4;updateLayout();};
$('#enabled').onchange=()=>{arena.traps[selected].enabled=$('#enabled').checked;updateLayout();};
$('#scenario').onchange=()=>{arena.scenario=$('#scenario').value;walls.visible=arena.scenario==='corridor';};
$('#restore').onclick=()=>{arena.setLayout(rules.layout);localStorage.removeItem('eg2-trap-arena-layout-v1');clearAgents();buildDevices();selectDevice(0);updateHUD();announce('MONTAGEM INICIAL RESTAURADA');};
$('#save').onclick=()=>{updateLayout();localStorage.setItem('eg2-trap-arena-layout-v1',JSON.stringify({layout:arena.layout,scenario:arena.scenario}));announce('MONTAGEM SALVA NESTE NAVEGADOR');};
$('#camera').onclick=restoreCamera;$('#about').onclick=()=>$('#provenance').showModal();$('#close-about').onclick=()=>$('#provenance').close();$('#audio').onclick=()=>enableAudio().catch(e=>{announce('Áudio indisponível: '+e.message);console.error(e);});
$('#follow').onclick=()=>{followAgent=!followAgent;if(followAgent){if(!arena.agents.some(a=>a.alive))arena.spawn();const a=arena.agents.at(-1);controls.target.set(a.x,1,a.z);camera.position.set(a.x+3.4,3.2,a.z+4.4);controls.update();}else restoreCamera();};
function resize(){const w=viewport.clientWidth,h=viewport.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();}new ResizeObserver(resize).observe(viewport);
window.addEventListener('keydown',e=>{if(['INPUT','SELECT','BUTTON'].includes(document.activeElement.tagName))return;if(e.code==='Space'){e.preventDefault();$('#pause').click();}if(e.key.toLowerCase()==='r')$('#rotate').click();});
try{
 await Promise.all(Object.keys(manifest.models).map(loadModel));
 const saved=JSON.parse(localStorage.getItem('eg2-trap-arena-layout-v1')||'null');
 if(saved?.layout?.length===5&&saved.layout.every((d,i)=>d.type===rules.layout[i].type&&[d.x,d.z,d.angle].every(Number.isFinite))){arena.setLayout(saved.layout);arena.scenario=saved.scenario==='open'?'open':'corridor';}
 buildRoom();walls.visible=arena.scenario==='corridor';$('#scenario').value=arena.scenario;buildDevices();makeBench();$('#loading').remove();$('#spawn').disabled=false;$('#wave').disabled=false;
 const gl=renderer.getContext(),debug=gl.getExtension('WEBGL_debug_renderer_info');
 window.EG2Arena={ready:true,origin:{assets:'extracted',simulation:'reconstruction',walking:'extracted HCAN and linear native extra-channel velocity; reconstructed world mapping and transitions',reactions:'extracted loop poses via native TRPA binding operations; reconstructed slot/alternate inputs and event scheduling',fan:'extracted floor-fan mesh, skin and three native clips; reconstructed phase scheduling after hit',originalExecution:false},rules,manifest,walkMotion,reactionBindings,snapshot:()=>arena.snapshot(),renderer:debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),
  // Explicit development API for deterministic verification; production controls remain ordinary UI.
  reset,spawn:()=>arena.spawn(),advance:s=>{arena.advance(s);updateHUD();syncNativeDevices();drawAgents();renderer.render(scene,camera);return arena.snapshot();},setDevice:(i,patch)=>{Object.assign(arena.traps[i],patch);updateLayout();},selectDevice,
  enableAudio,get audio(){return {enabled:audioEnabled,decoded:[...soundBuffers.keys()]};},render:()=>{syncNativeDevices();drawAgents();renderer.render(scene,camera);},get deviceDiagnostics(){return deviceViews.flatMap((v,id)=>v.userData.nativeFan?[{id,...v.userData.nativeFan.diagnostics()}]:[]);},get actorDiagnostics(){return [...agentViews.entries()].map(([id,v])=>({id,...v.actor.diagnostics()}));},get drawInfo(){return structuredClone(renderer.info.render);}};
 let previous=performance.now(),accumulator=0;
 function frame(now){requestAnimationFrame(frame);accumulator+=Math.min((now-previous)/1000,.1);previous=now;let changed=false;
   while(accumulator>=rules.step){arena.step();if(!arena.paused){animateDevices();changed=true;}accumulator-=rules.step;}
   if(changed)updateHUD();drawAgents();if(followAgent){const a=arena.agents.at(-1);if(a){const next=new THREE.Vector3(a.x,a.y+1,a.z),delta=next.clone().sub(controls.target);camera.position.add(delta);controls.target.copy(next);}}controls.update();if(now>flashUntil)$('#flash').style.opacity='0';renderer.render(scene,camera);
 }requestAnimationFrame(frame);
}catch(e){$('#loading').textContent='Não foi possível abrir a biblioteca: '+e.message;console.error(e);}
