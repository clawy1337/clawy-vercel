// api/status.js
import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
    const token = process.env.GITHUB_TOKEN;
    if (!token) return res.status(500).json({ error: 'Token eksik' });

    const octokit = new Octokit({ auth: token });

    try {
        const { data } = await octokit.repos.getContent({
            owner: 'clawy1337',
            repo: 'clawy-vercel',
            path: 'data/status.json'
        });
        const content = Buffer.from(data.content, 'base64').toString('utf8');
        res.status(200).json(JSON.parse(content));
    } catch (error) {
        console.error('Okuma hatası:', error.message);
        res.status(500).json({ error: 'Okunamadı', details: error.message });
    }
}
