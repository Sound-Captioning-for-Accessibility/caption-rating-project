const DEV = true;
const API_BASE = DEV ? 'http://localhost:5173' : 'http://157.245.5.153';

const GOOGLE_OAUTH_CLIENT_ID = '1004384720614-6de1um52djb3aodeabol8f3jmo2ai31k.apps.googleusercontent.com';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'API_REQUEST') {
    handleAPIRequest(request)
      .then(result => sendResponse({ success: true, ...result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.type === 'GOOGLE_AUTH') {
    handleGoogleAuth()
      .then(userID => sendResponse({ success: true, userID }))
      .catch(err => sendResponse({ success: false, error: err.message }));
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
async function handleGoogleAuth() {
  if (!GOOGLE_OAUTH_CLIENT_ID || GOOGLE_OAUTH_CLIENT_ID.startsWith('YOUR_')) {
    throw new Error('Extension Google OAuth client ID is not configured.');
  }

  const redirectUri = chrome.identity.getRedirectURL('oauth2');
  const params = new URLSearchParams({
    client_id: GOOGLE_OAUTH_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'id_token',
    scope: 'openid email profile',
    nonce: String(Date.now()),
  });
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  const redirectUrl = await new Promise((resolve, reject) => {
    chrome.identity.launchWebAuthFlow(
      { url: authUrl, interactive: true },
      (url) => {
        if (chrome.runtime.lastError || !url) {
          reject(new Error(chrome.runtime.lastError?.message || 'Google auth failed'));
        } else {
          resolve(url);
        }
      },
    );
  });

  const fragment = redirectUrl.split('#')[1] || '';
  const search = new URLSearchParams(fragment);
  const idToken = search.get('id_token');
  if (!idToken) {
    throw new Error('No id_token returned from Google');
  }

  const res = await fetch(`${API_BASE}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential: idToken }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || res.statusText);
  }
  const data = await res.json();
  await chrome.storage.local.set({
    backendUserID: data.userID,
    backendUserName: data.displayName || '',
    backendUserAvatarUrl: data.avatarUrl || '',
  });
  return data.userID;
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
