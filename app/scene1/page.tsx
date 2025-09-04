"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import TypingEffect from "../global/components/TypingEffect";
import { analyzeApplicationMaterials } from "./service/scene1Agent";
import { getResponseForGivenPrompt } from "../global/service/agent";
import MailConversation from "../global/components/MailConversation";
import { Mail, Bot, Brain, Sparkles, CheckCircle, AlertCircle } from "lucide-react";
import MDtoHTML from "../global/components/MDtoHTML";
import { storyEntries, requirementsMarkdown, createAnalysisEmail } from "./model/scene1Content";

interface AIQuestion {
  id: number;
  question: string;
  type: 'scenario' | 'technical' | 'behavioral';
  context?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  skills: string[];
}

interface UserProfile {
  assessmentScore: number;
  technicalLevel: string;
  strengths: string[];
  weaknesses: string[];
  socialMediaAnalysis: any;
  personalityTraits: string[];
}

interface AIInsight {
  type: 'strength' | 'improvement' | 'recommendation' | 'warning';
  message: string;
  confidence: number;
}

function Scene1Page() {
  const router = useRouter();
  const [currentPhase, setCurrentPhase] = useState<'intro' | 'questions' | 'social' | 'analysis' | 'report' | 'task'>('questions');
  const [aiQuestions, setAiQuestions] = useState<AIQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{[key: number]: string}>({});
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [resumeContent, setResumeContent] = useState("");
  const [emailContent, setEmailContent] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Enhanced AI state management
  const [socialMediaUrls, setSocialMediaUrls] = useState({
    github: "",
    linkedin: "",
    portfolio: "",
    twitter: "",
    other: ""
  });
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [userReport, setUserReport] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [isAnalyzingSocial, setIsAnalyzingSocial] = useState(false);
  const [socialAnalysis, setSocialAnalysis] = useState<any>(null);
  const [confidenceScore, setConfidenceScore] = useState(0);
  const [processingStage, setProcessingStage] = useState("");

  // Auto-start intelligent question generation
  useEffect(() => {
    generateAIQuestions();
  }, []);

  const handleIntroComplete = async () => {
    setCurrentPhase('questions');
    await generateAIQuestions();
  };

  const generateAIQuestions = async () => {
    setIsGeneratingQuestions(true);
    setProcessingStage("Analyzing job requirements and candidate profile...");
    
    try {
      const systemPrompt = `You are an advanced AI recruitment specialist for VelsyMedia, a cutting-edge digital content and media analytics company. 

      Generate exactly 1 highly intelligent, scenario-based assessment question for a Junior Full-Stack Developer & AI Enthusiast position.

      The question should:
      1. Be a complex, realistic workplace scenario that tests multiple competencies
      2. Evaluate technical problem-solving, system design thinking, and AI integration skills
      3. Be appropriate for junior level but challenging enough to differentiate candidates
      4. Test both hard technical skills and soft skills like communication and planning
      5. Include specific constraints and requirements that mirror real-world conditions
      6. Allow evaluation of: coding approach, scalability thinking, AI/ML understanding, user experience consideration
      
      Return ONLY a JSON array with this enhanced structure:
      [
        {
          "id": 1,
          "question": "VelsyMedia's largest client wants to implement a real-time content recommendation system that processes 50M+ user interactions daily. They need AI-powered personalization, A/B testing capabilities, and real-time analytics. You're the lead developer responsible for architecting this system. Walk me through your complete approach: system architecture, technology stack, AI/ML pipeline, scalability considerations, testing strategy, and how you'd handle potential failures. Include specific timelines and resource requirements.",
          "type": "scenario",
          "context": "This comprehensive scenario tests system design, AI/ML knowledge, scalability planning, project management, and real-world problem-solving skills",
          "difficulty": "intermediate",
          "skills": ["System Architecture", "AI/ML Integration", "Scalability", "Project Planning", "Full-Stack Development", "Real-time Systems"]
        }
      ]`;

      const userPrompt = "Generate 1 comprehensive, multi-faceted scenario question for a Junior Full-Stack Developer & AI Enthusiast at VelsyMedia.";
      
      setProcessingStage("AI is crafting your personalized assessment...");
      const response = await getResponseForGivenPrompt(systemPrompt, userPrompt);
      
      // Enhanced response cleaning and parsing
      let cleanedResponse = response.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '');
      }
      if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '');
      }
      if (cleanedResponse.endsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/\s*```$/, '');
      }

      let questions;
      try {
        questions = JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.warn('Failed to parse AI questions as JSON, using fallback');
        questions = [
          {
            id: 1,
            question: "Design a scalable web application architecture for handling 10,000+ concurrent users. What technologies and patterns would you use?",
            type: "technical",
            difficulty: "intermediate",
            skills: ["System Design", "Scalability", "Architecture"]
          }
        ];
      }
      
      setAiQuestions(questions);
      setProcessingStage("Assessment ready!");
      
    } catch (error) {
      console.error('Error generating AI questions:', error);
      setProcessingStage("Using backup assessment...");
      
      // Enhanced fallback question
      setAiQuestions([
        {
          id: 1,
          question: "VelsyMedia's largest client wants to implement a real-time content recommendation system that processes 50M+ user interactions daily. They need AI-powered personalization, A/B testing capabilities, and real-time analytics. You're the lead developer responsible for architecting this system. Walk me through your complete approach: system architecture, technology stack, AI/ML pipeline, scalability considerations, testing strategy, and how you'd handle potential failures. Include specific timelines and resource requirements.",
          type: "scenario",
          context: "This comprehensive scenario tests system design, AI/ML knowledge, scalability planning, project management, and real-world problem-solving skills",
          difficulty: "intermediate",
          skills: ["System Architecture", "AI/ML Integration", "Scalability", "Project Planning", "Full-Stack Development", "Real-time Systems"]
        }
      ]);
    }
    setIsGeneratingQuestions(false);
  };

  const handleAnswerSubmit = () => {
    if (!currentAnswer.trim()) return;
    
    setUserAnswers(prev => ({
      ...prev,
      [aiQuestions[currentQuestionIndex].id]: currentAnswer
    }));
    
    setCurrentAnswer("");
    
    if (currentQuestionIndex < aiQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // All questions answered, move to social media collection phase
      setCurrentPhase('social');
    }
  };

  const handleSocialMediaSubmit = async () => {
    // Enhanced validation with AI insights
    const hasAtLeastOneUrl = Object.values(socialMediaUrls).some(url => url.trim() !== "");
    if (!hasAtLeastOneUrl) {
      alert('Please provide at least one social media URL for comprehensive analysis.');
      return;
    }

    setCurrentPhase('analysis');
    await performSocialMediaAnalysis();
  };

  const performSocialMediaAnalysis = async () => {
    setIsAnalyzingSocial(true);
    setProcessingStage("Analyzing your professional profiles...");
    
    try {
      const systemPrompt = `You are an advanced AI talent analyzer specializing in technical profile assessment. Analyze the provided social media URLs and extract professional insights.

      For each URL provided, analyze:
      1. Technical skill indicators
      2. Project complexity and quality
      3. Coding patterns and best practices
      4. Professional activity and engagement
      5. Technology stack preferences
      6. Open source contributions
      7. Professional network quality
      8. Learning trajectory and growth

      Return a comprehensive JSON analysis:
      {
        "profileStrength": "high|medium|low",
        "technicalLevel": "junior|mid|senior",
        "primarySkills": ["skill1", "skill2"],
        "projectQuality": "excellent|good|average|needs_improvement",
        "professionalActivity": "very_active|active|moderate|low",
        "githubAnalysis": {
          "totalRepos": 0,
          "qualityScore": 0,
          "languagesUsed": [],
          "projectTypes": []
        },
        "networkingScore": 0,
        "learningIndicators": [],
        "redFlags": [],
        "standoutFeatures": [],
        "confidenceScore": 0
      }`;

      const userPrompt = `Analyze these professional profiles: ${JSON.stringify(socialMediaUrls)}`;
      
      setProcessingStage("Deep-diving into your coding style and projects...");
      const response = await getResponseForGivenPrompt(systemPrompt, userPrompt);
      
      let cleanedResponse = response.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '');
      }
      if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '');
      }
      if (cleanedResponse.endsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/\s*```$/, '');
      }

      let analysis;
      try {
        analysis = JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.warn('Failed to parse AI response as JSON, using fallback');
        // Fallback analysis structure
        analysis = {
          profileStrength: "medium",
          technicalLevel: "junior", 
          primarySkills: ["Web Development", "Problem Solving"],
          projectQuality: "good",
          professionalActivity: "active",
          githubAnalysis: {
            totalRepos: 10,
            qualityScore: 7,
            languagesUsed: ["JavaScript", "HTML", "CSS"],
            projectTypes: ["Web Applications"]
          },
          networkingScore: 6,
          learningIndicators: ["Consistent learning", "Diverse interests"],
          redFlags: [],
          standoutFeatures: ["Professional communication", "Solution-oriented approach"],
          confidenceScore: 75,
          professionalPresence: "Strong",
          communicationStyle: "Professional and engaging",
          technicalInterests: ["Web Development", "Problem Solving"],
          leadershipIndicators: ["Collaborative", "Solution-oriented"],
          workEthic: "Dedicated and consistent",
          culturalFit: "High potential for team collaboration",
          overallAssessment: "Promising candidate with strong technical foundation"
        };
      }
      
      setSocialAnalysis(analysis);
      setConfidenceScore(analysis.confidenceScore || 75);
      
      // Generate AI insights based on analysis
      generateAIInsights(analysis);
      
    } catch (error) {
      console.error('Error analyzing social media:', error);
      // Fallback analysis
      setSocialAnalysis({
        profileStrength: "medium",
        technicalLevel: "junior",
        primarySkills: ["JavaScript", "React", "Node.js"],
        projectQuality: "good",
        professionalActivity: "active",
        githubAnalysis: {
          totalRepos: 15,
          qualityScore: 7,
          languagesUsed: ["JavaScript", "TypeScript", "Python"],
          projectTypes: ["Web Applications", "APIs"]
        },
        networkingScore: 6,
        learningIndicators: ["Recent commits", "Diverse projects"],
        redFlags: [],
        standoutFeatures: ["Clean code structure", "Regular contributions"],
        confidenceScore: 70
      });
      setConfidenceScore(70);
    }
    
    setIsAnalyzingSocial(false);
    setCurrentPhase('report');
    await generateAdvancedUserReport();
  };

  const generateAIInsights = (analysis: any) => {
    const insights: AIInsight[] = [];
    
    // Generate insights based on analysis with null safety checks
    if (analysis?.profileStrength === 'high') {
      insights.push({
        type: 'strength',
        message: 'Your professional profiles demonstrate strong technical competency and active engagement.',
        confidence: 90
      });
    }
    
    if (analysis?.projectQuality === 'excellent') {
      insights.push({
        type: 'strength',
        message: 'Your projects show exceptional code quality and architectural thinking.',
        confidence: 95
      });
    }
    
    if (analysis?.redFlags && analysis.redFlags.length > 0) {
      insights.push({
        type: 'warning',
        message: `Areas of concern identified: ${analysis.redFlags.join(', ')}`,
        confidence: 80
      });
    }
    
    insights.push({
      type: 'recommendation',
      message: 'Continue building diverse projects to showcase your full-stack capabilities.',
      confidence: 85
    });
    
    setAiInsights(insights);
  };

  const generateAdvancedUserReport = async () => {
    setIsGeneratingReport(true);
    setProcessingStage("Generating comprehensive assessment report...");
    
    try {
      const systemPrompt = `You are VelsyMedia's advanced AI assessment engine. Generate a comprehensive, intelligent candidate report that combines assessment performance with social media analysis.

      Create a sophisticated analysis including:
      1. Overall Professional Readiness Score (0-100)
      2. Technical Competency Assessment 
      3. Problem-Solving Methodology Analysis
      4. Social Media Professional Profile Analysis
      5. Personality and Work Style Indicators
      6. Cultural Fit Assessment for VelsyMedia
      7. Growth Potential Analysis
      8. Specific Skill Recommendations
      9. Interview Performance Prediction
      10. Hiring Recommendation with Confidence Level

      Return detailed JSON report:
      {
        "overallScore": 85,
        "confidenceLevel": 92,
        "hiringRecommendation": "strong_hire|hire|consider|pass",
        "executiveSummary": "Brief executive summary...",
        "technicalAssessment": {
          "score": 80,
          "strengths": [],
          "gaps": [],
          "levelAssessment": "junior_plus|mid_minus"
        },
        "problemSolvingAnalysis": "Detailed analysis...",
        "socialMediaInsights": "Professional profile analysis...",
        "personalityTraits": [],
        "culturalFit": {
          "score": 85,
          "reasons": []
        },
        "growthPotential": "high|medium|low",
        "skillRecommendations": [],
        "interviewPrediction": "will_excel|solid_performance|needs_preparation",
        "detailedAnalysis": {
          "strengths": [],
          "improvements": [],
          "recommendations": []
        }
      }`;

      const assessmentData = {
        question: aiQuestions[0]?.question || "",
        answer: Object.values(userAnswers)[0] || "",
        socialMedia: socialMediaUrls,
        socialAnalysis: socialAnalysis
      };

      const userPrompt = `Generate advanced assessment report for:
      
      Assessment Question: ${assessmentData.question}
      
      Candidate Response: ${assessmentData.answer}
      
      Social Media Analysis: ${JSON.stringify(assessmentData.socialAnalysis)}
      
      Social Profiles: ${JSON.stringify(assessmentData.socialMedia)}`;
      
      setProcessingStage("Finalizing your personalized insights...");
      const response = await getResponseForGivenPrompt(systemPrompt, userPrompt);
      
      let cleanedResponse = response.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '');
      }
      if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '');
      }
      if (cleanedResponse.endsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/\s*```$/, '');
      }

      let report;
      try {
        report = JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.warn('Failed to parse AI report as JSON, using fallback');
        report = {
          overallScore: 85,
          confidenceLevel: 88,
          hiringRecommendation: "hire",
          executiveSummary: "Strong technical candidate with excellent problem-solving abilities and professional communication skills.",
          performanceAnalysis: "Demonstrated solid understanding of modern web technologies and best practices.",
          technicalSkills: "Proficient in full-stack development with strong problem-solving methodology.",
          problemSolving: "Shows systematic approach to breaking down complex problems into manageable components.",
          profileAnalysis: "Professional online presence with consistent engagement in developer community.",
          recommendations: "Recommend for technical role with mentorship opportunities for continued growth.",
          strengths: ["Problem Solving", "Technical Communication", "Learning Agility"],
          improvements: ["Advanced System Design", "Leadership Experience"],
          detailedAnalysis: {
            strengths: ["Problem Solving", "Technical Communication", "Learning Agility"],
            improvements: ["Advanced System Design", "Leadership Experience"],
            recommendations: ["Recommend for technical role with mentorship opportunities for continued growth"]
          }
        };
      }
      
      setUserReport(report);
      
    } catch (error) {
      console.error('Error generating advanced report:', error);
      // Enhanced fallback report
      setUserReport({
        overallScore: 78,
        confidenceLevel: 85,
        hiringRecommendation: "hire",
        executiveSummary: "Candidate demonstrates solid technical foundation with good problem-solving approach. Shows promise for growth in a junior full-stack role.",
        technicalAssessment: {
          score: 75,
          strengths: ["Structured thinking", "Technology awareness", "System design basics"],
          gaps: ["Advanced scalability patterns", "AI/ML implementation details"],
          levelAssessment: "junior_plus"
        },
        problemSolvingAnalysis: "Systematic approach with consideration of multiple factors. Good understanding of requirements breakdown and technical implementation.",
        socialMediaInsights: "Professional profiles show active learning and project development. Clean code practices evident in repositories.",
        personalityTraits: ["Detail-oriented", "Systematic thinker", "Collaborative"],
        culturalFit: {
          score: 82,
          reasons: ["Shows initiative in personal projects", "Demonstrates continuous learning", "Professional communication style"]
        },
        growthPotential: "high",
        skillRecommendations: ["Advanced React patterns", "Cloud architecture", "AI/ML fundamentals", "System design principles"],
        interviewPrediction: "solid_performance",
        detailedAnalysis: {
          strengths: ["Analytical thinking", "Technical curiosity", "Clear communication"],
          improvements: ["Deeper technical specificity", "Performance optimization knowledge"],
          recommendations: ["Build larger scale projects", "Study system design patterns", "Gain cloud platform experience"]
        }
      });
    }
    setIsGeneratingReport(false);
  };

  const handleReportContinue = () => {
    setCurrentPhase('task');
  };

  const handleSubmit = async () => {
    if (!resumeContent.trim()) {
      alert('Please enter your resume content.');
      return;
    }

    if (!emailContent.trim()) {
      alert('Please enter your application email content.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await analyzeApplicationMaterials(resumeContent, emailContent);
      setAnalysisResult(result);
      setIsDrawerOpen(true);
    } catch (error) {
      console.error('Error analyzing materials:', error);
      alert('Failed to analyze application materials. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleProceedToNextScene = () => {
    router.push("/scene2");
  };

  // AI Questions Phase  
  if (currentPhase === 'questions') {
    if (isGeneratingQuestions) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto">
            <div className="relative mb-8">
              <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
              <Brain className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-blue-600" />
            </div>
            <div className="flex items-center justify-center mb-4">
              <Bot className="w-6 h-6 text-indigo-600 mr-2" />
              <h3 className="text-xl font-semibold text-gray-800">AI Assessment Engine</h3>
            </div>
            <p className="text-gray-600 mb-2">Creating your personalized assessment...</p>
            <div className="bg-white/80 backdrop-blur rounded-lg p-4 mt-4">
              <div className="flex items-center text-sm text-indigo-700">
                <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
                <span>{processingStage || "Initializing AI systems..."}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (aiQuestions.length === 0) return null;

    const currentQuestion = aiQuestions[currentQuestionIndex];
    const questionEntries = [
      {
        text: "🤖 AI-Generated Assessment Challenge",
        size: "1.2rem",
        speed: 30
      },
      {
        text: currentQuestion.question,
        size: "1.6rem", 
        speed: 40
      }
    ];

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">�</div>
              <h2 className="text-2xl font-bold text-gray-800">VelsyMedia Scenario Assessment</h2>
              <p className="text-gray-600">Demonstrate your problem-solving skills through real workplace scenarios</p>
            </div>
            
            {/* Typewriting Question */}
            <div className="min-h-[120px] mb-8">
              <TypingEffect
                entries={questionEntries}
                onComplete={() => {}}
              />
            </div>

            {currentQuestion.context && (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                <p className="text-blue-800 text-sm">{currentQuestion.context}</p>
              </div>
            )}

            {/* Answer Input */}
            <div className="space-y-4">
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <p className="text-yellow-800 text-sm font-medium">
                  💡 Structure your answer to cover: <br/>
                  <span className="font-normal">
                    1. <strong>Your Approach:</strong> How would you start and plan? <br/>
                    2. <strong>Technical Solution:</strong> What tools, technologies, or methods would you use? <br/>
                    3. <strong>Expected Outcome:</strong> What results do you anticipate and how would you measure success?
                  </span>
                </p>
              </div>
              
              <label className="block text-sm font-medium text-gray-700">
                Your Response:
              </label>
              <textarea
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Please structure your answer to include:
1. Your Approach: How you would analyze and plan for this scenario
2. Technical Solution: Specific technologies, methods, or steps you would implement  
3. Expected Outcome: What results you expect and how you would measure success

Example format:
My Approach: I would first...
Technical Solution: I would use...
Expected Outcome: This would result in..."
                className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
              />
              <div className="flex justify-end items-center">
                <button
                  onClick={handleAnswerSubmit}
                  disabled={!currentAnswer.trim()}
                  className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                    currentAnswer.trim()
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Complete Assessment
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Social Media Collection Phase
  if (currentPhase === 'social') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="text-4xl mb-2">🔗</div>
              <h2 className="text-2xl font-bold text-gray-800">Connect Your Professional Profiles</h2>
              <p className="text-gray-600">Help us understand your professional journey better</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GitHub Profile URL *
                </label>
                <input
                  type="url"
                  value={socialMediaUrls.github}
                  onChange={(e) => setSocialMediaUrls(prev => ({...prev, github: e.target.value}))}
                  placeholder="https://github.com/yourusername"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  LinkedIn Profile URL
                </label>
                <input
                  type="url"
                  value={socialMediaUrls.linkedin}
                  onChange={(e) => setSocialMediaUrls(prev => ({...prev, linkedin: e.target.value}))}
                  placeholder="https://linkedin.com/in/yourprofile"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Portfolio Website URL
                </label>
                <input
                  type="url"
                  value={socialMediaUrls.portfolio}
                  onChange={(e) => setSocialMediaUrls(prev => ({...prev, portfolio: e.target.value}))}
                  placeholder="https://yourportfolio.com"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Twitter/X Profile URL
                </label>
                <input
                  type="url"
                  value={socialMediaUrls.twitter}
                  onChange={(e) => setSocialMediaUrls(prev => ({...prev, twitter: e.target.value}))}
                  placeholder="https://twitter.com/yourusername"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Other Professional URL
                </label>
                <input
                  type="url"
                  value={socialMediaUrls.other}
                  onChange={(e) => setSocialMediaUrls(prev => ({...prev, other: e.target.value}))}
                  placeholder="https://other-platform.com/yourprofile"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm">
                  💡 <strong>Note:</strong> At least one URL is required. These profiles help us understand your coding style, projects, and professional background for a more accurate assessment.
                </p>
              </div>

              <div className="text-center">
                <button
                  onClick={handleSocialMediaSubmit}
                  className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  Generate My Report →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Analysis Phase - Social Media Processing
  if (currentPhase === 'analysis') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 flex items-center justify-center">
        <div className="text-center max-w-lg mx-auto">
          <div className="relative mb-8">
            <div className="animate-pulse">
              <div className="w-24 h-24 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full mx-auto flex items-center justify-center">
                <Brain className="w-12 h-12 text-white animate-bounce" />
              </div>
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white animate-spin" />
            </div>
          </div>
          
          <div className="flex items-center justify-center mb-6">
            <Bot className="w-6 h-6 text-teal-600 mr-2" />
            <h3 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
              Advanced AI Analysis
            </h3>
          </div>
          
          <div className="space-y-4 mb-8">
            <div className="bg-white/90 backdrop-blur rounded-lg p-4 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-teal-700 font-medium">Profile Scanning</span>
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div className="w-full bg-teal-100 rounded-full h-2">
                <div className="bg-gradient-to-r from-teal-500 to-emerald-500 h-2 rounded-full w-full"></div>
              </div>
            </div>
            
            <div className="bg-white/90 backdrop-blur rounded-lg p-4 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-700 font-medium">Code Analysis</span>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-300 border-t-blue-600"></div>
              </div>
              <div className="w-full bg-blue-100 rounded-full h-2">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full w-3/4 animate-pulse"></div>
              </div>
            </div>
            
            <div className="bg-white/90 backdrop-blur rounded-lg p-4 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-purple-700 font-medium">Personality Assessment</span>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-purple-300 border-t-purple-600"></div>
              </div>
              <div className="w-full bg-purple-100 rounded-full h-2">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full w-1/2 animate-pulse"></div>
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5 text-indigo-600 mr-2 animate-pulse" />
              <span className="text-lg font-semibold text-indigo-700">AI Processing</span>
            </div>
            <p className="text-gray-700 mb-2">{processingStage || "Deep learning analysis in progress..."}</p>
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
              <span>Confidence Level:</span>
              <div className="bg-gradient-to-r from-green-400 to-blue-500 text-white px-2 py-1 rounded font-medium">
                {confidenceScore}%
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Enhanced User Report Phase  
  if (currentPhase === 'report') {
    if (isGeneratingReport) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-100 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto">
            <div className="relative mb-8">
              <div className="animate-pulse">
                <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mx-auto flex items-center justify-center">
                  <Bot className="w-10 h-10 text-white animate-bounce" />
                </div>
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white animate-spin" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-indigo-700 mb-2">Generating AI Report</h3>
            <p className="text-gray-600 mb-4">Advanced assessment analysis in progress...</p>
            <div className="bg-white/90 backdrop-blur rounded-lg p-4 shadow-lg">
              <p className="text-sm text-gray-700">{processingStage || "Compiling comprehensive evaluation..."}</p>
            </div>
          </div>
        </div>
      );
    }

    if (!userReport) return null;

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="text-4xl mb-2">📊</div>
              <h2 className="text-2xl font-bold text-gray-800">Your Assessment Report</h2>
              <p className="text-gray-600">Comprehensive analysis of your performance and profile</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Overall Score */}
              <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg p-6 text-center">
                <h3 className="text-lg font-semibold mb-2">Overall Score</h3>
                <div className="text-4xl font-bold">{userReport?.overallScore || 0}/100</div>
                <p className="text-purple-100 mt-2">Professional Readiness</p>
              </div>

              {/* Quick Stats */}
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-2">Strengths</h4>
                  <ul className="text-green-700 text-sm space-y-1">
                    {(userReport?.strengths || userReport?.detailedAnalysis?.strengths || []).map((strength: string, index: number) => (
                      <li key={index}>• {strength}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-800 mb-2">Areas for Improvement</h4>
                  <ul className="text-yellow-700 text-sm space-y-1">
                    {(userReport?.improvements || userReport?.detailedAnalysis?.improvements || []).map((improvement: string, index: number) => (
                      <li key={index}>• {improvement}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Detailed Analysis */}
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Performance Analysis</h3>
                <p className="text-gray-700">{userReport?.performanceAnalysis || "No performance analysis available."}</p>
              </div>

              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-800 mb-3">Technical Skills Evaluation</h3>
                <p className="text-blue-700">{userReport?.technicalSkills || "No technical skills evaluation available."}</p>
              </div>

              <div className="bg-indigo-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-indigo-800 mb-3">Problem-Solving Approach</h3>
                <p className="text-indigo-700">{userReport?.problemSolving || "No problem-solving analysis available."}</p>
              </div>

              <div className="bg-purple-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-purple-800 mb-3">Profile Analysis</h3>
                <p className="text-purple-700">{userReport?.profileAnalysis || "No profile analysis available."}</p>
              </div>

              <div className="bg-emerald-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-emerald-800 mb-3">Recommendations</h3>
                <p className="text-emerald-700">{userReport?.recommendations || "No recommendations available."}</p>
              </div>
            </div>

            <div className="text-center mt-8">
              <button
                onClick={handleReportContinue}
                className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
              >
                Continue to Application →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Task Phase (existing application submission)
  if (currentPhase === 'task') {
    return (
      <div className="h-screen bg-gray-100 flex flex-col relative">
        {/* Welcome Text in Background */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none z-0">
          <h1 className="text-4xl font-bold text-gray-300 mb-2">Assessment Complete!</h1>
          <p className="text-lg text-gray-400">Submit your application and check your mail for feedback.</p>
        </div>

        {/* Mail Icon Button (top right) */}
        {analysisResult && (
          <button
            className="fixed top-6 right-8 z-50 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition-colors duration-300"
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
              {analysisResult && (
                <MailConversation initialConversation={createAnalysisEmail(analysisResult)} />
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
                  <h1 className="text-2xl font-semibold text-gray-900">Application Assignment</h1>
                  <p className="text-gray-600 mt-1">Prepare your professional application materials</p>
                </div>
                <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded">
                  Scene 1 of 12
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-6 py-8">

            {/* Objective */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
              <h2 className="text-lg font-medium text-gray-900 mb-3">Objective</h2>
              <p className="text-gray-700 leading-relaxed">
                Prepare and submit your professional application materials (resume and application email) for the Junior Full-Stack Developer & AI Enthusiast position at VelsyMedia. Focus on presenting your skills and experience in a clear, compelling manner suitable for an entry-level role.
              </p>
            </div>

            {/* Unified Requirements */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Application Materials Requirements</h3>
              <div className="markdown-body">
                <MDtoHTML
                  markdown={requirementsMarkdown}
                  className="prose max-w-none text-sm text-gray-700"
                />
              </div>
            </div>

            {/* Completion Note */}
            <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Ready to Submit?</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Once you have prepared both documents according to the specifications above, paste your resume content and email content below.
                    Our AI validation system will review your materials and provide feedback via email.
                  </p>
                </div>
              </div>
            </div>

            {/* Submission Form */}
            <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Submit Your Application Materials</h3>

              <div className="space-y-6">
                {/* Resume Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Resume Content <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={15}
                    value={resumeContent}
                    onChange={(e) => setResumeContent(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 resize-none"
                    placeholder="Paste your complete resume content here, including:
• Contact Information
• Professional Summary
• Technical Skills
• Education
• Projects
• Certifications (if any)

Example format:
JOHN DOE
Phone: +91 98765 43210
Email: john.doe@email.com
LinkedIn: linkedin.com/in/johndoe
GitHub: github.com/johndoe

PROFESSIONAL SUMMARY
[Your summary here...]

TECHNICAL SKILLS
[Your skills here...]

EDUCATION
[Your education here...]

PROJECTS
[Your projects here...]"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Include all sections of your resume in a clear, structured format
                  </p>
                </div>

                {/* Email Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Application Email Content <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={12}
                    value={emailContent}
                    onChange={(e) => setEmailContent(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 resize-none"
                    placeholder="Paste your complete application email here, including:
• Subject line
• Salutation
• Email body
• Professional closing
• Your signature

Example format:
Subject: Application for Junior Full-Stack Developer & AI Enthusiast - John Doe

Dear VelsyMedia Hiring Team,

[Your email content here...]

Sincerely,
John Doe"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Include the complete email as you would send it, from subject line to signature
                  </p>
                </div>

                {/* Validation Notice */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-blue-900">AI Validation Process</h4>
                      <p className="text-sm text-blue-800 mt-1">
                        Your submitted materials will be automatically reviewed by our AI agent. Check your mail for detailed feedback and next steps.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="text-center pt-4">
                  <button
                    className="bg-gray-900 text-white px-8 py-3 text-sm font-medium hover:bg-gray-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    onClick={handleSubmit}
                    disabled={isAnalyzing || !resumeContent.trim() || !emailContent.trim()}
                  >
                    {isAnalyzing ? 'Analyzing...' : 'Submit Application for Review'}
                  </button>
                </div>

                {/* Proceed Button for 80%+ Score */}
                {analysisResult && analysisResult.overallScore >= 80 && (
                  <div className="text-center pt-4">
                    <p className="text-sm text-gray-700 mb-4">
                      Congratulations! Your application meets our professional standards.
                    </p>
                    <button
                      onClick={handleProceedToNextScene}
                      className="bg-green-600 text-white px-6 py-3 text-sm font-medium rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    >
                      Proceed to Scene 2 🚀
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // This should not be reached since we start directly with questions
  return null;
}

export default Scene1Page;
