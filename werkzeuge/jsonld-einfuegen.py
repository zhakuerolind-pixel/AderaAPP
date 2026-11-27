"""Strukturierte Daten (JSON-LD für Google) für jede Seite erzeugen und in den <head> einsetzen.

Erzeugt aus dem aktuellen HTML: Firma (HVACBusiness/Plumber), Website, Seite, Brotkrümel,
Angebot (Service) und Fragen (FAQPage, wortgleich mit dem sichtbaren Text).
Nach Textänderungen (Titel, Beschreibung, Fragen/Antworten) einfach erneut ausführen.

Aufruf:
    pip install html5lib
    python3 jsonld-einfuegen.py ../website
"""
import json
import os
import re
import sys

import html5lib

ROOT = sys.argv[1]
NS = '{http://www.w3.org/1999/xhtml}'
SITE = 'https://www.aderapartner.ch/'
ORG = SITE + '#organization'
WEB = SITE + '#website'
DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
START = '<!-- JSON-LD: automatisch erzeugt mit werkzeuge/jsonld-einfuegen.py -->'
END = '<!-- /JSON-LD -->'

SERVICES = {
    'heizung.html': ('Heizung und Wärmepumpen', 'Heizungsersatz und Wärmepumpen'),
    'lueftung.html': ('Lüftung', 'Lüftungsanlagen und Komfortlüftung'),
    'sanitaer.html': ('Sanitär', 'Sanitärinstallationen'),
    'badumbau.html': ('Badumbau', 'Badumbau'),
    'planung.html': ('Planung Heizung, Lüftung, Sanitär', 'Haustechnik-Planung'),
    'service.html': ('Service und Wartung', 'Reparatur, Wartung und 24h-Störungsdienst'),
}
PAGETYPE = {'kontakt.html': 'ContactPage', 'unternehmen.html': 'AboutPage', 'projekte.html': 'CollectionPage'}


def txt(el):
    return re.sub(r'\s+', ' ', ''.join(el.itertext())).replace('­', '').strip()


def absu(href):
    if href in ('index.html', './', '/'):
        return SITE
    if href.startswith('index.html#'):
        return SITE + href[len('index.html'):]
    if href.startswith('http'):
        return href
    return SITE + href.lstrip('/')


def organization():
    return {
        '@type': ['HVACBusiness', 'Plumber'],
        '@id': ORG,
        'name': 'Adera Partner GmbH',
        'legalName': 'Adera Partner GmbH',
        'url': SITE,
        'logo': {'@type': 'ImageObject', 'url': SITE + 'assets/img/logo-adera-partner.svg'},
        'image': [SITE + 'assets/img/og/og-index.jpg', SITE + 'assets/img/service-technik.jpg', SITE + 'assets/img/heizraum.jpg'],
        'description': 'Haustechnik-Betrieb aus Spreitenbach: Heizung, Wärmepumpen, Lüftung, Sanitär, Badumbau, Planung und 24h-Service im Limmattal.',
        'telephone': '+41 56 402 10 00',
        'email': 'info@aderapartner.ch',
        'address': {'@type': 'PostalAddress', 'streetAddress': 'Industriestrasse 107', 'postalCode': '8957',
                    'addressLocality': 'Spreitenbach', 'addressRegion': 'AG', 'addressCountry': 'CH'},
        'hasMap': 'https://www.google.com/maps/search/?api=1&query=Industriestrasse+107%2C+8957+Spreitenbach',
        'areaServed': [{'@type': 'City', 'name': 'Spreitenbach'}, {'@type': 'Place', 'name': 'Limmattal'}],
        'foundingDate': '2022-01',
        'founder': [{'@type': 'Person', 'name': 'Erolind Zhaku'}, {'@type': 'Person', 'name': 'Tosum Zhaku'}],
        'vatID': 'CHE-190.687.776 MWST',
        'identifier': {'@type': 'PropertyValue', 'propertyID': 'UID', 'value': 'CHE-190.687.776'},
        'memberOf': {'@type': 'Organization', 'name': 'suissetec', 'url': 'https://suissetec.ch/'},
        'knowsAbout': ['Heizung', 'Wärmepumpen', 'Heizungsersatz', 'Lüftung', 'Komfortlüftung', 'Sanitär', 'Badumbau',
                       'Haustechnik-Planung', 'Boiler'],
        'contactPoint': [
            {'@type': 'ContactPoint', 'contactType': 'customer service', 'telephone': '+41 56 402 10 00',
             'email': 'info@aderapartner.ch', 'availableLanguage': 'de', 'areaServed': 'CH'},
            {'@type': 'ContactPoint', 'contactType': 'emergency', 'name': '24h-Service bei Störungen',
             'telephone': '+41 56 402 10 00', 'availableLanguage': 'de', 'areaServed': 'CH',
             'hoursAvailable': {'@type': 'OpeningHoursSpecification',
                                'dayOfWeek': ['https://schema.org/' + d for d in DAYS], 'opens': '00:00', 'closes': '23:59'}},
        ],
        'hasOfferCatalog': {'@type': 'OfferCatalog', 'name': 'Angebot der Adera Partner GmbH', 'itemListElement': [
            {'@type': 'Offer', 'itemOffered': {'@type': 'Service', '@id': SITE + p + '#service', 'name': n, 'url': SITE + p}}
            for p, (n, _) in SERVICES.items()]},
        'sameAs': ['https://www.linkedin.com/company/adera-partner-gmbh/'],
    }


def website():
    return {'@type': 'WebSite', '@id': WEB, 'url': SITE, 'name': 'Adera Partner GmbH', 'inLanguage': 'de-CH',
            'publisher': {'@id': ORG}}


def dump(obj):
    s = json.dumps(obj, ensure_ascii=False, indent=2)
    json.loads(s)
    return s.replace('</', '<\\/')   # kein «</script>» im JSON


def build(p, doc):
    title = txt(doc.find(f'.//{NS}title'))
    desc = next((m.get('content') for m in doc.iter(f'{NS}meta') if m.get('name') == 'description'), None)
    canon = next((l.get('href') for l in doc.iter(f'{NS}link') if l.get('rel') == 'canonical'), absu(p))
    og = next((m.get('content') for m in doc.iter(f'{NS}meta') if m.get('property') == 'og:image'), None)
    hero = doc.find(f'.//{NS}div[@class="hero__media"]//{NS}img')
    image = absu(hero.get('src')) if hero is not None else og
    graph = [organization(), website()]
    page = {'@type': PAGETYPE.get(p, 'WebPage'), '@id': canon + '#webpage', 'url': canon, 'name': title,
            'description': desc, 'inLanguage': 'de-CH', 'isPartOf': {'@id': WEB}, 'about': {'@id': ORG}}
    if image:
        page['primaryImageOfPage'] = {'@type': 'ImageObject', 'url': image}
    bc = None
    for nav in doc.iter(f'{NS}nav'):
        if 'breadcrumb' in (nav.get('class') or ''):
            bc = nav
    if bc is not None:
        items = []
        for i, li in enumerate(bc.iter(f'{NS}li'), 1):
            a = li.find(f'{NS}a')
            items.append({'@type': 'ListItem', 'position': i, 'name': txt(li),
                          'item': absu(a.get('href')) if a is not None else canon})
        graph.append({'@type': 'BreadcrumbList', '@id': canon + '#breadcrumb', 'itemListElement': items})
        page['breadcrumb'] = {'@id': canon + '#breadcrumb'}
    if p in SERVICES:
        name, stype = SERVICES[p]
        svc = {'@type': 'Service', '@id': canon + '#service', 'name': name, 'serviceType': stype, 'description': desc,
               'url': canon, 'provider': {'@id': ORG},
               'areaServed': [{'@type': 'City', 'name': 'Spreitenbach'}, {'@type': 'Place', 'name': 'Limmattal'}]}
        if image:
            svc['image'] = image
        graph.append(svc)
        page['mainEntity'] = {'@id': canon + '#service'}
    if p in ('kontakt.html', 'unternehmen.html'):
        page['mainEntity'] = {'@id': ORG}
    graph.insert(2, page)
    faqs = []
    for det in doc.iter(f'{NS}details'):
        s = det.find(f'{NS}summary')
        ans = det.find(f'{NS}div')
        if s is None or ans is None:
            continue
        faqs.append({'@type': 'Question', 'name': txt(s), 'acceptedAnswer': {'@type': 'Answer', 'text': txt(ans)}})
    out = START + '\n  <script type="application/ld+json">\n' + dump({'@context': 'https://schema.org', '@graph': graph}) + '\n  </script>\n'
    if faqs:
        out += '  <script type="application/ld+json">\n' + dump({'@context': 'https://schema.org', '@type': 'FAQPage',
                                                                   '@id': canon + '#faq', 'isPartOf': {'@id': canon + '#webpage'},
                                                                   'mainEntity': faqs}) + '\n  </script>\n'
    return out + '  ' + END, len(graph), len(faqs)


def main():
    for p in sorted(f for f in os.listdir(ROOT) if f.endswith('.html') and f != '404.html'):
        path = os.path.join(ROOT, p)
        full = open(path, encoding='utf-8').read()
        block, ng, nf = build(p, html5lib.parse(full))
        if START in full and END in full:
            a, b = full.index(START), full.index(END) + len(END)
            full = full[:a] + block + full[b:]
        else:
            full = re.sub(r'\s*<script type="application/ld\+json">.*?</script>', '', full, flags=re.S)
            full = full.replace('</head>', '  ' + block + '\n</head>', 1)
        open(path, 'w', encoding='utf-8').write(full)
        print(f'{p}: {ng} Einträge, {nf} Fragen')


if __name__ == '__main__':
    main()
