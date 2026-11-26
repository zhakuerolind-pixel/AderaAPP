/* Adera Partner GmbH – Website-Skripte (ohne Bibliotheken) */
(function () {
  'use strict';

  var doc = document.documentElement;
  var body = document.body;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* Seiten unter verschachtelten Adressen (404) verwenden absolute Pfade */
  var cssLink = document.querySelector('link[rel="stylesheet"]');
  var base = cssLink && cssLink.getAttribute('href').charAt(0) === '/' ? '/' : '';
  var PHONE = '056 402 10 00';
  var TEL = 'tel:+41564021000';

  /* Header: Schatten und kompakte Höhe beim Scrollen */
  var header = document.querySelector('.site-header');
  function onScroll() {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 40);
    body.classList.toggle('past-hero', window.scrollY > 420);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Mobile Navigation
     Audit: ein Ort für Öffnen/Schliessen (aria-label blieb sonst auf «Menü schliessen»),
     Inhalt hinter dem offenen Menü ist inert (Tab landete sonst unsichtbar hinter dem Menü). */
  var burger = document.querySelector('.burger');
  function setNav(open, focusBurger) {
    if (!burger) return;
    body.classList.toggle('nav-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Menü schliessen' : 'Menü öffnen');
    document.querySelectorAll('main, .site-footer, .finale, .actionbar, .skip-link').forEach(function (el) { el.inert = open; });
    if (!open && focusBurger) burger.focus();
  }
  if (burger) {
    burger.addEventListener('click', function () { setNav(!body.classList.contains('nav-open')); });
    document.querySelectorAll('.mobilenav a').forEach(function (a) {
      a.addEventListener('click', function () { setNav(false); });
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 1180 && body.classList.contains('nav-open')) setNav(false);
    });
  }

  /* Dropdown «Angebot» (Klick für Touch und Tastatur) */
  /* Audit: aria-expanded stimmt immer, Esc schliesst auch das per Maus geöffnete Menü
     (WCAG 1.4.13), beim Verlassen per Tab schliesst es sich. CSS dazu: style-korrekturen.css */
  function closeDropdown(li, focusBtn) {
    var b = li.querySelector('button');
    li.classList.remove('is-open');
    if (b) { b.setAttribute('aria-expanded', 'false'); if (focusBtn) b.focus(); }
  }
  document.querySelectorAll('.has-dropdown > button').forEach(function (btn) {
    var li = btn.parentElement;
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      li.classList.remove('is-dismissed');
      var open = li.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    li.addEventListener('mouseleave', function () { li.classList.remove('is-dismissed'); });
    li.addEventListener('focusout', function (e) {
      if (!li.contains(e.relatedTarget)) { closeDropdown(li, false); li.classList.remove('is-dismissed'); }
    });
  });
  document.addEventListener('click', function () {
    document.querySelectorAll('.has-dropdown.is-open').forEach(function (li) { closeDropdown(li, false); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.has-dropdown').forEach(function (li) {
      var inside = li.contains(document.activeElement);
      if (li.classList.contains('is-open') || inside || li.matches(':hover')) {
        li.classList.add('is-dismissed');
        closeDropdown(li, inside);
      }
    });
    if (body.classList.contains('nav-open')) setNav(false, true);
  });

  /* Karussells: Scroll-Snap mit Pfeilen und Punkten, läuft nicht von selbst */
  document.querySelectorAll('[data-carousel]').forEach(function (root) {
    var track = root.querySelector('[data-track]');
    if (!track) return;
    var slides = Array.prototype.slice.call(track.children);
    var prev = root.querySelector('[data-prev]');
    var next = root.querySelector('[data-next]');
    var dotsWrap = root.querySelector('[data-dots]');
    var dots = [];
    /* Audit: als Karussell angekündigt, Spur per Tastatur scrollbar (axe: scrollable-region-focusable) */
    var sec = root.closest('section');
    root.setAttribute('role', 'group');
    root.setAttribute('aria-roledescription', 'Karussell');
    if (sec && sec.getAttribute('aria-labelledby')) root.setAttribute('aria-labelledby', sec.getAttribute('aria-labelledby'));
    track.setAttribute('tabindex', '0');
    slides.forEach(function (s, k) {
      if (s.tagName !== 'ARTICLE') s.setAttribute('role', 'group');   /* <article> behält seine Rolle */
      s.setAttribute('aria-roledescription', 'Folie');
      s.setAttribute('aria-label', (k + 1) + ' von ' + slides.length);
    });
    function step() { return slides.length < 2 ? track.clientWidth : slides[1].offsetLeft - slides[0].offsetLeft; }
    function current() { return Math.round(track.scrollLeft / (step() || 1)); }
    function go(i) {
      i = Math.max(0, Math.min(slides.length - 1, i));
      track.scrollTo({ left: slides[i].offsetLeft - slides[0].offsetLeft, behavior: reduce ? 'auto' : 'smooth' });
    }
    function update() {
      var i = Math.min(current(), dots.length - 1), max = track.scrollWidth - track.clientWidth - 4;
      if (prev) prev.disabled = track.scrollLeft <= 4;
      if (next) next.disabled = track.scrollLeft >= max;
      dots.forEach(function (d, k) { d.setAttribute('aria-current', k === i ? 'true' : 'false'); });
    }
    /* Audit: nur so viele Punkte wie erreichbare Positionen (vorher waren die letzten Punkte tot) */
    function buildDots() {
      if (!dotsWrap) return;
      var n = Math.max(1, Math.min(slides.length, Math.round((track.scrollWidth - track.clientWidth) / (step() || 1)) + 1));
      if (n === dots.length) return;
      dotsWrap.innerHTML = ''; dots = [];
      for (var k = 0; k < n; k++) {
        (function (k) {
          var d = document.createElement('button');
          d.type = 'button';
          d.setAttribute('aria-label', 'Position ' + (k + 1) + ' von ' + n + ' anzeigen');
          d.addEventListener('click', function () { go(k); });
          dotsWrap.appendChild(d); dots.push(d);
        })(k);
      }
    }
    buildDots();
    if (prev) prev.addEventListener('click', function () { go(current() - 1); });
    if (next) next.addEventListener('click', function () { go(current() + 1); });
    track.addEventListener('scroll', function () { window.requestAnimationFrame(update); }, { passive: true });
    window.addEventListener('resize', function () { buildDots(); update(); });
    update();
  });

  /* Karte erst nach Klick laden (Datenschutz) */
  document.querySelectorAll('[data-map]').forEach(function (wrap) {
    var btn = wrap.querySelector('button');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var f = document.createElement('iframe');
      f.src = wrap.getAttribute('data-map');
      f.title = 'Karte: Standort Adera Partner GmbH';
      f.loading = 'lazy';
      f.referrerPolicy = 'strict-origin-when-cross-origin';
      wrap.innerHTML = '';
      wrap.appendChild(f);
      /* Audit: der Knopf verschwindet, Fokus bleibt an dieser Stelle statt im Nichts */
      wrap.setAttribute('tabindex', '-1');
      wrap.focus();
    });
  });

  /* Formular-Felder prüfen (für Formular und Assistent) */
  function fieldOf(el) { return el.closest('.field') || el.closest('.check') || el.closest('fieldset'); }
  function isValid(el) {
    var v = el.type === 'checkbox' ? el.checked : (el.value.trim() !== '' && el.checkValidity());
    if (v && el.type === 'email') v = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(el.value.trim());
    return v;
  }
  function validateIn(scope) {
    var ok = true, seenGroups = {};
    scope.querySelectorAll('[required]').forEach(function (el) {
      if (el.type === 'radio') {
        if (seenGroups[el.name]) return;
        seenGroups[el.name] = true;
        var any = scope.querySelector('input[type="radio"][name="' + el.name + '"]:checked');
        var f = fieldOf(el);
        if (f) f.classList.toggle('is-invalid', !any);
        if (!any && ok) { el.focus(); ok = false; }
        return;
      }
      var valid = isValid(el), field = fieldOf(el);
      if (field) field.classList.toggle('is-invalid', !valid);
      if (valid) el.removeAttribute('aria-invalid'); else el.setAttribute('aria-invalid', 'true');   /* Audit */
      if (!valid && ok) { el.focus(); ok = false; }
    });
    return ok;
  }

  /* Anfrage-Assistent: ein Formular in Schritten, ohne JavaScript ein normales Formular */
  function setupWizard(form) {
    var steps = Array.prototype.slice.call(form.querySelectorAll('.wizard__step'));
    if (steps.length < 2) return null;
    var progress = form.querySelector('.wizard__progress');
    var back = form.querySelector('[data-back]');
    var next = form.querySelector('[data-next]');
    var submit = form.querySelector('[type="submit"]');
    var alertBox = form.querySelector('.wizard__alert');
    var idx = 0;
    form.classList.add('is-wizard');

    function show(i, focus) {
      idx = Math.max(0, Math.min(steps.length - 1, i));
      steps.forEach(function (s, k) { s.classList.toggle('is-current', k === idx); });
      var legend = steps[idx].querySelector('legend');
      if (progress) {
        var label = progress.querySelector('[data-progress-text]');
        if (label) label.textContent = 'Schritt ' + (idx + 1) + ' von ' + steps.length + (legend ? ': ' + legend.textContent : '');
        progress.style.setProperty('--p', ((idx + 1) / steps.length * 100) + '%');
      }
      if (back) back.hidden = idx === 0;
      if (next) next.hidden = idx === steps.length - 1;
      if (submit) submit.hidden = idx !== steps.length - 1;
      if (focus && legend) { legend.setAttribute('tabindex', '-1'); legend.focus(); }
    }
    if (next) next.addEventListener('click', function () { if (validateIn(steps[idx])) show(idx + 1, true); });
    if (back) back.addEventListener('click', function () { show(idx - 1, true); });

    /* Störung: Telefonnummer sofort zeigen. Nach einem Klick auf eine Kachel geht es weiter
       (nicht bei Pfeiltasten, damit Tastatur-Nutzer in Ruhe auswählen können) */
    form.querySelectorAll('input[name="thema"]').forEach(function (r) {
      r.addEventListener('change', function () {
        if (alertBox) alertBox.classList.toggle('is-on', r.checked && r.value === 'Störung / Reparatur');
        /* Audit: kein automatisches Weiterspringen mehr. Eine Auswahl darf den Fokus nicht
           ungefragt verschieben (WCAG 3.2.2); VoiceOver/TalkBack lösen dabei ebenfalls pointerup aus. */
      });
    });

    /* Thema über die Adresse vorwählen, z. B. kontakt.html?thema=badumbau#formular */
    var map = { heizung: 'Heizung / Wärmepumpe', lueftung: 'Lüftung', sanitaer: 'Sanitär', badumbau: 'Badumbau', planung: 'Planung', service: 'Störung / Reparatur' };
    var q = new URLSearchParams(window.location.search).get('thema');
    if (q && map[q]) {
      var pre = form.querySelector('input[name="thema"][value="' + map[q] + '"]');
      if (pre) { pre.checked = true; if (alertBox) alertBox.classList.toggle('is-on', map[q] === 'Störung / Reparatur'); }
    }
    show(0, false);
    return { reset: function () { form.reset(); if (alertBox) alertBox.classList.remove('is-on'); show(0, false); } };
  }

  /* Formular: Prüfung und Versand an send.php */
  document.querySelectorAll('form[data-form]').forEach(function (form) {
    var status = form.querySelector('.form-status');
    var wizard = form.hasAttribute('data-wizard') ? setupWizard(form) : null;
    /* Audit: Fehlermeldungen mit den Feldern verknüpfen (WCAG 1.3.1, 3.3.1), feste Live-Region */
    if (status) { status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite'); }
    form.querySelectorAll('.field').forEach(function (field) {
      var el = field.querySelector('input, select, textarea'), err = field.querySelector('.error');
      if (!el || !err || !el.id) return;
      err.id = el.id + '-fehler';
      el.setAttribute('aria-describedby', err.id);
    });
    var dsg = form.querySelector('.check input[type="checkbox"][required]');
    var dsgOwn = dsg && dsg.closest('.check').querySelector('.error');
    if (dsg && dsg.id && dsgOwn) {
      dsgOwn.id = dsg.id + '-fehler';
      dsg.setAttribute('aria-describedby', dsgOwn.id);
    } else if (dsg && dsg.id && !document.getElementById(dsg.id + '-fehler')) {
      var dsgErr = document.createElement('p');
      dsgErr.className = 'error check-error full';
      dsgErr.id = dsg.id + '-fehler';
      dsgErr.textContent = 'Bitte bestätigen Sie, dass Sie die Datenschutzerklärung gelesen haben.';
      dsg.closest('.check').insertAdjacentElement('afterend', dsgErr);
      dsg.setAttribute('aria-describedby', dsgErr.id);
    }

    function setStatus(type, text) {
      if (!status) return;
      status.className = 'form-status ' + (type === 'ok' ? 'is-ok' : type === 'info' ? 'is-info' : 'is-error');
      status.textContent = text;
    }
    /* Antworten aus den Kacheln stehen in der E-Mail oben in der Nachricht */
    function compose(fd) {
      var lines = [];
      [['thema', 'Thema'], ['objekt', 'Objekt'], ['zeitraum', 'Zeitraum'], ['rueckruf', 'Rückruf']].forEach(function (p) {
        var v = fd.get(p[0]);
        if (v) lines.push(p[1] + ': ' + v);
      });
      var text = (fd.get('nachricht') || '').toString().trim();
      return lines.join('\n') + (lines.length && text ? '\n\n' : '') + text;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validateIn(form)) {
        setStatus('error', 'Bitte füllen Sie die markierten Felder aus.');
        if (wizard) {
          var bad = form.querySelector('.is-invalid');
          var step = bad && bad.closest('.wizard__step');
          if (step) step.classList.add('is-current');
        }
        return;
      }
      var fd = new FormData(form);
      if (wizard) {
        var msg = compose(fd);
        fd.set('nachricht', msg || 'Anfrage über das Formular');
      }
      var btn = form.querySelector('[type="submit"]');
      /* Audit: nicht "disabled" (der Fokus ginge verloren), Doppelklick über aria-disabled abfangen;
         Meldung des Servers (fehlende Angaben, zu viele Anfragen) anzeigen */
      if (btn && btn.getAttribute('aria-disabled') === 'true') return;
      if (btn) btn.setAttribute('aria-disabled', 'true');
      setStatus('info', 'Ihre Anfrage wird gesendet …');
      fetch(form.action, { method: 'POST', body: fd, headers: { 'Accept': 'application/json' } })
        .then(function (r) { return r.json().catch(function () { return { ok: false }; }); })
        .then(function (res) {
          if (!(res && res.ok)) { var err = new Error('send failed'); err.userMessage = res && res.error; throw err; }
          if (wizard) wizard.reset(); else form.reset();
          setStatus('ok', 'Vielen Dank. Ihre Anfrage ist bei uns angekommen. Wir melden uns so schnell wie möglich.');
        })
        .catch(function (err) {
          setStatus('error', (err && err.userMessage) || 'Das Senden hat leider nicht geklappt. Bitte rufen Sie uns an (' + PHONE + ') oder schreiben Sie an info@aderapartner.ch.');
        })
        .then(function () { if (btn) btn.removeAttribute('aria-disabled'); });
    });

    form.querySelectorAll('input, textarea, select').forEach(function (el) {
      el.addEventListener(el.type === 'radio' || el.type === 'checkbox' ? 'change' : 'input', function () {
        var field = fieldOf(el);
        if (field) field.classList.remove('is-invalid');
        el.removeAttribute('aria-invalid');
      });
    });
  });

  /* Projekte: Filter und Grossansicht */
  var gallery = document.querySelector('[data-gallery]');
  if (gallery) {
    var gItems = Array.prototype.slice.call(gallery.querySelectorAll('.gallery__item'));
    /* Audit: Trefferzahl nach dem Filtern ansagen (WCAG 4.1.3) */
    var live = document.createElement('p');
    live.className = 'visually-hidden';
    live.setAttribute('role', 'status');
    gallery.parentNode.insertBefore(live, gallery);
    document.querySelectorAll('[data-filter]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var f = btn.getAttribute('data-filter'), n = 0;
        document.querySelectorAll('[data-filter]').forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
        gItems.forEach(function (it) {
          it.hidden = !(f === 'alle' || it.getAttribute('data-cat') === f);
          if (!it.hidden) n++;
          it.classList.remove('rv'); it.classList.add('is-in');
        });
        live.textContent = n + (n === 1 ? ' Foto' : ' Fotos') + ' angezeigt';
      });
    });

    var box = null, boxImg, boxCap, boxClose, idx = 0, shown = [], lastFocus = null, touchX = null, inerted = [];
    var small = window.matchMedia('(max-width: 640px)');
    function buildBox() {
      box = document.createElement('div');
      box.className = 'lightbox';
      box.hidden = true;
      box.setAttribute('role', 'dialog');
      box.setAttribute('aria-modal', 'true');
      box.setAttribute('aria-label', 'Foto in Grossansicht');
      box.innerHTML =
        '<button class="lightbox__close" type="button" aria-label="Schliessen">&times;</button>' +
        '<button class="lightbox__prev" type="button" aria-label="Vorheriges Foto"><span class="i i-prev" aria-hidden="true"></span></button>' +
        '<figure class="lightbox__figure"><img alt=""><figcaption aria-live="polite"></figcaption></figure>' +
        '<button class="lightbox__next" type="button" aria-label="Nächstes Foto"><span class="i i-next" aria-hidden="true"></span></button>';
      body.appendChild(box);
      boxImg = box.querySelector('img');
      boxCap = box.querySelector('figcaption');
      boxClose = box.querySelector('.lightbox__close');
      boxClose.addEventListener('click', closeBox);
      box.querySelector('.lightbox__prev').addEventListener('click', function () { show(idx - 1); });
      box.querySelector('.lightbox__next').addEventListener('click', function () { show(idx + 1); });
      box.addEventListener('click', function (e) { if (e.target === box) closeBox(); });
      box.addEventListener('touchstart', function (e) { touchX = e.changedTouches[0].clientX; }, { passive: true });
      box.addEventListener('touchend', function (e) {
        if (touchX === null) return;
        var dx = e.changedTouches[0].clientX - touchX; touchX = null;
        if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
      });
      document.addEventListener('keydown', function (e) {
        if (box.hidden) return;
        if (e.key === 'Escape') { e.stopPropagation(); closeBox(); }
        else if (e.key === 'ArrowLeft') show(idx - 1);
        else if (e.key === 'ArrowRight') show(idx + 1);
        else if (e.key === 'Tab') {
          var f = Array.prototype.slice.call(box.querySelectorAll('button'));
          var i = f.indexOf(document.activeElement);
          e.preventDefault();
          f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
        }
      });
    }
    function show(i) {
      shown = gItems.filter(function (it) { return !it.hidden; });
      if (!shown.length) return;
      idx = (i + shown.length) % shown.length;
      var a = shown[idx].querySelector('a'), im = shown[idx].querySelector('img');
      /* Audit: am Handy das 900-px-Bild statt des 1–2000-px-Originals (bis 1 MB) */
      boxImg.src = small.matches && im ? im.getAttribute('src') : a.getAttribute('href');
      boxImg.alt = im ? im.alt : '';
      var cap = shown[idx].querySelector('figcaption');
      boxCap.textContent = (cap ? cap.textContent : '') + '  ·  ' + (idx + 1) + ' / ' + shown.length;
    }
    function openBox(item) {
      if (!box) buildBox();
      lastFocus = document.activeElement;
      shown = gItems.filter(function (it) { return !it.hidden; });
      show(shown.indexOf(item));
      box.hidden = false;
      body.classList.add('lb-open');
      inerted = Array.prototype.filter.call(body.children, function (el) { return el !== box && !el.inert; });
      inerted.forEach(function (el) { el.inert = true; });   /* Audit: Hintergrund für Screenreader sperren */
      boxClose.focus();
    }
    function closeBox() {
      if (!box) return;
      box.hidden = true;
      body.classList.remove('lb-open');
      inerted.forEach(function (el) { el.inert = false; });
      inerted = [];
      if (lastFocus) lastFocus.focus();
    }
    gItems.forEach(function (it) {
      var a = it.querySelector('a');
      if (a) a.addEventListener('click', function (e) { e.preventDefault(); openBox(it); });
    });
  }

  /* Schluss-Aufruf vor dem Footer (nicht auf Seiten mit Formular oder data-no-finale) */
  var footer = document.querySelector('.site-footer');
  if (footer && !document.querySelector('.finale') && !document.querySelector('form[data-form]') && !body.hasAttribute('data-no-finale')) {
    var finale = document.createElement('section');
    finale.className = 'finale';
    finale.setAttribute('aria-label', 'Kontakt aufnehmen');
    finale.innerHTML =
      '<div class="container">' +
        '<p class="finale__lines"><span>Neues Bad.</span><span>Neue Heizung.</span><span>Störung?</span></p>' +
        '<div class="finale__row">' +
          '<a class="finale__phone" href="' + TEL + '"><span class="i i-phone" aria-hidden="true"></span>' + PHONE + '</a>' +
          '<a class="btn btn--solid" href="' + base + 'kontakt.html#formular"><span class="i i-arrow" aria-hidden="true"></span>Anfrage starten</a>' +
        '</div>' +
        '<p class="finale__note">Bei Störungen sind wir rund um die Uhr erreichbar.</p>' +
      '</div>';
    footer.parentNode.insertBefore(finale, footer);
  }

  /* Kontaktleiste am Handy: Anrufen und Anfrage, ausgeblendet über Formular und Footer */
  if (!document.querySelector('.actionbar')) {
    var bar = document.createElement('nav');
    bar.className = 'actionbar';
    bar.setAttribute('aria-label', 'Schnellkontakt');
    bar.innerHTML =
      '<a class="actionbar__call" href="' + TEL + '"><span class="i i-phone" aria-hidden="true"></span>Anrufen</a>' +
      '<a class="actionbar__ask" href="' + base + 'kontakt.html#formular">Anfrage starten</a>';
    body.appendChild(bar);
    if ('IntersectionObserver' in window) {
      var hideFor = Array.prototype.slice.call(document.querySelectorAll('form[data-form], .site-footer, .finale'));
      var visibleSet = new Set();
      var hio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) visibleSet.add(en.target); else visibleSet.delete(en.target); });
        body.classList.toggle('actionbar-hide', visibleSet.size > 0);
      }, { threshold: 0.05 });
      hideFor.forEach(function (el) { hio.observe(el); });
    }
  }

  /* Einblenden beim Scrollen: nur Titel, Karten und Bilder */
  if (!reduce && 'IntersectionObserver' in window) {
    var revealSel = ['.section-head', '.card', '.gallery__item', '.showcase__item', '.value', '.team__text', '.feature > div:not(.feature__media)', '.finale'];
    var imgSel = ['.feature__media', '.split__media', '.band__media', '.team__media'];
    var vh = window.innerHeight, targets = [];
    function stagger(el) {
      var sib = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
      el.style.setProperty('--d', Math.min(sib, 5) * 0.08 + 's');
    }
    document.querySelectorAll(revealSel.join(',')).forEach(function (el) {
      if (el.closest('.hero') || el.closest('.hero-work') || el.getBoundingClientRect().top < vh * 0.92) return;
      el.classList.add('rv'); stagger(el); targets.push(el);
    });
    document.querySelectorAll(imgSel.join(',')).forEach(function (el) {
      if (el.getBoundingClientRect().top < vh * 0.92) return;
      el.classList.add('rv-img'); targets.push(el);
    });
    function done(el) {
      var d = parseFloat(el.style.getPropertyValue('--d')) || 0;
      window.setTimeout(function () {
        el.classList.remove('rv', 'rv-img', 'is-in');
        el.style.removeProperty('--d');
      }, (d + 1.5) * 1000);
    }
    window.addEventListener('beforeprint', function () { targets.forEach(function (el) { el.classList.add('is-in'); }); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
        if (!e.target.classList.contains('finale')) done(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* Jahr im Footer */
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  doc.classList.add('js');
})();
