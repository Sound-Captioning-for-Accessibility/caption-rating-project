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
        // Prefer backend userID already stored (from previous Google auth or legacy user)
        const stored = await new Promise((resolve) =>
            chrome.storage.local.get(['backendUserID', 'userID'], resolve),
        );
        const candidateId = stored.backendUserID || stored.userID;
        if (candidateId) {
            try {
                await apiCall(`/api/users/${candidateId}`, 'GET');
                return candidateId;
            } catch (err) {
                console.warn('Stored userID invalid, creating new user:', err);
                chrome.storage.local.remove(['backendUserID', 'userID']);
            }
        }

        // Try to sign in with Google via background (preferred)
        try {
            const response = await new Promise((resolve) =>
                chrome.runtime.sendMessage({ type: 'GOOGLE_AUTH' }, resolve),
            );
            if (response?.success && response.userID) {
                return response.userID;
            }
            if (response?.error) {
                console.warn('Google auth error:', response.error);
            }
        } catch (err) {
            console.warn('Google auth failed:', err);
        }

        // Fallback: ask for a display name, then create an anonymous user
        try {
            let displayName = window.prompt('Enter the name you want shown with your caption feedback:', '');
            if (displayName === null) {
                displayName = '';
            }
            displayName = displayName.trim();
            if (!displayName) {
                displayName = 'Anonymous';
            }

            const email = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}@caption.local`;
            const users = await apiCall('/api/users/', 'POST', { email, displayName });
            
            if (Array.isArray(users) && users.length > 0) {
                const user = users.find(u => u.email === email) || users[users.length - 1];
                if (user && user.userID) {
                    chrome.storage.local.set({ userID: user.userID });
                    return user.userID;
                }
            }
            throw new Error('Invalid user response from server');
        } catch (err) {
            console.error('User creation error:', err);
            throw new Error(`Failed to create user: ${err.message}`);
        }
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
            <textarea id="caption-rating-feedback" class="comments-textarea" placeholder="Share your feedback..."></textarea>
        </div>
        <div class="action-buttons">
            <button id="cancel-btn" class="cancel-button">Cancel</button>
            <button id="submit-btn" class="submit-button">Submit Rating</button>
        </div>
    `;

    overlay.appendChild(form);
    document.body.appendChild(overlay);

    const get = (sel) => form.querySelector(sel);
    const feedbackInput = get('#caption-rating-feedback');

    // Drag state
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let startLeft = 0;
    let startTop = 0;
    let hasDragged = false;

    // Event handlers
    const closePopup = () => overlay.remove();
    get('#close-btn').onclick = closePopup;
    get('#cancel-btn').onclick = closePopup;
    overlay.onclick = (e) => {
        if (e.target !== overlay) return;
        if (hasDragged) {
            hasDragged = false;
            return;
        }
        closePopup();
    };
    form.onclick = (e) => e.stopPropagation();

    // Make popup draggable using the header as handle
    const headerEl = get('.popup-header');
    if (headerEl) {
        headerEl.style.cursor = 'grab';

        const onMouseMove = (e) => {
            if (!isDragging) return;
            const dx = e.clientX - dragStartX;
            const dy = e.clientY - dragStartY;
            form.style.left = `${startLeft + dx}px`;
            form.style.top = `${startTop + dy}px`;
        };

        const onMouseUp = () => {
            if (!isDragging) return;
            isDragging = false;
            headerEl.style.cursor = 'grab';
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        headerEl.addEventListener('mousedown', (e) => {
            // Ignore clicks on close button so it still works normally
            if (e.target && e.target.id === 'close-btn') return;
            e.preventDefault();
            hasDragged = true;
            isDragging = true;
            headerEl.style.cursor = 'grabbing';

            const rect = form.getBoundingClientRect();
            form.style.position = 'fixed';
            startLeft = rect.left;
            startTop = rect.top;
            form.style.left = `${startLeft}px`;
            form.style.top = `${startTop}px`;

            dragStartX = e.clientX;
            dragStartY = e.clientY;

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    }

    // Thumbs buttons
    get('#like-btn').onclick = () => {
        selectedThumbs = 'like';
        get('#like-btn').classList.add('selected');
        get('#dislike-btn').classList.remove('selected');
    };
    get('#dislike-btn').onclick = () => {
        selectedThumbs = 'dislike';
        get('#dislike-btn').classList.add('selected');
        get('#like-btn').classList.remove('selected');
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
    get('#submit-btn').onclick = async () => {
        const videoID = new URLSearchParams(location.search).get('v');
        if (!videoID) {
            alert('Could not get video ID');
            return;
        }

        if (!ratings.overall || ratings.overall === 0) {
            alert('Please provide an overall rating');
            return;
        }

        const btn = get('#submit-btn');
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
            
            const feedbackText = feedbackInput ? String(feedbackInput.value || '').trim() : '';

            const ratingData = {
                userID: userID,
                videoID: videoID,
                overallRating: ratings.overall,
                feedback: feedbackText,
                thumbsUp: selectedThumbs === 'like',
                videoTimestamp: timestamp,
                accuracy: ratings.accuracy || null,
                timing: ratings.timing || null,
                completeness: ratings.nsi || null,
                layout: ratings.layout || null
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

    // Popup Position (initial / when not dragged)
    const positionForm = () => {
        if (hasDragged) {
            return; // don't override user drag position
        }
        const player = document.querySelector('#movie_player, .html5-video-player');
        const toolbar = document.querySelector('.ytp-chrome-bottom');
        const ref = player || toolbar || document.querySelector('video');

        const isFullscreen = !!document.fullscreenElement;

        form.style.position = 'fixed';

        const formRect = form.getBoundingClientRect();
        const formWidth = formRect.width || 320;
        const formHeight = formRect.height || 200;

        let centerX;
        let centerY;

        if (isFullscreen) {
            // Center in viewport in fullscreen
            centerX = window.innerWidth / 2;
            centerY = window.innerHeight / 2;
        } else if (ref) {
            const rect = ref.getBoundingClientRect();
            // Center over player/controls area
            centerX = rect.left + rect.width / 2;
            centerY = rect.top + rect.height / 2;
        } else {
            // Fallback: center in viewport
            centerX = window.innerWidth / 2;
            centerY = window.innerHeight / 2;
        }

        form.style.left = `${centerX - formWidth / 2}px`;
        form.style.top = `${centerY - formHeight / 2}px`;
    };

    requestAnimationFrame(positionForm);
    window.addEventListener('resize', positionForm);
    window.addEventListener('scroll', positionForm, true);
};
