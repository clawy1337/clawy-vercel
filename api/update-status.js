// api/update-status.js
import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Sadece POST' });
    }

    const { status_text, last_updated, last_updated_by } = req.body;
    const token = process.env.GITHUB_TOKEN;

    console.log('Token var mı?', !!token);
    console.log('Kullanıcı:', last_updated_by);

    if (!token) {
        return res.status(500).json({ error: 'Token eksik (Vercel ayarlarında)' });
    }

    if (last_updated_by !== 'clawy') {
        return res.status(403).json({ error: 'Yetkisiz kullanıcı' });
    }

    const octokit = new Octokit({ auth: token });

    try {
        // 1. Dosyanın SHA'sını al
        const { data } = await octokit.repos.getContent({
            owner: 'clawy1337',
            repo: 'clawy-vercel',
            path: 'data/status.json',
            branch: 'main'
        });

        const sha = data.sha;
        const content = Buffer.from(JSON.stringify({
            status_text,
            last_updated,
            last_updated_by
        }, null, 2)).toString('base64');

        // 2. Dosyayı güncelle
        await octokit.repos.createOrUpdateFileContents({
            owner: 'clawy1337',
            repo: 'clawy-vercel',
            path: 'data/status.json',
            message: `Durum güncellendi: ${status_text} by ${last_updated_by}`,
            content,
            sha,
            branch: 'main'
        });

        res.status(200).json({ message: 'Başarıyla kaydedildi!' });
    } catch (error) {
        console.error('GitHub API Hatası:', error.message);
        res.status(500).json({ 
            error: 'Kaydedilemedi', 
            details: error.message 
        });
    }
}
