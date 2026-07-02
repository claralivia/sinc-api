import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const processNaturalLanguage = async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Extraia os dados de: "${text}". 
    Responda APENAS em formato JSON puro, sem markdown, sem explicações. 
    Estrutura: { "description": string, "amount": number, "type": "EXPENSE" | "INCOME" }.`;

    const result = await model.generateContent(prompt);
    const responseText = await result.response.text();
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return res.json(JSON.parse(cleanJson));
  } catch (error) {
    return res.status(500).json({ error: "Falha ao processar linguagem natural" });
  }
};