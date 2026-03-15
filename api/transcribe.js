import formidable from "formidable";
import fs from "fs";
import { Configuration, OpenAIApi } from "openai";

export const config = { api: { bodyParser: false } };

const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
}));

export default async function handler(req,res){
  if(req.method==="POST"){
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files)=>{
      if(err) return res.status(500).json({error: err.message});
      const filePath = files.file.filepath;
      try{
        const transcription = await openai.audio.transcriptions.create({
          file: fs.createReadStream(filePath),
          model: "whisper-1"
        });
        res.status(200).json({text: transcription.text});
      }catch(err){
        res.status(500).json({error: err.message});
      }
    });
  } else {
    res.status(405).json({error:"Method not allowed"});
  }
}
