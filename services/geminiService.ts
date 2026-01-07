
import { GoogleGenAI, Type } from "@google/genai";
import { ExtractionResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export async function extractResumeData(text: string): Promise<ExtractionResult> {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please ensure process.env.API_KEY is configured.");
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Extract the candidate's full name and primary email address from the following resume text. 
    If you cannot find a specific piece of information, return 'Unknown'.
    
    Resume Text:
    ${text.substring(0, 10000)}`, // Limit to first 10k chars for efficiency
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            description: 'The full name of the candidate.',
          },
          email: {
            type: Type.STRING,
            description: 'The primary email address of the candidate.',
          },
        },
        required: ["name", "email"]
      },
    },
  });

  try {
    const data = JSON.parse(response.text);
    return data as ExtractionResult;
  } catch (error) {
    console.error("Failed to parse Gemini response:", error);
    throw new Error("Failed to parse extraction results");
  }
}
