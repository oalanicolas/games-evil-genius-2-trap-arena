"""Byte evidence linking BLUE config and cell type flags to the native grid."""
import hashlib, json, struct
from pathlib import Path
import pefile
from capstone import Cs, CS_ARCH_X86, CS_MODE_64

HERE = Path(__file__).resolve().parent
exe = Path.home() / 'Games/SteamReferences/evil-genius-2/bin/evilgenius_vulkan.exe'
raw = exe.read_bytes()
digest = hashlib.sha256(raw).hexdigest()
assert digest == 'c52e656a6bbdfdf4f59aa03bfa0f11425854299e61fb078744e5865847c79042'
pe = pefile.PE(data=raw, fast_load=True)
base = pe.OPTIONAL_HEADER.ImageBase
md = Cs(CS_ARCH_X86, CS_MODE_64)


def window(name, a, z):
    data = pe.get_data(a-base, z-a)
    ins = list(md.disasm(data, a))
    assert len(data) == z-a and sum(i.size for i in ins) == len(data), name
    return dict(name=name, vaStart=hex(a), vaEndExclusive=hex(z),
                fileOffset=pe.get_offset_from_rva(a-base), bytes=data.hex(),
                sha256=hashlib.sha256(data).hexdigest(),
                disassembly=[f'{i.address:#x}: {i.bytes.hex()} {i.mnemonic} {i.op_str}' for i in ins])


ranges = [window(n, a, z) for n, a, z in [
    ('BLUE dispatcher tag branch and call113fd0', 0x14012841b, 0x1401284c8),
    ('BLUE reader registers namespaces and reads groups', 0x140113fd0, 0x14011445d),
    ('Namespace register consumed by110730', 0x1401105e0, 0x140110723),
    ('Namespace lookup', 0x140110730, 0x1401107d9),
    ('Group lookup', 0x140110ab0, 0x140110b69),
    ('Bucketed property lookup with parent fallback', 0x14010e3a0, 0x14010e431),
    ('Group version/id/parent/count and property reader', 0x14010e700, 0x14010e878),
    ('Version10+ scalar value reader including group13', 0x14010e930, 0x14010ed40),
    ('Namespace extension reader, content kept opaque', 0x1401543a0, 0x1401545a0),
    ('Grid scale loader with exact namespace/group/property hashes', 0x1405a71c0, 0x1405a72c0),
    ('Floor reader allocates cells and invokes5fbc20', 0x1405f2b60, 0x1405f2d5d),
    ('Cell constructor initializes flag bytes', 0x1405fb620, 0x1405fb6f0),
    ('Cell initializer uses config default type and applies resource', 0x1405fb6f0, 0x1405fb885),
    ('Cell type resolves three IDs and writes flag4a bits6/7', 0x1405fe100, 0x1405fe177),
    ('Cell type hash lookup', 0x140661d40, 0x140661dc2),
    ('Cell type namespace enumeration and concrete factory binding', 0x1406948b4, 0x14069495c),
    ('Cell type factory inserts ID/pointer into lookup dictionary', 0x140662030, 0x140662200),
    ('Cell type property loader entry binds group and resource', 0x140660770, 0x1406607a0),
    ('Cell type bool keys populate resource96 and98', 0x140660b64, 0x140660bf7),
    ('BLUE group count: direct versus descendant selection', 0x140110070, 0x1401101d8),
    ('BLUE indexed group selector with same inheritance guard', 0x1401101e0, 0x140110418),
    ('BLUE ancestry guard walks parent pointer', 0x14010e510, 0x14010e537),
    ('Cell postload reapplies type flags', 0x1405fba80, 0x1405fba8e),
    ('Floor cell lookup and footprint metadata bind occupancy setter', 0x1405d35da, 0x1405d36b3),
    ('Cell occupancy attach sets ID slots and flag48bit7', 0x1406024b0, 0x1406026c3),
    ('Cell occupancy removal guards ID and recomputes flag48bit7', 0x1406026d0, 0x140602922),
    ('Floor owner list lookup called by classifier, not a flag writer', 0x1405f4820, 0x1405f4883),
    ('FNTR155 sequential route from controller prefix to footprint block', 0x140653199, 0x140653d86),
    ('FNTR footprint16 bounded cell reader', 0x140658950, 0x140659203),
    ('FNTR intermediary1e0 envelope and record reader', 0x14065da00, 0x14065dc2b),
    ('Footprint query walks instance grid and returns native36-byte record', 0x1405d2ff0, 0x1405d313b),
    ('Footprint setup selects instance origin/delta/dimensions', 0x1405d3140, 0x1405d3360),
    ('Furniture creates trap component78 and initializes state0', 0x1405d6770, 0x1405d68c6),
    ('Trap controller update: strict float32 threshold and override', 0x140613cc0, 0x140613ec4),
    ('Trap operability predicate, not actor presence', 0x1405cfa60, 0x1405cfade),
    ('Trap next-state enum dispatch', 0x140619af0, 0x140619b6d),
    ('Trap threshold accessor, including states8/9 and missing resource', 0x140619ba0, 0x140619c30),
    ('Trap state commit guard and state3 exit', 0x140618240, 0x1406182d0),
    ('Trap state1 entry invokes actor handler before ordinary timestamp', 0x140618524, 0x140618552),
    ('Trap ordinary commit stamps current simulation clock', 0x1406185c8, 0x1406185ec),
    ('Trap position test intersects two cell masks', 0x140613000, 0x140613106),
    ('Trap state1 actor loop, position guard and eligibility call', 0x1406175b0, 0x14061781c),
    ('Trap trigger actor handler: interaction direction and state9', 0x140618080, 0x14061823d),
    ('Selected FNTR prefix: threshold fields and serialized flag18f', 0x1406529a5, 0x140652f45),
    ('Cell reader version/mask/type and old flag48 fields', 0x1405fbc20, 0x1405fbea0),
]]
data_ranges=[]
for name,a,z in [('Trap next-state RVAs',0x140619b70,0x140619b98),
                 ('Trap duration RVAs',0x140619c30,0x140619c50),
                 ('Default trap threshold f32',0x140b4b530,0x140b4b534),
                 ('State9 threshold f32',0x140b4b360,0x140b4b364),
                 ('State8 count0 threshold f32',0x140b4b024,0x140b4b028),
                 ('State8 countNonzero threshold f32',0x140b4b224,0x140b4b228)]:
    data=pe.get_data(a-base,z-a)
    data_ranges.append(dict(name=name,vaStart=hex(a),vaEndExclusive=hex(z),
                            fileOffset=pe.get_offset_from_rva(a-base),bytes=data.hex(),
                            sha256=hashlib.sha256(data).hexdigest()))
rules=json.loads((HERE/'evidence/native-rules-research.json').read_text())
trap_configs=[]
for record in rules['trap_records']:
    source=record['origin'];data=(HERE.parents[1]/source['extracted_file']).read_bytes()
    assert hashlib.sha256(data).hexdigest()==source['sha256']
    anchor=record['alignment_boundary'];fields={};thresholds=[]
    for state,field,delta in [(2,'0x160',288),(3,'0x158',280),(4,'0x164',292),(5,'0x15c',284),(6,'0x168',296)]:
        offset=anchor+delta;value=struct.unpack_from('<f',data,offset)[0]
        prior=next(v for v in record['candidate_float_run'] if v['native_object_offset']==field)
        assert prior['offset']==offset and prior['value']==value
        fields[field]=value
        thresholds.append(dict(state=state,field=field,offset=offset,bytes=data[offset:offset+4].hex(),value=value))
    flag_offset=anchor+330
    trap_configs.append(dict(name=record['record'],source=source,bodyAnchor=anchor,
        fields=fields,thresholds=thresholds,
        flag18f=dict(offset=flag_offset,raw=data[flag_offset],value=int(data[flag_offset]!=0)),
        flag18c=None,flag18cStatus='Runtime byte is not read by this selected serialized prefix; producer unresolved'))
report = dict(schema='eg2-native-grid-config-route/1', originalExecuted=False,
              source=dict(filename=exe.name, sha256=digest),
              generatorSha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
              ranges=ranges,dataRanges=data_ranges,trapConfigs=trap_configs,
              confirmed=dict(
                  resourceRoute='12841b tests BLUE, branch12847b reaches call1284be→113fd0. Reader1142f3 registers namespace via1105e0; group read1143c1→10e700 and insertion1143d0→055030. Lookup110730/110ab0/10e3a0 supplies loader5a71c0.',
                  propertyLayout='Group header: outerID, version, innerID, parentID, propertyCount. For unnamed group13: five u32 key/field4/field8/field12/wireType then scalar. Type1 reads f32 and stores runtimeType1/value; type3 reads u32 and stores runtimeType3/value. Other raw words remain unnamed. Selected group has no parent.',
                  selected='misc/common.asr BLUE SHA48a1644e… namespace212de4f7/group2666f252. Native X property8b99f777=1@332; Y cdd5fd96=3@284 then sign negated; Z d4aba755=1@212. Hence package scales1,-3,1. Not a live override/execution claim.',
                  defaultCellType='Cell initializer5fb772 reads e603206f, runtime type3, assigning cell+24. Selected BLUE value@308=497004c7. Per-floor source+0c can override before lookup; package default does not prove every instantiated cell type.',
                  cellFlags='Constructor sets cell48/49=0 and cell4a=4. Apply5fe100 resolves cell24/28/20 through661d40 into cell10/18/08. cell10 resource98 bit0 becomes cell4a bit6; resource96 bit0 becomes cell4a bit7. Missing primary resource clears those two bits. Negative signed cell4a is first class1 guard in5453a0.',
                  oldCellSerialization='5fbc20 accepts sized cell with default version52 reader. Version>=41 reads presence mask; cell+24 type read next. Older versions1..15 read boolean into flag48bit0; versions14..15 bit1; versions3..15 bit2. This is version-specific and must not be substituted for modern ENTI flags.',
                  extension='113fd0 calls1543a0 after groups; selected tail has count2 plus104 bytes kept opaque. No curve/colour/content semantics claimed.',
                  cellTypeFactory='6948db uses namespace94de9754 and parent997288ff, calls110070/1101e0 to enumerate.69492d→662030 inserts groupID/pointer into dictionary141cb1358 read by661d40;694950→660770 fills flags. Global object+28 false selects direct children; true selects descendant leaves. Live mode unknown.',
                  cellTypeValues='660b6c resolves afe7e835 through10e3a0 with parent fallback; runtime bool type2 byte→resource96.660bda similarly resolves fed53b01→resource98. Missing/wrong type defaults zero, no fallback after wrong type. Selected BLUE dc34cd11 has195 groups/59 descendants,39 direct children/49 descendant leaves. Dirt497004c7 afe7e835=true@22390, fed53b01=false inherited@31091; Corridor2a5b912a inherits false@31806 and@31091. Raw string keyd9e2ac24 contains Dirt/Corridor; UI role not inferred.',
                  cellOccupancy='5d35da/5d35ef indexes36-byte footprint metadata at resource298/count2a4. Override record250/count25c uses144-byte stride. Kind field4 (or override20)==2 produces boolR8 at5d363e; floorf18/cella8 lookup binds RCXcell and calls6024b0 at5d36ae. Setter checks slotR9<3, sets flag48bit7 and cell84+slot*4 objectID. Slot2 updates flag48bit0 from boolR8 (with source notifications); slot0 alters other4a flags. Removal6026d0 requires matching objectID, clears slot to999, clears bit7 then sets it if any of three slots remains not999. This is source-backed occupancy state; actual five-device footprint schemas/placement remain unresolved.',
                  ownerLookup='54540a→5f4820 returns floor2a0 owner-map entry for Z*floorWidth+X via2c0e60 under lock. No writes to cell48 occur here; do not call it a refresh or flag producer.',
                  serializedFootprints='Selected FNTR155 prefix ends atB+398.653199 selected path reads1b4/1b8/1bc, bool1c0/1c1, u32fields1c4..1dc, envelope1e0 kept opaque, scalar1f0/220/224/228..22c, envelope230 kept opaque, u32fields288/28c, footprintcount at653bc8.653ce0→658950 reads each envelope16: two u16 coordinates, u32field4, u32field0c, ten bools10..19, u16count/u32list→u16array1a (discarded when count>4), finalu32field8. Records copied with stride36 toFNTR298/count2a4.52 cells across five selected devices; allfield4=0, fan allflag15=true; otherfour devicesflag15=false. Field8 values0/2 are preserved unnamed, not automatically KeepClear.',
                  contactFootprintQuery='545456→5d2ff0 mode3 calls5d3140 and walks instance dimensions/planar integer deltas, selecting serialized record by one-based index, not radius/mesh bounds.5d3140 nulls resource pointer when instance dimensions mismatch FNTR68/6a. Classifier object78+332 states2..4 requires returned record15 true to class2; other componenta0 branch remains separate. Native instance origins/deltas/rotation/IDs must still be supplied.',
                  trapStateBinding='The object78 component and its state332 used by5453a0 are the same trap component allocated at5d6796→612590. Prior native-rules-research pointer/clock proof is reused. Allocation is0x460 bytes;5d68b1→618240 initializes0. State timestamp334 is simulation-seconds float32.',
                  trapStateDecision='613d90 follows actor/controller updates, which may already change332. Custom controller virtual30 true uses virtual38 uint16 directly. Otherwise5cfa60 supplies device/environment predicate, NOT enemy presence. State3 advances early when predicate false or component3e4 nonzero. Otherwise compare f32(clock−threshold)>timestamp, strictly; unordered/equal do not expire. One requested transition per decision is NOT one transition per update:618240 entry1 calls618080 and a successful nested handler bypasses outer stamp. Ordinary6185c8 stamps currentclock without overshoot; same-state returns without stamp reset. The JS decision returns a requested state, not post-entry scene state.',
                  trapThresholds='619ba0 checks ownerFNTR80 pointer first; missing returns f32(1e30), even state8/9. States2/3/4/5/6 read160/158/164/15c/168. State8 uses component374==0?.1:1;state9=5;others1e30.25 selected FNTR values preserved with native offsets. State4 next uses runtimeFNTR18c (producer unresolved); state8 next uses serialized18f atB+330. Numeric state labels are not animation phases.',
                  trapPositionMasks='6175b0 while state1 enumerates actor IDs atcomponent3a8;52b1b0 resolves actor, actor34 integer XYZ supplied to613000. It intersects componentb8 bitmask bounds c8..dc then component28 bitmask bounds38..4c, requiring same floor and set bit at (maxX−minX+1)*(Z−minZ)+X−minX. This is NOT the FNTR footprint15 collision query. Next615210 is an eligibility/reaction predicate; false leads618080→616d80 selection. Selected actor path stamps actor720 with ownerID and entersstate9; missing/sentinel actor path uses61ad00. Masks, actor eligibility and selection producers must be bound before replacing Arena radius/latch.'),
              unresolved=['Modern ENTI cell reader versus library parser coordinate order; instantiated occupancy slots and footprint placement/override binding.',
                          'Live namespace overrides, per-floor height/type and instantiated furniture.',
                          'Motion record, clock and native contact/escape provider binding to Arena.',
                          'Original executable execution and continuous five-device chain.'])
(HERE/'evidence/native-grid-config-route.json').write_text(json.dumps(report, indent=2)+'\n')
print(json.dumps(dict(codeWindows=len(ranges),dataWindows=len(data_ranges),trapThresholds=sum(len(r['thresholds']) for r in trap_configs),originalExecuted=False)))
