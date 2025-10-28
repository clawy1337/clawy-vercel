// SADECE BU KISIM
async function fetchStatus() {
  const response = await fetch('/api/status');
  if (response.ok) {
    const data = await response.json();
    document.getElementById('statusText').innerText = data.status_text;
    document.getElementById('lastUpdate').innerText = data.last_updated;
  }
}

async function updateStatusJson(newStatus, now) {
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
    alert('Kaydedildi!');
  }
}
