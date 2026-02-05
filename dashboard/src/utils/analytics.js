// Analytics tracking for visitor data
// Sends visitor information to Google Sheets via Apps Script

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwjtXdNTGykHZBaKCzX5DNOQpsJLME1DOH7130sGxjUN01-xttanGFJW9OgcYlTGc0_Mw/exec';

/**
 * Gets or creates a session ID for the current visit
 */
function getSessionId() {
  let sessionId = sessionStorage.getItem('pf_session_id');

  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('pf_session_id', sessionId);
  }

  return sessionId;
}

/**
 * Detect returning visitor
 */
function isReturningVisitor() {
  try {
    const hasVisitedBefore = localStorage.getItem('pf_has_visited');
    if (!hasVisitedBefore) {
      localStorage.setItem('pf_has_visited', 'true');
      localStorage.setItem('pf_first_visit', new Date().toISOString());
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Extract browser info from user agent
 */
function getBrowserInfo() {
  const ua = navigator.userAgent;
  let browser = 'Unknown';
  let version = 'Unknown';

  if (ua.indexOf('Firefox') > -1) {
    browser = 'Firefox';
    version = ua.match(/Firefox\/([0-9.]+)/)?.[1] || 'Unknown';
  } else if (ua.indexOf('Edg') > -1) {
    browser = 'Edge';
    version = ua.match(/Edg\/([0-9.]+)/)?.[1] || 'Unknown';
  } else if (ua.indexOf('Chrome') > -1 && ua.indexOf('Edg') === -1) {
    browser = 'Chrome';
    version = ua.match(/Chrome\/([0-9.]+)/)?.[1] || 'Unknown';
  } else if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) {
    browser = 'Safari';
    version = ua.match(/Version\/([0-9.]+)/)?.[1] || 'Unknown';
  }

  return { browser, version };
}

/**
 * Extract OS from user agent
 */
function getOS() {
  const ua = navigator.userAgent;
  if (ua.indexOf('Win') > -1) return 'Windows';
  if (ua.indexOf('Mac') > -1) return 'macOS';
  if (ua.indexOf('Linux') > -1) return 'Linux';
  if (ua.indexOf('Android') > -1) return 'Android';
  if (ua.indexOf('like Mac') > -1) return 'iOS';
  return 'Unknown';
}

/**
 * Collects comprehensive visitor data and sends to Google Sheets
 */
export async function trackVisitor() {
  try {
    const perfTiming = performance.timing;
    const perfEntries = performance.getEntriesByType ? performance.getEntriesByType('navigation')[0] : null;
    const paintEntries = performance.getEntriesByType ? performance.getEntriesByType('paint') : [];

    const urlParams = new URLSearchParams(window.location.search);
    const browserInfo = getBrowserInfo();

    const visitorData = {
      // Basic
      origin: window.location.origin,
      timestamp: new Date().toISOString(),
      page: window.location.pathname + window.location.hash,
      url: window.location.href,
      pathname: window.location.pathname,
      referrer: document.referrer || 'Direct',
      userAgent: navigator.userAgent,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      sessionId: getSessionId(),
      returningVisitor: isReturningVisitor(),

      // Browser info
      browser: browserInfo.browser,
      browserVersion: browserInfo.version,
      os: getOS(),
      platform: navigator.platform,
      vendor: navigator.vendor || 'unknown',

      // Screen
      screenWidth: screen.width,
      screenHeight: screen.height,
      colorDepth: screen.colorDepth || null,
      pixelRatio: window.devicePixelRatio || 1,
      viewportWidth: window.innerWidth || null,
      viewportHeight: window.innerHeight || null,
      availScreenWidth: screen.availWidth || null,
      availScreenHeight: screen.availHeight || null,
      screenOrientation: screen.orientation?.type || 'unknown',

      // Device
      touchSupport: navigator.maxTouchPoints > 0,
      maxTouchPoints: navigator.maxTouchPoints || 0,
      cpuCores: navigator.hardwareConcurrency || null,
      deviceMemory: navigator.deviceMemory || null,
      isMobile: /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      isTablet: /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent),
      isDesktop: !/Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),

      // Browser capabilities
      cookiesEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack === '1',
      onlineStatus: navigator.onLine,
      languages: navigator.languages ? navigator.languages.join(',') : navigator.language,

      // Connection
      connectionType: navigator.connection?.effectiveType || 'unknown',
      connectionSpeed: navigator.connection?.downlink || null,
      saveDataMode: navigator.connection?.saveData || false,

      // URL details
      protocol: window.location.protocol,
      hostname: window.location.hostname,
      queryString: window.location.search || '',
      pageTitle: document.title,

      // Performance timing
      loadTime: perfTiming.loadEventEnd > 0 ? perfTiming.loadEventEnd - perfTiming.navigationStart : null,
      domContentLoadedTime: perfTiming.domContentLoadedEventEnd > 0 ? perfTiming.domContentLoadedEventEnd - perfTiming.navigationStart : null,
      domInteractiveTime: perfTiming.domInteractive > 0 ? perfTiming.domInteractive - perfTiming.navigationStart : null,
      firstPaint: paintEntries.find(e => e.name === 'first-paint')?.startTime || null,
      firstContentfulPaint: paintEntries.find(e => e.name === 'first-contentful-paint')?.startTime || null,
      serverResponseTime: perfTiming.responseEnd > 0 ? perfTiming.responseEnd - perfTiming.requestStart : null,
      dnsLookupTime: perfTiming.domainLookupEnd > 0 ? perfTiming.domainLookupEnd - perfTiming.domainLookupStart : null,
      tcpConnectionTime: perfTiming.connectEnd > 0 ? perfTiming.connectEnd - perfTiming.connectStart : null,
      transferSize: perfEntries?.transferSize || null,
      encodedBodySize: perfEntries?.encodedBodySize || null,
      decodedBodySize: perfEntries?.decodedBodySize || null,

      // Timezone
      timezoneOffset: new Date().getTimezoneOffset(),

      // UTM parameters
      utmSource: urlParams.get('utm_source') || '',
      utmMedium: urlParams.get('utm_medium') || '',
      utmCampaign: urlParams.get('utm_campaign') || '',
      utmTerm: urlParams.get('utm_term') || '',
      utmContent: urlParams.get('utm_content') || '',

      // Session info
      sessionStartTime: sessionStorage.getItem('pf_session_start') || (() => {
        const start = new Date().toISOString();
        sessionStorage.setItem('pf_session_start', start);
        return start;
      })(),
      pageViewsInSession: parseInt(sessionStorage.getItem('pf_page_views') || '0') + 1,

      // Navigation context
      historyLength: window.history.length,
      isIframe: window.self !== window.top,

      // User preferences
      prefersColorScheme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' :
                         window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'no-preference',
      prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,

      // Security context
      secureContext: window.isSecureContext || false,
    };

    // Update page views counter
    sessionStorage.setItem('pf_page_views', visitorData.pageViewsInSession.toString());

    // Send data to Google Apps Script
    await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(visitorData),
    });

    console.log('[Analytics] Visitor tracking sent successfully');
    return true;
  } catch (error) {
    console.error('[Analytics] Error tracking visitor:', error);
    return false;
  }
}

/**
 * Track custom events (optional)
 */
export async function trackEvent(eventName, eventData = {}) {
  try {
    const data = {
      origin: window.location.origin,
      timestamp: new Date().toISOString(),
      eventName,
      eventData,
      sessionId: getSessionId(),
      url: window.location.href,
    };

    await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    console.log(`[Analytics] Event tracked: ${eventName}`);
    return true;
  } catch (error) {
    console.error('[Analytics] Error tracking event:', error);
    return false;
  }
}
