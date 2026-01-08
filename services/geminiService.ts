
import { GoogleGenAI, Type } from "@google/genai";
import { ExtractionResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function extractResumeData(text: string): Promise<ExtractionResult> {
  // Using gemini-3-flash-preview for superior speed and high accuracy in text extraction tasks
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `You are an expert HR data parser. Your task is to extract the candidate's full name and their primary professional email address from the provided resume text.
    
    Guidelines:
    - The name is usually at the very top.
    - If multiple emails exist, prioritize the personal/primary one.
    - If the text is messy due to PDF parsing (columns, headers), reason through it to find the logical contact information.
    - If information is missing, use 'Unknown'.
    
    Resume Content:
    ---
    ${text.substring(0, 15000)}
    ---`,
    config: {
      systemInstruction: "You extract structured data from resume text. Accuracy is paramount. Handle diverse formats gracefully.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            description: 'The full legal or preferred name of the candidate.',
          },
          email: {
            type: Type.STRING,
            description: 'The primary contact email address.',
          },
        },
        required: ["name", "email"]
      },
    },
  });

  try {
    const data = JSON.parse(response.text || '{}');
    // Basic cleanup of extracted data
    return {
      name: data.name?.trim() || 'Unknown',
      email: data.email?.toLowerCase().trim() || 'Unknown'
    };
  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    throw new Error("Data extraction failed due to content complexity.");
  }
}
