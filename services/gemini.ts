
import { GoogleGenAI } from "@google/genai";

// Initialize the Google GenAI SDK with the API key from environment variables.
// Always use the named parameter and obtain the key exclusively from process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateBio = async (interests: string): Promise<string> => {
  try {
    // Generate bio using gemini-3-flash-preview for a basic text task.
    // Call generateContent directly on ai.models.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Write a creative, short social media bio based on these interests: ${interests}. Keep it under 150 characters. No hashtags.`,
    });
    // Access the generated text directly from the response.text property (not a method).
    return response.text?.trim() || "I am a new Akti Forum member!";
  } catch (err) {
    console.error("Gemini Bio Error:", err);
    return "Exploring the digital frontier of Akti Forum.";
  }
};

export const getSupportResponse = async (queryText: string): Promise<string> => {
  try {
    // Get support response using gemini-3-flash-preview.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: queryText,
      config: {
        systemInstruction: "You are Akti Assistant, a helpful support bot for the Akti Forum. Help users with forum features like posting, liking, upgrading to Pro via Binance, and managing their profiles. Be concise and friendly.",
      }
    });
    // Access the generated text directly from the response.text property.
    return response.text?.trim() || "I'm sorry, I couldn't process that. How can I help you?";
  } catch (err) {
    console.error("Gemini Support Error:", err);
    return "Technical difficulties. Please contact our admin.";
  }
};
