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

    // Vercel'de dosya uzantılarının (.webm, .m4a) korunması OpenAI için çok önemlidir
    const form = formidable({ keepExtensions: true });
    
    form.parse(req, async (err, fields, files) => {
        if (err) {
            console.error("Form Parse Hatası:", err);
            return res.status(500).json({ error: "Dosya okuma hatası" });
        }

        // Formidable yeni sürümlerde array döndürür
        const audioFile = Array.isArray(files.audio) ? files.audio[0] : files.audio; 
        
        if (!audioFile) {
            return res.status(400).json({ error: "Ses dosyası bulunamadı" });
        }

        try {
            const transcription = await openai.audio.transcriptions.create({
                file: fs.createReadStream(audioFile.filepath),
                model: "whisper-1",
                language: "en", // Kesinlikle İngilizce olmasını sağlar
                
                // KALİTEYİ ARTIRAN 1. SİLAH: Prompt (Bağlam)
                // Whisper'a kullanıcının ne hakkında konuştuğunu söylüyoruz. 
                // Bu sayede saçma kelimeler uydurmak yerine resim tasvirine odaklanır.
                prompt: "This is an English speech where a person is describing a picture, colors, objects, and people. Please transcribe it accurately with correct punctuation.",
                
                // KALİTEYİ ARTIRAN 2. SİLAH: Temperature (Netlik)
                // 0'a ne kadar yakın olursa, model o kadar "net duyduğu" kelimeleri yazar, uydurmaz.
                temperature: 0.2 
            });
            
            res.status(200).json({ text: transcription.text });
        } catch (e) {
            console.error("OpenAI Hatası:", e);
            res.status(500).json({ error: e.message || "API çağrısı başarısız oldu" });
        } finally {
            // VERCEL ÇÖKMESİN DİYE: İşlem bitince geçici ses dosyasını sunucudan sil
            try {
                if (audioFile && audioFile.filepath && fs.existsSync(audioFile.filepath)) {
                    fs.unlinkSync(audioFile.filepath);
                }
            } catch (cleanupErr) {
                console.error("Dosya temizleme hatası:", cleanupErr);
            }
        }
    });
}
