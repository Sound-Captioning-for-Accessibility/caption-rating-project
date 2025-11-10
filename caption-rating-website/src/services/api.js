import { API_BASE_URL } from '../config';

// Simple API call helper
const apiCall = async (endpoint, options = {}) => {
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
};

// User API
export const userApi = {
  getAll: () => apiCall('/api/users/'),
  getById: (userId) => apiCall(`/api/users/${userId}`),
  create: (email) => apiCall('/api/users/', {
    method: 'POST',
    body: JSON.stringify({ email }),
  }),
};

// Video API
export const videoApi = {
  getAll: () => apiCall('/api/videos'),
  getById: (videoId) => apiCall(`/api/videos/${videoId}`),
  add: (videoId) => apiCall(`/api/videos/${videoId}`, {
    method: 'POST',
  }),
};

// Rating API
export const ratingApi = {
  getAll: () => apiCall('/api/ratings'),
  create: (ratingData) => apiCall('/api/ratings', {
    method: 'POST',
    body: JSON.stringify(ratingData),
  }),
};
