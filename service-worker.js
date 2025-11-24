// --- service-worker.js ---

// バージョンを更新
const CACHE_NAME = 'sabr-lab-v4-emergency';

const ASSETS = [
  './Copilot_20251122_185005.png'
  // HTMLファイルはあえてキャッシュリストから外します
  './manifest.json'
  './styles.css',
];

// インストール処理
self.addEventListener('install', (event) => {
  self.skipWaiting(); // 待機せずに即座に更新
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// 有効化処理（古いキャッシュを削除）
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});

// 通信処理
self.addEventListener('fetch', (event) => {
  // 【重要】HTMLページへのアクセス（画面遷移）は、Service Workerで扱わずブラウザに任せる
  // これにより "redirection" エラーを完全に回避できます
  if (event.request.mode === 'navigate') {
    return;
  }

  // 外部サイトのURLも無視する
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // 画像やCSSなどのサブセットのみキャッシュから返す
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
