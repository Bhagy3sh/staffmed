const features = [
    {
        icon: (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
        ),
        title: 'Easy Appointment Booking',
        desc: 'Browse available physicians and book appointments in just a few clicks with real-time calendar availability.',
    },
    {
        icon: (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
        ),
        title: 'Community Support',
        desc: 'Connect with patient communities and advocacy groups to share experiences and find support.',
    },
    {
        icon: (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
        ),
        title: 'Secure & Private',
        desc: 'Your health data is protected with industry-standard security and face recognition identity verification.',
    },
    {
        icon: (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.9 13.6a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.81 3h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.9a16 16 0 0 0 5.19 5.19l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 21 17z" />
            </svg>
        ),
        title: 'Automated Reminders',
        desc: 'Receive email confirmations and appointment reminders so you never miss a scheduled visit.',
    },
];

const team = [
    { name: 'Dr. Maria Santos', role: 'Medical Director' },
    { name: 'Juan dela Cruz', role: 'Lead Developer' },
    { name: 'Clarissa Roberto', role: 'Patient Relations' },
    { name: 'Lhoren Mainque', role: 'Systems Architect' },
];

export default function AboutPage() {
    return (
        <div className="px-8 py-6 space-y-6">
            {/* Hero card */}
            <div className="rounded-2xl overflow-hidden shadow-md border border-gray-200 dark:border-gray-700">
                <div className="px-8 py-6 flex items-center gap-4" style={{ backgroundColor: '#1a2744' }}>
                    <div>
                        <p className="text-blue-300 text-xs font-bold tracking-widest uppercase">Who we are</p>
                        <h1 className="text-white text-2xl font-black tracking-wide">ABOUT STAFFMED</h1>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 px-8 py-6 flex flex-col gap-3 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                    <p>
                        <span className="font-bold text-gray-900 dark:text-gray-100">StaffMed</span> is a hospital appointment management platform designed to bridge the gap between patients and healthcare providers at Pelican Hospital. Our mission is to make quality healthcare accessible, organized, and stress-free for every patient.
                    </p>
                    <p>
                        Founded with the belief that scheduling a doctor's visit should never be a barrier to good health, StaffMed provides a seamless digital experience — from browsing physicians and booking time slots to receiving automated confirmations and managing upcoming visits.
                    </p>
                </div>
            </div>

            {/* Features */}
            <div className="rounded-2xl overflow-hidden shadow-md border border-gray-200 dark:border-gray-700">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                    <h2 className="text-base font-black text-gray-800 dark:text-gray-100 tracking-wide uppercase">What We Offer</h2>
                </div>
                <div className="bg-white dark:bg-gray-800 grid grid-cols-2 divide-x divide-y divide-gray-100 dark:divide-gray-700">
                    {features.map((f, i) => (
                        <div key={i} className="flex gap-4 px-6 py-5">
                            <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: '#1a2744' }}>
                                {f.icon}
                            </div>
                            <div>
                                <p className="font-bold text-gray-900 dark:text-gray-100 text-sm mb-1">{f.title}</p>
                                <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">{f.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Team */}
            <div className="rounded-2xl overflow-hidden shadow-md border border-gray-200 dark:border-gray-700">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                    <h2 className="text-base font-black text-gray-800 dark:text-gray-100 tracking-wide uppercase">Our Team</h2>
                </div>
                <div className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                    {team.map((m, i) => (
                        <div key={i} className="flex justify-between items-center px-6 py-4">
                            <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{m.name}</span>
                            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">{m.role}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
