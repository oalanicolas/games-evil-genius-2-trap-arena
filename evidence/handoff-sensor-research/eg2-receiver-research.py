import pathlib,pefile,capstone,struct,re,bisect,json
p=pathlib.Path.home()/'Games/SteamReferences/evil-genius-2/bin/evilgenius_vulkan.exe';raw=p.read_bytes();pe=pefile.PE(data=raw,fast_load=True);base=pe.OPTIONAL_HEADER.ImageBase;md=capstone.Cs(capstone.CS_ARCH_X86,capstone.CS_MODE_64);md.detail=True
pdata=pe.OPTIONAL_HEADER.DATA_DIRECTORY[3]; buf=pe.get_data(pdata.VirtualAddress,pdata.Size);functions=sorted((base+a,base+b) for a,b,c in struct.iter_unpack('<III',buf[:len(buf)//12*12]) if a and b>a);starts=[a for a,b in functions]
def bounds(va):
 i=bisect.bisect_right(starts,va)-1
 return functions[i] if i>=0 and functions[i][1]>va else None
def dump(name,a,b):
 ins=list(md.disasm(pe.get_data(a-base,b-a),a));pathlib.Path('/tmp/eg2-'+name+'.asm').write_text('\n'.join(f'{i.address:#x}: {i.bytes.hex()} {i.mnemonic} {i.op_str}' for i in ins));print(name,hex(a),hex(b),len(ins))
if __name__=='__main__':
 for name,va in [('event-delivery',0x1400b8ae0),('event-enqueue',0x1400b8ed0),('event-subscribe',0x1400b84b0)]:
  f=bounds(va); print('bounds',name,f);dump(name,*(f or (va,va+0x250)))
 rows=[]
 for s in pe.sections:
  if not s.Characteristics&0x20000000:continue
  data=raw[s.PointerToRawData:s.PointerToRawData+s.SizeOfRawData];sv=base+s.VirtualAddress
  for value in [0xf05c69fc,0xd87366dd,0xa94eda8d,0x9165d76e]:
   for m in re.finditer(re.escape(struct.pack('<I',value)),data):
    va=sv+m.start();f=bounds(va)
    if f:
     instr=next((i for i in md.disasm(pe.get_data(f[0]-base,f[1]-f[0]),f[0]) if i.address<=va<i.address+i.size),None)
     rows.append({'value':hex(value),'va':hex(va),'function':list(map(hex,f)),'instruction':None if instr is None else f'{instr.address:#x} {instr.mnemonic} {instr.op_str}'})
    else:rows.append({'value':hex(value),'va':hex(va),'function':None})
 pathlib.Path('/tmp/eg2-vector-receiver-candidates.json').write_text(json.dumps(rows,indent=2));print(json.dumps(rows,indent=2))
