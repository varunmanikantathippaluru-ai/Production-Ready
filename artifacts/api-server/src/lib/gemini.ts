import { GoogleGenerativeAI } from "@google/generative-ai";

const geminiKey = process.env["GEMINI_API_KEY"];
if (!geminiKey) throw new Error("GEMINI_API_KEY must be set");

const genAI = new GoogleGenerativeAI(geminiKey);

export function getGeminiModel() {
  return genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
}

export function buildDocumentSystemPrompt(documentContent: string, documentName: string): string {
  return `You are an intelligent AI assistant helping a user understand the document "${documentName}".

DOCUMENT CONTENT:
---
${documentContent.slice(0, 800000)}
---

INSTRUCTIONS:
- Answer ONLY based on the content in the document above
- If the information is not in the document, clearly state that
- Be helpful, accurate, and concise
- Use markdown formatting for clarity when appropriate
- Do not make up information that is not in the document`;
}

export function buildFeaturePrompt(featureType: string, documentContent: string, documentName: string, additionalContext?: string): string {
  const docSection = `Document: "${documentName}"\n\nContent:\n${documentContent.slice(0, 700000)}\n\n`;

  const prompts: Record<string, string> = {
    summary: `${docSection}Please provide a comprehensive summary of this document. Include the main topics, key arguments, and important conclusions. Format with clear headings and bullet points.`,
    keyPoints: `${docSection}Extract the most important key points from this document. Present them as a numbered list with brief explanations for each point.`,
    chapterSummary: `${docSection}Provide a summary of each chapter or major section in this document. Use headings to organize by section.`,
    studyNotes: `${docSection}Create comprehensive study notes from this document. Include definitions, key concepts, important facts, and anything that would be useful for studying. Use headings, bullet points, and highlight important terms.`,
    flashcards: `${docSection}Create 15-20 flashcard pairs (question and answer) based on the most important concepts in this document. Format as:\nQ: [question]\nA: [answer]\n\n`,
    quiz: `${docSection}Create a 10-question multiple choice quiz based on the content of this document. For each question provide:\n- The question\n- Four options (A, B, C, D)\n- The correct answer\n- A brief explanation`,
    questionGenerator: `${docSection}Generate 20 thought-provoking questions that test comprehension of this document. Include factual, conceptual, and analytical questions at different difficulty levels.`,
    definitions: `${docSection}Extract and define all important terms, concepts, jargon, and technical vocabulary from this document. Format as a glossary with clear definitions.`,
    importantDates: `${docSection}Extract all important dates, timelines, deadlines, and chronological information from this document. Present them in chronological order with context.`,
    importantFormulas: `${docSection}Extract all mathematical formulas, equations, algorithms, and quantitative relationships from this document. Explain each formula clearly.`,
    importantConcepts: `${docSection}Identify and explain the most important concepts, theories, frameworks, and ideas presented in this document.`,
    mindMap: `${docSection}Create a text-based mind map structure for the main topics in this document. Use indentation to show hierarchy:\nMain Topic\n  → Subtopic 1\n    → Detail\n  → Subtopic 2`,
    examPrep: `${docSection}Create a comprehensive exam preparation guide for this document. Include: key topics to study, likely exam questions, memory tips, and a study checklist.`,
    interviewQuestions: `${docSection}Generate 15-20 interview questions based on the topics covered in this document. Include both technical questions and conceptual understanding questions with model answers.`,
    actionItems: `${docSection}Extract all action items, tasks, recommendations, and next steps mentioned in this document. Present as a prioritized task list.`,
    meetingMinutes: `${docSection}Extract and format the key information from this document as professional meeting minutes. Include: decisions made, action items, key discussion points, and follow-ups.`,
    translate: `${docSection}${additionalContext ? `Translate this document to ${additionalContext}.` : "Please specify a target language in your request."} Maintain the original structure and formatting.`,
    explainSimply: `${docSection}Explain the content of this document in very simple language that a 10-year-old could understand. Avoid jargon, use analogies, and break complex ideas into simple concepts.`,
    generateFaqs: `${docSection}Generate a comprehensive FAQ (Frequently Asked Questions) document based on the content. Include 15-20 questions and detailed answers covering the most important aspects.`,
  };

  const prompt = prompts[featureType];
  if (!prompt) throw new Error(`Unknown feature type: ${featureType}`);

  return additionalContext && featureType !== "translate"
    ? `${prompt}\n\nAdditional context: ${additionalContext}`
    : prompt;
}
