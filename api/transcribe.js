import { OpenAI } from "openai";
import formidable from "formidable";
import fs from "fs";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export const config = {
    api: { bodyParser: false }
};

export default async function handler(req, res){
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files)=>{
        if(err) return res.status(500).json({error: err.message});

        const file = files.audio.filepath;
        try{
            const transcription = await openai.audio.transcriptions.create({
                file: fs.createReadStream(file),
                model: "whisper-1",
                language: "en"
            });
            res.status(200).json({ text: transcription.text });
        }catch(e){
            console.error(e);
            res.status(500).json({ error: "Whisper transcription failed" });
        }
    });
}
