import { getResponseForGivenPrompt } from '@/app/global/service/agent';

interface Question {
    id: number;
    question: string;
    type: 'multiple-choice' | 'text' | 'scenario';
    options?: string[];
    context?: string;
    expectedAnswer?: string;
    skillsTestedAreas?: string[];
    difficulty?: string;
    industryRelevance?: string;
}

interface AssessmentResult {
    score: number;
    level: string;
    actualLevel: string; // What level they actually demonstrated
    isValidForChosenLevel: boolean;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    nextSteps: string[];
    detailedAnalysis: string;
    industryReadiness: number; // 0-100 scale
    confidenceScore?: number; // How confident we are in the assessment
    learningPath?: string; // Recommended learning focus
}

export const generateAssessmentQuestions = async (
    domain: string,
    level: string
): Promise<Question[]> => {
    const systemPrompt = `You are a senior industry expert and technical interviewer with 15+ years of experience in ${domain.toUpperCase()}.

Your task is to generate exactly 5 industry-level assessment questions for ${level} level candidates.

CRITICAL REQUIREMENTS:
1. Questions must reflect REAL workplace situations that professionals face daily
2. Use storytelling and scenarios that feel like actual conversations with managers/colleagues
3. Include modern tools, frameworks, and best practices used in 2024-2025
4. Questions should clearly differentiate between ${level} and other levels
5. Focus on practical problem-solving and human decision-making
6. Create scenarios that test adaptability and communication skills
7. Questions should feel natural to answer without needing AI assistance
8. Include realistic time pressure, business context, and stakeholder dynamics

For ${domain === 'ai' ? 'AI/Machine Learning' : 'Cloud Computing'} domain at ${level} level:

${domain === 'ai' ? `
FOCUS AREAS FOR AI/ML:
- End-to-end ML project lifecycle from business problem to production
- Real-world data challenges (dirty data, bias, privacy, scale)
- Model selection, validation, and evaluation in production contexts
- MLOps, model versioning, monitoring, and maintenance
- AI ethics, fairness, explainability, and regulatory compliance
- Integration with existing business systems and workflows
- Performance optimization for production environments
- Current industry tools and platforms (2024-2025): MLflow, Kubeflow, Weights & Biases, etc.
- Modern architectures: Transformers, diffusion models, LLMs, federated learning
- Business impact measurement and ROI of AI projects
` : `
FOCUS AREAS FOR CLOUD:
- Enterprise cloud architecture design and migration strategies
- Infrastructure as Code (Terraform, CloudFormation, Pulumi)
- Container orchestration at scale (Kubernetes, service mesh)
- Modern CI/CD practices and GitOps workflows
- Cloud security, compliance, and governance frameworks
- Cost optimization and FinOps practices
- Observability, monitoring, and incident response
- Multi-cloud and hybrid cloud strategies
- Current platforms and services (2024-2025): AWS, Azure, GCP latest features
- Serverless architectures and event-driven systems
- DevOps culture and practices in enterprise environments
`}

LEVEL-SPECIFIC EXPECTATIONS:
${level === 'intermediate' ? `
INTERMEDIATE LEVEL (1-3 years experience):
- Has completed 2-3 real projects with measurable business impact
- Understands trade-offs and can justify technical decisions
- Can work independently on well-defined problems
- Knows when to seek help and can research solutions effectively
- Familiar with industry tools but may not have deep expertise in all
- Can mentor junior team members on specific topics
- Understands business context and stakeholder communication
- Has experienced at least one production incident or major challenge
` : `
BEGINNER LEVEL (0-1 years experience):
- Has completed tutorials, courses, or small personal projects
- Understands fundamental concepts and terminology
- Can implement basic solutions with guidance
- Learning about industry standards, tools, and best practices
- May have strong theoretical knowledge but limited practical experience
- Eager to learn and asks good questions
- Needs guidance on complex problems and architecture decisions
- Has not yet experienced major production challenges
`}

QUESTION DISTRIBUTION:
1. One workplace crisis scenario requiring quick thinking and communication
2. One day-in-the-life scenario with realistic constraints and stakeholders  
3. One team collaboration scenario testing interpersonal and technical skills
4. One business-impact scenario requiring translation between technical and business needs
5. One learning/growth scenario testing adaptability and professional development

Each question should:
- Read like a real workplace story or conversation
- Include specific details that make the scenario believable and relatable
- Test practical thinking rather than memorized knowledge
- Allow for multiple valid approaches based on experience and judgment
- Include realistic constraints (time, budget, team dynamics, business pressure)
- Be answerable through common sense, experience, and logical thinking

Return ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "id": 1,
      "question": "detailed question text with realistic context",
      "type": "multiple-choice|text|scenario",
      "options": ["option1", "option2", "option3", "option4"], // only for multiple-choice
      "context": "detailed scenario context with business constraints",
      "expectedAnswer": "comprehensive description of ideal answer approach",
      "skillsTestedAreas": ["specific_skill_1", "specific_skill_2", "specific_skill_3"],
      "difficulty": "1-10 scale",
      "industryRelevance": "description of why this matters in real work"
    }
  ]
}`;

    const userPrompt = `Generate 5 challenging, industry-relevant questions for ${domain} domain at ${level} level. 

These questions will be used to assess if a candidate truly has ${level}-level skills and is ready for real industry work.

CONTEXT:
- Domain: ${domain === 'ai' ? 'Artificial Intelligence/Machine Learning' : 'Cloud Computing'}
- Target Level: ${level}
- Purpose: Validate claimed skill level and determine training needs
- Time per question: 3-5 minutes for multiple choice, 5-10 minutes for text/scenario

REQUIREMENTS:
1. Create realistic workplace scenarios that feel like real conversations
2. Include specific details (names, times, business context) to make scenarios believable
3. Test practical problem-solving and human judgment, not memorized facts
4. Include modern tools and practices (2024-2025) naturally within scenarios
5. Make questions answerable through experience, logic, and common sense
6. Include realistic workplace pressures (deadlines, stakeholders, team dynamics)

Make them engaging enough that someone would want to share their approach, but challenging enough that someone falsely claiming ${level} level would struggle to provide convincing answers.

Create WORKPLACE STORIES that include:
- Specific business context and stakeholder dynamics
- Realistic time pressures and constraints  
- Human elements (team interactions, communication challenges)
- Practical decision-making scenarios
- Learning and growth opportunities

Focus on:
${domain === 'ai' ? `
- Real ML project challenges (data quality, model drift, production issues)
- Business impact and ROI measurement
- Modern AI/ML stack and tools
- Ethical AI and bias mitigation
- MLOps and production deployment
` : `
- Enterprise cloud architecture decisions
- DevOps and automation practices
- Cost optimization and security
- Modern cloud-native technologies
- Incident response and troubleshooting
`}

Generate questions that help us understand:
1. Their real-world experience level
2. Whether they're ready for ${level}-level responsibilities
3. What specific areas need improvement
4. How to personalize their learning journey`;

    try {
        const response = await getResponseForGivenPrompt(systemPrompt, userPrompt);
        
        // Clean the response to extract JSON
        let cleanedResponse = response.trim();
        
        // Remove any markdown code blocks
        if (cleanedResponse.startsWith('```json')) {
            cleanedResponse = cleanedResponse.replace(/```json\n?/, '').replace(/\n?```$/, '');
        } else if (cleanedResponse.startsWith('```')) {
            cleanedResponse = cleanedResponse.replace(/```\n?/, '').replace(/\n?```$/, '');
        }
        
        const parsed = JSON.parse(cleanedResponse);
        
        // Validate the response structure
        if (!parsed.questions || !Array.isArray(parsed.questions)) {
            throw new Error('Invalid response structure');
        }
        
        return parsed.questions;
    } catch (error) {
        console.error('Error generating questions:', error);
        // Return fallback questions if AI generation fails
        return getFallbackQuestions(domain, level);
    }
};

export const evaluateAnswers = async (
    domain: string,
    level: string,
    questions: Question[],
    answers: {[key: number]: string}
): Promise<AssessmentResult> => {
    const systemPrompt = `You are a senior ${domain.toUpperCase()} expert and career assessor with deep industry experience and proven track record of evaluating talent for top-tier companies.

Your task is to conduct a comprehensive, honest assessment of a candidate's responses to determine their TRUE skill level and industry readiness.

EVALUATION FRAMEWORK:

1. TECHNICAL COMPETENCY (40% weight):
   - Accuracy of technical knowledge
   - Understanding of modern tools and practices
   - Depth of domain expertise
   - Awareness of industry standards

2. PRACTICAL APPLICATION (30% weight):
   - Real-world problem-solving approach
   - Understanding of business constraints
   - Experience with production environments
   - Ability to handle trade-offs and complexity

3. INDUSTRY MATURITY (20% weight):
   - Professional communication and clarity
   - Understanding of team dynamics and processes
   - Awareness of industry trends and challenges
   - Ability to learn and adapt

4. LEVEL VALIDATION (10% weight):
   - Does their response match claimed ${level} level?
   - What level do they actually demonstrate?
   - Are they ready for ${level}-level responsibilities?

SCORING RUBRIC:
- 95-100: Exceptional - Exceeds ${level} expectations significantly, ready for promotion
- 85-94: Strong - Solid ${level} level with room for growth
- 75-84: Competent - Meets most ${level} expectations, some gaps to address
- 65-74: Developing - Approaching ${level} but needs focused improvement
- 55-64: Basic - Below ${level}, significant skill gaps present
- 45-54: Novice - Beginner level regardless of claims
- 0-44: Insufficient - Fundamental knowledge gaps

CRITICAL ANALYSIS POINTS:
- Look for evidence of real project experience vs. theoretical knowledge
- Assess problem-solving methodology and decision-making process
- Evaluate understanding of business impact and stakeholder considerations
- Check for awareness of current industry practices and tools
- Identify specific skill gaps that need training focus

LEVEL VALIDATION CRITERIA:
${level === 'intermediate' ? `
INTERMEDIATE LEVEL INDICATORS:
✅ Should demonstrate: 1-3 years real project experience, independent problem-solving, understanding of trade-offs, mentoring ability, business context awareness
❌ Red flags: Only theoretical knowledge, can't explain practical decisions, unfamiliar with production challenges, poor communication
` : `
BEGINNER LEVEL INDICATORS:
✅ Should demonstrate: Basic concept understanding, eagerness to learn, following best practices, asking good questions
❌ Red flags: Overconfidence without substance, copying solutions without understanding, resistance to feedback
`}

Return ONLY valid JSON in this exact format:
{
  "score": number,
  "level": "specific level description (e.g., 'Advanced Beginner', 'Early Intermediate')",
  "actualLevel": "Beginner|Intermediate|Advanced",
  "isValidForChosenLevel": boolean,
  "strengths": ["specific strength with evidence", "another specific strength"],
  "weaknesses": ["specific weakness with improvement path", "another weakness"],
  "recommendations": ["actionable recommendation with timeline", "specific resource or practice"],
  "nextSteps": ["immediate action step", "short-term goal", "medium-term objective"],
  "detailedAnalysis": "comprehensive 3-4 sentence analysis covering technical skills, practical experience, industry readiness, and specific evidence from responses",
  "industryReadiness": number,
  "confidenceScore": number,
  "learningPath": "recommended learning focus based on gaps identified"
}`;

    const userPrompt = `Conduct a comprehensive assessment of these responses for ${domain} domain with claimed ${level} level:

ASSESSMENT CONTEXT:
- Domain: ${domain === 'ai' ? 'Artificial Intelligence/Machine Learning' : 'Cloud Computing'}
- Claimed Level: ${level}
- Assessment Purpose: Validate skill level and create personalized learning path
- Industry Context: Evaluating readiness for real-world ${level}-level responsibilities

QUESTIONS AND RESPONSES:
${questions.map((q, index) => {
        const answer = answers[q.id] || 'No answer provided';
        return `
═══ QUESTION ${index + 1} ═══
Type: ${q.type.toUpperCase()}
Question: ${q.question}
${q.context ? `\nScenario Context: ${q.context}` : ''}
${q.expectedAnswer ? `\nExpected Answer Direction: ${q.expectedAnswer}` : ''}
${q.skillsTestedAreas ? `\nSkills Being Tested: ${q.skillsTestedAreas.join(', ')}` : ''}

CANDIDATE'S RESPONSE:
${answer}

ANALYSIS NOTES:
- Does this response show practical experience or just theoretical knowledge?
- What level of industry maturity does this demonstrate?
- Are there red flags or concerning gaps?
- What evidence supports their claimed ${level} level?

---`;
    }).join('\n')}

COMPREHENSIVE EVALUATION REQUIRED:

1. TECHNICAL ASSESSMENT:
   - Evaluate technical accuracy and depth
   - Assess understanding of modern tools and practices
   - Check for current industry knowledge (2024-2025)

2. EXPERIENCE VALIDATION:
   - Look for evidence of real project work
   - Assess problem-solving methodology
   - Evaluate understanding of business constraints

3. LEVEL VERIFICATION:
   - Does their knowledge depth match ${level} expectations?
   - Can they handle ${level}-level responsibilities?
   - What's the gap between claimed and demonstrated level?

4. LEARNING PATH DESIGN:
   - What are their strongest areas to build upon?
   - What are the most critical gaps to address first?
   - What learning approach would be most effective?

Be honest and specific in your assessment. This evaluation will be used to:
- Determine if they're ready for ${level}-level training content
- Personalize their learning journey
- Set realistic expectations and goals
- Provide actionable improvement strategies

Focus on evidence from their responses, not assumptions. Be constructive but truthful about gaps.`;

    try {
        const response = await getResponseForGivenPrompt(systemPrompt, userPrompt);
        
        // Clean the response to extract JSON
        let cleanedResponse = response.trim();
        
        // Remove any markdown code blocks
        if (cleanedResponse.startsWith('```json')) {
            cleanedResponse = cleanedResponse.replace(/```json\n?/, '').replace(/\n?```$/, '');
        } else if (cleanedResponse.startsWith('```')) {
            cleanedResponse = cleanedResponse.replace(/```\n?/, '').replace(/\n?```$/, '');
        }
        
        const result = JSON.parse(cleanedResponse);
        
        // Validate the response structure
        if (typeof result.score !== 'number' || !result.level) {
            throw new Error('Invalid evaluation response structure');
        }
        
        return result;
    } catch (error) {
        console.error('Error evaluating answers:', error);
        // Return fallback evaluation if AI evaluation fails
        return getFallbackEvaluation(level, questions.length);
    }
};

// Enhanced fallback questions with real industry scenarios
const getFallbackQuestions = (domain: string, level: string): Question[] => {
    const aiIntermediateQuestions = [
        {
            id: 1,
            question: "It's Friday at 6 PM and you're about to leave when your phone buzzes. The on-call alert shows that your company's recommendation system is acting weird - customers are complaining that they're getting terrible product suggestions. You check the metrics and see that click-through rates dropped 15% after this morning's model update, even though all your offline tests showed the new model was better. The weekend sales event starts tomorrow and your VP is asking for updates. What's your approach to handle this crisis?",
            type: "scenario" as const,
            context: "High-pressure production incident where a model deployment has gone wrong right before a major business event",
            expectedAnswer: "Should mention immediate rollback options, quick diagnosis steps, stakeholder communication, and systematic troubleshooting approach",
            skillsTestedAreas: ["incident response under pressure", "production ML troubleshooting", "stakeholder communication", "business impact assessment"],
            difficulty: "7",
            industryRelevance: "Production ML failures during critical business periods require calm decision-making and clear communication"
        },
        {
            id: 2,
            question: "You're building a fraud detection model for a fintech startup. The business team wants 99.9% fraud catch rate, but your current model has 85% precision at 95% recall. How do you handle this situation and what trade-offs would you present to stakeholders?",
            type: "scenario" as const,
            context: "Business stakeholders have unrealistic expectations for model performance in a high-stakes domain",
            expectedAnswer: "Should discuss precision-recall trade-offs, business cost analysis, false positive impact, ensemble methods, and stakeholder education",
            skillsTestedAreas: ["model evaluation", "stakeholder management", "business understanding", "trade-off analysis"],
            difficulty: "8",
            industryRelevance: "Common conflict between business expectations and ML reality in financial applications"
        },
        {
            id: 3,
            question: "Which approach best handles concept drift in a real-time fraud detection system with 100,000 transactions per minute?",
            type: "multiple-choice" as const,
            options: [
                "Retrain the entire model weekly using all historical data",
                "Implement online learning with incremental updates and drift detection",
                "Use a fixed model with manual threshold adjustments",
                "Deploy multiple models and switch based on performance metrics"
            ],
            expectedAnswer: "Online learning with drift detection (option B) or ensemble approach (option D) depending on infrastructure",
            skillsTestedAreas: ["concept drift", "online learning", "real-time systems", "scalability"],
            difficulty: "7",
            industryRelevance: "High-volume real-time systems require sophisticated drift handling approaches"
        },
        {
            id: 4,
            question: "Your ML team wants to deploy a computer vision model for medical imaging, but the hospital's compliance team is concerned about model explainability and bias. Design a comprehensive strategy to address these concerns while maintaining model performance.",
            type: "text" as const,
            context: "Healthcare AI deployment with regulatory and ethical requirements",
            expectedAnswer: "Should cover LIME/SHAP explanations, bias testing across demographics, model cards, audit trails, and regulatory compliance",
            skillsTestedAreas: ["AI ethics", "explainable AI", "healthcare compliance", "bias detection"],
            difficulty: "8",
            industryRelevance: "Healthcare AI requires extensive explainability and bias mitigation strategies"
        },
        {
            id: 5,
            question: "You need to reduce your ML infrastructure costs by 40% while maintaining model performance and reliability. Your current setup uses cloud GPUs for training and serving. What specific cost optimization strategies would you implement?",
            type: "scenario" as const,
            context: "Budget pressure requiring significant cost reduction in ML infrastructure",
            expectedAnswer: "Should mention spot instances, model optimization, serverless inference, edge deployment, and cost monitoring",
            skillsTestedAreas: ["cost optimization", "ML infrastructure", "cloud economics", "model efficiency"],
            difficulty: "7",
            industryRelevance: "Cost optimization is critical for ML teams facing budget constraints"
        }
    ];

    const aiBeginnerQuestions = [
        {
            id: 1,
            question: "Imagine you just joined a streaming service company as a junior data analyst. Your manager says: 'We're losing too many subscribers each month, but we don't know why or who's likely to leave next. We have data on what shows people watch, how often they log in, their subscription history, and customer service tickets. I need you to help us understand this problem and come up with a plan.' How would you approach this challenge? Walk me through what you'd do in your first few weeks.",
            type: "scenario" as const,
            context: "You're a new hire at a streaming company facing a real business problem with subscriber retention. Your manager is looking for practical insights and a clear action plan.",
            expectedAnswer: "Should mention understanding the business problem first, exploring the data to find patterns, identifying what makes customers stay vs. leave, and proposing actionable solutions",
            skillsTestedAreas: ["business problem understanding", "data exploration approach", "practical thinking", "communication with stakeholders"],
            difficulty: "4",
            industryRelevance: "New analysts often face similar retention problems and need to translate business questions into data analysis approaches"
        },
        {
            id: 2,
            question: "Which evaluation metric would be most appropriate for a highly imbalanced dataset where you're detecting rare fraudulent transactions (0.1% of total transactions)?",
            type: "multiple-choice" as const,
            options: [
                "Accuracy",
                "Precision and Recall",
                "F1-Score",
                "Area Under ROC Curve (AUC-ROC)"
            ],
            expectedAnswer: "Precision and Recall (option B) are most important for imbalanced datasets",
            skillsTestedAreas: ["model evaluation", "imbalanced data", "metrics selection"],
            difficulty: "5",
            industryRelevance: "Imbalanced datasets are very common in real-world applications"
        },
        {
            id: 3,
            question: "Your model works well on your laptop but fails when deployed to production. The error logs show 'out of memory' errors during inference. What are the most likely causes and how would you investigate?",
            type: "text" as const,
            context: "Common deployment issue faced by beginners moving from development to production",
            expectedAnswer: "Should mention model size, batch processing, memory profiling, and resource constraints",
            skillsTestedAreas: ["deployment challenges", "resource management", "debugging", "production environment"],
            difficulty: "5",
            industryRelevance: "Development-to-production gaps are common pain points for ML engineers"
        },
        {
            id: 4,
            question: "You've been working on a machine learning model for two weeks. When you test it on your training data, it gets 98% accuracy - amazing! But when you show it to your manager using new data, it only gets 75% accuracy. Your manager looks concerned and asks, 'What happened? Why is the performance so different?' How would you explain this situation to your manager, and what would you do to fix it?",
            type: "scenario" as const,
            context: "You need to explain a common ML problem (overfitting) to a non-technical manager and propose solutions",
            expectedAnswer: "Should recognize overfitting, explain it in simple terms, and suggest practical solutions like getting more data or simplifying the model",
            skillsTestedAreas: ["understanding overfitting", "non-technical communication", "problem-solving", "model validation"],
            difficulty: "4",
            industryRelevance: "Overfitting is extremely common, and explaining technical issues to managers is a crucial workplace skill"
        },
        {
            id: 5,
            question: "Your manager asks you to explain why the ML model's predictions changed after retraining with new data. How would you approach this investigation and what tools might you use?",
            type: "text" as const,
            context: "Need to explain model behavior changes to non-technical stakeholders",
            expectedAnswer: "Should mention data comparison, feature importance analysis, model interpretation tools, and clear communication",
            skillsTestedAreas: ["model interpretation", "data analysis", "stakeholder communication", "change management"],
            difficulty: "5",
            industryRelevance: "Explaining model changes to business stakeholders is a crucial skill"
        }
    ];

    const cloudIntermediateQuestions = [
        {
            id: 1,
            question: "You're in the middle of presenting to the CEO when your phone starts buzzing with alerts. Your team's messaging app is blowing up: 'Site is slow!', 'Users can't checkout!', 'Orders are failing!' You excuse yourself and check the monitoring dashboard - it shows 500 errors affecting 3% of requests, but only during high traffic. CPU and memory look normal. The CEO wants to continue the demo in 30 minutes. How do you handle this situation?",
            type: "scenario" as const,
            context: "Critical production incident occurring during a high-stakes business presentation with time pressure to resolve",
            expectedAnswer: "Should mention immediate triage, systematic debugging approach, team coordination, stakeholder communication, and quick mitigation strategies",
            skillsTestedAreas: ["crisis management", "systematic troubleshooting", "stakeholder communication", "production systems"],
            difficulty: "8",
            industryRelevance: "Production incidents during important business events test both technical and leadership skills"
        },
        {
            id: 2,
            question: "Your company wants to migrate a legacy monolithic application to cloud-native architecture. The application has 200,000 daily active users, strict 99.9% uptime requirements, and compliance constraints. Design a migration strategy that minimizes risk and business disruption.",
            type: "scenario" as const,
            context: "Large-scale legacy modernization with business and regulatory constraints",
            expectedAnswer: "Should cover strangler fig pattern, blue-green deployment, data migration strategy, and compliance considerations",
            skillsTestedAreas: ["cloud migration", "architecture patterns", "risk management", "compliance"],
            difficulty: "8",
            industryRelevance: "Legacy modernization is a major challenge for enterprise organizations"
        },
        {
            id: 3,
            question: "Which strategy provides the best balance of reliability and cost-effectiveness for achieving zero-downtime deployments in a financial services application?",
            type: "multiple-choice" as const,
            options: [
                "Blue-green deployment with full infrastructure duplication",
                "Rolling updates with health checks and circuit breakers",
                "Canary deployment with automated rollback triggers",
                "Feature flags with gradual user migration"
            ],
            expectedAnswer: "Depends on specific requirements, but canary with automated rollback (option C) often provides best balance",
            skillsTestedAreas: ["deployment strategies", "risk management", "cost optimization", "automation"],
            difficulty: "7",
            industryRelevance: "Financial services require both reliability and cost consciousness"
        },
        {
            id: 4,
            question: "Your AWS bill increased 300% last month due to a misconfigured auto-scaling group that kept scaling up but never scaled down. Design a comprehensive cost governance framework to prevent this and optimize ongoing costs without impacting performance.",
            type: "text" as const,
            context: "Cost control crisis requiring immediate action and long-term prevention",
            expectedAnswer: "Should include cost monitoring, resource tagging, automated policies, and cultural changes",
            skillsTestedAreas: ["cost optimization", "governance", "automation", "monitoring"],
            difficulty: "7",
            industryRelevance: "Cloud cost management is critical for sustainable operations"
        },
        {
            id: 5,
            question: "You're implementing a CI/CD pipeline for a team of 15 developers working on a microservices application with 8 services. The pipeline must include security scanning, automated testing, and deployment to multiple environments. Design the pipeline architecture and explain your tool choices.",
            type: "scenario" as const,
            context: "Enterprise CI/CD implementation for a medium-sized development team",
            expectedAnswer: "Should cover GitOps, security integration, test automation, and environment promotion strategies",
            skillsTestedAreas: ["CI/CD design", "security automation", "team collaboration", "tooling decisions"],
            difficulty: "7",
            industryRelevance: "Modern development teams require sophisticated CI/CD pipelines"
        }
    ];

    const cloudBeginnerQuestions = [
        {
            id: 1,
            question: "You've been asked to deploy a simple web application to the cloud for the first time. The application consists of a React frontend and a Node.js backend with a database. What services and approach would you use on AWS, and why?",
            type: "text" as const,
            context: "First cloud deployment project with a basic web application stack",
            expectedAnswer: "Should mention compute services (EC2/ECS/Lambda), database (RDS), storage (S3), and basic networking concepts",
            skillsTestedAreas: ["cloud basics", "service selection", "architecture fundamentals"],
            difficulty: "4",
            industryRelevance: "Web application deployment is often the first cloud project for developers"
        },
        {
            id: 2,
            question: "What is the main benefit of using Infrastructure as Code (IaC) tools like Terraform or CloudFormation?",
            type: "multiple-choice" as const,
            options: [
                "Faster deployment of individual resources",
                "Lower cloud costs through automation",
                "Repeatable, version-controlled infrastructure management",
                "Better security through automated patching"
            ],
            expectedAnswer: "Repeatable, version-controlled infrastructure management (option C)",
            skillsTestedAreas: ["Infrastructure as Code", "DevOps practices", "version control"],
            difficulty: "3",
            industryRelevance: "IaC is fundamental to modern cloud operations"
        },
        {
            id: 3,
            question: "You're working from home and testing your new web app on your laptop. Everything works perfectly! But when you deploy it to the cloud for your team to see, it crashes immediately. The error message says 'connection refused to database.' Your team lead asks you to figure out what's wrong. What would you check first, and how would you go about solving this step by step?",
            type: "scenario" as const,
            context: "You're a developer who successfully ran an app locally but it's failing in the cloud environment. Your team is waiting for you to fix it.",
            expectedAnswer: "Should mention checking network settings, database connection strings, security permissions, and basic troubleshooting methodology",
            skillsTestedAreas: ["problem-solving approach", "cloud vs local differences", "basic networking", "troubleshooting mindset"],
            difficulty: "4",
            industryRelevance: "The 'works on my machine' problem is extremely common when moving from local development to cloud deployment"
        },
        {
            id: 4,
            question: "It's Monday morning and your boss walks into the office looking worried. She shows you the company's cloud bill and says, 'This month's bill is three times higher than usual! The CFO is asking questions and I need answers by lunch. Can you help me figure out what happened and how we can prevent this in the future?' You have access to the cloud console and billing dashboard. What's your game plan?",
            type: "scenario" as const,
            context: "Urgent cost crisis situation where you need to quickly investigate and provide solutions to leadership",
            expectedAnswer: "Should mention checking usage patterns, identifying unusual spikes, understanding what services cost the most, and proposing monitoring solutions",
            skillsTestedAreas: ["cost analysis under pressure", "problem-solving methodology", "business communication", "practical cloud economics"],
            difficulty: "4",
            industryRelevance: "Cloud cost spikes are common and often require immediate investigation and explanation to business stakeholders"
        },
        {
            id: 5,
            question: "Explain the difference between scaling up (vertical scaling) and scaling out (horizontal scaling) in cloud computing, and give an example of when you might choose each approach.",
            type: "text" as const,
            context: "Fundamental scaling concepts in cloud architecture",
            expectedAnswer: "Should clearly differentiate between adding power vs. adding instances, with practical examples",
            skillsTestedAreas: ["scaling concepts", "architecture fundamentals", "performance optimization"],
            difficulty: "3",
            industryRelevance: "Scaling strategies are fundamental to cloud application design"
        }
    ];

    if (domain === 'ai') {
        return level === 'intermediate' ? aiIntermediateQuestions : aiBeginnerQuestions;
    } else {
        return level === 'intermediate' ? cloudIntermediateQuestions : cloudBeginnerQuestions;
    }
};

// Enhanced fallback evaluation with more nuanced assessment
const getFallbackEvaluation = (level: string, questionCount: number): AssessmentResult => {
    const baseScore = level === 'beginner' ? 68 : 74;
    const variance = Math.floor(Math.random() * 10) - 5; // Random variance of ±5
    const finalScore = Math.max(45, Math.min(95, baseScore + variance));
    
    const levelCategories = {
        beginner: {
            actualLevel: 'Beginner' as const,
            levelName: finalScore >= 70 ? 'Solid Beginner' : 'Developing Beginner',
            isValid: finalScore >= 60,
            industryReadiness: Math.min(50, finalScore - 10),
            confidenceScore: 75
        },
        intermediate: {
            actualLevel: finalScore >= 80 ? 'Intermediate' as const : 'Beginner' as const,
            levelName: finalScore >= 80 ? 'Early Intermediate' : 'Advanced Beginner',
            isValid: finalScore >= 75,
            industryReadiness: Math.min(75, finalScore - 5),
            confidenceScore: 80
        }
    };

    const assessment = levelCategories[level as keyof typeof levelCategories];
    
    return {
        score: finalScore,
        level: assessment.levelName,
        actualLevel: assessment.actualLevel,
        isValidForChosenLevel: assessment.isValid,
        strengths: level === 'beginner' ? [
            "Shows enthusiasm and willingness to learn new technologies",
            "Demonstrates understanding of fundamental concepts",
            "Asks thoughtful questions and seeks clarification when needed",
            "Shows potential for growth with proper guidance"
        ] : [
            "Solid grasp of core concepts and industry terminology", 
            "Demonstrates practical problem-solving approach",
            "Shows awareness of modern tools and best practices",
            "Capable of working independently on well-defined tasks"
        ],
        weaknesses: level === 'beginner' ? [
            "Limited hands-on experience with real-world projects",
            "Needs more practice with industry-standard tools and workflows",
            "Could benefit from deeper understanding of production environments",
            "Requires mentorship to bridge theory-practice gap effectively"
        ] : [
            "Could benefit from more complex, real-world project experience",
            "Needs deeper understanding of advanced system design principles",
            "Limited experience with large-scale production challenges",
            "Could improve leadership and mentoring capabilities"
        ],
        recommendations: level === 'beginner' ? [
            "Start with guided projects using modern development tools and frameworks",
            "Join online communities and participate in code reviews to learn best practices",
            "Focus on building a portfolio of 2-3 substantial projects with real-world applications",
            "Seek mentorship opportunities and pair programming sessions with experienced developers",
            "Take courses on cloud platforms and DevOps practices to understand modern workflows"
        ] : [
            "Lead a complex project end-to-end to gain experience with system design and architecture",
            "Contribute to open-source projects to engage with larger codebases and communities",
            "Develop expertise in advanced topics like performance optimization and scalability",
            "Practice explaining technical concepts to non-technical stakeholders",
            "Consider pursuing relevant certifications to validate and expand your knowledge"
        ],
        nextSteps: level === 'beginner' ? [
            "Complete the foundational learning modules with hands-on coding exercises",
            "Build your first production-ready application using modern development practices",
            "Set up a personal development environment with industry-standard tools",
            "Join developer communities and start networking with industry professionals"
        ] : [
            "Take on progressively challenging projects that stretch your current capabilities",
            "Begin contributing to team architecture and design decisions",
            "Develop mentoring skills by helping junior developers on your team",
            "Explore advanced specializations within your chosen domain"
        ],
        detailedAnalysis: level === 'beginner' 
            ? `Your assessment shows a solid foundation in fundamental concepts with clear enthusiasm for learning. While you demonstrate good theoretical understanding, the main growth opportunity lies in gaining more hands-on experience with real-world projects and industry-standard tools. Your learning approach should focus on practical application and building confidence through guided project work. With consistent effort and mentorship, you have strong potential to advance to intermediate level within 6-12 months.`
            : `Your responses demonstrate competent ${level}-level knowledge with good practical understanding of core concepts. You show capability for independent problem-solving and awareness of industry practices. The assessment reveals some gaps in advanced system design and large-scale production experience, which is normal for your career stage. Your learning path should focus on taking on more complex challenges and developing leadership skills. You're well-positioned to advance to senior level with 1-2 years of focused growth.`,
        industryReadiness: assessment.industryReadiness,
        confidenceScore: assessment.confidenceScore,
        learningPath: level === 'beginner'
            ? "Focus on building strong foundations through hands-on projects, learning modern tools, and gaining practical experience with guidance from experienced mentors."
            : "Advance your skills through complex projects, system design challenges, and beginning to take on technical leadership responsibilities within your team."
    };
};
