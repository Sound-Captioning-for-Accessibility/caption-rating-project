window.showRatingForm = function showRatingForm(ratingType) {
    // Remove existing popup
    const existing = document.getElementById('caption-rating-popup');
    if (existing) existing.remove();

    function apiCall(endpoint, method = 'GET', body = null) {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
                type: 'API_REQUEST',
                endpoint,
                method,
                body
            }, (response) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else if (response?.success) {
                    resolve(response.data);
                } else {
                    reject(new Error(response?.error || 'API request failed'));
                }
            });
        });
    }

    // Get or create user
    async function getOrCreateUser() {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get(['userID'], async (result) => {
                if (result.userID) {
                    try {
                        await apiCall(`/api/users/${result.userID}`, 'GET');
                        resolve(result.userID);
                        return;
                    } catch (err) {
                        console.warn('Stored userID invalid, creating new user:', err);
                        chrome.storage.local.remove(['userID']);
                    }
                }

                // Create new user
                try {
                    const email = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}@caption.local`;
                    const users = await apiCall('/api/users/', 'POST', { email });
                    
                    if (Array.isArray(users) && users.length > 0) {
                        const user = users.find(u => u.email === email);
                        if (user && user.userID) {
                            chrome.storage.local.set({ userID: user.userID });
                            resolve(user.userID);
                        } else {
                            const lastUser = users[users.length - 1];
                            if (lastUser && lastUser.userID) {
                                chrome.storage.local.set({ userID: lastUser.userID });
                                resolve(lastUser.userID);
                            } else {
                                reject(new Error('Invalid user response from server'));
                            }
                        }
                    } else {
                        reject(new Error('Failed to create user - empty response'));
                    }
                } catch (err) {
                    console.error('User creation error:', err);
                    reject(new Error(`Failed to create user: ${err.message}`));
                }
            });
        });
    }

    // Create popup
    const overlay = document.createElement('div');
    overlay.id = 'caption-rating-popup';
    Object.assign(overlay.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        background: 'transparent',
        zIndex: '10000',
        pointerEvents: 'auto'
    });

    const form = document.createElement('div');
    form.className = 'popup-form';
    form.style.pointerEvents = 'auto';

    // Rating state
    const ratings = { overall: 0, accuracy: 0, timing: 0, nsi: 0, layout: 0 };
    let selectedThumbs = ratingType;

    form.innerHTML = `
        <div class="popup-header">
            <div class="header-icons">
                <button id="like-btn" class="popup-header-btn ${ratingType === 'like' ? 'selected' : ''}">
                    <img src="${chrome.runtime.getURL('assets/like.png')}" alt="Like">
                </button>
                <button id="dislike-btn" class="popup-header-btn ${ratingType === 'dislike' ? 'selected' : ''}">
                    <img src="${chrome.runtime.getURL('assets/dislike.png')}" alt="Dislike">
                </button>
            </div>
            <button id="close-btn" class="close-button">×</button>
        </div>
        <div class="overall-rating-section highlighted">
            <div class="overall-rating-label">Overall Rating</div>
            <div class="overall-stars-container">
                ${[1,2,3,4,5].map(i => `<span class="star" data-rating="${i}" data-cat="overall">★</span>`).join('')}
                <span class="overall-rating-text">0/5</span>
            </div>
        </div>
        <div class="rating-categories">
            <div class="rating-category">
                <div class="category-label">Accuracy</div>
                <div class="star-container">
                    ${[1,2,3,4,5].map(i => `<span class="star" data-rating="${i}" data-cat="accuracy">★</span>`).join('')}
                </div>
            </div>
            <div class="rating-category">
                <div class="category-label">Timing</div>
                <div class="star-container">
                    ${[1,2,3,4,5].map(i => `<span class="star" data-rating="${i}" data-cat="timing">★</span>`).join('')}
                </div>
            </div>
            <div class="rating-category">
                <div class="category-label">NSI (Non-Speech Information)</div>
                <div class="star-container">
                    ${[1,2,3,4,5].map(i => `<span class="star" data-rating="${i}" data-cat="nsi">★</span>`).join('')}
                </div>
            </div>
            <div class="rating-category">
                <div class="category-label">Layout</div>
                <div class="star-container">
                    ${[1,2,3,4,5].map(i => `<span class="star" data-rating="${i}" data-cat="layout">★</span>`).join('')}
                </div>
            </div>
        </div>
        <div class="comments-section">
            <div class="comments-label">Additional Comments (Optional)</div>
            <textarea id="comments" class="comments-textarea" placeholder="Share your feedback..."></textarea>
        </div>
        <div class="action-buttons">
            <button id="cancel-btn" class="cancel-button">Cancel</button>
            <button id="submit-btn" class="submit-button">Submit Rating</button>
        </div>
    `;

    overlay.appendChild(form);
    document.body.appendChild(overlay);

    // Event handlers
    const closePopup = () => overlay.remove();
    document.getElementById('close-btn').onclick = closePopup;
    document.getElementById('cancel-btn').onclick = closePopup;
    overlay.onclick = (e) => { if (e.target === overlay) closePopup(); };
    form.onclick = (e) => e.stopPropagation();

    // Thumbs buttons
    document.getElementById('like-btn').onclick = () => {
        selectedThumbs = 'like';
        document.getElementById('like-btn').classList.add('selected');
        document.getElementById('dislike-btn').classList.remove('selected');
    };
    document.getElementById('dislike-btn').onclick = () => {
        selectedThumbs = 'dislike';
        document.getElementById('dislike-btn').classList.add('selected');
        document.getElementById('like-btn').classList.remove('selected');
    };

    // Star rating handlers
    const updateStars = (category, rating) => {
        form.querySelectorAll(`[data-cat="${category}"]`).forEach((star, idx) => {
            star.classList.toggle('filled', idx < rating);
        });
        if (category === 'overall') {
            form.querySelector('.overall-rating-text').textContent = `${rating}/5`;
        }
    };

    form.querySelectorAll('.star').forEach(star => {
        const cat = star.dataset.cat;
        const rating = parseInt(star.dataset.rating);
        
        star.onclick = () => {
            ratings[cat] = rating;
            updateStars(cat, rating);
        };
        
        star.onmouseenter = () => updateStars(cat, rating);
        star.onmouseleave = () => updateStars(cat, ratings[cat] || 0);
    });

    // Submit handler
    document.getElementById('submit-btn').onclick = async () => {
        const videoID = new URLSearchParams(location.search).get('v');
        if (!videoID) {
            alert('Could not get video ID');
            return;
        }

        if (!ratings.overall || ratings.overall === 0) {
            alert('Please provide an overall rating');
            return;
        }

        const btn = document.getElementById('submit-btn');
        btn.disabled = true;
        btn.textContent = 'Submitting...';

        try {
            btn.textContent = 'Getting user...';
            const userID = await getOrCreateUser();

            btn.textContent = 'Adding video...';
            try {
                await apiCall(`/api/videos/${videoID}`, 'POST');
            } catch (e) {
                const errorMsg = e.message || 'Unknown error';
                if (errorMsg.includes('YouTube') || errorMsg.includes('API key')) {
                    throw new Error(`Failed to fetch video data from YouTube. Please check if the YouTube API key is configured in the backend. Error: ${errorMsg}`);
                } else if (errorMsg.includes('404') || errorMsg.includes('not found')) {
                    throw new Error(`Video endpoint not found. Please check backend server. Error: ${errorMsg}`);
                } else {
                    throw new Error(`Failed to add video to database: ${errorMsg}`);
                }
            }

            btn.textContent = 'Verifying video...';
            try {
                await apiCall(`/api/videos/${videoID}`, 'GET');
            } catch (e) {
                throw new Error(`Video was not created successfully. Please try again. Error: ${e.message}`);
            }

            // Submit rating
            btn.textContent = 'Submitting rating...';
            const video = document.querySelector('video');
            const timestamp = video ? Math.floor(video.currentTime || 0) : 0;
            
            let comments = '';
            try {
                const commentsEl = document.getElementById('comments');
                if (commentsEl && commentsEl.value) {
                    comments = String(commentsEl.value).trim();
                }
            } catch (e) {
                console.warn('Could not get comments:', e);
                comments = '';
            }

            const ratingData = {
                userID: userID,
                videoID: videoID,
                overallRating: ratings.overall,
                feedback: comments,
                thumbsUp: selectedThumbs === 'like',
                videoTimestamp: timestamp
            };
            
            console.log('Submitting rating:', ratingData);
            await apiCall('/api/ratings', 'POST', ratingData);

            btn.textContent = 'Submitted!';
            btn.style.background = '#4CAF50';
            setTimeout(closePopup, 1000);

        } catch (err) {
            console.error('Submit error:', err);
            alert(`Failed to submit: ${err.message}`);
            btn.disabled = false;
            btn.textContent = 'Submit Rating';
            btn.style.background = '#1976d2';
        }
    };

    // Popup Position
    const positionForm = () => {
        const player = document.querySelector('#movie_player, .html5-video-player');
        const toolbar = document.querySelector('.ytp-chrome-bottom');
        const ref = toolbar || player;
        
        if (!ref) return;
        
        const rect = ref.getBoundingClientRect();
        const formRect = form.getBoundingClientRect();
        
        form.style.position = 'absolute';
        form.style.top = `${rect.bottom + 8}px`;
        form.style.left = `${rect.right - formRect.width - 10}px`;
    };

    requestAnimationFrame(positionForm);
    window.addEventListener('resize', positionForm);
    window.addEventListener('scroll', positionForm, true);
};
