export async function generateAIResponse(
  message: string,
  tool: "V0" | "Cursor" | "Bolt" | "Tempo",
  signal?: AbortSignal,
) {
  try {
    const apiKey =
      process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error("OpenAI API key is missing");
    }

    // Create tool-specific system prompts
    const toolPrompts = {
      V0: "You are an expert in V0 AI design tool. Based on the user's product idea, create a detailed prompt that they can use with V0 to generate their desired UI design. Include specific layout suggestions, component recommendations, and styling preferences. Format the prompt to be directly usable in V0.",
      Cursor:
        "You are an expert in Cursor AI coding tool. Based on the user's product idea, create a detailed prompt that they can use with Cursor to develop their application. Include specific technical requirements, architecture suggestions, and implementation details. Format the prompt to be directly usable with Cursor's /edit or /chat commands.",
      Bolt: "You are an expert in Bolt AI development tool. Based on the user's product idea, create a detailed prompt that they can use with Bolt to build their application. Include specific feature requirements, technical specifications, and implementation guidance. Format the prompt to be directly usable in Bolt.",
      Tempo:
        "You are an expert in Tempo AI development platform. Based on the user's product idea, create a detailed prompt that they can use with Tempo to build their application. Include specific component structures, styling preferences, and functionality details. Format the prompt to be directly usable in Tempo's chat interface.",
    };

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              toolPrompts[tool] ||
              `You are an expert in ${tool} AI tool. Create a detailed prompt based on the user's product idea.`,
          },
          {
            role: "user",
            content: `Create a detailed prompt for ${tool} based on this product idea: ${message}. Include feature list, functionality details, and specific implementation guidance. Format your response with markdown for better readability.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
      signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `API request failed with status ${response.status}: ${errorData.error?.message || "Unknown error"}`,
      );
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    throw error;
  }
}
