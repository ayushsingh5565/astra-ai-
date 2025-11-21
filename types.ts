export enum Role {
  USER = 'user',
  MODEL = 'model'
}

export interface Attachment {
  file: File;
  previewUrl: string;
  base64: string;
  mimeType: string;
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  timestamp: number;
  isCode?: boolean;
  language?: string;
  image?: string; // Base64 or URL
  video?: string; // URL
  isLiveAudio?: boolean;
}

export enum AppMode {
  LANDING = 'LANDING',
  CHAT = 'CHAT'
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

export interface CodeSnippet {
  language: string;
  code: string;
}
