import { useState } from 'react';

const communities = [
    { name: 'ICanServe Foundation', members: '10K' },
    { name: 'Psoriasis Philippines (PsorPhil)', members: '3K' },
    { name: 'MentalHealthPH', members: '8.5K' },
    { name: 'KASUSO (Philippine Foundation for Breast Care)', members: '1K' },
    { name: 'Philippine Alliance of Persons with Chronic Illness (PAPCI)', members: '6K' },
    { name: 'Talang Dalisay', members: '769' },
];

export default function CommunityPage() {
    const [search, setSearch] = useState('');

    const filtered = communities.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="px-8 py-6">
            <div className="border border-black dark:border-gray-700 bg-white dark:bg-gray-800 max-w-4xl mx-auto">
                {/* Search row */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-black dark:border-gray-600">
                    <svg className="w-6 h-6 flex-shrink-0 text-gray-800 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder='Search for keywords: "diabetes"'
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="flex-1 outline-none text-base text-gray-500 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 bg-transparent"
                    />
                </div>

                {/* Community rows */}
                {filtered.map((c, i) => (
                    <div
                        key={i}
                        className="flex justify-between items-center px-4 py-4 border-b border-black dark:border-gray-600 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer dark:text-gray-100"
                    >
                        <span className="font-bold text-base">{c.name}</span>
                        <span className="font-bold text-base">{c.members} members</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
