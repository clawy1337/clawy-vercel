let redis;

async function getRedis() {
  if (!redis) {
    const { Redis } = await import('@upstash/redis');
    redis = new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });
  }
  return redis;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { status_text, last_updated, last_updated_by } = req.body;

  if (last_updated_by !== 'clawy') {
    return res.status(403).json({ error: 'Yetkisiz' });
  }

  try {
    const kv = await getRedis();
    await kv.set('status', { status_text, last_updated, last_updated_by });
    res.status(200).json({ message: 'Başarıyla kaydedildi!' });
  } catch (error) {
    console.error('KV HATASI:', error);
    res.status(500).json({ error: 'Kaydedilemedi', details: error.message });
  }
}
