import { getResponseForGivenPrompt } from '@/app/global/service/agent';

interface AnalysisResult {
    resumeScore: number;
    emailScore: number;
    overallScore: number;
    resumeSuggestions: string[];
    emailSuggestions: string[];
    strengths: string[];
    areasForImprovement: string[];
}

export const analyzeApplicationMaterials = async (
    resumeContent: string,
    emailContent: string
): Promise<AnalysisResult> => {
    console.log(resumeContent)
    console.log(emailContent)
    const systemPrompt = `You are an expert HR professional and career coach specializing in reviewing applications for tech positions.
Your task is to analyze a resume and application email for a Junior Full-Stack Developer & AI Enthusiast position.

Provide your analysis in the following JSON format:
{
  "resumeScore": number (0-100),
  "emailScore": number (0-100),
  "overallScore": number (0-100),
  "resumeSuggestions": ["suggestion1", "suggestion2", ...],
  "emailSuggestions": ["suggestion1", "suggestion2", ...],
  "strengths": ["strength1", "strength2", ...],
  "areasForImprovement": ["area1", "area2", ...]
}

Evaluation criteria:
- Resume: Professional format, relevant skills, clear structure, proper sections
- Email: Professional tone, company research, clear value proposition, proper structure
- Overall: Coherence between materials, alignment with job requirements

Be thorough but constructive in your feedback.`;

    const userPrompt = `Please analyze the following application materials:

RESUME CONTENT:
${resumeContent}

EMAIL CONTENT:
${emailContent}

Please provide a detailed analysis with scores and specific suggestions for improvement.`;

    try {
        const response = await getResponseForGivenPrompt(systemPrompt, userPrompt);
        console.log("AI response",response)

        // Clean the response to extract JSON from markdown code blocks
        let cleanedResponse = response.trim();

        // Remove markdown code block wrappers if present
        if (cleanedResponse.startsWith('```json')) {
          cleanedResponse = cleanedResponse.replace(/^```json\s*/, '');
        }
        if (cleanedResponse.startsWith('```')) {
          cleanedResponse = cleanedResponse.replace(/^```\s*/, '');
        }
        if (cleanedResponse.endsWith('```')) {
          cleanedResponse = cleanedResponse.replace(/\s*```$/, '');
        }

        // Try to parse the JSON response
        try {
          const analysis = JSON.parse(cleanedResponse);
          return {
            resumeScore: analysis.resumeScore || 0,
            emailScore: analysis.emailScore || 0,
            overallScore: analysis.overallScore || 0,
            resumeSuggestions: analysis.resumeSuggestions || [],
            emailSuggestions: analysis.emailSuggestions || [],
            strengths: analysis.strengths || [],
            areasForImprovement: analysis.areasForImprovement || []
          };
        } catch (parseError) {
          // If JSON parsing fails, create a basic analysis
          console.error('Failed to parse AI response as JSON:', parseError);
          console.error('Cleaned response:', cleanedResponse);
          return {
            resumeScore: 75,
            emailScore: 75,
            overallScore: 75,
            resumeSuggestions: ['Unable to parse detailed suggestions from AI response'],
            emailSuggestions: ['Unable to parse detailed suggestions from AI response'],
            strengths: ['Materials submitted for review'],
            areasForImprovement: ['Please review the AI response manually']
          };
        }
    } catch (error) {
        console.error('Error analyzing application materials:', error);
        throw new Error('Failed to analyze application materials. Please try again.');
    }
};
