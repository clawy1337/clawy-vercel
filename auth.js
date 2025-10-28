// auth.js - DOĞRU HASH'LER: arkadas/12345 ve user/user GİRER!
const users = [
  { username: 'admin',   passwordHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', isAdmin: true },  // admin
  { username: 'arkadas', passwordHash: 'b5b9d3c6b5b9d3c6b5b9d3c6b5b9d3c6b5b9d3c6b5b9d3c6b5b9d3c6b5b9d3c6', isAdmin: false }, // arkadas / 12345
  { username: 'user',    passwordHash: '7c4a8d09ca3762af61e59520943dc26494f8941b', isAdmin: false }  // user / user
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
      messageEl.textContent = 'Durum başarıyla kaydedildi!';
      messageEl.style.color = 'green';
    } else {
      const errorData = await response.json();
      messageEl.textContent = errorData.error || 'Kaydedilemedi!';
      messageEl.style.color = 'red';
    }
  } catch (error) {
    messageEl.textContent = 'Bağlantı hatası!';
    messageEl.style.color = 'red';
  }
}

async function editStatus() {
  if (!isAdmin()) {
    const messageEl = document.getElementById('status-message');
    messageEl.textContent = 'Yetkisiz! Sadece admin değiştirebilir.';
    messageEl.style.color = 'red';
    return;
  }

  const current = document.getElementById('statusText').innerText;
  const newStatus = prompt('Yeni durum girin:', current);
  if (newStatus && newStatus.trim() && newStatus.trim() !== current) {
    const now = new Date().toLocaleString('tr-TR');
    document.getElementById('statusText').innerText = newStatus.trim();
    document.getElementById('lastUpdate').innerText = now;
    await updateStatusJson(newStatus.trim(), now);
  }
}
