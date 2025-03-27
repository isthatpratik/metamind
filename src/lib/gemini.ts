import { GoogleGenerativeAI } from '@google/generative-ai';

export async function generateAIResponse(
  message: string,
  tool: "V0" | "Cursor" | "Bolt" | "Tempo" | "Lovable",
  signal?: AbortSignal,
) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("Gemini API key is missing. Please add NEXT_PUBLIC_GEMINI_API_KEY to your .env.local file");
    }

    // Create tool-specific system prompts
    const toolPrompts = {
      V0: "You are an expert in V0 AI design tool. Based on the user's product idea, create a detailed prompt that they can use with V0 to generate their desired UI design. Include specific layout suggestions, component recommendations, and styling preferences. Format the prompt to be directly usable in V0. Do not include any introductory or concluding paragraphs.",
      Cursor:
        "You are an expert in Cursor AI coding tool. Based on the user's product idea, create a detailed prompt that they can use with Cursor to develop their application. Include specific technical requirements, architecture suggestions, and implementation details. Format the prompt to be directly usable with Cursor's /edit or /chat commands. Do not include any introductory or concluding paragraphs.",
      Bolt: "You are an expert in Bolt AI development tool. Based on the user's product idea, create a detailed prompt that they can use with Bolt to build their application. Include specific feature requirements, technical specifications, and implementation guidance. Format the prompt to be directly usable in Bolt. Do not include any introductory or concluding paragraphs.",
      Tempo:
        "You are an expert in Tempo AI development platform. Based on the user's product idea, create a detailed prompt that they can use with Tempo to build their application. Include specific component structures, styling preferences, and functionality details. Format the prompt to be directly usable in Tempo's chat interface. Do not include any introductory or concluding paragraphs.",
      Lovable:
        "You are an expert in Lovable AI design tool. Based on the user's product idea, create a detailed prompt that they can use with Lovable to design their application. Include specific UI/UX requirements, design system recommendations, and visual style guidelines. Format the prompt to be directly usable in Lovable's interface. Do not include any introductory or concluding paragraphs.",
    };

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `${toolPrompts[tool] || `You are an expert in ${tool} AI tool. Create a detailed prompt based on the user's product idea. Do not include any introductory or concluding paragraphs.`}

Create a detailed prompt for ${tool} based on this product idea: ${message}. Include feature list, functionality details, and specific implementation guidance. Format your response with markdown for better readability.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
} 