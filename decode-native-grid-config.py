"""Read the selected BLUE/1, unnamed group/13 configuration. Source only."""
import hashlib, json, math, struct
from pathlib import Path

HERE = Path(__file__).resolve().parent
LIB = HERE.parents[1] / 'libraries/evil-genius-2'
SOURCE = 'assets/resources/48a1644e954d5a3f24aa2892705925ce3588dd32fdab9c106266dae3c82bccb6.bin'
NAMESPACE, GROUP = 0x212de4f7, 0x2666f252


def parse(data):
    """No guessed names, inherited values or unsupported wire types."""
    p = 0

    def take(n):
        nonlocal p
        if n < 0 or p + n > len(data):
            raise ValueError('truncated BLUE')
        start = p
        p += n
        return data[start:p]

    def u32():
        return struct.unpack('<I', take(4))[0]

    def count():
        n = u32()
        if n > (len(data) - p) // 4:
            raise ValueError('count exceeds remaining resource')
        return n

    if take(4) != b'BLUE' or u32() != len(data) or u32() != 1:
        raise ValueError('complete BLUE/1 required')
    if u32() != 0:
        raise ValueError('named/other BLUE flags not supported')
    namespaces = []
    seen = set()
    namespace_count = count()
    if namespace_count != 1:
        raise ValueError('only selected single-namespace BLUE supported')
    for _ in range(namespace_count):
        ns_offset, ns_id = p, u32()
        if ns_id in seen:
            raise ValueError('duplicate namespace')
        seen.add(ns_id)
        groups, group_ids = [], set()
        for _ in range(count()):
            offset, group_id = p, u32()
            version, repeated_id, parent = u32(), u32(), u32()
            if version != 13 or repeated_id != group_id or group_id in group_ids:
                raise ValueError('unsupported or ambiguous BLUE group')
            group_ids.add(group_id)
            values, keys = [], set()
            for _ in range(count()):
                at = p
                key, field4, field8, field12, kind = [u32() for _ in range(5)]
                if key in keys:
                    raise ValueError('duplicate property')
                keys.add(key)
                value_at = p
                if kind == 1:
                    value = struct.unpack('<f', take(4))[0]
                    if not math.isfinite(value):
                        raise ValueError('nonfinite grid configuration')
                elif kind in (0, 3):
                    value = u32()
                elif kind == 2:
                    value = take(1)[0] != 0
                elif kind == 4:
                    n = u32()
                    value_at = p
                    value = take(n).hex()
                else:
                    raise ValueError('unsupported wire value type')
                values.append(dict(offset=at, key=hex(key), field4=field4,
                                   field8=hex(field8), field12=field12, type=kind,
                                   valueOffset=value_at, value=value,
                                   bytes=data[at:p].hex()))
            groups.append(dict(offset=offset, id=hex(group_id), version=version,
                               parent=hex(parent), values=values, endOffset=p))
        namespaces.append(dict(offset=ns_offset, id=hex(ns_id), groups=groups))
    # Native113fd0 calls1543a0 after groups. Its polymorphic extension is
    # outside the grid contract: retain bytes, never claim to decode it.
    group_end = p
    extension_count = u32()
    opaque = take(len(data) - p)
    return dict(namespaces=namespaces, scalarGroupsEndOffset=group_end,
                namespaceExtension=dict(offset=group_end, count=extension_count,
                                        opaqueBytes=opaque.hex()), endOffset=p)


def select(parsed):
    ns = next((n for n in parsed['namespaces'] if n['id'] == hex(NAMESPACE)), None)
    if ns is None:
        raise ValueError('native grid namespace missing')
    group = next((g for g in ns['groups'] if g['id'] == hex(GROUP)), None)
    if group is None or group['parent'] != '0x0':
        raise ValueError('native grid group missing or inheritance unresolved')
    values = {int(v['key'], 16): v for v in group['values']}
    selected = {}
    for name, key, kind in [('x', 0x8b99f777, 1), ('yBeforeNativeNegation', 0xcdd5fd96, 1),
                            ('z', 0xd4aba755, 1), ('defaultCellType', 0xe603206f, 3)]:
        v = values.get(key)
        if v is None or v['type'] != kind:
            raise ValueError('native grid value missing or wrong type')
        selected[name] = v
    return selected


def main():
    data = (LIB / SOURCE).read_bytes()
    digest = hashlib.sha256(data).hexdigest()
    if digest != Path(SOURCE).stem:
        raise ValueError('selected library source changed')
    parsed = parse(data)
    selected = select(parsed)
    result = dict(schema='eg2-native-grid-config/1', originalExecuted=False, arenaIntegrated=False,
                  decoderSha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
                  source=dict(path='libraries/evil-genius-2/' + SOURCE, sha256=digest,
                              container='misc/common.asr', chunkOffset=671476),
                  parsed=parsed, selected=selected,
                  scale=[selected['x']['value'], -selected['yBeforeNativeNegation']['value'], selected['z']['value']],
                  defaultCellType=selected['defaultCellType']['value'],
                  scope='Package configuration bound to native loader5a71c0 and cell initializer5fb6f0. Does not prove live overrides, instantiated cells, trap eligibility or original execution.')
    (HERE / 'evidence/native-grid-config.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(dict(groups=sum(len(n['groups']) for n in parsed['namespaces']),
                         properties=sum(len(g['values']) for n in parsed['namespaces'] for g in n['groups']),
                         scalarGroupsEnd=parsed['scalarGroupsEndOffset'],
                         opaqueExtensionBytes=len(parsed['namespaceExtension']['opaqueBytes']) // 2,
                         scale=result['scale'],
                         defaultCellType=hex(result['defaultCellType']))))


if __name__ == '__main__':
    main()
