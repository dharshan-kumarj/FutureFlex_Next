"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TypingEffect from "../global/components/TypingEffect";
import PopUp from "./components/PopUp";

export default function WelcomePage() {
    const router = useRouter();
    const [showPopUp, setShowPopUp] = useState(false);
    const [popUpDone, setPopUpDone] = useState(false);

    return (
        <>
            {!showPopUp && (
                <TypingEffect
                    entries={[
                        { text: "Welcome to Velsy Media, Junior Software Engineer!", size: "2.4rem", speed: 75 },
                        { text: "\nThis immersive simulation mirrors the real challenges and teamwork you'll experience at Velsy Media.", size: "1.3rem", speed: 55 },
                        { text: "\nYou'll solve problems, collaborate, and grow your skills in a supportive environment.", size: "1.2rem", speed: 50 },
                        { text: "\nLet's get started with your onboarding journey.", size: "1.2rem", speed: 50 },
                    ]}
                    onComplete={() => setShowPopUp(true)}
                />
            )}
            {showPopUp && !popUpDone && (
                <PopUp onClose={() => setPopUpDone(true)} />
            )}
            {popUpDone && (
                <div className="flex flex-col items-center justify-center min-h-screen bg-white text-black">
                    <div className="text-center">
                        <div className="text-4xl font-serif font-bold mb-6 text-blue-700">
                            Choose Your Learning Domain
                        </div>
                        <div className="text-xl text-gray-700 font-serif italic mb-8">
                            "Select the domain you want to focus on and bridge the gap between theory and practical knowledge"
                        </div>
                        <div className="flex gap-8 justify-center">
                            <button
                                className="px-12 py-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold text-xl shadow-lg hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105"
                                onClick={() => router.push("/domain-selection?domain=ai")}
                            >
                                🤖 Artificial Intelligence
                            </button>
                            <button
                                className="px-12 py-6 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold text-xl shadow-lg hover:from-blue-700 hover:to-cyan-700 transition-all transform hover:scale-105"
                                onClick={() => router.push("/domain-selection?domain=cloud")}
                            >
                                ☁️ Cloud Computing
                            </button>
                        </div>
                        <div className="mt-6 text-sm text-gray-500 font-serif">
                            — Choose your path to professional excellence —
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
