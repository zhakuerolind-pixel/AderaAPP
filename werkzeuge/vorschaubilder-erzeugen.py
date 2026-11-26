"""Vorschaubilder 1200x630 je Seite aus dem Hero-Bild (object-position wird berücksichtigt)."""
import os, re, sys
from PIL import Image
ROOT = sys.argv[1]; IMG = os.path.join(ROOT, 'assets', 'img'); OUT = os.path.join(IMG, 'og')
os.makedirs(OUT, exist_ok=True)
for f in sorted(x for x in os.listdir(ROOT) if x.endswith('.html') and x not in ('index.html', '404.html')):
    s = open(os.path.join(ROOT, f), encoding='utf-8').read()
    m = re.search(r'<div class="hero__media">\s*(?:<picture>.*?)?<img[^>]*?src="assets/img/([a-z0-9-]+?)(?:-(?:600|900|1200))?\.jpg"([^>]*)>', s, re.S)
    if not m:
        print(f, '-> kein Hero-Bild, nutzt og-index'); continue
    name, rest = m.group(1), m.group(2)
    pos = re.search(r'object-position:\s*([\d.]+)%\s+([\d.]+)%', rest)
    px, py = (float(pos.group(1)) / 100, float(pos.group(2)) / 100) if pos else (.5, .5)
    im = Image.open(os.path.join(IMG, name + '.jpg')).convert('RGB')
    W, H = im.size; ratio = 1200 / 630
    if W / H > ratio:
        cw, ch = round(H * ratio), H
    else:
        cw, ch = W, round(W / ratio)
    x = round((W - cw) * px); y = round((H - ch) * py)
    crop = im.crop((x, y, x + cw, y + ch)).resize((1200, 630), Image.LANCZOS)
    crop.save(os.path.join(OUT, f'og-{f[:-5]}.jpg'), quality=82, optimize=True, progressive=True)
    print(f, '->', name, f'({px:.2f},{py:.2f})')
