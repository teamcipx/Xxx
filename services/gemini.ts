
import { GoogleGenAI } from "@google/genai";

// Initialize the Google GenAI SDK within each function to ensure it always uses the most up-to-date API key.
// This follows the guidelines for handling dynamic API key selection from a dialog.

export const generateBio = async (interests: string): Promise<string> => {
  try {
    // Create a new GoogleGenAI instance right before the API call to capture the latest process.env.API_KEY.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Generate bio using gemini-3-flash-preview for a basic text task.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Write a creative, short social media bio based on these interests: ${interests}. Keep it under 150 characters. No hashtags.`,
    });
    // Access the generated text directly from the response.text property.
    return response.text?.trim() || "I am a new Akti Forum member!";
  } catch (err: any) {
    // If the request fails with an error indicating the API key might be missing or invalid, prompt the user to select one.
    if (err.message?.includes("Requested entity was not found") && (window as any).aistudio?.openSelectKey) {
      (window as any).aistudio.openSelectKey();
    }
    console.error("Gemini Bio Error:", err);
    return "Exploring the digital frontier of Akti Forum.";
  }
};

export const getSupportResponse = async (queryText: string): Promise<string> => {
  try {
    // Create a new GoogleGenAI instance right before the API call as per guidelines.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
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
  } catch (err: any) {
    // If the request fails with an error indicating the API key might be missing or invalid, prompt the user to select one.
    if (err.message?.includes("Requested entity was not found") && (window as any).aistudio?.openSelectKey) {
      (window as any).aistudio.openSelectKey();
    }
    console.error("Gemini Support Error:", err);
    return "Technical difficulties. Please contact our admin.";
  }
};
