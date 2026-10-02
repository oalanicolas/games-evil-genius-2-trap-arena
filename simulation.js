// Reconstructed scene simulation; optional walk velocity is derived from native HCAN.
export class Arena {
  constructor(rules,walkMotion=null) { this.rules = rules; this.walkMotion=walkMotion;this.walkSpeed=walkMotion?.forwardSpeed??rules.agent.walkSpeed;this.layout = structuredClone(rules.layout); this.scenario = 'corridor'; this.reset(); }
  reset() {
    this.time=0; this.agents=[]; this.events=[]; this.paused=false; this.wave=null;
    this.baseHealth=this.rules.arena.baseHealth; this.kills=0; this.escapes=0; this.chains=0; this.nextId=1;
    this.traps=this.layout.map((d,i)=>({...d,id:i,ready:0,fired:-99}));
  }
  setLayout(layout) { this.layout=structuredClone(layout); this.reset(); }
  spawn(z=this.rules.arena.laneZ) {
    const a={id:this.nextId++,x:this.rules.arena.spawnX,z,y:0,hp:this.rules.agent.health,
      vx:this.walkSpeed,vz:0,gaitDistance:0,walkTime:0,state:'walk',until:0,stateStart:this.time,
      hits:[],contacts:[],episode:[],episodes:[],episodeCounted:false,alive:true,finished:false};
    this.agents.push(a); return a.id;
  }
  startWave() { if(!this.wave) this.wave={remaining:this.rules.wave.count,next:this.time}; }
  inSensor(d,a) {
    const r=this.rules.traps[d.type],dx=a.x-d.x,dz=a.z-d.z,dist=Math.hypot(dx,dz);
    if(dist>r.range) return false;
    const along=dx*Math.cos(d.angle)+dz*Math.sin(d.angle),across=-dx*Math.sin(d.angle)+dz*Math.cos(d.angle);
    if(d.type==='laser') return along>=0 && Math.abs(across)<r.halfBeamWidth;
    if(d.type==='slip') return true;
    return along/Math.max(dist,0.001)>r.cone;
  }
  canHit(d,a) {
    // Reconstructed contact latch, not recovered native eligibility: one fire per
    // device entry; exiting its sensor releases it. History never grants immunity.
    return d.enabled&&d.ready<=this.time&&!a.contacts.includes(d.id)&&this.inSensor(d,a);
  }
  finishEpisode(a,reason) {
    if(a.episode.length)a.episodes.push({hits:[...a.episode],end:this.time,reason});
    a.episode=[];a.episodeCounted=false;
  }
  fire(d,a) {
    const r=this.rules.traps[d.type];d.ready=this.time+r.cooldown;d.fired=this.time;
    if(a.state==='walk')this.finishEpisode(a,'walking-before-hit');
    if(!a.contacts.includes(d.id))a.contacts.push(d.id);
    a.hits.push(d.type);a.hp=Math.max(0,a.hp-r.damage);
    a.episode.push(d.type);
    const complete=new Set(a.episode).size===Object.keys(this.rules.traps).length;
    const completedNow=complete&&!a.episodeCounted;
    if(completedNow){this.chains++;a.episodeCounted=true;}
    const event={time:+this.time.toFixed(3),agent:a.id,trap:d.type,hp:a.hp,x:+a.x.toFixed(3),z:+a.z.toFixed(3),
      history:[...a.hits],chain:[...a.episode],completedNow};
    this.events.push(event);
    if(d.type==='fan'||d.type==='glove') {
      a.vx=Math.cos(d.angle)*r.speed;a.vz=Math.sin(d.angle)*r.speed;
      a.state=d.type==='fan'?'blown':'launched';
    } else if(d.type==='bubble') { a.vx=r.speed;a.vz=0;a.state='bubble'; }
    else if(d.type==='slip') {a.vx=Math.cos(d.angle)*r.speed;a.vz=Math.sin(d.angle)*r.speed;a.state='sliding';}
    else if(d.type==='laser') {a.vx=0;a.vz=0;a.state='lasered';}
    a.stateStart=this.time;a.until=this.time+r.duration;
    if(a.hp===0){a.alive=false;a.finished=true;a.state='defeated';a.finishedAt=this.time;this.kills++;}
  }
  step(dt=this.rules.step) {
    if(this.paused) return;
    this.time+=dt;
    if(this.wave && this.wave.next<=this.time) {this.spawn();this.wave.remaining--;this.wave.next+=this.rules.wave.interval;if(this.wave.remaining===0)this.wave=null;}
    for(const a of this.agents) {
      if(!a.alive) continue;
      if(a.state!=='walk'&&this.time>=a.until) {this.finishEpisode(a,'walking-recovery');a.state='walk';a.vx=this.walkSpeed;a.vz=0;a.y=0;a.walkTime=0;}
      // No authored vertical parabola. Reaction pose translations come from HCAN.
      // Original interaction-parent/world motion is still unresolved.
      a.y=0;
      a.x+=a.vx*dt;a.z+=a.vz*dt;
      if(a.state==='walk'){a.gaitDistance+=Math.hypot(a.vx,a.vz)*dt;a.walkTime+=dt;}
      if(a.state==='walk')a.z+=(this.rules.arena.laneZ-a.z)*this.rules.agent.recoverySteer*dt;
      const edge=this.rules.arena.halfDepth-this.rules.arena.wallMargin;
      if(Math.abs(a.z)>edge){a.z=Math.sign(a.z)*edge;a.vz*=-this.rules.agent.wallBounce;}
      for(const d of this.traps){
        if(!this.inSensor(d,a))a.contacts=a.contacts.filter(id=>id!==d.id);
        if(this.canHit(d,a)){this.fire(d,a);if(!a.alive)break;}
      }
      if(a.alive&&a.x>this.rules.arena.exitX){a.alive=false;a.finished=true;a.state='escaped';a.finishedAt=this.time;this.escapes++;this.baseHealth=Math.max(0,this.baseHealth-1);}
    }
  }
  advance(seconds) {for(let t=0;t<seconds;t+=this.rules.step)this.step();return this.snapshot();}
  snapshot() {return structuredClone({time:this.time,paused:this.paused,agents:this.agents,traps:this.traps,events:this.events,baseHealth:this.baseHealth,kills:this.kills,escapes:this.escapes,chains:this.chains});}
}
