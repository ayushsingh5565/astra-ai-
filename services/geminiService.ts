import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { ASTRA_SYSTEM_INSTRUCTION } from '../constants';
import { Message, Role } from '../types';

// Initialize Gemini Client
// Note: In a real production app, API keys should be handled via backend proxy or rigorous env management.
// Here we use the process.env.API_KEY as per instructions.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

let chatInstance: Chat | null = null;

export const initializeChat = () => {
  chatInstance = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: ASTRA_SYSTEM_INSTRUCTION,
      temperature: 0.9, // Slightly creative for the persona
      maxOutputTokens: 4096,
    },
  });
};

export const sendMessageToGemini = async (
  userMessage: string,
  onStream: (text: string) => void
): Promise<string> => {
  if (!chatInstance) {
    initializeChat();
  }

  if (!chatInstance) throw new Error("Chat initialization failed");

  let fullResponse = "";

  try {
    const result = await chatInstance.sendMessageStream({ message: userMessage });

    for await (const chunk of result) {
      const c = chunk as GenerateContentResponse;
      const text = c.text;
      if (text) {
        fullResponse += text;
        onStream(fullResponse);
      }
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    // Fallback generic error that fits persona
    const errorMsg = "RTMS CONNECTION INTERRUPTED. NETWORK ANOMALY DETECTED. 🚫";
    onStream(errorMsg);
    return errorMsg;
  }

  return fullResponse;
};
