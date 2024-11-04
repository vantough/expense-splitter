self.addEventListener('install', event => {
    event.waitUntil(
        caches.open('expense-splitter-cache').then(cache => {
            return cache.addAll([
                './',
                './index.html',
                './manifest.json',
                './style.css',
                './icon-192x192.png',
                './icon-512x512.png',
                'https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css',
                'https://code.jquery.com/jquery-3.5.1.min.js'
            ]);
        })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});
