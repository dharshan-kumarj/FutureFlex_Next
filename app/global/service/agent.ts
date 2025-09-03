import { GoogleGenerativeAI } from '@google/generative-ai';

const getApiKey = () => {
    const apiKey = localStorage.getItem('geminiApiKey');
    if (!apiKey) {
        throw new Error('Gemini API key not found in localStorage. Please set the "geminiApiKey" key.');
    }
    return apiKey;
};

export const getResponseForGivenPrompt = async (
    systemPrompt: string,
    userPrompt: string
): Promise<string> => {
    try {
        const apiKey = getApiKey();
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        // Combine system prompt and user prompt
        const fullPrompt = `${systemPrompt}\n\nUser: ${userPrompt}\n\nAssistant:`;

        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const text = await response.text();
        return text;
    } catch (error) {
        console.error("Error getting AI response:", error);
        throw new Error("Sorry, I couldn't process your request. Please make sure your API key is set correctly in localStorage with the key 'geminiApiKey'.");
    }
};

/**
 * Checks if the user's program logic is correct compared to the expected logic/behavior.
 * Returns an object with result ('correct' | 'wrong') and a team leader style review.
 * @param userCode - The code/program provided by the user
 * @param expectedLogic - The expected logic, code, or behavior
 * @returns Promise<{ result: 'correct' | 'wrong', review: string }>
 */
export async function isAnswerCorrect(userCode: string, expectedLogic: string): Promise<{ result: 'correct' | 'wrong', review: string }> {
  if (!userCode || !expectedLogic) {
    return {
      result: 'wrong',
      review: 'No code or expected logic provided. Please submit your solution for review.'
    };
  }
  const systemPrompt = `You are a senior team leader reviewing a junior developer's code submission. Your job is to check if the user's program logic is correct and meets the expected requirements. Focus on whether the code works as intended, not on minor style issues. Reply ONLY in the following JSON format:\n{\n  \"result\": \"correct\" or \"wrong\",\n  \"review\": \"<short feedback as a team leader>\"\n}\nIf the code is correct, appreciate the developer. If not, provide constructive suggestions to improve.`;
  const userPrompt = `User's code:\n${userCode}\n\nExpected logic/behavior:\n${expectedLogic}`;
  const response = await getResponseForGivenPrompt(systemPrompt, userPrompt);
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
  try {
    const parsed = JSON.parse(cleanedResponse);
    if (parsed.result === 'correct' || parsed.result === 'wrong') {
      return parsed;
    }
  } catch (e) {
    // fallback if AI response is not JSON
  }
  return {
    result: 'wrong',
    review: 'Unable to determine correctness. Please review your code and ensure it meets the requirements.'
  };
}
