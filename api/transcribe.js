import { OpenAI } from "openai"
import formidable from "formidable"
import fs from "fs"

export const config={
 api:{bodyParser:false}
}

const openai=new OpenAI({
 apiKey:process.env.OPENAI_API_KEY
})

export default async function handler(req,res){

 if(req.method!=="POST"){
  return res.status(405).json({error:"Method not allowed"})
 }

 const form=formidable({keepExtensions:true})

 form.parse(req,async(err,fields,files)=>{

  if(err){
   return res.status(500).json({error:"File read error"})
  }

  const audioFile=Array.isArray(files.audio)
  ? files.audio[0]
  : files.audio

  if(!audioFile){
   return res.status(400).json({error:"Audio missing"})
  }

  try{

   const transcription=await openai.audio.transcriptions.create({
    file:fs.createReadStream(audioFile.filepath),
    model:"whisper-1",
    language:"en",
    temperature:0
   })

   res.status(200).json({text:transcription.text})

  }catch(e){

   res.status(500).json({error:e.message})

  }finally{

   if(audioFile?.filepath && fs.existsSync(audioFile.filepath)){
    fs.unlinkSync(audioFile.filepath)
   }

  }

 })

}
