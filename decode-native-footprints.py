"""Selected FNTR155→footprint16 reader, tied to653xxx/658950.

The prefix and two intervening envelopes are bounded and preserved; no names
are assigned to unknown scalar fields. No library files are changed.
"""
import hashlib
import importlib.util
import json
import struct
from pathlib import Path

HERE = Path(__file__).resolve().parent
WORKSPACE = HERE.parents[1]
spec = importlib.util.spec_from_file_location('controller85', HERE / 'decode-native-controller85.py')
prefix = importlib.util.module_from_spec(spec)
spec.loader.exec_module(prefix)


class Reader:
    def __init__(self, raw, start=0, end=None):
        self.raw, self.pos = raw, start
        self.end = len(raw) if end is None else end
        if not 0 <= self.pos <= self.end <= len(raw):
            raise ValueError('invalid footprint stream bounds')

    def take(self, n):
        if n < 0 or self.pos + n > self.end:
            raise ValueError('truncated footprint')
        at = self.pos
        self.pos += n
        return self.raw[at:self.pos]

    def field(self, fmt):
        at = self.pos
        raw = self.take(struct.calcsize('<' + fmt))
        return dict(offset=at, value=struct.unpack('<' + fmt, raw)[0], bytes=raw.hex())

    def envelope(self, expected):
        at = self.pos
        version, flags, encoding, n = struct.unpack('<HHBI', self.take(9))
        if version != expected or flags != 0x8000 or encoding != 0:
            raise ValueError('unsupported footprint envelope')
        payload = Reader(self.raw, self.pos, self.pos + n)
        self.take(n)
        return payload, dict(offset=at, version=version, payloadBytes=n, endOffset=self.pos)

    def finish(self):
        if self.pos != self.end:
            raise ValueError('unconsumed footprint payload')


def cell(parent):
    p, envelope = parent.envelope(16)
    #658950 selected16 path: XY u16, type4 u32, fieldc u32;
    # ten bools at runtime10..19; counted u32→u16 list1a; field8 u32.
    result = dict(envelope=envelope,
                  planarX=p.field('H'), planarY=p.field('H'),
                  field4=p.field('I'), field0c=p.field('I'))
    result['flags'] = {}
    for offset in range(0x10, 0x1a):
        value = p.field('B')
        value['normalizedValue'] = value['value'] != 0
        result['flags'][hex(offset)] = value
    count = p.field('H')
    if count['value'] > (p.end - p.pos - 4) // 4:
        raise ValueError('cell uint32 list exceeds envelope')
    values = [p.field('I') for _ in range(count['value'])]
    # Native reader stores only when count<=4, truncating to uint16.
    result['list1a'] = dict(count=count, values=values,
                            nativeStores=[v['value'] & 0xffff for v in values] if count['value'] <= 4 else [],
                            discardedByNative=count['value'] > 4)
    result['field8'] = p.field('I')
    p.finish()
    result['kindEquals2ForOccupancySetter'] = result['field4']['value'] == 2
    return result


def parse(raw, body):
    fields = prefix.read_prefix(raw, body)
    p = Reader(raw, fields['endOffsetExclusive'])
    values = {}
    for offset, fmt in [(0x1b4,'I'), (0x1b8,'I'), (0x1bc,'I'),
                        (0x1c0,'B'), (0x1c1,'B'), (0x1c4,'I'),
                        (0x1c8,'I'), (0x1cc,'I'), (0x1d0,'I'),
                        (0x1d4,'I'), (0x1d8,'I'), (0x1dc,'I')]:
        values[hex(offset)] = p.field(fmt)
    q, envelope = p.envelope(1)  #653580→65da00; payload semantics not needed.
    opaque = [dict(runtimeField='0x1e0', envelope=envelope, bytes=q.take(q.end-q.pos).hex())]
    for offset, fmt in [(0x1f0,'I'), (0x220,'B'), (0x224,'I'),
                        (0x228,'B'), (0x229,'B'), (0x22a,'B'), (0x22c,'I')]:
        values[hex(offset)] = p.field(fmt)
    q, envelope = p.envelope(1)  #65376d header/653784→7dc890, kept opaque.
    opaque.append(dict(runtimeField='0x230', envelope=envelope, bytes=q.take(q.end-q.pos).hex()))
    # Old version31..32 /2..69 fields are absent in selected155 path.
    values['0x288'], values['0x28c'] = p.field('I'), p.field('I')
    count = p.field('I')  #653bc8, then653ce0→658950 per cell.
    if count['value'] > (p.end - p.pos) // (9 + 28):
        raise ValueError('footprint count exceeds remaining stream')
    cells = [cell(p) for _ in range(count['value'])]
    coords = [(c['planarX']['value'], c['planarY']['value']) for c in cells]
    if len(set(coords)) != len(coords):
        raise ValueError('duplicate selected footprint coordinate')
    return dict(prefixEnd=fields['endOffsetExclusive'], selectedFNTRVersion=155,
                interveningFields=values, opaqueEnvelopes=opaque, count=count,
                cells=cells, endOffset=p.pos, remainingUnparsedBytes=len(raw)-p.pos,
                scope='Complete selected footprint16 payloads, not complete FNTR. Planar source coordinates; rotation/placement/override and scene ownership are separate native inputs.')


def collect():
    source = json.loads((HERE / 'evidence/native-controller85-route.json').read_text())
    records = []
    for record in source['records']:
        raw = (WORKSPACE / record['source']['extracted_file']).read_bytes()
        if hashlib.sha256(raw).hexdigest() != record['source']['sha256']:
            raise ValueError('native furniture extraction changed')
        records.append(dict(name=record['name'], source=record['source'],
                            bodyAnchor=record['bodyAnchor'], parsed=parse(raw, record['bodyAnchor'])))
    return records


def main():
    records = collect()
    report = dict(schema='eg2-native-footprints/1', originalExecuted=False, arenaIntegrated=False,
                  decoderSha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
                  prefixParserSha256=hashlib.sha256((HERE / 'decode-native-controller85.py').read_bytes()).hexdigest(),
                  records=records,
                  scope='Native FNTR155 sequential reader and footprint16 fields. No inference of sensors, wall collisions, KeepClear, damage or timing from occupancy metadata.')
    (HERE / 'evidence/native-footprints.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps({r['name']: dict(cells=len(r['parsed']['cells']),
                                     kinds=sorted({c['field4']['value'] for c in r['parsed']['cells']}),
                                     rawField8=sorted({c['field8']['value'] for c in r['parsed']['cells']})) for r in records}))


if __name__ == '__main__':
    main()
