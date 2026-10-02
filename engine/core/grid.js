// Grid conventions shared by the core, the renderer and the editor.
//
// One cell is one native footprint cell (1 world unit). Cell (x, z) covers
// [x, x+1] x [z, z+1]. A placed object stores the minimum corner of its rotated
// footprint plus `rot`, quarter turns matching Three.js `rotation.y = rot * PI/2`.
// Local footprint axes: i across, j from the back (j = 0, the wall side of a
// wall-mounted device) towards the front. `rot` 0 faces +Z.

export const DIRS = [[0, 1], [1, 0], [0, -1], [-1, 0]];

export const facing = rot => DIRS[rot & 3];

/** Rotate a local (i, j) direction into world (x, z). */
export function rotateVector(li, lj, rot) {
  switch (rot & 3) {
    case 0: return [li, lj];
    case 1: return [lj, -li];
    case 2: return [-li, -lj];
    default: return [-lj, li];
  }
}

export const rotatedSize = (w, d, rot) => (rot & 1 ? [d, w] : [w, d]);

/** Local cell (i, j) of a w x d footprint -> offset from the placement corner. Works outside the footprint too. */
export function localToOffset(i, j, w, d, rot) {
  switch (rot & 3) {
    case 0: return [i, j];
    case 1: return [j, w - 1 - i];
    case 2: return [w - 1 - i, d - 1 - j];
    default: return [d - 1 - j, i];
  }
}

/** Local continuous point (u across, v front, origin at the footprint's back-left corner) -> world. */
export function localToWorld(u, v, w, d, x, z, rot) {
  switch (rot & 3) {
    case 0: return [x + u, z + v];
    case 1: return [x + v, z + w - u];
    case 2: return [x + w - u, z + d - v];
    default: return [x + d - v, z + u];
  }
}

// Native edge slots of a footprint cell: 0 back (-j), 1 right (+i), 2 front (+j), 3 left (-i).
const EDGE_LOCAL = [[0, -1], [1, 0], [0, 1], [-1, 0]];
export const edgeDirection = (edge, rot) => rotateVector(EDGE_LOCAL[edge][0], EDGE_LOCAL[edge][1], rot);

/** Expand a cell specification into local cells. See behaviours.json for the forms. */
export function expandCells(spec, def) {
  const { w, d } = def.footprint;
  const out = new Map();
  const add = (i, j) => out.set(i + ',' + j, [i, j]);
  const visit = item => {
    if (item === 'footprint') for (const c of def.cells) add(c.i, c.j);
    else if (item === 'clear') for (const c of def.cells) { if (c.clear) add(c.i, c.j); }
    else if (item && item.front) {
      const [width, depth] = item.front;
      const start = Math.floor((w - width) / 2);
      for (let j = d; j < d + depth; j++) for (let i = start; i < start + width; i++) add(i, j);
    } else if (item && item.around !== undefined) {
      const r = item.around;
      for (let j = -r; j < d + r; j++) for (let i = -r; i < w + r; i++) add(i, j);
    } else throw new Error('Unknown cell specification: ' + JSON.stringify(item));
  };
  (Array.isArray(spec) ? spec : [spec]).forEach(visit);
  return [...out.values()];
}
