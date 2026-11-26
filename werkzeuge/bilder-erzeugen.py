#!/usr/bin/env python3
"""Erzeugt zusätzliche Bildgrössen und moderne Formate für die Adera-Website.

Was es macht (für jedes Foto NAME.jpg, das eine NAME-900.jpg-Version hat):
  NAME-600.jpg   600 px breit  (Karten und Galerie auf normalen Bildschirmen)
  NAME-1200.jpg  1200 px breit (Hero/grosse Bilder auf Handys mit 3x-Bildschirm)
  NAME-600.avif, NAME-900.avif, NAME-1200.avif, NAME.avif  (AVIF, rund 50 % kleiner)
  mit --webp zusätzlich dieselben Grössen als .webp

Bestehende Dateien werden nie überschrieben (ausser mit --force). Die Originale bleiben unverändert.

Aufruf (Python 3.9+, Pillow 11.3 oder neuer mit AVIF):
  pip install --upgrade pillow
  python3 bilder-erzeugen.py --src website/assets/img --out website/assets/img
  python3 bilder-erzeugen.py --src website/assets/img --out /tmp/test --only team-baustelle   # zum Ausprobieren

Danach die Bilder im Browser ansehen (Qualität prüfen) und erst dann im HTML einbinden,
siehe Audit-Bericht (srcset mit -600/-1200, <picture> mit AVIF).
"""
import argparse
import os
import sys

from PIL import Image, features

JPEG_Q, AVIF_Q, WEBP_Q = 80, 55, 78


def save(im, path, fmt, force):
    if os.path.exists(path) and not force:
        return 'vorhanden'
    if fmt == 'JPEG':
        im.save(path, 'JPEG', quality=JPEG_Q, optimize=True, progressive=True, subsampling='4:2:0')
    elif fmt == 'AVIF':
        im.save(path, 'AVIF', quality=AVIF_Q, speed=6)
    else:
        im.save(path, 'WEBP', quality=WEBP_Q, method=5)
    return f'{os.path.getsize(path) // 1024} KB'


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--src', required=True, help='Ordner mit den Originalen (assets/img)')
    ap.add_argument('--out', required=True, help='Zielordner')
    ap.add_argument('--webp', action='store_true', help='zusätzlich WebP erzeugen')
    ap.add_argument('--force', action='store_true', help='bestehende Dateien überschreiben')
    ap.add_argument('--only', help='nur dieses Bild (Name ohne .jpg)')
    a = ap.parse_args()
    if not features.check('avif'):
        sys.exit('Pillow ohne AVIF-Unterstützung. Bitte "pip install --upgrade pillow" (11.3 oder neuer).')
    os.makedirs(a.out, exist_ok=True)
    names = sorted(f[:-4] for f in os.listdir(a.src)
                   if f.endswith('.jpg') and not f.endswith('-900.jpg') and os.path.exists(os.path.join(a.src, f[:-4] + '-900.jpg')))
    if a.only:
        names = [n for n in names if n == a.only]
    for name in names:
        with Image.open(os.path.join(a.src, name + '.jpg')) as big:
            big = big.convert('RGB')
            w, h = big.size
            jobs = []
            for width in (600, 1200):
                if width < w:
                    jobs.append((width, big.resize((width, round(h * width / w)), Image.LANCZOS), True))
            with Image.open(os.path.join(a.src, name + '-900.jpg')) as m:
                jobs.append((900, m.convert('RGB'), False))
            jobs.append((w, big, False))
            for width, im, new_jpeg in jobs:
                suffix = '' if width == w else f'-{width}'
                out = []
                if new_jpeg:
                    out.append('jpg ' + save(im, os.path.join(a.out, f'{name}{suffix}.jpg'), 'JPEG', a.force))
                out.append('avif ' + save(im, os.path.join(a.out, f'{name}{suffix}.avif'), 'AVIF', a.force))
                if a.webp:
                    out.append('webp ' + save(im, os.path.join(a.out, f'{name}{suffix}.webp'), 'WEBP', a.force))
                print(f'{name}{suffix:6} {width:5}px  ' + ', '.join(out))


if __name__ == '__main__':
    main()
