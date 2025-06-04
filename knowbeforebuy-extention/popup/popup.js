document.addEventListener('DOMContentLoaded', async () => {
  const statusDiv = document.getElementById('status');
  const statusText = document.getElementById('status-text');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const supportedDomains = ['amazon.in', 'nykaa.com', 'flipkart.com', 'myntra.com'];
    const currentHostname = new URL(tab.url).hostname;

    const isSupported = supportedDomains.some(domain => currentHostname.includes(domain));

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
    console.error('Popup domain check error:', error);
  }
});
