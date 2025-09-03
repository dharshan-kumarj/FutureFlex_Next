"use client";

import { useState } from "react";

interface PopUpProps {
  onClose?: () => void;
}

const PopUp: React.FC<PopUpProps> = ({ onClose }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!name || !email || !apiKey) {
      setError("Please complete all fields to proceed with your application.");
      return;
    }
    // Note: localStorage is not supported in Claude artifacts
    // In a real application, you would use:
    localStorage.setItem("userName", name);
    localStorage.setItem("userEmail", email);
    localStorage.setItem("geminiApiKey", apiKey);

    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0  bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white border-2 border-gray-900 shadow-2xl max-w-xl w-full mx-auto transform transition-all duration-300">

        {/* Corporate Header */}
        <div className="bg-gray-900 text-white p-6 border-b-4 border-black">
          <div className="text-center">
            <div className="text-sm font-sans uppercase tracking-wider text-gray-300 mb-2">
              VELSY MEDIA ONBOARDING
            </div>
            <h2 className="text-3xl font-sans font-bold mb-2">
              Junior Software Engineer Simulation
            </h2>
            <div className="w-24 h-1 bg-white mx-auto mb-3"></div>
            <p className="text-gray-300 font-sans text-sm">
              Please complete your profile to begin your journey
            </p>
          </div>
        </div>

        <div className="p-8">
          {/* Welcome Message */}
          <div className="bg-gray-50 border-l-4 border-gray-900 p-4 mb-8">
            <h3 className="font-sans font-bold text-gray-900 mb-2">Welcome to Velsy Media!</h3>
            <p className="text-gray-700 font-sans text-sm leading-relaxed">
              You're about to start your simulation as a Junior Software Engineer. This experience will help you develop your skills, solve real-world problems, and collaborate just like our team does every day.
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-6">
            <div>
              <label className="block font-sans font-semibold text-gray-900 mb-2 text-sm">
                Full Name <span className="text-red-600">*</span>
              </label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full border-2 border-gray-300 focus:border-gray-900 px-4 py-3 font-sans text-gray-900 placeholder-gray-400 transition-all duration-300 focus:outline-none bg-gray-50 focus:bg-white"
                placeholder="Enter your full name as it appears on your resume"
              />
              <p className="text-xs text-gray-500 font-sans mt-1">
                This will be used for your simulation profile and completion certificate.
              </p>
            </div>

            <div>
              <label className="block font-sans font-semibold text-gray-900 mb-2 text-sm">
                Professional Email <span className="text-red-600">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full border-2 border-gray-300 focus:border-gray-900 px-4 py-3 font-sans text-gray-900 placeholder-gray-400 transition-all duration-300 focus:outline-none bg-gray-50 focus:bg-white"
                placeholder="your.email@company.com"
              />
              <p className="text-xs text-gray-500 font-sans mt-1">
                We'll send your simulation feedback and progress updates here.
              </p>
            </div>

            <div>
              <label className="block font-sans font-semibold text-gray-900 mb-2 text-sm">
                Gemini AI API Key <span className="text-red-600">*</span>
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                className="w-full border-2 border-gray-300 focus:border-gray-900 px-4 py-3 font-sans text-gray-900 placeholder-gray-400 transition-all duration-300 focus:outline-none bg-gray-50 focus:bg-white"
                placeholder="Enter your Gemini AI API key"
              />
              <p className="text-xs text-gray-500 font-sans mt-1">
                This will enable your AI-powered assistant during the simulation.
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded p-4">
              <div className="text-red-800 font-sans text-sm">
                <strong>⚠️ Incomplete Profile:</strong> {error}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 mt-8">
            <button
              onClick={handleSubmit}
              className="flex-1 bg-gray-900 text-white py-4 px-6 font-sans font-bold text-sm uppercase tracking-wide hover:bg-black transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-gray-400 shadow-lg hover:shadow-xl"
            >
              Begin Simulation
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="flex-1 bg-white text-gray-900 py-4 px-6 font-sans font-bold text-sm uppercase tracking-wide border-2 border-gray-900 hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-gray-400"
              >
                Cancel
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default PopUp;
