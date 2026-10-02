#!/usr/bin/env python3
"""Inspeção estática, somente leitura. Não lança nem simula Evil Genius 2.

Uso: python3 prototypes/evil-genius-2-trap-arena/probe.py
Saída 0 = leitura válida; saída 2 = fonte ausente/divergente/ilegível.
Nenhuma saída deste script significa runtime ou cadeia aprovados.
"""
import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import platform
import re
import shutil
import struct
import sys
from datetime import datetime, timezone

HERE = Path(__file__).resolve().parent
WORKSPACE = HERE.parents[1]
LIBRARY = WORKSPACE / 'libraries/evil-genius-2'
TRAPS = ['Giant Fan', 'Boxing Glove', 'Bubble Cannon', 'Slippery Floor', 'Laser Wall']
MANIFEST_LINE = re.compile(r'^\s*(\d+)\s+\d+\s+([0-9a-f]{40})\s+\d+\s+(.+?)\s*$')


def digest(path, algorithm='sha256'):
    h = hashlib.new(algorithm)
    with path.open('rb') as fh:
        for block in iter(lambda: fh.read(4 * 1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def inspect_exe(path):
    with path.open('rb') as fh:
        header = fh.read(64)
        if header[:2] != b'MZ':
            raise ValueError('assinatura DOS ausente')
        fh.seek(struct.unpack_from('<I', header, 60)[0])
        pe = fh.read(26)
    if pe[:4] != b'PE\0\0':
        raise ValueError('assinatura PE ausente')
    return {'format': 'PE', 'machine': hex(struct.unpack_from('<H', pe, 4)[0]),
            'optional_header_magic': hex(struct.unpack_from('<H', pe, 24)[0]),
            'architecture': 'x86_64' if pe[4:6] == b'd\x86' else 'unknown',
            'bytes': path.stat().st_size, 'sha1': digest(path, 'sha1'),
            'sha256': digest(path)}


def host():
    commands = {name: bool(shutil.which(name)) for name in
                ['wine', 'wine64', 'cxrun', 'whisky', 'prlctl',
                 'qemu-system-x86_64', 'qemu-system-aarch64', 'virsh', 'utmctl']}
    roots = [Path('/Applications'), Path.home() / 'Applications',
             Path('/opt/homebrew/Cellar'), Path('/opt/homebrew/Caskroom'),
             Path.home() / 'Library/Application Support']
    candidates = []
    for root in roots:
        for p in root.glob('*'):
            if re.search(r'crossover|whisky|wine|parallels|vmware|^utm(?:\.app)?$', p.name, re.I):
                candidates.append(p.name)
    return {'system': platform.system(), 'machine': platform.machine(),
            'release': platform.release(), 'commands_present': commands,
            'compatibility_candidates': sorted(set(candidates)),
            'scope': 'PATH e pastas padrão; não é busca integral do disco',
            'native_windows_host': platform.system() == 'Windows'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, default=Path(os.environ.get(
        'EG2_ROOT', '~/Games/SteamReferences/evil-genius-2')).expanduser())
    parser.add_argument('--out', type=Path, default=HERE / 'evidence/static-probe.json')
    args = parser.parse_args()
    source = args.source.expanduser().resolve()
    output = args.out.resolve()
    if output.is_relative_to(source) or output.is_relative_to(LIBRARY.resolve()):
        parser.error('a saída não pode alterar a fonte nem a biblioteca')
    result = {'schema': 'eg2-original-experiment-static/1',
              'recorded_at_utc': datetime.now(timezone.utc).isoformat(),
              'source_label': 'EG2_ROOT', 'host': host(), 'errors': [],
              'original_execution': {'launched': False, 'scenario_control': 'not_tested',
                                     'enemy_control': 'not_tested', 'device_control': 'not_tested',
                                     'five_trap_chain': 'not_tested'},
              'reconstruction': {'engine': False, 'gameplay': False, 'save_generated': False},
              'executables': [], 'native_text': []}
    manifests = {}
    for mf in sorted(source.glob('manifest_*.txt')):
        for line in mf.read_text().splitlines():
            match = MANIFEST_LINE.match(line)
            if match:
                size, sha1, name = match.groups()
                manifests[name] = {'bytes': int(size), 'sha1': sha1, 'manifest': mf.name}
    names = ['bin/evilgenius_dx12.exe', 'bin/evilgenius_vulkan.exe']
    for name in names:
        try:
            info = inspect_exe(source / name)
            info['file'] = name
            info['manifest'] = manifests.get(name)
            info['manifest_matches'] = bool(info['manifest']) and all(
                info[k] == info['manifest'][k] for k in ('bytes', 'sha1'))
            if not info['manifest_matches']:
                result['errors'].append(f'manifesto divergente/ausente: {name}')
            result['executables'].append(info)
        except (OSError, ValueError, struct.error) as exc:
            result['errors'].append(f'{name}: {type(exc).__name__}')
    # Reusa o leitor existente: extrai de novo da fonte, sem confiar só no catálogo.
    reader = LIBRARY / 'adapter/asura.py'
    sys.dont_write_bytecode = True
    spec = importlib.util.spec_from_file_location('eg2_asura_readonly', reader)
    asura = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(asura)
    result['reader'] = {'file': 'libraries/evil-genius-2/adapter/asura.py',
                        'sha256': digest(reader)}
    selectors = {
        'furniture': lambda s: s in TRAPS or any(t in s for t in
            ('bubble', 'float', 'slippery', 'boxing', 'push', 'lasers')),
        'menu': lambda s: s in TRAPS or any(t in s.lower() for t in
            ('sandbox', 'spawn agent', 'combo giant fan', 'combo bubble',
             '3 different traps', 'save game', 'load game', 'toggle power')),
        'objective': lambda s: ('wave of' in s.lower() and any(t in s for t in
            ('Investigators', 'Rogues', 'Saboteurs', 'Soldiers'))),
        'inputs': lambda s: s in ('Open Build Menu', 'Move Item', 'Rotate Item Left',
                                  'Rotate Item Right', 'Toggle Power', 'Pause Time'),
        'tutorial': lambda s: 'Durability' in s and 'Trap' in s,
        'eventlog': lambda s: 'trap' in s.lower() and 'trigger' in s.lower(),
    }
    for table, select in selectors.items():
        name = f'text/pc/{table}/{table}.asr_en'
        try:
            path = source / name
            _kind, fh, _size = asura.open_container(path)
            with fh:
                fh.seek(0)
                parsed = asura.parse_htxt(fh.read())
            entries = []
            for i, (key, raw) in enumerate(parsed['entradas']):
                clean = asura.limpo(raw)
                if select(clean) or (table == 'furniture' and i in {693, 695, 699, 713, 727}):
                    entries.append({'index': i, 'localization_hash': key, 'text': clean,
                                    'classification': 'extracted_data_not_runtime'})
            result['native_text'].append({'file': name, 'sha256': digest(path),
                                          'total_entries': parsed['contagem'], 'selected': entries})
        except (OSError, ValueError, TypeError, struct.error) as exc:
            result['errors'].append(f'{name}: {type(exc).__name__}')
    found = {e['text'] for t in result['native_text'] for e in t['selected']}
    result['trap_names_found'] = {t: t in found for t in TRAPS}
    if not all(result['trap_names_found'].values()):
        result['errors'].append('faltam nomes das cinco armadilhas nos textos selecionados')
    h = result['host']
    result['runtime_readiness'] = ('candidate_environment_not_tested'
        if h['native_windows_host'] or any(h['commands_present'].values()) or h['compatibility_candidates']
        else 'blocked_no_compatible_runtime_identified')
    result['static_inspection'] = 'fail' if result['errors'] else 'pass'
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({k: result[k] for k in ['static_inspection', 'runtime_readiness',
        'trap_names_found', 'original_execution', 'errors']}, ensure_ascii=False))
    return 2 if result['errors'] else 0


if __name__ == '__main__':
    raise SystemExit(main())
