"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { generateAssessmentQuestions, evaluateAnswers } from "./service";
import TypingEffect from "../global/components/TypingEffect";
import ApiKeySetup from "./components/ApiKeySetup";
import AdaptiveLearningRecommendations from "./components/AdaptiveLearningRecommendations";

interface Question {
    id: number;
    question: string;
    type: 'multiple-choice' | 'text' | 'scenario';
    options?: string[];
    context?: string;
}

interface AssessmentResult {
    score: number;
    level: string;
    actualLevel: string;
    isValidForChosenLevel: boolean;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    nextSteps: string[];
    detailedAnalysis: string;
    industryReadiness: number;
    confidenceScore?: number;
    learningPath?: string;
}

function AssessmentContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const domain = searchParams.get('domain');
    const level = searchParams.get('level');
    
    const [currentStep, setCurrentStep] = useState<'setup' | 'intro' | 'questions' | 'evaluating' | 'results'>('setup');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<{[key: number]: string}>({});
    const [isLoading, setIsLoading] = useState(false);
    const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);

    const domainData = {
        ai: { name: "Artificial Intelligence", icon: "🤖" },
        cloud: { name: "Cloud Computing", icon: "☁️" }
    };

    const currentDomain = domain && domainData[domain as keyof typeof domainData] 
        ? domainData[domain as keyof typeof domainData] 
        : domainData.ai;

    // Check for API key on component mount
    useEffect(() => {
        const apiKey = localStorage.getItem('geminiApiKey');
        if (apiKey) {
            setCurrentStep('intro');
        } else {
            setCurrentStep('setup');
        }
    }, []);

    const handleApiKeySet = () => {
        setCurrentStep('questions');
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

    useEffect(() => {
        if (currentStep === 'questions' && questions.length === 0) {
            loadQuestions();
        }
    }, [currentStep]);

    const loadQuestions = async () => {
        setIsLoading(true);
        try {
            const generatedQuestions = await generateAssessmentQuestions(domain!, level!);
            setQuestions(generatedQuestions);
        } catch (error) {
            console.error('Error loading questions:', error);
        }
        setIsLoading(false);
    };

    const handleAnswerSubmit = (answer: string) => {
        setAnswers(prev => ({
            ...prev,
            [questions[currentQuestionIndex].id]: answer
        }));

        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            // All questions answered, evaluate
            setCurrentStep('evaluating');
            evaluateAssessment();
        }
    };

    const evaluateAssessment = async () => {
        setIsLoading(true);
        try {
            const result = await evaluateAnswers(domain!, level!, questions, answers);
            setAssessmentResult(result);
            setCurrentStep('results');
        } catch (error) {
            console.error('Error evaluating assessment:', error);
            // Show error message to user
            alert('There was an error evaluating your assessment. Please try again or contact support.');
        }
        setIsLoading(false);
    };

    const handleStartAssessment = () => {
        // Check if API key exists first
        const apiKey = localStorage.getItem('geminiApiKey');
        if (!apiKey) {
            // If no API key, show setup instead of navigating
            setCurrentStep('setup');
        } else {
            // If API key exists, start the questions
            setCurrentStep('questions');
        }
    };

    const handleRetakeAssessment = () => {
        setCurrentStep('intro');
        setCurrentQuestionIndex(0);
        setAnswers({});
        setQuestions([]);
        setAssessmentResult(null);
    };

    const handleProceedToLearning = () => {
        // Store assessment results in localStorage or state management
        localStorage.setItem('assessmentResult', JSON.stringify({
            domain,
            level,
            result: assessmentResult
        }));
        router.push('/scene1');
    };

    // Show API key setup if needed
    if (currentStep === 'setup') {
        return <ApiKeySetup onKeySet={handleApiKeySet} />;
    }

    if (currentStep === 'intro') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
                <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl p-8">
                    <div className="text-center mb-8">
                        <div className="text-6xl mb-4">{currentDomain.icon}</div>
                        <h1 className="text-4xl font-bold text-gray-800 mb-2">
                            {currentDomain.name} Assessment
                        </h1>
                        <p className="text-xl text-gray-600 mb-4">
                            {level === 'intermediate' ? 'Intermediate Level' : 'Beginner Level'}
                        </p>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-6 mb-8">
                        <h3 className="text-xl font-semibold text-blue-800 mb-3">
                            🤖 AI-Powered Assessment Overview
                        </h3>
                        <ul className="space-y-2 text-blue-700">
                            <li>• <strong>Real Industry Scenarios:</strong> Questions generated based on actual workplace challenges</li>
                            <li>• <strong>Adaptive Difficulty:</strong> AI adjusts complexity based on your {level} level claim</li>
                            <li>• <strong>Comprehensive Analysis:</strong> Detailed evaluation of technical skills and industry readiness</li>
                            <li>• <strong>Personalized Learning Path:</strong> Custom recommendations based on your specific gaps and strengths</li>
                            <li>• <strong>Honest Validation:</strong> Accurate assessment to ensure optimal training effectiveness</li>
                        </ul>
                        <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                            <p className="text-sm text-blue-800">
                                <strong>⏱️ Time:</strong> 10-15 minutes • <strong>🎯 Purpose:</strong> Validate your {level} level skills and create a personalized learning journey
                            </p>
                        </div>
                    </div>

                    <div className="text-center">
                        <button
                            onClick={handleStartAssessment}
                            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold text-lg shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
                        >
                            Start Assessment 🚀
                        </button>
                        <div className="mt-4">
                            <button
                                onClick={() => router.push(`/domain-selection?domain=${domain}`)}
                                className="text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                ← Back to skill level selection
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (currentStep === 'questions') {
        // Instead of loading screen, show Scene selection
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
                <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl p-8">
                    <div className="text-center mb-8">
                        <div className="text-6xl mb-4">{currentDomain.icon}</div>
                        <h1 className="text-4xl font-bold text-gray-800 mb-2">
                            Choose Your Learning Experience
                        </h1>
                        <p className="text-xl text-gray-600 mb-4">
                            Select which scenario you'd like to explore for {currentDomain.name}
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {/* Scene 1 Option */}
                        <div 
                            className="group cursor-pointer transform transition-all duration-300 hover:scale-105"
                            onClick={() => router.push('/scene1')}
                        >
                            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-8 text-white shadow-lg group-hover:shadow-xl">
                                <div className="text-4xl mb-4 text-center">🎯</div>
                                <h3 className="text-2xl font-bold mb-3 text-center">Scene 1</h3>
                                <ul className="space-y-2 text-blue-100">
                                    <li>• Real workplace simulation</li>
                                    <li>• Interactive decision making</li>
                                    <li>• Professional communication focus</li>
                                    <li>• Industry-standard scenarios</li>
                                </ul>
                                <div className="mt-6 text-center">
                                    <div className="bg-white bg-opacity-20 rounded-lg p-3">
                                        <p className="text-sm font-medium">
                                            Experience authentic workplace challenges
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Scene 2 Option */}
                        <div 
                            className="group cursor-pointer transform transition-all duration-300 hover:scale-105"
                            onClick={() => router.push('/scene2')}
                        >
                            <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-xl p-8 text-white shadow-lg group-hover:shadow-xl">
                                <div className="text-4xl mb-4 text-center">🚀</div>
                                <h3 className="text-2xl font-bold mb-3 text-center">Scene 2</h3>
                                <ul className="space-y-2 text-green-100">
                                    <li>• Advanced project scenarios</li>
                                    <li>• Team collaboration challenges</li>
                                    <li>• Strategic thinking focus</li>
                                    <li>• Leadership opportunities</li>
                                </ul>
                                <div className="mt-6 text-center">
                                    <div className="bg-white bg-opacity-20 rounded-lg p-3">
                                        <p className="text-sm font-medium">
                                            Tackle complex multi-stakeholder projects
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 text-center">
                        <p className="text-gray-600 mb-4">
                            Both scenarios are tailored for {level} level {currentDomain.name} professionals
                        </p>
                        <button
                            onClick={() => router.push(`/domain-selection?domain=${domain}`)}
                            className="text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            ← Back to assessment intro
                        </button>
                    </div>
                </div>
            </div>
        );

        const currentQuestion = questions[currentQuestionIndex];

        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <div className="flex justify-between items-center mb-8">
                            <div className="text-sm text-gray-500">
                                Question {currentQuestionIndex + 1} of {questions.length}
                            </div>
                            <div className="w-64 bg-gray-200 rounded-full h-2">
                                <div 
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                                ></div>
                            </div>
                        </div>

                        {currentQuestion.context && (
                            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                                <p className="text-sm text-yellow-800">
                                    <strong>Scenario:</strong> {currentQuestion.context}
                                </p>
                            </div>
                        )}

                        <h2 className="text-2xl font-bold text-gray-800 mb-6">
                            {currentQuestion.question}
                        </h2>

                        <QuestionInput 
                            question={currentQuestion}
                            onSubmit={handleAnswerSubmit}
                        />
                    </div>
                </div>
            </div>
        );
    }

    if (currentStep === 'evaluating') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="text-center max-w-lg">
                    <div className="relative">
                        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto mb-6"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-3xl">🧠</span>
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-3">AI Expert Analysis in Progress</h3>
                    <p className="text-gray-600 mb-6">
                        Our AI is comprehensively evaluating your {currentDomain.name} responses...
                    </p>
                    <div className="text-sm text-gray-500 space-y-2 text-left bg-white rounded-lg p-4 shadow-sm">
                        <p>📊 Analyzing technical accuracy and depth</p>
                        <p>🎯 Assessing practical application skills</p>
                        <p>🏢 Evaluating industry readiness level</p>
                        <p>🔍 Identifying specific strengths and gaps</p>
                        <p>🛤️ Crafting personalized learning recommendations</p>
                    </div>
                    <div className="mt-6">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-purple-600 h-2 rounded-full animate-pulse" style={{width: '85%'}}></div>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">This detailed analysis takes 10-15 seconds...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (currentStep === 'results') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <div className="text-center mb-8">
                            <div className="text-6xl mb-4">🎯</div>
                            <h1 className="text-4xl font-bold text-gray-800 mb-2">
                                Assessment Complete!
                            </h1>
                            <p className="text-xl text-gray-600">
                                Your {currentDomain.name} skill evaluation
                            </p>
                        </div>

                        {assessmentResult && (
                            <div className="space-y-6">
                                {/* Score and Level Validation */}
                                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
                                    <div className="text-center mb-4">
                                        <div className="text-4xl font-bold text-blue-600 mb-2">
                                            {assessmentResult.score}%
                                        </div>
                                        <div className="text-lg text-gray-700 mb-2">
                                            Demonstrated Level: <span className="font-semibold">{assessmentResult.actualLevel}</span>
                                        </div>
                                        {assessmentResult.confidenceScore && (
                                            <div className="text-sm text-gray-500 mb-2">
                                                Assessment Confidence: {assessmentResult.confidenceScore}%
                                            </div>
                                        )}
                                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                            assessmentResult.isValidForChosenLevel 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-orange-100 text-orange-800'
                                        }`}>
                                            {assessmentResult.isValidForChosenLevel 
                                                ? `✅ Validated ${level} level capabilities` 
                                                : `⚠️ Suggests ${assessmentResult.actualLevel} level focus`}
                                        </div>
                                    </div>
                                    
                                    {/* Industry Readiness Meter */}
                                    <div className="mt-4">
                                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                                            <span>Industry Readiness</span>
                                            <span>{assessmentResult.industryReadiness}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-3">
                                            <div 
                                                className={`h-3 rounded-full transition-all duration-500 ${
                                                    assessmentResult.industryReadiness >= 80 ? 'bg-green-500' :
                                                    assessmentResult.industryReadiness >= 60 ? 'bg-yellow-500' :
                                                    assessmentResult.industryReadiness >= 40 ? 'bg-orange-500' :
                                                    'bg-red-500'
                                                }`}
                                                style={{ width: `${assessmentResult.industryReadiness}%` }}
                                            ></div>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {assessmentResult.industryReadiness >= 80 ? 'Ready for senior responsibilities' :
                                             assessmentResult.industryReadiness >= 60 ? 'Capable of independent work' :
                                             assessmentResult.industryReadiness >= 40 ? 'Needs mentorship and guidance' :
                                             'Requires foundational learning'}
                                        </div>
                                    </div>
                                </div>

                                {/* Learning Path Recommendation */}
                                {assessmentResult.learningPath && (
                                    <div className="bg-indigo-50 rounded-lg p-6">
                                        <h3 className="text-xl font-semibold text-indigo-800 mb-3">
                                            🎯 Personalized Learning Path
                                        </h3>
                                        <p className="text-indigo-700 leading-relaxed">
                                            {assessmentResult.learningPath}
                                        </p>
                                    </div>
                                )}

                                {/* Detailed Analysis */}
                                <div className="bg-gray-50 rounded-lg p-6">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-3">
                                        📊 Expert Analysis
                                    </h3>
                                    <p className="text-gray-700 leading-relaxed">
                                        {assessmentResult.detailedAnalysis}
                                    </p>
                                </div>

                                {/* Strengths and Weaknesses */}
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="bg-green-50 rounded-lg p-6">
                                        <h3 className="text-xl font-semibold text-green-800 mb-3">
                                            💪 Your Strengths
                                        </h3>
                                        <ul className="space-y-2">
                                            {assessmentResult.strengths.map((strength, index) => (
                                                <li key={index} className="text-green-700 flex items-start">
                                                    <span className="text-green-500 mr-2 mt-1">✓</span>
                                                    {strength}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="bg-red-50 rounded-lg p-6">
                                        <h3 className="text-xl font-semibold text-red-800 mb-3">
                                            🎯 Areas for Improvement
                                        </h3>
                                        <ul className="space-y-2">
                                            {assessmentResult.weaknesses.map((weakness, index) => (
                                                <li key={index} className="text-red-700 flex items-start">
                                                    <span className="text-red-500 mr-2 mt-1">•</span>
                                                    {weakness}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                {/* Recommendations and Next Steps */}
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="bg-blue-50 rounded-lg p-6">
                                        <h3 className="text-xl font-semibold text-blue-800 mb-3">
                                            💡 Recommendations
                                        </h3>
                                        <ul className="space-y-2">
                                            {assessmentResult.recommendations.map((rec, index) => (
                                                <li key={index} className="text-blue-700 flex items-start">
                                                    <span className="text-blue-500 mr-2 mt-1">→</span>
                                                    {rec}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="bg-purple-50 rounded-lg p-6">
                                        <h3 className="text-xl font-semibold text-purple-800 mb-3">
                                            🚀 Next Steps
                                        </h3>
                                        <ul className="space-y-2">
                                            {assessmentResult.nextSteps.map((step, index) => (
                                                <li key={index} className="text-purple-700 flex items-start">
                                                    <span className="text-purple-500 mr-2 mt-1">{index + 1}.</span>
                                                    {step}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                {/* Level Validation Message */}
                                {!assessmentResult.isValidForChosenLevel && (
                                    <div className="bg-orange-50 border-l-4 border-orange-400 p-4">
                                        <div className="flex">
                                            <div className="flex-shrink-0">
                                                <span className="text-orange-400 text-xl">⚠️</span>
                                            </div>
                                            <div className="ml-3">
                                                <h3 className="text-sm font-medium text-orange-800">
                                                    Level Assessment Notice
                                                </h3>
                                                <div className="mt-2 text-sm text-orange-700">
                                                    <p>
                                                        Based on your responses, you demonstrate <strong>{assessmentResult.actualLevel}</strong> level 
                                                        skills rather than the claimed <strong>{level}</strong> level. This is completely normal! 
                                                        Our learning system will adapt to provide content appropriate for your actual skill level.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Adaptive Learning Recommendations */}
                                <div className="bg-white rounded-lg border-2 border-blue-200 p-6">
                                    <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                                        🧠 AI-Powered Learning Strategy
                                    </h3>
                                    <AdaptiveLearningRecommendations 
                                        assessmentResult={assessmentResult}
                                        domain={domain!}
                                        claimedLevel={level!}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex justify-center gap-4 mt-8">
                            <button
                                onClick={handleRetakeAssessment}
                                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                            >
                                Retake Assessment
                            </button>
                            <button
                                onClick={handleProceedToLearning}
                                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
                            >
                                Start Learning Journey 🎓
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}

export default function AssessmentPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center"><div className="text-xl">Loading assessment...</div></div>}>
            <AssessmentContent />
        </Suspense>
    );
}

interface QuestionInputProps {
    question: Question;
    onSubmit: (answer: string) => void;
}

function QuestionInput({ question, onSubmit }: QuestionInputProps) {
    const [answer, setAnswer] = useState("");

    const handleSubmit = () => {
        if (answer.trim()) {
            onSubmit(answer);
            setAnswer("");
        }
    };

    if (question.type === 'multiple-choice' && question.options) {
        return (
            <div className="space-y-4">
                {question.options.map((option, index) => (
                    <button
                        key={index}
                        onClick={() => onSubmit(option)}
                        className="w-full text-left p-4 border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
                    >
                        <span className="font-medium text-blue-600 mr-3">
                            {String.fromCharCode(65 + index)}.
                        </span>
                        {option}
                    </button>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Share your thoughts and approach..."
                className="w-full h-32 p-4 border-2 border-gray-200 rounded-lg focus:border-blue-400 focus:outline-none resize-none"
                rows={4}
            />
            <button
                onClick={handleSubmit}
                disabled={!answer.trim()}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
            >
                Submit Answer →
            </button>
        </div>
    );
}
