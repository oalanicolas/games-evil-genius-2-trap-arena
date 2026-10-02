import * as THREE from 'three';
import {GLTFLoader} from './vendor/three/examples/jsm/loaders/GLTFLoader.js';
import {OrbitControls} from './vendor/three/examples/jsm/controls/OrbitControls.js';
import {NativeRig} from './native-player.js';
import {attachInvestigatorRevolvers} from './native-weapon-attachments.js';
import {selectNativeTrapBindings} from './native-trpa-selector.js';

const $=s=>document.querySelector(s),stage=$('#stage');
const [manifest,actor,devices,index,trpa]=await Promise.all(['asset-manifest.json','actor-rig.json','device-rigs.json','animation-data/index.json','evidence/native-trap-animation-data.json'].map(async p=>{const r=await fetch(p);if(!r.ok)throw Error(p);return r.json();}));
const nativeReferences=new Map();
for(const record of trpa.records)for(const [groupIndex,group] of record.parsed.groups.entries())for(const slot of group.slots)for(const phase of slot.entries)for(const ref of phase.clipReferences)for(const clip of ref.clips){
 if(!nativeReferences.has(clip.name))nativeReferences.set(clip.name,[]);
 nativeReferences.get(clip.name).push({record:record.name,group:groupIndex,slot:slot.slot,phase:phase.phaseNameHashMatch||phase.phaseHash,offset:ref.offset});
}
const scene=new THREE.Scene();scene.background=new THREE.Color('#344143');
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(devicePixelRatio);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;stage.append(renderer.domElement);
const camera=new THREE.PerspectiveCamera(38,1,.05,100),controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.maxPolarAngle=Math.PI*.49;
scene.add(new THREE.HemisphereLight('#ecf3e2','#63706c',2.2));const light=new THREE.DirectionalLight('#fff5d9',3.2);light.position.set(-4,10,6);light.castShadow=true;light.shadow.mapSize.set(2048,2048);Object.assign(light.shadow.camera,{left:-10,right:10,top:10,bottom:-10,near:1,far:40});light.shadow.normalBias=.02;scene.add(light);
const fill=new THREE.DirectionalLight('#bbdce0',1.1);fill.position.set(5,5,-6);scene.add(fill);
const grid=new THREE.GridHelper(20,20,'#849185','#465a50');grid.position.y=-.006;scene.add(grid);
const templates=new Map(),textureCache=new Map(),loader=new GLTFLoader(),textureLoader=new THREE.TextureLoader();
async function texture(path,colour){const key=path+colour;if(!textureCache.has(key))textureCache.set(key,textureLoader.loadAsync('/library/'+path).then(t=>{t.flipY=false;t.colorSpace=colour?THREE.SRGBColorSpace:THREE.NoColorSpace;t.anisotropy=renderer.capabilities.getMaxAnisotropy();return t;}));return textureCache.get(key);}
async function loadModel(name){
 const spec=manifest.models[name],gltf=await loader.loadAsync('/library/'+spec.glb);let original;gltf.scene.traverse(o=>{if(o.isMesh)original=o;});
 const group=new THREE.Group();
 for(const sub of spec.submeshes){
  const geo=original.geometry.clone();geo.clearGroups();geo.setIndex(Array.from(original.geometry.index.array.slice(sub.startIndex,sub.startIndex+sub.indexCount)));geo.scale(1,-1,1);
  const mat=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.48,metalness:.08,side:THREE.DoubleSide});
  if(sub.maps.colour)mat.map=await texture(sub.maps.colour.preview,true);
  if(sub.maps.normal){mat.normalMap=await texture(sub.maps.normal.preview,false);mat.normalScale.set(.7,-.7);}
  const colourName=sub.maps.colour?.name.toLowerCase()||'';
  if(colourName.includes('decals')){mat.transparent=true;mat.alphaTest=.1;mat.depthWrite=false;}
  if(colourName.includes('glass')){mat.color.set('#aed5d4');mat.transparent=true;mat.opacity=.3;mat.roughness=.12;mat.depthWrite=false;}
  if(colourName.includes('glow')){mat.emissive.set('#d5a144');mat.emissiveIntensity=.7;}
  const mesh=new THREE.Mesh(geo,mat);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);
 }
 templates.set(name,group);
}
await Promise.all(Object.keys(devices.devices).concat(['ma_bodyhands_investigator','ma_head_white01','corridor_floor_basic','ohw_ranged_pistolinvestigatorsrevolver']).map(loadModel));
const cloneModel=n=>templates.get(n).clone(true),floor=new THREE.Group();scene.add(floor);
for(let x=-5;x<=5;x++)for(let z=-5;z<=5;z++){const tile=cloneModel('corridor_floor_basic');tile.position.set(x,0,z);floor.add(tile);}
const modelForClip=clip=>clip.boneCount>9?'actor':clip.name.startsWith('Giant_Fan_')?'trap_fan':clip.name.startsWith('Trap_Glove')?'trap_gloveonspring':clip.name.startsWith('Trap_Bubble')?'trap_bubble_blower':clip.name.startsWith('Trap_Slippery')?'trap_slippery_soap':'trap_laser_wall';
const clipCache=new Map();let current,view,playing=true,time=0,previous=performance.now(),selection=0;
const entries=[...index.clips].sort((a,b)=>a.name==='Investigator_walk_revolvers_01'?-1:b.name==='Investigator_walk_revolvers_01'?1:a.name.localeCompare(b.name));
for(const entry of entries){const option=document.createElement('option');option.value=entry.path;option.textContent=entry.name;$('#clip').append(option);}
function renderAt(t){time=THREE.MathUtils.clamp(t,0,current.duration);view.play(current,time,{rootMotion:$('#motion').checked});$('#time').value=time;$('#clock').value=time.toLocaleString('pt-BR',{minimumFractionDigits:3,maximumFractionDigits:3})+' / '+current.duration.toFixed(3)+' s';controls.update();renderer.render(scene,camera);}
async function select(path){
 const token=++selection;$('#status').textContent='Lendo o clipe original…';
 if(!clipCache.has(path))clipCache.set(path,fetch(path).then(r=>r.json()));const clip=await clipCache.get(path);if(token!==selection)return;
 if(view){scene.remove(view.root);view.dispose();}current=clip;const name=modelForClip(clip);
 floor.visible=name==='actor';
 if(name==='actor')view=new NativeRig(actor.bones,actor.models,cloneModel);
 else {const rig=devices.devices[name];view=new NativeRig(rig.bones,{[name]:rig},cloneModel);}
 if(clip.name==='Investigator_walk_revolvers_01')attachInvestigatorRevolvers(view.bones,cloneModel);
 scene.add(view.root);$('#time').max=current.duration;renderAt(0);
 const bound=new THREE.Box3().setFromObject(view.root),center=bound.getCenter(new THREE.Vector3()),size=bound.getSize(new THREE.Vector3());
 const extent=Math.max(size.x,size.y,size.z,1.8);controls.target.copy(center);camera.position.copy(center).add(new THREE.Vector3(extent*1.1,extent*.65,extent*1.8));controls.update();
 const d=view.diagnostics();$('#facts').textContent=[...current.sourceNames,'SHA-256: '+current.sourceSha256,'HCAN22 · flags 0x'+current.flags.toString(16),d.mapped+' / '+current.boneCount+' trilhas mapeadas · '+d.bones+' ossos na malha','8 influências de skinning preservadas','Interpolação nlerp · composição local rastreada no original',d.unmapped.length?'Sem correspondência nesta malha: '+d.unmapped.join(', '):'Todos os nomes de osso têm correspondência','Retarget: razão nativa quando scalar > f32(0,01); fator do motor confirmado = 1','Precisão: JavaScript float64; motor usa float32'].join('\n');
 const refs=nativeReferences.get(current.name)||[],groups=new Map();
 if(current.name==='Investigator_walk_revolvers_01')$('#facts').textContent+='\nRevólver extraído nos dois ossos de arma, sem offsets. Associação inferida; regra nativa de equipamento ainda não comprovada.';
 for(const ref of refs){const key=ref.record+' · grupo '+ref.group+' · '+ref.phase;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(ref.slot);}
 if(refs.length)$('#facts').textContent+='\n\nReferências diretas nos mapas TRPA:\n'+[...groups].map(([key,slots])=>key+' · slots '+slots.join(', ')).join('\n')+'\nO seletor original usa actor+0x118 (0–24), fase por hash e sinalizador da interação. Os valores desses parâmetros no investigador ainda estão em investigação.';
 $('#status').textContent=name==='actor'?'Clipe extraído · reprodução web':'Dispositivo sem piso para mostrar também as partes enterradas';renderAt(0);
}
$('#clip').onchange=()=>select($('#clip').value);$('#time').oninput=()=>{playing=false;$('#play').textContent='Reproduzir';renderAt(Number($('#time').value));};$('#play').onclick=()=>{playing=!playing;$('#play').textContent=playing?'Pausar':'Reproduzir';};$('#restart').onclick=()=>renderAt(0);$('#motion').onchange=()=>renderAt(time);
function resize(){renderer.setSize(stage.clientWidth,stage.clientHeight);camera.aspect=stage.clientWidth/stage.clientHeight;camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(stage);resize();await select(entries[0].path);for(const id of ['clip','time','play','restart'])$('#'+id).disabled=false;
const phaseNames=new Map();
for(const record of [...trpa.records,...trpa.linkedRecords])for(const group of record.parsed.groups)for(const slot of group.slots)for(const phase of slot.entries)phaseNames.set(phase.phaseHash,phase.phaseNameHashMatch||phase.phaseHash);
function option(target,value,label){const o=document.createElement('option');o.value=value;o.textContent=label;$(target).append(o);}
for(const record of trpa.records)option('#native-family',record.name,record.name);
for(let i=0;i<25;i++)option('#native-slot',i,String(i));
for(const [hash,name]of phaseNames)option('#native-phase',hash,name);
$('#native-family').value='BoxingGlove';$('#native-phase').value='0x06343c19';
function inspectBindings(){
 const family=$('#native-family').value,record=trpa.records.find(r=>r.name===family);
 return selectNativeTrapBindings(trpa,{family,actorIndex:Number($('#native-slot').value),phaseKeys:[...phaseNames.keys()],secondaryRequested:$('#native-secondary').checked,alternateUID:$('#native-alternate').checked?record.parsed.objectId:null});
}
$('#native-apply').onclick=async()=>{
 const result=inspectBindings(),binding=result.bindings[$('#native-phase').value];
 const clip=binding.clips[0],entry=entries.find(e=>e.name===clip?.name);
 $('#native-result').textContent=[clip?clip.name:'Nenhum clipe para esta fase com esses parâmetros',binding.source?'Fonte: '+binding.source.record+' · grupo '+binding.source.group+' · índice '+binding.source.slot:'Sem mapa válido',binding.source?.offset!==null&&binding.source?'Offset serializado: '+binding.source.offset:'Hash zero / referência ausente',clip&&!entry?'Clipe identificado, mas ainda não exportado nesta bancada.':'',result.trace.map(t=>t.uid+' / grupo '+t.group+' → '+(t.applied?'aplicado':t.reason)).join('\n')].filter(Boolean).join('\n');
 if(entry){$('#clip').value=entry.path;await select(entry.path);}
};
window.EG2NativeMotion={ready:true,inspectBindings,sourceReferences:()=>nativeReferences.get(current.name)||[],select:async name=>{const e=entries.find(c=>c.name===name);if(!e)throw Error(name);$('#clip').value=e.path;await select(e.path);},sample:t=>{playing=false;renderAt(t);return view.diagnostics();},snapshot:()=>view.diagnostics(),renderer:()=>renderer.getContext().getParameter(renderer.getContext().getExtension('WEBGL_debug_renderer_info').UNMASKED_RENDERER_WEBGL),play:v=>playing=v};
function frame(now){const dt=Math.min((now-previous)/1000,.05);previous=now;if(playing)time=(time+dt)%current.duration;renderAt(time);requestAnimationFrame(frame);}requestAnimationFrame(frame);
