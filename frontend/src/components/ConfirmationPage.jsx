import { useLocation, Navigate } from 'react-router-dom';

export default function ConfirmationPage() {
    const { state } = useLocation();
    const booking = state?.booking;
    if (!booking) return <Navigate to="/book" replace />;
    const { physician, day, month, year, time } = booking;

    return (
        <div className="flex flex-row gap-8 px-8 py-6 h-full">
            {/* Left - Confirmation Ticket */}
            <div className="w-2/5 flex flex-col justify-center">
                <div className="rounded-2xl overflow-hidden shadow-lg border border-green-300 dark:border-green-800">
                    {/* Ticket header */}
                    <div className="flex items-center gap-3 px-6 py-5" style={{ backgroundColor: '#1a2744' }}>
                        <svg className="w-7 h-7 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M7 13l3 3 7-7" />
                        </svg>
                        <div>
                            <p className="text-green-400 text-xs font-bold tracking-widest uppercase">Appointment</p>
                            <h2 className="text-white text-lg font-black tracking-wide leading-tight">CONFIRMED</h2>
                        </div>
                    </div>

                    {/* Green body */}
                    <div className="bg-green-50 dark:bg-green-950 px-6 py-5 space-y-4">
                        <p className="text-green-900 dark:text-green-300 text-sm font-semibold">
                            Good day, Ms. Roberto! Your appointment has been successfully booked.
                        </p>

                        {/* Appointment details grid */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-green-200 dark:border-green-800 divide-y divide-green-100 dark:divide-green-900">
                            <div className="flex justify-between items-center px-4 py-3">
                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Physician</span>
                                <span className="text-sm font-bold text-gray-800 dark:text-gray-100 text-right">{physician.name}</span>
                            </div>
                            <div className="flex justify-between items-center px-4 py-3">
                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</span>
                                <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{month} {day}, {year}</span>
                            </div>
                            <div className="flex justify-between items-center px-4 py-3">
                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time</span>
                                <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{time}</span>
                            </div>
                        </div>

                        <p className="text-green-800 dark:text-green-400 text-xs leading-relaxed">
                            Please arrive <span className="font-bold">15 minutes early</span> and reply with your full name to confirm. A confirmation email has been sent to you.
                        </p>
                    </div>
                </div>
            </div>

            {/* Right - Email panel */}
            <div className="w-3/5 flex flex-col justify-center">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {/* Email toolbar */}
                    <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                        <div className="w-3 h-3 rounded-full bg-red-400" />
                        <div className="w-3 h-3 rounded-full bg-yellow-400" />
                        <div className="w-3 h-3 rounded-full bg-green-400" />
                        <span className="ml-3 text-xs text-gray-400 dark:text-gray-500 font-medium tracking-wide">Inbox — StaffMed</span>
                    </div>
                    {/* Email header */}
                    <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                        <div>
                            <p className="text-base font-semibold text-gray-900 dark:text-gray-100">StaffMed – Pelican Hospital</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">staffmed@pelicanhosp.ph</p>
                        </div>
                        <span className="text-sm text-gray-400 dark:text-gray-500">Jan {day}</span>
                    </div>
                    <div className="px-6 py-2 border-b border-gray-100 dark:border-gray-700 text-gray-400 dark:text-gray-500 text-xs">
                        to me &nbsp; &#8964;
                    </div>
                    {/* Email body */}
                    <div className="px-6 py-6 space-y-4 text-gray-700 dark:text-gray-300 text-sm">
                        <p>Hi <span className="font-semibold text-gray-900 dark:text-gray-100">Clarissa Roberto</span>,</p>
                        <p>
                            Your appointment with <span className="font-semibold text-gray-900 dark:text-gray-100">{physician.name}</span> for{' '}
                            <span className="font-semibold text-gray-900 dark:text-gray-100">{month} {day}, {year}</span> at{' '}
                            <span className="font-semibold text-gray-900 dark:text-gray-100">{time}</span> has been booked.
                            Please arrive at the hospital 15 minutes before your scheduled time to avoid delays and
                            allow sufficient time for registration and any necessary pre-consultation procedures.
                        </p>
                        <p>
                            Should you have any questions or require assistance, feel free to contact us.
                        </p>
                        <p>Thank you, and we look forward to serving you.</p>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">StaffMed – Pelican Hospital</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-700 pt-4">
                            This is an automated email confirmation. Please do not reply directly to this message.
                            If you have any questions or require assistance, feel free to contact us through the
                            details provided below.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
