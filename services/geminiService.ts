import { GoogleGenAI, Chat, GenerateContentResponse, LiveServerMessage, Modality } from "@google/genai";
import { ASTRA_SYSTEM_INSTRUCTION } from '../constants';
import { Message, Role, Attachment } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

let chatInstance: Chat | null = null;

// --- 1. Chat & Text Logic (Gemini 3 Pro) ---

export const initializeChat = () => {
  chatInstance = ai.chats.create({
    model: 'gemini-3-pro-preview', // Updated to Pro as requested
    config: {
      systemInstruction: ASTRA_SYSTEM_INSTRUCTION,
      temperature: 0.9,
    },
  });
};

export const sendMessageToGemini = async (
  userMessage: string,
  attachment: Attachment | null,
  onStream: (text: string) => void
): Promise<string> => {
  if (!chatInstance) initializeChat();
  if (!chatInstance) throw new Error("RTMS Chat Core Failed");

  let fullResponse = "";

  try {
    // If there is an image attachment, we use gemini-3-pro-preview's multimodal capability within the chat
    // or specific image editing if requested. For general chat with image:
    let result;
    
    if (attachment) {
       // For image + text in a chat context
       const response = await ai.models.generateContentStream({
        model: 'gemini-3-pro-preview',
        contents: {
          parts: [
            { inlineData: { data: attachment.base64, mimeType: attachment.mimeType } },
            { text: userMessage }
          ]
        },
        config: { systemInstruction: ASTRA_SYSTEM_INSTRUCTION }
       });
       result = response;
    } else {
       result = await chatInstance.sendMessageStream({ message: userMessage });
    }

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
    const errorMsg = "RTMS CONNECTION INTERRUPTED. NETWORK ANOMALY DETECTED. 🚫";
    onStream(errorMsg);
    return errorMsg;
  }

  return fullResponse;
};

// --- 2. Image Editing / Generation (Gemini 2.5 Flash Image) ---

export const generateEditedImage = async (prompt: string, base64Image?: string, mimeType?: string): Promise<string | null> => {
  try {
    const parts: any[] = [{ text: prompt }];
    if (base64Image && mimeType) {
      parts.unshift({
        inlineData: { data: base64Image, mimeType: mimeType }
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
      // No responseMimeType for banana models
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (e) {
    console.error("Image Gen Error", e);
    throw e;
  }
};

// --- 3. Video Generation (Veo) ---

export const generateVeoVideo = async (prompt: string, base64Image?: string, mimeType?: string): Promise<string | null> => {
  // Ensure user has selected a key for Veo
  if (window.aistudio && !await window.aistudio.hasSelectedApiKey()) {
     await window.aistudio.openSelectKey();
     // Re-init AI to ensure key is fresh
  }
  const freshAi = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    let operation;
    
    const config = {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9' // Default landscape
    };

    if (base64Image && mimeType) {
        operation = await freshAi.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt || "Animate this",
            image: { imageBytes: base64Image, mimeType: mimeType },
            config
        });
    } else {
        operation = await freshAi.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            config
        });
    }

    // Poll for completion
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await freshAi.operations.getVideosOperation({ operation: operation });
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (videoUri) {
      return `${videoUri}&key=${process.env.API_KEY}`;
    }
    return null;
  } catch (e) {
    console.error("Veo Error", e);
    throw e;
  }
};

// --- 4. Astra Deepfake Detection (Gemini 3 Pro) ---

export const runAstraDetection = async (attachment: Attachment, onStream: (text: string) => void): Promise<string> => {
  const prompt = `
  ASTRA FORENSIC PROTOCOL INITIATED.
  
  Analyze the provided media (Image/Video) strictly for signs of digital manipulation, AI generation (Deepfakes), or face-swapping artifacts.
  
  Scrutinize for:
  1. Unnatural lighting inconsistencies or shadow mismatches.
  2. Skin texture anomalies (over-smoothing, plastic look).
  3. Warping around edges, hair, or glasses.
  4. (If Video) Lip-sync issues, jittery movements, or inconsistent blinking.
  
  OUTPUT FORMAT (Markdown):
  ## 🛡️ ASTRA SECURITY REPORT
  **VERDICT:** [REAL / SUSPICIOUS / DEEPFAKE]
  **REALNESS SCORE:** [0-100]%
  
  ### 🔍 FORENSIC ANALYSIS
  *   [Detail 1]
  *   [Detail 2]
  
  ### ⚠️ ANOMALIES DETECTED
  [List specific artifacts or state "None Detected"]
  `;

  let fullResponse = "";
  
  try {
    const response = await ai.models.generateContentStream({
        model: 'gemini-3-pro-preview',
        contents: {
            parts: [
                { inlineData: { data: attachment.base64, mimeType: attachment.mimeType } },
                { text: prompt }
            ]
        },
        config: {
            systemInstruction: "You are ASTRA's specialized Forensic Analysis Module. Your tone is clinical, precise, and authoritative."
        }
    });

    for await (const chunk of response) {
        const text = chunk.text;
        if (text) {
            fullResponse += text;
            onStream(fullResponse);
        }
    }
    return fullResponse;
  } catch (e) {
      console.error("Detection Error", e);
      const err = "ASTRA SCAN FAILED. MEDIA ENCRYPTION TOO STRONG OR NETWORK ERROR.";
      onStream(err);
      return err;
  }
};

// --- 5. Live API (Real-time Voice) ---

export class LiveClient {
  private session: any = null;
  private audioContext: AudioContext | null = null;
  private inputStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private nextStartTime = 0;

  constructor(private onStatusChange: (status: string) => void) {}

  async connect() {
    this.onStatusChange("CONNECTING...");
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    
    // Input Stream
    this.inputStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const inputSource = this.audioContext.createMediaStreamSource(this.inputStream);
    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

    const sessionPromise = ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      config: {
        responseModalities: [Modality.AUDIO],
        systemInstruction: ASTRA_SYSTEM_INSTRUCTION,
      },
      callbacks: {
        onopen: () => {
          this.onStatusChange("LISTENING");
          // Start Streaming Audio
          this.processor!.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const pcmData = this.pcmToBase64(inputData);
            sessionPromise.then(session => session.sendRealtimeInput({ 
                media: { mimeType: 'audio/pcm;rate=16000', data: pcmData } 
            }));
          };
          inputSource.connect(this.processor!);
          this.processor!.connect(this.audioContext!.destination);
        },
        onmessage: async (msg: LiveServerMessage) => {
           const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
           if (audioData) {
             this.playAudio(audioData);
           }
        },
        onclose: () => this.onStatusChange("DISCONNECTED"),
        onerror: (e) => {
            console.error(e);
            this.onStatusChange("ERROR");
        }
      }
    });
    this.session = sessionPromise;
  }

  async disconnect() {
    if (this.session) {
       (await this.session).close();
    }
    this.inputStream?.getTracks().forEach(t => t.stop());
    this.processor?.disconnect();
    this.audioContext?.close();
    this.onStatusChange("OFFLINE");
  }

  private async playAudio(base64: string) {
     if (!this.audioContext) return;
     // Decode specific to Gemini response
     const binary = atob(base64);
     const bytes = new Uint8Array(binary.length);
     for(let i=0; i<binary.length; i++) bytes[i] = binary.charCodeAt(i);
     
     // Manual PCM decoding usually required for raw stream, but let's try standard decode first 
     // If raw PCM, we need manual float conversion. Assuming standard decode for simplicity in this context
     // or implementing the specific PCM decode from guidelines if raw.
     // Guidelines say: "The audio bytes... is raw PCM".
     
     const dataInt16 = new Int16Array(bytes.buffer);
     const buffer = this.audioContext.createBuffer(1, dataInt16.length, 24000);
     const channelData = buffer.getChannelData(0);
     for(let i=0; i<dataInt16.length; i++) {
         channelData[i] = dataInt16[i] / 32768.0;
     }
     
     const source = this.audioContext.createBufferSource();
     source.buffer = buffer;
     source.connect(this.audioContext.destination);
     
     const now = this.audioContext.currentTime;
     this.nextStartTime = Math.max(this.nextStartTime, now);
     source.start(this.nextStartTime);
     this.nextStartTime += buffer.duration;
  }

  private pcmToBase64(data: Float32Array): string {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i=0; i<l; i++) int16[i] = data[i] * 32768;
    let binary = '';
    const bytes = new Uint8Array(int16.buffer);
    for (let i=0; i<bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }
}