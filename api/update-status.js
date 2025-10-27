const { Octokit } = require('@octokit/rest');

module.exports = async (req, res) => {
    const { status_text, last_updated, last_updated_by } = req.body;
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Vercel Environment Variables’dan
    const octokit = new Octokit({ auth: GITHUB_TOKEN });

    try {
        // Mevcut dosyanın SHA’sını al
        const { data } = await octokit.repos.getContent({
            owner: 'clawy1337',
            repo: 'clawy-vercel',
            path: 'status.json',
            branch: 'main'
        });
        const sha = data.sha;

        // Yeni JSON içeriği
        const jsonContent = JSON.stringify({ status_text, last_updated, last_updated_by }, null, 2);
        const newContent = Buffer.from(jsonContent).toString('base64');

        // Dosyayı güncelle
        await octokit.repos.createOrUpdateFileContents({
            owner: 'clawy1337',
            repo: 'clawy-vercel',
            path: 'status.json',
            message: `Durum güncellendi: ${status_text} by ${last_updated_by}`,
            content: newContent,
            sha,
            branch: 'main'
        });

        res.status(200).json({ message: 'Durum güncellendi' });
    } catch (error) {
        res.status(500).json({ message: 'Güncelleme hatası', error: error.message });
    }
};
