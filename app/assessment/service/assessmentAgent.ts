import { getResponseForGivenPrompt } from '@/app/global/service/agent';

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

export const generateAssessmentQuestions = async (
    domain: string,
    level: string
): Promise<Question[]> => {
    const systemPrompt = `You are an expert industry professional and technical interviewer specializing in ${domain.toUpperCase()} assessment.
Your task is to generate industry-level assessment questions for a ${level} level candidate.

These questions should:
1. Reflect real-world challenges professionals face in ${domain}
2. Test both theoretical knowledge and practical application
3. Include scenario-based questions that mirror industry situations
4. Be appropriate for ${level} level (not too easy, not impossibly hard)
5. Help identify knowledge gaps between theory and practice

Generate exactly 5 questions in the following JSON format:
{
  "questions": [
    {
      "id": 1,
      "question": "question text",
      "type": "multiple-choice|text|scenario",
      "options": ["option1", "option2", "option3", "option4"], // only for multiple-choice
      "context": "scenario context if applicable"
    }
  ]
}

For ${domain === 'ai' ? 'AI' : 'Cloud Computing'} domain, focus on:
${domain === 'ai' 
  ? `- Machine Learning algorithms and implementation
  - Data preprocessing and feature engineering
  - Model evaluation and deployment
  - AI ethics and bias considerations
  - Real-world AI project challenges`
  : `- Cloud architecture and design patterns
  - Container orchestration and microservices
  - CI/CD pipelines and DevOps practices
  - Security and compliance in cloud environments
  - Cost optimization and scalability`
}

Make questions challenging but fair for ${level} level.`;

    const userPrompt = `Generate 5 industry-level assessment questions for ${domain} domain at ${level} level. 
Include a mix of question types: 2 multiple-choice, 2 scenario-based text questions, and 1 practical application question.`;

    try {
        const response = await getResponseForGivenPrompt(systemPrompt, userPrompt);
        const parsed = JSON.parse(response);
        return parsed.questions;
    } catch (error) {
        console.error('Error generating questions:', error);
        // Fallback questions if AI generation fails
        return getFallbackQuestions(domain, level);
    }
};

export const evaluateAnswers = async (
    domain: string,
    level: string,
    questions: Question[],
    answers: {[key: number]: string}
): Promise<AssessmentResult> => {
    const systemPrompt = `You are an expert ${domain.toUpperCase()} professional and career mentor.
Your task is to evaluate assessment answers and provide detailed feedback.

Evaluation criteria:
1. Technical accuracy and depth of understanding
2. Practical application awareness
3. Industry best practices knowledge
4. Problem-solving approach
5. Areas showing theory-practice gap

Provide evaluation in this JSON format:
{
  "score": number (0-100),
  "level": "string (Beginner/Intermediate/Advanced)",
  "strengths": ["strength1", "strength2", ...],
  "recommendations": ["recommendation1", "recommendation2", ...],
  "nextSteps": ["step1", "step2", ...]
}

Be constructive and specific in feedback. Focus on bridging theory-practice gaps.`;

    const userPrompt = `Please evaluate these assessment answers for ${domain} domain:

QUESTIONS AND ANSWERS:
${questions.map(q => {
        const answer = answers[q.id] || 'No answer provided';
        return `
Question ${q.id}: ${q.question}
${q.context ? `Context: ${q.context}` : ''}
Answer: ${answer}
---`;
    }).join('\n')}

Expected level: ${level}
Domain: ${domain}

Provide detailed evaluation with specific feedback.`;

    try {
        const response = await getResponseForGivenPrompt(systemPrompt, userPrompt);
        return JSON.parse(response);
    } catch (error) {
        console.error('Error evaluating answers:', error);
        // Fallback evaluation
        return getFallbackEvaluation(level);
    }
};

// Fallback questions if AI generation fails
const getFallbackQuestions = (domain: string, level: string): Question[] => {
    const aiQuestions = [
        {
            id: 1,
            question: "Which machine learning algorithm would you choose for a classification problem with a small dataset?",
            type: "multiple-choice" as const,
            options: [
                "Deep Neural Network with many layers",
                "Support Vector Machine (SVM)",
                "Random Forest with 1000 trees",
                "Gradient Boosting with high learning rate"
            ]
        },
        {
            id: 2,
            question: "You're building an AI model for a healthcare startup. The model will predict patient readmission risk. What are the key ethical considerations and technical challenges you would address?",
            type: "text" as const,
            context: "A healthcare startup wants to reduce hospital readmissions by predicting which patients are at highest risk."
        },
        {
            id: 3,
            question: "Your machine learning model shows 95% accuracy on training data but only 70% on test data. What's happening and how would you address this?",
            type: "text" as const
        },
        {
            id: 4,
            question: "Which technique is most effective for handling imbalanced datasets in machine learning?",
            type: "multiple-choice" as const,
            options: [
                "Always use SMOTE (Synthetic Minority Oversampling)",
                "Simply collect more data",
                "Combine multiple techniques based on the specific problem",
                "Use only precision as the metric"
            ]
        },
        {
            id: 5,
            question: "You need to deploy a real-time recommendation system that serves 1 million users. Describe your architecture approach, considering both ML and infrastructure aspects.",
            type: "scenario" as const,
            context: "An e-commerce company needs real-time product recommendations for their mobile app with 1M+ daily active users."
        }
    ];

    const cloudQuestions = [
        {
            id: 1,
            question: "Which AWS service combination would you use for a scalable web application with global users?",
            type: "multiple-choice" as const,
            options: [
                "EC2 + RDS in one region",
                "CloudFront + ALB + Auto Scaling Groups + Multi-AZ RDS",
                "Lambda + DynamoDB in one region",
                "ECS + S3 + single AZ deployment"
            ]
        },
        {
            id: 2,
            question: "Your company's cloud costs have increased by 300% in the last quarter. As a cloud engineer, how would you investigate and optimize these costs?",
            type: "text" as const,
            context: "A startup's AWS bill went from $2,000 to $8,000 per month without a proportional increase in users."
        },
        {
            id: 3,
            question: "Design a CI/CD pipeline for a microservices application that needs to deploy to multiple environments (dev, staging, prod) with zero downtime.",
            type: "scenario" as const,
            context: "A fintech company has 8 microservices that need coordinated deployments across environments."
        },
        {
            id: 4,
            question: "What is the primary benefit of using Infrastructure as Code (IaC)?",
            type: "multiple-choice" as const,
            options: [
                "It's faster than manual setup",
                "Version control, repeatability, and consistency",
                "It's cheaper than manual configuration",
                "It requires less technical knowledge"
            ]
        },
        {
            id: 5,
            question: "A critical production service is experiencing intermittent 5xx errors. Walk through your troubleshooting approach using cloud-native monitoring and debugging tools.",
            type: "text" as const,
            context: "Users report occasional 'Service Unavailable' errors on your main e-commerce platform during peak hours."
        }
    ];

    return domain === 'ai' ? aiQuestions : cloudQuestions;
};

// Fallback evaluation if AI evaluation fails
const getFallbackEvaluation = (level: string): AssessmentResult => {
    return {
        score: level === 'beginner' ? 65 : 75,
        level: level === 'beginner' ? 'Beginner' : 'Intermediate',
        strengths: [
            "Good foundation in core concepts",
            "Shows enthusiasm for learning",
            "Understands basic principles"
        ],
        recommendations: [
            "Focus on hands-on projects",
            "Practice with real-world scenarios",
            "Build a portfolio of practical applications"
        ],
        nextSteps: [
            "Start with guided projects",
            "Join industry communities",
            "Practice problem-solving daily"
        ]
    };
};
