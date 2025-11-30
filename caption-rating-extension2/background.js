const API_BASE = 'http://127.0.0.1:5000';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'API_REQUEST') {
    handleAPIRequest(request)
      .then(result => sendResponse({ success: true, ...result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  return false;
});

async function handleAPIRequest(request) {
  const { endpoint, method = 'GET', body } = request;
  
  const url = endpoint.startsWith('/') 
    ? `${API_BASE}${endpoint}` 
    : `${API_BASE}/${endpoint}`;
  
  const options = {
    method: method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };
  
  if (['POST', 'PATCH', 'PUT'].includes(method)) {
    options.body = body ? JSON.stringify(body) : '{}';
  }
  
  try {
    const response = await fetch(url, options);
    let data = null;
    
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch (e) {
        const text = await response.text();
        data = text ? { message: text } : null;
      }
    } else {
      const text = await response.text();
      data = text ? { message: text } : null;
    }
    
    if (!response.ok) {
      const errorMsg = data?.message || data?.error || `HTTP ${response.status}`;
      throw new Error(errorMsg);
    }
    
    return { data, status: response.status };
  } catch (error) {
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      throw new Error(`Cannot connect to backend at ${API_BASE}. Make sure Flask server is running.`);
    }
    throw error;
  }
}

// Video detection
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url?.includes('youtube.com/watch')) {
    const urlParams = new URLSearchParams(tab.url.split('?')[1]);
    const videoId = urlParams.get('v');
    if (videoId) {
      chrome.tabs.sendMessage(tabId, { type: 'NEW', videoId }).catch(() => {
      });
    }
  }
});
