/**
 * Método G90 — Global App Configuration
 * Centralized settings for Landing Page timers, CRM endpoints, WhatsApp redirects, and analytics.
 */

window.G90_CONFIG = {
  // CTA Delay in milliseconds (185000ms = 3 minutes and 5 seconds).
  CTA_DELAY_MS: 185000,

  // VSL Video URL (Local MP4 or Cloudflare R2 / Cloudflare Stream HLS URL)
  VSL_VIDEO_URL: "video/vsl.mp4",

  // Admin Dashboard Security Configuration
  ADMIN_PASSWORD: "g90admin2026",

  // Webhook Integration Settings (Supabase Lead Receiver)
  WEBHOOK_URL: "https://gfggcoororfktycvphpx.supabase.co/functions/v1/receive-lead-gardiano",
  WEBHOOK_SECRET: "Kb9sxIucsrXV4SBi4X7moHx8v81t5cFHT9SDDvT2VI9",

  // WhatsApp Redirect Configuration
  // Insert official WhatsApp number here (country code + area code + phone number)
  WHATSAPP_NUMBER: "5511971445159", 
  
  // Default pre-filled message sent to Rogério Gardiano
  WHATSAPP_MESSAGE_TEMPLATE: "Olá, Rogério! Acabei de solicitar meu Raio-X 360º G90 e quero entender se o diagnóstico faz sentido para minha empresa.",

  // Helper function to check if preview mode is active (?preview_cta=true or ?cta=now)
  isPreviewCTA: function() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('preview_cta') === 'true' || urlParams.get('cta') === 'now';
  }
};
