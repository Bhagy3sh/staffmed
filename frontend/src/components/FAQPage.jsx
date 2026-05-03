import { useState } from 'react';
import ChatBot from './common/ChatBot';

const faqs = [
    {
        q: 'How do I book an appointment?',
        a: 'Navigate to the Book page, select a physician from the list, then click on a green (available) date on the calendar. You will be taken to a confirmation screen with your appointment details.',
    },
    {
        q: 'What do the calendar colors mean?',
        a: 'Green dates are fully available for booking. Yellow dates have limited slots remaining. Red dates are fully booked and cannot be selected. Gray dates are unavailable or closed.',
    },
    {
        q: 'Can I cancel or reschedule my appointment?',
        a: 'Yes. Go to the Manage page, locate your upcoming appointment, and use the Cancel or Reschedule options. Cancellations must be made at least 24 hours before the appointment.',
    },
    {
        q: 'Will I receive a confirmation after booking?',
        a: 'Absolutely. An email confirmation is sent automatically to your registered email address as soon as your appointment is booked. You can also view confirmation details directly in the app.',
    },
    {
        q: 'What is the Face Recognition feature?',
        a: 'Face Recognition is used on the Profile page to verify your identity securely. It ensures that only the registered patient can access and modify their personal health information.',
    },
    {
        q: 'How do I join a patient community?',
        a: 'Go to the Join a Community page and browse the list of patient groups. Click on any community to view details and join. You can search by keyword to find groups related to your condition.',
    },
    {
        q: 'What if I arrive late for my appointment?',
        a: 'We recommend arriving at least 15 minutes before your scheduled time. If you are running late, please contact the hospital directly. Excessively late arrivals may need to be rescheduled.',
    },
    {
        q: 'Is my personal health data secure?',
        a: 'Yes. StaffMed uses industry-standard encryption and access controls to protect your data. Face recognition adds an extra layer of identity security. We do not share your data with third parties.',
    },
];

export default function FAQPage() {
    const [open, setOpen] = useState(null);

    return (
        <>
            <div className="px-8 py-6 space-y-4">
            {/* Header card */}
            <div className="rounded-2xl overflow-hidden shadow-md border border-gray-200 dark:border-gray-700">
                <div className="px-8 py-6 flex items-center gap-4" style={{ backgroundColor: '#1a2744' }}>
                    <div>
                        <p className="text-blue-300 text-xs font-bold tracking-widest uppercase">Help Center</p>
                        <h1 className="text-white text-2xl font-black tracking-wide">FREQUENTLY ASKED QUESTIONS</h1>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 px-8 py-4 text-gray-500 dark:text-gray-400 text-sm">
                    Find answers to the most common questions about using StaffMed below.
                </div>
            </div>

            {/* Accordion */}
            <div className="rounded-2xl overflow-hidden shadow-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                {faqs.map((item, i) => (
                    <div key={i}>
                        <button
                            className="w-full flex justify-between items-center px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            onClick={() => setOpen(open === i ? null : i)}
                        >
                            <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm pr-4">{item.q}</span>
                            <svg
                                className={`w-5 h-5 flex-shrink-0 text-gray-400 dark:text-gray-500 transition-transform ${open === i ? 'rotate-180' : ''}`}
                                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                            >
                                <path d="M6 9l6 6 6-6" />
                            </svg>
                        </button>
                        {open === i && (
                            <div className="px-6 pb-5 text-gray-600 dark:text-gray-300 text-sm leading-relaxed border-t border-gray-100 dark:border-gray-700 pt-3 bg-gray-50 dark:bg-gray-700">
                                {item.a}
                            </div>
                        )}
                    </div>
                ))}
            </div>
            </div>
            <ChatBot />
        </>
    );
}
