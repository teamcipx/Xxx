
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateBio = async (interests: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Write a creative, short social media bio based on these interests: ${interests}. Keep it under 150 characters. No hashtags.`,
  });
  return response.text?.trim() || "I am a new Akti Forum member!";
};

export const getSupportResponse = async (query: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: query,
    config: {
      systemInstruction: "You are Akti Assistant, a helpful support bot for the Akti Forum. Help users with forum features like posting, liking, upgrading to Pro via Binance, and managing their profiles. Be concise and friendly.",
    }
  });
  return response.text?.trim() || "I'm sorry, I couldn't process that. How can I help you?";
};
