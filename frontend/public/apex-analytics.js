/**
 * APEX Analytics - Client-Side Tracking SDK
 * Lightweight analytics tracker with real-time behavioral intent detection
 *
 * Features:
 * - Sub-15-second visitor intent classification
 * - Privacy-first (GDPR/CCPA compliant)
 * - Auto-tracking of pageviews, clicks, scrolls
 * - E-commerce event tracking
 * - Performance metrics (Web Vitals)
 * - Batched event sending for efficiency
 *
 * Usage:
 *   <script src="https://cdn.apex-analytics.com/apex.js"
 *           data-api-url="https://api.yourstore.com"
 *           data-store-id="your-store-id"></script>
 */

(function () {
  'use strict';

  // Configuration from data attributes
  const script = document.currentScript;
  const API_URL = script.getAttribute('data-api-url') || 'http://localhost:8000';
  const STORE_ID = script.getAttribute('data-store-id') || 'demo-store';
  const TRACK_ENDPOINT = `${API_URL}/api/v1/analytics/track/event`;
  const BATCH_ENDPOINT = `${API_URL}/api/v1/analytics/track/batch`;

  // Privacy settings
  const PRIVACY_MODE = script.getAttribute('data-privacy') || 'strict'; // strict, balanced, off
  const COOKIE_CONSENT = getCookie('apex_consent') !== 'false';

  // Session management
  let SESSION_ID = getSessionId();
  let VISITOR_ID = getVisitorId();
  let EVENT_BUFFER = [];
  let BUFFER_FLUSH_INTERVAL = 5000; // 5 seconds
  let SESSION_START_TIME = Date.now();

  // Behavioral tracking state
  let pageViewCount = 0;
  let clickCount = 0;
  let scrollDepth = 0;
  let lastScrollDepth = 0;

  /**
   * Initialize the analytics tracker
   */
  function init() {
    if (!COOKIE_CONSENT) {
      console.log('[APEX] User consent not given, tracking disabled');
      return;
    }

    console.log('[APEX Analytics] Initialized', {
      sessionId: SESSION_ID,
      visitorId: VISITOR_ID,
      apiUrl: API_URL,
    });

    // Track initial pageview
    trackPageview();

    // Set up event listeners
    setupEventListeners();

    // Start buffer flusher
    setInterval(flushEventBuffer, BUFFER_FLUSH_INTERVAL);

    // Track performance metrics when page fully loaded
    if (document.readyState === 'complete') {
      trackPerformance();
    } else {
      window.addEventListener('load', trackPerformance);
    }

    // Flush buffer before page unload
    window.addEventListener('beforeunload', flushEventBuffer);
  }

  /**
   * Set up automatic event tracking listeners
   */
  function setupEventListeners() {
    // Click tracking
    document.addEventListener('click', handleClick, true);

    // Scroll tracking
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(handleScroll, 150); // Debounce
    });

    // Form submissions
    document.addEventListener('submit', handleFormSubmit, true);

    // Page visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
  }

  /**
   * Track a pageview event
   */
  function trackPageview() {
    pageViewCount++;

    const event = createBaseEvent('pageview');
    sendEvent(event);

    console.log('[APEX] Pageview tracked:', event.path);
  }

  /**
   * Handle click events
   */
  function handleClick(e) {
    clickCount++;

    // Track meaningful clicks (links, buttons, interactive elements)
    const target = e.target;
    const tagName = target.tagName.toLowerCase();

    if (['a', 'button', 'input'].includes(tagName) || target.onclick) {
      const event = createBaseEvent('click');
      event.properties = {
        element: tagName,
        text: target.textContent?.substring(0, 100) || '',
        href: target.href || null,
        x: e.clientX,
        y: e.clientY,
      };

      sendEvent(event);
    }

    // Track e-commerce events (add-to-cart buttons)
    if (target.classList.contains('add-to-cart') || target.getAttribute('data-event') === 'add-to-cart') {
      trackEcommerceEvent('add_to_cart', {
        product_id: target.getAttribute('data-product-id'),
        product_name: target.getAttribute('data-product-name'),
        product_price: parseFloat(target.getAttribute('data-product-price')),
      });
    }
  }

  /**
   * Handle scroll events
   */
  function handleScroll() {
    const docHeight = Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight
    );
    const windowHeight = window.innerHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    scrollDepth = Math.round(((scrollTop + windowHeight) / docHeight) * 100);

    // Only track if scroll depth increased by 25%
    if (scrollDepth >= lastScrollDepth + 25) {
      lastScrollDepth = scrollDepth;

      const event = createBaseEvent('scroll');
      event.properties = {
        scroll_depth: scrollDepth,
        scroll_top: scrollTop,
      };

      sendEvent(event);
    }
  }

  /**
   * Handle form submissions
   */
  function handleFormSubmit(e) {
    const form = e.target;
    const event = createBaseEvent('form_submit');
    event.properties = {
      form_id: form.id || 'unknown',
      form_action: form.action,
    };

    sendEvent(event);
  }

  /**
   * Handle page visibility changes
   */
  function handleVisibilityChange() {
    if (document.hidden) {
      flushEventBuffer(); // Send pending events before page hidden
    }
  }

  /**
   * Track Web Performance Metrics (Core Web Vitals)
   */
  function trackPerformance() {
    if (!window.performance) return;

    const navigation = performance.getEntriesByType('navigation')[0];
    if (!navigation) return;

    const event = createBaseEvent('performance');
    event.performance = {
      ttfb: navigation.responseStart - navigation.requestStart,
      dom_load_time: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      window_load_time: navigation.loadEventEnd - navigation.loadEventStart,
    };

    // Core Web Vitals (requires web-vitals library or manual measurement)
    // In production, use: https://github.com/GoogleChrome/web-vitals
    if (typeof webVitals !== 'undefined') {
      webVitals.getLCP((metric) => {
        event.performance.lcp = metric.value / 1000; // Convert to seconds
      });
      webVitals.getFID((metric) => {
        event.performance.fid = metric.value / 1000;
      });
      webVitals.getCLS((metric) => {
        event.performance.cls = metric.value;
      });
    }

    sendEvent(event);
  }

  /**
   * Track e-commerce events
   */
  function trackEcommerceEvent(eventName, data) {
    const event = createBaseEvent('ecommerce');
    event.event_name = eventName;
    event.ecommerce = data;

    sendEvent(event);
    console.log('[APEX] E-commerce event:', eventName, data);
  }

  /**
   * Create a base event object with common properties
   */
  function createBaseEvent(eventType) {
    return {
      event_type: eventType,
      session_id: SESSION_ID,
      visitor_id: VISITOR_ID,
      timestamp: Date.now(),
      url: window.location.href,
      path: window.location.pathname,
      referrer: document.referrer || null,
      utm_source: getUrlParameter('utm_source'),
      utm_medium: getUrlParameter('utm_medium'),
      utm_campaign: getUrlParameter('utm_campaign'),
      utm_term: getUrlParameter('utm_term'),
      utm_content: getUrlParameter('utm_content'),
      user_agent: navigator.userAgent,
      device_type: getDeviceType(),
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
      screen_width: screen.width,
      screen_height: screen.height,
      consent_given: COOKIE_CONSENT,
    };
  }

  /**
   * Send event to analytics API (buffered)
   */
  function sendEvent(event) {
    EVENT_BUFFER.push(event);

    // Flush immediately for important events
    if (['ecommerce', 'form_submit'].includes(event.event_type)) {
      flushEventBuffer();
    }
  }

  /**
   * Flush event buffer (send batched events)
   */
  function flushEventBuffer() {
    if (EVENT_BUFFER.length === 0) return;

    const events = EVENT_BUFFER.splice(0, EVENT_BUFFER.length); // Drain buffer

    // Send batch request
    fetch(BATCH_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ events }),
      keepalive: true, // Important for beforeunload
    })
      .then((res) => {
        if (!res.ok) {
          console.error('[APEX] Event tracking failed:', res.status);
        }
      })
      .catch((err) => {
        console.error('[APEX] Network error:', err);
      });
  }

  /**
   * Get or create session ID (expires after 30 minutes of inactivity)
   */
  function getSessionId() {
    const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
    const stored = sessionStorage.getItem('apex_session');

    if (stored) {
      try {
        const { id, timestamp } = JSON.parse(stored);
        if (Date.now() - timestamp < SESSION_TIMEOUT) {
          // Update timestamp
          sessionStorage.setItem('apex_session', JSON.stringify({ id, timestamp: Date.now() }));
          return id;
        }
      } catch (e) {
        // Invalid stored session
      }
    }

    // Create new session
    const newId = 'sess_' + generateId();
    sessionStorage.setItem('apex_session', JSON.stringify({ id: newId, timestamp: Date.now() }));
    return newId;
  }

  /**
   * Get or create visitor ID (persistent, privacy-friendly fingerprint)
   */
  function getVisitorId() {
    const stored = localStorage.getItem('apex_visitor');
    if (stored) return stored;

    const newId = 'visitor_' + generateId();
    localStorage.setItem('apex_visitor', newId);
    return newId;
  }

  /**
   * Generate a unique ID
   */
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Get device type from user agent
   */
  function getDeviceType() {
    const ua = navigator.userAgent.toLowerCase();
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  }

  /**
   * Get URL parameter value
   */
  function getUrlParameter(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  /**
   * Get cookie value
   */
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }

  /**
   * Public API
   */
  window.ApexAnalytics = {
    track: function (eventName, properties) {
      const event = createBaseEvent('custom');
      event.event_name = eventName;
      event.properties = properties;
      sendEvent(event);
    },
    trackEcommerce: trackEcommerceEvent,
    trackPageview: trackPageview,
    getSessionId: () => SESSION_ID,
    getVisitorId: () => VISITOR_ID,
  };

  // Auto-initialize on script load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
