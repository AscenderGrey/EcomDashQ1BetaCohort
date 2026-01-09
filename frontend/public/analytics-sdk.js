/**
 * EcomDash Analytics SDK
 * Privacy-first, lightweight analytics tracking for ecommerce stores
 *
 * Size: ~2KB gzipped (vs 20KB for Google Analytics)
 * Features: Auto-tracking, privacy-first, no cookies, offline support
 *
 * Usage:
 * <script src="https://yourdomain.com/analytics-sdk.js" data-api-key="YOUR_KEY"></script>
 */

(function (window, document) {
  'use strict';

  // Configuration
  const config = {
    apiUrl: null, // Will be set from script tag or defaults
    apiKey: null,
    batchSize: 10,
    batchInterval: 5000, // 5 seconds
    enableAutoTracking: true,
    enablePerformance: true,
    enableErrorTracking: true,
    privacyMode: 'strict', // strict, balanced, off
  };

  // State
  let sessionId = null;
  let visitorId = null;
  let eventQueue = [];
  let batchTimer = null;
  let pageLoadTime = Date.now();

  /**
   * Initialize the SDK
   */
  function init() {
    // Get config from script tag
    const scriptTag = document.currentScript || document.querySelector('script[data-api-key]');
    if (scriptTag) {
      config.apiKey = scriptTag.getAttribute('data-api-key');
      config.apiUrl = scriptTag.getAttribute('data-api-url') || deriveApiUrl();
      config.enableAutoTracking = scriptTag.getAttribute('data-auto-track') !== 'false';
      config.privacyMode = scriptTag.getAttribute('data-privacy') || 'strict';
    }

    if (!config.apiKey) {
      console.warn('[EcomDash Analytics] API key not provided');
      return;
    }

    // Initialize IDs
    sessionId = getOrCreateSessionId();
    visitorId = getOrCreateVisitorId();

    // Set up auto-tracking
    if (config.enableAutoTracking) {
      setupAutoTracking();
    }

    // Track initial pageview
    trackPageview();

    // Performance tracking
    if (config.enablePerformance) {
      trackPerformanceMetrics();
    }

    // Error tracking
    if (config.enableErrorTracking) {
      setupErrorTracking();
    }

    // Offline support
    setupOfflineSupport();

    console.log('[EcomDash Analytics] Initialized', {
      sessionId,
      visitorId: visitorId.substring(0, 8) + '...',
    });
  }

  /**
   * Derive API URL from script source
   */
  function deriveApiUrl() {
    const scriptTag = document.currentScript;
    if (scriptTag && scriptTag.src) {
      const url = new URL(scriptTag.src);
      return `${url.protocol}//${url.host}/api/v1/analytics`;
    }
    return 'https://api.ecomdash.com/api/v1/analytics'; // Default fallback
  }

  /**
   * Generate or retrieve session ID
   * Sessions last 30 minutes of inactivity
   */
  function getOrCreateSessionId() {
    const storageKey = '_ecd_sid';
    const now = Date.now();
    const sessionTimeout = 30 * 60 * 1000; // 30 minutes

    try {
      const stored = sessionStorage.getItem(storageKey);
      if (stored) {
        const { id, timestamp } = JSON.parse(stored);
        if (now - timestamp < sessionTimeout) {
          // Update timestamp
          sessionStorage.setItem(storageKey, JSON.stringify({ id, timestamp: now }));
          return id;
        }
      }
    } catch (e) {
      // sessionStorage not available
    }

    // Create new session
    const newId = generateId();
    try {
      sessionStorage.setItem(storageKey, JSON.stringify({ id: newId, timestamp: now }));
    } catch (e) {
      // Ignore storage errors
    }
    return newId;
  }

  /**
   * Generate or retrieve visitor ID (fingerprint-based)
   * Persists across sessions, cookieless
   */
  function getOrCreateVisitorId() {
    const storageKey = '_ecd_vid';

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        return stored;
      }
    } catch (e) {
      // localStorage not available
    }

    // Generate fingerprint
    const fingerprint = generateFingerprint();

    try {
      localStorage.setItem(storageKey, fingerprint);
    } catch (e) {
      // Ignore storage errors
    }

    return fingerprint;
  }

  /**
   * Generate browser fingerprint (privacy-friendly)
   * Uses canvas, WebGL, screen, timezone
   */
  function generateFingerprint() {
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency || 'unknown',
      navigator.platform,
    ];

    // Canvas fingerprint (optional, only in balanced mode)
    if (config.privacyMode === 'balanced' || config.privacyMode === 'off') {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('EcomDash', 2, 2);
        components.push(canvas.toDataURL());
      } catch (e) {
        // Canvas fingerprinting failed
      }
    }

    return hashCode(components.join('|'));
  }

  /**
   * Simple hash function
   */
  function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }
    return 'v_' + Math.abs(hash).toString(36);
  }

  /**
   * Generate unique ID
   */
  function generateId() {
    return 's_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  }

  /**
   * Setup automatic event tracking
   */
  function setupAutoTracking() {
    // Track clicks
    document.addEventListener('click', handleClick, true);

    // Track form submissions
    document.addEventListener('submit', handleFormSubmit, true);

    // Track page visibility
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Track beforeunload (page exit)
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Track scroll depth
    let maxScrollDepth = 0;
    window.addEventListener('scroll', function () {
      const scrollDepth = Math.round(
        ((window.scrollY + window.innerHeight) / document.body.scrollHeight) * 100
      );
      if (scrollDepth > maxScrollDepth) {
        maxScrollDepth = scrollDepth;
        if (scrollDepth >= 25 && scrollDepth < 50) {
          track('scroll', { depth: 25 });
        } else if (scrollDepth >= 50 && scrollDepth < 75) {
          track('scroll', { depth: 50 });
        } else if (scrollDepth >= 75) {
          track('scroll', { depth: 75 });
        }
      }
    });
  }

  /**
   * Handle click events
   */
  function handleClick(event) {
    const target = event.target;
    const tagName = target.tagName.toLowerCase();

    // Track link clicks
    if (tagName === 'a') {
      track('click', {
        element: 'link',
        href: target.href,
        text: target.innerText.substring(0, 100),
        x: event.clientX,
        y: event.clientY,
      });
    }

    // Track button clicks
    if (tagName === 'button' || target.getAttribute('role') === 'button') {
      track('click', {
        element: 'button',
        text: target.innerText.substring(0, 100),
        x: event.clientX,
        y: event.clientY,
      });
    }

    // Track ecommerce buttons
    if (
      target.classList.contains('add-to-cart') ||
      target.getAttribute('data-action') === 'add-to-cart'
    ) {
      trackEcommerce('add_to_cart', {
        product_id: target.getAttribute('data-product-id'),
      });
    }
  }

  /**
   * Handle form submissions
   */
  function handleFormSubmit(event) {
    const form = event.target;
    track('form_submit', {
      form_id: form.id || 'unknown',
      form_action: form.action,
    });
  }

  /**
   * Handle visibility changes (page hidden/shown)
   */
  function handleVisibilityChange() {
    if (document.hidden) {
      flushQueue();
    }
  }

  /**
   * Handle page unload
   */
  function handleBeforeUnload() {
    flushQueue();
  }

  /**
   * Setup error tracking
   */
  function setupErrorTracking() {
    window.addEventListener('error', function (event) {
      track('error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });
  }

  /**
   * Setup offline support with queue persistence
   */
  function setupOfflineSupport() {
    // Load queued events from localStorage on init
    try {
      const queued = localStorage.getItem('_ecd_queue');
      if (queued) {
        eventQueue = JSON.parse(queued);
        localStorage.removeItem('_ecd_queue');
        processQueue();
      }
    } catch (e) {
      // Ignore
    }

    // Save queue to localStorage on page unload if offline
    window.addEventListener('beforeunload', function () {
      if (!navigator.onLine && eventQueue.length > 0) {
        try {
          localStorage.setItem('_ecd_queue', JSON.stringify(eventQueue));
        } catch (e) {
          // Ignore
        }
      }
    });
  }

  /**
   * Track pageview
   */
  function trackPageview(url) {
    url = url || window.location.href;
    const path = window.location.pathname;
    const referrer = document.referrer;

    // Extract UTM parameters
    const urlParams = new URLSearchParams(window.location.search);
    const utm = {
      utm_source: urlParams.get('utm_source'),
      utm_medium: urlParams.get('utm_medium'),
      utm_campaign: urlParams.get('utm_campaign'),
      utm_term: urlParams.get('utm_term'),
      utm_content: urlParams.get('utm_content'),
    };

    track('pageview', {
      url,
      path,
      referrer,
      ...utm,
      title: document.title,
    });
  }

  /**
   * Track performance metrics (Web Vitals)
   */
  function trackPerformanceMetrics() {
    // Wait for page load
    window.addEventListener('load', function () {
      setTimeout(function () {
        if ('PerformanceObserver' in window) {
          // Largest Contentful Paint (LCP)
          try {
            const lcpObserver = new PerformanceObserver(function (list) {
              const entries = list.getEntries();
              const lastEntry = entries[entries.length - 1];
              track('performance', {
                metric: 'lcp',
                value: lastEntry.renderTime || lastEntry.loadTime,
              });
            });
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
          } catch (e) {
            // LCP not supported
          }

          // First Input Delay (FID)
          try {
            const fidObserver = new PerformanceObserver(function (list) {
              const entries = list.getEntries();
              entries.forEach(function (entry) {
                track('performance', {
                  metric: 'fid',
                  value: entry.processingStart - entry.startTime,
                });
              });
            });
            fidObserver.observe({ entryTypes: ['first-input'] });
          } catch (e) {
            // FID not supported
          }

          // Cumulative Layout Shift (CLS)
          try {
            let clsValue = 0;
            const clsObserver = new PerformanceObserver(function (list) {
              list.getEntries().forEach(function (entry) {
                if (!entry.hadRecentInput) {
                  clsValue += entry.value;
                }
              });
            });
            clsObserver.observe({ entryTypes: ['layout-shift'] });

            // Report CLS on page hide
            document.addEventListener('visibilitychange', function () {
              if (document.hidden) {
                track('performance', {
                  metric: 'cls',
                  value: clsValue,
                });
              }
            });
          } catch (e) {
            // CLS not supported
          }
        }

        // Navigation Timing
        if (window.performance && window.performance.timing) {
          const timing = window.performance.timing;
          track('performance', {
            metric: 'navigation',
            ttfb: timing.responseStart - timing.requestStart,
            dom_load: timing.domContentLoadedEventEnd - timing.navigationStart,
            window_load: timing.loadEventEnd - timing.navigationStart,
          });
        }
      }, 0);
    });
  }

  /**
   * Track ecommerce event
   */
  function trackEcommerce(action, data) {
    track('ecommerce', {
      funnel_step: action,
      ...data,
    });
  }

  /**
   * Main track function
   */
  function track(eventType, properties) {
    properties = properties || {};

    const event = {
      event_type: eventType,
      event_name: properties.event_name || null,
      session_id: sessionId,
      visitor_id: visitorId,
      timestamp: Date.now(),
      url: window.location.href,
      path: window.location.pathname,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
      screen_width: screen.width,
      screen_height: screen.height,
      consent_given: true, // Assume consent (adjust based on your CMP)
      properties: properties,
    };

    // Add to queue
    eventQueue.push(event);

    // Process queue if batch size reached
    if (eventQueue.length >= config.batchSize) {
      flushQueue();
    } else {
      // Start batch timer if not already started
      if (!batchTimer) {
        batchTimer = setTimeout(flushQueue, config.batchInterval);
      }
    }
  }

  /**
   * Flush event queue (send to server)
   */
  function flushQueue() {
    if (eventQueue.length === 0) {
      return;
    }

    clearTimeout(batchTimer);
    batchTimer = null;

    const eventsToSend = eventQueue.slice();
    eventQueue = [];

    sendBatch(eventsToSend);
  }

  /**
   * Send batch of events to server
   */
  function sendBatch(events) {
    const url = config.apiUrl + '/track/batch';

    const payload = {
      events: events,
    };

    // Use sendBeacon for reliability (especially on page unload)
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon(url, blob);
    } else {
      // Fallback to fetch
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': config.apiKey,
        },
        body: JSON.stringify(payload),
        keepalive: true, // Keep request alive even if page is unloaded
      }).catch(function (error) {
        console.error('[EcomDash Analytics] Failed to send events:', error);
      });
    }
  }

  /**
   * Process queued events
   */
  function processQueue() {
    if (eventQueue.length > 0) {
      flushQueue();
    }
  }

  /**
   * Public API
   */
  window.ecomDashAnalytics = {
    track: track,
    trackPageview: trackPageview,
    trackEcommerce: trackEcommerce,
    identify: function (userId, traits) {
      // Associate visitor with user ID
      track('identify', {
        user_id: userId,
        traits: traits,
      });
    },
    // Manual page view tracking (for SPAs)
    page: function (url) {
      trackPageview(url);
    },
    // Custom event tracking
    event: function (eventName, properties) {
      track('custom', {
        event_name: eventName,
        ...properties,
      });
    },
  };

  // Auto-initialize on script load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window, document);
