import { API_BASE_URL } from '../config';

// Helper function for API calls
const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

// User API
export const userApi = {
  getAll: () => apiCall('/api/users/'),
  
  getById: (userId) => apiCall(`/api/users/${userId}`),
  
  create: (email) => apiCall('/api/users/', {
    method: 'POST',
    body: JSON.stringify({ email }),
  }),
  
  update: (userId, email) => apiCall(`/api/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify({ email }),
  }),
  
  delete: (userId) => apiCall(`/api/users/${userId}`, {
    method: 'DELETE',
  }),
};

// Video API
export const videoApi = {
  getAll: () => apiCall('/api/videos'),
  
  getById: (videoId) => apiCall(`/api/videos/${videoId}`),
  
  add: (videoId) => apiCall(`/api/videos/${videoId}`, {
    method: 'POST',
  }),
  
  delete: (videoId) => apiCall(`/api/videos/${videoId}`, {
    method: 'DELETE',
  }),
};

// Rating API
export const ratingApi = {
  getAll: () => apiCall('/api/ratings'),
  
  getById: (ratingId) => apiCall(`/api/ratings/${ratingId}`),
  
  create: (ratingData) => apiCall('/api/ratings', {
    method: 'POST',
    body: JSON.stringify(ratingData),
  }),
  
  update: (ratingId, ratingData) => apiCall(`/api/ratings/${ratingId}`, {
    method: 'PATCH',
    body: JSON.stringify(ratingData),
  }),
  
  delete: (ratingId) => apiCall(`/api/ratings/${ratingId}`, {
    method: 'DELETE',
  }),
};

// Helper to extract YouTube video ID from URL
export const extractVideoId = (url) => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  // If it's already just an ID (11 characters), return it
  if (url.length === 11 && /^[a-zA-Z0-9_-]+$/.test(url)) {
    return url;
  }
  
  return null;
};






