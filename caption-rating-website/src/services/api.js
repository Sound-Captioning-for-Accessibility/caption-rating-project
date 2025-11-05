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
  // Get all users
  getAll: () => apiCall('/api/users/'),
  
  // Get user by ID
  getById: (userId) => apiCall(`/api/users/${userId}`),
  
  // Create user
  create: (email) => apiCall('/api/users/', {
    method: 'POST',
    body: JSON.stringify({ email }),
  }),
  
  // Update user
  update: (userId, email) => apiCall(`/api/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify({ email }),
  }),
  
  // Delete user
  delete: (userId) => apiCall(`/api/users/${userId}`, {
    method: 'DELETE',
  }),
};

// Video API
export const videoApi = {
  // Get all videos
  getAll: () => apiCall('/api/videos'),
  
  // Get video by ID
  getById: (videoId) => apiCall(`/api/videos/${videoId}`),
  
  // Add video (fetches metadata from YouTube)
  add: (videoId) => apiCall(`/api/videos/${videoId}`, {
    method: 'POST',
  }),
  
  // Delete video
  delete: (videoId) => apiCall(`/api/videos/${videoId}`, {
    method: 'DELETE',
  }),
};

// Rating API
export const ratingApi = {
  // Get all ratings
  getAll: () => apiCall('/api/ratings'),
  
  // Get rating by ID
  getById: (ratingId) => apiCall(`/api/ratings/${ratingId}`),
  
  // Create rating
  create: (ratingData) => apiCall('/api/ratings', {
    method: 'POST',
    body: JSON.stringify(ratingData),
  }),
  
  // Update rating
  update: (ratingId, ratingData) => apiCall(`/api/ratings/${ratingId}`, {
    method: 'PATCH',
    body: JSON.stringify(ratingData),
  }),
  
  // Delete rating
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

