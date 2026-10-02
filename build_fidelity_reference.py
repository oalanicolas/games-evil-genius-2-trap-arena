"""Build the sealed 34-case inventory from native evidence, never assumed tuning."""
import hashlib
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
LIB = HERE.parents[1] / 'libraries/evil-genius-2'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def build():
    book = json.loads((HERE / 'docs/gauntlet-fidelidade-eg2.json').read_text())
    animation_index = json.loads((HERE / 'animation-data/index.json').read_text())
    native_rules = json.loads((HERE / 'evidence/native-rules-research.json').read_text())
    native_trpa = json.loads((HERE / 'evidence/native-trap-animation-data.json').read_text())
    hcan_events = json.loads((HERE / 'evidence/native-hcan-listeners-data.json').read_text())
    observations = json.loads((HERE / 'evidence/gameplay-observation.json').read_text())
    rules = json.loads((HERE / 'rules.json').read_text())
    families = {'ventilador': 'Giant_Fan_', 'luva': 'Trap_GloveOnSpring_',
                'bolha': 'Trap_Bubble', 'piso': 'Trap_SlipperySoap_', 'laser': 'Trap_Laser_'}
    trap_keys = {'ventilador': 'fan', 'luva': 'glove', 'bolha': 'bubble', 'piso': 'slip', 'laser': 'laser'}
    record_names = {'ventilador': 'FanTrap', 'luva': 'BoxingGlove', 'bolha': 'BubbleBlower',
                    'piso': 'SoapTrap', 'laser': 'LaserWall'}
    cases = []
    for case_id in book['contrato_fidelidade']['casos']:
        family = case_id.split('/')[0]
        case = {'id': case_id, 'status': 'unknown', 'expected': None,
                'unit': None, 'tolerance': None, 'precision': None, 'sources': [],
                'confirmedConstraints': [], 'nativeClipFacts': [],
                'initialComparison': {'status': 'material_difference_or_unverified',
                                      'source': 'evidence/fidelity-baseline.json'},
                'unknown': ['Equivalence to original execution for this complete case']}
        names = [c for c in animation_index['clips'] if
                 (family in families and c['name'].startswith(families[family])) or
                 (case_id == 'agente/caminhada' and c['name'] == 'Investigator_walk_revolvers_01')]
        for entry in names:
            clip = json.loads((HERE / entry['path']).read_text())
            case['nativeClipFacts'].append({'name': clip['name'], 'source': clip['source'],
                'sourceSha256': clip['sourceSha256'], 'sourceNames': clip['sourceNames'],
                'durationSeconds': clip['duration'], 'nativeBoneCount': clip['boneCount'],
                'decodedFile': entry['path'], 'decodedSha256': sha(HERE / entry['path']),
                'durationScope': 'clip duration; not cooldown, state duration or launch speed',
                'timeQuantizationSeconds': clip['duration'] / 65535,
                'binding': clip.get('binding'),
                'composition': 'native local operations and retarget ratio/guard confirmed; scene-transform implementation and world/collision integration unresolved'})
        if names:
            case['sources'].append({'file': 'evidence/hcan-research.json',
                'sha256': sha(HERE / 'evidence/hcan-research.json'), 'version': 'HCAN22',
                'scope': 'Native channel samples, names and timestamps; original playback unverified'})
            case['sources'].append({'file': 'evidence/native-animation-code.json',
                'sha256': sha(HERE / 'evidence/native-animation-code.json'),
                'scope': 'Static original-executable proof of quantizer, nlerp and conditional bind composition'})
        if family in families:
            case['sources'].append({'file':'evidence/native-grid-config-route.json',
                'sha256':sha(HERE / 'evidence/native-grid-config-route.json'),
                'scope':'Source pointer join: collision component78+332 is the native trap controller. Conditional timer decision and two-mask actor cell test ported separately. Actual mask/actor selection producers, nested entry effects, runtime18c and live scene binding unresolved; not a radius sensor or complete controller execution.'})
            case['sources'].append({'file':'evidence/native-footprints.json',
                'sha256':sha(HERE / 'evidence/native-footprints.json'),
                'scope':'Selected FNTR155→footprint16 source records (52 cells across five devices). Occupancy kind4=0; fan record flag15=true, other four false. Contact query route known; placed origins/deltas/dimensions, override records and device/clock binding remain unresolved. Not a sensor radius, KeepClear label or complete-case equivalence.'})
            relevant_events = [r for r in hcan_events['records'] if
                r['name'] in {c['name'] for c in names} or
                any(ref['record'] == record_names[family] for ref in r['trpaReferences'])]
            case['nativeAnimationEvents'] = [{'clip': r['name'], 'source': r['source'],
                'sourceSha256': r['sourceSha256'], 'events': [
                    {'offset': l['offset'], 'typeHash': l['typeHash'],
                     'base': l.get('base'), 'modeRaw': l.get('modeRaw'),
                     'subclassDecoded': l.get('subclassDecoded', False)}
                    for l in r['tail']['listeners']]} for r in relevant_events if r['tail']['listeners']]
            for file in ['native-hcan-listeners-data.json', 'native-hcan-listeners-code.json']:
                case['sources'].append({'file': 'evidence/' + file,
                    'sha256': sha(HERE / 'evidence' / file),
                    'scope': 'Static source-backed HCAN22 records and normalized intervals. BounceOff destinations linked; collision inputs, clock/phase binding and original playback unverified.'})
            case['sources'].append({'file': 'evidence/native-rules-research.json',
                'sha256': sha(HERE / 'evidence/native-rules-research.json'),
                'scope': 'Five native state thresholds in simulation seconds and TrapCharge association; remaining state names/modifiers unresolved'})
            record = next(r for r in native_rules['trap_records'] if r['record'] == record_names[family])
            case['nativeStateThresholds'] = [{k: field.get(k) for k in (
                'offset', 'raw_hex', 'value', 'native_object_offset', 'proven_native_role',
                'native_state_enum', 'unit', 'native_UI_association')} for field in record['candidate_float_run']
                if field.get('unit') == 'simulation_seconds']
            case['nativeStateThresholdScope'] = 'Limits compared with simulation clock; native exits can happen earlier. No conversion of enum labels to gameplay names.'
            controller_path = HERE / 'evidence/native-controller85-route.json'
            controller = json.loads(controller_path.read_text())
            query = next(r for r in controller['records'] if r['name'] == record_names[family])
            case['nativeControllerQuery'] = {'hash': query['query'],
                'mode': query['fields']['queryMode'], 'field': query['nativeField'],
                'resourceOffset': query['fields']['queryModeOffset'],
                'scope': 'Native vector query selector. Type0 recipient converts direction to target rotation; type1 recipient interpolates toward target translation. Live channel records, owner transform, inputs and recovery remain unresolved; this is not an intrinsic velocity.'}
            case['nativeVectorListeners'] = {'directionEvent':'0xf05c69fc',
                'positionEvent':'0xd87366dd',
                'source':'evidence/native-controller85-route.json',
                'scope':'Concrete generic animation listeners verified by vtable, registration and receiver code. Two BounceOff native target-position records now decoded. Position progress may follow sampled extra-channel length; actual clock/phase, collision destinations and live object binding remain unresolved.'}
            case['sources'].append({'file':'evidence/native-controller85-route.json',
                'sha256':sha(controller_path),
                'scope':'Original controller85 factory, prefix reader, vector producer and query operations; no original execution or complete-case equivalence'})
            trpa_index = next(i for i, r in enumerate(native_trpa['records']) if r['name'] == record_names[family])
            case['sources'].append({'file': 'evidence/native-trap-animation-data.json',
                'sha256': sha(HERE / 'evidence/native-trap-animation-data.json'),
                'pointer': '/records/' + str(trpa_index), 'version': 'TRPA3',
                'scope': 'Native phase maps and selector operations verified statically; actual actor index, alternate UID and flags in the running game unverified'})
            case['initialComparison']['assumedRuntimeParameters'] = rules['traps'][trap_keys[family]]
        if family == 'agente':
            case['sources'].append({'file': 'actor-rig.json', 'sha256': sha(HERE / 'actor-rig.json'),
                                    'version': 'HSKN29', 'scope': 'Native mesh hierarchy and skin weights'})
        if family == 'apresentacao':
            case['sources'].append({'file': 'asset-manifest.json', 'sha256': sha(HERE / 'asset-manifest.json'),
                                    'scope': 'Extracted geometry, texture and audio selection; reconstruction differs'})
        fan_integration = HERE / 'evidence/native-fan-cycle.json'
        if family in ['ventilador', 'cadeia']:
            for file in ['native-bounce-grid-route.json', 'native-grid-transport-qa.json']:
                case['sources'].append({'file': 'evidence/' + file,
                    'sha256': sha(HERE / 'evidence' / file),
                    'scope': 'Static bounce grid/cell/endpoint route and isolated arithmetic port; package grid configuration now decoded separately. Live cells, overrides, object binding and original five-device chain remain unresolved. Arena unchanged.'})
        if family in ['ventilador', 'cadeia'] or case_id in ['agente/rota-e-obstaculo', 'apresentacao/materiais-e-escala']:
            for file in ['native-grid-config.json', 'native-grid-config-route.json', 'native-cell-types.json']:
                case['sources'].append({'file': 'evidence/' + file,
                    'sha256': sha(HERE / 'evidence' / file),
                    'scope': 'Selected BLUE values linked to native loader: scale1,-3,1/default497004c7;59 cell-type descendants, flags96/98 and inheritance linked to factory/lookup/classifier prefix. Constructor-baseline Dirt class1/Corridor class0; live registration mode, overrides, per-floor values and occupied device flags unresolved. Source decoding, no original execution.'})
        if fan_integration.exists() and (family == 'ventilador' or case_id == 'apresentacao/animacoes'):
            case['sources'].append({'file': 'evidence/native-fan-cycle.json',
                'sha256': sha(fan_integration),
                'scope': 'Extracted fan mesh/skin/three clip poses applied in arena; web-bench pose consistency only. Phase scheduling, sensor, force and world binding remain reconstructed/unverified.'})
        if not case['sources']:
            case['sources'].append({'file': 'evidence/native-rules-research.json',
                                    'scope': 'Relevant gameplay formulas still unknown'})
        cases.append(case)
    by_id = {c['id']: c for c in cases}
    for observation in observations['observations']:
        for case_id in observation['cases']:
            case = by_id[case_id]
            case.setdefault('externalObservations', []).append(observation)
            case['sources'].append({'file': 'evidence/gameplay-observation.json',
                'sha256': sha(HERE / 'evidence/gameplay-observation.json'),
                'url': observations['source']['url'], 'version': 'unknown',
                'scope': 'Qualitative public gameplay observation; complete case and native numeric parameters remain unverified'})

    def text_constraint(case_ids, table, index, meaning, limitation):
        file = 'details/textos/text-pc-' + table + '-' + table + '-asr-en.json'
        entry = json.loads((LIB / file).read_text())['entradas'][index]
        source = {'file': 'libraries/evil-genius-2/' + file, 'sha256': sha(LIB / file),
                  'pointer': '/entradas/' + str(index), 'keyHash': entry['hash'],
                  'scope': 'Native UI text; not runtime observation', 'version': 'unknown'}
        for case_id in case_ids:
            by_id[case_id]['sources'].append(source)
            by_id[case_id]['confirmedConstraints'].append({'meaning': meaning,
                 'provenance': 'extraido', 'limitation': limitation})

    text_constraint(['agente/deteccao-e-desarme'], 'menu', 1789,
                    'Skill influences how often agents avoid traps; agents have Vitality, Skill and Resolve.',
                    'Formula, initial stats and disarming behavior unknown.')
    text_constraint(['bolha/captura', 'bolha/suspensao-sem-impulso', 'bolha/impulso-externo',
                     'ventilador/bolha-soprada'], 'furniture', 695,
                    'Bubble victim floats and other traps help move it.',
                    'No speed, trajectory, lift height, lifetime or standalone drift specified.')
    text_constraint(['luva/antecipacao-e-impacto'], 'furniture', 693,
                    'Boxing Glove is a single-target trap intended to separate groups.',
                    'Impact timing, selection rule and force unknown.')
    text_constraint(['laser/sensor-e-geometria'], 'furniture', 713,
                    'Laser Wall uses a grid of beams.',
                    'Beam count, hit geometry, activation and duration not specified by text.')
    text_constraint(['cadeia/combo-sem-recuperar'], 'menu', 815,
                    'A native achievement requires three different traps without recovery time.',
                    'Recovery event and timer thresholds unknown; historical hit list is insufficient.')
    text_constraint(['cadeia/cinco-dispositivos'], 'menu', 751,
                    'A native achievement names Giant Fan into Boxing Glove.',
                    'This pair does not prove a complete five-device chain.')
    text_constraint(['cadeia/cinco-dispositivos'], 'menu', 757,
                    'A native achievement names Bubble Cannon and Slippery Floor.',
                    'Text does not impose an order or prove the requested five-device chain.')
    text_constraint(['ventilador/sensor', 'piso/ativacao', 'laser/interrupcao'], 'tutorial', 129,
                    'Low Durability prevents traps from triggering.',
                    'Threshold and maintenance timing unknown.')
    text_constraint(['laser/interrupcao', 'cadeia/acerto-repetido'], 'furniture', 329,
                    'Body bags prevent traps from firing.',
                    'Spatial scope and clearing rule unknown.')
    assert len(cases) == len(by_id) == book['contrato_fidelidade']['total'] == 34
    result = {'schema': 'eg2-fidelity-reference/1', 'phase': 'R1', 'cases': cases,
        'coverage': {'inventoried': len(cases), 'completeCasesVerified': 0,
                     'nativeClipsDecoded': len(animation_index['clips']),
                     'nativeListenerClipsInspected': hcan_events['coverage']['unionClips'],
                     'nativeListenerRecordsDecoded': hcan_events['coverage']['listenerRecords'],
                     'nativeVectorChannelRecordsDecoded': hcan_events['coverage']['vectorRecords'],
                     'nativeStateThresholdsWithProvenUnits': 25,
                     'TRPAclipReferencesResolved': native_trpa['coverage']['uniqueResolvedReferences'],
                     'unknownRelevantCases': len(cases)},
        'provenance': {'original_executado': False, 'engine': 'Three.js reconstruction',
                      'sourceFirst': True, 'nativeLibraryReadOnly': True},
        'scope': 'No decoded number receives a gameplay label without a verified native consumer.',
        'criteria': 'docs/gauntlet-fidelidade-eg2.json#/contrato_fidelidade',
        'unknown': ['World-up sign, concrete scene-transform slots and navigation/collision', 'Remaining FNTR field meanings, state names and modifiers',
                    'Producer of actor TRPA map index and actual interaction alternate UID/flags',
                    'Native state transitions and activation rules', 'Original-client motion comparison']}
    (HERE / 'evidence/fidelity-reference.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result['coverage']))


if __name__ == '__main__':
    build()
