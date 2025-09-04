import { getResponseForGivenPrompt } from '@/app/global/service/agent';
import { localStorageService, LearningDocument } from './githubService';

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

interface LearningMemory {
    userId: string;
    domain: string;
    level: string;
    sessionHistory: {
        scenarioId: string;
        title: string;
        userResponse: string;
        feedback: ScenarioFeedback;
        timestamp: string;
    }[];
    skillProgression: Record<string, number>; // skill name -> proficiency level (0-10)
    learningPatterns: {
        preferredApproach: string;
        responseLength: 'brief' | 'detailed' | 'comprehensive';
        strengthAreas: string[];
        challengeAreas: string[];
        improvementRate: number;
    };
    nextRecommendations: string[];
}

export class ProgressiveLearningAgent {
    private memory: Map<string, LearningMemory> = new Map();

    constructor() {
        this.loadMemoryFromStorage();
    }

    /**
     * Generate the first scenario for a new learning journey
     */
    async generateInitialScenario(
        userId: string,
        domain: string,
        level: string
    ): Promise<ProgressiveScenario> {
        const systemPrompt = `You are a senior ${domain.toUpperCase()} mentor creating the first learning scenario for a new student.

STUDENT PROFILE:
- Domain: ${domain === 'ai' ? 'Artificial Intelligence/Machine Learning' : 'Cloud Computing'}
- Declared Level: ${level}
- Experience: First scenario - baseline assessment needed

SCENARIO REQUIREMENTS:
1. Create an engaging workplace introduction scenario
2. Test fundamental ${level}-level concepts naturally
3. Establish baseline for skill assessment
4. Set appropriate difficulty for progression planning
5. Include realistic business context and stakeholder dynamics

This first scenario should:
- Feel welcoming and engaging (first day/week on the job scenario)
- Test core competencies without being overwhelming
- Allow multiple valid approaches based on experience
- Provide clear assessment criteria for progression planning
- Include specific, relatable workplace details

FOCUS AREAS FOR ${domain.toUpperCase()}:
${domain === 'ai' ? `
- Data analysis and problem-solving approach
- Understanding of ML fundamentals and practical application
- Business context awareness and stakeholder communication
- Basic knowledge of tools, frameworks, and best practices
- Ability to break down complex problems systematically
` : `
- Cloud service selection and basic architecture thinking
- Understanding of deployment, scaling, and reliability concepts
- Cost awareness and resource optimization thinking
- Security and compliance basic understanding
- Problem-solving methodology and communication skills
`}

DIFFICULTY CALIBRATION FOR ${level.toUpperCase()}:
${level === 'beginner' ? `
- Focus on fundamental concepts and learning approach
- Test willingness to ask questions and seek help
- Assess understanding of basic terminology and concepts
- Evaluate systematic thinking and problem-solving methodology
- Look for potential and growth mindset indicators
` : `
- Test practical application of intermediate concepts
- Assess experience with real-world constraints and trade-offs
- Evaluate ability to work independently and make decisions
- Look for mentoring potential and leadership readiness
- Test understanding of business impact and stakeholder management
`}

Return ONLY valid JSON:
{
  "id": "scenario_${Date.now()}_initial",
  "title": "Engaging first scenario title",
  "scenario": "Detailed workplace story with specific context, characters, timeline, and business constraints. Make it feel like a real first assignment.",
  "context": "Background information needed to understand the business situation and technical environment",
  "expectedOutcome": "What a good response should demonstrate for baseline assessment",
  "difficulty": ${level === 'beginner' ? '3' : '5'},
  "skillsRequired": ["primary_skill", "secondary_skill", "tertiary_skill"],
  "isAdaptive": false,
  "basedOnPrevious": []
}`;

        const userPrompt = `Create the perfect first scenario for a ${level} level ${domain} learner. 

This should feel like:
- Their first real assignment at a new job
- A welcoming but appropriately challenging introduction
- An opportunity to demonstrate their current capabilities
- A foundation for personalized learning progression

Make it engaging, realistic, and perfectly calibrated for initial assessment.`;

        try {
            const response = await getResponseForGivenPrompt(systemPrompt, userPrompt);
            const scenario = this.parseScenarioResponse(response);
            
            // Initialize memory for this user
            this.initializeUserMemory(userId, domain, level);
            
            return scenario;
        } catch (error) {
            console.error('Error generating initial scenario:', error);
            return this.getFallbackInitialScenario(domain, level);
        }
    }

    /**
     * Generate next scenario based on user's previous performance and memory
     */
    async generateAdaptiveScenario(
        userId: string,
        previousResponse: string,
        previousFeedback: ScenarioFeedback
    ): Promise<ProgressiveScenario> {
        const memory = this.memory.get(userId);
        if (!memory) {
            throw new Error('No learning memory found for user');
        }

        // Update learning patterns based on latest response
        this.updateLearningPatterns(memory, previousResponse, previousFeedback);

        const systemPrompt = `You are an adaptive AI learning mentor with deep knowledge of this student's learning journey.

STUDENT LEARNING PROFILE:
- Domain: ${memory.domain}
- Level: ${memory.level} 
- Scenarios Completed: ${memory.sessionHistory.length}
- Current Average Score: ${this.calculateAverageScore(memory)}%

SKILL PROGRESSION ANALYSIS:
${Object.entries(memory.skillProgression)
    .map(([skill, level]) => `- ${skill}: ${level}/10 (${this.getSkillDescription(level)})`)
    .join('\n')}

LEARNING PATTERNS IDENTIFIED:
- Preferred Approach: ${memory.learningPatterns.preferredApproach}
- Response Style: ${memory.learningPatterns.responseLength}
- Strong Areas: ${memory.learningPatterns.strengthAreas.join(', ')}
- Challenge Areas: ${memory.learningPatterns.challengeAreas.join(', ')}
- Improvement Rate: ${memory.learningPatterns.improvementRate.toFixed(1)}% per scenario

RECENT PERFORMANCE CONTEXT:
Last Scenario: "${memory.sessionHistory[memory.sessionHistory.length - 1]?.title}"
Last Score: ${previousFeedback.score}%
Last Strengths: ${previousFeedback.strengths.join(', ')}
Areas to Address: ${previousFeedback.improvements.join(', ')}
Confidence Level: ${previousFeedback.confidenceLevel}/10

ADAPTIVE SCENARIO REQUIREMENTS:
1. Build directly on their demonstrated strengths: ${memory.learningPatterns.strengthAreas.slice(0, 2).join(', ')}
2. Address their specific challenge areas: ${memory.learningPatterns.challengeAreas.slice(0, 2).join(', ')}
3. Match their preferred learning style: ${memory.learningPatterns.preferredApproach}
4. Calibrate difficulty based on readiness: ${previousFeedback.readinessForNext ? 'increase slightly' : 'maintain/reduce'}
5. Connect to previous scenarios for continuity

PROGRESSION STRATEGY:
${this.getProgressionStrategy(memory, previousFeedback)}

The next scenario should:
- Feel like a natural progression from their previous work
- Target their specific skill gaps while building on strengths
- Match their demonstrated capability level
- Include references to their previous scenario context for continuity
- Present challenges that stretch them appropriately without overwhelming

Return ONLY valid JSON:
{
  "id": "scenario_${Date.now()}_adaptive",
  "title": "Scenario title that builds on previous context",
  "scenario": "Detailed adaptive scenario that references previous work and targets specific growth areas",
  "context": "Context including connection to previous scenarios and current skill focus",
  "expectedOutcome": "What this scenario should help them develop based on their specific needs",
  "difficulty": ${this.calculateNextDifficulty(memory, previousFeedback)},
  "skillsRequired": ["targeted_skill_1", "targeted_skill_2", "growth_skill"],
  "isAdaptive": true,
  "basedOnPrevious": ["${memory.sessionHistory[memory.sessionHistory.length - 1]?.scenarioId}"]
}`;

        const userPrompt = `Generate the perfect next scenario for this student based on their learning history and current needs.

SPECIFIC ADAPTATION REQUIREMENTS:
- Previous scenario showed: ${previousFeedback.strengths.join(', ')}
- Still needs work on: ${previousFeedback.improvements.join(', ')}
- Next focus should be: ${previousFeedback.nextFocus}
- Ready for difficulty increase: ${previousFeedback.readinessForNext ? 'Yes' : 'No'}

Create a scenario that feels like the natural next step in their professional development journey.`;

        try {
            const response = await getResponseForGivenPrompt(systemPrompt, userPrompt);
            const scenario = this.parseScenarioResponse(response);
            
            return scenario;
        } catch (error) {
            console.error('Error generating adaptive scenario:', error);
            return this.getFallbackAdaptiveScenario(memory, previousFeedback);
        }
    }

    /**
     * Evaluate user response and provide detailed feedback with memory update
     */
    async evaluateResponseWithMemory(
        userId: string,
        scenario: ProgressiveScenario,
        userResponse: string
    ): Promise<ScenarioFeedback> {
        const memory = this.memory.get(userId);
        if (!memory) {
            throw new Error('No learning memory found for user');
        }

        const systemPrompt = `You are an expert ${memory.domain.toUpperCase()} mentor conducting personalized assessment.

STUDENT LEARNING CONTEXT:
- Name: Student (${userId.substring(0, 8)})
- Domain: ${memory.domain}
- Declared Level: ${memory.level}
- Learning Journey: Scenario ${memory.sessionHistory.length + 1}
- Average Performance: ${this.calculateAverageScore(memory)}%

STUDENT'S LEARNING PROFILE:
${this.generateLearningProfile(memory)}

CURRENT SCENARIO BEING EVALUATED:
Title: ${scenario.title}
Difficulty: ${scenario.difficulty}/10
Skills Tested: ${scenario.skillsRequired.join(', ')}
Is Adaptive: ${scenario.isAdaptive}
${scenario.basedOnPrevious?.length ? `Based on: ${scenario.basedOnPrevious.join(', ')}` : 'Initial scenario'}

Scenario: ${scenario.scenario}

STUDENT'S RESPONSE:
${userResponse}

PERSONALIZED EVALUATION CRITERIA:
1. Growth from Previous Performance (30%)
   - How does this compare to their established patterns?
   - Are they applying lessons from previous feedback?
   - Show evidence of skill development?

2. Technical/Practical Competency (40%)
   - Accuracy of approach and knowledge
   - Understanding of domain-specific concepts
   - Practical feasibility of proposed solutions

3. Communication and Professional Development (20%)
   - Clarity of explanation and reasoning
   - Professional tone and stakeholder awareness
   - Ability to articulate decision-making process

4. Adaptive Learning Indicators (10%)
   - Evidence of reflection and learning integration
   - Appropriate confidence and uncertainty acknowledgment
   - Growth mindset and improvement orientation

SCORING FRAMEWORK (calibrated to their journey):
- 90-100: Exceptional growth - exceeding expectations for their level
- 80-89: Strong performance - solid progress and skill development
- 70-79: Good progress - meeting expectations with room for growth
- 60-69: Developing - showing effort but needs focused improvement
- 50-59: Struggling - significant gaps need immediate attention
- Below 50: Major intervention needed

FEEDBACK REQUIREMENTS:
1. Acknowledge specific growth since previous scenarios
2. Identify precise strengths demonstrated in this response
3. Provide actionable, specific improvement recommendations
4. Suggest concrete next learning steps
5. Assess readiness for increased difficulty

Return ONLY valid JSON:
{
  "score": number,
  "strengths": ["specific strength with evidence", "another specific strength"],
  "improvements": ["specific improvement with action step", "another improvement area"],
  "nextFocus": "What they should concentrate on for next scenario",
  "skillGaps": ["specific skill needing development", "another skill gap"],
  "confidenceLevel": number (1-10),
  "readinessForNext": boolean
}`;

        const userPrompt = `Provide comprehensive, personalized feedback for this student's response.

Focus on:
1. How they've grown since their previous scenarios
2. Specific evidence of learning and skill development
3. Concrete next steps for continued growth
4. Appropriate challenge level for next scenario

Be encouraging but honest, specific but supportive.`;

        try {
            const response = await getResponseForGivenPrompt(systemPrompt, userPrompt);
            const feedback = this.parseFeedbackResponse(response);
            
            // Update memory with this scenario and feedback
            this.updateUserMemory(userId, scenario, userResponse, feedback);
            
            return feedback;
        } catch (error) {
            console.error('Error evaluating response:', error);
            return this.getFallbackFeedback(memory, userResponse);
        }
    }

    /**
     * Get learning analytics and insights for a user
     */
    getLearningAnalytics(userId: string): any {
        const memory = this.memory.get(userId);
        if (!memory) return null;

        const analytics = {
            overallProgress: {
                scenariosCompleted: memory.sessionHistory.length,
                averageScore: this.calculateAverageScore(memory),
                improvementTrend: this.calculateImprovementTrend(memory),
                skillGrowth: this.calculateSkillGrowth(memory)
            },
            skillProgression: memory.skillProgression,
            learningPatterns: memory.learningPatterns,
            strengths: this.getTopStrengths(memory),
            challengeAreas: this.getTopChallenges(memory),
            recommendations: memory.nextRecommendations,
            readinessAssessment: this.assessReadinessForAdvancement(memory)
        };

        return analytics;
    }

    // Private helper methods

    private initializeUserMemory(userId: string, domain: string, level: string): void {
        const memory: LearningMemory = {
            userId,
            domain,
            level,
            sessionHistory: [],
            skillProgression: this.getInitialSkillLevels(domain, level),
            learningPatterns: {
                preferredApproach: 'systematic',
                responseLength: 'detailed',
                strengthAreas: [],
                challengeAreas: [],
                improvementRate: 0
            },
            nextRecommendations: []
        };

        this.memory.set(userId, memory);
        this.saveMemoryToStorage();
    }

    private updateUserMemory(
        userId: string,
        scenario: ProgressiveScenario,
        userResponse: string,
        feedback: ScenarioFeedback
    ): void {
        const memory = this.memory.get(userId);
        if (!memory) return;

        // Add to session history
        memory.sessionHistory.push({
            scenarioId: scenario.id,
            title: scenario.title,
            userResponse,
            feedback,
            timestamp: new Date().toISOString()
        });

        // Update skill progression
        scenario.skillsRequired.forEach(skill => {
            const currentLevel = memory.skillProgression[skill] || 1;
            const improvement = feedback.score > 75 ? 0.3 : feedback.score > 60 ? 0.2 : 0.1;
            memory.skillProgression[skill] = Math.min(10, currentLevel + improvement);
        });

        // Update learning patterns
        this.updateLearningPatterns(memory, userResponse, feedback);

        // Store document for GitHub integration
        this.storeLearningDocument(memory, scenario, userResponse, feedback);

        this.saveMemoryToStorage();
    }

    private updateLearningPatterns(
        memory: LearningMemory,
        userResponse: string,
        feedback: ScenarioFeedback
    ): void {
        // Analyze response style
        const wordCount = userResponse.split(' ').length;
        if (wordCount < 50) memory.learningPatterns.responseLength = 'brief';
        else if (wordCount < 150) memory.learningPatterns.responseLength = 'detailed';
        else memory.learningPatterns.responseLength = 'comprehensive';

        // Update strength and challenge areas
        feedback.strengths.forEach(strength => {
            if (!memory.learningPatterns.strengthAreas.includes(strength)) {
                memory.learningPatterns.strengthAreas.push(strength);
            }
        });

        feedback.improvements.forEach(improvement => {
            if (!memory.learningPatterns.challengeAreas.includes(improvement)) {
                memory.learningPatterns.challengeAreas.push(improvement);
            }
        });

        // Calculate improvement rate
        if (memory.sessionHistory.length > 1) {
            const scores = memory.sessionHistory.map(s => s.feedback.score);
            const recentScores = scores.slice(-3); // Last 3 scenarios
            const improvement = recentScores.length > 1 
                ? (recentScores[recentScores.length - 1] - recentScores[0]) / (recentScores.length - 1)
                : 0;
            memory.learningPatterns.improvementRate = improvement;
        }
    }

    private async storeLearningDocument(
        memory: LearningMemory,
        scenario: ProgressiveScenario,
        userResponse: string,
        feedback: ScenarioFeedback
    ): Promise<void> {
        const document: LearningDocument = {
            id: `${memory.userId}_${scenario.id}_${Date.now()}`,
            userId: memory.userId,
            domain: memory.domain,
            level: memory.level,
            scenarioId: scenario.id,
            timestamp: new Date().toISOString(),
            scenario: {
                title: scenario.title,
                content: scenario.scenario,
                difficulty: scenario.difficulty
            },
            userResponse,
            aiFeedback: {
                score: feedback.score,
                strengths: feedback.strengths,
                improvements: feedback.improvements,
                nextFocus: feedback.nextFocus
            },
            sessionContext: {
                previousScenarios: memory.sessionHistory.length,
                overallProgress: this.calculateAverageScore(memory),
                skillProgression: { ...memory.skillProgression }
            }
        };

        await localStorageService.storeLearningDocument(document);
    }

    private parseScenarioResponse(response: string): ProgressiveScenario {
        try {
            let cleanedResponse = response.trim();
            
            if (cleanedResponse.startsWith('```json')) {
                cleanedResponse = cleanedResponse.replace(/```json\n?/, '').replace(/\n?```$/, '');
            } else if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.replace(/```\n?/, '').replace(/\n?```$/, '');
            }
            
            return JSON.parse(cleanedResponse);
        } catch (error) {
            console.error('Error parsing scenario response:', error);
            throw error;
        }
    }

    private parseFeedbackResponse(response: string): ScenarioFeedback {
        try {
            let cleanedResponse = response.trim();
            
            if (cleanedResponse.startsWith('```json')) {
                cleanedResponse = cleanedResponse.replace(/```json\n?/, '').replace(/\n?```$/, '');
            } else if (cleanedResponse.startsWith('```')) {
                cleanedResponse = cleanedResponse.replace(/```\n?/, '').replace(/\n?```$/, '');
            }
            
            return JSON.parse(cleanedResponse);
        } catch (error) {
            console.error('Error parsing feedback response:', error);
            throw error;
        }
    }

    private calculateAverageScore(memory: LearningMemory): number {
        if (memory.sessionHistory.length === 0) return 0;
        const total = memory.sessionHistory.reduce((sum, session) => sum + session.feedback.score, 0);
        return Math.round(total / memory.sessionHistory.length);
    }

    private calculateNextDifficulty(memory: LearningMemory, previousFeedback: ScenarioFeedback): number {
        const currentAvg = this.calculateAverageScore(memory);
        const currentDifficulty = memory.sessionHistory.length > 0 
            ? memory.sessionHistory[memory.sessionHistory.length - 1].feedback.score / 10 
            : 3;

        if (previousFeedback.readinessForNext && currentAvg > 80) {
            return Math.min(10, currentDifficulty + 1);
        } else if (currentAvg < 60) {
            return Math.max(1, currentDifficulty - 0.5);
        }
        
        return currentDifficulty;
    }

    private generateLearningProfile(memory: LearningMemory): string {
        const avgScore = this.calculateAverageScore(memory);
        const topSkills = Object.entries(memory.skillProgression)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([skill, level]) => `${skill} (${level.toFixed(1)}/10)`)
            .join(', ');

        return `
Scenarios Completed: ${memory.sessionHistory.length}
Average Performance: ${avgScore}%
Top Skills: ${topSkills}
Learning Style: ${memory.learningPatterns.preferredApproach}
Response Style: ${memory.learningPatterns.responseLength}
Recent Trend: ${memory.learningPatterns.improvementRate > 0 ? 'Improving' : 'Stable'}`;
    }

    private getInitialSkillLevels(domain: string, level: string): Record<string, number> {
        const baseLevel = level === 'beginner' ? 2 : 4;
        
        if (domain === 'ai') {
            return {
                'data_analysis': baseLevel,
                'machine_learning': baseLevel,
                'problem_solving': baseLevel + 0.5,
                'communication': baseLevel,
                'business_understanding': baseLevel - 0.5
            };
        } else {
            return {
                'cloud_architecture': baseLevel,
                'deployment': baseLevel,
                'security': baseLevel - 0.5,
                'cost_optimization': baseLevel,
                'troubleshooting': baseLevel + 0.5
            };
        }
    }

    private getProgressionStrategy(memory: LearningMemory, previousFeedback: ScenarioFeedback): string {
        const avgScore = this.calculateAverageScore(memory);
        
        if (avgScore > 85) {
            return "Accelerate learning with complex, multi-faceted challenges";
        } else if (avgScore > 70) {
            return "Maintain steady progression with gradual difficulty increase";
        } else if (avgScore > 55) {
            return "Focus on reinforcing fundamentals with supportive challenges";
        } else {
            return "Provide additional support and foundational skill building";
        }
    }

    private getSkillDescription(level: number): string {
        if (level >= 8) return "Expert";
        if (level >= 6) return "Proficient";
        if (level >= 4) return "Developing";
        if (level >= 2) return "Beginner";
        return "Novice";
    }

    private getFallbackInitialScenario(domain: string, level: string): ProgressiveScenario {
        if (domain === 'ai') {
            return {
                id: `scenario_${Date.now()}_fallback`,
                title: "Your First Week at DataTech",
                scenario: "Welcome to your new role at DataTech Inc! Your manager walks over to your desk on your third day: 'Hey, I have a perfect starter project for you. Our customer support team has been tracking ticket volumes, but they can't tell if complaint patterns are actually changing or if it just feels that way. We have 6 months of data - types of issues, resolution times, customer ratings, and timestamps. Could you take a look and help us understand what's really happening? No pressure, but it would be great to have insights for next week's team meeting.'",
                context: "You have access to clean customer support data and basic analysis tools. This is your chance to make a good first impression.",
                expectedOutcome: "Demonstrate systematic approach to data analysis and clear communication of findings.",
                difficulty: level === 'beginner' ? 3 : 5,
                skillsRequired: ["data_analysis", "problem_solving", "communication"],
                isAdaptive: false,
                basedOnPrevious: []
            };
        } else {
            return {
                id: `scenario_${Date.now()}_fallback`,
                title: "Your First Cloud Deployment",
                scenario: "Welcome to CloudStart Corp! Your team lead stops by your desk in your second week: 'Perfect timing - I have a great learning opportunity for you. The marketing team needs their new company blog deployed to the cloud by next Tuesday for a campaign launch. It's a standard WordPress site, nothing too complex, but it needs to handle decent traffic and stay within our budget. Think you're up for it? I'll be around if you need guidance, but I'd love to see your approach.'",
                context: "You have access to AWS console, WordPress files, and a reasonable budget for cloud resources.",
                expectedOutcome: "Show understanding of basic cloud services and deployment planning.",
                difficulty: level === 'beginner' ? 3 : 5,
                skillsRequired: ["cloud_architecture", "deployment", "cost_optimization"],
                isAdaptive: false,
                basedOnPrevious: []
            };
        }
    }

    private getFallbackAdaptiveScenario(memory: LearningMemory, previousFeedback: ScenarioFeedback): ProgressiveScenario {
        const difficulty = this.calculateNextDifficulty(memory, previousFeedback);
        
        return {
            id: `scenario_${Date.now()}_adaptive_fallback`,
            title: `Building on Your Previous Success`,
            scenario: `Based on your great work in the previous scenario, your manager has a follow-up challenge that builds on what you've learned. This new project will test your growing skills while addressing the areas we identified for improvement: ${previousFeedback.improvements.slice(0, 2).join(' and ')}.`,
            context: `This scenario continues your professional development journey, focusing on: ${previousFeedback.nextFocus}`,
            expectedOutcome: `Demonstrate growth in identified areas while maintaining your strengths in: ${previousFeedback.strengths.slice(0, 2).join(' and ')}`,
            difficulty: difficulty,
            skillsRequired: ["progressive_skill_1", "progressive_skill_2", "growth_area"],
            isAdaptive: true,
            basedOnPrevious: [memory.sessionHistory[memory.sessionHistory.length - 1]?.scenarioId || "previous"]
        };
    }

    private getFallbackFeedback(memory: LearningMemory, userResponse: string): ScenarioFeedback {
        const wordCount = userResponse.split(' ').length;
        const baseScore = memory.level === 'beginner' ? 70 : 75;
        
        return {
            score: baseScore + (wordCount > 100 ? 5 : 0),
            strengths: ["Shows thoughtful consideration", "Demonstrates systematic thinking"],
            improvements: ["Could provide more specific examples", "Consider additional implementation details"],
            nextFocus: "Continue building on your systematic approach while adding more practical specifics",
            skillGaps: ["advanced_planning", "stakeholder_management"],
            confidenceLevel: 7,
            readinessForNext: true
        };
    }

    private loadMemoryFromStorage(): void {
        try {
            const stored = localStorage.getItem('progressive_learning_memory');
            if (stored) {
                const data = JSON.parse(stored);
                this.memory = new Map(Object.entries(data));
            }
        } catch (error) {
            console.error('Error loading memory from storage:', error);
        }
    }

    private saveMemoryToStorage(): void {
        try {
            const data = Object.fromEntries(this.memory);
            localStorage.setItem('progressive_learning_memory', JSON.stringify(data));
        } catch (error) {
            console.error('Error saving memory to storage:', error);
        }
    }

    private calculateImprovementTrend(memory: LearningMemory): number {
        if (memory.sessionHistory.length < 2) return 0;
        
        const scores = memory.sessionHistory.map(s => s.feedback.score);
        const recentScores = scores.slice(-3);
        
        if (recentScores.length < 2) return 0;
        
        const improvement = (recentScores[recentScores.length - 1] - recentScores[0]) / (recentScores.length - 1);
        return Math.round(improvement * 10) / 10;
    }

    private calculateSkillGrowth(memory: LearningMemory): Record<string, number> {
        const initialLevels = this.getInitialSkillLevels(memory.domain, memory.level);
        const growth: Record<string, number> = {};
        
        Object.keys(memory.skillProgression).forEach(skill => {
            const current = memory.skillProgression[skill];
            const initial = initialLevels[skill] || 1;
            growth[skill] = Math.round((current - initial) * 10) / 10;
        });
        
        return growth;
    }

    private getTopStrengths(memory: LearningMemory): string[] {
        const strengthCounts: Record<string, number> = {};
        
        memory.sessionHistory.forEach(session => {
            session.feedback.strengths.forEach(strength => {
                strengthCounts[strength] = (strengthCounts[strength] || 0) + 1;
            });
        });
        
        return Object.entries(strengthCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([strength]) => strength);
    }

    private getTopChallenges(memory: LearningMemory): string[] {
        const challengeCounts: Record<string, number> = {};
        
        memory.sessionHistory.forEach(session => {
            session.feedback.improvements.forEach(challenge => {
                challengeCounts[challenge] = (challengeCounts[challenge] || 0) + 1;
            });
        });
        
        return Object.entries(challengeCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([challenge]) => challenge);
    }

    private assessReadinessForAdvancement(memory: LearningMemory): any {
        const avgScore = this.calculateAverageScore(memory);
        const improvementTrend = this.calculateImprovementTrend(memory);
        const scenariosCompleted = memory.sessionHistory.length;
        
        return {
            overallReadiness: avgScore > 80 && improvementTrend >= 0 && scenariosCompleted >= 5,
            score: avgScore,
            trend: improvementTrend,
            scenariosNeeded: Math.max(0, 5 - scenariosCompleted),
            recommendation: this.getAdvancementRecommendation(avgScore, improvementTrend, scenariosCompleted)
        };
    }

    private getAdvancementRecommendation(avgScore: number, trend: number, scenarios: number): string {
        if (avgScore > 85 && trend > 0 && scenarios >= 5) {
            return "Ready for advancement to next level";
        } else if (avgScore > 75 && scenarios >= 5) {
            return "Nearly ready - complete a few more scenarios to confirm consistency";
        } else if (avgScore < 60) {
            return "Focus on fundamentals before advancing";
        } else {
            return "Continue current level to build confidence and skills";
        }
    }
}

export const progressiveLearningAgent = new ProgressiveLearningAgent();
