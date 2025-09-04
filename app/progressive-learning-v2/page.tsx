"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { progressiveLearningAgent } from "./service/progressiveLearningAgent";
import ApiKeySetup from "./components/ApiKeySetup";

interface ProgressiveScenario {
    id: string;
    title: string;
    scenario: string;
    context: string;
    expectedOutcome: string;
    difficulty: number;
    skillsRequired: string[];
    isAdaptive: boolean;
    basedOnPrevious?: string[];
}

interface ScenarioFeedback {
    score: number;
    strengths: string[];
    improvements: string[];
    nextFocus: string;
    skillGaps: string[];
    confidenceLevel: number;
    readinessForNext: boolean;
}

interface LearningSession {
    userId: string;
    domain: string;
    level: string;
    currentScenario: ProgressiveScenario | null;
    scenarioCount: number;
    isComplete: boolean;
}

function ProgressiveLearningContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const domain = searchParams.get('domain');
    const level = searchParams.get('level');
    
    const [learningSession, setLearningSession] = useState<LearningSession | null>(null);
    const [currentAnswer, setCurrentAnswer] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const [currentFeedback, setCurrentFeedback] = useState<ScenarioFeedback | null>(null);
    const [userId] = useState(() => `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    const [isApiKeySet, setIsApiKeySet] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const domainData = {
        ai: { name: "Artificial Intelligence", icon: "🤖" },
        cloud: { name: "Cloud Computing", icon: "☁️" }
    };

    const currentDomain = domain && domainData[domain as keyof typeof domainData] 
        ? domainData[domain as keyof typeof domainData] 
        : domainData.ai;

    // Initialize learning session
    useEffect(() => {
        console.log('Progressive Learning - Effect triggered:', { domain, level, isApiKeySet });
        if (domain && level && isApiKeySet) {
            console.log('Progressive Learning - Initializing session...');
            initializeLearningSession();
        }
    }, [domain, level, isApiKeySet]);

    const initializeLearningSession = async () => {
        console.log('Progressive Learning - Starting initialization...');
        setIsLoading(true);
        setError(null);
        try {
            // Generate initial scenario using the learning agent
            console.log('Progressive Learning - Calling generateInitialScenario...');
            const initialScenario = await progressiveLearningAgent.getInstance().generateInitialScenario(
                userId,
                domain!,
                level!
            );
            
            console.log('Progressive Learning - Initial scenario generated:', initialScenario);
            
            const session: LearningSession = {
                userId,
                domain: domain!,
                level: level!,
                currentScenario: initialScenario,
                scenarioCount: 1,
                isComplete: false
            };
            
            setLearningSession(session);
            console.log('Progressive Learning - Session initialized successfully:', session);
        } catch (error) {
            console.error('Progressive Learning - Error initializing learning session:', error);
            setError(`Failed to initialize learning session. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        setIsLoading(false);
    };

    const handleSubmitAnswer = async () => {
        if (!currentAnswer.trim() || !learningSession?.currentScenario) return;
        
        setIsLoading(true);
        setError(null);
        
        try {
            // Evaluate response using the learning agent with memory
            const feedback = await progressiveLearningAgent.getInstance().evaluateResponseWithMemory(
                userId,
                learningSession.currentScenario,
                currentAnswer
            );
            
            setCurrentFeedback(feedback);
            setShowFeedback(true);
            
        } catch (error) {
            console.error('Error submitting answer:', error);
            setError('Failed to evaluate your answer. Please check your API key and try again.');
        }
        
        setIsLoading(false);
    };

    const handleNextScenario = async () => {
        if (!learningSession || !currentFeedback) return;
        
        setIsLoading(true);
        setShowFeedback(false);
        setError(null);
        
        try {
            // Generate next adaptive scenario based on memory and performance
            const nextScenario = await progressiveLearningAgent.getInstance().generateAdaptiveScenario(
                userId,
                currentAnswer,
                currentFeedback
            );
            
            const updatedSession = {
                ...learningSession,
                currentScenario: nextScenario,
                scenarioCount: learningSession.scenarioCount + 1
            };
            
            setLearningSession(updatedSession);
            setCurrentFeedback(null);
            setCurrentAnswer("");
        } catch (error) {
            console.error('Error generating next scenario:', error);
            setError('Failed to generate next scenario. Please check your API key and try again.');
        }
        
        setIsLoading(false);
    };

    const handleViewProgress = () => {
        const analytics = progressiveLearningAgent.getInstance().getLearningAnalytics(userId);
        console.log('Learning Analytics:', analytics);
        // In a real app, you would navigate to a progress page
        alert(`Progress: ${analytics?.overallProgress?.scenariosCompleted || 0} scenarios completed with ${analytics?.overallProgress?.averageScore || 0}% average score!`);
    };

    // Show loading if domain or level are missing
    if (!domain || !level) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Missing Parameters</h2>
                    <p className="text-gray-600 mb-6">
                        Please select a domain and skill level first.
                    </p>
                    <button
                        onClick={() => router.push('/domain-selection')}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                        Go to Domain Selection
                    </button>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        {learningSession ? 'Creating Your Next Challenge...' : 'Setting Up Your Learning Journey...'}
                    </h3>
                    <p className="text-gray-600">
                        {learningSession ? 'AI is analyzing your progress and creating personalized scenarios' : 'Preparing your first scenario'}
                    </p>
                </div>
            </div>
        );
    }

    if (!learningSession && !error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Failed to Initialize Learning Session</h2>
                    <button
                        onClick={() => router.push('/domain-selection')}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Initialization Error</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <div className="space-y-3">
                        <button
                            onClick={() => {
                                setError(null);
                                initializeLearningSession();
                            }}
                            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                        >
                            Try Again
                        </button>
                        <button
                            onClick={() => router.push('/domain-selection')}
                            className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                        >
                            Back to Domain Selection
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!learningSession) {
        return null; // This should not happen due to the checks above, but satisfies TypeScript
    }

    const currentScenario = learningSession.currentScenario;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
            <div className="max-w-4xl mx-auto">
                {/* API Key Setup */}
                <ApiKeySetup onApiKeySet={() => setIsApiKeySet(true)} />
                
                {/* Error Display */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center">
                            <div className="text-red-600 mr-2">❌</div>
                            <span className="text-red-800">{error}</span>
                        </div>
                    </div>
                )}
                
                {/* Only show content if API key is set */}
                {!isApiKeySet ? (
                    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                        <div className="text-6xl mb-4">🔐</div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">
                            Welcome to Progressive Learning
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Please set up your Gemini API key above to begin your adaptive learning journey.
                        </p>
                        <div className="text-sm text-gray-500">
                            Once set, you'll experience AI-powered scenarios that adapt to your progress!
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Progress Header */}
                        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                            <div className="text-3xl">{currentDomain.icon}</div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">
                                    {currentDomain.name} Journey
                                </h1>
                                <p className="text-gray-600">{level.charAt(0).toUpperCase() + level.slice(1)} Level</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="text-right">
                                <div className="text-sm text-gray-500">Scenario</div>
                                <div className="text-xl font-bold text-blue-600">
                                    #{learningSession.scenarioCount}
                                </div>
                                {currentScenario?.isAdaptive && (
                                    <div className="text-xs text-purple-600 font-medium">
                                        Adaptive ✨
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={handleViewProgress}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                            >
                                View Progress
                            </button>
                        </div>
                    </div>
                    
                    {currentScenario && (
                        <div className="mb-4">
                            <div className="flex items-center space-x-2 mb-2">
                                <span className="text-sm text-gray-600">Difficulty:</span>
                                <div className="flex space-x-1">
                                    {[...Array(10)].map((_, i) => (
                                        <div
                                            key={i}
                                            className={`w-2 h-2 rounded-full ${
                                                i < currentScenario.difficulty ? 'bg-blue-500' : 'bg-gray-200'
                                            }`}
                                        />
                                    ))}
                                </div>
                                <span className="text-sm font-medium text-blue-600">
                                    {currentScenario.difficulty}/10
                                </span>
                            </div>
                            
                            <div className="flex flex-wrap gap-2">
                                {currentScenario.skillsRequired.map((skill, index) => (
                                    <span
                                        key={index}
                                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                                    >
                                        {skill.replace('_', ' ')}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Current Scenario */}
                {!showFeedback && currentScenario && (
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                        {/* Scenario Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                            <div className="flex items-center space-x-3 mb-2">
                                <div className="text-3xl">
                                    {currentScenario.isAdaptive ? '🎯' : '📝'}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">{currentScenario.title}</h2>
                                    <div className="flex items-center space-x-3 mt-1">
                                        <span className="px-2 py-1 bg-white bg-opacity-20 rounded text-sm">
                                            Scenario #{learningSession.scenarioCount}
                                        </span>
                                        {currentScenario.isAdaptive && (
                                            <span className="px-2 py-1 bg-purple-500 bg-opacity-60 rounded text-sm">
                                                Adaptive ✨
                                            </span>
                                        )}
                                        <span className="px-2 py-1 bg-white bg-opacity-20 rounded text-sm">
                                            Difficulty: {currentScenario.difficulty}/10
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8">
                            {/* Scenario Story */}
                            <div className="mb-8">
                                <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
                                    {currentScenario.scenario.split('\n').map((paragraph, index) => (
                                        <p key={index} className="mb-4">{paragraph}</p>
                                    ))}
                                </div>
                            </div>

                            {/* Context Section */}
                            {currentScenario.context && (
                                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 p-6 mb-6 rounded-r-lg">
                                    <div className="flex items-start space-x-3">
                                        <div className="text-yellow-600 text-xl">💡</div>
                                        <div>
                                            <h3 className="font-semibold text-yellow-800 mb-2">Technical Context</h3>
                                            <p className="text-yellow-700">{currentScenario.context}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Previous Work Reference */}
                            {currentScenario.basedOnPrevious && currentScenario.basedOnPrevious.length > 0 && (
                                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-l-4 border-purple-400 p-6 mb-6 rounded-r-lg">
                                    <div className="flex items-start space-x-3">
                                        <div className="text-purple-600 text-xl">🔗</div>
                                        <div>
                                            <h3 className="font-semibold text-purple-800 mb-2">Building on Previous Work</h3>
                                            <p className="text-purple-700">This scenario builds on your previous experience and addresses areas for growth identified in your last assessment.</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Expected Outcome */}
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-400 p-6 mb-8 rounded-r-lg">
                                <div className="flex items-start space-x-3">
                                    <div className="text-green-600 text-xl">🎯</div>
                                    <div>
                                        <h3 className="font-semibold text-green-800 mb-2">What Success Looks Like</h3>
                                        <p className="text-green-700">{currentScenario.expectedOutcome}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Skills Focus */}
                            <div className="mb-8">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Skills in Focus</h3>
                                <div className="flex flex-wrap gap-3">
                                    {currentScenario.skillsRequired.map((skill, index) => (
                                        <span
                                            key={index}
                                            className="px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 rounded-full text-sm font-medium border border-blue-200"
                                        >
                                            {skill.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Response Section */}
                            <div className="border-t border-gray-200 pt-8">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Approach</h3>
                                <p className="text-gray-600 mb-4">
                                    Take your time to analyze the situation. Consider the technical requirements, business constraints, 
                                    stakeholder needs, and your available resources. Provide a comprehensive response that demonstrates 
                                    your thinking process and proposed solution.
                                </p>
                                
                                <textarea
                                    value={currentAnswer}
                                    onChange={(e) => setCurrentAnswer(e.target.value)}
                                    placeholder="Describe your approach to this scenario. Consider the technical challenges, stakeholder needs, proposed solutions, implementation steps, and potential risks or considerations..."
                                    className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    disabled={isLoading}
                                />
                                
                                <div className="flex justify-between items-center mt-6">
                                    <div className="text-sm text-gray-500">
                                        💡 Tip: Aim for a detailed response that shows your thinking process
                                    </div>
                                    <button
                                        onClick={handleSubmitAnswer}
                                        disabled={!currentAnswer.trim() || isLoading}
                                        className={`px-8 py-3 rounded-lg font-semibold transition-all ${
                                            !currentAnswer.trim() || isLoading
                                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transform hover:scale-105'
                                        }`}
                                    >
                                        {isLoading ? (
                                            <div className="flex items-center space-x-2">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                <span>Evaluating...</span>
                                            </div>
                                        ) : (
                                            'Submit Response'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Feedback Display */}
                {showFeedback && currentFeedback && (
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <div className="text-center mb-8">
                            <div className="text-6xl mb-4">
                                {currentFeedback.score >= 80 ? '🎉' : currentFeedback.score >= 60 ? '👍' : '💪'}
                            </div>
                            <h2 className="text-3xl font-bold text-gray-800 mb-2">
                                {currentFeedback.score >= 80 ? 'Excellent Work!' : 
                                 currentFeedback.score >= 60 ? 'Great Progress!' : 'Keep Learning!'}
                            </h2>
                            <div className="text-4xl font-bold text-blue-600 mb-2">
                                {currentFeedback.score}%
                            </div>
                            <p className="text-gray-600">
                                Scenario #{learningSession.scenarioCount} Complete
                            </p>
                            <div className="mt-2">
                                <span className="text-sm text-gray-500">Confidence Level: </span>
                                <span className="text-sm font-medium text-blue-600">
                                    {currentFeedback.confidenceLevel}/10
                                </span>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6 mb-8">
                            <div className="bg-green-50 rounded-lg p-6">
                                <h3 className="text-lg font-semibold text-green-800 mb-3">
                                    💪 Your Strengths
                                </h3>
                                <ul className="space-y-2">
                                    {currentFeedback.strengths.map((strength, index) => (
                                        <li key={index} className="text-green-700 flex items-start">
                                            <span className="text-green-500 mr-2 mt-1">✓</span>
                                            {strength}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="bg-blue-50 rounded-lg p-6">
                                <h3 className="text-lg font-semibold text-blue-800 mb-3">
                                    🎯 Growth Areas
                                </h3>
                                <ul className="space-y-2">
                                    {currentFeedback.improvements.map((improvement, index) => (
                                        <li key={index} className="text-blue-700 flex items-start">
                                            <span className="text-blue-500 mr-2 mt-1">→</span>
                                            {improvement}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="bg-purple-50 rounded-lg p-6 mb-8">
                            <h3 className="text-lg font-semibold text-purple-800 mb-3">
                                🚀 Next Focus
                            </h3>
                            <p className="text-purple-700">
                                {currentFeedback.nextFocus}
                            </p>
                        </div>

                        {currentFeedback.skillGaps.length > 0 && (
                            <div className="bg-orange-50 rounded-lg p-6 mb-8">
                                <h3 className="text-lg font-semibold text-orange-800 mb-3">
                                    📚 Skills to Develop
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {currentFeedback.skillGaps.map((skill, index) => (
                                        <span
                                            key={index}
                                            className="px-3 py-1 bg-orange-200 text-orange-800 rounded-full text-sm"
                                        >
                                            {skill.replace('_', ' ')}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="text-center">
                            <button
                                onClick={handleNextScenario}
                                className={`px-8 py-4 rounded-lg font-semibold text-lg shadow-lg transition-all transform hover:scale-105 ${
                                    currentFeedback.readinessForNext
                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                                        : 'bg-gradient-to-r from-green-600 to-blue-600 text-white hover:from-green-700 hover:to-blue-700'
                                }`}
                            >
                                {currentFeedback.readinessForNext 
                                    ? 'Ready for Next Challenge 🚀' 
                                    : 'Continue Learning Journey 📈'
                                }
                            </button>
                        </div>
                    </div>
                )}
                    </>
                )}
            </div>
        </div>
    );
}

export default function ProgressiveLearningPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="text-xl">Loading your learning journey...</div>
            </div>
        }>
            <ProgressiveLearningContent />
        </Suspense>
    );
}
