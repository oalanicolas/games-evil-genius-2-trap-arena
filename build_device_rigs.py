"""Preserve five native device bind rigs and skin lanes for source inspection.

No animation composition, activation rule or machine placement is inferred here.
The library is read-only; all derived output stays in this prototype.
"""
import hashlib
import json
import struct
from pathlib import Path

HERE = Path(__file__).resolve().parent
LIB = HERE.parents[1] / 'libraries/evil-genius-2'
NAMES = ['trap_fan', 'trap_gloveonspring', 'trap_bubble_blower',
         'trap_slippery_soap', 'trap_laser_wall']


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def build():
    models = json.loads((LIB / 'evidence/model-extraction.json').read_text())['models']
    skeletons = json.loads((LIB / 'evidence/animation-extraction.json').read_text())['skeletons']
    result = {'schema': 'eg2-device-rigs/1', 'origin': 'extracted',
              'skinLayout': {'stride': 48, 'weightOffset': 32, 'indexOffset': 40,
                             'influences': 8, 'weightDenominator': 255},
              'runtimeComposition': 'unknown', 'devices': {}}
    receipts = []
    for name in NAMES:
        model = next(m for m in models if m['name'].lower() == name)
        native_skeleton = next(s for s in skeletons if s['name'].lower() == name)
        skel = json.loads((LIB / native_skeleton['path']).read_text())
        bones = skel['bones']
        raw = LIB / model['raw']
        data = raw.read_bytes()
        end = data.index(b'\0', 28)
        payload = data[(end + 4) // 4 * 4:]
        sections, count, index_count, _ = struct.unpack_from('<4I', payload)
        offset = 16 + sections * 20 + 24
        referenced = set(struct.unpack_from('<' + 'H' * index_count, payload,
                                             offset + count * 48))
        assert max(referenced) < count
        weights, joints, unused_zero = [], [], 0
        for i in range(count):
            vertex = payload[offset + i * 48:offset + (i + 1) * 48]
            w, j = list(vertex[32:40]), list(vertex[40:48])
            if i in referenced:
                assert sum(w) == 255, (name, i, w)
                assert all(joint < len(bones) for joint, weight in zip(j, w) if weight)
            elif not sum(w):
                unused_zero += 1
            weights.extend(w)
            joints.extend(j)
        item = {'name': name, 'bones': bones, 'vertices': count,
                'referencedVertices': len(referenced), 'weights': weights, 'indices': joints,
                'modelSource': model['raw'], 'modelSha256': digest(raw),
                'geometrySource': model['glb'], 'geometrySha256': digest(LIB / model['glb']),
                'skeletonSource': native_skeleton['path'],
                'skeletonSha256': digest(LIB / native_skeleton['path']),
                'unusedZeroWeightVertices': unused_zero}
        result['devices'][name] = item
        receipts.append({k: v for k, v in item.items() if k not in ['bones', 'weights', 'indices']})
        receipts[-1]['boneCount'] = len(bones)
        receipts[-1]['allReferencedWeightSums255'] = True
        receipts[-1]['allReferencedJointsInHierarchy'] = True
        receipts[-1]['boneNames'] = [b['name'] for b in bones]
    output = HERE / 'device-rigs.json'
    output.write_text(json.dumps(result, separators=(',', ':')) + '\n')
    evidence = {'schema': 'eg2-native-device-rigs-proof/1', 'runtimeExecuted': False,
                'decoder': 'build_device_rigs.py', 'decoderSha256': digest(Path(__file__)),
                'output': 'device-rigs.json', 'outputSha256': digest(output),
                'records': receipts, 'unknown': ['HCAN bind rotation composition',
                'activation rules', 'native placement transform', 'original client playback']}
    (HERE / 'evidence/native-device-rigs.json').write_text(json.dumps(evidence, indent=2) + '\n')
    print(json.dumps({'devices': len(receipts), 'bones': sum(r['boneCount'] for r in receipts),
                      'referencedVertices': sum(r['referencedVertices'] for r in receipts),
                      'status': 'native data validated; runtime playback not certified'}))


if __name__ == '__main__':
    build()
