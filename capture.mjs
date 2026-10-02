// QA capture of the live renderer; no synthetic frame advance.
import {createRequire} from 'node:module';import fs from 'node:fs';import path from 'node:path';
const {chromium}=createRequire(import.meta.url)('playwright');
const out=process.env.EG2_QA_OUT||'/tmp/eg2-arena-qa';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:process.env.QA_HEADED!=='1',args:['--use-angle=metal','--ignore-gpu-blocklist']});
const context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1,recordVideo:{dir:path.join(out,'video'),size:{width:1440,height:1000}}});
const page=await context.newPage();
await page.goto('http://127.0.0.1:8766/');await page.waitForFunction(()=>window.EG2Arena?.ready);
await page.getByRole('button',{name:'Enviar agente',exact:true}).click();
const frames=[];
for(const [name,target] of [['fan',1.9],['glove',2.55],['bubble',3.5],['slip',6.05],['laser',8]]){
 await page.waitForFunction(t=>window.EG2Arena.snapshot().time>=t,target);
 const state=await page.evaluate(()=>EG2Arena.snapshot());frames.push({name,time:state.time,agent:state.agents[0],events:state.events});
 await page.screenshot({path:path.join(out,`motion-${name}.png`)});
}
const snapshot=await page.evaluate(()=>EG2Arena.snapshot());if(snapshot.chains!==1)throw Error('Live chain did not complete');
await page.getByRole('button',{name:'Reiniciar teste',exact:true}).click();
await page.screenshot({path:path.join(out,'03-final-arena.png')});
await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(out,'04-mobile.png'),fullPage:true});
const responsive=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,send:document.querySelector('#spawn').getBoundingClientRect().width}));
const result={schema:1,mode:'live render, no advance API',renderer:await page.evaluate(()=>EG2Arena.renderer),frames,snapshot,responsive};
fs.writeFileSync(path.join(out,'motion.json'),JSON.stringify(result,null,2));
await context.close();await page.video().saveAs(path.join(out,'chain-live.webm'));await browser.close();
console.log(JSON.stringify({liveChain:snapshot.chains,order:snapshot.agents[0].hits,responsive,frames:frames.map(f=>({name:f.name,time:f.time,state:f.agent.state}))}));
