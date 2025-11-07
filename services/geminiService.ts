import { GoogleGenAI, Type } from '@google/genai';
import { Material } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        name: {
          type: Type.STRING,
          description: 'The name of the material.',
        },
        description: {
            type: Type.STRING,
            description: 'A brief description of the material and its suitability for the user\'s query.'
        },
        properties: {
            type: Type.OBJECT,
            properties: {
                sustainability: { type: Type.STRING, description: 'e.g., "High", "Medium", "Low", "Recycled", "FSC Certified"' },
                durability: { type: Type.STRING, description: 'e.g., "Very High", "High", "Medium", "Scratch-resistant"' },
                cost: { type: Type.STRING, description: 'e.g., "Premium", "High", "Moderate", "Economical"' },
            },
        },
        commonUses: {
            type: Type.ARRAY,
            items: {
                type: Type.STRING
            },
            description: 'A list of common applications for this material.'
        }
      },
      required: ['name', 'description', 'properties', 'commonUses']
    },
};

export const generateMaterialSuggestions = async (query: string): Promise<Material[]> => {
  try {
    const systemInstruction = `You are an expert material consultant for a high-end furniture manufacturing company.
    Your task is to suggest materials based on user requirements.
    Analyze the user's query and provide 3 relevant material suggestions.
    For each material, provide a name, a concise description, key properties (sustainability, durability, cost), and a list of common uses.
    Return the response as a JSON array of objects that strictly adheres to the provided schema. Do not include any markdown formatting like \`\`\`json.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `User query: "${query}"`,
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema,
        }
    });

    const jsonText = response.text.trim();
    // It's possible the response is wrapped in markdown, let's strip it.
    const sanitizedJsonText = jsonText.replace(/^```json\s*|```$/g, '');
    const suggestions: Omit<Material, 'id' | 'unit'>[] = JSON.parse(sanitizedJsonText);
    
    // Add a temporary unique ID and default unit for React keys and type compliance
    return suggestions.map(s => ({...s, id: `ai-${s.name}-${Math.random()}`, unit: 'units' }));

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to generate material suggestions. Please try again.");
  }
};
