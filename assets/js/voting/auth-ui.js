// ===============================================
// BITACA CINEMA - AUTHENTICATION UI
// Firebase Authentication Modal & User Management
// ===============================================

import {
    createUserWithEmailAndPassword,
    getAuth,
    GoogleAuthProvider,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {app} from '../firebase-config.js';

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Global state
let currentUser = null;

// ===== INIT AUTH UI =====
export function initAuthUI() {
    renderAuthModal();
    setupAuthListeners();

    // Listen for auth state changes
    onAuthStateChanged(auth, (user) => {
        currentUser = user;
        updateAuthUI(user);
    });
}

// ===== RENDER AUTH MODAL =====
function renderAuthModal() {
    const modalHTML = `
        <div id="auth-modal" class="voting-modal" role="dialog" aria-labelledby="auth-modal-title" aria-modal="true">
            <div class="voting-modal__overlay" aria-hidden="true"></div>
            <div class="voting-modal__content">
                <button class="voting-modal__close" aria-label="Fechar modal de autenticação">
                    <i class="ki-filled ki-cross"></i>
                </button>

                <div id="auth-content">
                    <!-- Login Form -->
                    <div id="login-view" class="auth-view">
                        <div class="auth-header">
                            <i class="ki-filled ki-user-square" aria-hidden="true"></i>
                            <h2 id="auth-modal-title" class="auth-title">Entre para Votar</h2>
                            <p class="auth-subtitle">Faça login para participar da votação dos filmes de Capão Bonito</p>
                        </div>

                        <!-- Google Sign-In -->
                        <button id="google-signin-btn" class="auth-btn auth-btn--google">
                            <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
                                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                            </svg>
                            Continuar com Google
                        </button>

                        <div class="auth-divider">
                            <span>ou</span>
                        </div>

                        <!-- Email/Password Login -->
                        <form id="email-login-form" class="auth-form">
                            <div class="auth-form-group">
                                <label for="login-email" class="visually-hidden">E-mail</label>
                                <input
                                    type="email"
                                    id="login-email"
                                    class="auth-input"
                                    placeholder="E-mail"
                                    required
                                    autocomplete="email"
                                    aria-required="true"
                                />
                            </div>
                            <div class="auth-form-group">
                                <label for="login-password" class="visually-hidden">Senha</label>
                                <input
                                    type="password"
                                    id="login-password"
                                    class="auth-input"
                                    placeholder="Senha"
                                    required
                                    autocomplete="current-password"
                                    aria-required="true"
                                />
                            </div>
                            <button type="submit" class="auth-btn auth-btn--primary">
                                <i class="ki-filled ki-entrance-right" aria-hidden="true"></i>
                                Entrar
                            </button>
                        </form>

                        <div class="auth-footer">
                            <p>Não tem conta? <button id="show-signup-btn" class="auth-link">Criar conta</button></p>
                        </div>
                    </div>

                    <!-- Signup Form -->
                    <div id="signup-view" class="auth-view" style="display: none;">
                        <div class="auth-header">
                            <i class="ki-filled ki-add-user" aria-hidden="true"></i>
                            <h2 class="auth-title">Criar Conta</h2>
                            <p class="auth-subtitle">Junte-se à comunidade Bitaca Cinema</p>
                        </div>

                        <form id="email-signup-form" class="auth-form">
                            <div class="auth-form-group">
                                <label for="signup-email" class="visually-hidden">E-mail</label>
                                <input
                                    type="email"
                                    id="signup-email"
                                    class="auth-input"
                                    placeholder="E-mail"
                                    required
                                    autocomplete="email"
                                    aria-required="true"
                                />
                            </div>
                            <div class="auth-form-group">
                                <label for="signup-password" class="visually-hidden">Senha</label>
                                <input
                                    type="password"
                                    id="signup-password"
                                    class="auth-input"
                                    placeholder="Senha (mínimo 6 caracteres)"
                                    required
                                    minlength="6"
                                    autocomplete="new-password"
                                    aria-required="true"
                                />
                            </div>
                            <button type="submit" class="auth-btn auth-btn--primary">
                                <i class="ki-filled ki-check-circle" aria-hidden="true"></i>
                                Criar Conta
                            </button>
                        </form>

                        <div class="auth-footer">
                            <p>Já tem conta? <button id="show-login-btn" class="auth-link">Entrar</button></p>
                        </div>
                    </div>

                    <!-- User Profile View -->
                    <div id="user-profile-view" class="auth-view" style="display: none;">
                        <div class="auth-header">
                            <div class="user-avatar" id="user-avatar">
                                <i class="ki-filled ki-user-square" aria-hidden="true"></i>
                            </div>
                            <h2 class="auth-title" id="user-display-name">Usuário</h2>
                            <p class="auth-subtitle" id="user-email">email@example.com</p>
                        </div>

                        <div class="user-stats">
                            <div class="user-stat">
                                <i class="ki-filled ki-star" aria-hidden="true"></i>
                                <span id="user-votes-count">0</span>
                                <label>Votos</label>
                            </div>
                            <div class="user-stat">
                                <i class="ki-filled ki-medal-star" aria-hidden="true"></i>
                                <span id="user-quiz-status">Pendente</span>
                                <label>Quiz</label>
                            </div>
                        </div>

                        <button id="logout-btn" class="auth-btn auth-btn--secondary">
                            <i class="ki-filled ki-exit-right" aria-hidden="true"></i>
                            Sair
                        </button>
                    </div>
                </div>

                <!-- Error Message -->
                <div id="auth-error" class="auth-error" role="alert" style="display: none;"></div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// ===== SETUP AUTH LISTENERS =====
function setupAuthListeners() {
    const modal = document.getElementById('auth-modal');
    const closeBtn = modal.querySelector('.voting-modal__close');
    const overlay = modal.querySelector('.voting-modal__overlay');

    // Close modal
    closeBtn.addEventListener('click', closeAuthModal);
    overlay.addEventListener('click', closeAuthModal);

    // Google Sign-In
    document.getElementById('google-signin-btn').addEventListener('click', handleGoogleSignIn);

    // Email Login
    document.getElementById('email-login-form').addEventListener('submit', handleEmailLogin);

    // Email Signup
    document.getElementById('email-signup-form').addEventListener('submit', handleEmailSignup);

    // Toggle views
    document.getElementById('show-signup-btn').addEventListener('click', showSignupView);
    document.getElementById('show-login-btn').addEventListener('click', showLoginView);

    // Logout
    document.getElementById('logout-btn').addEventListener('click', handleLogout);

    // ESC key to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeAuthModal();
        }
    });
}

// ===== AUTHENTICATION HANDLERS =====
async function handleGoogleSignIn() {
    try {
        showLoading(true);
        const result = await signInWithPopup(auth, googleProvider);
        showSuccess('Login realizado com sucesso!');
        closeAuthModal();
    } catch (error) {
        console.error('Google Sign-In Error:', error);
        if (error.code === 'auth/configuration-not-found') {
            showError('🔧 Sistema de autenticação em configuração. Por favor, aguarde alguns instantes e tente novamente.');
        } else {
            showError(getErrorMessage(error.code));
        }
    } finally {
        showLoading(false);
    }
}

async function handleEmailLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        showLoading(true);
        await signInWithEmailAndPassword(auth, email, password);
        showSuccess('Login realizado com sucesso!');
        closeAuthModal();
    } catch (error) {
        showError(getErrorMessage(error.code));
    } finally {
        showLoading(false);
    }
}

async function handleEmailSignup(e) {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    try {
        showLoading(true);
        await createUserWithEmailAndPassword(auth, email, password);
        showSuccess('Conta criada com sucesso!');
        closeAuthModal();
    } catch (error) {
        showError(getErrorMessage(error.code));
    } finally {
        showLoading(false);
    }
}

async function handleLogout() {
    try {
        await signOut(auth);
        showSuccess('Logout realizado com sucesso!');
        closeAuthModal();
    } catch (error) {
        showError('Erro ao fazer logout. Tente novamente.');
    }
}

// ===== UI UPDATE FUNCTIONS =====
function updateAuthUI(user) {
    const loginView = document.getElementById('login-view');
    const signupView = document.getElementById('signup-view');
    const profileView = document.getElementById('user-profile-view');
    const authButton = document.getElementById('auth-trigger-btn');

    if (user) {
        // User is logged in - show profile
        loginView.style.display = 'none';
        signupView.style.display = 'none';
        profileView.style.display = 'block';

        // Update profile info
        const displayName = user.displayName || user.email.split('@')[0];
        document.getElementById('user-display-name').textContent = displayName;
        document.getElementById('user-email').textContent = user.email;

        // Update avatar
        const avatar = document.getElementById('user-avatar');
        if (user.photoURL) {
            avatar.innerHTML = `<img src="${user.photoURL}" alt="${displayName}" />`;
        } else {
            avatar.innerHTML = `<i class="ki-filled ki-user-square"></i>`;
        }

        // Update auth button
        if (authButton) {
            authButton.innerHTML = `
                <img src="${user.photoURL || ''}" alt="${displayName}" class="auth-btn-avatar" />
                <span>${displayName}</span>
            `;
        }
    } else {
        // User is logged out - show login
        loginView.style.display = 'block';
        signupView.style.display = 'none';
        profileView.style.display = 'none';

        // Update auth button
        if (authButton) {
            authButton.innerHTML = `
                <i class="ki-filled ki-user-square"></i>
                <span>Entrar</span>
            `;
        }
    }
}

// ===== MODAL CONTROLS =====
export function openAuthModal() {
    const modal = document.getElementById('auth-modal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    hideError();
}

// ===== VIEW CONTROLS =====
function showLoginView(e) {
    if (e) e.preventDefault();
    document.getElementById('login-view').style.display = 'block';
    document.getElementById('signup-view').style.display = 'none';
    hideError();
}

function showSignupView(e) {
    if (e) e.preventDefault();
    document.getElementById('login-view').style.display = 'none';
    document.getElementById('signup-view').style.display = 'block';
    hideError();
}

// ===== ERROR HANDLING =====
function showError(message) {
    const errorDiv = document.getElementById('auth-error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    errorDiv.setAttribute('role', 'alert');
}

function hideError() {
    const errorDiv = document.getElementById('auth-error');
    errorDiv.style.display = 'none';
    errorDiv.removeAttribute('role');
}

function showSuccess(message) {
    // Show success message in a toast-style notification
    const toast = document.createElement('div');
    toast.className = 'auth-toast auth-toast--success';
    toast.innerHTML = `
        <i class="ki-filled ki-check-circle"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => toast.classList.add('active'), 10);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('active');
        setTimeout(() => toast.remove(), 300);
    }, 3000);

    console.log('✅ Success:', message);
}

function showLoading(isLoading) {
    const buttons = document.querySelectorAll('.auth-btn');
    buttons.forEach(btn => {
        btn.disabled = isLoading;
        if (isLoading) {
            btn.style.opacity = '0.6';
        } else {
            btn.style.opacity = '1';
        }
    });
}

// ===== ERROR MESSAGES =====
function getErrorMessage(errorCode) {
    const errorMessages = {
        'auth/invalid-email': '📧 E-mail inválido. Verifique o formato do e-mail.',
        'auth/user-disabled': '🚫 Esta conta foi desabilitada. Entre em contato com o suporte.',
        'auth/user-not-found': '👤 Usuário não encontrado. Crie uma conta primeiro.',
        'auth/wrong-password': '🔑 Senha incorreta. Tente novamente.',
        'auth/email-already-in-use': '✉️ E-mail já está em uso. Faça login ou use outro e-mail.',
        'auth/weak-password': '🔐 Senha muito fraca. Use no mínimo 6 caracteres.',
        'auth/operation-not-allowed': '⚠️ Operação não permitida. Entre em contato com o suporte.',
        'auth/popup-closed-by-user': '❌ Login cancelado pelo usuário.',
        'auth/cancelled-popup-request': '❌ Login cancelado.',
        'auth/configuration-not-found': '🔧 Sistema de autenticação em configuração. Aguarde alguns instantes.',
        'auth/invalid-credential': '🔑 Credenciais inválidas. Verifique seu e-mail e senha.',
        'auth/network-request-failed': '📡 Erro de conexão. Verifique sua internet.',
        'auth/too-many-requests': '⏱️ Muitas tentativas. Aguarde alguns minutos e tente novamente.',
    };

    return errorMessages[errorCode] || '❌ Erro ao fazer login. Tente novamente.';
}

// ===== EXPORTS =====
export function getCurrentUser() {
    return currentUser;
}

export function isUserAuthenticated() {
    return currentUser !== null;
}
