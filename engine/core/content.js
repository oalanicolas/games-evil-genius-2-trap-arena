// Turns the content pack files into the structure the core consumes.
// Pure: the caller (Node test, browser) does the reading.

export function prepareContent({ traps, agents, behaviours }) {
  const defs = {};
  for (const [id, source] of Object.entries({ ...traps.traps, ...(behaviours.doors || {}) })) {
    const def = structuredClone(source);
    def.category ??= 'trap';
    def.peak = def.view?.device?.mount?.peak ?? 0;
    def.recover = {};
    for (const [family, clips] of Object.entries(def.view?.agent || {})) {
      if (clips.dismount) def.recover[family] = clips.dismount.duration;
    }
    defs[id] = def;
  }
  const roster = structuredClone(agents);
  for (const type of Object.values(roster.types)) {
    type.family = type.view?.family || 'A';
    type.speed = type.view?.resolved?.walkSpeed?.speed ?? 1.15;
    type.speedOrigin = type.view?.resolved?.walkSpeed?.origin ?? 'assumed';
  }
  return { pack: traps.pack, traps: defs, agents: roster, rules: behaviours.rules || {} };
}
