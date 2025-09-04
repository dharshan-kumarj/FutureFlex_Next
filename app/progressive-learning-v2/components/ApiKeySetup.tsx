"use client";

import { useState, useEffect } from "react";

interface ApiKeySetupProps {
    onApiKeySet: () => void;
}

export default function ApiKeySetup({ onApiKeySet }: ApiKeySetupProps) {
    const [apiKey, setApiKey] = useState("");
    const [isKeySet, setIsKeySet] = useState(false);

    useEffect(() => {
        // Check if API key is already set
        const existingKey = localStorage.getItem('geminiApiKey');
        console.log('ApiKeySetup - Checking existing key:', existingKey ? 'Key exists' : 'No key found');
        if (existingKey) {
            console.log('ApiKeySetup - Calling onApiKeySet...');
            setIsKeySet(true);
            onApiKeySet();
        }
    }, [onApiKeySet]);

    const handleSaveApiKey = () => {
        if (apiKey.trim()) {
            console.log('ApiKeySetup - Saving API key...');
            localStorage.setItem('geminiApiKey', apiKey.trim());
            setIsKeySet(true);
            console.log('ApiKeySetup - Key saved, calling onApiKeySet...');
            onApiKeySet();
        }
    };

    const handleRemoveApiKey = () => {
        localStorage.removeItem('geminiApiKey');
        setIsKeySet(false);
        setApiKey("");
    };

    if (isKeySet) {
        return (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <div className="text-green-600 mr-2">✅</div>
                        <span className="text-green-800 font-medium">Gemini API Key is set</span>
                    </div>
                    <button
                        onClick={handleRemoveApiKey}
                        className="text-sm text-red-600 hover:text-red-800 underline"
                    >
                        Remove Key
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                    🔑 API Key Required
                </h3>
                <p className="text-yellow-700 text-sm">
                    To experience the Progressive Learning system, you need to provide your Gemini API key.
                </p>
            </div>
            
            <div className="space-y-3">
                <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your Gemini API key..."
                    className="w-full px-3 py-2 border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
                <button
                    onClick={handleSaveApiKey}
                    disabled={!apiKey.trim()}
                    className="w-full px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                    Save API Key
                </button>
            </div>
            
            <div className="mt-4 text-xs text-yellow-600">
                <p className="mb-2">
                    <strong>How to get your Gemini API key:</strong>
                </p>
                <ol className="list-decimal list-inside space-y-1">
                    <li>Visit <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a></li>
                    <li>Sign in with your Google account</li>
                    <li>Click "Create API key"</li>
                    <li>Copy the generated key and paste it above</li>
                </ol>
                <p className="mt-2 text-yellow-500">
                    🔒 Your API key is stored locally and never sent to our servers.
                </p>
            </div>
        </div>
    );
}
