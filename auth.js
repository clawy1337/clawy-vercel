import { Redis } from '@upstash/redis';

// KV bağlantısı
const redis = new Redis({
  url: process.env.KV_REST_API_URL,  // Vercel'den otomatik
  token: process.env.KV_REST_API_TOKEN
});

// Durumu KV'ye yaz
async function updateStatus(newStatus, now) {
    await redis.set('status', {
        status_text: newStatus,
        last_updated: now,
        last_updated_by: localStorage.getItem('username')
    });
    alert('Kaydedildi!');
}

// Durumu KV'den oku
async function fetchStatus() {
    const data = await redis.get('status');
    if (data) {
        document.getElementById('statusText').innerText = data.status_text;
        document.getElementById('lastUpdate').innerText = data.last_updated;
    }
}
