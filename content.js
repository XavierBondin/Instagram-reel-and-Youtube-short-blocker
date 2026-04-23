const hostname = window.location.hostname;

function injectStyle(css) {
  const style = document.createElement('style');
  style.textContent = css;
  (document.head || document.documentElement).appendChild(style);
}

// ─── YOUTUBE ────────────────────────────────────────────────────────────────

function handleYouTube() {
  // Redirect any /shorts/ URL back to home
  function redirectIfShorts() {
    const path = window.location.pathname;
    if (path.startsWith('/shorts') ) {
      window.location.replace('https://www.youtube.com/');
    }
  }

  redirectIfShorts();

  // YouTube fires this event on every in-app navigation (SPA)
  document.addEventListener('yt-navigate-finish', redirectIfShorts);
  window.addEventListener('popstate', redirectIfShorts);

  // Hide Shorts UI elements with CSS
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

  // MutationObserver catches Shorts cards loaded dynamically after page paint
  function purgeShorts() {
    document.querySelectorAll([
      'ytd-reel-shelf-renderer',
      'ytd-reel-item-renderer',
      'ytd-shorts',
    ].join(',')).forEach(el => { el.style.display = 'none'; });

    // Hide any video card whose link goes to /shorts/
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
  // Redirect /reels/ page back to home
  function redirectIfReels() {
    const path = window.location.pathname;
    if (path.startsWith('/reels')) {
      window.location.replace('https://www.instagram.com/');
    }
  }

  redirectIfReels();
  window.addEventListener('popstate', redirectIfReels);

  // Intercept pushState/replaceState for SPA navigation
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

  // Hide Reels nav entry
  injectStyle(`
    a[href="/reels/"],
    a[href="/reels"],
    li:has(a[href="/reels/"]),
    li:has(a[href="/reels"]) {
      display: none !important;
    }
  `);

// Redirect away from the Reels page entirely
if (location.pathname.startsWith('/reels')) {
  location.replace('https://www.instagram.com/');
}

// Hide Reels feed cards, sidebar link, and embedded Reels in DMs
function purgeReels() {
  // Re-check in case SPA navigation took us to /reels/ without a reload
  if (location.pathname.startsWith('/reels')) {
    location.replace('https://www.instagram.com/');
    return;
  }

  // Hide the Reels sidebar/menu link
  document.querySelectorAll('a[href^="/reels/"]').forEach(el => {
    const container = el.closest('[role="menuitem"]') || el.parentElement;
    if (container) container.style.display = 'none';
  });

  // Hide individual Reel posts in the main feed
  document.querySelectorAll('a[href*="/reel/"]').forEach(el => {
    const post = el.closest('article') || el.parentElement;
    if (post) post.style.display = 'none';
  });
}

purgeReels();

// Debounced observer so we don't run purgeReels hundreds of times per second
let timer;
new MutationObserver(() => {
  clearTimeout(timer);
  timer = setTimeout(purgeReels, 200);
}).observe(document.body, {
  childList: true,
  subtree: true,
});
// ─── DISPATCH ────────────────────────────────────────────────────────────────

if (hostname.includes('youtube.com')) {
  handleYouTube();
} else if (hostname.includes('instagram.com')) {
  handleInstagram();
}
