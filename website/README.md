# Website Adera Partner GmbH

Statische Website (HTML, CSS, JavaScript) mit einem Kontaktformular in PHP.
Keine Datenbank, kein CMS, keine Cookies und beim Seitenaufruf keine externen Dienste.

## Was ist im Ordner

| Datei / Ordner | Inhalt |
|---|---|
| `index.html` | Startseite |
| `heizung.html`, `lueftung.html`, `sanitaer.html`, `badumbau.html`, `planung.html`, `service.html` | Angebotsseiten |
| `unternehmen.html`, `jobs.html`, `kontakt.html` | Über uns, Stellen, Kontakt mit Formular und Karte |
| `impressum.html`, `datenschutz.html` | Rechtliche Angaben |
| `404.html` | Fehlerseite für Adressen, die es nicht gibt |
| `send.php` | Verschickt das Kontaktformular als E-Mail an info@aderapartner.ch |
| `assets/css/style.css` | Gestaltung aller Seiten |
| `assets/js/main.js` | Navigation, Karussells, Karte, Formular, Animationen |
| `assets/img/` | Bilder (gross und als `-900`-Version für Handys), Logos, Favicon |
| `README.md` | Diese Anleitung (nicht hochladen) |

## Lokal ansehen

- Am einfachsten: `index.html` doppelklicken. So lassen sich alle Seiten ansehen.
  Nicht funktionieren nur das Senden des Formulars (braucht PHP) und die 404-Seite (braucht einen Webserver).
- Mit PHP auf dem Computer: im Ordner `php -S localhost:8000` ausführen und `http://localhost:8000` öffnen.
  Das Formular meldet dann meist «Das Senden hat leider nicht geklappt», weil lokal kein Mailserver läuft. Das ist normal.

## Hochladen

1. Webhosting mit **PHP 7.4 oder neuer** und eingeschalteter PHP-Funktion `mail()` (bei Schweizer Hostern meist Standard). Ohne PHP läuft die Website auch, nur das Formular nicht.
2. Die alte WordPress-Website sichern (Backup beim Hoster) und danach entfernen. Eine bestehende `.htaccess` von WordPress enthält einen Block `# BEGIN WordPress … # END WordPress`, der alle Adressen an WordPress schickt. Diesen Block löschen.
3. Alle Dateien und den Ordner `assets` per SFTP/FTP oder mit dem Dateimanager des Hosters ins **Hauptverzeichnis** der Domain laden (oft `public_html`, `httpdocs` oder `www`). Nicht in einen Unterordner, sonst funktioniert die 404-Seite nicht. `README.md` nicht hochladen.
4. Beim Hoster **HTTPS** einschalten (SSL-Zertifikat, meist kostenlos über Let's Encrypt) und alle Aufrufe auf `https://www.aderapartner.ch` umleiten lassen, auch `aderapartner.ch` ohne www. Die Datenschutzerklärung sagt, dass die Verbindung verschlüsselt ist.
5. Weiterleitungen und Fehlerseite einrichten (Abschnitt 5 unten).

## Vor dem Livegang

### 1. Platzhalter ersetzen

Gelb markierte Stellen sind Platzhalter: `<span class="todo">…</span>`. Text ersetzen und die `span`-Klammer entfernen, zum Beispiel
`<span class="todo">CHE-…</span>` wird zu `CHE-123.456.789`.

Alle Platzhalter finden (im Ordner der Website):

```sh
grep -n 'class="todo"' *.html
```

Unter Windows (PowerShell): `Select-String -Pattern 'class="todo"' -Path *.html`

Stand 26. November 2026: 27 Platzhalter in 7 Dateien.

| Was gebraucht wird | Wo |
|---|---|
| Vorname des Bruders (zweiter Geschäftsführer) | `index.html`, `kontakt.html`, `unternehmen.html` (2×), `impressum.html` |
| UID-Nummer (CHE-…) und MWST-Nummer; falls nicht MWST-pflichtig, Zeile löschen | `impressum.html` |
| Bürozeiten Montag bis Freitag (Vorschlag 07:00–12:00 und 13:00–17:00 bestätigen) | `index.html`, `kontakt.html` |
| 4 Referenzen: Projektname, Ort, kurzer Beschrieb, Jahr (dazu passende Fotos) | `index.html` |
| Stellen: Führerausweis Kat. B als Anforderung bestätigen, Lehrbeginn «August 20XX», Lehrstelle nur zeigen, wenn sie frei ist | `jobs.html` |
| Wartungsabo: Gibt es eines? Intervall und Leistungen | `service.html` |
| Hoster: Name, Ort, Land; wie lange er die Logfiles aufbewahrt | `datenschutz.html` |
| E-Mail-Anbieter für info@aderapartner.ch: Name, Ort, Land; wo die Daten gespeichert sind | `datenschutz.html` |
| Bildnachweis: Bildagentur und Urheber je Bild | `impressum.html` |

Danach jede Seite im Browser durchsehen. Es darf nichts Gelbes mehr zu sehen sein.

### 2. Bildrechte prüfen

Für jedes Bild klären, woher es stammt und ob eine Lizenz für die Website besteht. Lizenznachweise aufbewahren.

- Das frühere Wärmepumpen-Foto (`waermepumpe.jpg`) hatte ein sichtbares ©-Wasserzeichen und wurde entfernt. Es ist ersetzt durch die eigene, animierte Grafik `waermepumpe.svg` (keine fremden Rechte). Sobald ein eigenes Foto einer Wärmepumpe von einer Adera-Baustelle vorliegt, kann es die Grafik ersetzen.
- `lueftung.jpg`, `sanitaer.jpg`, `bad-lavabo.jpg`, `haustechnik.jpg`: sehr wahrscheinlich Stockbilder. Quelle und Lizenz klären und im Impressum unter «Bildnachweis» eintragen.
- `team-baustelle.jpg`: Wer hat das Foto gemacht? Die abgebildeten Personen müssen mit der Veröffentlichung einverstanden sein.
- Logos von suissetec, «Wir, die Gebäudetechniker» und Lehrbetrieb nur verwenden, solange die Mitgliedschaft oder Berechtigung besteht.
- Auf der alten Website war mindestens ein Bild von iStock eingebunden. Vielleicht gibt es dort schon ein Konto mit Lizenzen.

### 3. Kontaktformular (`send.php`) einrichten und testen

Die Einstellungen stehen oben in `send.php`:

- `MAIL_FROM` (Absender, voreingestellt `website@aderapartner.ch`): Diese Adresse beim Hoster anlegen oder eine bestehende Adresse der Domain eintragen. Der Hoster muss den Versand mit dieser Adresse erlauben.
- Liegt das Postfach nicht beim selben Anbieter wie die Website (zum Beispiel bei Microsoft 365), muss der SPF-Eintrag der Domain den Webserver als Absender erlauben. Sonst landen die Anfragen im Spam oder werden abgewiesen. Den Hoster fragen.
- `MAIL_SET_ENVELOPE_FROM`: Falls der Versand nicht klappt, versuchsweise auf `false` setzen.
- `MAIL_TO`: Empfänger, fest `info@aderapartner.ch`. Wird nie aus dem Formular übernommen.
- `RATE_LIMIT_MAX` und `RATE_LIMIT_WINDOW`: höchstens 5 Anfragen pro IP-Adresse und Stunde. Dafür braucht PHP Schreibrecht im temporären Verzeichnis. Fehlt es, läuft das Formular ohne Limit weiter.

Nach dem Hochladen testen:

1. Auf `kontakt.html` und auf der Startseite je eine Testanfrage senden. Es muss «Vielen Dank …» erscheinen.
2. Im Postfach info@aderapartner.ch nachsehen, auch im Spam-Ordner: Betreff «Kontaktanfrage Website: …», Umlaute korrekt, alle Angaben vorhanden. Nur wenn die E-Mail wirklich ankommt, funktioniert das Formular.
3. Auf die E-Mail antworten: Die Antwort muss an die Adresse gehen, die im Formular eingetragen wurde.
4. Ein Pflichtfeld leer lassen: Das Formular muss den Fehler anzeigen und nichts senden.

Achtung beim Testen: Nach 5 Anfragen innerhalb einer Stunde vom selben Internetanschluss nimmt das Formular eine Stunde lang nichts mehr an (Schutz vor Spam). Dann erscheint die Fehlermeldung mit der Telefonnummer.
Läuft die Website hinter einem Proxy oder CDN (zum Beispiel Cloudflare), sieht PHP unter Umständen für alle Besucher dieselbe IP-Adresse. Dann `RATE_LIMIT_MAX` erhöhen.

Erlaubt der Hoster `mail()` nicht (manche verlangen den Versand über SMTP mit Passwort), funktioniert `send.php` nicht. Dann muss der Versand auf SMTP umgebaut werden.

### 4. Datenschutzerklärung vervollständigen

- Hoster und E-Mail-Anbieter mit Ort und Land eintragen (Platzhalter in `datenschutz.html`). Speichert ein Anbieter Daten ausserhalb der Schweiz, das Land nennen. Steht dieses Land nicht auf der Liste des Bundesrats mit angemessenem Datenschutz (dazu gehören die EU- und EWR-Staaten), zusätzlich die Garantien nennen, zum Beispiel Standardvertragsklauseln.
- Beim Hoster nachfragen, ob er aus den Logfiles automatisch Besucherstatistiken erstellt (zum Beispiel AWStats oder Webalizer). Falls ja: abschalten oder in der Datenschutzerklärung ergänzen.
- Die Datenschutzerklärung sagt: Anfragen ohne Auftrag werden nach der Erledigung gelöscht, Bewerbungsunterlagen nach einer Absage. Das Postfach entsprechend regelmässig aufräumen.
- Kommt später etwas dazu (zum Beispiel Google Analytics, YouTube-Videos, Google Fonts, Newsletter, Chat, Facebook-Pixel), zuerst die Datenschutzerklärung anpassen und das Datum bei «Stand» ändern.

### 5. Weiterleitungen von alten Adressen und Fehlerseite

Die alte Website hatte andere Adressen. Damit alte Links und Google-Einträge weiter funktionieren, die alten Adressen dauerhaft (301) auf die neuen Seiten umleiten. Bei Hostern mit Apache gehört das in die Datei `.htaccess` im Hauptverzeichnis (der Dateiname beginnt mit einem Punkt; falls es sie nicht gibt, neu anlegen). Beispiel:

```apache
# Fehlerseite für Adressen, die es nicht gibt
ErrorDocument 404 /404.html

# Alte Adressen dauerhaft auf die neuen Seiten umleiten
RedirectMatch 301 ^/haustechnik/?$          https://www.aderapartner.ch/
RedirectMatch 301 ^/unternehmen/?$          https://www.aderapartner.ch/unternehmen.html
RedirectMatch 301 ^/kontakt/?$              https://www.aderapartner.ch/kontakt.html
RedirectMatch 301 ^/services/sanitaer/?$    https://www.aderapartner.ch/sanitaer.html
RedirectMatch 301 ^/services/heizung/?$     https://www.aderapartner.ch/heizung.html
RedirectMatch 301 ^/services/lueftung/?$    https://www.aderapartner.ch/lueftung.html
RedirectMatch 301 ^/services/haustechnik/?$ https://www.aderapartner.ch/

# Ebenfalls auf der alten Website verlinkt
RedirectMatch 301 ^/leistungen/?$           https://www.aderapartner.ch/
RedirectMatch 301 ^/anfrage/?$              https://www.aderapartner.ch/kontakt.html
```

- Die Regeln erst beim Livegang auf der richtigen Domain einsetzen, denn die Ziele zeigen auf www.aderapartner.ch.
- Testen: Alte Adressen im Browser aufrufen, zum Beispiel `https://www.aderapartner.ch/services/heizung/`. Es muss `heizung.html` erscheinen. Eine erfundene Adresse muss die 404-Seite zeigen, mit Logo und Farben.
- Hoster mit nginx (ohne `.htaccess`): Weiterleitungen und Fehlerseite vom Hoster einrichten lassen.

## Inhalte später ändern

- Texte direkt in den HTML-Dateien ändern, mit einem Texteditor (zum Beispiel Visual Studio Code oder Notepad++), Kodierung UTF-8. Schweizer Schreibweise beibehalten: immer «ss» (kein scharfes S), Anführungszeichen «…».
- Kopf- und Fussbereich (Navigation, Adresse, Telefon) stehen in jeder Seite. Änderungen dort in allen HTML-Dateien machen, auch in `404.html`. In `404.html` beginnen alle Pfade mit `/`; das muss so bleiben.
- Bilder in `assets/img/` mit gleichem Namen und ähnlichem Format ersetzen, jeweils gross (1800 px breit) und als `-900`-Version (900 px breit).
- Das Jahr im Fussbereich aktualisiert sich automatisch.
