import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function parseStudentList(fileData: string, mimeType: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          { text: "Extract a list of student names from this file. Return as a JSON array of strings." },
          { inlineData: { data: fileData, mimeType } }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });
  return JSON.parse(response.text || "[]");
}

export async function parseDSKP(fileData: string, mimeType: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          { text: "Extract Standard Kandungan (SK) and Standard Pembelajaran (SP) from this DSKP document. Return as a JSON array of objects with 'sk' and 'sp' fields." },
          { inlineData: { data: fileData, mimeType } }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            sk: { type: Type.STRING },
            sp: { type: Type.STRING }
          },
          required: ["sk", "sp"]
        }
      }
    }
  });
  return JSON.parse(response.text || "[]");
}

export async function suggestDSKP(subjectName: string, yearLevel: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          { text: `Suggest a list of Standard Kandungan (SK) and Standard Pembelajaran (SP) for the subject "${subjectName}" at year level "${yearLevel}" based on the Malaysian DSKP curriculum. Return as a JSON array of objects with 'sk' and 'sp' fields. Provide at least 5 relevant entries.` }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            sk: { type: Type.STRING },
            sp: { type: Type.STRING }
          },
          required: ["sk", "sp"]
        }
      }
    }
  });
  return JSON.parse(response.text || "[]");
}
