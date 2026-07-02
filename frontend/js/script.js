lucide.createIcons();

// Elements Selectors
const uploadBtn = document.getElementById('uploadBtn');
const uploadModal = document.getElementById('uploadModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const modalSelectFileBtn = document.getElementById('modalSelectFileBtn');
const fileSelector = document.getElementById('fileSelector');
const imagePreview = document.getElementById('imagePreview');
const previewPlaceholder = document.getElementById('previewPlaceholder');

// Form Fields & Feed Container Selectors
const postTitle = document.getElementById('postTitle');
const postDescription = document.getElementById('postDescription');
const submitPostBtn = document.getElementById('submitPostBtn');
const mainFeed = document.querySelector('main');

let currentImageSrc = '';

// Helper function to build a complete styled post card structure safely
function createCardElement(post) {
    const card = document.createElement('div');
    card.className = 'post-card';
    card.dataset.id = post.id;

    // Safety checks: Fallback to an empty list array if these database rows are missing
    const likesArray = post.likes || [];
    const commentsArray = post.comments || [];
    const likeCount = likesArray.length;

    const loggedInUser = localStorage.getItem('loggedInUser') || 'Anonymous';
    const isLikedByMe = likesArray.includes(loggedInUser);
    const heartColor = isLikedByMe ? 'red' : 'currentColor';
    const heartFill = isLikedByMe ? 'red' : 'none';

    // Loop through existing comments array data safely
    let commentsHTML = '';
    commentsArray.forEach(comment => {
        commentsHTML += `
            <div style="margin-bottom: 6px; font-size: 13px; font-family: system-ui, sans-serif; line-height: 1.4;">
                <strong style="font-weight: 700; color: #262626; margin-right: 6px;">${comment.username}</strong>
                <span style="color: #4a4a4a;">${comment.text}</span>
            </div>
        `;
    });

    card.innerHTML = `
    <div class="post-header" style="display:flex; flex-direction:column; padding: 12px 16px;">
        <span style="font-weight:700; font-size:14px;">${post.username || 'Anonymous'}</span>
        <span style="font-weight:400; font-size:12px; color:#8e8e8e;">${post.title}</span>
    </div>
    <div class="post-image-placeholder">
        <img src="${post.imageUrl}" style="width:100%; height:100%; object-fit:cover; border-radius:4px;">
    </div>
    
    <div class="post-actions-row" style="display:flex; gap:16px; padding: 12px 16px 4px 16px;">
        <!-- type="button" added below stops the page refresh when liking -->
        <button type="button" class="action-btn like-trigger" style="background:none; border:none; padding:0; cursor:pointer; color:${heartColor};">
            <i data-lucide="heart" fill="${heartFill}"></i>
        </button>
        <button type="button" class="action-btn comment-trigger" style="background:none; border:none; padding:0; cursor:pointer;">
            <i data-lucide="message-circle"></i>
        </button>
    </div>
    
    <div class="post-metrics" style="padding: 0 16px; font-family:system-ui; font-size:14px; font-weight:600; margin-top:4px;">
        <span class="like-counter-text">${likeCount} likes</span>
    </div>

    <div class="post-footer" style="padding: 4px 16px 8px 16px; font-family:system-ui; font-size:14px; border-bottom: 1px solid #efefef;">
        <strong style="font-weight: 700; margin-right:6px;">${post.username || 'Anonymous'}</strong>${post.description}
    </div>

    <div class="comments-display-zone" style="padding: 10px 16px; max-height: 120px; overflow-y: auto; background: #fafafa;">
        ${commentsHTML}
    </div>

    <div class="comment-input-tray" style="display: flex; align-items: center; border-top: 1px solid #efefef; padding: 4px 16px;">
        <input type="text" class="card-comment-input" placeholder="Add a comment..." style="flex: 1; border: none; outline: none; padding: 12px 0; font-size: 13px; font-family: system-ui; background: transparent;">
        <!-- type="button" added below stops the page refresh when submitting comments -->
        <button type="button" class="submit-comment-btn" style="background: none; border: none; color: #0095f6; font-weight: 600; font-size: 13px; cursor: pointer; padding: 12px 0 12px 10px;">Post</button>
    </div>
`;

    // Hook up individual interactivity events
    const likeBtn = card.querySelector('.like-trigger');
    likeBtn.addEventListener('click', () => handleLikeAction(post.id, card));

    const commentInput = card.querySelector('.card-comment-input');
    const commentSubmitBtn = card.querySelector('.submit-comment-btn');
    const displayZone = card.querySelector('.comments-display-zone');

    commentSubmitBtn.addEventListener('click', () => handleCommentAction(post.id, commentInput, displayZone));
    commentInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleCommentAction(post.id, commentInput, displayZone);
        }
    });

    return card;
}
// 1. Initial Load: Auto Check Login Token Session + Load Posts Feed
window.addEventListener('DOMContentLoaded', async () => {
    // PERSISTENT LOGIN REFRESH CHECK: If username token is already cached, bypass login screens automatically!
    const savedUser = localStorage.getItem('loggedInUser');
    const authModal = document.getElementById('authModal');

    if (savedUser && authModal) {
        authModal.style.display = 'none'; // Keep login dashboard invisible
    }

    try {
        const response = await fetch('http://localhost:3000/api/posts');
        const posts = await response.json();
        posts.forEach(post => {
            const cardElement = createCardElement(post);
            mainFeed.appendChild(cardElement);
        });
        lucide.createIcons();
    } catch (error) {
        console.error("Error connecting to server:", error);
    }
});

// 2. Open Creator Modal
uploadBtn.addEventListener('click', () => {
    uploadModal.style.display = 'flex';
});

// 3. Open System Explorer File Selection Layer
modalSelectFileBtn.addEventListener('click', () => {
    fileSelector.click();
});

// 4. File Selector Change Handler Local Mock URL Creator
fileSelector.addEventListener('change', (event) => {
    const selectedFile = event.target.files[0]; // Safely extracts first file out of array index
    if (selectedFile) {
        const fileReader = new FileReader();
        fileReader.onload = function (e) {
            currentImageSrc = e.target.result;
            imagePreview.src = currentImageSrc;
            imagePreview.style.display = 'block';
            previewPlaceholder.style.display = 'none';
        };
        fileReader.readAsDataURL(selectedFile);
    }
});
// 5. Send Upload Data Packages over Network Fetch Channels
submitPostBtn.addEventListener('click', async () => {
    const file = fileSelector.files[0];
    if (!file) {
        alert('Please select an image first!');
        return;
    }

    const loggedInUser = localStorage.getItem('loggedInUser') || 'Anonymous';
    const titleText = postTitle.value || 'Untitled Post';
    const descriptionText = postDescription.value || '';

    const formData = new FormData();
    formData.append('postImage', file);
    formData.append('title', titleText);
    formData.append('description', descriptionText);
    formData.append('username', loggedInUser);

    try {
        submitPostBtn.innerText = "Sharing...";
        submitPostBtn.disabled = true;

        const response = await fetch('http://localhost:3000/api/posts', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            const freshCardElement = createCardElement(result.post);
            mainFeed.prepend(freshCardElement);
            lucide.createIcons();
            closeModalBtn.click();
        }
    } catch (error) {
        alert("Upload failed. Make sure your server terminal is running node server.js!");
        console.error(error);
    } finally {
        submitPostBtn.innerText = "Share Post";
        submitPostBtn.disabled = false;
    }
});

// 6. Network Post Actions Link Handling Logic Controller (Likes)
async function handleLikeAction(postId, cardNode) {
    const activeUsername = localStorage.getItem('loggedInUser') || 'Anonymous';

    try {
        const response = await fetch(`http://localhost:3000/api/posts/${postId}/like`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: activeUsername })
        });

        const data = await response.json();

        if (data.success) {
            const counterText = cardNode.querySelector('.like-counter-text');
            const heartIconBtn = cardNode.querySelector('.like-trigger');

            counterText.innerText = `${data.likes.length} likes`;

            if (data.likes.includes(activeUsername)) {
                heartIconBtn.style.color = 'red';
                heartIconBtn.innerHTML = '<i data-lucide="heart" fill="red"></i>';
            } else {
                heartIconBtn.style.color = 'currentColor';
                heartIconBtn.innerHTML = '<i data-lucide="heart" fill="none"></i>';
            }
            lucide.createIcons();
        }
    } catch (err) {
        console.error("Like transmission fault connection:", err);
    }
}

// 7. Transmit New Comment Package over the Network Line
async function handleCommentAction(postId, inputElement, displayZoneNode) {
    const text = inputElement.value.trim();
    if (!text) return;

    const activeUsername = localStorage.getItem('loggedInUser') || 'Anonymous';

    try {
        const response = await fetch(`http://localhost:3000/api/posts/${postId}/comment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: activeUsername, text: text })
        });

        const data = await response.json();

        if (data.success) {
            const newCommentHTML = `
                <div style="margin-bottom: 6px; font-size: 13px; font-family: system-ui, sans-serif; line-height: 1.4;">
                    <strong style="font-weight: 700; color: #262626; margin-right: 6px;">${activeUsername}</strong>
                    <span style="color: #4a4a4a;">${text}</span>
                </div>
            `;

            displayZoneNode.innerHTML += newCommentHTML;
            inputElement.value = '';
            displayZoneNode.scrollTop = displayZoneNode.scrollHeight;
        }
    } catch (err) {
        console.error("Comment transmission pipeline fault error:", err);
    }
}

// 8. Modal Cleanup Resets Close Actions
closeModalBtn.addEventListener('click', () => {
    uploadModal.style.display = 'none';
    fileSelector.value = '';
    imagePreview.style.display = 'none';
    imagePreview.src = '';
    previewPlaceholder.style.display = 'flex';
    postTitle.value = '';
    postDescription.value = '';
    currentImageSrc = '';
});
