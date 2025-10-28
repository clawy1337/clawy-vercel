// api/update-status.js
import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { status_text, last_updated, last_updated_by } = req.body;
    const token = process.env.GITHUB_TOKEN;

    if (!token) {
        return res.status(500).json({ error: 'GITHUB_TOKEN eksik' });
    }

    if (last_updated_by !== 'clawy') {
        return res.status(403).json({ error: 'Yetkisiz' });
    }

    const octokit = new Octokit({ auth: token });

    try {
        // 1. Dosyanın SHA'sını al
        const { data: fileData } = await octokit.repos.getContent({
            owner: 'clawy1337',
            repo: 'clawy-vercel',
            path: 'data/status.json'
        });

        const sha = fileData.sha;
        const content = Buffer.from(JSON.stringify({
            status_text,
            last_updated,
            last_updated_by
        }, null, 2)).toString('base64');

        // 2. Güncelle
        await octokit.repos.createOrUpdateFileContents({
            owner: 'clawy1337',
            repo: 'clawy-vercel',
            path: 'data/status.json',
            message: `Güncelleme: ${status_text}`,
            content,
            sha,
            branch: 'main'
        });

        return res.status(200).json({ message: 'Başarıyla kaydedildi!' });

    } catch (error) {
        console.error('HATA:', error.message);
        return res.status(500).json({ 
            error: 'Kaydedilemedi', 
            details: error.message 
        });
    }
}
