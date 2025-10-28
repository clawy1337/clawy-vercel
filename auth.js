// SHA-256
async function sha256(str) {
    const msgBuffer = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const users = [
    { username: 'clawy', passwordHash: 'c9d5729c18737636e48f9e5466ed20e295ab49d2dd9744fb4828a9c8741b30be', isAdmin: true },
    { username: 'user1', passwordHash: '9b8769a4a742959a2d0298c36fb70623f2dfacda8436237df08d8dfd5b37374c', isAdmin: false }
];

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

function isAdmin() {
    return localStorage.getItem('isAdmin') === 'true';
}

function logout() {
    localStorage.clear();
    document.getElementById('main-content').style.display = 'none';
    document.getElementById('login-container').style.display = 'block';
    document.getElementById('login-message').textContent = 'Çıkış yapıldı!';
}

// DURUM ÇEK
async function fetchStatus() {
    const statusTextEl = document.getElementById('statusText');
    const lastUpdateEl = document.getElementById('lastUpdate');
    if (!statusTextEl || !lastUpdateEl) return;

    if (!localStorage.getItem('username')) {
        statusTextEl.innerText = 'Giriş yapın';
        lastUpdateEl.innerText = '';
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
        statusTextEl.innerText = 'Bağlantı hatası';
    }
}

// DURUM GÜNCELLE
async function updateStatusJson(newStatus, now) {
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
            alert('Durum kaydedildi!');
        } else {
            const err = await response.json();
            alert('Hata: ' + (err.error || 'Bilinmiyor'));
        }
    } catch (error) {
        alert('API hatası: ' + error.message);
    }
}

async function editStatus() {
    if (!isAdmin()) return alert('Yetkiniz yok!');
    const newStatus = prompt('Yeni durum:', document.getElementById('statusText').innerText);
    if (newStatus?.trim()) {
        const now = new Date().toLocaleString('tr-TR');
        document.getElementById('statusText').innerText = newStatus.trim();
        document.getElementById('lastUpdate').innerText = now;
        await updateStatusJson(newStatus.trim(), now);
    }
}
