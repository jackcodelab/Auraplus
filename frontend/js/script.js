// ONE-WORD/ONE-LINE CONFIGURATION: Change this URL to switch between environments
const API_URL = "http://localhost:3000";

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
// A. Network handler for managing post like/unlike states
async function handleLikeAction(postId, cardElement) {
    const loggedInUser = localStorage.getItem('loggedInUser') || 'Anonymous';

    try {
        const response = await fetch(`${API_URL}/api/posts/${postId}/like`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username: loggedInUser })
        });

        const result = await response.json();

        if (result.success) {
            // Update the UI metrics directly using the returned array from your backend database
            const likesArray = result.likes || [];
            const likeCounterText = cardElement.querySelector('.like-counter-text');
            likeCounterText.innerText = `${likesArray.length} likes`;

            // Toggle heart icon colors on the screen based on whether you are in the likes array
            const likeBtnIcon = cardElement.querySelector('.like-trigger i');
            const isLikedByMe = likesArray.includes(loggedInUser);

            if (isLikedByMe) {
                likeBtnIcon.style.color = 'red';
                likeBtnIcon.setAttribute('fill', 'red');
            } else {
                likeBtnIcon.style.color = 'currentColor';
                likeBtnIcon.setAttribute('fill', 'none');
            }
        }
    } catch (error) {
        console.error("Failed to update like status on the server:", error);
    }
}

// B. Network handler for posting and appending live text comments
async function handleCommentAction(postId, commentInput, displayZone) {
    const commentText = commentInput.value.trim();
    if (!commentText) return; // Prevent uploading empty comments

    const loggedInUser = localStorage.getItem('loggedInUser') || 'Anonymous';

    try {
        const response = await fetch(`${API_URL}/api/posts/${postId}/comment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: loggedInUser,
                text: commentText
            })
        });

        const result = await response.json();

        if (result.success) {
            // Clear out the user input text field upon success
            commentInput.value = '';

            // Generate HTML template block for the newly created comment element
            const newCommentHTML = `
                <div style="margin-bottom: 6px; font-size: 13px; font-family: system-ui, sans-serif; line-height: 1.4;">
                    <strong style="font-weight: 700; color: #262626; margin-right: 6px;">${loggedInUser}</strong>
                    <span style="color: #4a4a4a;">${commentText}</span>
                </div>
            `;

            // Append the new message snippet straight to the bottom of the card display area
            displayZone.insertAdjacentHTML('beforeend', newCommentHTML);

            // Auto scroll down to the bottom of the comment zone to see the newest text instantly
            displayZone.scrollTop = displayZone.scrollHeight;
        }
    } catch (error) {
        console.error("Failed to post comment to the server:", error);
    }
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
        // Uses global configuration URL variable dynamically
        const response = await fetch(`${API_URL}/api/posts`);
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

        // Uses global configuration URL variable dynamically
        const response = await fetch(`${API_URL}/api/posts`, {
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
        alert("Upload failed. Make sure your server terminal is running and accessible!");
        console.error(error);
    } finally {
        // Reset the interface fields back to baseline states
        submitPostBtn.innerText = "Share Post";
        submitPostBtn.disabled = false;
        postTitle.value = '';
        postDescription.value = '';
        fileSelector.value = '';
        imagePreview.style.display = 'none';
        previewPlaceholder.style.display = 'block';
    }
});

// 6. Close Modal Layer Panel Interface
closeModalBtn.addEventListener('click', () => {
    uploadModal.style.display = 'none';
});
