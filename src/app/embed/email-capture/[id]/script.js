// Email Capture Embed Script
// This script loads the email capture form into any website

(function() {
  'use strict';
  
  // Get the capture ID from the script src
  const scripts = document.getElementsByTagName('script');
  let captureId = null;
  
  for (let i = 0; i < scripts.length; i++) {
    const src = scripts[i].src;
    if (src && src.includes('/embed/email-capture/') && src.includes('.js')) {
      const match = src.match(/\/embed\/email-capture\/([^\/]+)\.js/);
      if (match) {
        captureId = match[1];
        break;
      }
    }
  }
  
  if (!captureId) {
    console.error('Lynx.NINJA: Could not determine capture ID from script src');
    return;
  }
  
  // Find the container element
  const containerId = 'lynx-email-capture-' + captureId;
  const container = document.getElementById(containerId);
  
  if (!container) {
    console.error('Lynx.NINJA: Container element with ID "' + containerId + '" not found');
    return;
  }
  
  // Create iframe to load the form
  const iframe = document.createElement('iframe');
  iframe.src = window.location.origin + '/embed/email-capture/' + captureId;
  iframe.style.width = '100%';
  iframe.style.height = '400px';
  iframe.style.border = 'none';
  iframe.style.borderRadius = '8px';
  iframe.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
  iframe.style.backgroundColor = 'white';
  
  // Add loading state
  const loadingDiv = document.createElement('div');
  loadingDiv.style.cssText = `
    width: 100%;
    height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  `;
  loadingDiv.innerHTML = `
    <div style="text-align: center;">
      <div style="width: 32px; height: 32px; border: 3px solid #e5e7eb; border-top: 3px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px;"></div>
      <p style="color: #6b7280; margin: 0;">Loading email capture form...</p>
    </div>
  `;
  
  // Add CSS for loading animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
  
  // Replace loading with iframe when loaded
  iframe.onload = function() {
    container.replaceChild(iframe, loadingDiv);
  };
  
  iframe.onerror = function() {
    loadingDiv.innerHTML = `
      <div style="text-align: center; color: #ef4444;">
        <p style="margin: 0;">Failed to load email capture form</p>
      </div>
    `;
  };
  
  // Insert the loading div first
  container.appendChild(loadingDiv);
  
  // Load the iframe
  container.appendChild(iframe);
  
})();
