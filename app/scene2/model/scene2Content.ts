// Story entries for Scene 2 intro
export const storyEntries = [
  {
    text: "Two days later, Monday morning. Your phone buzzes with a notification.",
    size: "1.6rem",
    speed: 50
  },
  {
    text: "It's an email from VelsyMedia: \"Congratulations! We were impressed with your application materials.\"",
    size: "1.8rem",
    speed: 45
  },
  {
    text: "\"We'd like to invite you for a technical interview to discuss your skills and experience in more detail.\"",
    size: "1.6rem",
    speed: 45
  },
  {
    text: "Your heart races with excitement. This is the next step in your journey with VelsyMedia!",
    size: "1.6rem",
    speed: 45
  }
];

// Markdown for interview requirements
export const requirementsMarkdown = `
## Interview Structure

### 🎯 **Technical Questions (40%)**
- System design and architecture
- Programming concepts and best practices
- Problem-solving with code examples
- Technology stack knowledge

### 🤝 **Behavioral Questions (30%)**
- Past project experiences
- Teamwork and collaboration
- Learning and growth mindset
- Communication skills

### 📋 **Scenario-Based Questions (30%)**
- Real-world problem solving
- Decision-making under pressure
- Client interaction scenarios
- Team conflict resolution

## Evaluation Criteria

### ✅ **What We Look For:**
- **Technical Competency**: Solid understanding of core concepts
- **Communication**: Clear explanation of thought processes
- **Problem-Solving**: Systematic approach to challenges
- **Cultural Fit**: Alignment with VelsyMedia values
- **Growth Potential**: Willingness to learn and adapt

### ⏰ **Interview Details:**
- **Duration**: 45-60 minutes
- **Format**: AI-powered interactive interview
- **Questions**: 3-5 carefully selected questions
- **Time Limits**: Each question has a specific time allocation
- **Evaluation**: Real-time AI analysis with detailed feedback

## Tips for Success

### 🧠 **Before You Start:**
- Review your application materials
- Think about specific examples from your experience
- Practice explaining technical concepts clearly
- Prepare questions about VelsyMedia and the role

### 💡 **During the Interview:**
- Think aloud - explain your reasoning
- Use specific examples and metrics when possible
- Ask clarifying questions if needed
- Stay calm and take your time to think

### 🎯 **Communication Best Practices:**
- Structure your answers clearly (situation, action, result)
- Be honest about what you know and don't know
- Show enthusiasm for learning and growth
- Demonstrate problem-solving methodology
`;

// Create interview feedback email
export const createInterviewEmail = (result: any) => [
  {
    id: 1,
    sender: "sarah.chen@velsymedia.com",
    senderName: "Sarah Chen",
    recipient: "candidate@email.com",
    recipientName: "Dear Candidate",
    timestamp: "2 hours ago",
    body: `Dear Candidate,

Thank you for completing your technical interview with VelsyMedia. Our advanced AI evaluation system has carefully analyzed your responses, and we'd like to share comprehensive feedback.

**📊 Interview Performance Summary:**

Overall Score: ${result.overallScore}%
Technical Knowledge: ${result.technicalScore}%
Communication Skills: ${result.communicationScore}%
Problem-Solving Approach: ${result.problemSolvingScore}%
Cultural Fit Assessment: ${result.culturalFitScore}%

**✅ Key Strengths Identified:**
${result.strengths.map((strength: string) => `• ${strength}`).join('\n')}

**📈 Areas for Growth:**
${result.improvementAreas.map((area: string) => `• ${area}`).join('\n')}

**🤖 Advanced AI Analysis:**

${result.technicalInsights ? `
**Technical Assessment:**
${result.technicalInsights}
` : ''}
${result.behavioralInsights ? `
**Behavioral Analysis:**
${result.behavioralInsights}
` : ''}
${result.growthPotential ? `
**Growth Potential:**
${result.growthPotential}
` : ''}
${result.interviewQuality ? `
**Interview Quality Assessment:**
${result.interviewQuality}
` : ''}

**📝 Detailed Feedback:**
${result.detailedFeedback}

**🎯 Our Recommendation:** ${result.recommendation}

${result.overallScore >= 70 ? `
**🚀 Next Steps:**
${result.nextSteps.map((step: string) => `• ${step}`).join('\n')}

We're excited about the possibility of you joining our team at VelsyMedia! Our AI evaluation indicates strong potential for success in this role. Please proceed to the next phase of our selection process.

If you have any questions about this feedback or the next steps, please don't hesitate to reach out. Our team is here to support you throughout the process.

Looking forward to your continued participation in our hiring process!
` : `
We appreciate the time and effort you put into this interview. While we won't be moving forward with your application at this time, our AI analysis has identified specific areas for development that could strengthen future applications.

We encourage you to focus on the growth areas mentioned above and consider applying for future opportunities as you develop these skills.

We wish you the best in your career journey!
`}

Best regards,
Sarah Chen
Senior Technical Recruiter
VelsyMedia
sarah.chen@velsymedia.com
(555) 123-4567

---
This message was generated using VelsyMedia's advanced AI interview evaluation system. 
For questions about our hiring process or to discuss this feedback, please contact our HR team.`,
    attachments: [],
    isFromMe: false
  }
];
