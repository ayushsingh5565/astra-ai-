
import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Mic, Image as ImageIcon, Terminal, X, 
  Activity, Code, ChevronLeft, ChevronRight, Play, RefreshCw,
  Wand2, Paperclip, StopCircle, ScanEye, Skull, AlertTriangle, Lock, Menu
} from 'lucide-react';
import { Message, Role, CodeSnippet, Attachment } from '../types';
import { 
  sendMessageToGemini, 
  initializeChat, 
  generateEditedImage, 
  runAstraDetection,
  LiveClient 
} from '../services/geminiService';
import { INITIAL_GREETING } from '../constants';
import ReactMarkdown from 'react-markdown';
import { Logo } from './Logo';

interface ChatInterfaceProps {
  isHackerMode: boolean;
  toggleHackerMode: () => void;
  onBack: () => void;
}

type GenerationMode = 'CHAT' | 'IMAGE_EDIT' | 'ASTRA_DETECTION' | 'LOGO_ARCHITECT';

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ isHackerMode, toggleHackerMode, onBack }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeCode, setActiveCode] = useState<CodeSnippet | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Closed by default on mobile logic
  const [genMode, setGenMode] = useState<GenerationMode>('CHAT');
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  
  // Live API State
  const [isLive, setIsLive] = useState(false);
  const [liveStatus, setLiveStatus] = useState("OFFLINE");
  const liveClientRef = useRef<LiveClient | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ensure sidebar is open on desktop by default
  useEffect(() => {
      if (window.innerWidth >= 768) {
          setSidebarOpen(true);
      }
  }, []);

  useEffect(() => {
    initializeChat();
    setMessages([{
      id: 'init',
      role: Role.MODEL,
      text: isHackerMode ? "SYSTEM_BREACH_DETECTED. ROOT_ACCESS_GRANTED. \n\nAwaiting command..." : INITIAL_GREETING,
      timestamp: Date.now()
    }]);
    
    return () => {
        if (liveClientRef.current) {
            liveClientRef.current.disconnect();
        }
    };
  }, [isHackerMode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Code block parser
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === Role.MODEL && lastMsg.text) {
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = (ev) => {
              if (ev.target?.result) {
                  const base64Full = ev.target.result as string;
                  const base64 = base64Full.split(',')[1];
                  setAttachment({
                      file,
                      previewUrl: URL.createObjectURL(file),
                      base64,
                      mimeType: file.type
                  });
              }
          };
          reader.readAsDataURL(file);
      }
  };

  const toggleLiveMode = async () => {
      if (isLive) {
          liveClientRef.current?.disconnect();
          setIsLive(false);
      } else {
          liveClientRef.current = new LiveClient(setLiveStatus);
          await liveClientRef.current.connect();
          setIsLive(true);
      }
  };

  const handleSend = async () => {
    if ((!input.trim() && !attachment) || isLoading) return;
    
    // Validation for Astra Detection
    if (genMode === 'ASTRA_DETECTION' && !attachment) {
        setMessages(prev => [...prev, { 
            id: Date.now().toString(), 
            role: Role.MODEL, 
            text: "⚠️ ASTRA PROTOCOL WARNING: No Media Detected. Please upload an image or video for Deepfake Analysis.",
            timestamp: Date.now()
        }]);
        return;
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      text: input,
      image: attachment?.previewUrl,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    const currentAttachment = attachment;
    setAttachment(null); // Clear after sending
    setIsLoading(true);

    const modelMsgId = (Date.now() + 1).toString();
    
    try {
        if (genMode === 'IMAGE_EDIT') {
            setMessages(prev => [...prev, { id: modelMsgId, role: Role.MODEL, text: 'INITIALIZING NANO BANANA MATRIX... 🎨', timestamp: Date.now() }]);
            const imgBase64 = await generateEditedImage(userMsg.text, currentAttachment?.base64, currentAttachment?.mimeType);
            
            if (imgBase64) {
                setMessages(prev => prev.map(m => m.id === modelMsgId ? { 
                    ...m, 
                    text: "VISUAL SYNTHESIS COMPLETE.", 
                    image: imgBase64 
                } : m));
            } else {
                throw new Error("Image Gen Failed");
            }

        } else if (genMode === 'ASTRA_DETECTION') {
             setMessages(prev => [...prev, { id: modelMsgId, role: Role.MODEL, text: 'SCANNING MEDIA... RUNNING HEURISTIC ANALYSIS...', timestamp: Date.now() }]);
             if (currentAttachment) {
                await runAstraDetection(currentAttachment, (streamText) => {
                     setMessages(prev => prev.map(msg => 
                        msg.id === modelMsgId ? { ...msg, text: streamText } : msg
                    ));
                });
             }

        } else if (genMode === 'LOGO_ARCHITECT') {
             setMessages(prev => [...prev, { id: modelMsgId, role: Role.MODEL, text: 'CONSTRUCTING DIGITAL ARTIFACT... 🖌️', timestamp: Date.now() }]);
             await sendMessageToGemini(userMsg.text, currentAttachment, (streamText) => {
                setMessages(prev => prev.map(msg => 
                    msg.id === modelMsgId ? { ...msg, text: streamText } : msg
                ));
            });
        } else {
            // Default Chat
            setMessages(prev => [...prev, { id: modelMsgId, role: Role.MODEL, text: '', timestamp: Date.now() }]);
            await sendMessageToGemini(userMsg.text, currentAttachment, (streamText) => {
                setMessages(prev => prev.map(msg => 
                    msg.id === modelMsgId ? { ...msg, text: streamText } : msg
                ));
            });
        }
    } catch (error) {
        setMessages(prev => prev.map(msg => 
            msg.id === modelMsgId ? { ...msg, text: "SYSTEM ERROR: OPERATION FAILED." } : msg
        ));
    }

    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleModeSwitch = (mode: GenerationMode) => {
      setGenMode(mode);
      if (mode === 'LOGO_ARCHITECT') {
          setInput("Create a futuristic, Indian-inspired cyberpunk logo for ASTRA AI, neon saffron and blue colors, shield emblem...");
      } else {
          setInput("");
      }
      // Close sidebar on mobile after selection
      if (window.innerWidth < 768) {
          setSidebarOpen(false);
      }
  }

  return (
    <div className={`fixed inset-0 flex h-screen w-full overflow-hidden transition-colors duration-500 ${isHackerMode ? 'bg-black text-red-600 font-mono animate-red-alert' : 'bg-astra-black text-white font-rajdhani'}`}>
      
      {/* Hacker Background Layer */}
      {isHackerMode && (
        <>
            <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none opacity-20">
                <Logo isHackerMode={true} className="w-[80vw] h-[80vw] md:w-[500px] md:h-[500px] animate-pulse" />
            </div>
            <div className="crt-overlay absolute inset-0 z-50 pointer-events-none"></div>
            <div className="scanline z-50"></div>
        </>
      )}

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
          <div className="fixed inset-0 bg-black/80 z-30 md:hidden" onClick={() => setSidebarOpen(false)}></div>
      )}

      {/* Sidebar */}
      <div className={`fixed md:relative inset-y-0 left-0 z-40 h-full ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:w-0 md:translate-x-0'} ${sidebarOpen ? 'w-64' : 'w-0'} flex-shrink-0 border-r ${isHackerMode ? 'border-red-900 bg-black' : 'border-white/10 bg-black/90 md:bg-black/40'} transition-all duration-300 flex flex-col overflow-hidden`}>
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isHackerMode ? <AlertTriangle className="text-red-500 animate-pulse" /> : <Terminal />}
            <span className="font-orbitron font-bold text-lg tracking-widest whitespace-nowrap">{isHackerMode ? 'SYSTEM_BREACH' : 'SYSTEM'}</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {/* Mode Selector */}
            <div className="p-2 space-y-2">
                <button onClick={() => handleModeSwitch('CHAT')} className={`w-full flex items-center gap-2 p-2 rounded text-sm ${genMode === 'CHAT' ? (isHackerMode ? 'bg-red-900 text-black font-bold' : 'bg-astra-saffron text-black font-bold') : 'bg-white/5 text-gray-400'}`}>
                    <Terminal size={16} /> STANDARD CHAT
                </button>
                <button onClick={() => handleModeSwitch('IMAGE_EDIT')} className={`w-full flex items-center gap-2 p-2 rounded text-sm ${genMode === 'IMAGE_EDIT' ? (isHackerMode ? 'bg-red-900 text-black font-bold' : 'bg-astra-saffron text-black font-bold') : 'bg-white/5 text-gray-400'}`}>
                    <ImageIcon size={16} /> IMAGE MATRIX
                </button>
                {/* Veo Removed */}
                <button onClick={() => handleModeSwitch('ASTRA_DETECTION')} className={`w-full flex items-center gap-2 p-2 rounded text-sm ${genMode === 'ASTRA_DETECTION' ? (isHackerMode ? 'bg-red-900 text-black font-bold' : 'bg-astra-saffron text-black font-bold') : 'bg-white/5 text-gray-400'}`}>
                    <ScanEye size={16} /> ASTRA DETECTION
                </button>
                <button onClick={() => handleModeSwitch('LOGO_ARCHITECT')} className={`w-full flex items-center gap-2 p-2 rounded text-sm ${genMode === 'LOGO_ARCHITECT' ? (isHackerMode ? 'bg-red-900 text-black font-bold' : 'bg-astra-saffron text-black font-bold') : 'bg-white/5 text-gray-400'}`}>
                    <Wand2 size={16} /> LOGO ARCHITECT
                </button>
            </div>
        </div>
        <div className="p-4 border-t border-white/10">
           <button onClick={() => setMessages([])} className={`w-full py-2 text-xs font-bold border ${isHackerMode ? 'border-red-500 text-red-500 hover:bg-red-900' : 'border-red-500/50 text-red-400 hover:bg-red-900/20'} transition-colors`}>
             {isHackerMode ? 'WIPE_LOGS' : 'CLEAR MEMORY'}
           </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative z-10 w-full min-w-0">
        
        {/* Top Bar */}
        <header className={`h-16 border-b ${isHackerMode ? 'border-red-900 bg-black' : 'border-white/10 bg-black/40 backdrop-blur-md'} flex items-center justify-between px-4 md:px-6 transition-colors duration-300 flex-shrink-0`}>
           <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className={`${sidebarOpen ? 'md:hidden' : 'block'}`}>
                <Menu size={20} className={isHackerMode ? 'text-red-500' : 'text-white'}/>
              </button>
              <button onClick={onBack} className="flex items-center gap-2 opacity-70 hover:opacity-100 transition-opacity">
                 <ChevronLeft size={18} /> <span className="hidden sm:inline font-mono text-sm">EXIT</span>
              </button>
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${isHackerMode ? 'bg-red-900/20 border-red-500' : 'bg-black/50 border-white/10'}`}>
                 <Activity size={14} className={`${isHackerMode ? 'text-red-500' : 'text-astra-green'} animate-pulse`} />
                 <span className={`text-[10px] md:text-xs font-orbitron tracking-wider ${isHackerMode ? 'text-red-500' : 'text-astra-green'}`}>
                    {isHackerMode ? 'THREAT: CRIT' : 'RTMS: ON'}
                 </span>
              </div>
              {isLive && (
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-500 animate-pulse">
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      <span className="text-xs font-bold text-red-500 hidden sm:inline">{liveStatus}</span>
                  </div>
              )}
           </div>
           
           <div className="flex items-center gap-2 md:gap-4">
             <span className={`text-[10px] md:text-xs font-bold ${isHackerMode ? 'text-red-600 opacity-100 animate-pulse' : 'opacity-0'} transition-opacity duration-300 hidden sm:inline`}>
                {isHackerMode ? '⚠️ DANGER MODE' : 'HACKER_MODE'}
             </span>
             <button 
                onClick={toggleHackerMode} 
                className={`relative w-12 h-6 md:w-14 md:h-7 rounded-full transition-colors duration-300 border-2 ${isHackerMode ? 'bg-red-900 border-red-500' : 'bg-gray-700 border-gray-600'}`}
             >
                {isHackerMode && <Skull size={10} className="absolute left-1.5 top-1 md:top-1.5 text-red-500 z-10" />}
                <div className={`absolute top-0.5 left-1 bg-white w-4 h-4 md:w-5 md:h-5 rounded-full shadow-md transform transition-transform duration-300 ${isHackerMode ? 'translate-x-5 md:translate-x-6 bg-red-500' : 'translate-x-0'}`}></div>
             </button>
           </div>
        </header>

        {/* Split View Container */}
        <div className="flex-1 flex overflow-hidden relative">
            
            {/* Chat Area */}
            <div className={`flex-1 flex flex-col transition-all duration-500 min-w-0 ${activeCode ? 'hidden md:flex md:w-1/2' : 'w-full'}`}>
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                   {messages.map((msg) => (
                     <div key={msg.id} className={`flex ${msg.role === Role.USER ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] md:max-w-[75%] p-3 md:p-4 rounded-2xl backdrop-blur-sm border 
                          ${msg.role === Role.USER 
                             ? (isHackerMode ? 'bg-red-900/20 border-red-500/50 text-red-400' : 'bg-astra-saffron/20 border-astra-saffron/50 text-white rounded-tr-none') 
                             : (isHackerMode ? 'bg-black/80 border-red-800 text-red-600 rounded-none border-l-4' : 'bg-astra-blue/10 border-astra-blue/20 text-gray-100 rounded-tl-none')
                          } shadow-lg flex flex-col gap-2 md:gap-3 overflow-hidden`}
                        >
                           <div className="flex items-center gap-2 opacity-50 text-[10px] font-mono uppercase tracking-widest">
                              {isHackerMode && msg.role === Role.MODEL && <Lock size={10} />}
                              <span>{msg.role === Role.USER ? (isHackerMode ? 'INTRUDER' : 'OPERATOR') : 'ASTRA AI'}</span>
                              <span>{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                           </div>
                           
                           {/* Attachment Preview in History */}
                           {msg.image && !msg.text.includes('image/png') && (
                               <img src={msg.image} alt="Generated or User Content" className={`w-full max-w-sm rounded-lg border ${isHackerMode ? 'border-red-900 grayscale contrast-125' : 'border-white/10'}`} />
                           )}
                           {msg.video && (
                               <video controls src={msg.video} className="w-full max-w-sm rounded-lg border border-white/10" />
                           )}

                           <div className="text-sm md:text-base leading-relaxed whitespace-pre-wrap break-words">
                               <ReactMarkdown>{msg.text}</ReactMarkdown>
                           </div>
                           
                           {/* Mobile Code View Toggle */}
                           {msg.isCode && activeCode && (
                               <button onClick={() => {}} className="md:hidden text-xs underline text-blue-400 mt-2">
                                   View Code Snippet
                               </button>
                           )}
                        </div>
                     </div>
                   ))}
                   {isLoading && (
                     <div className="flex justify-start">
                        <div className={`px-4 py-2 rounded-full text-xs font-mono animate-pulse ${isHackerMode ? 'text-red-500 border border-red-900 bg-red-900/10' : 'text-astra-blue'}`}>
                           {isHackerMode ? 'DECRYPTING_PAYLOAD...' : 'PROCESSING_RTMS_REQUEST...'}
                        </div>
                     </div>
                   )}
                   <div ref={messagesEndRef} />
                </div>
                
                {/* Input Area */}
                <div className={`p-3 md:p-6 flex-shrink-0 ${isHackerMode ? 'bg-black border-t border-red-900' : 'bg-black/60 backdrop-blur-xl border-t border-white/10'}`}>
                   
                   {/* Attachment Preview Area */}
                   {attachment && (
                       <div className={`mb-2 flex items-center gap-2 p-2 rounded border w-fit ${isHackerMode ? 'border-red-900 bg-red-900/10 text-red-400' : 'bg-white/5 border-white/10'}`}>
                           <img src={attachment.previewUrl} className="h-10 w-10 object-cover rounded" />
                           <span className="text-xs truncate max-w-[100px]">{attachment.file.name}</span>
                           <button onClick={() => setAttachment(null)} className="p-1 hover:text-red-500"><X size={14}/></button>
                       </div>
                   )}

                   <div className={`flex items-center gap-2 p-2 rounded-xl border transition-all focus-within:border-opacity-100 ${isHackerMode ? 'bg-black border-red-600 border-opacity-50 shadow-[0_0_10px_rgba(255,0,0,0.2)]' : 'bg-white/5 border-astra-blue/30 border-opacity-50'}`}>
                      <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*,video/*" />
                      <button onClick={() => fileInputRef.current?.click()} className={`p-2 rounded-lg transition-colors ${isHackerMode ? 'hover:bg-red-900/30 text-red-600' : 'hover:bg-white/10 text-gray-400'}`}>
                        <Paperclip size={20} />
                      </button>
                      
                      <textarea 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={genMode === 'IMAGE_EDIT' ? "Describe edits..." : (genMode === 'ASTRA_DETECTION' ? "Attach media & type 'Scan'..." : (isHackerMode ? "INJECT_CODE_FRAGMENT..." : "Ask ASTRA anything..."))}
                        className={`flex-1 bg-transparent border-none outline-none text-sm resize-none max-h-32 py-2 px-2 font-mono ${isHackerMode ? 'text-red-500 placeholder-red-800' : 'text-white placeholder-gray-500'}`}
                        rows={1}
                      />
                      
                      <button 
                        onClick={toggleLiveMode}
                        className={`p-2 rounded-lg transition-colors ${isLive ? 'bg-red-500 text-white animate-pulse' : (isHackerMode ? 'hover:bg-red-900/30 text-red-600' : 'hover:bg-white/10 text-gray-400')}`}
                        title="Toggle Live Voice Mode"
                      >
                        {isLive ? <StopCircle size={20} /> : <Mic size={20} />}
                      </button>

                      <button 
                        onClick={handleSend}
                        disabled={isLoading || (!input.trim() && !attachment)}
                        className={`p-2 rounded-lg transition-colors ${(!input.trim() && !attachment) ? 'opacity-50 cursor-not-allowed' : (isHackerMode ? 'bg-red-600 hover:bg-red-500 text-black font-bold' : 'bg-astra-saffron hover:bg-white text-black')}`}
                      >
                        <Send size={20} />
                      </button>
                   </div>
                   <div className="mt-2 flex justify-center">
                        <span className={`text-[10px] font-mono tracking-widest ${isHackerMode ? 'text-red-800' : 'text-gray-500'}`}>
                            {isHackerMode ? "WARNING: SECURE CHANNEL UNSTABLE" : (
                                <>
                                    {genMode === 'CHAT' && "GEMINI 3 PRO // RTMS SECURE"}
                                    {genMode === 'IMAGE_EDIT' && "NANO BANANA MATRIX // EDIT MODE"}
                                    {genMode === 'ASTRA_DETECTION' && "ASTRA FORENSIC // DEEPFAKE SCAN"}
                                    {genMode === 'LOGO_ARCHITECT' && "GEN 3 PRO // DESIGN STUDIO"}
                                </>
                            )}
                        </span>
                   </div>
                </div>
            </div>

            {/* Gemini Canvas (Right Panel) - Desktop Only, or Full on Mobile if Active? 
                For now, keeping it desktop split view as requested by reference architecture. 
                On mobile, we could stack it, but simple is better for now.
            */}
            {activeCode && (
                <div className={`w-full md:w-1/2 border-l ${isHackerMode ? 'border-red-900 bg-black' : 'border-white/10 bg-black/60'} flex flex-col transition-all duration-300 absolute md:relative inset-0 z-20 md:z-auto md:flex`}>
                    <div className={`h-12 border-b flex items-center justify-between px-4 ${isHackerMode ? 'bg-red-900/10 border-red-900' : 'bg-black/40 border-white/10'}`}>
                        <div className="flex items-center gap-2">
                            <Code size={16} className={isHackerMode ? 'text-red-500' : 'text-astra-blue'}/>
                            <span className={`font-orbitron text-xs tracking-wider ${isHackerMode ? 'text-red-500' : 'text-white'}`}>GEMINI CANVAS</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className={`text-xs px-2 py-1 rounded ${isHackerMode ? 'bg-red-900/30 text-red-500 hover:bg-red-900/50' : 'bg-astra-blue/20 text-astra-blue hover:bg-astra-blue/40'}`}>RUN</button>
                            <button onClick={() => setActiveCode(null)} className={`hover:text-white ${isHackerMode ? 'text-red-800' : 'text-gray-400'}`}><X size={16}/></button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto p-4 font-mono text-sm">
                        <pre className={`p-4 rounded-lg ${isHackerMode ? 'bg-red-900/5 text-red-400 border border-red-900/30' : 'bg-[#1e1e1e] text-gray-300'}`}>
                            <code>{activeCode.code}</code>
                        </pre>
                    </div>
                </div>
            )}

        </div>
      </div>
    </div>
  );
};
