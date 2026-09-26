/**
 * Método G90 — Form & Modal Handler
 * Manages modal display, phone input masking, dynamic button enabling, webhook dispatch, and WhatsApp redirection.
 */

window.G90_FORM = (function() {
  let isSubmitting = false;

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

  // Open modal popup
  function openModal() {
    const modal = document.getElementById('raiox-modal');
    if (!modal) return;
    modal.classList.add('modal-active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    if (window.G90_TRACKING) {
      window.G90_TRACKING.trackEvent('form_open');
    }

    const firstInput = modal.querySelector('input, select, textarea');
    if (firstInput) firstInput.focus();
  }

  // Close modal popup
  function closeModal() {
    const modal = document.getElementById('raiox-modal');
    if (!modal) return;
    modal.classList.remove('modal-active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  // Setup event listeners for modal & keyboard
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

  // Check overall form validity for real-time button enabling
  function checkFormValidity(form) {
    const requiredInputs = form.querySelectorAll('[required]');
    let allValid = true;

    requiredInputs.forEach(input => {
      const val = (input.value || '').trim();
      if (!val) {
        allValid = false;
      }

      if (input.type === 'tel' || input.id === 'whatsapp') {
        const rawDigits = val.replace(/\D/g, '');
        if (rawDigits.length < 10) {
          allValid = false;
        }
      }

      if (input.type === 'email' || input.id === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(val)) {
          allValid = false;
        }
      }
    });

    return allValid;
  }

  // Update button disabled state dynamically
  function updateSubmitButtonState(form) {
    const submitBtn = form.querySelector('button[type="submit"]');
    if (!submitBtn || isSubmitting) return;

    const isValid = checkFormValidity(form);
    submitBtn.disabled = !isValid;
  }

  // Setup real-time listeners for input changes
  function setupRealtimeValidation(form) {
    updateSubmitButtonState(form);

    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      input.addEventListener('input', function() {
        updateSubmitButtonState(form);
      });
      input.addEventListener('change', function() {
        updateSubmitButtonState(form);
      });
      input.addEventListener('blur', function() {
        updateSubmitButtonState(form);
      });
    });
  }

  // Explicit validation for errors feedback on submit
  function validateFormOnSubmit(form) {
    let isValid = true;
    const requiredInputs = form.querySelectorAll('[required]');

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
    });

    const phoneInput = form.querySelector('#whatsapp');
    if (phoneInput) {
      const rawDigits = phoneInput.value.replace(/\D/g, '');
      const phoneErrorMsg = phoneInput.parentNode.querySelector('.input-error-msg');
      if (rawDigits.length < 10) {
        isValid = false;
        phoneInput.classList.add('input-error');
        if (phoneErrorMsg) phoneErrorMsg.style.display = 'block';
      }
    }

    const emailInput = form.querySelector('#email');
    if (emailInput) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const emailErrorMsg = emailInput.parentNode.querySelector('.input-error-msg');
      if (!emailRegex.test(emailInput.value.trim())) {
        isValid = false;
        emailInput.classList.add('input-error');
        if (emailErrorMsg) emailErrorMsg.style.display = 'block';
      }
    }

    return isValid;
  }

  // Handle form submission
  async function handleSubmit(e) {
    e.preventDefault();
    if (isSubmitting) return;

    const form = e.target;
    if (!validateFormOnSubmit(form)) {
      console.warn('[G90 Form] Submit validation failed.');
      return;
    }

    isSubmitting = true;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;

    // Set loading state
    submitBtn.disabled = true;
    submitBtn.classList.add('btn-loading');
    submitBtn.innerHTML = `
      <svg class="spinner" viewBox="0 0 50 50">
        <circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
      </svg>
      <span>Enviando...</span>
    `;

    // Collect lead data
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
      ...utms
    };

    if (window.G90_TRACKING) {
      window.G90_TRACKING.trackEvent('form_submit', payload);
    }

    // Send lead to Webhook Endpoint
    try {
      const webhookBase = window.G90_CONFIG.WEBHOOK_URL || window.G90_CONFIG.CRM_ENDPOINT;
      const secret = window.G90_CONFIG.WEBHOOK_SECRET;

      if (webhookBase) {
        const webhookUrl = `${webhookBase}?secret=${encodeURIComponent(secret)}`;
        
        await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-webhook-secret': secret
          },
          body: JSON.stringify(payload)
        }).then(res => {
          console.log('[G90 Webhook] Response Status:', res.status);
          return res;
        }).catch(err => console.warn('[G90 Webhook] Call failed:', err));
      }

      if (window.G90_TRACKING) {
        window.G90_TRACKING.trackEvent('crm_success');
      }

      // Success feedback
      submitBtn.classList.remove('btn-loading');
      submitBtn.classList.add('btn-success');
      submitBtn.innerHTML = `<span>Solicitação Enviada! Redirecionando...</span>`;

      // Redirect to WhatsApp
      const waNumber = window.G90_CONFIG.WHATSAPP_NUMBER.replace(/\D/g, '');
      const waMessage = encodeURIComponent(window.G90_CONFIG.WHATSAPP_MESSAGE_TEMPLATE);
      const waUrl = `https://wa.me/${waNumber}?text=${waMessage}`;

      if (window.G90_TRACKING) {
        window.G90_TRACKING.trackEvent('whatsapp_redirect', { whatsapp_url: waUrl });
      }

      setTimeout(() => {
        window.location.href = waUrl;
      }, 1200);

    } catch (error) {
      console.error('[G90 Form] Submit Error:', error);
      submitBtn.disabled = false;
      isSubmitting = false;
      submitBtn.classList.remove('btn-loading');
      submitBtn.innerHTML = originalBtnText;
    }
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
        setupRealtimeValidation(form);
        form.addEventListener('submit', handleSubmit);
      }
    }
  };
})();
