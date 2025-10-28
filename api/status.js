import fs from 'fs';
import path from 'path';

const filePath = path.resolve('./data/status.json');

export default function handler(req, res) {
    try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        res.status(200).json(data);
    } catch (error) {
        console.error('Okuma hatası:', error);
        res.status(500).json({ error: 'Durum okunamadı' });
    }
}
