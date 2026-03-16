import { OpenAI } from "openai";
import formidable from "formidable";
import fs from "fs";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export const config = {
    api: { bodyParser: false }
};

export default async function handler(req, res) {
    // Sadece POST isteklerini kabul et
    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const form = new formidable.IncomingForm();
    
    form.parse(req, async (err, fields, files) => {
        if (err) {
            console.error("Form Parse Hatası:", err);
            return res.status(500).json({ error: "Dosya okuma hatası" });
        }

        // Mobilde dosya gelip gelmediğini kontrol edelim
        const audioFile = files.audio?.[0] || files.audio; 
        if (!audioFile) {
            return res.status(400).json({ error: "Ses dosyası bulunamadı" });
        }

        try {
            const transcription = await openai.audio.transcriptions.create({
                file: fs.createReadStream(audioFile.filepath),
                model: "whisper-1",
                language: "en"
            });
            
            res.status(200).json({ text: transcription.text });
        } catch (e) {
            console.error("OpenAI Hatası:", e.message);
            res.status(500).json({ error: e.message });
        }
    });
}
