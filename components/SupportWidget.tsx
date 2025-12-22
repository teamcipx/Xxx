
import React, { useState } from 'react';
import { getSupportResponse } from '../services/gemini';

export const SupportWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!query.trim()) return;
    const userMsg = query;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setQuery('');
    setLoading(true);

    try {
      const botResponse = await getSupportResponse(userMsg);
      setMessages(prev => [...prev, { role: 'bot', text: botResponse }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', text: "Error connecting to support. Try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg transition-all transform hover:scale-110"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      )}

      {isOpen && (
        <div className="glass-effect w-80 h-96 flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-indigo-500/30">
          <div className="bg-indigo-600 p-4 flex justify-between items-center">
            <h3 className="text-white font-bold">Akti Support</h3>
            <button onClick={() => setIsOpen(false)} className="text-white hover:text-indigo-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <p className="text-slate-400 text-center text-sm">Hello! How can I help you today?</p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-xl p-3 text-sm ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-100'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && <div className="text-slate-500 text-xs italic">Akti is thinking...</div>}
          </div>
          <div className="p-3 border-t border-slate-700 bg-slate-800/50 flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type a message..."
              className="flex-1 bg-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button onClick={handleSend} className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-500">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
