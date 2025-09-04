"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MailConversation from "../global/components/MailConversation";
import { Mail, Clock, Users, Video, FileText, Bot, Brain, Sparkles, CheckCircle, AlertCircle } from "lucide-react";
import MDtoHTML from "../global/components/MDtoHTML";
import { requirementsMarkdown, createInterviewEmail } from "./model/scene2Content";
import { conductTechnicalInterview, analyzeInterviewPerformance } from "./service/scene2Agent";

interface InterviewQuestion {
  id: number;
  question: string;
  type: 'technical' | 'behavioral' | 'scenario';
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  timeLimit: number; // in minutes
}

interface InterviewResult {
  overallScore: number;
  technicalScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  culturalFitScore: number;
  strengths: string[];
  improvementAreas: string[];
  detailedFeedback: string;
  recommendation: string;
  nextSteps: string[];
  technicalInsights?: string;
  behavioralInsights?: string;
  growthPotential?: string;
  interviewQuality?: string;
}

function Scene2Page() {
  const router = useRouter();
  const [currentPhase, setCurrentPhase] = useState<'intro' | 'preparation' | 'interview' | 'analysis' | 'results' | 'next'>('intro');
  const [showTask, setShowTask] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [interviewResult, setInterviewResult] = useState<InterviewResult | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [interviewQuestions, setInterviewQuestions] = useState<InterviewQuestion[]>([]);
  const [responses, setResponses] = useState<Record<number, string>>({});
  const [currentResponse, setCurrentResponse] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [processingStage, setProcessingStage] = useState("");
  const [confidenceScore, setConfidenceScore] = useState(75);
  const [showApiKeyNotification, setShowApiKeyNotification] = useState(false);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0 && isTimerActive) {
      handleTimeUp();
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timeRemaining]);

  const startInterview = async () => {
    // Check if API key is available
    const apiKey = localStorage.getItem('geminiApiKey');
    if (!apiKey) {
      setShowApiKeyNotification(true);
      // Hide notification after 5 seconds
      setTimeout(() => setShowApiKeyNotification(false), 5000);
    }
    
    setCurrentPhase('preparation');
    setIsGeneratingQuestions(true);
    setProcessingStage("Generating personalized interview questions...");
    
    try {
      const questions = await conductTechnicalInterview();
      setInterviewQuestions(questions);
      setProcessingStage("Interview ready!");
      setTimeout(() => setCurrentPhase('interview'), 1500);
    } catch (error) {
      console.error('Error generating interview questions:', error);
      // Fallback questions
      const fallbackQuestions: InterviewQuestion[] = [
        {
          id: 1,
          question: "Walk me through how you would design a REST API for a social media platform. What endpoints would you create and why?",
          type: 'technical',
          difficulty: 'medium',
          category: 'System Design',
          timeLimit: 8
        },
        {
          id: 2,
          question: "Describe a challenging project you've worked on. How did you approach the problem and what was the outcome?",
          type: 'behavioral',
          difficulty: 'medium',
          category: 'Problem Solving',
          timeLimit: 6
        },
        {
          id: 3,
          question: "You're working on a team project with a tight deadline, and a team member isn't contributing effectively. How would you handle this situation?",
          type: 'scenario',
          difficulty: 'medium',
          category: 'Teamwork',
          timeLimit: 5
        }
      ];
      setInterviewQuestions(fallbackQuestions);
      setCurrentPhase('interview');
    }
    setIsGeneratingQuestions(false);
  };

  const handleAnswerSubmit = () => {
    if (!currentResponse.trim()) {
      alert('Please provide an answer before submitting.');
      return;
    }

    setResponses(prev => ({
      ...prev,
      [interviewQuestions[currentQuestionIndex].id]: currentResponse
    }));

    setCurrentResponse("");
    setIsTimerActive(false);

    if (currentQuestionIndex < interviewQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      const nextQuestion = interviewQuestions[currentQuestionIndex + 1];
      setTimeRemaining(nextQuestion.timeLimit * 60);
      setIsTimerActive(true);
    } else {
      // Interview complete
      finishInterview();
    }
  };

  const handleTimeUp = () => {
    setIsTimerActive(false);
    if (currentResponse.trim()) {
      setResponses(prev => ({
        ...prev,
        [interviewQuestions[currentQuestionIndex].id]: currentResponse
      }));
    }
    
    if (currentQuestionIndex < interviewQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      const nextQuestion = interviewQuestions[currentQuestionIndex + 1];
      setTimeRemaining(nextQuestion.timeLimit * 60);
      setIsTimerActive(true);
    } else {
      finishInterview();
    }
    setCurrentResponse("");
  };

  const finishInterview = async () => {
    // Check if API key is available for analysis
    const apiKey = localStorage.getItem('geminiApiKey');
    if (!apiKey) {
      setShowApiKeyNotification(true);
      // Hide notification after 5 seconds
      setTimeout(() => setShowApiKeyNotification(false), 5000);
    }
    
    setCurrentPhase('analysis');
    setIsAnalyzing(true);
    setProcessingStage("Analyzing interview performance...");
    setConfidenceScore(65);

    try {
      const result = await analyzeInterviewPerformance(interviewQuestions, responses);
      setInterviewResult(result);
      setCurrentPhase('results');
      setIsDrawerOpen(true);
    } catch (error) {
      console.error('Error analyzing interview:', error);
      // Fallback result
      const fallbackResult: InterviewResult = {
        overallScore: 78,
        technicalScore: 75,
        communicationScore: 82,
        problemSolvingScore: 76,
        culturalFitScore: 80,
        strengths: ["Clear communication", "Structured thinking", "Technical knowledge"],
        improvementAreas: ["System design depth", "Real-world experience"],
        detailedFeedback: "Strong foundational knowledge with good communication skills. Continue developing practical experience with larger systems.",
        recommendation: "Proceed to next round",
        nextSteps: ["Technical assignment", "Team collaboration exercise", "Final interview with hiring manager"],
        technicalInsights: "Demonstrates solid understanding of core concepts. Focus on expanding practical implementation experience.",
        behavioralInsights: "Strong communication skills and professional attitude. Good cultural fit indicators.",
        growthPotential: "High potential for growth with structured learning path and mentorship.",
        interviewQuality: "Well-prepared and engaged responses demonstrate genuine interest in the role."
      };
      setInterviewResult(fallbackResult);
      setCurrentPhase('results');
      setIsDrawerOpen(true);
    }
    setIsAnalyzing(false);
  };

  const handleProceedToNextScene = () => {
    router.push("/progressive-learning");
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Start timer for first question when interview begins
  useEffect(() => {
    if (currentPhase === 'interview' && interviewQuestions.length > 0 && !isTimerActive) {
      const firstQuestion = interviewQuestions[0];
      setTimeRemaining(firstQuestion.timeLimit * 60);
      setIsTimerActive(true);
    }
  }, [currentPhase, interviewQuestions]);

  // Preparation Phase
  if (currentPhase === 'preparation') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="relative mb-8">
            <div className="animate-pulse">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mx-auto flex items-center justify-center">
                <Brain className="w-10 h-10 text-white animate-bounce" />
              </div>
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white animate-spin" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-indigo-700 mb-2">Preparing Your Interview</h3>
          <p className="text-gray-600 mb-4">AI is customizing questions based on your profile...</p>
          <div className="bg-white/90 backdrop-blur rounded-lg p-4 shadow-lg">
            <p className="text-sm text-gray-700">{processingStage}</p>
          </div>
        </div>
      </div>
    );
  }

  // Interview Phase
  if (currentPhase === 'interview' && interviewQuestions.length > 0) {
    const currentQuestion = interviewQuestions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / interviewQuestions.length) * 100;

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Technical Interview</h1>
                <p className="text-gray-600">Question {currentQuestionIndex + 1} of {interviewQuestions.length}</p>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${timeRemaining <= 60 ? 'text-red-600' : 'text-blue-600'}`}>
                  <Clock className="w-5 h-5 inline mr-1" />
                  {formatTime(timeRemaining)}
                </div>
                <p className="text-sm text-gray-500">Time remaining</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
              <div 
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>

            {/* Question Info */}
            <div className="flex items-center gap-4 mb-6">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                currentQuestion.type === 'technical' ? 'bg-blue-100 text-blue-800' :
                currentQuestion.type === 'behavioral' ? 'bg-green-100 text-green-800' :
                'bg-purple-100 text-purple-800'
              }`}>
                {currentQuestion.type}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                currentQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                currentQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {currentQuestion.difficulty}
              </span>
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                {currentQuestion.category}
              </span>
            </div>

            {/* Question */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                {currentQuestion.question}
              </h2>
              <p className="text-sm text-blue-700">
                Take your time to think through your response. Consider structure, examples, and clarity.
              </p>
            </div>

            {/* Response Area */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Response:
              </label>
              <textarea
                value={currentResponse}
                onChange={(e) => setCurrentResponse(e.target.value)}
                placeholder="Type your detailed response here..."
                className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                disabled={timeRemaining === 0}
              />
              <p className="text-sm text-gray-500 mt-2">
                {currentResponse.length} characters • Be specific and provide examples where possible
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between">
              <button
                onClick={handleTimeUp}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Skip Question
              </button>
              <button
                onClick={handleAnswerSubmit}
                disabled={!currentResponse.trim()}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {currentQuestionIndex === interviewQuestions.length - 1 ? 'Finish Interview' : 'Next Question'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Analysis Phase
  if (currentPhase === 'analysis') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-100 flex items-center justify-center">
        <div className="text-center max-w-lg mx-auto">
          <div className="relative mb-8">
            <div className="animate-pulse">
              <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full mx-auto flex items-center justify-center">
                <Bot className="w-12 h-12 text-white animate-bounce" />
              </div>
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white animate-spin" />
            </div>
          </div>
          
          <div className="flex items-center justify-center mb-6">
            <Brain className="w-6 h-6 text-indigo-600 mr-2" />
            <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Interview Analysis
            </h3>
          </div>
          
          <div className="space-y-4 mb-8">
            <div className="bg-white/90 backdrop-blur rounded-lg p-4 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-indigo-700 font-medium">Technical Assessment</span>
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div className="w-full bg-indigo-100 rounded-full h-2">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full w-full"></div>
              </div>
            </div>
            
            <div className="bg-white/90 backdrop-blur rounded-lg p-4 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-700 font-medium">Communication Analysis</span>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-300 border-t-blue-600"></div>
              </div>
              <div className="w-full bg-blue-100 rounded-full h-2">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full w-4/5 animate-pulse"></div>
              </div>
            </div>
            
            <div className="bg-white/90 backdrop-blur rounded-lg p-4 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-green-700 font-medium">Problem-Solving Evaluation</span>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-green-300 border-t-green-600"></div>
              </div>
              <div className="w-full bg-green-100 rounded-full h-2">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full w-3/4 animate-pulse"></div>
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5 text-purple-600 mr-2 animate-pulse" />
              <span className="text-lg font-semibold text-purple-700">AI Processing</span>
            </div>
            <p className="text-gray-700 mb-2">{processingStage}</p>
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
              <span>Analysis Progress:</span>
              <div className="bg-gradient-to-r from-purple-400 to-indigo-500 text-white px-2 py-1 rounded font-medium">
                {confidenceScore}%
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Results Phase
  if (currentPhase === 'results') {
    return (
      <div className="h-screen bg-gray-100 flex flex-col relative">
        {/* Welcome Text in Background */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none z-0">
          <h1 className="text-4xl font-bold text-gray-300 mb-2">Interview Complete!</h1>
          <p className="text-lg text-gray-400">Review your feedback and proceed to next steps.</p>
        </div>

        {/* Mail Icon Button (top right) */}
        {interviewResult && (
          <button
            className="fixed top-6 right-8 z-50 bg-indigo-600 text-white rounded-full p-4 shadow-lg hover:bg-indigo-700 transition-colors duration-300"
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            aria-label={isDrawerOpen ? "Close Mail" : "Open Mail"}
          >
            <Mail className="w-7 h-7" />
          </button>
        )}

        {/* Overlay */}
        {isDrawerOpen && (
          <div
            className="fixed inset-0 bg-opacity-10 z-40 transition-opacity duration-300"
            onClick={() => setIsDrawerOpen(false)}
            style={{ opacity: isDrawerOpen ? 1 : 0 }}
          />
        )}

        {/* Side Drawer */}
        <div
          className={`fixed top-0 right-0 h-full w-full sm:w-[480px] bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
          style={{ pointerEvents: isDrawerOpen ? 'auto' : 'none' }}
        >
          {isDrawerOpen && (
            <>
              {/* Close Drawer Button */}
              <div className="flex justify-end px-4 pt-2">
                <button
                  className="ml-2 p-2 hover:bg-gray-200 rounded-full text-2xl font-bold text-gray-500"
                  aria-label="Close"
                  onClick={() => setIsDrawerOpen(false)}
                >
                  ×
                </button>
              </div>
              {interviewResult && (
                <MailConversation initialConversation={createInterviewEmail(interviewResult)} />
              )}
            </>
          )}
        </div>

        {/* Main Content */}
        <div className="relative z-10 flex-1 overflow-y-auto">
          {/* Header */}
          <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-6 py-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">Interview Results</h1>
                  <p className="text-gray-600 mt-1">Your performance evaluation and next steps</p>
                </div>
                <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded">
                  Scene 2 of 12
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-6 py-8">
            {/* Results Summary */}
            {interviewResult && (
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
                <h2 className="text-lg font-medium text-gray-900 mb-6">Interview Performance Summary</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-indigo-600">{interviewResult.overallScore}%</div>
                    <div className="text-sm text-gray-600">Overall Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{interviewResult.technicalScore}%</div>
                    <div className="text-sm text-gray-600">Technical</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{interviewResult.communicationScore}%</div>
                    <div className="text-sm text-gray-600">Communication</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">{interviewResult.problemSolvingScore}%</div>
                    <div className="text-sm text-gray-600">Problem Solving</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-800 mb-2 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Strengths
                    </h4>
                    <ul className="text-green-700 text-sm space-y-1">
                      {interviewResult.strengths.map((strength, index) => (
                        <li key={index}>• {strength}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h4 className="font-semibold text-orange-800 mb-2 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Growth Areas
                    </h4>
                    <ul className="text-orange-700 text-sm space-y-1">
                      {interviewResult.improvementAreas.map((area, index) => (
                        <li key={index}>• {area}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Enhanced AI Analysis Insights */}
                {(interviewResult.technicalInsights || interviewResult.behavioralInsights || 
                  interviewResult.growthPotential || interviewResult.interviewQuality) && (
                  <div className="mt-8 space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                      🤖 Advanced AI Analysis
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {interviewResult.technicalInsights && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                            <Bot className="w-4 h-4 mr-2" />
                            Technical Assessment
                          </h4>
                          <p className="text-blue-700 text-sm leading-relaxed">
                            {interviewResult.technicalInsights}
                          </p>
                        </div>
                      )}
                      
                      {interviewResult.behavioralInsights && (
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                          <h4 className="font-semibold text-purple-800 mb-2 flex items-center">
                            <Users className="w-4 h-4 mr-2" />
                            Behavioral Analysis
                          </h4>
                          <p className="text-purple-700 text-sm leading-relaxed">
                            {interviewResult.behavioralInsights}
                          </p>
                        </div>
                      )}
                      
                      {interviewResult.growthPotential && (
                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                          <h4 className="font-semibold text-indigo-800 mb-2 flex items-center">
                            <Sparkles className="w-4 h-4 mr-2" />
                            Growth Potential
                          </h4>
                          <p className="text-indigo-700 text-sm leading-relaxed">
                            {interviewResult.growthPotential}
                          </p>
                        </div>
                      )}
                      
                      {interviewResult.interviewQuality && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                          <h4 className="font-semibold text-emerald-800 mb-2 flex items-center">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Interview Quality
                          </h4>
                          <p className="text-emerald-700 text-sm leading-relaxed">
                            {interviewResult.interviewQuality}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Detailed Feedback Section */}
                <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <Brain className="w-5 h-5 mr-2" />
                    Detailed AI Feedback
                  </h4>
                  <p className="text-gray-700 leading-relaxed text-sm">
                    {interviewResult.detailedFeedback}
                  </p>
                  
                  <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg">
                    <h5 className="font-medium text-gray-800 mb-2">📋 Recommendation</h5>
                    <p className="text-gray-700 font-medium">{interviewResult.recommendation}</p>
                    
                    {interviewResult.nextSteps.length > 0 && (
                      <div className="mt-3">
                        <h5 className="font-medium text-gray-800 mb-2">🎯 Next Steps</h5>
                        <ul className="text-gray-700 text-sm space-y-1">
                          {interviewResult.nextSteps.map((step, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-blue-600 mr-2">•</span>
                              {step}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Proceed Button for passing scores */}
                {interviewResult.overallScore >= 70 && (
                  <div className="text-center pt-6 border-t border-gray-200 mt-6">
                    <p className="text-sm text-gray-700 mb-4">
                      Congratulations! You've successfully completed the technical interview.
                    </p>
                    <button
                      onClick={handleProceedToNextScene}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
                    >
                      Continue to Learning Phase 🚀
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (showTask) {
    return (
      <div className="h-screen bg-gray-100 flex flex-col relative">
        {/* API Key Notification Banner */}
        {showApiKeyNotification && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 shadow-lg">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                <span className="font-medium">
                  AI features are using fallback data. For personalized results, set your Gemini API key in browser localStorage with key 'geminiApiKey'.
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline ml-2">
                    Get API Key
                  </a>
                </span>
              </div>
              <button 
                onClick={() => setShowApiKeyNotification(false)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Welcome Text in Background */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none z-0">
          <h1 className="text-4xl font-bold text-gray-300 mb-2">Technical Interview Phase</h1>
          <p className="text-lg text-gray-400">Demonstrate your technical knowledge and problem-solving skills.</p>
        </div>

        {/* Main Content */}
        <div className="relative z-10 flex-1 overflow-y-auto">
          {/* Header */}
          <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-6 py-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">Technical Interview</h1>
                  <p className="text-gray-600 mt-1">Showcase your technical expertise and communication skills</p>
                </div>
                <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded">
                  Scene 2 of 12
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-6 py-8">
            {/* Objective */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
              <h2 className="text-lg font-medium text-gray-900 mb-3">Objective</h2>
              <p className="text-gray-700 leading-relaxed">
                Complete a comprehensive technical interview consisting of technical, behavioral, and scenario-based questions. 
                This interview will assess your problem-solving abilities, communication skills, and cultural fit for the VelsyMedia team.
              </p>
            </div>

            {/* Requirements */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Interview Format</h3>
              <div className="markdown-body">
                <MDtoHTML
                  markdown={requirementsMarkdown}
                  className="prose max-w-none text-sm text-gray-700"
                />
              </div>
            </div>

            {/* Interview Info */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Interview Guidelines</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Each question has a time limit. Think aloud and explain your reasoning. 
                    The AI interviewer will evaluate your responses for technical accuracy, communication clarity, and problem-solving approach.
                  </p>
                </div>
              </div>
            </div>

            {/* Start Interview Button */}
            <div className="text-center">
              <button
                onClick={startInterview}
                disabled={isGeneratingQuestions}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center mx-auto"
              >
                {isGeneratingQuestions ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Preparing Interview...
                  </>
                ) : (
                  <>
                    <Video className="w-5 h-5 mr-2" />
                    Start Technical Interview
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // This should not be reached since showTask is initialized to true
  return (
    <div className="h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

export default Scene2Page;
