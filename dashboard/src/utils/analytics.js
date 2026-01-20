// Analytics tracking for visitor data
// Sends visitor information to Google Sheets via Apps Script

const SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE';

/**
 * Collects visitor data and sends to Google Sheets
 */
export async function trackVisitor() {
  try {
    // Get visitor data
    const visitorData = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      pathname: window.location.pathname,
      referrer: document.referrer || 'Direct',
      userAgent: navigator.userAgent,
      language: navigator.language,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      // Session ID (stored in sessionStorage for unique visits)
      sessionId: getSessionId(),
    };

    // Send data to Google Apps Script
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', // Required for Google Apps Script
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(visitorData),
    });

    console.log('Visitor tracking sent successfully');
    return true;
  } catch (error) {
    console.error('Error tracking visitor:', error);
    return false;
  }
}

/**
 * Gets or creates a session ID for the current visit
 */
function getSessionId() {
  let sessionId = sessionStorage.getItem('visitor_session_id');

  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('visitor_session_id', sessionId);
  }

  return sessionId;
}

/**
 * Track custom events (optional)
 */
export async function trackEvent(eventName, eventData = {}) {
  try {
    const data = {
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

    console.log(`Event tracked: ${eventName}`);
    return true;
  } catch (error) {
    console.error('Error tracking event:', error);
    return false;
  }
}
