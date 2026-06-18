/* Shared interactions — used by every page */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Year
  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  // Loader
  var loader = document.getElementById('loader');
  function hideLoader() { if (loader) loader.classList.add('done'); }
  if (reduce) hideLoader();
  else { window.addEventListener('load', function () { setTimeout(hideLoader, 450); }); setTimeout(hideLoader, 2600); }

  // Sticky header
  var hdr = document.getElementById('hdr');
  function onScroll() {
    if (hdr) hdr.classList.toggle('scrolled', window.scrollY > 24);
    var p = document.getElementById('progress');
    if (p) {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      p.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
    }
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Mobile menu
  var toggle = document.getElementById('navToggle');
  var links = document.getElementById('navLinks');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') { links.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
    });
  }

  // Reveal on scroll (also re-run for dynamically injected nodes)
  window.revealScan = function () {
    var els = [].slice.call(document.querySelectorAll('.reveal:not(.in)'));
    if (reduce || !('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el) { io.observe(el); });
  };
  window.revealScan();

  // Count-up
  function uspan(s) { return s ? '<span class="u">' + s + '</span>' : ''; }
  function fmt(v, d) { return v.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d }); }
  var counters = [].slice.call(document.querySelectorAll('[data-count]'));
  function setFinal(el) { var t = parseFloat(el.getAttribute('data-count')), d = parseInt(el.getAttribute('data-decimals') || '0', 10), s = el.getAttribute('data-suffix') || ''; el.innerHTML = fmt(t, d) + uspan(s); }
  if (reduce || !('IntersectionObserver' in window)) { counters.forEach(setFinal); }
  else if (counters.length) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target, t = parseFloat(el.getAttribute('data-count')), d = parseInt(el.getAttribute('data-decimals') || '0', 10), s = el.getAttribute('data-suffix') || '', dur = 1500, start = null;
        requestAnimationFrame(function step(ts) { if (!start) start = ts; var p = Math.min((ts - start) / dur, 1), e = 1 - Math.pow(1 - p, 3); el.innerHTML = fmt(t * e, d) + uspan(s); if (p < 1) requestAnimationFrame(step); else el.innerHTML = fmt(t, d) + uspan(s); });
        co.unobserve(el);
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { co.observe(el); });
  }
})();

/* ============================================================
   Request Executive Resume — modal (qualify, don't open-download)
   Works on static hosting. To capture submissions seamlessly,
   set RR_ENDPOINT to a free form service (Web3Forms / Formspree).
   Until then it falls back to a pre-filled email to the owner.
   ============================================================ */
(function () {
  // --- CONFIG -------------------------------------------------
  var RR_ENDPOINT = '';                 // e.g. 'https://api.web3forms.com/submit'
  var RR_ACCESS_KEY = '';               // Web3Forms access key (free, instant)
  var RR_EMAIL = 'peemaii123@gmail.com';// mailto fallback recipient
  // ------------------------------------------------------------

  if (document.getElementById('rrBackdrop')) return; // inject once

  // Language is taken from <html lang="..."> — th.html sets lang="th"
  var LANG = ((document.documentElement.lang || 'en').toLowerCase().indexOf('th') === 0) ? 'th' : 'en';
  var STR = {
    en: {
      aria: 'Request Executive Resume', eyebrow: 'Private Profile', title: 'Request Executive Resume',
      sub: 'My full professional profile is shared privately with verified recruiters, executive search firms, business partners, and industry contacts. Please share a few details and I will follow up directly.',
      name: 'Full Name', phName: 'Your full name', company: 'Company', phCompany: 'Organisation',
      position: 'Position', phPosition: 'Your role', email: 'Business Email', phEmail: 'name@company.com',
      emailErr: 'Please enter a valid business email.', purpose: 'Purpose of Contact', selectReason: 'Select a reason',
      opts: ['Executive search / Recruitment', 'Direct hiring / Employer', 'Business partnership', 'Industry networking', 'Other professional enquiry'],
      submit: 'Submit Request', sending: 'Sending…', note: 'Your details are used only to respond to this request.',
      thanks: 'Thank you for your interest. I will review your request and share my professional profile shortly.',
      thanksSub: 'A response will follow to the email you provided.', close: 'Close'
    },
    th: {
      aria: 'ขอเรซูเม่สำหรับผู้บริหาร', eyebrow: 'โปรไฟล์ส่วนตัว', title: 'ขอเรซูเม่สำหรับผู้บริหาร',
      sub: 'โปรไฟล์ฉบับเต็มจะถูกแบ่งปันเป็นการส่วนตัวกับผู้สรรหาบุคลากร บริษัทจัดหาผู้บริหาร พันธมิตรทางธุรกิจ และผู้ติดต่อในวงการที่ได้รับการยืนยัน กรุณากรอกข้อมูลเล็กน้อย แล้วจะติดต่อกลับโดยตรง',
      name: 'ชื่อ–นามสกุล', phName: 'ชื่อ–นามสกุลของคุณ', company: 'บริษัท', phCompany: 'องค์กร / บริษัท',
      position: 'ตำแหน่ง', phPosition: 'ตำแหน่งของคุณ', email: 'อีเมลธุรกิจ', phEmail: 'name@company.com',
      emailErr: 'กรุณากรอกอีเมลธุรกิจที่ถูกต้อง', purpose: 'วัตถุประสงค์ในการติดต่อ', selectReason: 'เลือกเหตุผล',
      opts: ['การสรรหา / Executive Search', 'การว่าจ้างโดยตรง / นายจ้าง', 'ความร่วมมือทางธุรกิจ', 'การสร้างเครือข่ายในวงการ', 'การสอบถามเชิงวิชาชีพอื่น ๆ'],
      submit: 'ส่งคำขอ', sending: 'กำลังส่ง…', note: 'ข้อมูลของคุณจะถูกใช้เพื่อตอบกลับคำขอนี้เท่านั้น',
      thanks: 'ขอบคุณสำหรับความสนใจของคุณ จะตรวจสอบคำขอและแบ่งปันโปรไฟล์ทางวิชาชีพให้ในเร็ว ๆ นี้',
      thanksSub: 'การตอบกลับจะถูกส่งไปยังอีเมลที่คุณระบุไว้', close: 'ปิด'
    }
  }[LANG];

  var modal = document.createElement('div');
  modal.id = 'rrBackdrop';
  modal.className = 'rr-backdrop';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', STR.aria);
  modal.innerHTML =
    '<div class="rr-modal"><div class="rr-inner">' +
      '<button type="button" class="rr-close" data-rr-close aria-label="Close">&times;</button>' +
      '<span class="rr-eyebrow"><span class="rule"></span>' + STR.eyebrow + '</span>' +
      '<h2 class="rr-title">' + STR.title + '</h2>' +
      '<p class="rr-sub">' + STR.sub + '</p>' +
      '<form class="rr-form" id="rrForm" novalidate>' +
        '<div class="rr-field"><label for="rrName">' + STR.name + ' <span class="req">*</span></label><input id="rrName" name="name" type="text" autocomplete="name" required placeholder="' + STR.phName + '"></div>' +
        '<div class="rr-row">' +
          '<div class="rr-field"><label for="rrCompany">' + STR.company + ' <span class="req">*</span></label><input id="rrCompany" name="company" type="text" autocomplete="organization" required placeholder="' + STR.phCompany + '"></div>' +
          '<div class="rr-field"><label for="rrPosition">' + STR.position + ' <span class="req">*</span></label><input id="rrPosition" name="position" type="text" autocomplete="organization-title" required placeholder="' + STR.phPosition + '"></div>' +
        '</div>' +
        '<div class="rr-field"><label for="rrEmail">' + STR.email + ' <span class="req">*</span></label><input id="rrEmail" name="email" type="email" autocomplete="email" required placeholder="' + STR.phEmail + '"><span class="rr-error" id="rrEmailErr">' + STR.emailErr + '</span></div>' +
        '<div class="rr-field"><label for="rrPurpose">' + STR.purpose + ' <span class="req">*</span></label><select id="rrPurpose" name="purpose" required>' +
          '<option value="" disabled selected>' + STR.selectReason + '</option>' +
          '<option>' + STR.opts[0] + '</option>' +
          '<option>' + STR.opts[1] + '</option>' +
          '<option>' + STR.opts[2] + '</option>' +
          '<option>' + STR.opts[3] + '</option>' +
          '<option>' + STR.opts[4] + '</option>' +
        '</select></div>' +
        '<button type="submit" class="btn btn-gold rr-submit">' + STR.submit + '</button>' +
        '<p class="rr-note">' + STR.note + '</p>' +
      '</form>' +
      '<div class="rr-thanks" id="rrThanks">' +
        '<div class="rr-check"><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 12.5l4.2 4.2L19 7"/></svg></div>' +
        '<h3>' + STR.thanks + '</h3>' +
        '<p>' + STR.thanksSub + '</p>' +
        '<button type="button" class="btn btn-line" data-rr-close>' + STR.close + '</button>' +
      '</div>' +
    '</div></div>';
  document.body.appendChild(modal);

  var form = modal.querySelector('#rrForm');
  var thanks = modal.querySelector('#rrThanks');
  var emailErr = modal.querySelector('#rrEmailErr');
  var lastFocus = null;

  function open() {
    lastFocus = document.activeElement;
    // reset to form view each open
    form.classList.remove('hide'); thanks.classList.remove('show');
    modal.querySelector('.rr-eyebrow').classList.rem
