/* ============================================================
   Shaka Player 初始化
   - 库与语言包均为站点内置（../vendor/shaka-player/），不依赖 CDN
   - UI 使用 Shaka 默认：不调用 ui.configure()，控件 / 菜单 / 进度条配色均为出厂值
   - 仅注入官方中文语言包
   ============================================================ */
(function () {
  'use strict';

  /* 页面上两个常驻播放器 */
  var PLAYERS = [
    {
      container: 'filmContainer',
      video: 'filmVideo',
      src: 'https://r2.newjie.net/videos/portfolio/mymy_1080sdr.mp4'
    },
    {
      container: 'newsContainer',
      video: 'newsVideo',
      src: 'https://r2.newjie.net/videos/portfolio/plc.mp4'
    }
  ];

  /* 中文语言包先取回来，再建 UI，避免首帧闪英文 */
  var zhReady = fetch('../vendor/shaka-player/ui/locales/zh.json')
    .then(function (res) { return res.json(); })
    .then(function (json) { return new Map(Object.entries(json)); })
    .catch(function (err) {
      console.warn('[shaka] 中文语言包未加载，回退英文：', err);
      return null;
    });

  /* 统一的创建方式：常驻播放器与弹窗播放器都走这里 */
  function createPlayer(container, zhMap) {
    var video = document.createElement('video');
    video.setAttribute('playsinline', '');
    video.setAttribute('crossorigin', '');
    container.appendChild(video);

    var player = new shaka.Player();
    var ui = new shaka.ui.Overlay(player, container, video);
    var controls = ui.getControls();

    if (zhMap) {
      controls.getLocalization().insert('zh', zhMap);
      controls.getLocalization().changeLocale(['zh', 'zh-CN', 'en']);
    }
    return { player: player, video: video };
  }

  function load(p, src) {
    return p.player.attach(p.video).then(function () {
      return p.player.load(src);
    });
  }

  /* ---------- 页面上的两个常驻播放器 ---------- */
  function initPlayers(zhMap) {
    PLAYERS.forEach(function (cfg) {
      var container = document.getElementById(cfg.container);
      if (!container) return;

      var p = createPlayer(container, zhMap);
      load(p, cfg.src).catch(function (err) {
        console.error('[shaka] 加载失败：' + cfg.src, err);
        var fig = container.closest('figure');
        if (fig) fig.classList.add('is-player-error');
      });
    });
  }

  /* ---------- AIGC 成片列表 → 弹窗播放 ---------- */
  function initModal(zhMap) {
    var modal = document.getElementById('videoModal');
    if (!modal) return;

    var stage = document.getElementById('videoModalStage');
    var title = document.getElementById('videoModalTitle');
    var closeBtn = document.getElementById('videoModalClose');
    var hint = document.getElementById('videoModalHint');
    var current = null;

    function close() {
      modal.classList.remove('open');
      document.body.style.overflow = '';
      setTimeout(function () {
        modal.hidden = true;
        if (current) {
          current.player.destroy();
          current = null;
        }
        stage.innerHTML = '';
      }, 280);
    }

    function open(row) {
      title.textContent = row.querySelector('.video-row__name').textContent;
      hint.hidden = true;

      stage.innerHTML = '';
      current = createPlayer(stage, zhMap);

      modal.hidden = false;
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
      closeBtn.focus();

      load(current, row.getAttribute('data-src')).catch(function (err) {
        console.error('[shaka] 弹窗加载失败：' + row.getAttribute('data-src'), err);
        hint.textContent = '视频加载失败，请检查链接';
        hint.hidden = false;
      });
    }

    Array.prototype.forEach.call(document.querySelectorAll('.video-row'), function (row) {
      row.addEventListener('click', function () { open(row); });
    });
    closeBtn.addEventListener('click', close);
    modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
    document.addEventListener('keydown', function (e) {
      if (!modal.hidden && e.key === 'Escape') close();
    });
  }

  function init() {
    if (!window.shaka || !window.shaka.ui) {
      console.error('[shaka] 库未加载');
      return;
    }
    zhReady.then(function (zhMap) {
      initPlayers(zhMap);
      initModal(zhMap);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
