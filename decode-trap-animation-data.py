"""Extract bounded TRPA3 maps using original readers; never infer state timing.

Writes only this prototype. The library and original executable are read-only.
"""
import hashlib
import json
import struct
from pathlib import Path

HERE = Path(__file__).resolve().parent
LIB = HERE.parents[1] / 'libraries/evil-genius-2'
NATIVE = Path.home() / 'Games/SteamReferences/evil-genius-2/bin/evilgenius_vulkan.exe'
TARGETS = ('FanTrap', 'BoxingGlove', 'BubbleBlower', 'SoapTrap', 'LaserWall')


def name_hash(name):
    result = 0
    for char in name.lower():
        result = (31 * result + ord(char)) & 0xffffffff
    return result


PHASES = {name_hash(s): s for s in ('mount', 'dismount', 'loop', 'wallmount', 'walldismount', 'wallloop')}


class Reader:
    def __init__(self, data, start=0, end=None):
        self.data, self.pos, self.end = data, start, len(data) if end is None else end

    def read(self, size):
        if size < 0 or self.pos + size > self.end:
            raise ValueError('TRPA read outside declared bounds')
        offset = self.pos
        self.pos += size
        return self.data[offset:self.pos]

    def u32(self):
        return struct.unpack('<I', self.read(4))[0]

    def envelope(self, expected_version):
        start = self.pos
        header = self.read(9)
        version, flags, fmt, size = struct.unpack('<HHBI', header)
        if version != expected_version or flags != 0x8000 or fmt != 0:
            raise ValueError(f'Unsupported envelope at {start}: {header.hex()}')
        payload = Reader(self.data, self.pos, self.pos + size)
        self.read(size)
        return payload, {'offset': start, 'version': version, 'flags': flags, 'format': fmt,
                         'payloadBytes': size, 'end': self.pos}

    def finish(self):
        if self.pos != self.end:
            raise ValueError(f'Unconsumed TRPA bytes {self.pos}:{self.end}')


def parse_group(parent, clip_index):
    group, envelope = parent.envelope(3)
    count = group.u32()
    if count != 25:
        raise ValueError(f'Unexpected native map slot count {count}')
    maps = []
    for index in range(count):
        mapping, map_envelope = group.envelope(1)
        entries = []
        for _ in range(mapping.u32()):
            phase_offset = mapping.pos
            phase_hash = mapping.u32()
            values, values_envelope = mapping.envelope(1)
            hashes = []
            for _ in range(values.u32()):
                offset = values.pos
                clip_hash = values.u32()
                candidates = clip_index.get(clip_hash, [])
                hashes.append({'offset': offset, 'hash': f'0x{clip_hash:08x}',
                               'clips': [{'name': c['name'], 'raw': c['raw'], 'sha256': c['id'],
                                          'sourceNames': c['sourceNames']} for c in candidates]})
            values.finish()
            entries.append({'phaseHashOffset': phase_offset, 'phaseHash': f'0x{phase_hash:08x}',
                            'phaseNameHashMatch': PHASES.get(phase_hash),
                            'clipVectorEnvelope': values_envelope, 'clipReferences': hashes})
        mapping.finish()
        maps.append({'slot': index, 'nativeMapOffsetWithinGroup': f'0x{index * 0x58:x}',
                     'envelope': map_envelope, 'entries': entries})
    tail_offset = group.pos
    floats = struct.unpack('<5f', group.read(20))
    flags = list(group.read(4))
    if any(v not in (0, 1) for v in flags):
        raise ValueError('Non-boolean tail in current TRPA3')
    group.finish()
    return {'envelope': envelope, 'slots': maps,
            'tail': {'offset': tail_offset, 'rawHex': group.data[tail_offset:group.end].hex(),
                     'f32': list(floats), 'boolBytes': flags,
                     'nativeDestinations': ['+0x898', '+0x89c', '+0x8a0', '+0x8a4', '+0x8a8',
                                            '+0x8ac', '+0x8ad', '+0x8ae', '+0x8af'],
                     'semantics': 'unknown; offsets are within native group, not gameplay labels'},
            'slotSelectionSemantics': 'Native selector 0x14075be50 reads actor+0x118 as unsigned index <25; map stride 0x58. Producer and body-type meaning of that index remain unknown.'}


def parse_record(raw, clip_index):
    reader = Reader(raw)
    header = reader.read(32)
    if header[:4] != b'trpa' or struct.unpack_from('<I', header, 4)[0] != len(raw):
        raise ValueError('Invalid native TRPA resource envelope')
    body, envelope = reader.envelope(3)
    groups = [parse_group(body, clip_index)]
    selector_offset = body.pos
    has_secondary = body.read(1)[0]
    if has_secondary not in (0, 1):
        raise ValueError('Invalid secondary-group selector')
    if has_secondary:
        groups.append(parse_group(body, clip_index))
    body.finish()
    reader.finish()
    return {'objectId': f'0x{struct.unpack_from("<I", header, 16)[0]:08x}',
            'packageId': f'0x{struct.unpack_from("<I", header, 24)[0]:08x}',
            'resourceVersion': struct.unpack_from('<I', header, 8)[0],
            'envelope': envelope, 'groups': groups,
            'secondaryGroup': {'selectorOffset': selector_offset, 'nativeObjectOffset': '+0x8d0',
                               'present': bool(has_secondary), 'runtimeSelectionCondition': 'Caller requests secondary via r9b; selector requires native presence flag +0x8d0. Interaction caller requests it with parameter+0x24 only if prior group did not stop override.'}}


def original_code_windows():
    import pefile
    import capstone
    raw = NATIVE.read_bytes()
    pe = pefile.PE(data=raw, fast_load=True)
    base = pe.OPTIONAL_HEADER.ImageBase
    decoder = capstone.Cs(capstone.CS_ARCH_X86, capstone.CS_MODE_64)
    windows = []
    for label, start, end in [
        ('TRPA_type_name', 0x1406f9a80, 0x1406f9a96),
        ('TRPA_record_reader', 0x1406f9c40, 0x1406f9f4e),
        ('TRPA_group_reader', 0x1406f9f50, 0x1406fa26b),
        ('TRPA_phase_hash_map_reader', 0x1406e5910, 0x1406e5b0b),
        ('TRPA_clip_hash_vector_reader', 0x1400da820, 0x1400da97a),
        ('FNTR_plus194_TRPA_vector_consumer', 0x1405a27df, 0x1405a2821),
        ('FNTR_reference_reader', 0x140652e55, 0x140652e8b),
        ('TRPA_runtime_group_slot_phase_selector', 0x14075be50, 0x14075c019),
        ('TRPA_FNTR_and_interaction_override_caller', 0x14075ba90, 0x14075bdd3),
        ('TRPA_active_phase_setter', 0x1407535c0, 0x140753672),
    ]:
        data = pe.get_data(start - base, end - start)
        windows.append({'name': label, 'va': hex(start), 'endVAExclusive': hex(end),
                        'fileOffset': hex(pe.get_offset_from_rva(start - base)),
                        'bytesHex': data.hex(), 'sha256': hashlib.sha256(data).hexdigest(),
                        'instructions': [f'{i.address:x}: {i.bytes.hex()} {i.mnemonic} {i.op_str}'
                                         for i in decoder.disasm(data, start)]})
    return {'file': '<native-root>/bin/evilgenius_vulkan.exe',
            'sha256': hashlib.sha256(raw).hexdigest(), 'executed': False, 'windows': windows}


def build():
    gameplay = json.loads((LIB / 'assets/gameplay/index.json').read_text())['entries']
    clips = json.loads((LIB / 'assets/animations/clips.json').read_text())
    clips_by_hash = {}
    for clip in clips:
        clips_by_hash.setdefault(name_hash(clip['name']), []).append(clip)
    trpa = [e for e in gameplay if e['tag'] == 'trpa']
    by_id = {e['objectId']: e for e in trpa}
    furniture = json.loads((LIB / 'assets/furniture/index.json').read_text())['entries']
    records = []
    for target in TARGETS:
        entry = next(e for e in trpa if 'Data_' + target + '_' in e['name'])
        raw = (LIB / entry['path']).read_bytes()
        assert hashlib.sha256(raw).hexdigest() == entry['sha256']
        record = {'name': target, 'source': entry, 'parsed': parse_record(raw, clips_by_hash)}
        fntr = next(e for e in furniture if e['name'] == target)
        fntr_raw = (LIB / fntr['path']).read_bytes()
        base = (fntr_raw.index(0) + 4) & ~3
        offset = base + 335
        link_id = struct.unpack_from('<I', fntr_raw, offset)[0]
        linked = by_id.get(link_id)
        record['FNTRreference'] = {'source': fntr['path'], 'sha256': hashlib.sha256(fntr_raw).hexdigest(),
                                  'offset': offset, 'Bplus': 335, 'nativeObjectOffset': '+0x194',
                                  'objectId': f'0x{link_id:08x}', 'TRPA': linked,
                                  'scope': 'u32 reference, not 8-byte id; native caller 0x14075ba90 reads FNTR+0x194 as primary TRPA. It can overlay secondary and parameter+0x8 alternate TRPA. Actual interaction payload and actor index still need producer proof.'}
        records.append(record)
    refs = [r for rec in records for group in rec['parsed']['groups'] for slot in group['slots']
            for entry in slot['entries'] for r in entry['clipReferences']]
    unknown = [r for r in refs if len(r['clips']) != 1]
    selected_ids = {r['source']['objectId'] for r in records}
    linked_records = []
    for link in {r['FNTRreference']['TRPA']['objectId']: r['FNTRreference']['TRPA'] for r in records}.values():
        if link['objectId'] in selected_ids:
            continue
        raw = (LIB / link['path']).read_bytes()
        assert hashlib.sha256(raw).hexdigest() == link['sha256']
        linked_records.append({'name': link['name'], 'source': link, 'parsed': parse_record(raw, clips_by_hash)})
    result = {'schema': 'eg2-native-trpa/2', 'records': records, 'linkedRecords': linked_records,
              'code': original_code_windows(),
              'coverage': {'records': len(records), 'mapGroups': sum(len(r['parsed']['groups']) for r in records),
                           'mapSlots': sum(len(g['slots']) for r in records for g in r['parsed']['groups']),
                           'clipReferences': len(refs), 'uniqueClipHashes': len({r['hash'] for r in refs}),
                           'uniqueResolvedReferences': len(refs) - len(unknown), 'unresolvedReferences': unknown},
              'runtimeSelection': {
                  'selectorVA': '0x14075be50', 'callerVA': '0x14075ba90',
                  'actorSlotField': '+0x118', 'actorSlotRange': [0, 24], 'mapStride': 88,
                  'primaryGroupOffset': '+0x20', 'secondaryGroupOffset': '+0x8d8',
                  'primaryResource': 'FNTR+0x194, obtained by interaction parameter+0x4 FNTR lookup 0x14065be10',
                  'alternateResource': 'interaction parameter+0x8; nonzero, different from primary, and not stopped by group flags',
                  'secondaryRequested': 'interaction parameter+0x24', 'stopFlagInput': 'interaction parameter+0x27',
                  'stopOverride': 'group+0x8ad || (stopFlagInput && group+0x8af)',
                  'actorPhaseEntries': {'pointer': '+0x578', 'countU16': '+0x572', 'stride': 32,
                                        'phaseHash': '+0x0', 'clipRepresentation': '+0x10', 'clipHash': '+0x18'},
                  'phaseLookup': '0x1402c0e60; first u32 in referenced vector, zero when missing or empty',
                  'overlay': 'primary and its secondary overwrite even with zero; alternate only overwrites nonzero hashes',
                  'activePhase': {'field': '+0x714', 'setterVA': '0x1407535c0', 'input': 'edx'},
                  'verified': 'static instruction and original data evidence; no original runtime execution'},
              'scope': 'TRPA3 serialized associations and native consumer selection algorithm. Original executable read, never executed. Actual actor/interaction inputs, phase transitions and gameplay physics remain unverified.',
              'phaseHashMethod': '32-bit polynomial31 over lowercase clip/phase basename; name match recorded, not a recovered string field',
              'unknown': ['Producer and body-type meaning of actor+0x118 map index', 'Producer and actual values of interaction alternate UID and flags',
                          'Additional phase hash names', 'Phase changes and full gameplay reaction/physics']}
    (HERE / 'evidence/native-trap-animation-data.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result['coverage']))


if __name__ == '__main__':
    build()
