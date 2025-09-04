"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { progressiveLearningAgent } from "./service/progressiveLearningAgent";

interface ProgressiveScenario {
    id: string;
    title: string;
    scenario: string;
    context: string;
    expectedOutcome: string;
    difficulty: number;
    skillsRequired: string[];
}

interface UserResponse {
    scenarioId: string;
    answer: string;
    timestamp: string;
    feedback?: {
        score: number;
        strengths: string[];
        improvements: string[];
        nextFocus: string;
    };
}

interface LearningSession {
    userId: string;
    domain: string;
    level: string;
    scenarios: ProgressiveScenario[];
    responses: UserResponse[];
    currentScenarioIndex: number;
    overallProgress: {
        completedScenarios: number;
        averageScore: number;
        skillProgression: Record<string, number>;
    };
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
    const [currentFeedback, setCurrentFeedback] = useState<UserResponse['feedback'] | null>(null);

    const domainData = {
        ai: { name: "Artificial Intelligence", icon: "🤖" },
        cloud: { name: "Cloud Computing", icon: "☁️" }
    };

    const currentDomain = domain && domainData[domain as keyof typeof domainData] 
        ? domainData[domain as keyof typeof domainData] 
        : domainData.ai;

    // Initialize learning session
    useEffect(() => {
        if (domain && level) {
            initializeLearningSession();
        }
    }, [domain, level]);

    const initializeLearningSession = async () => {
        setIsLoading(true);
        try {
            // Generate initial scenario based on domain and level
            const initialScenario = await generateNextScenario(domain!, level!, []);
            
            const session: LearningSession = {
                userId: `user_${Date.now()}`, // In real app, get from auth
                domain: domain!,
                level: level!,
                scenarios: [initialScenario],
                responses: [],
                currentScenarioIndex: 0,
                overallProgress: {
                    completedScenarios: 0,
                    averageScore: 0,
                    skillProgression: {}
                }
            };
            
            setLearningSession(session);
        } catch (error) {
            console.error('Error initializing learning session:', error);
        }
        setIsLoading(false);
    };

    const generateNextScenario = async (
        domain: string, 
        level: string, 
        previousResponses: UserResponse[]
    ): Promise<ProgressiveScenario> => {
        const systemPrompt = `You are a senior ${domain.toUpperCase()} mentor creating progressive learning scenarios.

Your task is to generate a single, engaging workplace scenario for ${level} level learners.

CONTEXT ANALYSIS:
${previousResponses.length > 0 ? `
Previous User Performance:
${previousResponses.map((resp, idx) => `
Scenario ${idx + 1}: Score ${resp.feedback?.score || 0}/100
Strengths: ${resp.feedback?.strengths?.join(', ') || 'None identified'}
Areas for improvement: ${resp.feedback?.improvements?.join(', ') || 'None identified'}
User's approach: ${resp.answer.substring(0, 200)}...
`).join('\n')}

Based on this history, create a scenario that:
1. Builds on their demonstrated strengths
2. Addresses their specific improvement areas
3. Progressively increases difficulty
4. Focuses on their next learning priority
` : `
This is the first scenario. Create an engaging introduction that:
1. Matches their ${level} level expectations
2. Tests fundamental ${domain} concepts
3. Sets up a progression pathway
`}

SCENARIO REQUIREMENTS:
- Create a realistic workplace situation with specific details
- Include time pressure, stakeholders, and business context
- Make it relatable and engaging
- Provide clear success criteria
- Focus on practical problem-solving skills

Return ONLY valid JSON:
{
  "id": "scenario_${Date.now()}",
  "title": "Engaging scenario title",
  "scenario": "Detailed workplace story with specific context, stakeholders, and challenges. Include dialogue and realistic constraints.",
  "context": "Background information needed to understand the situation",
  "expectedOutcome": "What a good response should demonstrate",
  "difficulty": ${previousResponses.length + 1},
  "skillsRequired": ["skill1", "skill2", "skill3"]
}`;

        const userPrompt = `Generate a progressive learning scenario for ${domain} domain at ${level} level.

${previousResponses.length > 0 ? 
`This is scenario #${previousResponses.length + 1}. Base it on the user's previous performance and create appropriate progression.` :
`This is the first scenario. Create an engaging introduction to ${domain} concepts.`}

Make it feel like a real workplace challenge that helps them grow step by step.`;

        try {
            const response = await getResponseForGivenPrompt(systemPrompt, userPrompt);
            let cleanedResponse = response.trim();
            
            if (cleanedResponse.startsWith('```json')) {
                cleanedResponse = cleanedResponse.replace(/```json\n?/, '').replace(/\n?```$/, '');
            } else if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.replace(/```\n?/, '').replace(/\n?```$/, '');
            }
            
            return JSON.parse(cleanedResponse);
        } catch (error) {
            console.error('Error generating scenario:', error);
            return getFallbackScenario(domain, level, previousResponses.length);
        }
    };

    const getFallbackScenario = (domain: string, level: string, scenarioNumber: number): ProgressiveScenario => {
        const aiScenarios = [
            {
                id: `scenario_${Date.now()}`,
                title: "Your First Data Challenge",
                scenario: "Welcome to DataTech Inc! You've just started as a junior data analyst. Your manager, Sarah, walks over to your desk with a concerned look: 'Hey, I need your help. Our customer support team says they're getting more complaints lately, but they can't figure out if it's actually increasing or just feels that way. We have all the support ticket data, but no one has time to analyze it. Could you take a look and let me know what's really happening by Friday's team meeting?'",
                context: "You have access to 6 months of customer support ticket data including ticket types, resolution times, customer satisfaction scores, and timestamps.",
                expectedOutcome: "Demonstrate systematic data analysis approach, clear communication of findings, and actionable insights for the team.",
                difficulty: 1,
                skillsRequired: ["data analysis", "business communication", "problem identification"]
            }
        ];
        
        const cloudScenarios = [
            {
                id: `scenario_${Date.now()}`,
                title: "Your First Deployment Challenge",
                scenario: "Welcome to CloudStart Corp! It's your second week as a junior cloud engineer. Your team lead, Mike, stops by your desk: 'Hey, I've got a perfect learning opportunity for you. We need to deploy a simple company blog to the cloud. It's just a WordPress site, nothing too complex, but the marketing team wants it live by next Tuesday for their campaign launch. Think you can handle it? I'll be here if you need guidance.'",
                context: "You have access to AWS console, basic WordPress files, and a small budget for cloud resources. The marketing team expects the site to handle moderate traffic.",
                expectedOutcome: "Demonstrate understanding of basic cloud services, deployment planning, and communication about technical decisions.",
                difficulty: 1,
                skillsRequired: ["cloud basics", "deployment planning", "resource selection"]
            }
        ];
        
        return domain === 'ai' ? aiScenarios[0] : cloudScenarios[0];
    };

    const evaluateAnswer = async (scenario: ProgressiveScenario, answer: string): Promise<UserResponse['feedback']> => {
        const systemPrompt = `You are a senior ${domain?.toUpperCase()} mentor providing constructive feedback on a learning scenario response.

EVALUATION CRITERIA:
1. Problem-solving approach (40%)
2. Technical understanding (30%) 
3. Communication clarity (20%)
4. Practical feasibility (10%)

SCENARIO CONTEXT:
Title: ${scenario.title}
Scenario: ${scenario.scenario}
Expected Skills: ${scenario.skillsRequired.join(', ')}
Difficulty Level: ${scenario.difficulty}/10

USER'S RESPONSE:
${answer}

Provide encouraging but honest feedback that helps them grow. Focus on specific strengths and actionable improvements.

Return ONLY valid JSON:
{
  "score": number (0-100),
  "strengths": ["specific strength 1", "specific strength 2"],
  "improvements": ["specific improvement area 1", "specific improvement area 2"],
  "nextFocus": "What they should focus on for the next scenario"
}`;

        const userPrompt = `Evaluate this response to the ${domain} scenario. Provide specific, actionable feedback that encourages growth while being honest about areas for improvement.`;

        try {
            const response = await getResponseForGivenPrompt(systemPrompt, userPrompt);
            let cleanedResponse = response.trim();
            
            if (cleanedResponse.startsWith('```json')) {
                cleanedResponse = cleanedResponse.replace(/```json\n?/, '').replace(/\n?```$/, '');
            } else if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.replace(/```\n?/, '').replace(/\n?```$/, '');
            }
            
            return JSON.parse(cleanedResponse);
        } catch (error) {
            console.error('Error evaluating answer:', error);
            return {
                score: 75,
                strengths: ["Shows good thinking process", "Demonstrates willingness to learn"],
                improvements: ["Could provide more specific details", "Consider additional factors"],
                nextFocus: "Focus on practical implementation steps"
            };
        }
    };

    const handleSubmitAnswer = async () => {
        if (!currentAnswer.trim() || !learningSession) return;
        
        setIsLoading(true);
        
        try {
            const currentScenario = learningSession.scenarios[learningSession.currentScenarioIndex];
            const feedback = await evaluateAnswer(currentScenario, currentAnswer);
            
            const response: UserResponse = {
                scenarioId: currentScenario.id,
                answer: currentAnswer,
                timestamp: new Date().toISOString(),
                feedback
            };

            // Store response in GitHub (simulated for now)
            await storeResponseInGitHub(response);
            
            // Update learning session
            const updatedSession = {
                ...learningSession,
                responses: [...learningSession.responses, response],
                overallProgress: {
                    ...learningSession.overallProgress,
                    completedScenarios: learningSession.overallProgress.completedScenarios + 1,
                    averageScore: calculateAverageScore([...learningSession.responses, response])
                }
            };
            
            setLearningSession(updatedSession);
            setCurrentFeedback(feedback);
            setShowFeedback(true);
            setCurrentAnswer("");
            
        } catch (error) {
            console.error('Error submitting answer:', error);
        }
        
        setIsLoading(false);
    };

    const storeResponseInGitHub = async (response: UserResponse) => {
        // Simulate storing to GitHub repo
        // In real implementation, use GitHub API to store as markdown files
        console.log('Storing response to GitHub:', response);
        
        const markdownContent = `# Scenario Response

## Scenario ID: ${response.scenarioId}
## Timestamp: ${response.timestamp}

### User Answer:
${response.answer}

### AI Feedback:
- **Score:** ${response.feedback?.score}/100
- **Strengths:** ${response.feedback?.strengths?.join(', ')}
- **Improvements:** ${response.feedback?.improvements?.join(', ')}
- **Next Focus:** ${response.feedback?.nextFocus}
`;
        
        // Store in localStorage for now (in real app, use GitHub API)
        const existingData = JSON.parse(localStorage.getItem('learningResponses') || '[]');
        existingData.push({ ...response, markdownContent });
        localStorage.setItem('learningResponses', JSON.stringify(existingData));
    };

    const calculateAverageScore = (responses: UserResponse[]): number => {
        if (responses.length === 0) return 0;
        const total = responses.reduce((sum, resp) => sum + (resp.feedback?.score || 0), 0);
        return Math.round(total / responses.length);
    };

    const handleNextScenario = async () => {
        if (!learningSession) return;
        
        setIsLoading(true);
        setShowFeedback(false);
        
        try {
            // Generate next scenario based on user's performance
            const nextScenario = await generateNextScenario(
                learningSession.domain,
                learningSession.level,
                learningSession.responses
            );
            
            const updatedSession = {
                ...learningSession,
                scenarios: [...learningSession.scenarios, nextScenario],
                currentScenarioIndex: learningSession.currentScenarioIndex + 1
            };
            
            setLearningSession(updatedSession);
        } catch (error) {
            console.error('Error generating next scenario:', error);
        }
        
        setIsLoading(false);
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
                        {learningSession ? 'Generating Your Next Challenge...' : 'Setting Up Your Learning Journey...'}
                    </h3>
                    <p className="text-gray-600">
                        {learningSession ? 'Creating a scenario based on your progress' : 'Preparing personalized scenarios'}
                    </p>
                </div>
            </div>
        );
    }

    if (!learningSession) {
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

    const currentScenario = learningSession.scenarios[learningSession.currentScenarioIndex];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
            <div className="max-w-4xl mx-auto">
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
                        <div className="text-right">
                            <div className="text-sm text-gray-500">Progress</div>
                            <div className="text-xl font-bold text-blue-600">
                                {learningSession.overallProgress.completedScenarios}/{learningSession.scenarios.length}
                            </div>
                            {learningSession.overallProgress.averageScore > 0 && (
                                <div className="text-sm text-gray-600">
                                    Avg: {learningSession.overallProgress.averageScore}%
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ 
                                width: `${(learningSession.overallProgress.completedScenarios / Math.max(learningSession.scenarios.length, 1)) * 100}%` 
                            }}
                        ></div>
                    </div>
                </div>

                {/* Current Scenario */}
                {!showFeedback && (
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <div className="mb-6">
                            <div className="flex items-center space-x-2 mb-4">
                                <div className="text-2xl">📝</div>
                                <h2 className="text-2xl font-bold text-gray-800">{currentScenario.title}</h2>
                                <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                    Scenario {learningSession.currentScenarioIndex + 1}
                                </div>
                            </div>
                            
                            {currentScenario.context && (
                                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                                    <p className="text-sm text-yellow-800">
                                        <strong>Context:</strong> {currentScenario.context}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="bg-gray-50 rounded-lg p-6 mb-6">
                            <p className="text-gray-700 leading-relaxed text-lg">
                                {currentScenario.scenario}
                            </p>
                        </div>

                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-gray-700">
                                How would you handle this situation? Share your approach:
                            </label>
                            <textarea
                                value={currentAnswer}
                                onChange={(e) => setCurrentAnswer(e.target.value)}
                                placeholder="Describe your approach, thinking process, and specific steps you would take..."
                                className="w-full h-40 p-4 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
                                rows={6}
                            />
                            <button
                                onClick={handleSubmitAnswer}
                                disabled={!currentAnswer.trim() || isLoading}
                                className="w-full px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors text-lg"
                            >
                                Submit My Answer →
                            </button>
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
                                Great Work!
                            </h2>
                            <div className="text-4xl font-bold text-blue-600 mb-2">
                                {currentFeedback.score}%
                            </div>
                            <p className="text-gray-600">
                                Scenario {learningSession.currentScenarioIndex + 1} Complete
                            </p>
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

                        <div className="text-center">
                            <button
                                onClick={handleNextScenario}
                                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold text-lg shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
                            >
                                Next Challenge 🚀
                            </button>
                        </div>
                    </div>
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
