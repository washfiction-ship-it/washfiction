/* Wash Fiction V2 — shared behavior + conversion tracking */
(function () {
  var PAGE = document.body.dataset.page || 'page';

  function wfEvent(name, params) {
    if (typeof gtag === 'function') gtag('event', name, params || {});
  }

  /* ----- mobile nav ----- */
  var burger = document.getElementById('hamburger');
  var links = document.getElementById('navLinks');
  if (burger && links) {
    burger.addEventListener('click', function () { links.classList.toggle('open'); });
    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') links.classList.remove('open');
    });
  }

  /* ----- reveal on scroll ----- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, i) {
        if (entry.isIntersecting) {
          setTimeout(function () { entry.target.classList.add('visible'); }, i * 60);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    reveals.forEach(function (el) { obs.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('visible'); });
  }

  /* ----- before/after slider (hero + service pages) ----- */
  document.querySelectorAll('.ba-slider').forEach(function (slider) {
    var range = slider.querySelector('input[type="range"]');
    if (!range) return;
    function setPos(v) { slider.style.setProperty('--pos', v + '%'); }
    setPos(range.value);
    range.addEventListener('input', function () { setPos(range.value); });
  });

  /* ----- results carousel ----- */
  var track = document.getElementById('baTrack');
  if (track) {
    var slides = track.children;
    var idx = 0;
    var caption = document.getElementById('baCaption');
    var dotsWrap = document.getElementById('baDots');
    var dots = [];
    for (var i = 0; i < slides.length; i++) {
      var d = document.createElement('button');
      d.className = 'ba-dot' + (i === 0 ? ' active' : '');
      d.setAttribute('aria-label', 'Slide ' + (i + 1));
      (function (n) { d.addEventListener('click', function () { go(n); }); })(i);
      dotsWrap.appendChild(d);
      dots.push(d);
    }
    function go(n) {
      idx = (n + slides.length) % slides.length;
      track.style.transform = 'translateX(-' + idx * 100 + '%)';
      if (caption) caption.textContent = slides[idx].dataset.label || '';
      dots.forEach(function (d, i) { d.classList.toggle('active', i === idx); });
    }
    var prev = document.getElementById('baPrev');
    var next = document.getElementById('baNext');
    if (prev) prev.addEventListener('click', function () { go(idx - 1); });
    if (next) next.addEventListener('click', function () { go(idx + 1); });
    var startX = null;
    track.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) go(idx + (dx < 0 ? 1 : -1));
      startX = null;
    }, { passive: true });
  }

  /* ----- conversion tracking ----- */
  document.querySelectorAll('a[href^="tel:"]').forEach(function (a) {
    a.addEventListener('click', function () {
      wfEvent('phone_click', { event_category: 'contact', event_label: PAGE });
    });
  });
  document.querySelectorAll('a[href$="book.html"]').forEach(function (a) {
    a.addEventListener('click', function () {
      wfEvent('book_page_click', { event_category: 'navigation', event_label: PAGE });
    });
  });

  /* ----- quote form ----- */
  var quoteForm = document.getElementById('quoteForm');
  if (quoteForm) {
    var formLabel = PAGE + '_form';
    var started = false;
    quoteForm.addEventListener('focusin', function () {
      if (!started) {
        started = true;
        wfEvent('form_start', { event_category: 'quote_request', event_label: formLabel });
      }
    });
    quoteForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = quoteForm.querySelector('button[type="submit"]');
      var originalText = btn.textContent;
      btn.textContent = 'Sending...';
      btn.disabled = true;
      fetch('https://api.web3forms.com/submit', { method: 'POST', body: new FormData(quoteForm) })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.success) {
            quoteForm.style.display = 'none';
            var ok = document.getElementById('formSuccess');
            if (ok) ok.style.display = 'block';
            wfEvent('generate_lead', { event_category: 'quote_request', event_label: formLabel });
          } else { fail(); }
        })
        .catch(fail);
      function fail() {
        btn.textContent = originalText;
        btn.disabled = false;
        alert('Something went wrong. Please try again or call (914) 279-9351.');
      }
    });
  }
})();
