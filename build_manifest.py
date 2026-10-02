"""Build a narrow read-only consumer of the existing EG2 extraction."""
import hashlib
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
LIB = HERE.parents[1] / 'libraries/evil-genius-2'

def build():
    geometry = json.loads((LIB / 'evidence/model-extraction.json').read_text())
    materials = json.loads((LIB / 'evidence/material-extraction.json').read_text())
    models = {m['name']: m for m in geometry['models']}
    bindings = {m['name']: m for m in materials['models']}
    variants = {m['sha256']: m for m in materials['materials']}
    names = ['trap_fan_active', 'trap_fan', 'trap_gloveonspring',
             'trap_bubble_blower', 'trap_slippery_soap', 'trap_laser_wall',
             'corridor_floor_basic', 'corridor_wall_straight_mid',
             'ma_bodyhands_investigator', 'ma_head_white01',
             'ohw_ranged_pistolinvestigatorsrevolver']
    result = {'schema': 1, 'source': '../../libraries/evil-genius-2',
              'engine': 'Three.js — reconstruction, not Asura', 'models': {}, 'audio': {},
              'materialInterpretation': 'inferred: slot 12 colour, slot 16 normal; original shader not reproduced'}
    allowed = set()
    for name in names:
        m = models[name]
        allowed.add(m['glb'])
        item = {k: m[k] for k in ['name', 'glb', 'glbSha256', 'vertices', 'triangles']}
        item['origin'] = 'extracted'
        item['submeshes'] = []
        for s in bindings[name]['submeshes']:
            mat = variants[s['materialVariants'][0]]
            refs = mat['textureReferences']
            maps = {}
            for role, slot in [('colour', 12), ('normal', 16)]:
                ref = next((r for r in refs if r['wordOffset'] == slot and r['candidates']), None)
                if ref:
                    candidate = ref['candidates'][0]
                    maps[role] = {k: candidate[k] for k in ['name', 'preview', 'sha256']}
                    allowed.add(candidate['preview'])
            item['submeshes'].append({**s, 'maps': maps})
        result['models'][name] = item
    audio_entries = json.loads((LIB / 'assets/library-index.json').read_text())['entries']
    sounds = {'fan': 'trp_fantrap_start_01.wav', 'glove': 'trp_boxingglove_punch_01.wav',
              'bubble': 'trp_bubble_blower_large_appear_01.wav',
              'pop': 'trp_bubble_blower_large_burst_01.wav',
              'slip': 'trp_soaptrap_bubble_loop_01.wav', 'laser': 'trp_laserwall_beam_activate_01.wav'}
    for key, suffix in sounds.items():
        e = next(e for e in audio_entries if e.get('kind') == 'audio' and e['name'].endswith(suffix))
        result['audio'][key] = {'name': e['name'], 'path': e['preview'], 'origin': 'extracted'}
        allowed.add(e['preview'])
    result['files'] = {path: hashlib.sha256((LIB/path).read_bytes()).hexdigest() for path in sorted(allowed)}
    (HERE / 'asset-manifest.json').write_text(json.dumps(result, indent=2) + '\n')
    print(f"{len(names)} native models, {len(sounds)} sounds, {len(allowed)} allowlisted library files")

if __name__ == '__main__':
    build()
