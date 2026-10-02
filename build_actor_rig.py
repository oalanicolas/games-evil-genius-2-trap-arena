"""Decode a narrow native skin layout for this prototype; do not modify the library."""
import hashlib
import json
import struct
from pathlib import Path

HERE = Path(__file__).resolve().parent
LIB = HERE.parents[1]/'libraries/evil-genius-2'
models = json.loads((LIB/'evidence/model-extraction.json').read_text())['models']
skeletons = json.loads((LIB/'evidence/animation-extraction.json').read_text())['skeletons']
body = next(s for s in skeletons if s['name'].lower() == 'ma_bodyhands_investigator')
skel = json.loads((LIB/body['path']).read_text())
result = {'schema': 1, 'origin': 'native hierarchy and locally inferred skin layout',
          'skinLayout': {'stride': 48, 'weightOffset': 32, 'indexOffset': 40, 'influences': 8,
                         'encoding': 'u8 weights normalized by 255; u8 indices',
                         'validation': 'all referenced vertices sum to 255; indices in matched hierarchy; all eight lanes preserved'},
          'skeletonSource': body['path'], 'skeletonSha256': hashlib.sha256((LIB/body['path']).read_bytes()).hexdigest(),
          'bones': skel['bones'], 'models': {}, 'animations': 'authored procedural gait and trap poses; HCAN is not played'}
for name in ['ma_bodyhands_investigator', 'ma_head_white01']:
    model = next(m for m in models if m['name'] == name)
    matching = next(s for s in skeletons if s['name'].lower() == name)
    bones = json.loads((LIB/matching['path']).read_text())['bones']
    assert [b['name'] for b in bones] == [b['name'] for b in skel['bones']]
    data = (LIB/model['raw']).read_bytes()
    end = data.index(b'\0', 28)
    payload = data[(end+4)//4*4:]
    sections, count, indices, triangles = struct.unpack_from('<4I', payload)
    offset = 16+sections*20+24
    referenced = set(struct.unpack_from('<'+'H'*indices, payload, offset+count*48))
    weights, joints = [], []
    for i in range(count):
        vertex = payload[offset+i*48:offset+(i+1)*48]
        w, j = list(vertex[32:40]), list(vertex[40:48])
        if i in referenced:
            assert sum(w) == 255, (name, i, w)
            assert all(joint < len(bones) for joint, weight in zip(j, w) if weight), (name, i, j)
        if sum(w) == 0:
            w, j = [255, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0]
        weights.extend(w)
        joints.extend(j)
    result['models'][name] = {'vertices': count, 'referencedVertices': len(referenced),
                             'raw': model['raw'], 'sha256': model['id'],
                             'weights': weights, 'indices': joints}
(HERE/'actor-rig.json').write_text(json.dumps(result,separators=(',',':'))+'\n')
print(f"{len(skel['bones'])} native bones; " + ', '.join(f'{k}: {v["referencedVertices"]} validated vertices' for k,v in result['models'].items()))
