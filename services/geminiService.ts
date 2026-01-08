import { GoogleGenAI, Type } from "@google/genai";
import { ExtractionResult } from "../types";

// Note: API key is automatically injected via process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function extractResumeData(text: string): Promise<ExtractionResult> {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Task: Extract professional contact details.
    
    Resume Content Block:
    ${text.substring(0, 12000)}
    
    Instructions:
    1. Identify the candidate's Full Name (usually prominent at the top).
    2. Identify the Primary Email Address.
    3. If information is missing or ambiguous, use "Unknown".
    4. Clean up any parsing artifacts (extra spaces, special characters).`,
    config: {
      systemInstruction: "You are a precise HR data extraction engine. Return only the requested fields in valid JSON. Ignore irrelevant text.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: 'The candidate name' },
          email: { type: Type.STRING, description: 'The candidate email' },
        },
        required: ["name", "email"]
      },
      temperature: 0.1, // Lower temperature for higher extraction consistency
    },
  });

  try {
    const rawText = response.text || '{}';
    const data = JSON.parse(rawText);
    return {
      name: data.name?.trim() || 'Unknown',
      email: data.email?.toLowerCase().trim() || 'Unknown'
    };
  } catch (error) {
    console.error("Extraction Parsing Error:", error);
    throw new Error("Data structure mismatch from AI response.");
  }
}