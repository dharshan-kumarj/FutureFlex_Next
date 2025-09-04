"use client";

import { useState, useEffect } from 'react';

interface ApiKeySetupProps {
    onKeySet: () => void;
}

export default function ApiKeySetup({ onKeySet }: ApiKeySetupProps) {
    const [apiKey, setApiKey] = useState('');
    const [isValid, setIsValid] = useState(false);

    useEffect(() => {
        // Check if API key already exists
        const existingKey = localStorage.getItem('geminiApiKey');
        if (existingKey) {
            onKeySet();
        }
    }, [onKeySet]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (apiKey.trim()) {
            localStorage.setItem('geminiApiKey', apiKey.trim());
            setIsValid(true);
            onKeySet();
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
                <div className="text-center mb-6">
                    <div className="text-4xl mb-4">🔐</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                        Setup Required
                    </h2>
                    <p className="text-gray-600">
                        To generate personalized assessments, please provide your Gemini API key.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Gemini API Key
                        </label>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="Enter your Gemini API key"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    </div>
                    
                    <button
                        type="submit"
                        className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                        Save API Key & Continue
                    </button>
                </form>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h3 className="text-sm font-semibold text-blue-800 mb-2">
                        How to get your API key:
                    </h3>
                    <ol className="text-xs text-blue-700 space-y-1">
                        <li>1. Go to <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a></li>
                        <li>2. Sign in with your Google account</li>
                        <li>3. Click "Create API Key"</li>
                        <li>4. Copy the generated key and paste it above</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}
