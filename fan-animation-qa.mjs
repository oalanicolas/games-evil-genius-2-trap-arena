import {createRequire} from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const {chromium}=createRequire(import.meta.url)('playwright');
const out=process.env.EG2_FAN_QA_OUT||'/tmp/eg2-fan-native-cycle';
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:process.env.QA_HEADED!=='1',args:['--use-angle=metal','--ignore-gpu-blocklist']});
const context=await browser.newContext({viewport:{width:1440,height:1000},recordVideo:{dir:path.join(out,'after-video'),size:{width:1440,height:1000}}});
const page=await context.newPage(),bank=await context.newPage(),errors=[],samples=[];
for(const p of [page,bank]){p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});}
try{
 await Promise.all([page.goto('http://127.0.0.1:8766/'),bank.goto('http://127.0.0.1:8766/native-motion.html')]);
 await Promise.all([page.waitForFunction(()=>window.EG2Arena?.ready),bank.waitForFunction(()=>window.EG2NativeMotion?.ready)]);
 await page.getByRole('button',{name:'Montagem inicial',exact:true}).click();
 await page.getByRole('button',{name:'Restaurar câmera',exact:true}).click();
 await page.evaluate(()=>{EG2Arena.reset();document.querySelector('#pause').click();});
 async function inspect(label,phase){
  const actual=await page.evaluate(()=>{EG2Arena.render();return EG2Arena.deviceDiagnostics[0];});
  const expected=await bank.evaluate(async({clip,time})=>{await EG2NativeMotion.select(clip);return EG2NativeMotion.sample(time);},{clip:actual.clip,time:actual.clipTime});
  const difference=(a,b)=>Math.max(...a.flat().map((v,i)=>Math.abs(v-b.flat()[i])));
  const positionError=difference(actual.localPositions,expected.localPositions),rotationError=difference(actual.localRotations,expected.localRotations);
  samples.push({label,actual,checks:{phase:actual.phase===phase,positions:positionError<1e-10,rotations:rotationError<1e-10,sevenMapped:actual.mapped===7&&actual.bones===7,finite:actual.localPositions.flat().concat(actual.localRotations.flat()).every(Number.isFinite),source:actual.poseOrigin==='extracted-native-clip'&&actual.nativeControllerExecuted===false},positionError,rotationError});
  await page.screenshot({path:path.join(out,label+'-arena.png')});
  await bank.screenshot({path:path.join(out,label+'-source-bench.png')});
 }
 await inspect('01-idle','idle');
 // Inside the room, facing the incoming spawn. This is a declared QA layout,
 // not an original layout or a measurement of the native sensor.
 await page.evaluate(()=>{for(let i=0;i<5;i++)EG2Arena.setDevice(i,{enabled:false});EG2Arena.setDevice(0,{enabled:true,x:-10,z:0,angle:Math.PI});EG2Arena.spawn();});
 async function advance(seconds){await page.evaluate(s=>{document.querySelector('#pause').click();EG2Arena.advance(s);document.querySelector('#pause').click();},seconds);}
 await advance(.3);await inspect('02-mount','mount');
 await advance(.6);await inspect('03-mount-late','mount');
 await advance(.6);await inspect('04-loop','loop');
 const before=await page.evaluate(()=>JSON.stringify(EG2Arena.deviceDiagnostics));
 await page.waitForTimeout(150);
 const pause=await page.evaluate(()=>JSON.stringify(EG2Arena.deviceDiagnostics))===before;
 await advance(.7);await inspect('05-dismount','dismount');
 await advance(.8);await inspect('06-idle-after','idle');
 await page.evaluate(()=>EG2Arena.spawn());await advance(.1);
 const retrigger=await page.evaluate(()=>EG2Arena.deviceDiagnostics[0].phase==='mount'&&EG2Arena.snapshot().events.length===2);
 await page.evaluate(()=>EG2Arena.setDevice(0,{enabled:false}));await inspect('07-disabled','idle');
 await page.evaluate(()=>{EG2Arena.reset();EG2Arena.setDevice(0,{enabled:true});document.querySelector('#pause').click();});
 const reset=await page.evaluate(()=>EG2Arena.deviceDiagnostics[0].phase==='idle'&&EG2Arena.snapshot().events.length===0);
 await page.evaluate(()=>{EG2Arena.spawn();document.querySelector('#pause').click();});
 await page.waitForTimeout(3300);await page.getByRole('button',{name:'Pausar',exact:true}).click();
 const checks={nativeSamples:samples.every(s=>Object.values(s.checks).every(Boolean)),pause,retrigger,reset,noErrors:errors.length===0};
 const report={schema:'eg2-native-fan-cycle-qa/1',originalClientExecuted:false,scope:'Native fan pose application versus extracted-clip bench; phase event/timing binding and fan impulse remain reconstructed.',renderer:await page.evaluate(()=>EG2Arena.renderer),checks,samples,errors};
 fs.writeFileSync(path.join(out,'fan-cycle.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify({renderer:report.renderer,checks,samples:samples.map(({label,checks,positionError,rotationError})=>({label,checks,positionError,rotationError})),errors}));
 if(!Object.values(checks).every(Boolean))process.exitCode=1;
}finally{await context.close();await page.video().saveAs(path.join(out,'after-native-cycle.webm'));await browser.close();}
