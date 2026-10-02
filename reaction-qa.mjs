import {createRequire} from 'node:module';import fs from 'node:fs';import path from 'node:path';
const {chromium}=createRequire(import.meta.url)('playwright'),out=process.env.EG2_REACTION_QA_OUT||'/tmp/eg2-native-reaction-qa';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:process.env.QA_HEADED!=='1',args:['--use-angle=metal','--ignore-gpu-blocklist']});
const context=await browser.newContext({viewport:{width:1440,height:1000},recordVideo:{dir:path.join(out,'video'),size:{width:1440,height:1000}}}),page=await context.newPage(),bank=await context.newPage(),errors=[];
for(const p of [page,bank]){p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});}
const EG2TrapNames={fan:'Ventilador',glove:'Luva',bubble:'Bolha',slip:'Piso escorregadio',laser:'Laser'};
const EG2ArenaFamilies={fan:'FanTrap',glove:'BoxingGlove',bubble:'BubbleBlower',slip:'SoapTrap',laser:'LaserWall'};
const results=[];const states=['blown','launched','bubble','sliding','lasered'];
try{
 await Promise.all([page.goto('http://127.0.0.1:8766/'),bank.goto('http://127.0.0.1:8766/native-motion.html')]);
 await Promise.all([page.waitForFunction(()=>window.EG2Arena?.ready),bank.waitForFunction(()=>window.EG2NativeMotion?.ready)]);
 const renderer=await page.evaluate(()=>EG2Arena.renderer);
 for(const [i,type]of ['fan','glove','bubble','slip','laser'].entries()){
  await page.getByRole('button',{name:'Montagem inicial',exact:true}).click();
  await page.getByRole('button',{name:EG2TrapNames[type],exact:true}).click();
  await page.evaluate(index=>{for(let j=0;j<5;j++)EG2Arena.setDevice(j,{enabled:false});EG2Arena.setDevice(index,{enabled:true,x:EG2Arena.rules.arena.spawnX-1,z:EG2Arena.rules.arena.laneZ,angle:0});},i);
  await page.getByRole('button',{name:'Reiniciar teste',exact:true}).click();
  await page.getByRole('button',{name:'Restaurar câmera',exact:true}).click();
  await page.getByRole('button',{name:'Seguir agente',exact:true}).click();
  await page.waitForFunction(state=>{const s=EG2Arena.snapshot(),a=s.agents[0];return a?.state===state&&s.time-a.stateStart>=.35;},states[i]);
  await page.getByRole('button',{name:'Pausar',exact:true}).click();
  const arena=await page.evaluate(()=>({agent:EG2Arena.snapshot().agents[0],rig:EG2Arena.actorDiagnostics[0]}));
  const expected=await bank.evaluate(async({clip,time})=>{await EG2NativeMotion.select(clip);return EG2NativeMotion.sample(time);},{clip:arena.rig.nativeClip,time:arena.rig.nativeSample.time});
  const difference=(a,b)=>Math.max(...a.flat().map((v,j)=>Math.abs(v-b.flat()[j])));
  const positionError=difference(arena.rig.localPositions,expected.localPositions),rotationError=difference(arena.rig.localRotations,expected.localRotations);
  await page.screenshot({path:path.join(out,type+'-arena.png')});await bank.screenshot({path:path.join(out,type+'-source-bench.png')});
  const frozen=JSON.stringify(arena.rig);await page.waitForTimeout(120);const still=await page.evaluate(()=>EG2Arena.actorDiagnostics[0]);
  const checks={nativePose:arena.rig.animationOrigin==='extracted-native-clip',nativeBinding:arena.rig.reactionBinding.source.record===EG2ArenaFamilies[type]&&arena.rig.reactionBinding.source.slot===0&&arena.rig.reactionBinding.source.phaseHash==='0x0032c6a4',explicitInputOrigin:arena.rig.reactionBinding.inputOrigin.includes('reconstructed'),samePositions:positionError<1e-10,sameRotations:rotationError<1e-10,pause:JSON.stringify(still)===frozen,finitePose:arena.rig.localPositions.flat().every(Number.isFinite)&&arena.rig.localRotations.flat().every(Number.isFinite)};
  results.push({type,checks,positionError,rotationError,arena,bench:expected});
 }
 const checks={fiveReactionFamilies:results.length===5,allChecks:results.every(r=>Object.values(r.checks).every(Boolean)),noErrors:errors.length===0};
 fs.writeFileSync(path.join(out,'reactions.json'),JSON.stringify({schema:1,scope:'Arena versus extracted-clip bench with declared reconstructed slot/phase inputs; not original-client timing/physics equivalence',renderer,checks,results,errors},null,2));
 console.log(JSON.stringify({checks,families:results.map(({type,checks,positionError,rotationError})=>({type,checks,positionError,rotationError})),errors}));
 if(!Object.values(checks).every(Boolean))process.exitCode=1;
}finally{await context.close();await page.video().saveAs(path.join(out,'reactions-live.webm'));await browser.close();}
