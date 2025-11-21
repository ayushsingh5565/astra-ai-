import React from 'react';
import { Shield, Terminal, Cpu, Zap, Lock, Globe, ChevronRight } from 'lucide-react';
import { Typewriter } from './Typewriter';

interface LandingPageProps {
  onStart: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen w-full relative flex flex-col">
      {/* Background Elements */}
      <div className="fixed inset-0 bg-astra-black z-0">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-astra-saffron/20 via-transparent to-transparent animate-pulse"></div>
        {/* Mandala Circuit Overlay (CSS representation) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-astra-saffron/10 rounded-full animate-spin-slow opacity-30 pointer-events-none">
            <div className="absolute inset-[10%] border border-astra-blue/10 rounded-full border-dashed"></div>
            <div className="absolute inset-[20%] border border-astra-green/10 rounded-full"></div>
        </div>
      </div>

      {/* Header */}
      <header className="relative z-10 p-6 flex justify-between items-center glass-panel border-b border-astra-saffron/20 mx-4 mt-4 rounded-xl">
        <div className="flex items-center gap-2">
            <Shield className="text-astra-saffron w-8 h-8" />
            <span className="text-2xl font-orbitron font-bold tracking-wider text-white">ASTRA <span className="text-astra-saffron">AI</span></span>
        </div>
        <div className="flex items-center gap-4">
            <span className="text-astra-blue font-mono text-sm hidden md:inline-block">RTMS: <span className="text-astra-green">ONLINE</span></span>
        </div>
      </header>

      {/* Main Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 mt-10">
        <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-astra-blue/30 bg-astra-blue/10">
            <span className="w-2 h-2 rounded-full bg-astra-green animate-pulse"></span>
            <span className="text-astra-blue text-xs font-mono tracking-widest">SYSTEM SECURE</span>
        </div>
        
        <h1 className="text-5xl md:text-8xl font-orbitron font-black text-white mb-6 tracking-tight drop-shadow-[0_0_15px_rgba(255,153,51,0.5)]">
            THE ULTIMATE <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-astra-saffron to-red-500">CYBER-SENTINEL</span>
        </h1>
        
        <div className="text-xl md:text-2xl text-gray-300 font-rajdhani max-w-2xl mb-12">
            <Typewriter text="India's Cyber-Guardian. Powered by RTMS Protocol. Unapologetically Savage." speed={30} />
        </div>

        <div className="flex flex-col md:flex-row gap-6 w-full max-w-md justify-center">
            <button 
                onClick={onStart}
                className="group relative px-8 py-4 bg-astra-saffron text-black font-orbitron font-bold text-lg clipped-corner hover:bg-white transition-all duration-300 flex items-center justify-center gap-2"
                style={{ clipPath: 'polygon(10% 0, 100% 0, 100% 80%, 90% 100%, 0 100%, 0 20%)' }}
            >
                INITIALIZE RTMS
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button 
                className="px-8 py-4 border border-astra-blue text-astra-blue font-orbitron font-bold text-lg hover:bg-astra-blue/10 transition-all duration-300"
                style={{ clipPath: 'polygon(10% 0, 100% 0, 100% 80%, 90% 100%, 0 100%, 0 20%)' }}
            >
                SYSTEM INTEL
            </button>
        </div>
      </main>

      {/* Feature Grid */}
      <section className="relative z-10 max-w-7xl mx-auto w-full px-4 py-16 grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
            { icon: Terminal, title: "Hacker Mode", desc: "Terminal Interface", color: "text-astra-green" },
            { icon: Cpu, title: "Gemini Canvas", desc: "Real-time Coding", color: "text-astra-blue" },
            { icon: Globe, title: "Vision Gen", desc: "Visual Synthesis", color: "text-purple-400" },
            { icon: Zap, title: "Voice Command", desc: "Audio Interaction", color: "text-astra-saffron" },
        ].map((feature, idx) => (
            <div key={idx} className="glass-panel p-6 rounded-lg hover:border-astra-saffron/50 transition-colors group cursor-pointer">
                <feature.icon className={`w-8 h-8 ${feature.color} mb-3 group-hover:scale-110 transition-transform`} />
                <h3 className="text-white font-orbitron text-lg">{feature.title}</h3>
                <p className="text-gray-400 font-rajdhani">{feature.desc}</p>
            </div>
        ))}
      </section>

      {/* Developer Spotlight */}
      <section className="relative z-10 border-t border-gray-800 bg-black/80 backdrop-blur-lg py-12">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center gap-8">
            <div className="w-24 h-24 rounded-full border-2 border-astra-saffron p-1">
                <img src="https://picsum.photos/200" alt="Ayush Singh" className="w-full h-full rounded-full object-cover grayscale hover:grayscale-0 transition-all" />
            </div>
            <div className="text-center md:text-left">
                <h2 className="text-2xl font-orbitron text-white mb-1">THE ARCHITECT: <span className="text-astra-saffron">AYUSH SINGH</span></h2>
                <p className="text-gray-400 font-mono text-sm mb-2">Visionary Developer & Creator of RTMS Security</p>
                <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-astra-blue font-mono">
                    <span>thakurayushsingh5565@gmail.com</span>
                    <span>•</span>
                    <span>INDIA 🇮🇳</span>
                </div>
            </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="relative z-10 py-4 text-center border-t border-gray-900 bg-black text-gray-500 font-rajdhani text-sm">
         Created with 🔥 by Ayush Singh | Powered by RTMS Security Layer | India's Pride 🇮🇳
      </footer>
    </div>
  );
};