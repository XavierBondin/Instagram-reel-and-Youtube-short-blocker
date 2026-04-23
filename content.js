const hostname = window.location.hostname;

function injectStyle(css) {
  const style = document.createElement('style');
  style.textContent = css;
  (document.head || document.documentElement).appendChild(style);
}

// ─── YOUTUBE ────────────────────────────────────────────────────────────────

function handleYouTube() {
  function redirectIfShorts() {
    const path = window.location.pathname;
    if (path.startsWith('/shorts')) {
      window.location.replace('https://www.youtube.com/');
    }
  }

  redirectIfShorts();
  document.addEventListener('yt-navigate-finish', redirectIfShorts);
  window.addEventListener('popstate', redirectIfShorts);

  injectStyle(`
    ytd-reel-shelf-renderer,
    ytd-reel-item-renderer,
    ytd-shorts,
    ytd-guide-entry-renderer:has(a[title="Shorts"]),
    ytd-mini-guide-entry-renderer:has(a[title="Shorts"]),
    yt-tab-shape[tab-title="Shorts"],
    tp-yt-paper-tab:has([title="Shorts"]),
    ytd-video-renderer:has(a[href*="/shorts/"]),
    ytd-compact-video-renderer:has(a[href*="/shorts/"]),
    ytd-grid-video-renderer:has(a[href*="/shorts/"]) {
      display: none !important;
    }
  `);

  function purgeShorts() {
    document.querySelectorAll([
      'ytd-reel-shelf-renderer',
      'ytd-reel-item-renderer',
      'ytd-shorts',
    ].join(',')).forEach(el => { el.style.display = 'none'; });

    document.querySelectorAll('a[href*="/shorts/"]').forEach(link => {
      let el = link;
      for (let i = 0; i < 6; i++) {
        if (!el.parentElement) break;
        el = el.parentElement;
        if (/^ytd-/.test(el.tagName.toLowerCase())) {
          el.style.display = 'none';
          break;
        }
      }
    });
  }

  new MutationObserver(purgeShorts).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
}

// ─── INSTAGRAM ───────────────────────────────────────────────────────────────

function handleInstagram() {
  function showBlockScreen() {
    document.querySelectorAll('video').forEach(v => {
      try {
        v.pause();
        v.src = '';
        v.load();
      } catch (e) {}
    });

    document.documentElement.innerHTML = `
      <body style="margin:0;display:flex;align-items:center;justify-content:center;height:100vh;background:#000;color:#fff;font-family:sans-serif;">
        <div style="text-align:center;">
          <h1 style="font-size:2rem;margin-bottom:1rem;">Reels blocked</h1>
          <p style="opacity:0.7;">Go do something else.</p>
          <a href="https://www.instagram.com/" style="color:#0095f6;display:inline-block;margin-top:2rem;">Back to feed</a>
        </div>
      </body>
    `;
  }

  function redirectIfReels() {
    const path = location.pathname;

    if (path.startsWith('/reels') || path.startsWith('/reel/')) {
      showBlockScreen();
      return;
    }

    if (path.startsWith('/p/')) {
      const check = () => {
        if (document.querySelector('article video, main video')) {
          showBlockScreen();
        }
      };
      check();
      setTimeout(check, 400);
      setTimeout(check, 1000);
    }
  }

  redirectIfReels();
  window.addEventListener('popstate', redirectIfReels);

  const _push = history.pushState.bind(history);
  const _replace = history.replaceState.bind(history);
  history.pushState = function (...args) {
    _push(...args);
    redirectIfReels();
  };
  history.replaceState = function (...args) {
    _replace(...args);
    redirectIfReels();
  };

  injectStyle(`
    a[href="/reels/"],
    a[href="/reels"],
    li:has(a[href="/reels/"]),
    li:has(a[href="/reels"]) {
      display: none !important;
    }
  `);

  function purgeReels() {
    if (
      location.pathname.startsWith('/reels') ||
      location.pathname.startsWith('/reel/') ||
      location.pathname.startsWith('/p/')
    ) {
      redirectIfReels();
      return;
    }

    document.querySelectorAll('a[href^="/reels/"]').forEach(el => {
      const container = el.closest('[role="menuitem"]') || el.parentElement;
      if (container) container.style.display = 'none';
    });

    document.querySelectorAll('a[href*="/reel/"]:not([href*="/reels/"])').forEach(el => {
      const post = el.closest('article') || el.parentElement;
      if (post) post.style.display = 'none';
    });
  }

  purgeReels();

  let timer;
  new MutationObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(purgeReels, 200);
  }).observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// ─── DISPATCH ────────────────────────────────────────────────────────────────

if (hostname.includes('youtube.com')) {
  handleYouTube();
} else if (hostname.includes('instagram.com')) {
  handleInstagram();
}
