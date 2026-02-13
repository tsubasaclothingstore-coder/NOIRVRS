
import React from 'react';

const Help: React.FC = () => {
  const faqs = [
    { q: "What is NOIRVRS?", a: "A daily noir comic experience. One story, five pages, 750 words, every night at 21:00." },
    { q: "Can I read past stories?", a: "NOIRVRS is ephemeral. Each story exists for 24 hours only. Read it or miss it." },
    { q: "How does the trial work?", a: "Seven days of full access. After that, you can only see Page 1 of any story without a subscription." }
  ];

  return (
    <div className="px-8 max-w-md mx-auto space-y-12">
      <section>
        <p className="text-[10px] uppercase tracking-[0.3em] text-[#76F3FF] mb-2">Protocol</p>
        <h2 className="text-3xl font-light tracking-tight">Manual & Info</h2>
      </section>

      <section className="space-y-8">
        {faqs.map((f, i) => (
          <div key={i} className="space-y-2">
            <h4 className="text-sm font-bold uppercase tracking-widest text-white/90">{f.q}</h4>
            <p className="text-sm text-white/40 leading-relaxed font-light">{f.a}</p>
          </div>
        ))}
      </section>

      <section className="pt-8 space-y-4 border-t border-white/5">
        <p className="text-[10px] uppercase tracking-widest opacity-40">Contact Command</p>
        <p className="text-sm">support@noirvrs.com</p>
        <div className="flex gap-6 pt-4">
          <span className="text-[10px] uppercase tracking-widest opacity-40 hover:opacity-100 cursor-pointer">Terms</span>
          <span className="text-[10px] uppercase tracking-widest opacity-40 hover:opacity-100 cursor-pointer">Privacy</span>
          <span className="text-[10px] uppercase tracking-widest opacity-40 hover:opacity-100 cursor-pointer">Twitter</span>
        </div>
      </section>
    </div>
  );
};

export default Help;
