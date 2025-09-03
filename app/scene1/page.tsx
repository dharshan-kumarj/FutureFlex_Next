"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TypingEffect from "../global/components/TypingEffect";
import { analyzeApplicationMaterials } from "./service/scene1Agent";
import MailConversation from "../global/components/MailConversation";
import { Mail } from "lucide-react";
import MDtoHTML from "../global/components/MDtoHTML";
import { storyEntries, requirementsMarkdown, createAnalysisEmail } from "./model/scene1Content";

function Scene1Page() {
  const router = useRouter();
  const [showTask, setShowTask] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [resumeContent, setResumeContent] = useState("");
  const [emailContent, setEmailContent] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleComplete = () => {
    setShowTask(true);
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
      setIsDrawerOpen(true); // Open the mail drawer when analysis is complete
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

  if (showTask) {
    return (
      <div className="h-screen bg-gray-100 flex flex-col relative">
        {/* Welcome Text in Background */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none z-0">
          <h1 className="text-4xl font-bold text-gray-300 mb-2">VelsyMedia Application Review</h1>
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

  return (
    <TypingEffect
      entries={storyEntries}
      onComplete={handleComplete}
    />
  );
}

export default Scene1Page;
