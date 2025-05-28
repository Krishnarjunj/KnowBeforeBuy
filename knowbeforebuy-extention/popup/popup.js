// Popup script
document.addEventListener('DOMContentLoaded', async () => {
  const statusDiv = document.getElementById('status');
  const statusText = document.getElementById('status-text');

  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Check if current site is supported
    const supportedDomains = ['amazon.com', 'nykaa.com', 'flipkart.com', 'myntra.com'];
    const isSupported = supportedDomains.some(domain => tab.url.includes(domain));

    if (isSupported) {
      statusDiv.className = 'status active';
      statusText.textContent = '✓ Extension active on this page';
    } else {
      statusDiv.className = 'status inactive';
      statusText.textContent = '⚠ Visit a supported e-commerce site';
    }
  } catch (error) {
    statusDiv.className = 'status inactive';
    statusText.textContent = '❌ Error checking page status';
  }
});
