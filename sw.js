const CACHE_NAME = 'mit-herz-v54';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './app.css',
    './app2.js',
    './firebase.js',
    './logo.jpg',
    'https://unpkg.com/lucide@latest'
];

self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS_TO_CACHE))
    );
});

self.addEventListener('fetch', event => {
    // Only intercept basic GET requests
    if (event.request.method !== 'GET' || event.request.url.includes('firestore.googleapis.com')) {
        return;
    }
    
    // Network First strategy
    event.respondWith(
        fetch(event.request).then(response => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
            }
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseToCache);
            });
            return response;
        }).catch(() => {
            return caches.match(event.request);
        })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(clients.claim());
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
