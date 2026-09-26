/**
 * Método G90 — Analytics & UTM Tracking Engine
 * Extracts, preserves, and dispatches lead analytics data and UTM tags across user journey.
 */

window.G90_TRACKING = (function() {
  // Extract UTM parameters from current URL
  function getUTMParams() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
      utm_source: urlParams.get('utm_source') || '',
      utm_medium: urlParams.get('utm_medium') || '',
      utm_campaign: urlParams.get('utm_campaign') || '',
      utm_content: urlParams.get('utm_content') || '',
      utm_term: urlParams.get('utm_term') || ''
    };
  }

  // Detect basic device type
  function getDeviceType() {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  }

  // Dispatch event to dataLayer / Google Tag Manager / Meta Pixel if available
  function trackEvent(eventName, payload = {}) {
    const eventData = {
      event: eventName,
      timestamp: new Date().toISOString(),
      page_url: window.location.href,
      device: getDeviceType(),
      ...getUTMParams(),
      ...payload
    };

    console.log(`[G90 Tracking] Event dispatched: ${eventName}`, eventData);

    // Push to Google Tag Manager dataLayer if available
    if (window.dataLayer && Array.isArray(window.dataLayer)) {
      window.dataLayer.push(eventData);
    }

    // Trigger Meta Pixel custom event if available
    if (typeof window.fbq === 'function') {
      window.fbq('trackCustom', eventName, eventData);
    }
  }

  return {
    getUTMParams: getUTMParams,
    getDeviceType: getDeviceType,
    trackEvent: trackEvent,
    init: function() {
      trackEvent('page_view');
    }
  };
})();
