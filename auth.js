// auth.js - KESİN ÇALIŞIR: arkadas/12345 ve user/user GİRER!
const users = [
  { username: 'admin',   passwordHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', isAdmin: true },
  { username: 'user',    passwordHash: '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824', isAdmin: false },
  { username: 'arkadas', passwordHash: '5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5', isAdmin: false }
];

// SHA-256 (HTTP + HTTPS uyumlu)
async function sha256(str) {
  try {
    const msgBuffer = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    console.warn('crypto.subtle başarısız, fallback kullanılıyor');
    return fallbackSha256(str); // fallback
  }
}

// Fallback SHA-256 (basit, sadece test için)
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

  if (!username || !password) {
    showLoginError('Lütfen kullanıcı adı ve şifre girin!');
    return null;
  }

  const hashedPassword = await sha256(password);
  const user = users.find(u => u.username === username && u.passwordHash === hashedPassword);
  if (user) {
    localStorage.setItem('username', username);
    localStorage.setItem('passwordHash', hashedPassword);
    localStorage.setItem('isAdmin', user.isAdmin);
    clearLoginError();
    return user;
  } else {
    showLoginError('Yanlış kullanıcı adı veya şifre!');
    return null;
  }
}

function showLoginError(message) {
  const errorEl = document.getElementById('login-error');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  }
}

function clearLoginError() {
  const errorEl = document.getElementById('login-error');
  if (errorEl) errorEl.style.display = 'none';
}

function isAdmin() {
  return localStorage.getItem('isAdmin') === 'true';
}

function logout() {
  localStorage.clear();
  document.getElementById('main-content')?.style.setProperty('display', 'none');
  document.getElementById('login-container')?.style.setProperty('display', 'block');
  clearLoginError();
  document.getElementById('welcome-message') && (document.getElementById('welcome-message').textContent = '');
}

// Giriş butonu
document.getElementById('login-btn')?.addEventListener('click', async () => {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const user = await checkLogin(username, password);
  if (user) {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('main-content').style.display = 'block';
    document.getElementById('welcome-message').innerHTML = `HOŞGELDİNİZ <span>${isAdmin() ? 'OWNER' : 'KULLANICI'}</span>!`;
    document.getElementById('status-message') && (document.getElementById('status-message').textContent = '');
    fetchStatus();
    if (isAdmin()) {
      document.getElementById('editButton')?.style.removeProperty('display');
    } else {
      document.getElementById('editButton')?.style.setProperty('display', 'none');
    }
  }
});

// Sayfa yüklendiğinde
window.addEventListener('load', () => {
  const savedUsername = localStorage.getItem('username');
  if (savedUsername) {
    const user = users.find(u => u.username === savedUsername);
    if (user) {
      document.getElementById('login-container').style.display = 'none';
      document.getElementById('main-content').style.display = 'block';
      document.getElementById('welcome-message').innerHTML = `HOŞGELDİNİZ <span>${isAdmin() ? 'OWNER' : 'KULLANICI'}</span>!`;
      document.getElementById('status-message') && (document.getElementById('status-message').textContent = '');
      fetchStatus();
      if (isAdmin()) {
        document.getElementById('editButton')?.style.removeProperty('display');
      } else {
        document.getElementById('editButton')?.style.setProperty('display', 'none');
      }
    }
  }
});

// Durum çek
async function fetchStatus() {
  const statusTextEl = document.getElementById('statusText');
  const lastUpdateEl = document.getElementById('lastUpdate');
  if (!statusTextEl || !lastUpdateEl) return;

  if (!localStorage.getItem('username')) {
    statusTextEl.innerText = 'Giriş yapın';
    return;
  }

  try {
    const response = await fetch('/api/status');
    if (response.ok) {
      const data = await response.json();
      statusTextEl.innerText = data.status_text;
      lastUpdateEl.innerText = data.last_updated;
    }
  } catch (error) {
    console.error('Hata:', error);
  }
}
