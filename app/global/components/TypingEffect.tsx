"use client";

import { useState, useEffect, useRef } from "react";

interface TypingEntry {
    text: string;
    size?: string | number;
    speed?: number;
}

interface TypingEffectProps {
    entries: TypingEntry[];
    onComplete?: () => void;
}

const TypingEffect: React.FC<TypingEffectProps> = ({ entries, onComplete }) => {
    const [current, setCurrent] = useState(0);
    const [displayed, setDisplayed] = useState("");
    const [typing, setTyping] = useState(true);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const typingRef = useRef(true);

    useEffect(() => {
        if (!entries[current]) return;
        setDisplayed("");
        setTyping(true);
        typingRef.current = true;
        let i = 0;
        const { text, speed = 50 } = entries[current];
        function showFullText() {
            setDisplayed(text);
            setTyping(false);
            typingRef.current = false;
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
        intervalRef.current = setInterval(() => {
            if (i < text.length) {
                setDisplayed((prev) => prev + text.charAt(i));
                i++;
            } else {
                if (intervalRef.current) clearInterval(intervalRef.current);
                setTyping(false);
                typingRef.current = false;
            }
        }, speed);

        // Keydown handler for Enter
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Enter") {
                if (typingRef.current) {
                    showFullText();
                } else {
                    if (current < entries.length - 1) {
                        setCurrent((c) => c + 1);
                    } else {
                        if (onComplete) onComplete();
                    }
                }
            }
        };
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [current, entries, onComplete]);

    if (!entries[current]) return null;
    const { size } = entries[current];

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-white text-black p-8">
            <div className="text-center max-w-4xl mx-auto">
                <div
                    className="font-serif font-bold tracking-wide leading-relaxed mb-8 whitespace-pre-line text-shadow-sm"
                    style={size ? { fontSize: size } : { fontSize: '2rem' }}
                >
                    {displayed}
                    {typing && (
                        <span className="animate-pulse ml-1 text-black font-normal">▎</span>
                    )}
                </div>

                {!typing && (
                    <button
                        className="px-10 py-4 bg-black hover:bg-gray-800 text-white font-serif font-bold text-lg rounded-sm transition-all duration-500 transform hover:scale-105 border-2 border-black hover:border-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 shadow-lg hover:shadow-xl"
                        onClick={() => {
                            if (current < entries.length - 1) {
                                setCurrent((c) => c + 1);
                            } else {
                                if (onComplete) onComplete();
                            }
                        }}
                    >
                        {current < entries.length - 1 ? 'Continue Reading...' : 'Next'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default TypingEffect;
