// frontend/src/sw.js

import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';
import { initializeApp } from 'firebase/app';
import { getMessaging } from 'firebase/messaging/sw';

// --- Workbox Lifecycle ---
self.skipWaiting();
clientsClaim();

// Precache assets
precacheAndRoute(self.__WB_MANIFEST);

// Clean up old caches
cleanupOutdatedCaches();

// --- Runtime Caching Rules ---

// ✅ FIX: Added StaleWhileRevalidate strategy for images for fast loading and offline support
registerRoute(
  ({ request }) => request.destination === 'image',
  new StaleWhileRevalidate({
    cacheName: 'images-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 60, // Store up to 60 images
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
      }),
    ],
  })
);

// Cache Google Fonts
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new CacheFirst({
    cacheName: 'google-fonts-stylesheets',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }),
    ],
  })
);

registerRoute(
  ({ url }) => url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts-webfonts',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }),
    ],
  })
);

// Cache API calls
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [200, 201] }),
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 }),
    ],
    networkTimeoutSeconds: 10,
  })
);

// --- Firebase Push Notifications ---

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

try {
  initializeApp(firebaseConfig);
  getMessaging();
  console.log('[SW] Firebase initialized successfully');
} catch (err) {
  console.error('[SW] Firebase initialization failed:', err);
}

// Background Push Handler
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const payload = event.data.json();
  console.log('[SW] Push Received:', payload);

  const { title, body, icon, image, url } = payload.data || {};

  // Prevent generic updates or empty notifications
  if (!title || body === 'This site has been updated in the background.') return;

  const notificationOptions = {
    body: body,
    icon: icon || '/logo.png',
    badge: '/logo.png', // Small icon for Android status bar
    image: image || undefined, // Hero image for rich notifications
    vibrate: [100, 50, 100],
    data: {
      url: url || '/'
    },
    // Actions can be added here if sent from backend
    requireInteraction: true // Keeps notification visible until user interacts
  };

  event.waitUntil(
    self.registration.showNotification(title, notificationOptions)
  );
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification Clicked');
  
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';

  // This ensures we focus an existing tab if open, otherwise open a new one
  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then((windowClients) => {
    // Attempt to find a tab matching the URL
    let matchingClient = null;

    for (let i = 0; i < windowClients.length; i++) {
      const client = windowClients[i];
      // Check if the client url contains the path we want to open
      // This is a loose check to handle query params/hashes better
      if (client.url === urlToOpen || (new URL(client.url).pathname === new URL(urlToOpen, self.location.origin).pathname)) {
        matchingClient = client;
        break;
      }
    }

    if (matchingClient) {
      return matchingClient.focus().then(client => {
        // Optional: Navigate the client to the specific URL if it wasn't exact match
        if (client && client.navigate) {
            return client.navigate(urlToOpen); 
        }
      });
    } else {
      return clients.openWindow(urlToOpen);
    }
  });

  event.waitUntil(promiseChain);
});