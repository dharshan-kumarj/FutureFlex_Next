"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import TypingEffect from "../global/components/TypingEffect";

function DomainSelectionContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const domain = searchParams.get('domain');
    const [showSkillLevel, setShowSkillLevel] = useState(false);
    const [selectedDomain, setSelectedDomain] = useState<string | null>(domain);

    const domainData = {
        ai: {
            name: "Artificial Intelligence",
            icon: "🤖",
            color: "from-purple-600 to-blue-600",
            description: "Master AI concepts and build intelligent systems"
        },
        cloud: {
            name: "Cloud Computing",
            icon: "☁️",
            color: "from-blue-600 to-cyan-600",
            description: "Learn cloud architecture and modern deployment strategies"
        }
    };

    const handleDomainSelect = (domainKey: string) => {
        setSelectedDomain(domainKey);
        setShowSkillLevel(true);
    };

    const handleSkillLevelSelect = (level: string) => {
        router.push(`/assessment?domain=${selectedDomain}&level=${level}`);
    };

    // If domain is provided in URL, go directly to skill level selection
    useEffect(() => {
        if (domain && domainData[domain as keyof typeof domainData]) {
            setSelectedDomain(domain);
            setShowSkillLevel(true);
        }
    }, [domain]);

    const currentDomain = selectedDomain && domainData[selectedDomain as keyof typeof domainData] 
        ? domainData[selectedDomain as keyof typeof domainData] 
        : null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
            {!showSkillLevel && (
                <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-gray-800 mb-2">
                            Choose Your Learning Domain
                        </h1>
                        <p className="text-xl text-gray-600">
                            Select the domain you want to focus on and bridge the gap between theory and practical knowledge
                        </p>
                    </div>

                    <div className="flex gap-8 justify-center">
                        <button
                            className="px-12 py-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold text-xl shadow-lg hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105"
                            onClick={() => handleDomainSelect('ai')}
                        >
                            🤖 Artificial Intelligence
                        </button>
                        <button
                            className="px-12 py-6 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold text-xl shadow-lg hover:from-blue-700 hover:to-cyan-700 transition-all transform hover:scale-105"
                            onClick={() => handleDomainSelect('cloud')}
                        >
                            ☁️ Cloud Computing
                        </button>
                    </div>
                    <div className="mt-6 text-sm text-gray-500 font-serif text-center">
                        — Choose your path to professional excellence —
                    </div>
                </div>
            )}
            
            {showSkillLevel && currentDomain && (
                <div className="max-w-4xl w-full">
                    {!domain && (
                        <div className="mb-8">
                            <TypingEffect
                                entries={[
                                    { 
                                        text: `Great choice! You've selected ${currentDomain.name} ${currentDomain.icon}`, 
                                        size: "2.4rem", 
                                        speed: 75 
                                    },
                                    { 
                                        text: `\n${currentDomain.description}`, 
                                        size: "1.3rem", 
                                        speed: 55 
                                    },
                                    { 
                                        text: "\nNow, let's assess your current skill level to provide you with the most relevant industry-level challenges.", 
                                        size: "1.2rem", 
                                        speed: 50 
                                    },
                                    { 
                                        text: "\nThis will help us bridge the gap between theoretical knowledge and practical application.", 
                                        size: "1.2rem", 
                                        speed: 50 
                                    },
                                ]}
                                onComplete={() => {}}
                            />
                        </div>
                    )}
                    
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <div className="text-center mb-8">
                            <div className="text-6xl mb-4">{currentDomain.icon}</div>
                            <h1 className="text-4xl font-bold text-gray-800 mb-2">
                                {currentDomain.name}
                            </h1>
                            <p className="text-xl text-gray-600">
                                Select your current skill level
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
                            <div 
                                className="group cursor-pointer transform transition-all duration-300 hover:scale-105"
                                onClick={() => handleSkillLevelSelect('beginner')}
                            >
                                <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-xl p-8 text-white shadow-lg group-hover:shadow-xl">
                                    <div className="text-4xl mb-4 text-center">🌱</div>
                                    <h3 className="text-2xl font-bold mb-3 text-center">Beginner</h3>
                                    <ul className="space-y-2 text-green-100">
                                        <li>• New to {currentDomain.name.toLowerCase()}</li>
                                        <li>• Basic theoretical knowledge</li>
                                        <li>• Ready to learn fundamentals</li>
                                        <li>• Eager to build first projects</li>
                                    </ul>
                                </div>
                            </div>

                            <div 
                                className="group cursor-pointer transform transition-all duration-300 hover:scale-105"
                                onClick={() => handleSkillLevelSelect('intermediate')}
                            >
                                <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl p-8 text-white shadow-lg group-hover:shadow-xl">
                                    <div className="text-4xl mb-4 text-center">🚀</div>
                                    <h3 className="text-2xl font-bold mb-3 text-center">Intermediate</h3>
                                    <ul className="space-y-2 text-orange-100">
                                        <li>• Some practical experience</li>
                                        <li>• Understand core concepts</li>
                                        <li>• Ready for industry challenges</li>
                                        <li>• Want to level up skills</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="text-center mt-8">
                            <button
                                onClick={() => {
                                    setShowSkillLevel(false);
                                    setSelectedDomain(null);
                                }}
                                className="text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                ← Back to domain selection
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function DomainSelectionPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center"><div className="text-xl">Loading...</div></div>}>
            <DomainSelectionContent />
        </Suspense>
    );
}
