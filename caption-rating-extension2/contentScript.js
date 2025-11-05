(() => {
  let currentVideo = "";

  chrome.runtime.onMessage.addListener((obj) => {
    const { type, videoId } = obj || {};
    if (type === "NEW") {
      currentVideo = videoId;
      newVideoLoaded();
    }
  });

  const newVideoLoaded = () => {
    const rightControls = document.querySelector(".ytp-right-controls");
    const settingsBtn = rightControls?.querySelector(".ytp-settings-button");
    if (!rightControls || !settingsBtn) {
      setTimeout(newVideoLoaded, 300);
      return;
    }

    // thumbs up position
    let likeBtn = rightControls.querySelector(".like-btn");
    if (!likeBtn) {
      likeBtn = document.createElement("img");
      likeBtn.src = chrome.runtime.getURL("assets/like2.png");
      likeBtn.className = "ytp-button like-btn";
      likeBtn.title = "Like captions";
      likeBtn.style.cursor = "pointer";
      
      likeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.showRatingForm('like');
      });
    }
    settingsBtn.before(likeBtn);

    // thumbs down position
    let dislikeBtn = rightControls.querySelector(".dislike-btn");
    if (!dislikeBtn) {
      dislikeBtn = document.createElement("img");
      dislikeBtn.src = chrome.runtime.getURL("assets/dislike2.png");
      dislikeBtn.className = "ytp-button dislike-btn";
      dislikeBtn.title = "Dislike captions";
      dislikeBtn.style.cursor = "pointer";
      
      dislikeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.showRatingForm('dislike');
      });
    }
    settingsBtn.before(dislikeBtn);
    likeBtn.insertAdjacentElement("afterend", dislikeBtn);
  };

  newVideoLoaded();
})();
