const BACKEND_URL = 'http://localhost:5000';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzePage') {
    handlePageAnalysis(request, sendResponse);
    return true; 
  } else if (request.action === 'sendChatMessage') {
    handleChatMessage(request, sendResponse);
    return true;
  }
});

async function handlePageAnalysis(request, sendResponse) {
  try {
    const response = await fetch(`${BACKEND_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: request.url,
        content: request.content
      })
    });

    const data = await response.json();
    

    chrome.storage.local.set({
      [`analyzed_${request.url}`]: data.content
    });

    sendResponse({ success: true, data: data });
  } catch (error) {
    console.error('Error analyzing page:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleChatMessage(request, sendResponse) {
  try {

    const result = await chrome.storage.local.get([`analyzed_${request.url}`]);
    const context = result[`analyzed_${request.url}`] || '';

    const response = await fetch(`${BACKEND_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: request.message,
        context: context,
        url: request.url
      })
    });

    const data = await response.json();
    sendResponse({ success: true, reply: data.reply });
  } catch (error) {
    console.error('Error sending chat message:', error);
    sendResponse({ success: false, error: error.message });
  }
}
