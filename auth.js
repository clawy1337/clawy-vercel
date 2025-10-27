// SHA-256 için fonksiyon
async function sha256(str) {
    const msgBuffer = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Sabit kullanıcı listesi (şifreler hash'lenmiş)
const users = [
    {
        username: 'clawy',
        passwordHash: 'c9d5729c18737636e48f9e5466ed20e295ab49d2dd9744fb4828a9c8741b30be', // clawy123
        isAdmin: true
    },
    {
        username: 'user1',
        passwordHash: '9b8769a4a742959a2d0298c36fb70623f2dfacda8436237df08d8dfd5b37374c', // pass123
        isAdmin: false
    }
];

// GitHub bilgileri
const REPO_OWNER = 'clawy1337';
const REPO_NAME = 'clawy-vercel';
const BRANCH = 'main';
const FILE_PATH = 'status.json';

// Giriş kontrolü
async function checkLogin(username, password) {
    const savedUsername = localStorage.getItem('username');
    const savedHash = localStorage.getItem('passwordHash');
    if (savedUsername && savedHash) {
        const user = users.find(u => u.username === savedUsername && u.passwordHash === savedHash);
        if (user) {
            localStorage.setItem('isAdmin', user.isAdmin);
            localStorage.setItem('lastLogin', new Date().toLocaleString('tr-TR'));
            return user;
        }
    }
    if (!username || !password) return null;
    const hashedPassword = await sha256(password);
    const user = users.find(u => u.username === username && u.passwordHash === hashedPassword);
    if (user) {
        localStorage.setItem('username', username);
        localStorage.setItem('passwordHash', hashedPassword);
        localStorage.setItem('isAdmin', user.isAdmin);
        localStorage.setItem('lastLogin', new Date().toLocaleString('tr-TR'));
        return user;
    } else {
        alert('Yanlış kullanıcı adı veya şifre!');
        return null;
    }
}

// Admin kontrolü
function isAdmin() {
    return localStorage.getItem('isAdmin') === 'true';
}

// Çıkış yap fonksiyonu
function logout() {
    localStorage.removeItem('username');
    localStorage.removeItem('passwordHash');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('lastLogin');
    document.getElementById('main-content').style.display = 'none';
    document.getElementById('login-container').style.display = 'block';
    document.getElementById('login-message').textContent = 'Çıkış yapıldı!';
}

// JSON'dan durumu çek
async function fetchStatus() {
    const statusTextEl = document.getElementById('statusText');
    const lastUpdateEl = document.getElementById('lastUpdate');
    if (!statusTextEl || !lastUpdateEl) return;
    try {
        const response = await fetch('status.json');
        const data = await response.json();
        statusTextEl.innerText = data.status_text || 'Aktif • Yeni Kent Mahallesi';
        lastUpdateEl.innerText = data.last_updated || '27 Ekim 2025';
    } catch (error) {
        statusTextEl.innerText = 'Aktif • Yeni Kent Mahallesi';
        lastUpdateEl.innerText = '27 Ekim 2025';
        console.error('Durum çekme hatası:', error);
    }
}

// Durumu otomatik güncelle (GitHub API)
async function updateStatusJson(newStatus, now) {
    try {
        // Token istemci tarafında değil, GitHub Actions veya backend’de olacak
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
            alert('Durum başarıyla kaydedildi!');
        } else {
            const errorData = await response.json();
            console.error('Güncelleme hatası:', errorData);
            alert('Güncelleme hatası: ' + errorData.message);
        }
    } catch (error) {
        console.error('API hatası:', error);
        alert('API hatası: ' + error.message);
    }
}

// Durumu güncelle
async function editStatus() {
    if (!isAdmin()) {
        alert('Sadece adminler durumu değiştirebilir!');
        return;
    }
    const newStatus = prompt('Yeni durumunu gir (örneğin: Aktif • Beşiktaş):', document.getElementById('statusText').innerText);
    if (newStatus && newStatus.trim() !== '') {
        const statusTextEl = document.getElementById('statusText');
        const lastUpdateEl = document.getElementById('lastUpdate');
        const now = new Date().toLocaleString('tr-TR');
        statusTextEl.innerText = newStatus.trim();
        lastUpdateEl.innerText = now;
        await updateStatusJson(newStatus.trim(), now);
    }
}
