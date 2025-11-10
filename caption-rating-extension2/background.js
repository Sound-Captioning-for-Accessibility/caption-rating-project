const API_BASE = 'http://127.0.0.1:5000';

// Handle API requests from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'API_REQUEST') {
    handleAPIRequest(request, sendResponse);
    return true; // Indicates we will send a response asynchronously
  }
  
  // Handle video detection
  if (request.type === 'VIDEO_DETECTED') {
    // This is handled by tabs.onUpdated below
    return false;
  }
});

async function handleAPIRequest(request, sendResponse) {
  try {
    const { endpoint, method, body } = request;
    const url = `${API_BASE}${endpoint}`;
    
    const options = {
      method: method || 'GET',
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    const data = await response.json().catch(() => null);
    
    sendResponse({
      success: response.ok,
      status: response.status,
      data: data
    });
  } catch (error) {
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Only send message when page is fully loaded
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes("youtube.com/watch")) {
      const queryParameters = tab.url.split("?")[1];
    if (queryParameters) {
      const urlParameters = new URLSearchParams(queryParameters);
      const videoId = urlParameters.get("v");
  
      if (videoId) {
        // Send message with error handling
      chrome.tabs.sendMessage(tabId, {
        type: "NEW",
          videoId: videoId,
        }).catch((error) => {
          // Ignore errors if content script isn't ready yet
          // The content script will initialize itself when it loads
          console.log('Message not sent (content script may not be ready):', error.message);
        });
      }
    }
    }
  });
  