import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Mic, Image as ImageIcon, Terminal, X, 
  Activity, Code, ChevronLeft, ChevronRight, Play, RefreshCw 
} from 'lucide-react';
import { Message, Role, CodeSnippet } from '../types';
import { sendMessageToGemini, initializeChat } from '../services/geminiService';
import { INITIAL_GREETING } from '../constants';
import ReactMarkdown from 'react-markdown';

interface ChatInterfaceProps {
  isHackerMode: boolean;
  toggleHackerMode: () => void;
  onBack: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ isHackerMode, toggleHackerMode, onBack }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeCode, setActiveCode] = useState<CodeSnippet | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeChat();
    // Initial Greeting
    setMessages([{
      id: 'init',
      role: Role.MODEL,
      text: INITIAL_GREETING,
      timestamp: Date.now()
    }]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Parse code blocks from the last message to update Gemini Canvas
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === Role.MODEL) {
      const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/;
      const match = lastMsg.text.match(codeBlockRegex);
      if (match) {
        setActiveCode({
          language: match[1] || 'text',
          code: match[2]
        });
      }
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Optimistic Model Message
    const modelMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: modelMsgId,
      role: Role.MODEL,
      text: '', // Will stream into this
      timestamp: Date.now()
    }]);

    await sendMessageToGemini(userMsg.text, (streamText) => {
      setMessages(prev => prev.map(msg => 
        msg.id === modelMsgId ? { ...msg, text: streamText } : msg
      ));
    });

    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`fixed inset-0 flex h-screen w-full overflow-hidden transition-colors duration-500 ${isHackerMode ? 'bg-black text-green-500 font-mono' : 'bg-astra-black text-white font-rajdhani'}`}>
      
      {/* Hacker CRT Overlay */}
      {isHackerMode && (
        <>
            <div className="crt-overlay absolute inset-0 z-50 pointer-events-none"></div>
            <div className="scanline z-50"></div>
        </>
      )}

      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} flex-shrink-0 border-r ${isHackerMode ? 'border-green-800 bg-black' : 'border-white/10 bg-black/40'} transition-all duration-300 flex flex-col overflow-hidden relative z-20`}>
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <span className="font-orbitron font-bold text-lg tracking-widest">{isHackerMode ? 'TERMINAL_01' : 'HISTORY'}</span>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          <div className={`p-3 rounded text-sm cursor-pointer ${isHackerMode ? 'hover:bg-green-900/30' : 'bg-astra-blue/10 border border-astra-blue/30'}`}>
            <div className="font-bold text-xs opacity-70 mb-1">SESSION #0921</div>
            <div className="truncate">Initial System Check...</div>
          </div>
        </div>
        <div className="p-4 border-t border-white/10">
           <div className="mb-4">
              <div className="flex items-center justify-between text-xs mb-1 opacity-70">
                <span>RTMS UPTIME</span>
                <span>99.9%</span>
              </div>
              <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-astra-green w-[99%] animate-pulse"></div>
              </div>
           </div>
           <button onClick={() => setMessages([])} className={`w-full py-2 text-xs font-bold border ${isHackerMode ? 'border-green-500 text-green-500 hover:bg-green-900' : 'border-red-500/50 text-red-400 hover:bg-red-900/20'} transition-colors`}>
             CLEAR MEMORY
           </button>
        </div>
        <div className="p-2 text-center text-[10px] opacity-50 border-t border-white/5">
           Created by Ayush Singh
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative z-10">
        
        {/* Top Bar */}
        <header className={`h-16 border-b ${isHackerMode ? 'border-green-800 bg-black' : 'border-white/10 bg-black/40 backdrop-blur-md'} flex items-center justify-between px-6`}>
           <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className={`${sidebarOpen ? 'hidden' : 'block'} md:hidden`}>
                <ChevronRight />
              </button>
              <button onClick={onBack} className="flex items-center gap-2 opacity-70 hover:opacity-100 transition-opacity">
                 <ChevronLeft size={18} /> <span className="hidden md:inline font-mono text-sm">EXIT</span>
              </button>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/50 border border-white/10">
                 <Activity size={14} className="text-astra-green animate-pulse" />
                 <span className="text-xs font-orbitron tracking-wider text-astra-green">RTMS: ONLINE</span>
              </div>
           </div>
           
           <div className="flex items-center gap-4">
             <span className={`text-xs font-bold ${isHackerMode ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
                 HACKER_MODE_ACTIVE
             </span>
             <button 
               onClick={toggleHackerMode}
               className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${isHackerMode ? 'bg-astra-green' : 'bg-gray-700'}`}
             >
                <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${isHackerMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
             </button>
           </div>
        </header>

        {/* Split View Container */}
        <div className="flex-1 flex overflow-hidden relative">
            
            {/* Chat Area */}
            <div className={`flex-1 flex flex-col transition-all duration-500 ${activeCode ? 'w-1/2 hidden md:flex' : 'w-full'}`}>
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                   {messages.map((msg) => (
                     <div key={msg.id} className={`flex ${msg.role === Role.USER ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] md:max-w-[75%] p-4 rounded-2xl backdrop-blur-sm border 
                          ${msg.role === Role.USER 
                             ? (isHackerMode ? 'bg-green-900/20 border-green-500/50 text-green-400' : 'bg-astra-saffron/20 border-astra-saffron/50 text-white rounded-tr-none') 
                             : (isHackerMode ? 'bg-black border-green-800 text-green-500' : 'bg-astra-blue/10 border-astra-blue/20 text-gray-100 rounded-tl-none')
                          } shadow-lg`}
                        >
                           <div className="flex items-center gap-2 mb-2 opacity-50 text-[10px] font-mono uppercase tracking-widest">
                              <span>{msg.role === Role.USER ? 'OPERATOR' : 'ASTRA AI'}</span>
                              <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                           </div>
                           <div className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                               <ReactMarkdown>{msg.text}</ReactMarkdown>
                           </div>
                        </div>
                     </div>
                   ))}
                   {isLoading && (
                     <div className="flex justify-start">
                        <div className={`px-4 py-2 rounded-full text-xs font-mono animate-pulse ${isHackerMode ? 'text-green-500' : 'text-astra-blue'}`}>
                           PROCESSING_RTMS_REQUEST...
                        </div>
                     </div>
                   )}
                   <div ref={messagesEndRef} />
                </div>
                
                {/* Input Area */}
                <div className={`p-4 md:p-6 ${isHackerMode ? 'bg-black border-t border-green-800' : 'bg-black/60 backdrop-blur-xl border-t border-white/10'}`}>
                   <div className={`flex items-center gap-2 p-2 rounded-xl border transition-all focus-within:border-opacity-100 ${isHackerMode ? 'bg-black border-green-500 border-opacity-50' : 'bg-white/5 border-astra-blue/30 border-opacity-50'}`}>
                      <button className={`p-2 rounded-lg transition-colors ${isHackerMode ? 'hover:text-white' : 'hover:bg-white/10 text-gray-400'}`}>
                        <ImageIcon size={20} />
                      </button>
                      <textarea 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={isHackerMode ? "ENTER_COMMAND_ROOT..." : "Ask ASTRA anything..."}
                        className="flex-1 bg-transparent border-none outline-none text-sm resize-none max-h-32 py-2 px-2 font-mono"
                        rows={1}
                      />
                      <button className={`p-2 rounded-lg transition-colors ${isHackerMode ? 'hover:text-white' : 'hover:bg-white/10 text-gray-400'}`}>
                        <Mic size={20} />
                      </button>
                      <button 
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className={`p-2 rounded-lg transition-all ${input.trim() ? (isHackerMode ? 'bg-green-600 text-black hover:bg-green-500' : 'bg-astra-saffron text-black hover:bg-white') : 'opacity-30 cursor-not-allowed'}`}
                      >
                        <Send size={20} />
                      </button>
                   </div>
                </div>
            </div>

            {/* Gemini Canvas (Code Split View) */}
            {activeCode && (
                <div className={`w-1/2 hidden md:flex flex-col border-l ${isHackerMode ? 'border-green-800 bg-black' : 'border-white/10 bg-[#0d0d0d]'}`}>
                   <div className={`p-3 border-b ${isHackerMode ? 'border-green-800' : 'border-white/10'} flex items-center justify-between`}>
                      <div className="flex items-center gap-2">
                        <Code size={16} className="text-astra-blue" />
                        <span className="text-xs font-mono uppercase text-gray-400">{activeCode.language} CANVAS</span>
                      </div>
                      <div className="flex gap-2">
                         <button className="p-1 hover:text-white text-gray-500 transition-colors"><RefreshCw size={14}/></button>
                         <button 
                           className="p-1 hover:text-white text-gray-500 transition-colors" 
                           onClick={() => setActiveCode(null)}
                         >
                            <X size={14}/>
                         </button>
                      </div>
                   </div>
                   <div className="flex-1 overflow-auto p-4 font-mono text-sm relative group">
                      <pre className={`${isHackerMode ? 'text-green-400' : 'text-gray-300'}`}>
                        <code>{activeCode.code}</code>
                      </pre>
                      <button 
                        className="absolute top-4 right-4 px-3 py-1 bg-astra-saffron text-black text-xs font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                        onClick={() => navigator.clipboard.writeText(activeCode.code)}
                      >
                         COPY
                      </button>
                   </div>
                   <div className={`p-3 border-t ${isHackerMode ? 'border-green-800' : 'border-white/10'} flex justify-end`}>
                      <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-500 transition-colors">
                        <Play size={14} /> RUN CODE
                      </button>
                   </div>
                </div>
            )}
        </div>

      </div>
    </div>
  );
};