/**
 * Método G90 — Main Application Bootstrapper
 * Initializes tracking, VSL controller, modal and form listeners once DOM is ready.
 */

document.addEventListener('DOMContentLoaded', function() {
  console.log('[Método G90] Application initializing...');

  // Initialize Analytics & Tracking
  if (window.G90_TRACKING) {
    window.G90_TRACKING.init();
  }

  // Initialize VSL Controller & CTA Delay Timer
  if (window.G90_VSL) {
    window.G90_VSL.init();
  }

  // Initialize Modal & Form Logic
  if (window.G90_FORM) {
    window.G90_FORM.init();
  }

  console.log('[Método G90] Application ready.');
});
