// auth.js - ARKADAŞ GİREBİLİR: arkadas / 12345
const users = [
  { username: 'admin',   passwordHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', isAdmin: true },  // admin
  { username: 'user',    passwordHash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08', isAdmin: false }, // user
  { username: 'arkadas', passwordHash: '5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5', isAdmin: false }  // DOĞRU HASH: 12345
];

async function sha256(str) {
  const msgBuffer = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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
  document.getElementById('main-content').style.display = 'none';
  document.getElementById('login-container').style.display = 'block';
  clearLoginError();
  document.getElementById('welcome-message').textContent = '';
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
      document.getElementById('admin-controls')?.style.removeProperty('display');
      document.getElementById('user-view')?.style.setProperty('display', 'none');
    } else {
      document.getElementById('editButton')?.style.setProperty('display', 'none');
      document.getElementById('admin-controls')?.style.setProperty('display', 'none');
      document.getElementById('user-view')?.style.removeProperty('display');
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
        document.getElementById('admin-controls')?.style.removeProperty('display');
        document.getElementById('user-view')?.style.setProperty('display', 'none');
      } else {
        document.getElementById('editButton')?.style.setProperty('display', 'none');
        document.getElementById('admin-controls')?.style.setProperty('display', 'none');
        document.getElementById('user-view')?.style.removeProperty('display');
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
