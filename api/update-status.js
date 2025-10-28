import fs from 'fs';
import path from 'path';

const filePath = path.resolve('./data/status.json');

export default function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Sadece POST' });
    }

    const { status_text, last_updated, last_updated_by } = req.body;

    // Admin kontrolü (basit)
    if (!last_updated_by || last_updated_by !== 'clawy') {
        return res.status(403).json({ error: 'Yetkisiz erişim' });
    }

    try {
        const newData = {
            status_text,
            last_updated,
            last_updated_by
        };
        fs.writeFileSync(filePath, JSON.stringify(newData, null, 2));
        res.status(200).json({ message: 'Durum güncellendi' });
    } catch (error) {
        console.error('Yazma hatası:', error);
        res.status(500).json({ error: 'Kaydedilemedi' });
    }
}
