// auth.js - TÜM SAYFALAR İÇİN ORTAK
const users = [
  { username: 'admin',   passwordHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', isAdmin: true },  // admin
  { username: 'user',    passwordHash: '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824', isAdmin: false }, // hello
  { username: 'arkadas', passwordHash: '5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5', isAdmin: false }  // 12345
];

// SHA-256 (Modern + Fallback)
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

// === GİRİŞ KONTROL ===
async function checkLogin(username, password) {
  // Zaten giriş yapılmış mı?
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
  const user = users.find(u => u.username === username && u.passwordHash === hashed);
  if (user) {
    localStorage.setItem('username', username);
    localStorage.setItem('passwordHash', hashed);
    localStorage.setItem('isAdmin', user.isAdmin);
    return user;
  }
  return null;
}

// === HOŞ GELDİN MESAJI ===
function updateWelcomeMessage() {
  const welcomeEl = document.getElementById('welcome-message');
  if (!welcomeEl) return;

  const username = localStorage.getItem('username');
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  if (username) {
    const span = welcomeEl.querySelector('span');
    if (span) span.textContent = isAdmin ? 'OWNER' : 'KULLANICI';
    welcomeEl.style.display = 'inline-block';
  } else {
    welcomeEl.style.display = 'none';
  }
}

// === ADMIN KONTROLLERİ (sadece durum.html) ===
function updateAdminControls() {
  const adminControls = document.getElementById('admin-controls');
  const userView = document.getElementById('user-view');
  if (!adminControls || !userView) return;

  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  adminControls.style.display = isAdmin ? 'flex' : 'none';
  userView.style.display = isAdmin ? 'none' : 'block';
}

// === ÇIKIŞ YAP ===
function logout() {
  if (confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
    localStorage.removeItem('username');
    localStorage.removeItem('passwordHash');
    localStorage.removeItem('isAdmin');

    // Tüm sayfalarda çalışsın
    const mainContent = document.getElementById('main-content');
    if (mainContent) mainContent.style.display = 'none';

    const loginContainer = document.getElementById('login-container');
    if (loginContainer) loginContainer.style.display = 'block';

    // Giriş sayfasına yönlendir (opsiyonel)
    if (!window.location.pathname.includes('durum.html')) {
      window.location.href = 'durum.html';
    }
  }
}

// === SAYFA YÜKLENDİĞİNDE ===
document.addEventListener('DOMContentLoaded', () => {
  const username = localStorage.getItem('username');

  // Giriş yapılmamışsa → sadece durum.html'de login göster
  if (!username && window.location.pathname.includes('durum.html')) {
    const loginContainer = document.getElementById('login-container');
    const mainContent = document.getElementById('main-content');
    if (loginContainer) loginContainer.style.display = 'block';
    if (mainContent) mainContent.style.display = 'none';
    return;
  }

  // Giriş yapılmışsa
  if (username) {
    const user = users.find(u => u.username === username);
    if (user) {
      updateWelcomeMessage();
      updateAdminControls();

      const mainContent = document.getElementById('main-content');
      if (mainContent) mainContent.style.display = 'block';

      const loginContainer = document.getElementById('login-container');
      if (loginContainer) loginContainer.style.display = 'none';
    }
  }
});

// === SADECE DURUM.HTML İÇİN GİRİŞ FORMU ===
if (document.getElementById('login-btn')) {
  document.getElementById('login-btn').addEventListener('click', async () => {
    const username = document.getElementById('username')?.value.trim();
    const password = document.getElementById('password')?.value;
    const errorEl = document.getElementById('login-error');

    if (!username || !password) {
      if (errorEl) {
        errorEl.textContent = 'Lütfen kullanıcı adı ve şifre girin!';
        errorEl.style.display = 'block';
      }
      return;
    }

    const user = await checkLogin(username, password);
    if (user) {
      if (errorEl) errorEl.style.display = 'none';
      document.getElementById('login-container').style.display = 'none';
      document.getElementById('main-content').style.display = 'block';
      updateWelcomeMessage();
      updateAdminControls();
      if (typeof fetchStatus === 'function') fetchStatus();
    } else {
      if (errorEl) {
        errorEl.textContent = 'Yanlış kullanıcı adı veya şifre!';
        errorEl.style.display = 'block';
      }
    }
  });
}

// === Çıkış butonu her sayfada çalışsın ===
document.querySelectorAll('[onclick="logout()"]').forEach(btn => {
  btn.onclick = (e) => {
    e.preventDefault();
    logout();
  };
});
