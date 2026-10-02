// Presentation bindings per device: where the native model sits on its footprint and which
// authored effect accompanies it. Nothing here changes a rule; the core never reads this file.
//
// Native space is Y-down; the loader reflects Y, which leaves every model mirrored (the
// hopscotch digits read backwards). Each model holder therefore also reflects Z: together
// that is the proper half turn about X, and lettering reads correctly again.
// After it, wall devices look down +Z (the engine's front) with the wall behind them.
// `pivot` says where the native origin lies:
//   center  - middle of the footprint (floor devices, gates)
//   backrow - middle of the row of cells against the wall (wall plane half a cell behind)
//   wall    - on the wall plane itself
// Fitted by eye against the footprint outline (engine/dev/models.html); status: inferred.
export const DEFAULT_VIEW = { yaw: 0, pivot: 'center' };

export const VIEWS = {
  BoxingGlove: { pivot: 'backrow' },
  BubbleBlower: { pivot: 'backrow', fx: 'bubbles' },
  FakeSafe: { pivot: 'wall' },
  FanTrap: { yaw: Math.PI, fx: 'wind' }, // the jet's outlet is on the native model's +Z side
  Flamer: { pivot: 'backrow', fx: 'fire' },
  FreezeRay: { pivot: 'backrow', fx: 'frost' },
  Killer_Bees: { pivot: 'wall', turn: [0, -Math.PI / 2, Math.PI], fx: 'bees' }, // the hive panel is authored lying on its side
  KnockoutGas: { fx: 'gas', colour: '#b58be0' },
  Narrative_VenomGasTrap: { fx: 'gas', colour: '#7fd45a' },
  LaserDIsco: { fx: 'disco' },
  LaserWall: { pivot: 'wall', mirror: true, fx: 'laser' },
  PoisonDarts: { pivot: 'wall', mirror: true, fx: 'darts' },
  MagnetTrap: { fx: 'magnet' },
  SharkTank: { pit: true, fx: 'water', companions: [{ model: 'trap_sharktank_sharks', clip: 'Trap_SharkTank_Sharks_Loop_01', when: 'open' }] },
  SharkTank_SuperDiver: { pit: true, fx: 'water', companions: [{ model: 'trap_sharktank_sharks', clip: 'Trap_SharkTank_Sharks_Loop_01', when: 'open' }] },
  SoapTrap: { fx: 'suds' },
  // The bumper mesh is modelled raised while its skeleton rests sunk under the lid, so its bind
  // is taken from the raised (loop) pose. Without this it idles 0.8 above the floor; the
  // reference capture shows it flush. Status: inferred from that capture.
  PinballBumper: { bind: { clip: 'loop', bones: ['Trap_Pinball_Triangle_Bumper'] } },
  Venus_Mantrap: { companions: [{ model: 'trap_venus_plant_base' }] },
  Door_Standard: { door: true },
};

export const viewOf = type => ({ ...DEFAULT_VIEW, ...(VIEWS[type] || {}) });

export function pivotZ(view, def) {
  const d = def.footprint.d;
  if (view.pivot === 'backrow') return -d / 2 + 0.5;
  if (view.pivot === 'wall') return -d / 2;
  return 0;
}
