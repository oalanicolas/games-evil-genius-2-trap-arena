import {createRequire} from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const {chromium}=createRequire(import.meta.url)('playwright');
const out=process.env.EG2_NATIVE_QA_OUT||'/tmp/eg2-native-motion-qa-20261002';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:process.env.QA_HEADED!=='1',args:['--use-angle=metal','--ignore-gpu-blocklist']});
const context=await browser.newContext({viewport:{width:1440,height:1000},recordVideo:{dir:path.join(out,'video'),size:{width:1440,height:1000}}});
const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
try{
 await page.goto('http://127.0.0.1:8766/native-motion.html');await page.waitForFunction(()=>window.EG2NativeMotion?.ready);
 const math=await page.evaluate(async()=>{
  const {sampleTrack,nativeLocalPose,quantizedClipTime}=await import('./native-player.js');
  const t={rotationTimes:[0,1],rotations:[[0,0,0,1],[0,0,1,0]],positionTimes:[0,1],positionDeltas:[[0,0,0],[0,0,4]]};
  const q=sampleTrack(t,.25).q,expected=Math.sqrt(.625);
  const staticQ=sampleTrack({...t,rotationTimes:[0],rotations:[[0,0,0,.99999]]},0).q;
  const bind={translation:[1,2,3],rotation:[0,0,Math.SQRT1_2,Math.SQRT1_2]};
  const absolute=nativeLocalPose(t,{flags:0,duration:1},bind,0),relative=nativeLocalPose(t,{flags:0x600,duration:1},bind,0);
  const translated={...t,positionTimes:[0],positionDeltas:[[0,0,2]]},unitBind={translation:[0,0,1],rotation:[0,0,0,1]};
  const absoluteScaled=nativeLocalPose({...translated,nativeBoneLengthScalar:2},{flags:0,duration:1},unitBind,0);
  const threshold=nativeLocalPose({...translated,nativeBoneLengthScalar:Math.fround(.01)},{flags:0,duration:1},unitBind,0);
  const below=nativeLocalPose({...translated,nativeBoneLengthScalar:.001},{flags:0x200,duration:1},unitBind,0);
  return {shortArcNlerp:Math.abs(q.z-.25/expected)<1e-12&&Math.abs(q.w-.75/expected)<1e-12,
   retargetAbsoluteBeforeFlags:absoluteScaled.p.z===1,retargetStrictNativeThreshold:threshold.p.z===2&&below.p.z===3,
   staticNotNormalized:staticQ.w===.99999,absolutePreserved:absolute.p.length()===0&&absolute.q.w===1,
   relativeBind:relative.p.toArray().every((v,i)=>v===bind.translation[i])&&relative.q.z===Math.SQRT1_2,
   timeTiesEven:quantizedClipTime({duration:65535},2.5)===2&&quantizedClipTime({duration:65535},3.5)===4};
 });
 const index=JSON.parse(fs.readFileSync(new URL('animation-data/index.json',import.meta.url))),results=[];
 for(const entry of index.clips){
  const result=await page.evaluate(async name=>{await EG2NativeMotion.select(name);const first=EG2NativeMotion.sample(0),clip=await fetch(document.querySelector('#clip').value).then(r=>r.json());const mid=EG2NativeMotion.sample(clip.duration*.37),last=EG2NativeMotion.sample(clip.duration);return {name,mapped:first.mapped,nativeTracks:first.nativeTracks,bones:first.bones,unmapped:first.unmapped,finite:[first,mid,last].every(d=>[...d.localPositions,...d.localRotations].flat().every(Number.isFinite)),animated:JSON.stringify(first.localPositions)!==JSON.stringify(mid.localPositions)||JSON.stringify(first.localRotations)!==JSON.stringify(mid.localRotations)};},entry.name);
  results.push(result);
 }
 const shown=['Investigator_walk_revolvers_01','Trap_GloveOnSpring_Mount_01','Trap_Bubble_Blower_Mount_01','Trap_SlipperySoap_Mount_01','Giant_Fan_Mount_01','Trap_Laser_Mount_A_01'];
 for(const name of shown){await page.evaluate(async name=>{await EG2NativeMotion.select(name);EG2NativeMotion.play(true);},name);await page.waitForTimeout(1250);await page.screenshot({path:path.join(out,name+'.png')});}
 await page.evaluate(async()=>{await EG2NativeMotion.select('Investigator_walk_revolvers_01');EG2NativeMotion.sample(.2);});
 const before=await page.evaluate(()=>EG2NativeMotion.snapshot());await page.waitForTimeout(150);const after=await page.evaluate(()=>EG2NativeMotion.snapshot());
 const checks={...math,all52Clips:results.length===52,finiteNativePoses:results.every(r=>r.finite),allDeviceNamesMapped:results.filter(r=>r.nativeTracks<=9).every(r=>r.mapped===r.nativeTracks),paused:JSON.stringify(before)===JSON.stringify(after),noErrors:errors.length===0};
 const renderer=await page.evaluate(()=>EG2NativeMotion.renderer());
 await page.evaluate(async()=>{await EG2NativeMotion.select('Trap_SlipperySoap_Loop_A_01');});
 const sourceRefs=await page.evaluate(()=>EG2NativeMotion.sourceReferences());
 checks.nativePhaseAssociation=sourceRefs.length>0&&sourceRefs.every(r=>r.record==='SoapTrap'&&r.group===0&&r.phase==='loop')&&sourceRefs.some(r=>r.slot===0);
 const selectors=await page.evaluate(async()=>{
  const {selectNativeTrapBindings:select}=await import('./native-trpa-selector.js'),data=await fetch('evidence/native-trap-animation-data.json').then(r=>r.json());
  const run=opts=>select(data,{family:'BoxingGlove',actorIndex:0,phaseKeys:['0x06343c19','0x0032c6a4','0x10d5604b','0xffffffff'],...opts});
  const glove=run({}),outside=run({actorIndex:25}),missingGroup=run({secondaryRequested:true});
  const own=data.records.find(r=>r.name==='SoapTrap').parsed.objectId;
  const soap=run({family:'SoapTrap',alternateUID:own}),soapSecondary=run({family:'SoapTrap',alternateUID:own,secondaryRequested:true});
  const laser=data.records.find(r=>r.name==='LaserWall').parsed.objectId;
  const stopped=run({alternateUID:laser,stopFlagInput:true});
  const valid=glove.bindings['0x06343c19'];
  return {nativeIndexRange:outside.trace.every(t=>!t.applied)&&outside.lastResource===null,
   nativePrimarySelection:valid.source.uid==='0x671ef5dd'&&valid.source.slot===0&&valid.clips[0].name==='Trap_GloveOnSpring_Mount_A_01',
   nativeSecondaryAbsent:missingGroup.trace.length===2&&!missingGroup.trace[1].applied&&missingGroup.bindings['0x06343c19'].hash===valid.hash,
   nativeAlternateSelection:soap.bindings['0x0032c6a4'].clips[0].name==='Trap_SlipperySoap_Loop_A_01'&&soap.bindings['0x0032c6a4'].source.uid===own,
   nativeSecondarySelection:soapSecondary.bindings['0x0032c6a4'].clips[0].name==='Trap_SlipperySoap_MovementLoop_A_01'&&soapSecondary.bindings['0x0032c6a4'].source.group===1,
   nativeStopOverride:stopped.trace.length===1&&stopped.trace[0].stopOverride,
   nativeMissingPhaseZero:glove.bindings['0xffffffff'].hash==='0x00000000'&&glove.bindings['0xffffffff'].source.uid==='0x671ef5dd'};
 });Object.assign(checks,selectors);
 await page.getByText('Consultar a seleção original de clipes',{exact:true}).click();
 await page.locator('#native-family').selectOption('SoapTrap');await page.locator('#native-alternate').check();await page.locator('#native-secondary').check();await page.locator('#native-phase').selectOption('0x0032c6a4');await page.locator('#native-apply').click();
 await page.waitForFunction(()=>document.querySelector('#native-result').textContent.includes('Trap_SlipperySoap_MovementLoop_A_01'));
 checks.nativeSelectorUI=await page.locator('#clip option:checked').textContent()==='Trap_SlipperySoap_MovementLoop_A_01';
 await page.setViewportSize({width:390,height:1000});await page.screenshot({path:path.join(out,'mobile.png'),fullPage:true});
 checks.noMobileOverflow=await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth);
 const receipt={schema:'eg2-native-motion-qa/1',scope:'Native sample reproduction in Three.js; not original-client equivalence or full-chain proof',renderer,checks,results,errors};fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify(receipt,null,2));
 console.log(JSON.stringify({renderer,checks,errors}));if(Object.values(checks).some(v=>!v))process.exitCode=1;
}finally{await context.close();await page.video().saveAs(path.join(out,'native-clips.webm'));await browser.close();}
