#!/usr/bin/env python3
"""Build an allowlisted plugin ZIP without credentials or local draft files."""

import json
from pathlib import Path
import re
import struct
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo


ROOT = Path(__file__).resolve().parents[1]


def build():
    manifest = json.loads((ROOT / 'plugin.json').read_text())
    name, version = manifest['name'], manifest['version']
    if not re.fullmatch(r'[a-z0-9-]+', name):
        raise ValueError('Invalid plugin name.')
    if not re.fullmatch(r'\d+\.\d+\.\d+', version):
        raise ValueError('Invalid plugin version.')

    extension = manifest['extensions']['com.openai']
    listing = extension['interface']
    for field, limit in [('displayName', 30), ('shortDescription', 30),
                         ('longDescription', 4000), ('developerName', 80)]:
        if not 0 < len(listing[field]) <= limit:
            raise ValueError(f'Invalid listing field: {field}')
    cases = extension['review']['test_cases']
    if len(cases['positive']) != 5 or len(cases['negative']) != 3:
        raise ValueError('Review requires five positive and three negative cases.')

    files = [ROOT / name for name in ['plugin.json', 'mcp.json', 'LICENSE']]
    for directory in ['assets', 'skills/freevideogenerator']:
        files.extend(path for path in (ROOT / directory).rglob('*') if path.is_file())

    for field in ['logo', 'composerIcon']:
        relative = listing[field]
        if not relative.startswith('./'):
            raise ValueError('Asset paths must start with ./')
        asset = ROOT / relative
        if asset not in files:
            raise ValueError('A declared icon is missing from the package.')
        data = asset.read_bytes()
        if data[:8] != b'\x89PNG\r\n\x1a\n':
            raise ValueError('The bundled icon must be a PNG.')
        width, height = struct.unpack('>II', data[16:24])
        if width != height or not 48 <= width <= 4096 or len(data) > 5 * 1024**2:
            raise ValueError('The bundled icon does not meet size requirements.')

    destination = ROOT / 'dist' / f'{name}-plugin-{version}.zip'
    destination.parent.mkdir(exist_ok=True)
    with ZipFile(destination, 'w', compression=ZIP_DEFLATED, compresslevel=9) as archive:
        for path in sorted(set(files)):
            if path.is_symlink() or not path.resolve().is_relative_to(ROOT):
                raise ValueError('Package entries must be regular local files.')
            relative = path.relative_to(ROOT).as_posix()
            entry = ZipInfo(relative, date_time=(2026, 1, 1, 0, 0, 0))
            entry.compress_type = ZIP_DEFLATED
            entry.external_attr = 0o100644 << 16
            archive.writestr(entry, path.read_bytes())

    with ZipFile(destination) as archive:
        if archive.testzip() is not None:
            raise ValueError('Plugin archive verification failed.')
        print(f'Built {destination} ({len(archive.namelist())} files).')
    if not extension['review'].get('demo_recording_url'):
        print('A real reviewer-accessible walkthrough URL is still required before review submission.')


if __name__ == '__main__':
    build()
