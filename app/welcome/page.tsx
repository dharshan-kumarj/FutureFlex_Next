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
                            Congratulations on Joining Velsy Media!
                        </div>
                        <div className="text-xl text-gray-700 font-serif italic">
                            "Your simulation journey as a Junior Software Engineer starts now. Embrace every challenge, learn, and shine!"
                        </div>
                        <div className="mt-4 text-sm text-gray-500 font-serif">
                            — The Velsy Media Team —
                        </div>
                        <button
                            className="mt-8 px-8 py-3 bg-blue-700 text-white rounded-lg font-semibold text-lg shadow hover:bg-blue-800 transition-colors"
                            onClick={() => router.push("/scene1")}
                        >
                            Go to Scene 1
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
