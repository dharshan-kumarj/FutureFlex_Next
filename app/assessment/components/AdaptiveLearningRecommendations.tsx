"use client";

import React from 'react';

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

interface AdaptiveLearningRecommendationsProps {
    assessmentResult: AssessmentResult;
    domain: string;
    claimedLevel: string;
}

const AdaptiveLearningRecommendations: React.FC<AdaptiveLearningRecommendationsProps> = ({
    assessmentResult,
    domain,
    claimedLevel
}) => {
    const getDifficultyRecommendation = () => {
        const { score, actualLevel, isValidForChosenLevel, industryReadiness } = assessmentResult;
        
        if (!isValidForChosenLevel && actualLevel === 'Beginner' && claimedLevel === 'intermediate') {
            return {
                suggestedPath: 'foundational',
                intensity: 'guided',
                timeframe: '3-4 months',
                focus: 'Building strong fundamentals',
                warning: true,
                message: 'We recommend starting with foundational content to build a solid base before advancing to intermediate topics.'
            };
        }
        
        if (score >= 85 && industryReadiness >= 70) {
            return {
                suggestedPath: 'accelerated',
                intensity: 'challenge-based',
                timeframe: '1-2 months',
                focus: 'Advanced applications and leadership',
                warning: false,
                message: 'You\'re ready for accelerated learning with challenging real-world projects.'
            };
        }
        
        if (score >= 70 && industryReadiness >= 50) {
            return {
                suggestedPath: 'standard',
                intensity: 'project-based',
                timeframe: '2-3 months',
                focus: 'Practical applications and skills',
                warning: false,
                message: 'Standard progression with hands-on projects will suit your current skill level.'
            };
        }
        
        return {
            suggestedPath: 'supportive',
            intensity: 'mentored',
            timeframe: '4-6 months',
            focus: 'Skill building with guidance',
            warning: false,
            message: 'A supportive learning environment with mentorship will help you progress effectively.'
        };
    };

    const getSpecificRecommendations = () => {
        const { actualLevel, industryReadiness, strengths, weaknesses } = assessmentResult;
        
        const domainSpecific = {
            ai: {
                beginner: {
                    immediate: [
                        'Complete Python fundamentals and data manipulation with pandas',
                        'Learn basic machine learning concepts with scikit-learn',
                        'Build 2-3 simple ML projects (prediction, classification)',
                        'Understand data visualization with matplotlib/seaborn'
                    ],
                    shortTerm: [
                        'Explore deep learning basics with TensorFlow/PyTorch',
                        'Learn about model evaluation and validation techniques',
                        'Study data preprocessing and feature engineering',
                        'Build an end-to-end ML project with deployment'
                    ],
                    mediumTerm: [
                        'Specialize in a domain (NLP, computer vision, or recommendation systems)',
                        'Learn MLOps basics and model deployment',
                        'Contribute to open-source ML projects',
                        'Study AI ethics and responsible AI practices'
                    ]
                },
                intermediate: {
                    immediate: [
                        'Master advanced ML algorithms and model optimization',
                        'Learn production ML deployment strategies',
                        'Study MLOps tools (MLflow, Kubeflow, Weights & Biases)',
                        'Build complex, production-ready ML systems'
                    ],
                    shortTerm: [
                        'Develop expertise in model monitoring and drift detection',
                        'Learn advanced deep learning architectures',
                        'Study distributed training and model scaling',
                        'Build ML systems for real business problems'
                    ],
                    mediumTerm: [
                        'Lead ML projects and mentor junior developers',
                        'Specialize in cutting-edge areas (LLMs, reinforcement learning)',
                        'Contribute to ML research or open-source frameworks',
                        'Develop expertise in AI strategy and business impact'
                    ]
                }
            },
            cloud: {
                beginner: {
                    immediate: [
                        'Master cloud fundamentals (AWS/Azure/GCP basics)',
                        'Learn containerization with Docker',
                        'Understand Infrastructure as Code (Terraform basics)',
                        'Build and deploy simple web applications'
                    ],
                    shortTerm: [
                        'Learn Kubernetes fundamentals and container orchestration',
                        'Study CI/CD pipelines and automation',
                        'Understand cloud security and best practices',
                        'Build microservices architecture'
                    ],
                    mediumTerm: [
                        'Specialize in a cloud platform (AWS, Azure, or GCP)',
                        'Learn advanced networking and multi-cloud strategies',
                        'Study DevOps culture and practices',
                        'Build complex, scalable cloud architectures'
                    ]
                },
                intermediate: {
                    immediate: [
                        'Master advanced Kubernetes and service mesh technologies',
                        'Learn cloud-native architecture patterns',
                        'Study advanced CI/CD and GitOps practices',
                        'Implement comprehensive monitoring and observability'
                    ],
                    shortTerm: [
                        'Develop expertise in cloud cost optimization',
                        'Learn serverless and event-driven architectures',
                        'Study disaster recovery and high availability patterns',
                        'Build enterprise-grade cloud solutions'
                    ],
                    mediumTerm: [
                        'Lead cloud transformation initiatives',
                        'Specialize in emerging technologies (edge computing, IoT)',
                        'Develop cloud strategy and governance frameworks',
                        'Mentor teams and drive organizational cloud adoption'
                    ]
                }
            }
        };

        const levelKey = actualLevel.toLowerCase() as 'beginner' | 'intermediate';
        const domainKey = domain as 'ai' | 'cloud';
        
        return domainSpecific[domainKey]?.[levelKey] || domainSpecific.ai.beginner;
    };

    const difficulty = getDifficultyRecommendation();
    const recommendations = getSpecificRecommendations();

    return (
        <div className="space-y-6">
            {/* Adaptive Learning Path */}
            <div className={`rounded-lg p-6 ${difficulty.warning ? 'bg-orange-50 border-2 border-orange-200' : 'bg-green-50 border-2 border-green-200'}`}>
                <div className="flex items-center mb-4">
                    <div className={`text-2xl mr-3 ${difficulty.warning ? 'text-orange-600' : 'text-green-600'}`}>
                        {difficulty.warning ? '⚠️' : '🎯'}
                    </div>
                    <div>
                        <h3 className={`text-xl font-semibold ${difficulty.warning ? 'text-orange-800' : 'text-green-800'}`}>
                            Recommended Learning Path: {difficulty.suggestedPath.charAt(0).toUpperCase() + difficulty.suggestedPath.slice(1)}
                        </h3>
                        <p className={`text-sm ${difficulty.warning ? 'text-orange-600' : 'text-green-600'}`}>
                            {difficulty.intensity} • {difficulty.timeframe} • Focus: {difficulty.focus}
                        </p>
                    </div>
                </div>
                <p className={`${difficulty.warning ? 'text-orange-700' : 'text-green-700'} leading-relaxed`}>
                    {difficulty.message}
                </p>
            </div>

            {/* Phased Learning Recommendations */}
            <div className="grid gap-6">
                <div className="bg-blue-50 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
                        🚀 Immediate Focus (Next 4-6 weeks)
                    </h4>
                    <ul className="space-y-2">
                        {recommendations.immediate.map((item, index) => (
                            <li key={index} className="text-blue-700 flex items-start">
                                <span className="text-blue-500 mr-2 mt-1 font-bold">•</span>
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="bg-purple-50 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-purple-800 mb-3 flex items-center">
                        📈 Short-term Goals (2-3 months)
                    </h4>
                    <ul className="space-y-2">
                        {recommendations.shortTerm.map((item, index) => (
                            <li key={index} className="text-purple-700 flex items-start">
                                <span className="text-purple-500 mr-2 mt-1 font-bold">•</span>
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="bg-indigo-50 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-indigo-800 mb-3 flex items-center">
                        🎯 Medium-term Objectives (6+ months)
                    </h4>
                    <ul className="space-y-2">
                        {recommendations.mediumTerm.map((item, index) => (
                            <li key={index} className="text-indigo-700 flex items-start">
                                <span className="text-indigo-500 mr-2 mt-1 font-bold">•</span>
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Skill Gap Analysis */}
            <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">
                    🔍 Skill Gap Analysis & Priority Matrix
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <h5 className="font-medium text-gray-700 mb-2">High Priority Skills to Develop:</h5>
                        <ul className="text-sm space-y-1">
                            {assessmentResult.weaknesses.slice(0, 3).map((weakness, index) => (
                                <li key={index} className="text-gray-600 flex items-center">
                                    <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                                    {weakness}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h5 className="font-medium text-gray-700 mb-2">Leverage Your Strengths:</h5>
                        <ul className="text-sm space-y-1">
                            {assessmentResult.strengths.slice(0, 3).map((strength, index) => (
                                <li key={index} className="text-gray-600 flex items-center">
                                    <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                                    {strength}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Learning Style Recommendation */}
            <div className="bg-yellow-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-yellow-800 mb-3">
                    🎨 Recommended Learning Approach
                </h4>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                        <div className="text-2xl mb-2">📚</div>
                        <div className="font-medium text-yellow-800">Study Method</div>
                        <div className="text-yellow-700">
                            {assessmentResult.industryReadiness < 50 ? 'Structured courses with assignments' : 'Project-based learning'}
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl mb-2">⏱️</div>
                        <div className="font-medium text-yellow-800">Pace</div>
                        <div className="text-yellow-700">
                            {assessmentResult.score >= 80 ? 'Fast-track with challenges' : 'Steady with practice reinforcement'}
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl mb-2">👥</div>
                        <div className="font-medium text-yellow-800">Support Level</div>
                        <div className="text-yellow-700">
                            {assessmentResult.actualLevel === 'Beginner' ? 'High mentorship' : 'Peer collaboration'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdaptiveLearningRecommendations;
