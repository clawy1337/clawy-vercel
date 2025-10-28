// auth.js - OWNER & KULLANICI MESAJLARI
const users = [
  { username: 'admin', passwordHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', isAdmin: true },
  { username: 'user',  passwordHash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08', isAdmin: false }
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
    showLoginError('LÜTFEN KULLANICI ADI VE ŞİFRE GİRİN!');
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
    showLoginError('YANLIŞ KULLANICI ADI VEYA ŞİFRE!');
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
    document.getElementById('welcome-message').textContent = user.isAdmin ? 'HOŞGELDİNİZ OWNER!' : 'HOŞGELDİNİZ KULLANICI!';
    document.getElementById('status-message').textContent = '';
    fetchStatus();
    if (isAdmin()) {
      document.getElementById('editButton').style.display = 'block';
    } else {
      document.getElementById('editButton').style.display = 'none';
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
      document.getElementById('welcome-message').textContent = user.isAdmin ? 'HOŞGELDİNİZ OWNER!' : 'HOŞGELDİNİZ KULLANICI!';
      document.getElementById('status-message').textContent = '';
      fetchStatus();
      if (isAdmin()) {
        document.getElementById('editButton').style.display = 'block';
      } else {
        document.getElementById('editButton').style.display = 'none';
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
    statusTextEl.innerText = 'GİRİŞ YAPIN';
    return;
  }

  try {
    const response = await fetch('/api/status');
    if (response.ok) {
      const data = await response.json();
      statusTextEl.innerHTML = `<span>${data.status_text}</span>`;
      lastUpdateEl.innerText = data.last_updated;
    }
  } catch (error) {
    console.error('Hata:', error);
  }
}

// Durum güncelle
async function updateStatusJson(newStatus, now) {
  const messageEl = document.getElementById('status-message');
  try {
    const response = await fetch('/api/update-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status_text: newStatus,
        last_updated: now,
        last_updated_by: localStorage.getItem('username')
      })
    });

    if (response.ok) {
      if (messageEl) messageEl.textContent = 'DURUM BAŞARIYLA KAYDEDİLDİ!';
      if (messageEl) messageEl.style.color = '#00ff88';
    } else {
      const errorData = await response.json();
      if (messageEl) messageEl.textContent = errorData.error || 'KAYDEDİLEMEDİ!';
      if (messageEl) messageEl.style.color = '#ff6b6b';
    }
  } catch (error) {
    if (messageEl) messageEl.textContent = 'BAĞLANTI HATASI!';
    if (messageEl) messageEl.style.color = '#ff6b6b';
  }
}

async function editStatus() {
  if (!isAdmin()) {
    const messageEl = document.getElementById('status-message');
    if (messageEl) messageEl.textContent = 'YETKİSİZ! SADECE OWNER DEĞİŞTİREBİLİR.';
    if (messageEl) messageEl.style.color = '#ff6b6b';
    return;
  }

  const current = document.getElementById('statusText').innerText;
  const newStatus = prompt('YENİ DURUM GİRİN:', current);
  if (newStatus && newStatus.trim() && newStatus.trim() !== current) {
    const now = new Date().toLocaleString('tr-TR');
    document.getElementById('statusText').innerHTML = `<span>${newStatus.trim()}</span>`;
    document.getElementById('lastUpdate').innerText = now;
    await updateStatusJson(newStatus.trim(), now);
  }
}
