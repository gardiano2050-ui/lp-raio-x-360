/**
 * Método G90 — Multi-Step Form & Modal Handler
 * Manages 3-step modal flow, progress indicators, phone input masking, step validation, webhook dispatch, and instant WhatsApp redirection.
 */

window.G90_FORM = (function() {
  let isSubmitting = false;
  let currentStep = 1;

  // Phone input mask for Brazilian phone format (00) 00000-0000
  function applyPhoneMask(input) {
    input.addEventListener('input', function(e) {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length > 11) value = value.slice(0, 11);

      if (value.length > 6) {
        value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
      } else if (value.length > 2) {
        value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
      } else if (value.length > 0) {
        value = `(${value}`;
      }
      e.target.value = value;
    });
  }

  // Multi-step navigation function
  function goToStep(targetStep) {
    if (targetStep < 1 || targetStep > 3) return;
    currentStep = targetStep;

    const form = document.getElementById('raiox-form');
    if (!form) return;

    // Show active step panel & hide others
    const steps = form.querySelectorAll('.form-step');
    steps.forEach(stepEl => {
      const stepNum = parseInt(stepEl.getAttribute('data-step'), 10);
      if (stepNum === currentStep) {
        stepEl.classList.add('form-step-active');
        stepEl.style.setProperty('display', 'block', 'important');
      } else {
        stepEl.classList.remove('form-step-active');
        stepEl.style.setProperty('display', 'none', 'important');
      }
    });

    // Ensure Step 3 submit button is enabled & ready
    if (currentStep === 3) {
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = false;
      }
    }

    // Update progress bar fill width
    const progressFill = document.getElementById('step-progress-fill');
    if (progressFill) {
      const percentages = { 1: '33.33%', 2: '66.66%', 3: '100%' };
      progressFill.style.width = percentages[currentStep] || '33.33%';
    }

    // Update step badge indicators
    for (let i = 1; i <= 3; i++) {
      const badge = document.getElementById(`step-badge-${i}`);
      if (!badge) continue;
      badge.classList.remove('step-badge-active', 'step-badge-completed');

      if (i === currentStep) {
        badge.classList.add('step-badge-active');
      } else if (i < currentStep) {
        badge.classList.add('step-badge-completed');
      }
    }

    // Focus first input in active step panel
    const activeStepEl = form.querySelector(`.form-step[data-step="${currentStep}"]`);
    if (activeStepEl) {
      const firstInput = activeStepEl.querySelector('input, select, textarea');
      if (firstInput) firstInput.focus();
    }

    // Track step view event
    if (window.G90_TRACKING) {
      window.G90_TRACKING.trackEvent(`form_step_${currentStep}`);
    }
  }

  // Validate specific step fields before advancing
  function validateStepFields(stepNumber) {
    const form = document.getElementById('raiox-form');
    if (!form) return false;

    let isValid = true;
    const stepEl = form.querySelector(`.form-step[data-step="${stepNumber}"]`);
    if (!stepEl) return true;

    const requiredInputs = stepEl.querySelectorAll('[required]');

    requiredInputs.forEach(input => {
      const errorMsgEl = input.parentNode.querySelector('.input-error-msg');
      const val = (input.value || '').trim();

      if (!val) {
        isValid = false;
        input.classList.add('input-error');
        if (errorMsgEl) errorMsgEl.style.display = 'block';
      } else {
        input.classList.remove('input-error');
        if (errorMsgEl) errorMsgEl.style.display = 'none';
      }

      if (input.type === 'tel' || input.id === 'whatsapp') {
        const rawDigits = val.replace(/\D/g, '');
        if (rawDigits.length < 10) {
          isValid = false;
          input.classList.add('input-error');
          if (errorMsgEl) errorMsgEl.style.display = 'block';
        }
      }

      if (input.type === 'email' || input.id === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(val)) {
          isValid = false;
          input.classList.add('input-error');
          if (errorMsgEl) errorMsgEl.style.display = 'block';
        }
      }
    });

    return isValid;
  }

  // Open modal popup & reset to Step 1
  function openModal() {
    const modal = document.getElementById('raiox-modal');
    if (!modal) return;
    modal.classList.add('modal-active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Reset to Step 1 on open
    goToStep(1);

    if (window.G90_TRACKING) {
      window.G90_TRACKING.trackEvent('form_open');
    }
  }

  // Close modal popup
  function closeModal() {
    const modal = document.getElementById('raiox-modal');
    if (!modal) return;
    modal.classList.remove('modal-active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  // Setup event listeners for modal buttons & step controls
  function setupModalListeners() {
    const openBtns = document.querySelectorAll('.js-open-raiox-modal');
    openBtns.forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        if (window.G90_TRACKING) {
          window.G90_TRACKING.trackEvent('cta_click');
        }
        openModal();
      });
    });

    const closeBtns = document.querySelectorAll('.js-close-modal');
    closeBtns.forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        closeModal();
      });
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        closeModal();
      }
    });

    const modalBackdrop = document.querySelector('.modal-backdrop');
    if (modalBackdrop) {
      modalBackdrop.addEventListener('click', closeModal);
    }
  }

  // Setup form step navigation using robust event delegation
  function setupStepNavigation(form) {
    form.addEventListener('click', function(e) {
      const nextBtn = e.target.closest('.js-next-step');
      if (nextBtn) {
        e.preventDefault();
        const targetStep = parseInt(nextBtn.getAttribute('data-next'), 10);
        const fromStep = targetStep - 1;

        if (validateStepFields(fromStep)) {
          goToStep(targetStep);
        }
        return;
      }

      const prevBtn = e.target.closest('.js-prev-step');
      if (prevBtn) {
        e.preventDefault();
        const targetStep = parseInt(prevBtn.getAttribute('data-prev'), 10);
        goToStep(targetStep);
        return;
      }
    });

    // Handle Enter key on inputs in Step 1 & 2 to advance
    const inputs = form.querySelectorAll('input, select');
    inputs.forEach(input => {
      input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (currentStep < 3 && validateStepFields(currentStep)) {
            goToStep(currentStep + 1);
          }
        }
      });
    });
  }

  // Explicit validation on final form submit
  function validateFormOnSubmit(form) {
    let isValid = true;
    for (let s = 1; s <= 3; s++) {
      if (!validateStepFields(s)) {
        isValid = false;
        goToStep(s);
        break;
      }
    }
    return isValid;
  }

  // Handle final form submission with instant zero-delay WhatsApp redirection
  function handleSubmit(e) {
    e.preventDefault();
    if (isSubmitting) return;

    const form = e.target;
    if (!validateFormOnSubmit(form)) {
      console.warn('[G90 Form] Submit validation failed.');
      return;
    }

    isSubmitting = true;

    // Collect lead data across all steps
    const formData = new FormData(form);
    const utms = window.G90_TRACKING ? window.G90_TRACKING.getUTMParams() : {};
    const device = window.G90_TRACKING ? window.G90_TRACKING.getDeviceType() : 'desktop';

    const rawPhone = (formData.get('whatsapp') || '').replace(/\D/g, '');

    const payload = {
      nome: (formData.get('nome') || '').trim(),
      whatsapp: rawPhone || formData.get('whatsapp'),
      email: (formData.get('email') || '').trim(),
      empresa: (formData.get('empresa') || '').trim(),
      segmento: formData.get('segmento') || '',
      faturamento: formData.get('faturamento') || '',
      funcionarios: formData.get('funcionarios') || '',
      desafio: formData.get('desafio') || '',
      preocupacao: (formData.get('preocupacao') || '').trim(),
      canal: 'Site',
      status: 'Recebido',
      data_envio: new Date().toISOString(),
      origem_url: window.location.href,
      pagina_origem: document.referrer || window.location.origin,
      dispositivo: device,
      utm_source: utms.utm_source || '',
      utm_medium: utms.utm_medium || '',
      utm_campaign: utms.utm_campaign || '',
      utm_content: utms.utm_content || '',
      utm_term: utms.utm_term || ''
    };

    if (window.G90_TRACKING) {
      window.G90_TRACKING.trackEvent('form_submit', payload);
    }

    // Send lead to Webhook Endpoint with keepalive (runs asynchronously in background)
    try {
      const webhookBase = window.G90_CONFIG.WEBHOOK_URL || window.G90_CONFIG.CRM_ENDPOINT;
      const secret = window.G90_CONFIG.WEBHOOK_SECRET;

      if (webhookBase) {
        const webhookUrl = `${webhookBase}?secret=${encodeURIComponent(secret)}`;
        
        fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-webhook-secret': secret
          },
          body: JSON.stringify(payload),
          keepalive: true
        }).catch(err => console.warn('[G90 Webhook] Call failed:', err));
      }

      if (window.G90_TRACKING) {
        window.G90_TRACKING.trackEvent('crm_success');
      }
    } catch (error) {
      console.error('[G90 Form] Submit Error:', error);
    }

    // Build WhatsApp URL for new number: 5511971445159
    const waNumber = (window.G90_CONFIG.WHATSAPP_NUMBER || '5511971445159').replace(/\D/g, '');
    const waMessage = encodeURIComponent(window.G90_CONFIG.WHATSAPP_MESSAGE_TEMPLATE);
    const waUrl = `https://wa.me/${waNumber}?text=${waMessage}`;

    if (window.G90_TRACKING) {
      window.G90_TRACKING.trackEvent('whatsapp_redirect', { whatsapp_url: waUrl });
    }

    // Instant Zero-Delay Redirection ("bum!")
    window.location.href = waUrl;
  }

  return {
    init: function() {
      const phoneInput = document.getElementById('whatsapp');
      if (phoneInput) {
        applyPhoneMask(phoneInput);
      }

      setupModalListeners();

      const form = document.getElementById('raiox-form');
      if (form) {
        setupStepNavigation(form);
        form.addEventListener('submit', handleSubmit);
      }
    }
  };
})();
