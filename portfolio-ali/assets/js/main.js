/* ============================================================
   Material Design 3 — 交互脚本
   刘牧欣 · 求职作品集
   ============================================================ */
(function () {
  'use strict';

  var root = document.documentElement;

  /* ---------- 当前年份 ---------- */
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  /* ---------- 明暗主题切换（M3 color scheme） ---------- */
  (function () {
    var KEY = 'lmx-theme';
    var btn = document.getElementById('themeToggle');
    var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

    function systemDark() { return !!(mq && mq.matches); }

    function effective() {
      var saved = root.getAttribute('data-theme');
      return (saved === 'dark' || saved === 'light') ? saved : (systemDark() ? 'dark' : 'light');
    }

    function paint() {
      var mode = effective();
      root.classList.toggle('theme-dark', mode === 'dark');
      root.classList.toggle('theme-light', mode === 'light');
      if (!btn) return;
      var toDark = mode === 'light';
      var label = toDark ? '切换到暗色主题' : '切换到亮色主题';
      btn.setAttribute('aria-label', label);
      btn.setAttribute('title', label);
      var sun = btn.querySelector('.icon-sun');
      var moon = btn.querySelector('.icon-moon');
      if (sun && moon) {
        sun.style.display = mode === 'dark' ? '' : 'none';
        moon.style.display = mode === 'dark' ? 'none' : '';
      }
    }

    if (btn) {
      btn.addEventListener('click', function () {
        var next = effective() === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        try { localStorage.setItem(KEY, next); } catch (e) { /* 隐私模式忽略 */ }
        paint();
      });
    }
    if (mq && mq.addEventListener) mq.addEventListener('change', paint);
    paint();
  })();

  /* ---------- Top app bar：滚动状态 + 阅读进度 ---------- */
  var appBar = document.getElementById('topbar');
  var progress = document.getElementById('progress');

  function onScroll() {
    var top = window.scrollY || document.documentElement.scrollTop;
    if (appBar) appBar.classList.toggle('scrolled', top > 8);
    if (progress) {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (h > 0 ? Math.min(100, (top / h) * 100) : 0) + '%';
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 移动端导航（M3 navigation drawer 简化版） ---------- */
  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? '收起导航' : '展开导航');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
  }

  /* ---------- 导航高亮（当前区块 active indicator） ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.m3-nav a[href*="#"]'));
  var sections = navLinks.map(function (a) {
    var h = a.getAttribute('href');
    var i = h.indexOf('#');
    var id = i >= 0 ? h.slice(i) : '';
    if (!id || id === '#') return null;
    try { return document.querySelector(id); } catch (err) { return null; }
  }).filter(Boolean);

  if (sections.length && 'IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (a) {
          var h = a.getAttribute('href');
          a.classList.toggle('active', h.slice(h.indexOf('#')) === '#' + en.target.id);
        });
      });
    }, { rootMargin: '-25% 0px -65% 0px', threshold: 0 });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- 入场动画 ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    /* ?static=1 → 直接显示全部内容（用于截图 / 打印预览） */
    var isStatic = /[?&]static=1/.test(location.search);
    if (isStatic) {
      reveals.forEach(function (el) { el.classList.add('in'); });
    } else if ('IntersectionObserver' in window) {
      var ro = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (en, i) {
          if (!en.isIntersecting) return;
          var el = en.target;
          setTimeout(function () { el.classList.add('in'); }, Math.min(i * 70, 210));
          obs.unobserve(el);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
      reveals.forEach(function (el) { ro.observe(el); });
    } else {
      reveals.forEach(function (el) { el.classList.add('in'); });
    }
  }

  /* ---------- 图片预览对话框 ---------- */
  var lb = document.getElementById('lightbox');
  if (lb) {
    var lbImg = document.getElementById('lbImg');
    var lbCap = document.getElementById('lbCap');
    var lbClose = document.getElementById('lbClose');
    var lbPrev = document.getElementById('lbPrev');
    var lbNext = document.getElementById('lbNext');
    var items = [];
    var idx = 0;
    var lastFocus = null;

    function collect() {
      items = Array.prototype.slice.call(document.querySelectorAll('.zoomable[data-full]'));
    }

    function show(i) {
      if (!items.length) return;
      idx = (i + items.length) % items.length;
      var el = items[idx];
      var img = el.querySelector('img');
      var cap = el.querySelector('figcaption');
      lbImg.src = el.getAttribute('data-full');
      lbImg.alt = img ? (img.alt || '') : '';
      lbCap.textContent = cap ? cap.textContent.trim() : (img ? img.alt : '');
      var multi = items.length > 1;
      lbPrev.style.display = multi ? '' : 'none';
      lbNext.style.display = multi ? '' : 'none';
    }

    function open(i) {
      collect();
      lastFocus = document.activeElement;
      lb.hidden = false;
      requestAnimationFrame(function () { lb.classList.add('open'); });
      document.body.style.overflow = 'hidden';
      show(i);
      lbClose.focus();
    }

    function close() {
      lb.classList.remove('open');
      document.body.style.overflow = '';
      setTimeout(function () {
        lb.hidden = true;
        lbImg.src = '';
      }, 280);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    /* 点击图片打开 */
    document.addEventListener('click', function (e) {
      var z = e.target.closest ? e.target.closest('.zoomable[data-full]') : null;
      if (z) {
        e.preventDefault();
        collect();
        open(items.indexOf(z));
      }
    });

    /* 键盘可访问：Enter / Space 打开 */
    document.addEventListener('keydown', function (e) {
      if (lb.hidden || !document.activeElement) return;
      var z = document.activeElement;
      if (z.classList && z.classList.contains('zoomable') && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        collect();
        open(items.indexOf(z));
      }
    });

    lbClose.addEventListener('click', close);
    lbPrev.addEventListener('click', function (e) { e.stopPropagation(); show(idx - 1); });
    lbNext.addEventListener('click', function (e) { e.stopPropagation(); show(idx + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });

    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') show(idx - 1);
      else if (e.key === 'ArrowRight') show(idx + 1);
    });

    /* 触屏左右滑动 */
    var sx = 0;
    lb.addEventListener('touchstart', function (e) { sx = e.changedTouches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 55) show(idx + (dx < 0 ? 1 : -1));
    }, { passive: true });
  }
})();
