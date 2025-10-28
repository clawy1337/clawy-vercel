// auth.js - TÜM SAYFALAR İÇİN ORTAK
const users = [
  { username: 'admin',   passwordHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', isAdmin: true },
  { username: 'user',    passwordHash: '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824', isAdmin: false },
  { username: 'arkadas', passwordHash: '5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5', isAdmin: false }
];

async function sha256(str) {
  try {
    const msgBuffer = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    return fallbackSha256(str);
  }
}

function fallbackSha256(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(64, '0');
}

async function checkLogin(username, password) {
  const savedUsername = localStorage.getItem('username');
  const savedHash = localStorage.getItem('passwordHash');
  if (savedUsername && savedHash) {
    const user = users.find(u => u.username === savedUsername && u.passwordHash === savedHash);
    if (user) {
      localStorage.setItem('isAdmin', user.isAdmin);
      return user;
    }
  }

  if (!username || !password) return null;

  const hashed = await sha256(password);
  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.passwordHash === hashed);
  if (user) {
    localStorage.setItem('username', user.username);
    localStorage.setItem('passwordHash', hashed);
    localStorage.setItem('isAdmin', user.isAdmin);
    return user;
  }
  return null;
}

function updateWelcome() {
  const el = document.getElementById('welcome-message');
  if (!el) return;
  const username = localStorage.getItem('username');
  const isAdm = localStorage.getItem('isAdmin') === 'true';
  if (username) {
    const span = el.querySelector('span');
    if (span) span.textContent = isAdm ? 'OWNER' : 'KULLANICI';
    el.style.display = 'inline-block';
  } else {
    el.style.display = 'none';
  }
}

function updateAdminControls() {
  const controls = document.getElementById('admin-controls');
  const userView = document.getElementById('user-view');
  if (!controls || !userView) return;
  const isAdm = localStorage.getItem('isAdmin') === 'true';
  controls.style.display = isAdm ? 'flex' : 'none';
  userView.style.display = isAdm ? 'none' : 'block';
}

function logout() {
  if (confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
    localStorage.removeItem('username');
    localStorage.removeItem('passwordHash');
    localStorage.removeItem('isAdmin');
    window.location.href = 'durum.html';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const username = localStorage.getItem('username');
  if (username) {
    updateWelcome();
    updateAdminControls();
    const main = document.getElementById('main-content');
    if (main) main.style.display = 'block';
    const login = document.getElementById('login-container');
    if (login) login.style.display = 'none';
  } else {
    if (window.location.pathname.includes('durum.html')) {
      const login = document.getElementById('login-container');
      const main = document.getElementById('main-content');
      if (login) login.style.display = 'flex';
      if (main) main.style.display = 'none';
    } else {
      window.location.href = 'durum.html';
    }
  }
});

if (document.getElementById('login-btn')) {
  document.getElementById('login-btn').addEventListener('click', async () => {
    const username = document.getElementById('username')?.value.trim();
    const password = document.getElementById('password')?.value;
    const error = document.getElementById('login-error');
    if (!username || !password) {
      error && (error.textContent = 'Boş bırakılamaz!', error.style.display = 'block');
      return;
    }
    const user = await checkLogin(username, password);
    if (user) {
      error && (error.style.display = 'none');
      document.getElementById('login-container').style.display = 'none';
      document.getElementById('main-content').style.display = 'block';
      updateWelcome();
      updateAdminControls();
      if (typeof fetchStatus === 'function') fetchStatus();
    } else {
      error && (error.textContent = 'Hatalı giriş!', error.style.display = 'block');
    }
  });
}

document.querySelectorAll('[onclick="logout()"]').forEach(el => {
  el.addEventListener('click', e => {
    e.preventDefault();
    logout();
  });
});
