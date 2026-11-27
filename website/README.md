# Website Adera Partner GmbH – Übergabe

Stand: 26. November 2026. Für Ivan (Informatik) zur Übernahme, Livegang und Pflege.

Statische Website (HTML, CSS, JavaScript ohne Bibliotheken) mit einem Kontaktformular in PHP.
Kein CMS, keine Datenbank, keine Cookies, keine Analyse- oder Trackingdienste, keine externen Schriften.
Externe Inhalte gibt es nur nach einem Klick: die Google-Karte («Karte laden») und Links (Google Maps, LinkedIn, Förderstellen).

---

## 1. Was ist im Paket

```
website/                      → gehört auf den Webserver (Hauptverzeichnis der Domain)
  index.html                  Startseite
  heizung.html lueftung.html sanitaer.html badumbau.html planung.html service.html   Angebot
  kostenrechner.html          Kostenrechner: Reparatur und Ersatz, Heizungsersatz (Preise in main.js, Abschnitt 6)
  projekte.html               Galerie mit Filter und Grossansicht (21 ausgewählte eigene Projektfotos)
  unternehmen.html jobs.html kontakt.html
  impressum.html datenschutz.html 404.html
  send.php                    Versand des Kontaktformulars per E-Mail
  robots.txt  sitemap.xml
  .htaccess.livegang          Server-Einstellungen, erst beim Livegang in .htaccess umbenennen (Abschnitt 3)
  README.md                   diese Anleitung (wird durch .htaccess gesperrt, darf aber auch weggelassen werden)
  assets/css/style.css        Gestaltung aller Seiten
  assets/js/main.js           Navigation, Anfrage-Assistent, Kostenrechner, Galerie, Karte, Kontaktleiste, Einblenden
  assets/img/                 Fotos (siehe Abschnitt 5), Logos, Favicon
  assets/img/og/              Vorschaubilder 1200×630 für WhatsApp, LinkedIn usw.
werkzeuge/                    → NICHT auf den Server, nur für die Pflege (Python)
  bilder-erzeugen.py          600/1200-px-Varianten und AVIF aus einem neuen Foto
  jsonld-einfuegen.py         strukturierte Daten für Google in alle Seiten einsetzen
  sitemap-erzeugen.py         sitemap.xml neu erzeugen
  vorschaubilder-erzeugen.py  Vorschaubilder (og) aus den Hero-Bildern
```

Lokal ansehen: `index.html` doppelklicken genügt. Mit Server (Formular, 404): im Ordner `website` `php -S localhost:8000`.
Das Formular meldet lokal «Das Senden hat leider nicht geklappt», weil kein Mailserver läuft. Das ist normal.

---

## 2. Wichtig vor dem Livegang

1. **Der heutige Hoster ist in Konkurs.** Website und DNS von aderapartner.ch laufen bei Unity Systems (Schweiz) AG,
   Dietikon (Server bei Datasource AG, Hünenberg). Die Firma heisst heute «Cliq Soft AG in Liquidation», Konkurs eröffnet
   am 25.08.2026 (Zefix, SHAB vom 12.10.2026). Neuen Hoster wählen (Apache mit `.htaccess`, PHP 7.4 oder neuer, HTTPS)
   und das DNS umziehen. Die Domain ist bei hosttech GmbH registriert (DNSSEC aktiv).
2. **Beim DNS-Umzug die E-Mail nicht verlieren.** E-Mail läuft über Microsoft 365. Alle Einträge 1:1 mitnehmen:
   MX `aderapartner-ch.mail.protection.outlook.com`, SPF `v=spf1 include:spf.protection.outlook.com -all`,
   DMARC `p=reject`, Autodiscover-CNAME und allfällige weitere M365-Einträge (vorher vollständig exportieren).
3. **Kontaktformular und SPF/DMARC.** Wegen SPF `-all` und DMARC `p=reject` werden E-Mails, die `send.php` mit PHP `mail()`
   vom Webserver verschickt, sehr wahrscheinlich abgewiesen. Zwei Lösungen:
   - den Mailserver des neuen Hosters ins SPF aufnehmen (zusätzliches `include:` des Hosters), oder
   - `send.php` auf SMTP über Microsoft 365 umbauen (authentifiziert, z. B. mit PHPMailer und einem eigenen Postfach
     wie `website@aderapartner.ch`).
   Nach dem Livegang das Formular unbedingt testen (Abschnitt 4).
4. **Datenschutzerklärung:** Drei gelb markierte Stellen in `datenschutz.html` brauchen den neuen Hoster (Name, Ort, Land,
   Aufbewahrungsdauer der Logfiles). Suchen mit `grep -n 'class="todo"' *.html`.
5. **Zwei Firmen trennen:** aderaimmobilien.ch leitet heute auf www.aderapartner.ch weiter. Die Adera Immobilien AG ist eine
   eigene Firma und sollte eine eigene Seite erhalten (oder die Weiterleitung entfernen).

---

## 3. Livegang Schritt für Schritt

1. Alte WordPress-Website beim alten Hoster sichern.
2. Inhalt des Ordners `website` ins Hauptverzeichnis der Domain laden (oft `public_html`, `httpdocs` oder `www`),
   nicht in einen Unterordner (die 404-Seite arbeitet mit absoluten Pfaden).
3. HTTPS einschalten (Let's Encrypt).
4. **`.htaccess.livegang` in `.htaccess` umbenennen** – erst auf der echten Domain, denn sie leitet alles auf
   `https://www.aderapartner.ch` um. Sie enthält:
   - HTTPS- und www-Zwang in einem Schritt, 301-Weiterleitungen der alten WordPress-Adressen (`/kontakt/`, `/services/heizung/` …)
   - Sicherheits-Header (HSTS, CSP, nosniff, Referrer- und Permissions-Policy, frame-ancestors), getestet gegen alle Seiten
   - Caching (CSS/JS mit Versionsangabe 1 Jahr, Bilder 30 Tage, HTML kurz), gzip/Brotli, Fehlerseite 404, Schutz von `.md` usw.
   Bei Fehler 500: Der Hoster erlaubt eine Anweisung nicht – Block für Block auskommentieren. Hinweise stehen in der Datei.
   Hinter Cloudflare o. ä.: Kommentar zu `X-Forwarded-Proto` in der Datei beachten.
5. Testen: alle Seiten, «Karte laden», Formular, `http://aderapartner.ch/kontakt/` muss in einem Schritt auf
   `https://www.aderapartner.ch/kontakt.html` führen, https://securityheaders.com (Ziel A), https://www.ssllabs.com/ssltest/.
6. Google Search Console: Domain bestätigen, `https://www.aderapartner.ch/sitemap.xml` einreichen.
7. Google-Unternehmensprofil anlegen bzw. aktualisieren, local.ch und search.ch auf Industriestrasse 107 ändern
   (dort steht noch Boostockstrasse 7; das local.ch-Profil ist nicht beansprucht).

---

## 4. Kontaktformular (`send.php`)

- Einstellungen oben in der Datei: `MAIL_TO` (fest info@aderapartner.ch, nie aus dem Formular), `MAIL_FROM`
  (website@aderapartner.ch – muss beim Hoster bzw. im SPF erlaubt sein), `MAIL_SET_ENVELOPE_FROM`, Rate-Limit
  (5 Anfragen pro IP und Stunde, braucht Schreibrecht im temporären Verzeichnis).
- Schutz: Honeypot-Feld `hp_adera` (unsichtbar), Prüfung aller Felder, keine Header-Injection. Antwort als JSON für den
  Assistenten, ohne JavaScript als einfache Seite mit derselben Meldung.
- Pflichtfelder: thema (im Formular), plz, ort, vorname, nachname, email, datenschutz. Freiwillig: objekt, zeitraum,
  adresse, nachricht, firma, telefon, rueckruf. Alle Angaben stehen in der E-Mail (Felder: `FIELDS` oben in `send.php`).
- Test nach dem Livegang: auf `kontakt.html` und der Startseite je eine Anfrage senden → «Vielen Dank …» erscheint →
  E-Mail kommt in info@aderapartner.ch an (auch Spam prüfen), Antworten gehen an die eingegebene Adresse.
  Nach 5 Anfragen pro Stunde vom gleichen Anschluss sperrt das Rate-Limit eine Stunde lang.
- Der Assistent (4 Schritte) funktioniert ohne JavaScript als normales Formular. Links wie
  `kontakt.html?thema=badumbau#formular` wählen das Thema vor (heizung, lueftung, sanitaer, badumbau, planung, service).

---

## 5. Bilder

- Alle Fotos stammen von Projekten und Baustellen der Adera Partner GmbH (so steht es auch im Impressum).
  Gezeigt wird bewusst nur eine Auswahl der stärksten Fotos (Qualität vor Menge).
  Keine Stockbilder, keine KI-Bilder. Logos: offizielle Dateien von suissetec, «Wir, die Gebäudetechniker» und die
  Lehrbetrieb-Vignette (Bund, gültig seit 1.12.2025, Mindestgrösse 120 × 120 px) – nur verwenden, solange Mitgliedschaft
  bzw. Bildungsbewilligung bestehen.
- Jedes Foto gibt es als `name.jpg` (max. 2000 px), `name-900.jpg`, `name-600.jpg`, `name-1200.jpg` (falls breiter) und
  jeweils als `.avif`. Die Seiten binden sie mit `<picture>` ein (AVIF zuerst, JPEG als Ersatz, passendes `srcset/sizes`).
- Neues Foto: Metadaten (GPS!) entfernen, auf max. 2000 px verkleinern, als `name.jpg` und `name-900.jpg` speichern, dann
  `python3 werkzeuge/bilder-erzeugen.py --src website/assets/img --out website/assets/img` (Pillow 11.3+ mit AVIF).
- Projekte-Galerie: in `projekte.html` ein `<figure class="gallery__item" data-cat="bad|kueche|technik|baustelle">`
  kopieren und anpassen (Kommentar in der Datei). Am Bildschirm hat die Galerie 4 Spalten; `gallery__item--big`
  (2 × 2 Felder) und `gallery__item--wide` (2 × 1 Felder) machen einzelne Fotos grösser. Die Reihenfolge ist so gewählt,
  dass keine Lücken entstehen: nach dem Ergänzen am Bildschirm prüfen, sonst die Klasse verschieben oder weglassen.
- Personen auf Fotos (Teamfoto) und Kundenbäder: Einverständnis der Abgebildeten bzw. der Kunden einholen.

---

## 6. Aufbau und Pflege

- **Kopf und Fuss stehen in jeder HTML-Datei** (kein Template-System). Änderungen dort in allen Dateien machen,
  auch in `404.html` (dort beginnen alle Pfade mit `/`).
- **Automatisch durch `main.js`:** die Kontaktleiste am Handy (Anrufen / Anfrage starten), der Schluss-Aufruf vor dem
  Footer (nicht auf Seiten mit Formular und nicht mit `<body data-no-finale>`, z. B. service.html), das Einblenden beim Scrollen, der Anfrage-Assistent, Filter und Grossansicht der Galerie,
  die Karte nach Klick.
- **Kostenrechner (`kostenrechner.html`):** Die Preise stehen in `assets/js/main.js` im Block «Kostenrechner», in zwei
  Objekten am Anfang des Blocks. `PREISE_REPARATUR` (CHF exkl. MWST): Stundenansatz, Servicefahrzeug und Anfahrt sind
  vom Inhaber bestätigt; die Stunden und das Material pro Arbeit sind Richtwerte und vom Inhaber zu prüfen. Neue Arbeiten
  dort in der Liste `arbeiten` ergänzen, die Auswahlliste baut sich daraus auf. `PREISE_HEIZUNG` (Richtwerte inkl. MWST)
  ist ebenfalls vom Inhaber zu bestätigen. Nach einer Änderung die Versionsangabe hochzählen. Der Knopf «Offerte anfragen»
  gibt die Angaben als Parameter `rechner` ans Formular weiter (Feld «Nachricht», höchstens 300 Zeichen, nur als Text).
- **Gestaltungsregeln** (Abschnitt «Design-Runde suissetec» am Ende von `style.css`): höchstens eine blaue Fläche
  (#00729b) pro Seite, auf den Unterseiten das Hero-Panel, auf der Startseite das Band «24h-Service». Zwischentitel (H2)
  fett, wo es passt zweiteilig mit `<span class="soft">` für die graue zweite Hälfte. Etiketten (`<p class="tag">`,
  auf Fotos `tag tag--photo`, auf Blau `tag--light`) sparsam einsetzen, höchstens zwei pro Bildschirmhöhe, im HTML
  normal geschrieben (die Grossbuchstaben macht CSS). Nie weisse Schrift auf dem Logo-Blau #00a3d9.
- **Bewegung:** Die Fotowand auf der Startseite und die grosse Telefonnummer im Schluss-Aufruf bewegen sich nur beim
  Scrollen (CSS `animation-timeline`, Abschnitt «Starke Momente» am Ende von `style.css`). Browser ohne diese Funktion
  zeigen alles ruhig an, bei «Bewegung reduzieren» steht alles still. Nichts läuft endlos, kein Autoplay.
- **Versionsangabe:** `style.css?v=20261126e` und `main.js?v=20261126e` in allen HTML-Dateien. Nach jeder Änderung an CSS/JS
  die Zahl in allen Dateien hochzählen (die `.htaccess` speichert diese Dateien 1 Jahr im Browser).
- **Strukturierte Daten (JSON-LD):** stehen im `<head>` jeder Seite zwischen den Kommentaren
  `<!-- JSON-LD: automatisch erzeugt … -->` und `<!-- /JSON-LD -->`. Nach Textänderungen (Titel, Beschreibung, Fragen)
  `pip install html5lib` und `python3 werkzeuge/jsonld-einfuegen.py website` ausführen.
- **Sitemap:** nach neuen Seiten `python3 werkzeuge/sitemap-erzeugen.py website website/sitemap.xml`.
- **Vorschaubilder:** `python3 werkzeuge/vorschaubilder-erzeugen.py website` (aus dem Hero-Bild jeder Seite;
  `og-index.jpg` ist eine eigene Gestaltung und wird dabei nicht überschrieben).
- **Barrierefreiheit:** Kontraste nach WCAG AA, Tastaturbedienung (Menü, Assistent, Galerie), Fehlermeldungen mit
  `aria-describedby`, `prefers-reduced-motion` wird respektiert, kein waagrechtes Scrollen ab 320 px.
- **Schreibweise:** Schweizer Hochdeutsch, immer «ss», Anführungszeichen «…». Kunden mit «Sie».

---

## 7. Offene Punkte (vom Inhaber zu liefern oder zu bestätigen)

- Neuer Hoster (Abschnitt 2) und die drei Platzhalter in `datenschutz.html`.
- Eigene Fotos von einer Wärmepumpe (aussen/Heizraum) und einer Lüftungsanlage bzw. einem Komfortlüftungsgerät.
  Die Lüftungsseite zeigt vorläufig ein Bad mit Abluftventilator.
- Bürozeiten sind nirgends angegeben (öffentlich nicht bekannt). Bei Bedarf auf `kontakt.html` ergänzen.
- Einverständnis der drei Personen auf dem Teamfoto und der Kunden, deren Bäder gezeigt werden.
- Einige Aussagen zur Arbeitsweise werden vor dem Livegang noch bestätigt (z. B. Leitungsersatz in Etappen,
  provisorisches WC beim Badumbau, Terminplan für alle Handwerker, Dichtheitsprüfung neuer Leitungen).
