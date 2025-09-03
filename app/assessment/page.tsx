"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { generateAssessmentQuestions, evaluateAnswers } from "./service";
import TypingEffect from "../global/components/TypingEffect";

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
    strengths: string[];
    recommendations: string[];
    nextSteps: string[];
}

function AssessmentContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const domain = searchParams.get('domain');
    const level = searchParams.get('level');
    
    const [currentStep, setCurrentStep] = useState<'intro' | 'questions' | 'results'>('intro');
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
        }
        setIsLoading(false);
    };

    const handleStartAssessment = () => {
        setCurrentStep('questions');
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
                            📋 Assessment Overview
                        </h3>
                        <ul className="space-y-2 text-blue-700">
                            <li>• Industry-level questions designed to assess practical knowledge</li>
                            <li>• Real-world scenarios you might encounter in the field</li>
                            <li>• Personalized recommendations based on your responses</li>
                            <li>• Takes approximately 10-15 minutes to complete</li>
                        </ul>
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
        if (isLoading || questions.length === 0) {
            return (
                <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-xl text-gray-600">Generating personalized questions...</p>
                    </div>
                </div>
            );
        }

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
                                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
                                    <div className="text-center mb-4">
                                        <div className="text-4xl font-bold text-blue-600">
                                            {assessmentResult.score}%
                                        </div>
                                        <div className="text-lg text-gray-700">
                                            {assessmentResult.level} Level
                                        </div>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="bg-green-50 rounded-lg p-6">
                                        <h3 className="text-xl font-semibold text-green-800 mb-3">
                                            💪 Your Strengths
                                        </h3>
                                        <ul className="space-y-2">
                                            {assessmentResult.strengths.map((strength, index) => (
                                                <li key={index} className="text-green-700">
                                                    • {strength}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="bg-blue-50 rounded-lg p-6">
                                        <h3 className="text-xl font-semibold text-blue-800 mb-3">
                                            🎯 Recommendations
                                        </h3>
                                        <ul className="space-y-2">
                                            {assessmentResult.recommendations.map((rec, index) => (
                                                <li key={index} className="text-blue-700">
                                                    • {rec}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                <div className="bg-purple-50 rounded-lg p-6">
                                    <h3 className="text-xl font-semibold text-purple-800 mb-3">
                                        🚀 Next Steps
                                    </h3>
                                    <ul className="space-y-2">
                                        {assessmentResult.nextSteps.map((step, index) => (
                                            <li key={index} className="text-purple-700">
                                                • {step}
                                            </li>
                                        ))}
                                    </ul>
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
