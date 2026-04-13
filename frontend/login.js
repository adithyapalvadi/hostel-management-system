const API_AUTH_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:5000/api/auth' 
    : '/api/auth';

const authForm = document.getElementById('auth-form');
const authTitle = document.getElementById('auth-title');
const authSubtitle = document.getElementById('auth-subtitle');
const authBtn = document.getElementById('auth-btn');
const authToggle = document.getElementById('auth-toggle');
const errorBox = document.getElementById('error-box');

let isLogin = true;

authToggle.addEventListener('click', () => {
    isLogin = !isLogin;
    authTitle.innerText = isLogin ? 'Welcome Back' : 'Create Account';
    authSubtitle.innerText = isLogin ? 'Please enter your details to sign in.' : 'Register to start managing your hostel.';
    authBtn.innerText = isLogin ? 'Sign In' : 'Register';
    authToggle.innerText = isLogin ? "Don't have an account? Register" : "Already have an account? Sign In";
    errorBox.style.display = 'none';
});

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.style.display = 'none';
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    const endpoint = isLogin ? '/login' : '/register';
    
    try {
        const response = await fetch(`${API_AUTH_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            errorBox.innerText = data.error || 'Something went wrong';
            errorBox.style.display = 'block';
            return;
        }
        
        if (isLogin) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = 'index.html';
        } else {
            alert('Registration successful! Please sign in.');
            isLogin = true;
            authToggle.click(); // Reset to login view
        }
        
    } catch (err) {
        errorBox.innerText = 'Server connection failed.';
        errorBox.style.display = 'block';
    }
});
