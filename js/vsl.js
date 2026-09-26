/**
 * Método G90 — Advanced VTurb-Style VSL Engine & Analytics Controller
 * Features:
 * - Hidden controls & zero timeline scrubbing
 * - Smart auto-resume from stored position (localStorage)
 * - Tap-to-pause & overlay resume screen
 * - Precise 3m 05s (185s) CTA reveal synchronization
 * - Built-in Retention & Play Rate Analytics Engine
 */

window.G90_VSL = (function() {
  const STORAGE_POS_KEY = 'g90_vsl_position';
  const STORAGE_CTA_KEY = 'g90_vsl_cta_revealed';
  const STORAGE_STATS_KEY = 'g90_vsl_analytics';

  let trackedMilestones = {
    p10: false,
    p25: false,
    p50: false,
    p75: false,
    p90: false,
    pitch: false,
    p100: false
  };

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function getAnalytics() {
    try {
      const stored = localStorage.getItem(STORAGE_STATS_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return {
      impressions: 0,
      plays: 0,
      p25: 0,
      p50: 0,
      p75: 0,
      pitch: 0,
      p100: 0,
      total_watch_seconds: 0
    };
  }

  function saveAnalytics(stats) {
    try {
      localStorage.setItem(STORAGE_STATS_KEY, JSON.stringify(stats));
    } catch (e) {}
  }

  function recordEvent(type, extraData = {}) {
    const stats = getAnalytics();
    if (type === 'impression') stats.impressions = (stats.impressions || 0) + 1;
    if (type === 'play') stats.plays = (stats.plays || 0) + 1;
    if (type === 'p25') stats.p25 = (stats.p25 || 0) + 1;
    if (type === 'p50') stats.p50 = (stats.p50 || 0) + 1;
    if (type === 'p75') stats.p75 = (stats.p75 || 0) + 1;
    if (type === 'pitch') stats.pitch = (stats.pitch || 0) + 1;
    if (type === 'p100') stats.p100 = (stats.p100 || 0) + 1;
    saveAnalytics(stats);

    if (window.G90_TRACKING) {
      window.G90_TRACKING.trackEvent(`vsl_${type}`, extraData);
    }
  }

  function revealCTA() {
    const ctaContainer = document.getElementById('vsl-cta-container');
    if (!ctaContainer) return;
    ctaContainer.classList.remove('vsl-cta-hidden');
    ctaContainer.classList.add('vsl-cta-visible');

    try {
      localStorage.setItem(STORAGE_CTA_KEY, 'true');
    } catch (e) {}

    if (window.G90_TRACKING) {
      window.G90_TRACKING.trackEvent('cta_visible');
    }
  }

  function initVSLPlayer() {
    const video = document.getElementById('vsl-video');
    const overlay = document.getElementById('vsl-overlay');
    const playTrigger = document.getElementById('vsl-play-trigger');
    const clickCapture = document.getElementById('vsl-click-capture');
    const overlayTitle = document.getElementById('vsl-overlay-title');
    const overlayBadge = document.getElementById('vsl-overlay-badge');

    if (!video || !overlay) return;

    // Ensure no native controls are shown to prevent skipping
    video.controls = false;
    video.removeAttribute('controls');
    video.controlsList = 'nodownload no-fullscreen noremoteplayback';

    // Check if user has saved position from previous session
    let savedPos = 0;
    try {
      savedPos = parseFloat(localStorage.getItem(STORAGE_POS_KEY) || '0');
    } catch (e) {}

    if (savedPos > 5 && overlayTitle && overlayBadge) {
      overlayTitle.textContent = 'CONTINUAR ASSISTINDO';
      overlayBadge.innerHTML = `<span class="vsl-overlay-resume">De onde você parou (${formatTime(savedPos)})</span>`;
    }

    // Check if CTA was previously revealed
    try {
      if (localStorage.getItem(STORAGE_CTA_KEY) === 'true' || window.G90_CONFIG.isPreviewCTA()) {
        revealCTA();
      }
    } catch (e) {}

    let isPlaying = false;

    function playVideo() {
      if (isPlaying) return;

      if (savedPos > 5 && Math.abs(video.currentTime - savedPos) > 2) {
        try {
          video.currentTime = savedPos;
        } catch (e) {}
      }

      const promise = video.play();
      if (promise !== undefined) {
        promise.then(() => {
          isPlaying = true;
          overlay.classList.add('vsl-playing');
          recordEvent('play', { start_time: video.currentTime });
        }).catch(() => {
          video.muted = true;
          video.play().then(() => {
            isPlaying = true;
            overlay.classList.add('vsl-playing');
          });
        });
      }
    }

    function pauseVideo() {
      if (!isPlaying) return;
      video.pause();
      isPlaying = false;
      overlay.classList.remove('vsl-playing');

      if (overlayTitle && overlayBadge) {
        overlayTitle.textContent = 'VÍDEO PAUSADO';
        overlayBadge.innerHTML = `<span class="vsl-overlay-resume">Clique para continuar (${formatTime(video.currentTime)})</span>`;
      }
    }

    if (playTrigger) {
      playTrigger.addEventListener('click', function(e) {
        e.stopPropagation();
        playVideo();
      });
    }

    overlay.addEventListener('click', function() {
      playVideo();
    });

    if (clickCapture) {
      clickCapture.addEventListener('click', function() {
        if (isPlaying) {
          pauseVideo();
        } else {
          playVideo();
        }
      });
    }

    // Monitor video timeupdate for CTA reveal, milestones, and progress saving
    video.addEventListener('timeupdate', function() {
      const current = video.currentTime;
      const duration = video.duration || 1;
      const percent = (current / duration) * 100;

      // Save position to localStorage
      if (current > 2) {
        try {
          localStorage.setItem(STORAGE_POS_KEY, current.toFixed(1));
        } catch (e) {}
      }

      // Check 3m 05s CTA Delay (185 seconds or config CTA_DELAY_MS / 1000)
      const ctaTargetSec = (window.G90_CONFIG.CTA_DELAY_MS || 185000) / 1000;
      if (current >= ctaTargetSec || window.G90_CONFIG.isPreviewCTA()) {
        revealCTA();
      }

      // Track retention milestones
      if (percent >= 25 && !trackedMilestones.p25) {
        trackedMilestones.p25 = true;
        recordEvent('p25');
      }
      if (percent >= 50 && !trackedMilestones.p50) {
        trackedMilestones.p50 = true;
        recordEvent('p50');
      }
      if (percent >= 75 && !trackedMilestones.p75) {
        trackedMilestones.p75 = true;
        recordEvent('p75');
      }
      if (current >= ctaTargetSec && !trackedMilestones.pitch) {
        trackedMilestones.pitch = true;
        recordEvent('pitch');
      }
    });

    video.addEventListener('ended', function() {
      isPlaying = false;
      if (!trackedMilestones.p100) {
        trackedMilestones.p100 = true;
        recordEvent('p100');
      }
      revealCTA();
      try {
        localStorage.removeItem(STORAGE_POS_KEY);
      } catch (e) {}
    });
  }

  return {
    init: function() {
      recordEvent('impression');
      initVSLPlayer();
    },
    forceShowCTA: function() {
      revealCTA();
    },
    getAnalytics: getAnalytics
  };
})();
