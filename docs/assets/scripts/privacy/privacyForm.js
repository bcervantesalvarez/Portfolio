// /assets/scripts/privacy/privacyForm.js
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('policyForm');
  if (!form) return; // run on any page without the form, safely no-op

  const btn = form.querySelector('.policy-form-submit');
  const loading = document.getElementById('loadingMessage');

  // Passive context fields
  const ref = form.querySelector('input[name="referrer"]');
  const ua  = form.querySelector('input[name="userAgent"]');
  if (ref) ref.value = document.referrer || '';
  if (ua)  ua.value  = navigator.userAgent || '';

  // Ensure hidden iframe exists and target the form to it
  let frame = document.getElementById('policyFormTarget');
  if (!frame) {
    frame = document.createElement('iframe');
    frame.id = 'policyFormTarget';
    frame.name = 'policyFormTarget';
    frame.style.display = 'none';
    document.body.appendChild(frame);
  }
  form.setAttribute('target', 'policyFormTarget');

  // Only redirect after a submission-triggered load
  let pending = false;
  frame.addEventListener('load', () => {
    if (!pending) return; // ignore initial or unrelated loads
    pending = false;
    const next = form.querySelector('input[name="_next"]')?.value || '/';
    window.location.href = next;
  });

  form.addEventListener('submit', () => {
    pending = true;

    if (btn) {
      btn.disabled = true;
      btn.style.width = btn.getBoundingClientRect().width + 'px';
      btn.textContent = 'Sending…';
    }
    if (loading) loading.style.display = 'block';

    // Failsafe if iframe load never fires (network/CSP issue)
    clearTimeout(window.__policyFormTimeout);
    window.__policyFormTimeout = setTimeout(() => {
      pending = false;
      if (btn) { btn.disabled = false; btn.textContent = 'Send Message'; btn.style.width = ''; }
      if (loading) loading.style.display = 'none';
      console.warn('Form submission appears stalled or blocked by CSP.');
    }, 15000);
  });
});

