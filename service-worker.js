// --- service-worker.js ---

// バージョンを更新（必須）
const CACHE_NAME = 'sabr-lab-v3-repair';

// キャッシュするファイル（外部CDNは含めないこと）
const ASSETS = [
  './',
  './index.html',
  './Copilot_20251122_185005.png'
];

// 1. インストール時：強制的に新しいSWを有効化（待機させない）
self.addEventListener('install', (event) => {
  self.skipWaiting(); 
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// 2. 有効化時：古いキャッシュをすべて削除し、即座にコントロールを開始
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
});

// 3. 通信時：外部サイト（CDN）は無視し、自サイトのみキャッシュを利用
self.addEventListener('fetch', (event) => {
  // 重要：Chart.jsなどの外部URLはServiceWorkerを経由させない（エラー回避）
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // キャッシュがあれば返す、なければネットワークへ
      return response || fetch(event.request).catch((error) => {
        console.error('Fetch failed:', error);
        // オフライン時のフォールバックが必要ならここに記述
      });
    })
  );
});
