// auth.js (sadece bu fonksiyonlar)
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
    console.error('Durum çekme hatası:', error);
  }
}

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
    const result = await response.json();
    if (response.ok) {
      alert('Durum başarıyla kaydedildi!');
    } else {
      alert('Hata: ' + (result.details || result.error));
    }
  } catch (error) {
    alert('Bağlantı hatası: ' + error.message);
  }
}
