// Story entries for the scene 1 intro
export const storyEntries = [
  {
    text: "Friday, July 25, 2025, in Chennai, India. You're browsing social media, looking for opportunities.",
    size: "1.6rem",
    speed: 50
  },
  {
    text: "Suddenly, a job posting from VelsyMedia catches your eye: \"Junior Full-Stack Developer & AI Enthusiast.\"",
    size: "1.8rem",
    speed: 45
  },
  {
    text: "This role perfectly matches what you've been learning. VelsyMedia focuses on digital content and media analytics, using AI.",
    size: "1.6rem",
    speed: 45
  },
  {
    text: "Feeling excited, you spend hours crafting your application. After double-checking everything, you click 'Send'.",
    size: "1.6rem",
    speed: 45
  }
];

// Markdown for requirements
export const requirementsMarkdown = `
**Submit both your resume and application email as described below.**

### Resume
- One page, professional format
- Include: contact info, summary, skills, education, projects, and (optionally) certifications

### Application Email
- Professional tone, addressed to careers@velsymedia.in
- Subject line as specified
- Mention your Smart Customer Support Portal project

### General Guidelines
- Highlight your relevant skills, experience, and enthusiasm for VelsyMedia and the role
- Proofread for grammar, spelling, and clarity
- Avoid overly casual language
- See the placeholders in the form below for example formats and required sections

---
#### Tips for Success
- Use relevant keywords from the job description
- Quantify achievements where possible
- Ensure all information is accurate and verifiable
- Show enthusiasm without being excessive
`;

// Message type for createAnalysisEmail
export type Message = {
  id: number;
  sender: string;
  senderName: string;
  recipient: string;
  recipientName: string;
  timestamp: string;
  body: string;
  attachments: any[];
  isFromMe: boolean;
};

// Function to create the analysis email
export function createAnalysisEmail(result: any): Message[] {
  const timestamp = new Date().toLocaleString();
  const analysisBody = `
Dear Applicant,

Thank you for submitting your application materials for the Junior Full-Stack Developer & AI Enthusiast position at VelsyMedia. Our team has carefully reviewed your resume and application email.

${result.overallScore >= 80 ? 'We are pleased to inform you that your application meets our professional standards.' : 'We appreciate your effort. Your application shows promise, with some areas that could be further strengthened.'}

Strengths:
${result.strengths.map((strength: string) => `• ${strength}`).join('\n')}

Areas for Improvement:
${result.areasForImprovement.map((area: string) => `• ${area}`).join('\n')}

Resume Suggestions:
${result.resumeSuggestions.map((suggestion: string) => `• ${suggestion}`).join('\n')}

Email Suggestions:
${result.emailSuggestions.map((suggestion: string) => `• ${suggestion}`).join('\n')}

${result.overallScore >= 80 ?
`Next Steps:
Congratulations. You are now eligible to proceed to the next phase of our simulation. You may continue to Scene 2 to experience the next stage of your application journey.` :
`Next Steps:
We recommend implementing the suggestions above to further improve your application. You may revise your materials and resubmit for another review, or proceed to the next simulation phase if you are satisfied with your current submission.`}

Best regards,
VelsyMedia HR Team
`;

  return [
    {
      id: 1,
      sender: "hr@velsymedia.in",
      senderName: "VelsyMedia HR Team",
      recipient: "applicant@email.com",
      recipientName: "Applicant",
      timestamp: timestamp,
      body: analysisBody,
      attachments: [],
      isFromMe: false
    }
  ];
}
