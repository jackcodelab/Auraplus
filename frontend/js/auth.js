// State tracker to see if user is trying to log in or register
let isSignUpMode = false;

// Gather all your authentication layout elements from the HTML DOM
const authModal = document.getElementById('authModal');
const authForm = document.getElementById('authForm');
const authUsername = document.getElementById('authUsername');
const authEmail = document.getElementById('authEmail');
const authPassword = document.getElementById('authPassword');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const authToggleAction = document.getElementById('authToggleAction');
const authToggleText = document.getElementById('authToggleText');

// 1. Handle clicking the "Sign Up" / "Log In" toggle link in the footer panel
authToggleAction.addEventListener('click', () => {
    isSignUpMode = !isSignUpMode;
    
    if (isSignUpMode) {
        authEmail.style.display = 'block';
        authEmail.required = true;
        authSubmitBtn.innerText = 'Sign Up';
        authToggleText.innerHTML = `Have an account? <span id="authToggleAction" style="color:#0095f6; font-weight:600; cursor:pointer;">Log in</span>`;
    } else {
        authEmail.style.display = 'none';
        authEmail.required = false;
        authSubmitBtn.innerText = 'Log In';
        authToggleText.innerHTML = `Don't have an account? <span id="authToggleAction" style="color:#0095f6; font-weight:600; cursor:pointer;">Sign up</span>`;
    }
    
    // Re-bind click event to the newly rendered toggle action link text
    document.getElementById('authToggleAction').addEventListener('click', arguments.callee);
});

// 2. Intercept form submission clicks to handle the real network requests
authForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Stop the default HTML browser page flash refresh
    
    // Package input strings into a clean JSON data object
    const credentials = {
        username: authUsername.value.trim(),
        password: authPassword.value
    };
    
    // Select the correct backend URL address route based on current state mode
    let targetEndpoint = 'http://localhost:3000/api/auth/login';
    
    if (isSignUpMode) {
        targetEndpoint = 'http://localhost:3000/api/auth/signup';
        credentials.email = authEmail.value.trim();
    }
    
    try {
        authSubmitBtn.innerText = isSignUpMode ? "Registering..." : "Logging in...";
        authSubmitBtn.disabled = true;

        // Fetch transmits the authentication package to your running server.js
        const response = await fetch(targetEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });
        
        const data = await response.json();
        
        if (data.success) {
            if (isSignUpMode) {
                // Account created successfully! Auto-flip the screen view back to Login mode
                alert(data.message);
                authToggleAction.click(); // Triggers transition to let them log in
            } else {
                // Logged in successfully! Hide the login screen block layer completely
                authModal.style.display = 'none';
                
                // Track username inside browser storage cache to remember who is logged in
                localStorage.setItem('loggedInUser', data.user.username);
            }
        } else {
            // Server checked and found an error (e.g. user already exists, or wrong password)
            alert(data.message);
        }
        
    } catch (error) {
        alert("Cannot reach server. Make sure your terminal is running node server.js!");
        console.error("Auth Network Error:", error);
    } finally {
        authSubmitBtn.innerText = isSignUpMode ? 'Sign Up' : 'Log In';
        authSubmitBtn.disabled = false;
    }
});
