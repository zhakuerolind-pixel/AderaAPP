"""Erzeugt sitemap.xml aus den HTML-Dateien (kanonische URL, lastmod = Dateidatum, Bilder der Projektseite).
Aufruf: venv/bin/python -I gen_sitemap.py <website-dir> <out-file>
"""
import datetime
import os
import sys
from xml.sax.saxutils import escape

import html5lib

ROOT, OUT = sys.argv[1], sys.argv[2]
NS = '{http://www.w3.org/1999/xhtml}'
SITE = 'https://www.aderapartner.ch/'
ORDER = ['index.html', 'heizung.html', 'lueftung.html', 'sanitaer.html', 'badumbau.html', 'planung.html', 'service.html',
         'projekte.html', 'unternehmen.html', 'jobs.html', 'kontakt.html', 'impressum.html', 'datenschutz.html']

lines = ['<?xml version="1.0" encoding="UTF-8"?>',
         '<!-- sitemap.xml fuer www.aderapartner.ch: ins Hauptverzeichnis legen. Neue Seite = neuer <url>-Eintrag; '
         'nach groesseren Textaenderungen <lastmod> anpassen. Die 404-Seite gehoert nicht hinein. -->',
         '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">']
for p in ORDER:
    path = os.path.join(ROOT, p)
    doc = html5lib.parse(open(path, encoding='utf-8').read())
    canon = next((l.get('href') for l in doc.iter(f'{NS}link') if l.get('rel') == 'canonical'), None)
    if not canon:
        raise SystemExit('kein canonical in ' + p)
    robots = next((m.get('content') for m in doc.iter(f'{NS}meta') if m.get('name') == 'robots'), '') or ''
    if 'noindex' in robots:
        continue
    lastmod = datetime.date.fromtimestamp(os.path.getmtime(path)).isoformat()
    lines.append('  <url>')
    lines.append(f'    <loc>{escape(canon)}</loc>')
    lines.append(f'    <lastmod>{lastmod}</lastmod>')
    if p == 'projekte.html':
        seen = set()
        for a in doc.iter(f'{NS}a'):
            href = a.get('href') or ''
            if href.startswith('assets/img/') and href.endswith('.jpg') and href not in seen:
                seen.add(href)
                lines.append(f'    <image:image><image:loc>{SITE}{escape(href)}</image:loc></image:image>')
    lines.append('  </url>')
lines.append('</urlset>')
open(OUT, 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
print('ok', OUT, sum(1 for l in lines if '<loc>' in l), 'URLs', sum(1 for l in lines if 'image:loc' in l), 'Bilder')
