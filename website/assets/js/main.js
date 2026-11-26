/* Adera Partner GmbH – Website-Skripte (ohne Bibliotheken) */
(function () {
  'use strict';

  var doc = document.documentElement;
  var body = document.body;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Header: Schatten und kompakte Höhe beim Scrollen */
  var header = document.querySelector('.site-header');
  function onScroll() {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 40);
    body.classList.toggle('past-hero', window.scrollY > 480);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Mobile Navigation */
  var burger = document.querySelector('.burger');
  if (burger) {
    burger.addEventListener('click', function () {
      var open = body.classList.toggle('nav-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Menü schliessen' : 'Menü öffnen');
    });
    document.querySelectorAll('.mobilenav a').forEach(function (a) {
      a.addEventListener('click', function () {
        body.classList.remove('nav-open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 1180 && body.classList.contains('nav-open')) {
        body.classList.remove('nav-open');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* Dropdown "Angebot" (Klick für Touch und Tastatur) */
  document.querySelectorAll('.has-dropdown > button').forEach(function (btn) {
    var li = btn.parentElement;
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = li.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });
  document.addEventListener('click', function () {
    document.querySelectorAll('.has-dropdown.is-open').forEach(function (li) {
      li.classList.remove('is-open');
      var b = li.querySelector('button');
      if (b) b.setAttribute('aria-expanded', 'false');
    });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.has-dropdown.is-open').forEach(function (li) { li.classList.remove('is-open'); });
    if (body.classList.contains('nav-open') && burger) {
      body.classList.remove('nav-open');
      burger.setAttribute('aria-expanded', 'false');
      burger.focus();
    }
  });

  /* Karussells (Referenzen, Werte) – Scroll-Snap mit Pfeilen und Punkten */
  document.querySelectorAll('[data-carousel]').forEach(function (root) {
    var track = root.querySelector('[data-track]');
    if (!track) return;
    var slides = Array.prototype.slice.call(track.children);
    var prev = root.querySelector('[data-prev]');
    var next = root.querySelector('[data-next]');
    var dotsWrap = root.querySelector('[data-dots]');
    var dots = [];

    function step() {
      if (slides.length < 2) return track.clientWidth;
      return slides[1].offsetLeft - slides[0].offsetLeft;
    }
    function current() {
      var s = step() || 1;
      return Math.round(track.scrollLeft / s);
    }
    function go(i) {
      i = Math.max(0, Math.min(slides.length - 1, i));
      track.scrollTo({ left: slides[i].offsetLeft - slides[0].offsetLeft, behavior: 'smooth' });
    }
    function update() {
      var i = current();
      var max = track.scrollWidth - track.clientWidth - 4;
      if (prev) prev.disabled = track.scrollLeft <= 4;
      if (next) next.disabled = track.scrollLeft >= max;
      dots.forEach(function (d, k) { d.setAttribute('aria-current', k === i ? 'true' : 'false'); });
    }
    if (dotsWrap) {
      slides.forEach(function (_, k) {
        var d = document.createElement('button');
        d.type = 'button';
        d.setAttribute('aria-label', 'Element ' + (k + 1) + ' anzeigen');
        d.addEventListener('click', function () { go(k); });
        dotsWrap.appendChild(d);
        dots.push(d);
      });
    }
    if (prev) prev.addEventListener('click', function () { go(current() - 1); });
    if (next) next.addEventListener('click', function () { go(current() + 1); });
    track.addEventListener('scroll', function () { window.requestAnimationFrame(update); }, { passive: true });
    window.addEventListener('resize', update);
    update();

    /* läuft von selbst weiter, pausiert bei Maus, Fokus, Touch oder wenn nicht sichtbar */
    if (!reduce && slides.length > 1) {
      var paused = false, visible = false;
      var delay = root.classList.contains('quotebox') ? 5500 : 6500;
      root.addEventListener('mouseenter', function () { paused = true; });
      root.addEventListener('mouseleave', function () { paused = false; });
      root.addEventListener('focusin', function () { paused = true; });
      root.addEventListener('focusout', function () { paused = false; });
      track.addEventListener('touchstart', function () { paused = true; }, { passive: true });
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }, { threshold: 0.35 }).observe(root);
      } else { visible = true; }
      setInterval(function () {
        if (paused || !visible || document.hidden) return;
        var max = track.scrollWidth - track.clientWidth - 4;
        if (track.scrollLeft >= max) go(0); else go(current() + 1);
      }, delay);
    }
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
      f.referrerPolicy = 'no-referrer-when-downgrade';
      wrap.innerHTML = '';
      wrap.appendChild(f);
    });
  });

  /* Kontaktformular: Prüfung und Versand an send.php */
  document.querySelectorAll('form[data-form]').forEach(function (form) {
    var status = form.querySelector('.form-status');

    function setStatus(type, text) {
      if (!status) return;
      status.className = 'form-status ' + (type === 'ok' ? 'is-ok' : 'is-error');
      status.textContent = text;
      status.setAttribute('role', type === 'ok' ? 'status' : 'alert');
    }

    function validate() {
      var ok = true;
      form.querySelectorAll('[required]').forEach(function (el) {
        var field = el.closest('.field') || el.closest('.check');
        var valid = el.type === 'checkbox' ? el.checked : el.value.trim() !== '' && el.checkValidity();
        if (valid && el.type === 'email') valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(el.value.trim());
        if (field) field.classList.toggle('is-invalid', !valid);
        if (!valid && ok) { el.focus(); ok = false; }
      });
      return ok;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate()) {
        setStatus('error', 'Bitte füllen Sie die markierten Pflichtfelder aus.');
        return;
      }
      var btn = form.querySelector('[type="submit"]');
      if (btn) btn.disabled = true;
      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { 'Accept': 'application/json' } })
        .then(function (r) { return r.json().catch(function () { return { ok: false }; }); })
        .then(function (res) {
          if (res && res.ok) {
            form.reset();
            setStatus('ok', 'Vielen Dank. Ihre Anfrage ist bei uns angekommen, wir melden uns so schnell wie möglich.');
          } else {
            throw new Error('send failed');
          }
        })
        .catch(function () {
          setStatus('error', 'Das Senden hat leider nicht geklappt. Bitte rufen Sie uns an (056 402 10 00) oder schreiben Sie an info@aderapartner.ch.');
        })
        .then(function () { if (btn) btn.disabled = false; });
    });

    form.querySelectorAll('input, textarea, select').forEach(function (el) {
      el.addEventListener('input', function () {
        var field = el.closest('.field') || el.closest('.check');
        if (field) field.classList.remove('is-invalid');
      });
    });
  });

  /* Projekte: Filter und Grossansicht (Lightbox) */
  var gallery = document.querySelector('[data-gallery]');
  if (gallery) {
    var gItems = Array.prototype.slice.call(gallery.querySelectorAll('.gallery__item'));
    document.querySelectorAll('[data-filter]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var f = btn.getAttribute('data-filter');
        document.querySelectorAll('[data-filter]').forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
        gItems.forEach(function (it) {
          it.hidden = !(f === 'alle' || it.getAttribute('data-cat') === f);
          it.classList.remove('rv'); it.classList.add('is-in');
        });
      });
    });

    var box = null, boxImg, boxCap, boxClose, idx = 0, shown = [], lastFocus = null, touchX = null;
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
        '<figure class="lightbox__figure"><img alt=""><figcaption></figcaption></figure>' +
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
      boxImg.src = a.getAttribute('href');
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
      boxClose.focus();
    }
    function closeBox() {
      if (!box) return;
      box.hidden = true;
      body.classList.remove('lb-open');
      if (lastFocus) lastFocus.focus();
    }
    gItems.forEach(function (it) {
      var a = it.querySelector('a');
      if (a) a.addEventListener('click', function (e) { e.preventDefault(); openBox(it); });
    });
  }

  /* ================= Bewegung ================= */

  /* Laufband vor dem Footer (auf allen Seiten) */
  var footer = document.querySelector('.site-footer');
  if (footer && !document.querySelector('.ticker')) {
    var words = ['Heizung', 'Wärmepumpen', 'Lüftung', 'Sanitär', 'Badumbau', 'Planung', 'Service', '24h-Service 056 402 10 00'];
    var ticker = document.createElement('div');
    ticker.className = 'ticker';
    ticker.setAttribute('aria-hidden', 'true');
    var trackEl = document.createElement('div');
    trackEl.className = 'ticker__track';
    for (var r = 0; r < 2; r++) {
      words.forEach(function (w) {
        var span = document.createElement('span');
        span.className = 'ticker__item';
        span.textContent = w;
        trackEl.appendChild(span);
      });
    }
    ticker.appendChild(trackEl);
    footer.parentNode.insertBefore(ticker, footer);
  }

  /* Grüner Live-Punkt beim 24h-Service */
  document.querySelectorAll('.sidetab').forEach(function (a) {
    if (a.querySelector('.live-dot')) return;
    var dot = document.createElement('span');
    dot.className = 'live-dot';
    dot.setAttribute('aria-hidden', 'true');
    a.appendChild(dot);
  });

  if (!reduce) {
    /* Fortschrittsbalken */
    var bar = document.createElement('div');
    bar.className = 'progress';
    bar.setAttribute('aria-hidden', 'true');
    body.appendChild(bar);

    /* Elemente fürs Einblenden markieren (nur was unterhalb des sichtbaren Bereichs liegt) */
    var revealSel = ['.section-head', '.intro > *', '.card', '.person', '.feature > *', '.steps > li', '.checklist > li',
      '.joblist > li', '.fact', '.timeline > li', '.infoblock__text', '.split__panel', '.quotes > div:first-child', '.quotebox',
      '.cta', '.band__text', '.location__info', '.map', '.faq details', '.carousel__stage', '.gallery__item', '.site-footer__grid > *', '.memberships'];
    var imgSel = ['.card__img', '.feature__media', '.split__media', '.band__media', '.person__photo'];
    var vh = window.innerHeight;
    var targets = [];

    function stagger(el) {
      var sib = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
      el.style.setProperty('--d', Math.min(sib, 6) * 0.09 + 's');
    }
    document.querySelectorAll(revealSel.join(',')).forEach(function (el) {
      if (el.closest('.hero') || el.getBoundingClientRect().top < vh * 0.92) return;
      el.classList.add('rv');
      if (el.classList.contains('split__panel')) el.classList.add(el.closest('.split--reverse') ? 'rv--left' : 'rv--right');
      stagger(el);
      targets.push(el);
    });
    document.querySelectorAll(imgSel.join(',')).forEach(function (el) {
      if (el.closest('.hero')) return;
      var keep = el.classList.contains('split__media') || el.classList.contains('band__media');
      if (el.getBoundingClientRect().top < vh * 0.92) { if (keep) el.classList.add('rv-img', 'is-in'); return; }
      el.classList.add('rv-img');
      stagger(el);
      targets.push(el);
    });

    function done(el) {
      var d = parseFloat(el.style.getPropertyValue('--d')) || 0;
      setTimeout(function () {
        if (el.classList.contains('rv')) { el.classList.remove('rv', 'rv--left', 'rv--right', 'is-in'); }
        if (el.classList.contains('rv-img') && !el.classList.contains('split__media') && !el.classList.contains('band__media')) {
          el.classList.remove('rv-img', 'is-in');
        }
        el.style.removeProperty('--d');
      }, (d + 1.7) * 1000);
    }

    /* Beim Drucken alles sofort zeigen */
    window.addEventListener('beforeprint', function () {
      targets.forEach(function (el) { el.classList.add('is-in'); });
    });

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add('is-in');
          io.unobserve(e.target);
          done(e.target);
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
      targets.forEach(function (el) { io.observe(el); });
    } else {
      targets.forEach(function (el) { el.classList.add('is-in'); });
    }

    /* Parallax für grosse Bilder + Fortschrittsbalken */
    var para = Array.prototype.slice.call(document.querySelectorAll('.split__media > img, .band__media > img'));
    var ticking = false;
    function onFrame() {
      ticking = false;
      var h = doc.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, window.scrollY / h) : 0) + ')';
      var wh = window.innerHeight;
      para.forEach(function (img) {
        var box = img.parentElement.getBoundingClientRect();
        if (box.bottom < -100 || box.top > wh + 100) return;
        var p = (box.top + box.height / 2 - wh / 2) / wh;
        var y = Math.max(-1, Math.min(1, p)) * -34;
        img.parentElement.style.setProperty('--py', y.toFixed(1) + 'px');
      });
    }
    function requestFrame() { if (!ticking) { ticking = true; window.requestAnimationFrame(onFrame); } }
    window.addEventListener('scroll', requestFrame, { passive: true });
    window.addEventListener('resize', requestFrame);
    onFrame();

    /* Zähler: <strong data-count="24">24</strong> zählt hoch, sobald sichtbar */
    var counters = document.querySelectorAll('[data-count]');
    if (counters.length && 'IntersectionObserver' in window) {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          cio.unobserve(e.target);
          var el = e.target, end = parseFloat(el.getAttribute('data-count')) || 0;
          var start = parseFloat(el.getAttribute('data-count-from')) || 0;
          var suffix = el.getAttribute('data-count-suffix') || '';
          var t0 = null, dur = 1600;
          function tick(t) {
            if (!t0) t0 = t;
            var k = Math.min(1, (t - t0) / dur), ease = 1 - Math.pow(1 - k, 3);
            el.textContent = Math.round(start + (end - start) * ease) + suffix;
            if (k < 1) window.requestAnimationFrame(tick);
          }
          window.requestAnimationFrame(tick);
        });
      }, { threshold: 0.6 });
      counters.forEach(function (c) { cio.observe(c); });
    }
  }

  /* Jahr im Footer */
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  doc.classList.add('js');
})();
