window.showRatingForm = function showRatingForm(ratingType) {
    const popupExists = document.getElementById('caption-rating-popup');
    if (popupExists) {
        popupExists.remove();
    }

    const API_BASE = (window.CAPTION_RATING_API_BASE || 'http://localhost:5000').replace(/\/$/, '');

    // Get or create user ID
    async function getUserID() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['userID', 'userEmail'], async (result) => {
                if (result.userID) {
                    resolve(result.userID);
                    return;
                }

                try {
                    // Create a new user
                    const email = `user${Date.now()}@caption-rating.com`;
                    const response = await fetch(`${API_BASE}/api/users/`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email })
                    });

                    if (response.ok) {
                        const users = await response.json();
                        const user = Array.isArray(users) ? users[0] : users;
                        chrome.storage.local.set({
                            userID: user.userID,
                            userEmail: email
                        });
                        resolve(user.userID);
                    } else {
                        resolve(null);
                    }
                } catch (err) {
                    console.error('Failed to create user:', err);
                    resolve(null);
                }
            });
        });
    }

    // popup position
    const playerContainer = document.querySelector("#movie_player") || document.querySelector(".html5-video-player");
    const rightControls = document.querySelector(".ytp-right-controls");
    const settingsBtn = rightControls?.querySelector(".ytp-settings-button");
    
    const overlay = document.createElement('div');
    overlay.id = 'caption-rating-popup';
    const form = document.createElement('div');
    form.className = 'popup-form';
    
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.background = 'transparent';
    overlay.style.display = 'block';
    overlay.style.zIndex = '10000';
    overlay.style.pointerEvents = 'auto';
    
    form.style.pointerEvents = 'auto';
    document.body.appendChild(overlay);

    form.innerHTML = `
        <div class="popup-header">
            <div class="header-icons">
                <button type="button" id="popup-like-btn" class="popup-header-btn${ratingType === 'like' ? ' selected' : ''}" aria-label="Like">
                    <img src="${chrome.runtime.getURL('assets/like.png')}" alt="Like">
                </button>
                <button type="button" id="popup-dislike-btn" class="popup-header-btn${ratingType === 'dislike' ? ' selected' : ''}" aria-label="Dislike">
                    <img src="${chrome.runtime.getURL('assets/dislike.png')}" alt="Dislike">
                </button>
            </div>
            <button id="close-popup" class="close-button">×</button>
        </div>
        <div class="overall-rating-section highlighted">
            <div class="overall-rating-label">Overall Rating</div>
            <div id="overall-stars" class="overall-stars-container">
                <span class="star" data-category="overall" data-rating="1">★</span>
                <span class="star" data-category="overall" data-rating="2">★</span>
                <span class="star" data-category="overall" data-rating="3">★</span>
                <span class="star" data-category="overall" data-rating="4">★</span>
                <span class="star" data-category="overall" data-rating="5">★</span>
                <span class="overall-rating overall-rating-text">0/5</span>
            </div>
        </div>
        <div class="rating-categories">
            <div class="rating-category">
                <div class="category-label">Accuracy</div>
                <div id="accuracy-stars" class="star-container">
                    <span class="star" data-category="accuracy" data-rating="1">★</span>
                    <span class="star" data-category="accuracy" data-rating="2">★</span>
                    <span class="star" data-category="accuracy" data-rating="3">★</span>
                    <span class="star" data-category="accuracy" data-rating="4">★</span>
                    <span class="star" data-category="accuracy" data-rating="5">★</span>
                </div>
            </div>
            <div class="rating-category">
                <div class="category-label">Timing</div>
                <div id="timing-stars" class="star-container">
                    <span class="star" data-category="timing" data-rating="1">★</span>
                    <span class="star" data-category="timing" data-rating="2">★</span>
                    <span class="star" data-category="timing" data-rating="3">★</span>
                    <span class="star" data-category="timing" data-rating="4">★</span>
                    <span class="star" data-category="timing" data-rating="5">★</span>
                </div>
            </div>
            <div class="rating-category">
                <div class="category-label">NSI (Non-Speech Information)</div>
                <div id="nsi-stars" class="star-container">
                    <span class="star" data-category="nsi" data-rating="1">★</span>
                    <span class="star" data-category="nsi" data-rating="2">★</span>
                    <span class="star" data-category="nsi" data-rating="3">★</span>
                    <span class="star" data-category="nsi" data-rating="4">★</span>
                    <span class="star" data-category="nsi" data-rating="5">★</span>
                </div>
            </div>
            <div class="rating-category">
                <div class="category-label">Layout</div>
                <div id="layout-stars" class="star-container">
                    <span class="star" data-category="layout" data-rating="1">★</span>
                    <span class="star" data-category="layout" data-rating="2">★</span>
                    <span class="star" data-category="layout" data-rating="3">★</span>
                    <span class="star" data-category="layout" data-rating="4">★</span>
                    <span class="star" data-category="layout" data-rating="5">★</span>
                </div>
            </div>
        </div>
        <div class="comments-section">
            <div class="comments-label">Additional Comments (Optional)</div>
            <textarea class="comments-textarea" placeholder="Share your feedback about the caption quality..."></textarea>
        </div>
        <div class="action-buttons">
            <button id="cancel-btn" class="cancel-button">Cancel</button>
            <button id="submit-btn" class="submit-button">Submit Rating</button>
        </div>
    `;

    const popupLikeBtn = form.querySelector('#popup-like-btn');
    const popupDislikeBtn = form.querySelector('#popup-dislike-btn');
    let selectedHeaderBtn = ratingType;
    popupLikeBtn.addEventListener('click', () => {
        popupLikeBtn.classList.add('selected');
        popupDislikeBtn.classList.remove('selected');
        selectedHeaderBtn = 'like';
    });
    popupDislikeBtn.addEventListener('click', () => {
        popupDislikeBtn.classList.add('selected');
        popupLikeBtn.classList.remove('selected');
        selectedHeaderBtn = 'dislike';
    });

    const closeBtn = form.querySelector('#close-popup');
    const cancelBtn = form.querySelector('#cancel-btn');
    const submitBtn = form.querySelector('#submit-btn');

    function cleanupPositioning() {
        window.removeEventListener('resize', positionAccordingToMode);
        window.removeEventListener('scroll', positionAccordingToMode, true);
        document.removeEventListener('fullscreenchange', positionAccordingToMode);
        document.removeEventListener('webkitfullscreenchange', positionAccordingToMode);
        document.removeEventListener('mozfullscreenchange', positionAccordingToMode);
        document.removeEventListener('MSFullscreenChange', positionAccordingToMode);
    }

    closeBtn.addEventListener('click', () => { cleanupPositioning(); overlay.remove(); });
    cancelBtn.addEventListener('click', () => { cleanupPositioning(); overlay.remove(); });
    submitBtn.addEventListener('click', async () => {
        const commentsEl = form.querySelector('.comments-textarea');
        const comments = commentsEl ? commentsEl.value.trim() : '';
        const video = document.querySelector('video');
        const videoTimestamp = video ? Math.floor(video.currentTime || 0) : 0;

        const urlParams = new URLSearchParams(location.search);
        const videoID = urlParams.get('v') || '';

        if (!videoID) {
            alert('Could not determine video ID');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        try {
            // Get user ID
            const userID = await getUserID();
            if (!userID) {
                throw new Error('Failed to get user ID');
            }

            // Add video to database first
            try {
                await fetch(`${API_BASE}/api/videos/${encodeURIComponent(videoID)}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
            } catch (videoErr) {
                // Video might already exist, continue
                console.log('Video may already exist:', videoErr);
            }

            // Submit rating
            const payload = {
                userID,
                videoID,
                overallRating: Number.isFinite(ratings.overall) ? ratings.overall : 0,
                feedback: comments,
                thumbsUp: selectedHeaderBtn === 'like',
                videoTimestamp
            };

            const resp = await fetch(`${API_BASE}/api/ratings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!resp.ok) {
                const errorData = await resp.json().catch(() => ({}));
                throw new Error(errorData.message || `Submit failed: ${resp.status}`);
            }

            // Show success message
            submitBtn.textContent = 'Submitted!';
            submitBtn.style.background = '#4CAF50';

            setTimeout(() => {
                cleanupPositioning();
                overlay.remove();
            }, 1000);

        } catch (err) {
            console.error('Submission error:', err);
            alert(`Failed to submit rating: ${err.message}`);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Rating';
            submitBtn.style.background = '#1976d2';
        }
    });

    // Close on outside click: allow overlay to catch clicks, but ignore clicks inside the form
    form.addEventListener('click', (e) => e.stopPropagation());
    overlay.addEventListener('click', () => { cleanupPositioning(); overlay.remove(); });

    const stars = form.querySelectorAll('.star');
    const ratings = {
        accuracy: 0,
        timing: 0,
        nsi: 0,
        layout: 0,
        overall: 0
    };
    stars.forEach(star => {
        star.addEventListener('click', () => {
            const category = star.dataset.category;
            const rating = parseInt(star.dataset.rating);
            ratings[category] = rating;
            const categoryStars = form.querySelectorAll(`[data-category="${category}"]`);
            categoryStars.forEach((s, index) => {
                if (index < rating) {
                    s.classList.add('filled');
                } else {
                    s.classList.remove('filled');
                }
            });
            updateOverallRating();
        });
        star.addEventListener('mouseenter', () => {
            const category = star.dataset.category;
            const rating = parseInt(star.dataset.rating);
            const categoryStars = form.querySelectorAll(`[data-category="${category}"]`);
            categoryStars.forEach((s, index) => {
                if (index < rating) {
                    s.classList.add('filled');
                } else {
                    s.classList.remove('filled');
                }
            });
        });
        star.addEventListener('mouseleave', () => {
            const category = star.dataset.category;
            const categoryStars = form.querySelectorAll(`[data-category="${category}"]`);
            const currentRating = ratings[category];
            categoryStars.forEach((s, index) => {
                if (index < currentRating) {
                    s.classList.add('filled');
                } else {
                    s.classList.remove('filled');
                }
            });
        });
    });
    function updateOverallRating() {
        const overallRatingElement = form.querySelector('.overall-rating');
        if (overallRatingElement) {
            overallRatingElement.textContent = ratings.overall + '/5';
        }
    }
    overlay.appendChild(form);

    function isPlayerFullscreen() {
        const fsEl = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
        if (fsEl) {
            return playerContainer && fsEl.contains(playerContainer);
        }
        return !!(playerContainer && playerContainer.classList.contains('ytp-fullscreen'));
    }

    function ensurePlayerRelative() {
        if (!playerContainer) return;
        const style = window.getComputedStyle(playerContainer);
        if (style.position === 'static') {
            playerContainer.style.position = 'relative';
        }
    }

    function positionBelowToolbar() {
        const toolbar = document.querySelector('.ytp-chrome-bottom');
        const referenceEl = toolbar || document.querySelector('#movie_player, .html5-video-player');
        if (!referenceEl) return;
        const refRect = referenceEl.getBoundingClientRect();
        const formRect = form.getBoundingClientRect();
        const gap = 8;

        // Place below toolbar (or below player if toolbar missing)
        const top = (toolbar ? refRect.bottom : refRect.bottom) + gap;

        // Right-align to the toolbar/player box
        let left = refRect.right - formRect.width - 10;
        const minLeft = 10;
        const maxLeft = window.innerWidth - formRect.width - 10;
        left = Math.max(minLeft, Math.min(maxLeft, left));

        form.style.position = 'absolute';
        form.style.top = top + 'px';
        form.style.left = left + 'px';
        form.style.marginTop = '0';
        form.style.marginRight = '0';
    }

    function positionInsidePlayerNearGear() {
        if (!playerContainer) return;
        ensurePlayerRelative();

        // Reparent overlay inside the player so clicks remain within player area
        if (overlay.parentElement !== playerContainer) {
            overlay.remove();
            overlay.style.position = 'absolute';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            playerContainer.appendChild(overlay);
        }

        const settings = document.querySelector('.ytp-right-controls .ytp-settings-button');
        const playerRect = playerContainer.getBoundingClientRect();
        const btnRect = settings ? settings.getBoundingClientRect() : playerRect;
        const formRect = form.getBoundingClientRect();
        const gap = 8;

        // Prefer above the gear, fallback below if not enough room
        let top = btnRect.top - formRect.height - gap - playerRect.top;
        if (playerRect.top + top < playerRect.top + 10) {
            top = btnRect.bottom + gap - playerRect.top;
        }

        // Right-align to gear within player bounds
        let left = btnRect.right - formRect.width - playerRect.left;
        const minLeft = 10;
        const maxLeft = playerRect.width - formRect.width - 10;
        left = Math.max(minLeft, Math.min(maxLeft, left));

        form.style.position = 'absolute';
        form.style.top = Math.round(top) + 'px';
        form.style.left = Math.round(left) + 'px';
        form.style.marginTop = '0';
        form.style.marginRight = '0';
    }

    function positionAccordingToMode() {
        if (isPlayerFullscreen()) {
            positionInsidePlayerNearGear();
        } else {
            // Ensure overlay is attached to body in non-fullscreen
            if (overlay.parentElement !== document.body) {
                overlay.remove();
                overlay.style.position = 'fixed';
                overlay.style.top = '0';
                overlay.style.left = '0';
                overlay.style.width = '100%';
                overlay.style.height = '100%';
                document.body.appendChild(overlay);
            }
            positionBelowToolbar();
        }
    }

    // Position after it's in the DOM so we can measure
    requestAnimationFrame(positionAccordingToMode);
    window.addEventListener('resize', positionAccordingToMode);
    window.addEventListener('scroll', positionAccordingToMode, true);
    document.addEventListener('fullscreenchange', positionAccordingToMode);
    document.addEventListener('webkitfullscreenchange', positionAccordingToMode);
    document.addEventListener('mozfullscreenchange', positionAccordingToMode);
    document.addEventListener('MSFullscreenChange', positionAccordingToMode);
}
