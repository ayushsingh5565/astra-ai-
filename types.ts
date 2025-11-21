export enum Role {
  USER = 'user',
  MODEL = 'model'
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  timestamp: number;
  isCode?: boolean;
  language?: string;
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
