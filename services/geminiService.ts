import { GoogleGenAI, Type } from "@google/genai";
import { ExtractionResult } from "../types";

// Note: API key is automatically injected via process.env.API_KEY
// We initialize lazily to ensure it catches the latest environment state
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function extractResumeData(text: string): Promise<ExtractionResult> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Task: Extract professional contact details.
    
    Resume Content Block:
    ${text.substring(0, 15000)}
    
    Instructions:
    1. Identify the candidate's Full Name.
    2. Identify the Primary Email Address.
    3. Return ONLY a valid JSON object.
    4. If information is missing, use "Unknown".`,
    config: {
      systemInstruction: "You are a professional HR data extraction engine. You output strictly valid JSON. No conversational text, no markdown blocks, just the raw JSON object.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: 'The candidate name' },
          email: { type: Type.STRING, description: 'The candidate email' },
        },
        required: ["name", "email"]
      },
      temperature: 0.1,
    },
  });

  try {
    const rawText = response.text || '{}';
    // Handle potential markdown backticks if model ignores system instructions
    const jsonStr = rawText.replace(/```json|```/g, '').trim();
    const data = JSON.parse(jsonStr);
    
    return {
      name: data.name?.trim() || 'Unknown',
      email: data.email?.toLowerCase().trim() || 'Unknown'
    };
  } catch (error) {
    console.error("Extraction Parsing Error:", error);
    // Fallback search if JSON fails but text exists
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    return {
      name: 'Unknown (Parsing Error)',
      email: emailMatch ? emailMatch[0] : 'Unknown'
    };
  }
}