import { useState, useRef, useEffect } from 'react';

const KB = [
  { patterns: ['appointment', 'book', 'schedule', 'reserve'], response: 'To book an appointment: go to the Book tab, select a physician, choose an available (green) date, pick a time slot, and describe your chief complaint. You\'ll receive a confirmation immediately.' },
  { patterns: ['cancel', 'reschedule'], response: 'To cancel an appointment, go to the Manage tab, find your upcoming appointment, and click Cancel. Cancellations must be made at least 24 hours in advance.' },
  { patterns: ['color', 'calendar', 'green', 'red', 'yellow', 'available'], response: '🟢 Green = Available for booking\n🟡 Yellow = Limited slots remaining\n🔴 Red = Fully booked\n⬛ Gray = Unavailable / clinic closed' },
  { patterns: ['confirmation', 'email', 'receipt'], response: 'After booking, you\'ll see a confirmation screen immediately and receive an automated email confirmation. You can also view your appointments anytime in the Manage tab.' },
  { patterns: ['face', 'recognition', 'verify', 'identity', 'scan'], response: 'Face Recognition is used to verify your identity securely. Go to your Profile page and click "Start Face Recognition" to scan your face. This ensures only you can access your health records.' },
  { patterns: ['doctor', 'physician', 'specialist', 'specialty'], response: 'We have specialists in: Internal Medicine, Psychiatry, Pediatrics, Dentistry, Surgery, and OB-Gyne. Browse the full list on the Book tab with search functionality.' },
  { patterns: ['community', 'group', 'support'], response: 'You can join patient communities on the Community tab. Browse support groups organized around specific conditions and connect with other patients.' },
  { patterns: ['profile', 'demographics', 'information', 'data'], response: 'Your profile and patient demographics are on the Profile tab. You can update your address, contact number, PhilHealth number, and emergency contact. Your data is encrypted and secure.' },
  { patterns: ['late', 'arrival', 'missed', 'no show'], response: 'Please arrive at least 15 minutes before your appointment. If you\'re running late, contact the hospital directly. Missed appointments may require rescheduling.' },
  { patterns: ['fee', 'payment', 'cost', 'price', 'charge'], response: 'Appointment booking through StaffMed is free. Hospital consultation fees are separate and depend on the physician\'s rate. Please contact Pelican Hospital directly for fee inquiries.' },
  { patterns: ['secure', 'privacy', 'data', 'safe', 'protect'], response: 'Your health data is protected with industry-standard encryption, JWT authentication, and face recognition identity verification. We never share your data with third parties.' },
  { patterns: ['philhealth', 'insurance', 'hmo'], response: 'Please update your PhilHealth number in your Profile under Patient Demographics. Bring your PhilHealth card to your appointment for coverage purposes.' },
  { patterns: ['emergency', 'urgent', 'immediately', 'asap'], response: 'For medical emergencies, please call 911 or go directly to the nearest emergency room. StaffMed is for scheduling non-emergency consultations. Pelican Hospital ER: (02) 8888-8888' },
  { patterns: ['contact', 'reach', 'call', 'phone', 'hospital'], response: 'Pelican Hospital can be reached at:\n📞 (02) 8888-8888\n📧 info@pelicanhosp.ph\n📍 Pelican Town, Metro Manila' },
  { patterns: ['follow', 'followup', 'follow up'], response: 'Follow-up appointments are created by your physician after your initial consultation. Check your Manage tab — follow-up appointments are marked with a yellow "FOLLOW-UP" badge.' },
  { patterns: ['faq', 'question', 'help', 'how', 'what'], response: 'You can browse the FAQ accordion above for answers to common questions, or keep chatting with me! I\'m here to help with anything StaffMed related.' },
];

const FALLBACK = "I'm not sure about that one. Try asking about booking appointments, cancellations, doctor specialties, face recognition, PhilHealth, or contacting Pelican Hospital. You can also browse the FAQ above!";
const GREETING = "Hi! I'm StaffMed's virtual assistant. How can I help you today? You can ask me about appointments, doctors, face recognition, privacy, and more.";

function getBotResponse(input) {
  const lower = input.toLowerCase();
  for (const entry of KB) {
    if (entry.patterns.some((p) => lower.includes(p))) return entry.response;
  }
  return FALLBACK;
}

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ from: 'bot', text: GREETING }]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [...m, { from: 'user', text }]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages((m) => [...m, { from: 'bot', text: getBotResponse(text) }]);
    }, 700);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat window */}
      {open && (
        <div className="mb-4 w-80 rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col"
          style={{ maxHeight: '420px' }}>
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0" style={{ backgroundColor: '#1a2744' }}>
            <div className="w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center text-white text-xs font-bold">SM</div>
            <div className="flex-1">
              <p className="text-white font-bold text-sm">StaffMed Assistant</p>
              <p className="text-blue-300 text-xs">Always online</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white text-xl leading-none">×</button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-800 px-4 py-3 space-y-3" style={{ maxHeight: '290px' }}>
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-xs leading-relaxed whitespace-pre-line
                  ${m.from === 'user'
                    ? 'text-white rounded-br-sm'
                    : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-600 rounded-bl-sm'}`}
                  style={m.from === 'user' ? { backgroundColor: '#1a2744' } : {}}>
                  {m.text}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-2xl rounded-bl-sm px-3 py-2">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2 px-3 py-3 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex-shrink-0">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKey}
              placeholder="Ask me anything…"
              className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-xs outline-none focus:border-blue-400 dark:bg-gray-700 dark:text-gray-100" />
            <button onClick={send} disabled={!input.trim()}
              className="px-3 py-2 rounded-xl text-white text-xs font-bold disabled:opacity-40"
              style={{ backgroundColor: '#1a2744' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button onClick={() => setOpen((v) => !v)}
        className="w-14 h-14 rounded-full text-white shadow-xl flex items-center justify-center transition-transform hover:scale-105"
        style={{ backgroundColor: '#1a2744' }}>
        {open ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>
    </div>
  );
}
