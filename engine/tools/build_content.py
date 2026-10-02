#!/usr/bin/env python3
"""Build the EG2 content pack consumed by the lair engine.

Reads the Evil Genius 2 library (read-only) and the authored behaviours, and writes
`engine/content/eg2/`. Nothing here decides gameplay: native fields are copied with
their origin, authored fields come from `behaviours.json` and `agents.authored.json`.

Run from anywhere:  ~/.pyenv/versions/3.12.12/bin/python3.12 engine/tools/build_content.py
"""
import hashlib
import importlib.util
import json
import math
import struct
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
PROTO = HERE.parents[1]
LIB = PROTO.parents[1] / 'libraries/evil-genius-2'
OUT = PROTO / 'engine/content/eg2'

# registro -> asset bindings. Names come from the library catalogue; the association
# trap -> model/clip is by name (status `inferred`), TRPA-proven only for five traps.
TRAPS = {
    'BoxingGlove': dict(models=['trap_gloveonspring'], rig='trap_gloveonspring',
                        device='Trap_GloveOnSpring_{}_01', agent='Trap_GloveOnSpring_{}_A_01'),
    'BubbleBlower': dict(models=['trap_bubble_blower'], rig='trap_bubble_blower',
                         device='Trap_Bubble_Blower_{}_01', agent='Trap_BubbleCannon_{}_A_01'),
    'FakeSafe': dict(models=['trap_fake_safe'], rig='trap_fake_safe',
                     device={'loop': 'FakeSafe_Loop_01'}, agent='FakeSafe_User_{}_A_01'),
    'FanTrap': dict(models=['trap_fan'], rig='trap_fan',
                    device='Giant_Fan_{}_01', agent='Giant_Fan_{}_A_01'),
    'Flamer': dict(models=['trap_flamer'], agent='Trap_Flame_{}_A_01'),
    'FreezeRay': dict(models=['trap_freezer'], rig='trap_freezer',
                      device='FreezeRay_{}_01', agent='FreezeRay_{}_A_01'),
    'Hopscotch_trap': dict(models=['trap_hopscotch'],
                           agent={'loop': 'Trap_Hopscotch_User_Loop_A_01',
                                  'dismount': 'Trap_Hopscotch_User_Dismount_A_01'}),
    'HunterSnare_Trap': dict(models=['bear_trap_trap'], rig='bear_trap_trap',
                             device='Trap_Bear_{}_01',
                             agent='Hunter_BearTrap_Flinch_Unarmed_{}_A_01'),
    'Killer_Bees': dict(models=['trap_killer_bees'], agent='Trap_KillerBees_{}_A_01'),
    'KnockoutGas': dict(models=['trap_knockout_gas'], rig='trap_knockout_gas',
                        device='Trap_KnockoutGas_{}_01', agent='Trap_KnockoutGas_{}_A_01'),
    'LaserDIsco': dict(models=['trap_disco_laser_active'], rig='trap_disco_laser_active',
                       device='Trap_LaserDisco_{}_01',
                       agent={'loop': 'Trap_LaserDisco_Loop_A_01'}),
    'LaserWall': dict(models=['trap_laser_wall'], agent='Trap_Laser_{}_A_01'),
    'MagnetTrap': dict(models=['trap_magnet'], rig='trap_magnet',
                       device='Giant_Magnet_{}_01', agent='Giant_Magnet_{}_A_01'),
    'Narrative_VenomGasTrap': dict(models=['trap_emma_knockout_gas'], rig='trap_emma_knockout_gas',
                                   device='Trap_KnockoutGas_{}_01', agent='Trap_KnockoutGas_{}_A_01'),
    'Paywall': dict(models=['trap_pay_wall'], rig='trap_pay_wall',
                    device='Paywall{}_01', agent='Trap_Paywall_User_{}_A_01'),
    'PinballBumper': dict(models=['trap_pinball_triangle_bumper'], rig='trap_pinball_triangle_bumper',
                          device='Trap_PinballTriangleBumper_{}_01',
                          agent={'loop': 'Trap_PinballTriangleBumper_Loop_A_01',
                                 'dismount': 'Trap_PinballTriangleBumper_Dismount_A_01'}),
    'PoisonDarts': dict(models=['trap_poison_dart_wall'], agent='Trap_MountedPoisonDarts_{}_A_01'),
    'Robot_Dog_Trap': dict(models=['robo_doggo'], rig='robo_doggo', device='Trap_RoboDoggo_{}_01'),
    'SharkTank': dict(models=['trap_sharktank'], rig='trap_sharktank', extra=['trap_sharktank_sharks'],
                      device={'mount': 'Trap_SharkTank_Mount_01', 'dismount': 'Trap_SharkTank_Dismount_01'},
                      agent='Trap_SharkTank_User_{}_A_01'),
    'SharkTank_SuperDiver': dict(models=['oceans_trap_sharktank'], rig='oceans_trap_sharktank',
                                 extra=['trap_sharktank_sharks'],
                                 device={'mount': 'Trap_SharkTank_Mount_01', 'dismount': 'Trap_SharkTank_Dismount_01'},
                                 agent='Trap_SharkTank_User_{}_A_01'),
    'SoapTrap': dict(models=['trap_slippery_soap'], rig='trap_slippery_soap',
                     device='Trap_SlipperySoap_{}_01', agent='Trap_SlipperySoap_{}_A_01'),
    'Venus_Mantrap': dict(models=['trap_venus_plant'], rig='trap_venus_plant', extra=['trap_venus_plant_base'],
                          device='Trap_VenusSpyTrap_{}_01', agent='Trap_VenusSpyTrap_{}_A_01'),
}
EXTRA_RIGS = ['trap_sharktank_sharks']
EXTRA_CLIPS = ['Trap_SharkTank_Sharks_Loop_01', 'Trap_SlipperySoap_MovementLoop_A_01',
               'BounceOff_Mount_A_01']
KIT = ['corridor_floor_basic', 'corridor_wall_straight_mid', 'door_standard', 'door_standard_frame',
       'corridor_wall_corner_in_l', 'corridor_wall_corner_in_r', 'corridor_wall_corner_out_l',
       'corridor_wall_corner_out_r', 'corridor_wall_straight_mid_end_l', 'corridor_wall_straight_mid_end_r',
       'corridor_wall_corner_in_both', 'corridor_wall_corner_out_both',
       'corridor_wall_corner_in_l_out_r', 'corridor_wall_corner_in_r_out_l',
       'wall_straight', 'wall_corner_in_l', 'wall_corner_out_l', 'wall_end_1m', 'wall_post_a',
       'floor_straight', 'floor_innercorner', 'floor_outercorner',
       'trap_fan_active', 'trap_fan_base_box', 'trap_magnet_active', 'trap_magnet_base_box',
       'trap_sharktank_active', 'trap_sharktank_base_box', 'trap_slippery_soap_base_box',
       'trap_pinball_triangle_bumper_base_box', 'trap_bubble_blower_pod', 'trap_fake_safe_pod',
       'trap_knockout_gas_base_box', 'trap_disco_laser_base_box', 'trap_pay_wall_base_box',
       'robo_doggo_base_box', 'trap_hopscotch_brush', 'bear_trap_foliage', 'trap_iceblock']
PHASES = ['Mount', 'Loop', 'Dismount']
# FNTR state-duration run, in file order. States 3/5/2/4/6 are proven for five traps by
# evidence/native-rules-research.json; the other 17 share the serializer path (inferred).
STATE_ORDER = [('active', 3), ('recharge', 5), ('windup', 2), ('winddown', 4), ('sabotaged', 6)]
PROVEN_TIMING = {'LaserWall', 'BoxingGlove', 'FanTrap', 'SoapTrap', 'BubbleBlower'}


def load(path):
    return json.loads(Path(path).read_text())


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def import_script(name):
    spec = importlib.util.spec_from_file_location(name.replace('-', '_'), PROTO / name)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def name_hash(text):
    value = 0
    for char in text.lower():
        value = (value * 31 + ord(char)) & 0xffffffff
    return value


class Pack:
    def __init__(self):
        self.geometry = load(LIB / 'evidence/model-extraction.json')['models']
        materials = load(LIB / 'evidence/material-extraction.json')
        self.bindings = {m['id']: m for m in materials['models']}
        self.variants = {m['sha256']: m for m in materials['materials']}
        self.skeletons = {s['name'].lower(): s for s in load(LIB / 'evidence/animation-extraction.json')['skeletons']}
        self.clips = {}
        for clip in load(LIB / 'assets/animations/clips.json'):
            self.clips.setdefault(clip['name'], clip)
        self.furniture = {e['sha256']: e for e in load(LIB / 'assets/furniture/index.json')['entries']}
        self.catalogue = load(LIB / 'evidence/armadilhas.json')['nativas']
        self.assets = {a['registro']: a for a in load(LIB / 'evidence/armadilhas-ativos.json')['armadilhas']}
        self.allow = set()
        self.models = {}
        self.rig_done = {}
        self.clip_done = {}
        self.decoder = import_script('decode-animation.py')
        self.bone_names = {}
        for path in sorted((LIB / 'assets/animations/skeletons').glob('*.json')):
            for bone in load(path)['bones']:
                self.bone_names.setdefault(name_hash(bone['name']), bone['name'])
        self.actor_rig = load(PROTO / 'actor-rig.json')
        self.rigmap = {name_hash(b['name']): b['index'] for b in self.actor_rig['bones']}

    def model(self, name):
        """Highest-detail variant of a named model, with material slots resolved."""
        if name in self.models:
            return self.models[name]
        candidates = [m for m in self.geometry if m['name'] == name]
        if not candidates:
            return None
        native = max(candidates, key=lambda m: m['triangles'])
        self.allow.add(native['glb'])
        item = {k: native[k] for k in ['name', 'glb', 'glbSha256', 'vertices', 'triangles']}
        item['bounds'] = native.get('boundsRaw')
        item['origin'] = 'extracted'
        item['submeshes'] = []
        for sub in self.bindings[native['id']]['submeshes']:
            maps = {}
            variant = self.variants.get(sub['materialVariants'][0]) if sub['materialVariants'] else None
            for role, slot in [('colour', 12), ('normal', 16)]:
                ref = next((r for r in (variant or {}).get('textureReferences', [])
                            if r['wordOffset'] == slot and r['candidates']), None)
                if ref:
                    candidate = ref['candidates'][0]
                    maps[role] = {'name': candidate['name'], 'preview': candidate['preview']}
                    self.allow.add(candidate['preview'])
            item['submeshes'].append({'submesh': sub['submesh'], 'startIndex': sub['startIndex'],
                                      'indexCount': sub['indexCount'], 'maps': maps})
        self.models[name] = item
        self._native = getattr(self, '_native', {})
        self._native[name] = native
        return item

    def rig(self, name):
        """Native bind skeleton and eight-influence skin of one model."""
        if name in self.rig_done:
            return self.rig_done[name]
        if not self.model(name) or name not in self.skeletons:
            self.rig_done[name] = None
            return None
        native = self._native[name]
        skeleton = self.skeletons[name]
        bones = load(LIB / skeleton['path'])['bones']
        data = (LIB / native['raw']).read_bytes()
        end = data.index(b'\0', 28)
        payload = data[(end + 4) // 4 * 4:]
        sections, count, index_count, _ = struct.unpack_from('<4I', payload)
        offset = 16 + sections * 20 + 24
        referenced = set(struct.unpack_from('<' + 'H' * index_count, payload, offset + count * 48))
        weights, joints = [], []
        valid = True
        for i in range(count):
            vertex = payload[offset + i * 48:offset + (i + 1) * 48]
            w, j = list(vertex[32:40]), list(vertex[40:48])
            if i in referenced:
                if sum(w) != 255 or any(joint >= len(bones) for joint, weight in zip(j, w) if weight):
                    valid = False
            elif not sum(w):
                w, j = [255, 0, 0, 0, 0, 0, 0, 0], [0] * 8
            weights.extend(w)
            joints.extend(j)
        if not valid:
            self.rig_done[name] = None
            return None
        result = {'schema': 'lair-rig/1', 'name': name, 'origin': 'extracted', 'bones': bones,
                  'vertices': count, 'weights': weights, 'indices': joints,
                  'skinLayout': 'stride 48, weights u8 @32, indices u8 @40, eight influences',
                  'modelSha256': digest(LIB / native['raw']), 'skeletonSha256': digest(LIB / skeleton['path'])}
        path = OUT / 'rigs' / f'{name}.json'
        path.write_text(json.dumps(result, separators=(',', ':')) + '\n')
        self.rig_done[name] = {'path': f'rigs/{name}.json', 'bones': len(bones)}
        return self.rig_done[name]

    def clip(self, name):
        """Decoded HCAN clip, written once. Returns summary or None."""
        if name in self.clip_done:
            return self.clip_done[name]
        entry = self.clips.get(name)
        summary = None
        if entry:
            try:
                decoded = self.decoder.decode(entry, self.bone_names, self.rigmap)
                tracks = []
                for track in decoded['tracks']:
                    kept = {k: track[k] for k in ['boneName', 'rotationTimes', 'rotations',
                                                  'positionTimes', 'positionDeltas'] if k in track}
                    for key in ['nativeBoneLengthScalar', 'role']:
                        if key in track:
                            kept[key] = track[key]
                    tracks.append(kept)
                compact = {'schema': 'lair-clip/1', 'name': name, 'duration': decoded['duration'],
                           'flags': decoded['flags'], 'boneCount': decoded['boneCount'], 'tracks': tracks,
                           'sourceSha256': decoded['sourceSha256'], 'origin': 'extracted HCAN22'}
                file_name = name.replace(' ', '_') + '.json'
                (OUT / 'clips' / file_name).write_text(json.dumps(compact, separators=(',', ':')) + '\n')
                summary = {'name': name, 'path': f'clips/{file_name}', 'duration': decoded['duration'],
                           'bones': decoded['boneCount'], 'peak': peak_time(decoded)}
            except (AssertionError, ValueError, struct.error) as error:
                summary = None
                self.clip_errors = getattr(self, 'clip_errors', [])
                self.clip_errors.append({'clip': name, 'error': str(error)[:160]})
        self.clip_done[name] = summary
        return summary

    def clip_set(self, pattern):
        if not pattern:
            return {}
        if isinstance(pattern, dict):
            names = pattern
        else:
            names = {phase.lower(): pattern.format(phase) for phase in PHASES}
        result = {}
        for phase, name in names.items():
            summary = self.clip(name)
            if summary:
                result[phase] = summary
        return result


def peak_time(clip):
    """Time of the largest bone excursion from the first key: the device's hit frame."""
    best, at = 0.0, 0.0
    for track in clip['tracks']:
        if not track.get('boneName'):
            continue
        first = track['positionDeltas'][0]
        for time, value in zip(track['positionTimes'], track['positionDeltas']):
            distance = math.dist(first, value)
            if distance > best + 1e-6:
                best, at = distance, time
    return round(at, 4)


def read_cost(raw, catalogued, registro):
    """FNTR cost for this fixed collection; do not search for a variable float marker.

    The name-aligned field agrees in offset/value with all 21 catalogued costs.
    FanTrap has no PI marker but has 4000 in the same field. Its semantics remain
    inferred until the game's consumer is traced. Zero is a real value.
    """
    if registro not in TRAPS:
        raise ValueError('Cost layout is only verified for the 22 traps: ' + registro)
    name_end = (raw.index(0) + 4) & ~3
    offset = name_end + 112
    value, = struct.unpack_from('<I', raw, offset)
    if catalogued and (catalogued['offset'] != offset or catalogued['value'] != value):
        raise ValueError(f'{registro}: FNTR cost disagrees with the catalogue')
    return {'value': value, 'offset': offset, 'unit': 'gold', 'bytes': raw[offset:offset + 4].hex(),
            'origin': ('observed: FNTR u32 cost, matches catalogue offset and value' if catalogued else
                       'inferred: FNTR aligned-name +112, same field as 21 catalogued traps; consumer not traced')}


def read_timing(raw, cost_offset, footprint_offset, registro):
    base = cost_offset + 168 if cost_offset is not None else footprint_offset - 252
    values = struct.unpack_from('<5f', raw, base)
    timing = {name: round(value, 4) for (name, _), value in zip(STATE_ORDER, values)}
    timing['nativeStates'] = {name: state for name, state in STATE_ORDER}
    timing['offset'] = base
    timing['origin'] = ('observed: FNTR state-duration fields, consumer traced in evidence/native-rules-research.json'
                        if registro in PROVEN_TIMING else
                        'inferred: same FNTR field run as the five traced traps; consumer not traced for this record')
    timing['phaseNames'] = 'inferred: states 2/3/4 match Mount/Loop/Dismount clip durations in six traps'
    return timing


def pick_audio(sounds):
    roles = {'fire': ['punch', 'start', 'activate', 'appear', 'fire', 'open', 'trigger', 'spray', 'shoot', 'bite',
                      'bumper_hit', 'hit', 'on', 'snap', 'attack', 'release'],
             'loop': ['loop'], 'end': ['retract', 'stop', 'close', 'burst', 'end', 'off', 'deactivate']}
    chosen = {}
    for role, words in roles.items():
        for word in words:
            match = next((s for s in sounds if word in s['nome'].lower() and s['nome'] not in
                          [c['name'] for c in chosen.values()]), None)
            if match:
                chosen[role] = {'name': match['nome'], 'path': match['preview'], 'seconds': match.get('segundos')}
                break
    return chosen


def build():
    (OUT / 'rigs').mkdir(parents=True, exist_ok=True)
    (OUT / 'clips').mkdir(parents=True, exist_ok=True)
    pack = Pack()
    behaviours = load(OUT / 'behaviours.json')
    traps, report = {}, []
    for entry in pack.catalogue:
        registro = entry['registro']
        binding = TRAPS[registro]
        native = pack.furniture[entry['sha256']]
        raw = (LIB / entry['arquivo']).read_bytes()
        fields = native['decoded']['fields']
        width, depth = fields['footprint']['value']
        cells = []
        for cell in native['decoded']['cells']:
            # Engine frame = native footprint frame: i across (native x), j from the wall row (native
            # y = 0) to the front. The renderer turns the native model (wall at +Z) into this frame.
            edges = cell['edges']
            wall = [i for i, value in enumerate(edges) if value == 1]
            gate = any(value == 6 for value in edges)
            cells.append({'i': cell['x'], 'j': cell['y'], 'clear': cell['keepClear'], 'kind': cell['kind'],
                          'edges': edges, 'wall': wall,
                          'solid': bool(wall) and not cell['keepClear'] and not gate})
        cost = read_cost(raw, entry.get('custo') or {}, registro)
        behaviour = behaviours['traps'].get(registro)
        models = [pack.model(name) for name in binding['models'] + binding.get('extra', [])]
        rig = pack.rig(binding['rig']) if binding.get('rig') else None
        for extra in binding.get('extra', []):
            pack.rig(extra)
        device = pack.clip_set(binding.get('device'))
        agent = {}
        for family in 'ABC':
            pattern = binding.get('agent')
            if isinstance(pattern, dict):
                pattern = {k: v.replace('_A_0', f'_{family}_0') for k, v in pattern.items()}
            elif pattern:
                pattern = pattern.replace('_A_0', f'_{family}_0')
            clips = pack.clip_set(pattern)
            if clips:
                agent[family] = clips
        audio = pick_audio(pack.assets.get(registro, {}).get('audio', []))
        for sound in audio.values():
            pack.allow.add(sound['path'])
        trap = {
            'id': registro, 'name': entry['nome'], 'description': entry['descricao'],
            'cost': cost['value'], 'costSource': cost,
            'footprint': {'w': width, 'd': depth, 'origin': 'observed: FNTR footprint'},
            'cells': cells, 'cellsOrigin': 'observed: FNTR cell records (keep-clear, kind, edge slots)',
            'timing': read_timing(raw, cost.get('offset'), fields['footprint']['offset'], registro),
            'source': {'file': entry['arquivo'], 'sha256': entry['sha256'], 'package': entry['origem']},
            'view': {'models': [m['name'] for m in models if m], 'rig': rig,
                     'rigModel': binding.get('rig') if rig else None,
                     'device': device, 'agent': agent, 'audio': audio,
                     'bindingOrigin': 'inferred: asset names; TRPA link proven only for five traps'},
        }
        timing = trap['timing']
        if not (timing['windup'] or timing['active'] or timing['winddown']) and binding.get('agent'):
            # Header durations are used so a clip the decoder rejects still paces the interaction.
            pattern = binding['agent']
            names = pattern if isinstance(pattern, dict) else {ph.lower(): pattern.format(ph) for ph in PHASES}
            seconds = {ph: round(pack.clips[n]['durationRaw'], 4) if n in pack.clips else 0 for ph, n in names.items()}
            timing['interaction'] = {
                'windup': seconds.get('mount', 0), 'active': seconds.get('loop', 0),
                'winddown': seconds.get('dismount', 0),
                'origin': 'inferred: the three native phase durations are zero; paced by the user clips'}
        if behaviour:
            trap.update(behaviour)
        traps[registro] = trap
        report.append({'trap': registro, 'name': entry['nome'], 'footprint': [width, depth], 'cells': len(cells),
                       'timing': [trap['timing'][k] for k, _ in STATE_ORDER],
                       'models': trap['view']['models'], 'rigBones': rig['bones'] if rig else 0,
                       'deviceClips': sorted(device),
                       'agentClips': [f + ''.join(k[0] for k in sorted(v)) for f, v in sorted(agent.items())],
                       'audio': sorted(audio), 'behaviour': bool(behaviour)})
    for name in EXTRA_RIGS:
        pack.rig(name)
    extras = {name: pack.clip(name) for name in EXTRA_CLIPS}
    kit = {name: pack.model(name) for name in KIT}
    kit = {name: model for name, model in kit.items() if model}
    agents = build_agents(pack)
    (OUT / 'traps.json').write_text(json.dumps({'schema': 'lair-traps/1', 'pack': 'eg2', 'traps': traps}, indent=1) + '\n')
    (OUT / 'models.json').write_text(json.dumps({'schema': 'lair-models/1', 'library': '../../libraries/evil-genius-2',
                                                 'materialInterpretation': 'inferred: slot 12 colour, slot 16 normal',
                                                 'models': pack.models}, indent=1) + '\n')
    (OUT / 'kit.json').write_text(json.dumps({'schema': 'lair-kit/1', 'cell': 1.0, 'wallHeight': 3.0,
                                              'models': sorted(kit), 'extraClips': extras}, indent=1) + '\n')
    (OUT / 'agents.json').write_text(json.dumps(agents, indent=1) + '\n')
    allow = {path: digest(LIB / path) for path in sorted(pack.allow)}
    (OUT / 'allow.json').write_text(json.dumps({'schema': 'lair-allow/1', 'files': allow}, indent=1) + '\n')
    summary = {'schema': 'lair-content-report/1', 'traps': len(traps),
               'withFootprint': sum(1 for t in traps.values() if t['footprint']['w']),
               'withTiming': sum(1 for t in traps.values() if 'active' in t['timing']),
               'withModel': sum(1 for t in traps.values() if t['view']['models']),
               'withRig': sum(1 for t in traps.values() if t['view']['rig']),
               'withDeviceClips': sum(1 for t in traps.values() if t['view']['device']),
               'withAgentClips': sum(1 for t in traps.values() if t['view']['agent']),
               'withAudio': sum(1 for t in traps.values() if t['view']['audio']),
               'withBehaviour': sum(1 for t in traps.values() if 'ops' in t),
               'models': len(pack.models), 'rigs': sum(1 for r in pack.rig_done.values() if r),
               'clips': sum(1 for c in pack.clip_done.values() if c),
               'clipErrors': getattr(pack, 'clip_errors', []), 'libraryFiles': len(allow),
               'agents': {k: v['view'] for k, v in agents['types'].items()}, 'rows': report}
    (OUT / 'report.json').write_text(json.dumps(summary, indent=1) + '\n')
    print(json.dumps({k: v for k, v in summary.items() if k not in ['rows', 'agents']}))
    for row in report:
        print(f"{row['trap']:24s} fp={row['footprint']} t={row['timing']} rig={row['rigBones']:2d} "
              f"dev={','.join(k[0] for k in row['deviceClips']) or '-':5s} ag={','.join(row['agentClips']) or '-':14s} "
              f"audio={','.join(row['audio']) or '-'} beh={'yes' if row['behaviour'] else 'NO'}")
    return 0 if summary['withFootprint'] == summary['withTiming'] == len(traps) == 22 else 1


def body_bones_of(rig):
    return [b['name'] for b in load(OUT / rig['path'])['bones']]


def walk_speed(clip, bones):
    """Forward speed from the clip's extra root-motion channel, with the native length retarget.

    Same derivation as native-walk-motion.js; returns None when the channel is not linear forward motion.
    """
    channel = next((t for t in clip['tracks'] if t.get('role')), None)
    if not channel or len(channel['positionDeltas']) < 2:
        return None
    scalars = [t.get('nativeBoneLengthScalar', 0) for t in clip['tracks'][:2]]
    index = 1 if scalars[0] < 0.1 and scalars[0] < scalars[1] else 0
    source = scalars[index]
    target = math.hypot(*bones[index]['translation'])
    retarget = target / source if source > 0.01 else 1.0
    first, last = channel['positionDeltas'][0], channel['positionDeltas'][-1]
    forward = (last[2] - first[2]) * retarget
    if forward <= 0:
        return None
    return {'speed': forward / clip['duration'], 'retarget': retarget,
            'origin': 'inferred: clip extra root-motion channel and native bone-length retarget'}


def build_agents(pack):
    """Agent bodies: authored roster, native body/head/walk resolved and validated here."""
    authored = load(OUT / 'agents.authored.json')
    for key, agent in authored['types'].items():
        view = agent['view']
        resolved = {'body': None, 'head': None, 'walk': None}
        body_rig = pack.rig(view['body'])
        head_rig = pack.rig(view['head']) if view.get('head') else None
        if body_rig:
            resolved['body'] = {'model': view['body'], **body_rig}
        if head_rig:
            body_bones = [b['name'] for b in load(OUT / body_rig['path'])['bones']] if body_rig else []
            head_bones = [b['name'] for b in load(OUT / head_rig['path'])['bones']]
            if body_bones == head_bones:
                resolved['head'] = {'model': view['head'], **head_rig}
        resolved['parts'] = []
        for part in view.get('parts', []):
            part_rig = pack.rig(part)
            if part_rig and body_rig and [b['name'] for b in load(OUT / part_rig['path'])['bones']] == body_bones_of(body_rig):
                resolved['parts'].append({'model': part, **part_rig})
        walk = pack.clip(view['walk'])
        if walk:
            resolved['walk'] = walk
            resolved['walkSpeed'] = walk_speed(load(OUT / walk['path']), load(OUT / body_rig['path'])['bones']) if body_rig else None
        for extra in view.get('extraModels', []):
            pack.model(extra)
        agent['view'] = {**view, 'resolved': resolved}
    return authored


if __name__ == '__main__':
    sys.exit(build())
