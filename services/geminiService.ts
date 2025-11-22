
import { GoogleGenAI } from "@google/genai";
import { ResearchMode, DevPrompt, ResearchDocument, GroundingMetadata } from '../types';
import { MODES, APP_ARCHITECTURE_CONTEXT } from '../constants';

// Initialize the client with the API key from the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a streaming analysis of the provided text based on the selected research mode.
 */
export async function* streamResearchAnalysis(
  text: string,
  mode: ResearchMode,
  documents: ResearchDocument[] = [],
  visualize: boolean = false,
  useSearch: boolean = false,
  previousContext: string = ""
): AsyncGenerator<string, void, unknown> {
  const modeConfig = MODES[mode];

  // We use the 'gemini-3-pro-preview' model for complex reasoning tasks.
  const modelId = 'gemini-3-pro-preview';

  // Check if we have any URL documents, which strictly require search tools
  const hasUrlDocuments = documents.some(d => d.type === 'url');
  const enableSearch = useSearch || hasUrlDocuments;

  // Construct document context
  let contextString = "";
  if (documents.length > 0) {
      contextString += "\nYou have access to the following distinct sources (The Bookshelf):\n\n";
      documents.forEach(doc => {
          contextString += `--- START SOURCE ID: ${doc.id} ---\n`;
          
          if (doc.type === 'url') {
             contextString += `METADATA: Type: URL | Link: ${doc.title}\n`;
             contextString += `INSTRUCTION: The user has provided this URL as a source. Use the Google Search tool to access, read, and verify the content of this page to answer the query.\n`;
          } else {
             contextString += `METADATA: Title: "${doc.title}" | Type: ${doc.type}\n`;
             contextString += `CONTENT:\n${doc.content}\n`;
          }
          
          contextString += `--- END SOURCE ID: ${doc.id} ---\n\n`;
      });
      contextString += "When answering, explicitly cite the Source Title if drawing information from a specific document.\n";
      contextString += "If you are in 'Medici Mode', explicitly compare and contrast these sources where relevant.\n\n";
  }

  // Construct Conversation History Context
  let historyInstruction = "";
  if (previousContext) {
    historyInstruction = `
    PRIOR CONTEXT (Memory of previous turn):
    The user is following up on your previous analysis. 
    Below is the analysis you just generated. Use this to maintain the thread of reasoning.
    Do not repeat yourself, but build upon this context.
    
    --- START PREVIOUS ANALYSIS ---
    ${previousContext.substring(0, 15000)} 
    --- END PREVIOUS ANALYSIS ---
    `; 
    // Truncate to 15k chars to avoid blowing context limits unnecessarily, though Gemini 3 has huge context.
  }

  let visualizationInstruction = "";
  if (visualize) {
    visualizationInstruction = `
    CRITICAL INSTRUCTION: VISUAL LOGIC MAPPING
    You MUST also generate a Mermaid.js diagram to visualize the logical structure, causality, or relationship of your analysis.
    - Use 'mermaid' code blocks.
    - Structure: Use 'graph TD' (Flowchart) or 'sequenceDiagram'.
    - SYNTAX SAFETY RULE: You MUST enclose all node labels in double quotes to avoid syntax errors.
      - Correct: A["Concept A"] --> B["Concept B"]
      - Incorrect: A[Concept A] --> B[Concept B]
    - Do not use parentheses () or brackets [] inside labels unless they are strictly inside the double quotes.
    - Keep the diagram concise.
    `;
  }

  let searchInstruction = "";
  let tools: any[] = [];
  if (enableSearch) {
    searchInstruction = `
    ACTIVE SEARCH MODE ENABLED:
    - You have access to Google Search.
    - Verify claims against real-world sources.
    - If the user asks about recent events or specific papers not in the context, use search to find them.
    - IF A URL SOURCE WAS PROVIDED: Prioritize searching for that specific URL to retrieve its context.
    - The system will automatically append your sources to the output.
    `;
    tools.push({ googleSearch: {} });
  }

  const systemInstruction = `You are The Research Companion. 
  
  CORE PHILOSOPHY: THE CENTAUR MODEL
  - The User is the Executive (Judgment). You are the Engine (Scale).
  - Be intellectually honest. If you are speculating, say so.
  - If a user's premise is flawed, challenge it respectfully (Red Teaming).
  - Acknowledge your own limitations (e.g., "I cannot verify this without a search" or "This is a probabilistic correlation").

  ${contextString}
  ${historyInstruction}

  Every response should:
  - Be clear, practical, and structured.
  - Show reasoning.
  - Combine insights from psychology, statistics, scientific method, and creativity theory.
  - Elevate the researcher’s thinking.
  - Improve scientific rigor and originality.

  STRATEGIC GUIDANCE (SOCRATIC ENGINE):
  At the very end of your response, you MUST generate 3 "Socratic Follow-Up Questions" to push the research further.
  - These should be deep, structural questions, not just "tell me more."
  - Examples: "Have you controlled for [Variable]?", "How does this align with [Competing Theory]?", "What if the causal arrow is reversed?"
  - Format them strictly as a JSON array of strings inside a markdown code block tagged 'socratic-json'.
  - DO NOT use a markdown list or numbered list. ONLY a JSON array.
  - Example Format:
  \`\`\`socratic-json
  [
    "Question 1 text...",
    "Question 2 text...",
    "Question 3 text..."
  ]
  \`\`\`
  
  ${searchInstruction}
  ${visualizationInstruction}
  
  ${modeConfig.promptContext}`;

  try {
    const responseStream = await ai.models.generateContentStream({
      model: modelId,
      contents: [
        {
          role: 'user',
          parts: [{ text: text }],
        },
      ],
      config: {
        systemInstruction: systemInstruction,
        thinkingConfig: { thinkingBudget: 2048 }, 
        temperature: 0.7, 
        maxOutputTokens: 8192,
        tools: tools.length > 0 ? tools : undefined,
      },
    });

    let groundingMetadata: GroundingMetadata | null = null;

    for await (const chunk of responseStream) {
      const chunkText = chunk.text;
      
      // Capture grounding metadata if present in any chunk
      if (chunk.candidates && chunk.candidates[0] && chunk.candidates[0].groundingMetadata) {
        // We cast to unknown first because the SDK type might slightly differ from our simplified interface
        const gm = chunk.candidates[0].groundingMetadata as unknown as any;
        if (gm.groundingChunks) {
            groundingMetadata = {
                groundingChunks: gm.groundingChunks,
                webSearchQueries: gm.webSearchQueries || []
            };
        }
      }

      if (chunkText) {
        yield chunkText;
      }
    }

    // If we found grounding metadata, append it as a special hidden block at the end
    if (groundingMetadata) {
        const jsonBlock = `\n\n\`\`\`grounding-json\n${JSON.stringify(groundingMetadata)}\n\`\`\`\n`;
        yield jsonBlock;
    }

  } catch (error) {
    console.error("Gemini API Error:", error);
    yield `\n\n**Error encountered during analysis:** ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

/**
 * Generates a prompt for the developer to improve the application.
 */
export async function generateImprovementPrompt(history: DevPrompt[]): Promise<string> {
  const modelId = 'gemini-3-pro-preview';
  
  // Provide more history context (500 chars) so the model sees the "Rationale" of previous features
  const historyText = history.map(h => 
    `- [STATUS: ${h.status.toUpperCase()}] PROMPT SNIPPET: ${h.suggestion.substring(0, 500)}...`
  ).join('\n');

  const prompt = `
    ACT AS: A Visionary Product Owner and Lead Research Technologist.
    
    YOUR MISSION: 
    To evolve "The Research Companion" into the world's most essential tool for scientific discovery.
    
    CURRENT APP STATE (Technical & Functional):
    ${APP_ARCHITECTURE_CONTEXT}
    
    DEVELOPMENT HISTORY (Past Suggestions):
    ${historyText || "No history yet."}
    
    CRITICAL INSTRUCTION:
    - **DO NOT** suggest features listed in "CURRENT APP STATE" (e.g., Export, Source Manager/Bookshelf, History Sidebar, Visualization, Web Grounding). These are ALREADY IMPLEMENTED.
    - **DO NOT** suggest features listed in "DEVELOPMENT HISTORY" marked as [IMPLEMENTED].
    - Look for GAPS in the "Researcher's Journey": 
      1. Ingestion (DONE) 
      2. Analysis (DONE) 
      3. Visualization (DONE)
      4. Export (DONE)
      5. Socratic Follow-ups (DONE)
      6. WHAT IS NEXT? (e.g., Citation Management, Debate Simulation, Collaborative Modes).
    
    GOAL:
    Identify the next logical step to make this tool indispensable.
    The feature must be feasible in React 19 + Gemini API.
    
    OUTPUT:
    Generate a specific, technical prompt that I can feed to an AI coder to build this exact feature.
    The prompt should include:
    - Feature Name & Rationale.
    - Technical Implementation Details (Files to change, new components).
    - Expected Behavior.
    
    Output ONLY the prompt. Do not include any conversational text.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        temperature: 0.8,
      }
    });
    return response.text || "Could not generate prompt. Please try again.";
  } catch (error) {
    console.error("Error generating improvement prompt:", error);
    return "Error generating prompt. Check API configuration.";
  }
}

/**
 * Generates a structured synthesis matrix comparing selected documents.
 */
export async function generateSynthesisMatrix(
  documents: ResearchDocument[],
  dimensions: string[]
): Promise<string> {
  const modelId = 'gemini-2.5-flash'; // Using fast model for structured data extraction

  let contextString = "DOCUMENTS TO ANALYZE:\n\n";
  documents.forEach(doc => {
    contextString += `--- SOURCE: "${doc.title}" ---\n${doc.content.substring(0, 20000)}\n\n`; // Truncate if too large
  });

  const prompt = `
    Task: Generate a "Synthesis Matrix" comparing the provided documents.
    
    Dimensions to compare: ${dimensions.join(', ')}.
    
    Instructions:
    1. Analyze each document against the requested dimensions.
    2. Output a strict JSON object containing the data.
    3. The output MUST be a valid JSON object with the following structure:
       {
         "dimensions": ["Dimension 1", "Dimension 2", ...],
         "rows": [
           {
             "source_title": "Filename A",
             "Dimension 1": "Analysis value...",
             "Dimension 2": "Analysis value..."
           },
           ...
         ]
       }
    4. Do NOT use markdown formatting (like \`\`\`json) in the output, just the raw JSON string.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: [
        { role: 'user', parts: [{ text: contextString + prompt }] }
      ],
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      }
    });
    
    return response.text || "{}";
  } catch (error) {
    console.error("Synthesis Error:", error);
    return JSON.stringify({ error: "Failed to generate synthesis." });
  }
}
