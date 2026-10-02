// Distance fields over the walkable grid. One field per destination; agents descend it.
// Eight-connected, with no corner cutting: a diagonal needs both orthogonal cells free.

const STEPS = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1],
  [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2]];

class Heap {
  constructor() { this.items = []; }
  push(cost, value) {
    const a = this.items; let i = a.length; a.push([cost, value]);
    while (i > 0) { const p = (i - 1) >> 1; if (a[p][0] <= a[i][0]) break; [a[p], a[i]] = [a[i], a[p]]; i = p; }
  }
  pop() {
    const a = this.items, top = a[0], last = a.pop();
    if (a.length) {
      a[0] = last; let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1; let m = i;
        if (l < a.length && a[l][0] < a[m][0]) m = l;
        if (r < a.length && a[r][0] < a[m][0]) m = r;
        if (m === i) break; [a[m], a[i]] = [a[i], a[m]]; i = m;
      }
    }
    return top;
  }
  get size() { return this.items.length; }
}

/** Cost-to-go from every walkable cell to the nearest of `targets` ([x, z] cells). Infinity when unreachable. */
export function distanceField(layout, targets, extraCost = null) {
  const { w, h } = layout;
  // Float64: a Float32 field rounds diagonal costs below the heap key and drops those nodes.
  const field = new Float64Array(w * h).fill(Infinity);
  const heap = new Heap();
  for (const [x, z] of targets) {
    if (!layout.walkable(x, z)) continue;
    field[z * w + x] = 0; heap.push(0, z * w + x);
  }
  while (heap.size) {
    const [cost, at] = heap.pop();
    if (cost > field[at]) continue;
    const x = at % w, z = (at - x) / w;
    for (const [dx, dz, step] of STEPS) {
      const nx = x + dx, nz = z + dz;
      if (!layout.walkable(nx, nz)) continue;
      if (dx && dz && !(layout.walkable(x + dx, z) && layout.walkable(x, z + dz))) continue;
      const to = nz * w + nx;
      const next = cost + step + (extraCost ? extraCost[to] : 0);
      if (next < field[to]) { field[to] = next; heap.push(next, to); }
    }
  }
  return field;
}

/** Best neighbouring cell to step into from (x, z), or null when already there or cut off. */
export function nextCell(layout, field, x, z, blocked = null) {
  const { w } = layout;
  const here = field[z * w + x];
  let best = null, bestCost = here;
  for (const [dx, dz] of STEPS) {
    const nx = x + dx, nz = z + dz;
    if (!layout.walkable(nx, nz)) continue;
    if (dx && dz && !(layout.walkable(x + dx, z) && layout.walkable(x, z + dz))) continue;
    const cost = field[nz * w + nx];
    if (cost < bestCost) { bestCost = cost; best = [nx, nz]; }
  }
  if (best && blocked && blocked(best[0], best[1])) return { cell: best, blocked: true };
  return best ? { cell: best, blocked: false } : null;
}
