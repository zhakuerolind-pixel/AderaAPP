<?php
/*
 * Kontaktformular – Versand per E-Mail
 * Website Adera Partner GmbH (www.aderapartner.ch)
 *
 * Nimmt die Daten des Kontaktformulars per POST entgegen, prüft sie und schickt
 * sie als E-Mail an MAIL_TO. Die Daten werden auf dem Server nicht gespeichert.
 *
 * Antwort immer als JSON:
 *   {"ok":true}                   Anfrage wurde an den Mailserver übergeben
 *   {"ok":false,"error":"…"}      Fehler, mit passendem HTTP-Statuscode
 *
 * Voraussetzungen: PHP 7.4 oder neuer, PHP-Funktion mail() beim Hoster aktiviert.
 * Keine Bibliotheken, keine Datenbank.
 */

// ===========================================================================
// Einstellungen
// ===========================================================================

// Empfänger der Anfragen. Fest eingetragen, wird nie aus dem Formular übernommen.
const MAIL_TO = 'info@aderapartner.ch';

// Absender der E-Mails. WICHTIG: Diese Adresse muss beim Hoster existieren oder
// als Absender erlaubt sein und zur Domain aderapartner.ch gehören. Sonst werden
// die E-Mails oft abgewiesen oder als Spam markiert. Antworten gehen trotzdem an
// die Person, die das Formular ausgefüllt hat («Antwort an» = ihre E-Mail-Adresse).
const MAIL_FROM = 'website@aderapartner.ch';
const MAIL_FROM_NAME = 'Website Adera Partner';

// Absender auch als Envelope-Sender (Return-Path) setzen, sendmail-Option -f.
// Verbessert die Zustellung. Falls der Versand beim Hoster damit nicht klappt: false.
const MAIL_SET_ENVELOPE_FROM = true;

// Schutz vor Missbrauch: höchstens RATE_LIMIT_MAX Anfragen pro IP-Adresse
// innerhalb von RATE_LIMIT_WINDOW Sekunden (3600 = 1 Stunde).
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW = 3600;

// Formularfelder: Name => [Bezeichnung in der E-Mail, Pflichtfeld, max. Zeichen, mehrzeilig]
const FIELDS = [
    'anrede'    => ['Anrede', false, 20, false],
    'vorname'   => ['Vorname', true, 100, false],
    'nachname'  => ['Nachname', true, 100, false],
    'firma'     => ['Firma', false, 150, false],
    'adresse'   => ['Adresse', true, 200, false],
    'plz'       => ['PLZ', true, 20, false],
    'ort'       => ['Ort', true, 100, false],
    'email'     => ['E-Mail', true, 254, false],
    'telefon'   => ['Telefon', false, 50, false],
    'thema'     => ['Thema', false, 100, false],
    'nachricht' => ['Nachricht', true, 10000, true],
];

// ===========================================================================
// Ablauf
// ===========================================================================

// PHP-Warnungen nie in die Antwort schreiben (sie würden das JSON zerstören).
@ini_set('display_errors', '0');
date_default_timezone_set('Europe/Zurich');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(405, 'Nur POST-Anfragen sind erlaubt.');
}

// Honeypot: Das Feld «website» ist für Menschen unsichtbar und bleibt leer.
// Ist es ausgefüllt, war es sehr wahrscheinlich ein Spam-Programm. Wir melden
// Erfolg, senden aber nichts.
$honeypot = $_POST['website'] ?? '';
if (!is_string($honeypot) || trim($honeypot) !== '') {
    respond(200);
}

// Felder einlesen, bereinigen und prüfen
$data = [];
$invalid = [];
foreach (FIELDS as $name => $field) {
    list($label, $required, $maxLength, $multiline) = $field;
    $value = read_field($name, $multiline);
    if ($value === null) {
        respond(400, 'Die Anfrage enthält ungültige Daten.');
    }
    if (($required && $value === '') || text_length($value) > $maxLength) {
        $invalid[] = $label;
    }
    $data[$name] = $value;
}
if ($data['email'] !== '' && filter_var($data['email'], FILTER_VALIDATE_EMAIL) === false && !in_array('E-Mail', $invalid, true)) {
    $invalid[] = 'E-Mail';
}
if (($_POST['datenschutz'] ?? '') !== 'ja') {
    $invalid[] = 'Zustimmung zur Datenschutzerklärung';
}
if ($invalid) {
    respond(422, 'Bitte prüfen Sie folgende Angaben: ' . implode(', ', $invalid) . '.');
}

if (rate_limit_reached()) {
    header('Retry-After: ' . RATE_LIMIT_WINDOW);
    respond(429, 'Zu viele Anfragen. Bitte versuchen Sie es später noch einmal oder rufen Sie uns an: 056 402 10 00.');
}

if (!function_exists('mail') || filter_var(MAIL_FROM, FILTER_VALIDATE_EMAIL) === false) {
    error_log('Kontaktformular: mail() ist nicht verfügbar oder MAIL_FROM ist ungültig.');
    respond(500, 'Der E-Mail-Versand ist auf dem Server nicht eingerichtet.');
}

// E-Mail zusammenstellen
$thema = $data['thema'] !== '' ? $data['thema'] : 'Allgemeine Anfrage';
$name = trim($data['vorname'] . ' ' . $data['nachname']);

$lines = [
    'Neue Anfrage über das Kontaktformular auf www.aderapartner.ch',
    '',
    'Thema:      ' . $thema,
    'Anrede:     ' . or_dash($data['anrede']),
    'Vorname:    ' . $data['vorname'],
    'Nachname:   ' . $data['nachname'],
    'Firma:      ' . or_dash($data['firma']),
    'Adresse:    ' . $data['adresse'],
    'PLZ / Ort:  ' . $data['plz'] . ' ' . $data['ort'],
    'E-Mail:     ' . $data['email'],
    'Telefon:    ' . or_dash($data['telefon']),
    '',
    'Nachricht:',
    $data['nachricht'],
    '',
    '--',
    'Gesendet am ' . date('d.m.Y \u\m H:i') . ' Uhr. Datenschutzerklärung bestätigt: ja.',
    'Mit «Antworten» schreiben Sie direkt an ' . $data['email'] . '.',
];
$body = str_replace("\n", "\r\n", implode("\n", $lines));
$body = quoted_printable_encode($body);
// Zeilen, die mit einem Punkt beginnen, kodieren (manche Mailserver deuten «.» als Ende der Nachricht)
$body = preg_replace('/^\./m', '=2E', $body);

$subject = header_text('Kontaktanfrage Website: ' . $thema);

$headers = implode("\r\n", [
    'From: ' . MAIL_FROM_NAME . ' <' . MAIL_FROM . '>',
    'Reply-To: ' . encoded_words($name) . ' <' . $data['email'] . '>',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: quoted-printable',
]);

if (MAIL_SET_ENVELOPE_FROM) {
    $sent = @mail(MAIL_TO, $subject, $body, $headers, '-f' . MAIL_FROM);
} else {
    $sent = @mail(MAIL_TO, $subject, $body, $headers);
}

if (!$sent) {
    error_log('Kontaktformular: mail() hat die Nachricht nicht angenommen.');
    respond(500, 'Die Anfrage konnte nicht gesendet werden. Bitte rufen Sie uns an: 056 402 10 00.');
}

respond(200);

// ===========================================================================
// Hilfsfunktionen
// ===========================================================================

/** JSON-Antwort senden und beenden. Ohne $error: {"ok":true}. */
function respond(int $status, ?string $error = null): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    $answer = $error === null ? ['ok' => true] : ['ok' => false, 'error' => $error];
    echo json_encode($answer, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/**
 * Feld aus $_POST lesen und bereinigen.
 * Einzeilige Felder: Zeilenumbrüche und Steuerzeichen werden zu Leerzeichen
 * (verhindert das Einschleusen von E-Mail-Kopfzeilen).
 * Mehrzeilige Felder: Zeilenumbrüche bleiben, andere Steuerzeichen werden entfernt.
 * Gibt null zurück, wenn der Wert kein Text oder kein gültiges UTF-8 ist.
 */
function read_field(string $name, bool $multiline): ?string
{
    $value = $_POST[$name] ?? '';
    if (!is_string($value) || preg_match('//u', $value) !== 1) {
        return null;
    }
    // Unsichtbare Steuerzeichen für die Schreibrichtung entfernen
    $value = preg_replace('/[\x{202A}-\x{202E}\x{2066}-\x{2069}]/u', '', $value);
    if ($multiline) {
        $value = str_replace(["\r\n", "\r", "\u{2028}", "\u{2029}"], "\n", $value);
        $value = preg_replace('/(?![\n\t])\p{Cc}/u', '', $value);
    } else {
        $value = preg_replace('/[\p{Cc}\x{2028}\x{2029}]+/u', ' ', $value);
        $value = preg_replace('/ {2,}/', ' ', $value);
    }
    return trim($value);
}

/** Anzahl Zeichen (nicht Bytes) eines UTF-8-Texts. */
function text_length(string $text): int
{
    if (function_exists('mb_strlen')) {
        return mb_strlen($text, 'UTF-8');
    }
    return (int) preg_match_all('/./su', $text);
}

/** Leere Angaben in der E-Mail als «–» anzeigen. */
function or_dash(string $value): string
{
    return $value !== '' ? $value : '–';
}

/** Text für eine Kopfzeile: reines ASCII bleibt, alles andere wird kodiert. */
function header_text(string $text): string
{
    return preg_match('/^[\x20-\x7E]*$/', $text) === 1 ? $text : encoded_words($text);
}

/**
 * Text als MIME-Encoded-Words (=?UTF-8?B?…?=) für E-Mail-Kopfzeilen kodieren.
 * Teilt in Stücke von höchstens 45 Byte, ohne Zeichen zu zerschneiden, damit
 * jedes Wort unter 76 Zeichen bleibt.
 */
function encoded_words(string $text): string
{
    $words = [];
    $chunk = '';
    foreach (preg_split('//u', $text, -1, PREG_SPLIT_NO_EMPTY) as $char) {
        if ($chunk !== '' && strlen($chunk . $char) > 45) {
            $words[] = '=?UTF-8?B?' . base64_encode($chunk) . '?=';
            $chunk = '';
        }
        $chunk .= $char;
    }
    if ($chunk !== '') {
        $words[] = '=?UTF-8?B?' . base64_encode($chunk) . '?=';
    }
    return implode(' ', $words);
}

/**
 * Einfaches Rate-Limit pro IP-Adresse über kleine Dateien im temporären Verzeichnis.
 * Gespeichert wird nicht die IP-Adresse, sondern ein Hash davon mit den Zeitpunkten
 * der Anfragen. Einträge, die älter als RATE_LIMIT_WINDOW sind, werden gelöscht.
 * Fehlen Schreibrechte, läuft das Formular ohne Rate-Limit weiter.
 */
function rate_limit_reached(): bool
{
    $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    if (!is_string($ip) || $ip === '') {
        return false;
    }

    $dir = rtrim(sys_get_temp_dir(), '/\\') . DIRECTORY_SEPARATOR . 'adera-kontaktformular';
    if (!@is_dir($dir)) {
        @mkdir($dir, 0700);
    }
    @chmod($dir, 0700);
    clearstatcache();
    // Nur ein eigenes, für andere Benutzer gesperrtes Verzeichnis verwenden
    $perms = @fileperms($dir);
    if (!@is_dir($dir) || @is_link($dir) || !@is_writable($dir) || $perms === false || ($perms & 0077) !== 0) {
        return false;
    }

    $now = time();
    $files = @glob($dir . DIRECTORY_SEPARATOR . '*.txt');
    if (is_array($files)) {
        foreach ($files as $old) {
            $mtime = @filemtime($old);
            if ($mtime !== false && $mtime < $now - RATE_LIMIT_WINDOW) {
                @unlink($old);
            }
        }
    }

    $file = $dir . DIRECTORY_SEPARATOR . hash('sha256', 'adera-kontaktformular|' . $ip) . '.txt';
    $handle = @fopen($file, 'c+');
    if ($handle === false) {
        return false;
    }
    if (!@flock($handle, LOCK_EX)) {
        fclose($handle);
        return false;
    }

    $times = [];
    foreach (explode("\n", (string) stream_get_contents($handle)) as $line) {
        if (preg_match('/^\d+$/', $line) === 1 && (int) $line > $now - RATE_LIMIT_WINDOW) {
            $times[] = (int) $line;
        }
    }
    $reached = count($times) >= RATE_LIMIT_MAX;
    if (!$reached) {
        $times[] = $now;
        ftruncate($handle, 0);
        rewind($handle);
        fwrite($handle, implode("\n", $times));
        fflush($handle);
    }
    flock($handle, LOCK_UN);
    fclose($handle);
    return $reached;
}
