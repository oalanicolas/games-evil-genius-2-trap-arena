"""Verify native byte windows, serialized references and bounds; no executable execution."""
import hashlib,json,pathlib,pefile,importlib.util,struct
root=pathlib.Path(__file__).resolve().parent;exe=pathlib.Path.home()/'Games/SteamReferences/evil-genius-2/bin/evilgenius_vulkan.exe';b=exe.read_bytes();pe=pefile.PE(data=b,fast_load=True);base=pe.OPTIONAL_HEADER.ImageBase
checks={};checked=0
for filename in ['native-animation-code.json','native-trap-animation-data.json','native-actor-slot-route.json','native-controller85-route.json','native-hcan-listeners-code.json','native-bounce-grid-route.json','native-grid-config-route.json']:
 d=json.loads((root/'evidence'/filename).read_text())
 ranges=d['ranges']+d.get('dataRanges',[]) if 'ranges' in d else d['code']['windows']
 for r in ranges:
  va=int(r.get('vaStart',r.get('va')),16);end=int(r.get('vaEndExclusive',r.get('endVAExclusive')),16);raw=pe.get_data(va-base,end-va);assert raw.hex()==r.get('bytes',r.get('bytesHex')),r;assert hashlib.sha256(raw).hexdigest()==r['sha256'];checked+=1
rules=json.loads((root/'evidence/native-rules-research.json').read_text())
rule_windows=0
for key in ['native_pointer_provenance_R1','native_clock_and_states_R1']:
 for region in rules[key]['regions']:
  va=int(region['va'],16);raw=pe.get_data(va-base,region['bytes']);assert len(raw)==region['bytes'];assert hashlib.sha256(raw).hexdigest()==region['machine_code_sha256'],region['name'];rule_windows+=1
checks['nativeByteWindows']=checked
def extra_rule_ranges(node):
 if isinstance(node,dict):
  if all(k in node for k in ['start_va','end_va_exclusive','bytes_hex','sha256']):
   yield node
  else:
   for value in node.values():yield from extra_rule_ranges(value)
 elif isinstance(node,list):
  for value in node:yield from extra_rule_ranges(value)
for region in extra_rule_ranges(rules):
 va=int(region['start_va'],16);end=int(region['end_va_exclusive'],16)
 raw=pe.get_data(va-base,end-va);assert raw.hex()==region['bytes_hex'];assert hashlib.sha256(raw).hexdigest()==region['sha256'];rule_windows+=1
checks['nativeRuleByteWindows']=rule_windows
controller=json.loads((root/'evidence/native-controller85-route.json').read_text())
assert controller['source']['sha256']==hashlib.sha256(b).hexdigest()
# Independently verify the concrete listener link, not just the saved prose.
listeners=[(0x140ad3dc0,0xf05c69fc,0x1400b6f90,0x1400b5980,0x1400b5890,0x1400b5930),
           (0x140ad3e60,0xd87366dd,0x1400b7010,0x1400b5430,0x1400b54d0,0x1400b5580)]
for table,event_hash,getter,receiver,start,update in listeners:
 entries=struct.unpack('<20Q',pe.get_data(table-base,160))
 assert entries[0]==getter and entries[7]==receiver and entries[13]==start and entries[14]==update
 assert pe.get_data(getter-base,6)==b'\xb8'+struct.pack('<I',event_hash)+b'\xc3'
assert struct.unpack('<6I',pe.get_data(0xb5264,24))==(0xb50fa,0xb5192,0xb50fa,0xb520c,0xb5240,0xb5244)
for va,value in [(0x140b4adb0,1e-12),(0x140b4ae0c,1e-6),(0x140b4b148,.5),(0x140b4b224,1.0)]:
 assert pe.get_data(va-base,4)==struct.pack('<f',value)
assert pe.get_data(0x140b4bc30-base,16)==struct.pack('<4I',*[0x7fffffff]*4)
checks['nativeVectorListenersLinked']=len(listeners)
checks['nativeListenerIntervalStates']=6
spec85=importlib.util.spec_from_file_location('controller85',root/'decode-native-controller85.py');c85=importlib.util.module_from_spec(spec85);spec85.loader.exec_module(c85)
prefix_rejected=0
for record in controller['records']:
 raw=(root.parents[1]/record['source']['extracted_file']).read_bytes()
 assert hashlib.sha256(raw).hexdigest()==record['source']['sha256']
 assert c85.read_prefix(raw,record['bodyAnchor'])==record['fields']
 anchor=record['bodyAnchor']
 variants=[raw[:record['fields']['endOffsetExclusive']-1],
           raw[:anchor+372]+struct.pack('<I',0xffffffff)+raw[anchor+376:],
           raw[:anchor+368]+struct.pack('<I',0xffffffff)+raw[anchor+372:]]
 for bad in variants:
  try:c85.read_prefix(bad,anchor)
  except (ValueError,struct.error):prefix_rejected+=1
  else:raise AssertionError('corrupted FNTR controller prefix accepted')
checks['nativeControllerPrefixRecords']=len(controller['records'])
checks['malformedControllerPrefixesRejected']=prefix_rejected
spec=importlib.util.spec_from_file_location('trpa',root/'decode-trap-animation-data.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
lib=root.parents[1]/'libraries/evil-genius-2';d=json.loads((root/'evidence/native-trap-animation-data.json').read_text());clips=json.loads((lib/'assets/animations/clips.json').read_text());clipindex={}
for c in clips:clipindex.setdefault(m.name_hash(c['name']),[]).append(c)
failures=0
references_checked=0
for r in d['records']+d['linkedRecords']:
 raw=(lib/r['source']['path']).read_bytes();parsed=m.parse_record(raw,clipindex);assert parsed==r['parsed'];
 for bad in [raw[:-1],raw[:37]+struct.pack('<I',0xffffffff)+raw[41:],raw[:63]+struct.pack('<I',0xffffffff)+raw[67:]]:
  try:m.parse_record(bad,clipindex)
  except (ValueError,struct.error):failures+=1
  else:raise AssertionError('corrupted TRPA accepted')
checks['boundedMalformedResourcesRejected']=failures
checks['allSelectedResourcesDecoded']=len(d['records'])
checks['linkedDefaultResourcesDecoded']=len(d['linkedRecords'])
for r in d['records']+d['linkedRecords']:
 for g in r['parsed']['groups']:
  for s in g['slots']:
   for phase in s['entries']:
    for ref in phase['clipReferences']:
     assert len(ref['clips'])==1
     assert struct.unpack_from('<I',(lib/r['source']['path']).read_bytes(),ref['offset'])[0]==m.name_hash(ref['clips'][0]['name'])
     references_checked+=1
checks['clipHashReferencesChecked']=references_checked
checks['selectedFiveClipReferences']=d['coverage']['clipReferences']
spec_events=importlib.util.spec_from_file_location('hcan_events',root/'decode-hcan-listeners.py');events=importlib.util.module_from_spec(spec_events);spec_events.loader.exec_module(events)
saved_events=json.loads((root/'evidence/native-hcan-listeners-data.json').read_text())
assert saved_events['decoderSha256']==hashlib.sha256((root/'decode-hcan-listeners.py').read_bytes()).hexdigest()
fresh_events,bank_count,reference_count=events.collect();assert fresh_events==saved_events['records']
malformed_events=0
for record in fresh_events:
 raw=(lib/record['source']).read_bytes();tail=record['tail'];anchor=tail['boneHashEndOffset']
 def altered(offset,value):return raw[:offset]+value+raw[offset+len(value):]
 variants=[raw[:-1],altered(anchor+4,struct.pack('<I',0xffffffff)),altered(tail['listenerCountOffset'],struct.pack('<I',0xffffffff))]
 for listener in tail['listeners']:
  if listener.get('null'):continue
  variants.extend([altered(listener['offset'],struct.pack('<I',3)),
                   altered(listener['serializedSizeOffset'],struct.pack('<I',0xffffffff)),
                   altered(listener['section']['offset']+4,b'\x01')])
 for bad in variants:
  try:events.read_tail(bad,anchor)
  except (ValueError,struct.error):malformed_events+=1
  else:raise AssertionError('malformed HCAN listener tail accepted')
checks['nativeHcanListenerTails']=len(fresh_events)
checks['nativeHcanListenerRecords']=sum(len(r['tail']['listeners']) for r in fresh_events)
checks['malformedHcanListenerTailsRejected']=malformed_events
checks['nativeHcanBaseSections']=sum('base' in l for r in fresh_events for l in r['tail']['listeners'])
vector_records=[l for r in fresh_events for l in r['tail']['listeners'] if l['typeHash']==hex(events.VECTOR)]
for channel in vector_records:
 h=0
 for ch in channel['base']['label']['value'].lower():h=(h*31+ord(ch))&0xffffffff
 assert hex(h)==channel['base']['listenerID'] and channel['base']['eventHash']=='0xd87366dd'
assert struct.unpack('<Q',pe.get_data(0x19e6c98,8))[0]==0x140ad5538
assert struct.unpack('<Q',pe.get_data(0xad5548,8))[0]==0x1400d5220
vt=struct.unpack('<8Q',pe.get_data(0xad55c0,64));assert vt[0]==0x1400b70c0 and vt[6]==0x1400d3cf0
for channel_type,va in events.BASE_VERIFIED.items():
 call=pe.get_data(va-base,5);assert call[0]==0xe8 and va+5+struct.unpack('<i',call[1:])[0]==0x1400d3850
checks['nativeHcanVectorRecordsLinked']=len(vector_records)
bounce=json.loads((root/'evidence/native-bounce-grid-route.json').read_text())
assert bounce['source']['sha256']==hashlib.sha256(b).hexdigest()
assert bounce['generatorSha256']==hashlib.sha256((root/'trace-bounce-grid-source.py').read_bytes()).hexdigest()
for c in bounce['constants']:
 assert pe.get_data(int(c['VA'],16)-base,4)==struct.pack('<f',c['float32'])
for va,target in [(0x140543556,0x140543c10),(0x140543569,0x1405449e0),(0x140544bcb,0x1405453a0)]:
 call=pe.get_data(va-base,5);assert call[0]==0xe8 and va+5+struct.unpack('<i',call[1:])[0]==target
grid_qa=json.loads((root/'evidence/native-grid-transport-qa.json').read_text())
assert grid_qa['codeSha256']==hashlib.sha256((root/'native-grid-transport.js').read_bytes()).hexdigest()
assert grid_qa['testSha256']==hashlib.sha256((root/'test-native-grid-transport.mjs').read_bytes()).hexdigest()
assert grid_qa['allPassed'] and not grid_qa['arenaIntegrated'] and not grid_qa['originalExecuted']
checks['nativeGridConstantsChecked']=len(bounce['constants'])
checks['nativeGridRouteCallsChecked']=3
checks['nativeGridPortChecks']=grid_qa['checks']
spec_config=importlib.util.spec_from_file_location('grid_config',root/'decode-native-grid-config.py');config_parser=importlib.util.module_from_spec(spec_config);spec_config.loader.exec_module(config_parser)
config=json.loads((root/'evidence/native-grid-config.json').read_text())
config_route=json.loads((root/'evidence/native-grid-config-route.json').read_text())
assert config['decoderSha256']==hashlib.sha256((root/'decode-native-grid-config.py').read_bytes()).hexdigest()
assert config_route['generatorSha256']==hashlib.sha256((root/'trace-grid-config-source.py').read_bytes()).hexdigest()
config_raw=(root.parents[1]/config['source']['path']).read_bytes()
assert hashlib.sha256(config_raw).hexdigest()==config['source']['sha256']
fresh_config=config_parser.parse(config_raw);assert fresh_config==config['parsed']
assert config_parser.select(fresh_config)==config['selected']
# Check the package values independently at native-consumed offsets.
assert struct.unpack_from('<f',config_raw,332)[0]==1 and struct.unpack_from('<f',config_raw,284)[0]==3 and struct.unpack_from('<f',config_raw,212)[0]==1
assert struct.unpack_from('<I',config_raw,308)[0]==0x497004c7
assert config['scale']==[1,-3,1] and config['defaultCellType']==0x497004c7
def config_altered(offset,value):return config_raw[:offset]+value+config_raw[offset+len(value):]
config_bad=[config_raw[:-1],config_altered(4,struct.pack('<I',len(config_raw)+1)),config_altered(8,struct.pack('<I',2)),
 config_altered(12,struct.pack('<I',1)),config_altered(16,struct.pack('<I',0xffffffff)),config_altered(24,struct.pack('<I',0xffffffff)),
 config_altered(32,struct.pack('<I',12)),config_altered(36,struct.pack('<I',0)),config_altered(44,struct.pack('<I',0xffffffff)),
 config_altered(64,struct.pack('<I',99)),config_altered(284,struct.pack('<f',float('nan'))),config_altered(328,struct.pack('<I',3)),
 config_altered(20,struct.pack('<I',0)),config_altered(40,struct.pack('<I',1))]
rejected_config=0
for bad in config_bad:
 try:config_parser.select(config_parser.parse(bad))
 except (ValueError,struct.error):rejected_config+=1
 else:raise AssertionError('corrupted or unresolved grid config accepted')
for va,target in [(0x1401284be,0x140113fd0),(0x1401142f3,0x1401105e0),(0x1401143c1,0x14010e700),(0x1405fb772,0x14010e3a0),(0x1405fb78e,0x1405fe100)]:
 call=pe.get_data(va-base,5);assert call[0]==0xe8 and va+5+struct.unpack('<i',call[1:])[0]==target
checks['nativeGridConfigGroups']=sum(len(n['groups']) for n in fresh_config['namespaces'])
checks['nativeGridConfigProperties']=sum(len(g['values']) for n in fresh_config['namespaces'] for g in n['groups'])
checks['nativeGridConfigConsumedValues']=len(config['selected'])
checks['malformedGridConfigurationsRejected']=rejected_config
checks['nativeGridConfigCallsChecked']=5
spec_cells=importlib.util.spec_from_file_location('cell_types',root/'decode-native-cell-types.py');cell_parser=importlib.util.module_from_spec(spec_cells);spec_cells.loader.exec_module(cell_parser)
cells=json.loads((root/'evidence/native-cell-types.json').read_text())
assert grid_qa['cellTypesSha256']==hashlib.sha256((root/'evidence/native-cell-types.json').read_bytes()).hexdigest()
assert cells['decoderSha256']==hashlib.sha256((root/'decode-native-cell-types.py').read_bytes()).hexdigest()
assert cells['blueParserSha256']==config['decoderSha256']
cell_raw=(root.parents[1]/cells['source']['path']).read_bytes()
assert hashlib.sha256(cell_raw).hexdigest()==cells['source']['sha256']
fresh_cells=cell_parser.extract(cell_raw);assert fresh_cells==cells['extracted']
cell_records={r['id']:r for r in fresh_cells['records']}
# Exemplar offsets are checked independently of parser-generated metadata.
assert cell_raw[22390]==1 and cell_raw[31806]==0 and cell_raw[31091]==0
assert cell_raw[22318:22322]==b'Dirt' and cell_raw[38496:38504]==b'Corridor'
assert cell_raw[9270]==1 and cell_raw[9515]==1
assert cell_records['0x497004c7']['constructedCellFlags4a']==132
assert cell_records['0x497004c7']['classifierWithConstructorFlags48']==1
assert cell_records['0x2a5b912a']['constructedCellFlags4a']==4
assert cell_records['0x2a5b912a']['classifierWithConstructorFlags48']==0
assert cell_records['0x430bd860']['constructedCellFlags4a']==196
for record in fresh_cells['records']:
 for name,key in [('resource96',0xafe7e835),('resource98',0xfed53b01)]:
  field=record[name];v=field['property'];assert v['type']==2
  assert struct.unpack_from('<I',cell_raw,v['offset'])[0]==key
  assert struct.unpack_from('<I',cell_raw,v['offset']+16)[0]==2
  assert bool(cell_raw[v['valueOffset']])==field['value']
def cell_altered(offset,value):return cell_raw[:offset]+value+cell_raw[offset+len(value):]
bad_cells=[cell_raw[:-1],cell_altered(20,struct.pack('<I',0)),
 cell_altered(22034+12,struct.pack('<I',0x497004c7)),
 cell_altered(22034+12,struct.pack('<I',0x12345678)),
 cell_altered(30913+12,struct.pack('<I',0x497004c7)),
 cell_altered(72500,struct.pack('<I',1)),cell_altered(22390,b'\x02')]
rejected_cells=0
for bad in bad_cells:
 try:cell_parser.extract(bad)
 except (ValueError,struct.error):rejected_cells+=1
 else:raise AssertionError('corrupt or unresolved cell-type definition accepted')
# Existing false overrides a true parent. A wrong-type property also stops
# ancestry lookup, but the native consumer then defaults to false.
parent_true=cell_altered(31806,b'\x01')
own_false=parent_true[:22390]+b'\x00'+parent_true[22391:]
false_records={r['id']:r for r in cell_parser.extract(own_false)['records']}
assert false_records['0x497004c7']['resource96']['value'] is False
assert false_records['0x2a5b912a']['resource96']['value'] is True
wrong_type=parent_true[:22386]+struct.pack('<I',0)+struct.pack('<I',1)+parent_true[22391:]
wrong_type=wrong_type[:4]+struct.pack('<I',len(wrong_type))+wrong_type[8:]
wrong_records={r['id']:r for r in cell_parser.extract(wrong_type)['records']}
assert wrong_records['0x497004c7']['resource96']['value'] is False
assert wrong_records['0x497004c7']['resource96']['reason']=='missing-or-wrong-type-native-zero'
assert wrong_records['0x2a5b912a']['resource96']['value'] is True
for va,target in [(0x1406948e4,0x140110070),(0x140694904,0x1401101e0),
                  (0x14069492d,0x140662030),(0x140694950,0x140660770),
                  (0x140660b6c,0x14010e3a0),(0x140660bda,0x14010e3a0),(0x1405fba89,0x1405fe100)]:
 call=pe.get_data(va-base,5);assert call[0]==0xe8 and va+5+struct.unpack('<i',call[1:])[0]==target
checks['nativeCellTypeDescendants']=len(fresh_cells['records'])
checks['nativeCellTypeFlagValuesChecked']=len(fresh_cells['records'])*2
checks['malformedCellDefinitionsRejected']=rejected_cells
checks['nativeCellTypeInheritanceChecks']=5
checks['nativeCellTypeCallsChecked']=7
for va,target in [(0x1405d36ae,0x1406024b0),(0x14054540a,0x1405f4820),(0x1405f486c,0x1402c0e60)]:
 call=pe.get_data(va-base,5);assert call[0]==0xe8 and va+5+struct.unpack('<i',call[1:])[0]==target
checks['nativeCellOccupancyCallsChecked']=3
spec_footprints=importlib.util.spec_from_file_location('footprints',root/'decode-native-footprints.py');footprint_parser=importlib.util.module_from_spec(spec_footprints);spec_footprints.loader.exec_module(footprint_parser)
footprints=json.loads((root/'evidence/native-footprints.json').read_text())
assert footprints['decoderSha256']==hashlib.sha256((root/'decode-native-footprints.py').read_bytes()).hexdigest()
assert footprints['prefixParserSha256']==hashlib.sha256((root/'decode-native-controller85.py').read_bytes()).hexdigest()
assert footprints['records']==footprint_parser.collect()
assert grid_qa['footprintsSha256']==hashlib.sha256((root/'evidence/native-footprints.json').read_bytes()).hexdigest()
expected_footprints={'FanTrap':(540,16),'BoxingGlove':(544,8),'BubbleBlower':(548,8),'SoapTrap':(544,4),'LaserWall':(544,16)}
rejected_footprints=0;footprint_fields=0
for record in footprints['records']:
 raw=(root.parents[1]/record['source']['extracted_file']).read_bytes();p=record['parsed']
 at,count=expected_footprints[record['name']]
 assert p['count']['offset']==at and struct.unpack_from('<I',raw,at)[0]==count
 assert len(p['cells'])==count
 for cell in p['cells']:
  for name,fmt in [('planarX','H'),('planarY','H'),('field4','I'),('field0c','I'),('field8','I')]:
   field=cell[name];assert struct.unpack_from('<'+fmt,raw,field['offset'])[0]==field['value'];footprint_fields+=1
  for flag in cell['flags'].values():assert raw[flag['offset']]!=0 if flag['normalizedValue'] else raw[flag['offset']]==0
  assert cell['field4']['value']==0
  assert cell['flags']['0x15']['normalizedValue']==(record['name']=='FanTrap')
 def footprint_altered(offset,value):return raw[:offset]+value+raw[offset+len(value):]
 first=p['cells'][0];env=first['envelope']['offset'];second=p['cells'][1]
 variants=[raw[:p['endOffset']-1],footprint_altered(at,struct.pack('<I',0xffffffff)),
  footprint_altered(env,struct.pack('<H',15)),footprint_altered(env+2,struct.pack('<H',0)),
  footprint_altered(env+4,b'\x01'),footprint_altered(env+5,struct.pack('<I',0xffffffff)),
  footprint_altered(first['list1a']['count']['offset'],struct.pack('<H',0xffff)),
  footprint_altered(second['planarX']['offset'],raw[first['planarX']['offset']:first['planarX']['offset']+4])]
 for bad in variants:
  try:footprint_parser.parse(bad,record['bodyAnchor'])
  except (ValueError,struct.error):rejected_footprints+=1
  else:raise AssertionError('malformed or ambiguous selected footprint accepted')
 # Source-consumer field4 and field8 are independent; no KeepClear inference.
 mutated=footprint_altered(first['field4']['offset'],struct.pack('<I',2))
 parsed=footprint_parser.parse(mutated,record['bodyAnchor'])
 assert parsed['cells'][0]['kindEquals2ForOccupancySetter']
 assert parsed['cells'][0]['field8']==first['field8']
for va,target in [(0x140653580,0x14065da00),(0x140653ce0,0x140658950),
                  (0x140545456,0x1405d2ff0),(0x1405d305a,0x1405d3140)]:
 call=pe.get_data(va-base,5);assert call[0]==0xe8 and va+5+struct.unpack('<i',call[1:])[0]==target
checks['nativeFootprintRecords']=len(footprints['records'])
checks['nativeFootprintCells']=sum(len(r['parsed']['cells']) for r in footprints['records'])
checks['nativeFootprintFieldsChecked']=footprint_fields
checks['malformedFootprintsRejected']=rejected_footprints
checks['nativeFootprintCallsChecked']=4
state_qa=json.loads((root/'evidence/native-trap-state-qa.json').read_text())
assert state_qa['allPassed'] and not state_qa['arenaIntegrated'] and not state_qa['originalExecuted']
for key,path in [('sourceRouteSha256','evidence/native-grid-config-route.json'),('codeSha256','native-trap-state.js'),('testSha256','test-native-trap-state.mjs')]:
 assert state_qa[key]==hashlib.sha256((root/path).read_bytes()).hexdigest()
state_fields=0
for config in config_route['trapConfigs']:
 prior=next(r for r in rules['trap_records'] if r['record']==config['name'])
 assert config['source']==prior['origin'] and config['bodyAnchor']==prior['alignment_boundary']
 raw=(root.parents[1]/config['source']['extracted_file']).read_bytes()
 assert hashlib.sha256(raw).hexdigest()==config['source']['sha256']
 for state,field,delta in [(2,'0x160',288),(3,'0x158',280),(4,'0x164',292),(5,'0x15c',284),(6,'0x168',296)]:
  row=next(v for v in config['thresholds'] if v['state']==state)
  offset=config['bodyAnchor']+delta
  assert row['offset']==offset and row['field']==field and row['bytes']==raw[offset:offset+4].hex()
  assert row['value']==config['fields'][field]==struct.unpack_from('<f',raw,offset)[0];state_fields+=1
 flag=config['flag18f'];assert flag['offset']==config['bodyAnchor']+330
 assert flag['raw']==raw[flag['offset']] and flag['value']==int(raw[flag['offset']]!=0)
 assert config['flag18c'] is None
assert struct.unpack('<10I',pe.get_data(0x619b70,40))==(0x619b44,0x619b44,0x619b39,0x619b0e,0x619b14,0x619b44,0x619b44,0x619b67,0x619b48,0x619b44)
assert struct.unpack('<8I',pe.get_data(0x619c30,32))==(0x619be4,0x619bd1,0x619bee,0x619bf8,0x619c02,0x619c27,0x619c0c,0x619bdb)
for va,value in [(0x140b4b530,1e30),(0x140b4b360,5),(0x140b4b024,.1),(0x140b4b224,1)]:
 assert pe.get_data(va-base,4)==struct.pack('<f',value)
for va,target in [(0x1405d6796,0x140612590),(0x1405d68b1,0x140618240),
                  (0x140613dc3,0x1405cfa60),(0x140613dee,0x140619ba0),
                  (0x140613e13,0x140619af0),(0x140613e47,0x140618240),
                  (0x140618529,0x140618080),(0x1406176bb,0x140613000),
                  (0x14061776b,0x140615210),(0x140617802,0x140618080),
                  (0x14061820a,0x140618240)]:
 call=pe.get_data(va-base,5);assert call[0]==0xe8 and va+5+struct.unpack('<i',call[1:])[0]==target
checks['nativeTrapThresholdFieldsChecked']=state_fields
checks['nativeTrapNextFlagsRead']=len(config_route['trapConfigs'])
checks['nativeTrapStateCallsChecked']=11
checks['nativeTrapStatePortChecks']=state_qa['checks']
hcan=json.loads((root/'evidence/hcan-research.json').read_text());checks['hcanSourceReportHashCurrent']=hcan['originalCodeEvidence']['reportSha256']==hashlib.sha256((root/'evidence/native-animation-code.json').read_bytes()).hexdigest()
contract=json.loads((root/'evidence/fidelity-reference.json').read_text());checks['sealedCasesInventoried']=len(contract['cases']);checks['nativeUnitsKnown']=contract['coverage']['nativeStateThresholdsWithProvenUnits'];assert all(checks.values())
(root/'evidence/native-source-audit.json').write_text(json.dumps({'schema':'eg2-native-source-audit/1','originalExecuted':False,'checks':checks,'scope':'Original executable bytes and source decoding; not native runtime equivalence'},indent=2)+'\n');print(json.dumps(checks))
