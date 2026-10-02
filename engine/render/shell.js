// Native corridor panels replace a complete one-cell edge, including both ends.
// Pure topology: no renderer, assets or simulation rules. Local -X is the left end.
export function wallPieces(layout) {
  const pieces = [];
  const floor = (x, z) => layout.isFloor(x, z);
  const sides = [[0, 1, 1, 0], [1, 0, 0, -1], [0, -1, -1, 0], [-1, 0, 0, 1]];
  for (let z = 0; z < layout.h; z++) for (let x = 0; x < layout.w; x++) {
    if (!floor(x, z)) continue;
    sides.forEach(([dx, dz, tx, tz], rot) => {
      if (floor(x + dx, z + dz)) return;
      const ends = [-1, 1].map(sign => {
        const nx = x + tx * sign, nz = z + tz * sign;
        return !floor(nx, nz) ? 'in' : floor(nx + dx, nz + dz) ? 'out' : null;
      });
      const [l, r] = ends;
      const part = l && r ? l === r ? `corner_${l}_both` : l === 'in' ? 'corner_in_l_out_r' : 'corner_in_r_out_l'
        : l ? `corner_${l}_l` : r ? `corner_${r}_r` : 'straight_mid';
      pieces.push({ x, z, rot, model: 'corridor_wall_' + part, ends });
    });
  }
  return pieces;
}

export const WALL_MODELS = ['straight_mid', 'corner_in_l', 'corner_in_r', 'corner_out_l',
  'corner_out_r', 'corner_in_both', 'corner_out_both', 'corner_in_l_out_r', 'corner_in_r_out_l']
  .map(part => 'corridor_wall_' + part);
