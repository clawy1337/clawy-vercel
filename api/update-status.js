// api/update-status.js
import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { status_text, last_updated, last_updated_by } = req.body;
  const token = process.env.GITHUB_TOKEN;

  if (!token) return res.status(500).json({ error: 'Token eksik' });
  if (last_updated_by !== 'clawy') return res.status(403).json({ error: 'Yetkisiz' });

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
      message: `Güncelleme: ${status_text}`,
      content,
      sha,
      branch: 'main'
    });

    res.status(200).json({ message: 'Kaydedildi!' });
  } catch (error) {
    res.status(500).json({ error: 'Kaydedilemedi' });
  }
}
