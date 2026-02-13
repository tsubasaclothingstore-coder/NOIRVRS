import React from 'react';
import { useNavigate } from 'react-router-dom';

const Help: React.FC = () => {
  const navigate = useNavigate();

  const faqs = [
    { q: "System Protocol", a: "NOIRVRS is a generative narrative engine. Each 'Thread' you spend synthesizes a unique, 5-page interactive noir comic in real-time. No two stories are ever the same." },
    { q: "Thread Allocation", a: "Threads are decryption credits. One Thread = One Story. \n• Free: 10 Threads / month\n• Pro: 40 Threads / month\n• Premium: 60 Threads / month" },
    { q: "Case Archives", a: "Completed cases are logged in your profile stats. The narrative is ephemeral; once a case is closed, the city moves on. Focus on the investigation at hand." },
    { q: "Visual Synthesis", a: "Imagery is generated live using neural interpretation of the text. Visual fidelity depends on signal strength." }
  ];

  return (
    <div className="px-8 max-w-md mx-auto space-y-12 animate-in fade-in duration-500">
      <section>
        <p className="text-[10px] uppercase tracking-[0.3em] text-[#76F3FF] mb-2">Protocol Manual</p>
        <h2 className="text-3xl font-light tracking-tight">System Info</h2>
      </section>

      <section className="space-y-10">
        {faqs.map((f, i) => (
          <div key={i} className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-[#76F3FF]">{f.q}</h4>
            <p className="text-sm text-white/60 leading-relaxed font-light whitespace-pre-line">{f.a}</p>
          </div>
        ))}
      </section>

      <section className="pt-8 space-y-4 border-t border-white/5">
        <p className="text-[10px] uppercase tracking-widest opacity-40">Contact Command</p>
        <p className="text-sm mono">signal@noirvrs.com</p>
        <div className="flex gap-6 pt-4">
          <button 
            onClick={() => navigate('/legal', { state: { section: 'terms' } })}
            className="text-[10px] uppercase tracking-widest opacity-40 hover:opacity-100 hover:text-[#76F3FF] cursor-pointer transition-all"
          >
            Terms
          </button>
          <button 
            onClick={() => navigate('/legal', { state: { section: 'privacy' } })}
            className="text-[10px] uppercase tracking-widest opacity-40 hover:opacity-100 hover:text-[#76F3FF] cursor-pointer transition-all"
          >
            Privacy
          </button>
          <span className="text-[10px] uppercase tracking-widest opacity-40 hover:opacity-100 cursor-pointer transition-opacity">Network</span>
        </div>
      </section>
      
      <div className="text-center pt-8">
         <p className="text-[8px] uppercase tracking-[0.5em] opacity-20">NOIRVRS_SYSTEM_V1.0</p>
      </div>
    </div>
  );
};

export default Help;