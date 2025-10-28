// api/update-status.js
import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { status_text, last_updated, last_updated_by } = req.body;
  const token = process.env.GITHUB_TOKEN;

  if (!token) return res.status(500).json({ error: 'Token eksik' });

  // SADECE admin DEĞİŞTİREBİLİR
  if (last_updated_by !== 'admin') {
    return res.status(403).json({ error: 'Yetkisiz! Sadece admin değiştirebilir.' });
  }

  const octokit = new Octokit({ auth: token });

  try {
    const { data } = await octokit.repos.getContent({
      owner: 'clawy1337',
      repo: 'clawy-vercel',
      path: 'data/status.json'
    });

    const sha = data.sha;
    const content = Buffer.from(JSON.stringify({
      status_text,
      last_updated,
      last_updated_by
    }, null, 2)).toString('base64');

    await octokit.repos.createOrUpdateFileContents({
      owner: 'clawy1337',
      repo: 'clawy-vercel',
      path: 'data/status.json',
      message: `Durum güncellendi: ${status_text}`,
      content,
      sha,
      branch: 'main'
    });

    res.status(200).json({ message: 'Durum başarıyla kaydedildi!' });
  } catch (error) {
    console.error('GitHub Hatası:', error.message);
    res.status(500).json({ error: 'GitHub API hatası', details: error.message });
  }
}
