"""Extract BLUE cell-type flags consumed by660770/5fe100; source only."""
import hashlib
import importlib.util
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
LIB = HERE.parents[1] / 'libraries/evil-genius-2'
SOURCE = 'assets/resources/dc34cd111b5f3af8f6defe41e4d947960b1398d04649bb2f48383f297d7939d6.bin'
NAMESPACE, ROOT = '0x94de9754', '0x997288ff'
spec = importlib.util.spec_from_file_location('blue_grid', HERE / 'decode-native-grid-config.py')
blue = importlib.util.module_from_spec(spec)
spec.loader.exec_module(blue)


def extract(data):
    parsed = blue.parse(data)
    ns = parsed['namespaces'][0]
    if ns['id'] != NAMESPACE or parsed['namespaceExtension']['count'] != 0 or parsed['namespaceExtension']['opaqueBytes']:
        raise ValueError('complete selected cell-type namespace required')
    groups = {g['id']: g for g in ns['groups']}
    if ROOT not in groups or groups[ROOT]['parent'] != '0x0':
        raise ValueError('cell-type root missing or unresolved')

    def lineage(gid):
        chain = []
        while gid != '0x0':
            if gid in chain or gid not in groups:
                raise ValueError('cyclic or missing BLUE parent')
            chain.append(gid)
            gid = groups[gid]['parent']
        return chain

    # Validate all parents, not only the two known exemplar types.
    chains = {gid: lineage(gid) for gid in groups}
    candidates = [gid for gid, chain in chains.items() if ROOT in chain[1:]]
    parents = {g['parent'] for g in groups.values()}

    def lookup(gid, key):
        for owner in chains[gid]:
            value = next((v for v in groups[owner]['values'] if v['key'] == key), None)
            if value is not None:
                return owner, value
        return None, None

    def flag(gid, key):
        owner, value = lookup(gid, key)
        # Native lookup inherits only when the property is absent.660770
        # defaults to zero for an existing property with a non-bool type.
        if value is None or value['type'] != 2:
            return dict(value=False, reason='missing-or-wrong-type-native-zero',
                        owner=owner, property=value)
        raw = data[value['valueOffset']]
        if raw not in (0, 1):
            raise ValueError('noncanonical bool requires native reader normalization proof')
        return dict(value=bool(raw), reason='own' if owner == gid else 'inherited',
                    owner=owner, property=value)

    records = []
    for gid in candidates:
        bit7, bit6 = flag(gid, '0xafe7e835'), flag(gid, '0xfed53b01')
        owner, label = lookup(gid, '0xd9e2ac24')
        # This is an actual string value. Its UI role remains unnamed.
        label_text = bytes.fromhex(label['value']).decode('utf-8') if label and label['type'] == 4 else None
        flags4a = 4 | (int(bit7['value']) << 7) | (int(bit6['value']) << 6)
        records.append(dict(id=gid, parent=groups[gid]['parent'], lineage=chains[gid],
                            groupOffset=groups[gid]['offset'],
                            rawString=dict(key='0xd9e2ac24', value=label_text, owner=owner,
                                           valueOffset=label['valueOffset'] if label else None),
                            resource96=bit7, resource98=bit6,
                            constructedCellFlags4a=flags4a,
                            classifierWithConstructorFlags48=1 if flags4a & 128 else 0))
    return dict(namespace=NAMESPACE, root=ROOT, namespaceGroups=len(groups),
                scalarGroupsEndOffset=parsed['scalarGroupsEndOffset'],
                records=records,
                registrationCandidates=dict(
                    whenGlobalFlagFalse=[gid for gid in candidates if groups[gid]['parent'] == ROOT],
                    whenGlobalFlagTrue=[gid for gid in candidates if gid not in parents]),
                registrationScope='694800 branches on global object+28: false selects direct children, true selects descendant leaves. Actual live global flag and overrides unverified.')


def main():
    raw = (LIB / SOURCE).read_bytes()
    digest = hashlib.sha256(raw).hexdigest()
    if digest != Path(SOURCE).stem:
        raise ValueError('selected library source changed')
    result = dict(schema='eg2-native-cell-types/1', originalExecuted=False, arenaIntegrated=False,
                  decoderSha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
                  blueParserSha256=hashlib.sha256((HERE / 'decode-native-grid-config.py').read_bytes()).hexdigest(),
                  source=dict(path='libraries/evil-genius-2/' + SOURCE, sha256=digest,
                              container='misc/common.asr', chunkOffset=831852),
                  extracted=extract(raw),
                  scope='Native source-bound two flags and inheritance. Constructor baseline classification only; modern occupied flags48, scene contacts, original execution and complete engine equivalence not established.')
    (HERE / 'evidence/native-cell-types.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(dict(namespaceGroups=result['extracted']['namespaceGroups'],
                         cellTypeDescendants=len(result['extracted']['records']),
                         registrationCandidates={k: len(v) for k, v in result['extracted']['registrationCandidates'].items()})))


if __name__ == '__main__':
    main()
