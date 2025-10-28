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
  try {
    const kv = await getRedis();
    const data = await kv.get('status');
    if (!data) {
      return res.status(200).json({
        status_text: 'Aktif • Yeni Kent Mahallesi',
        last_updated: '27 Ekim 2025',
        last_updated_by: ''
      });
    }
    return res.status(200).json(data);
  } catch (error) {
    console.error('KV OKUMA HATASI:', error);
    return res.status(500).json({ error: 'Okunamadı', details: error.message });
  }
}
