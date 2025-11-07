const OPENAI_API_KEY = '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';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface BuildingAdvice {
  title: string;
  reason: string;
  category?: string;
  estimation?: string;
}

export class OpenAIService {
  private static async makeRequest(messages: ChatMessage[]): Promise<string> {
    try {
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${await response.text()}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'Sorry, I couldn\'t process your request.';
    } catch (error) {
      console.error('OpenAI API request failed:', error);
      throw new Error('Failed to get response from AI assistant');
    }
  }

  static async getBuildingAdvice(
    userQuery: string, 
    chatHistory: ChatMessage[]
  ): Promise<{ response: string; suggestions: string[] }> {
    const systemPrompt = `You are an AI Nutritionist consultant. You help with questions about nutrition, calories, diet and healthy lifestyle.

Your capabilities:
1. Calculate calories and macronutrients
2. Provide healthy eating recommendations
3. Create meal plans
4. Give advice on weight loss/gain
5. Provide information about food products and their benefits
6. Recommend eating schedules

Guidelines:
1. Be friendly and professional
2. Give specific recommendations
3. Ask clarifying questions for better understanding
4. Suggest alternative options
5. Keep responses concise but helpful
6. If additional information is needed, ask for it

Respond in English naturally and conversationally.`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...chatHistory.slice(-5), // Keep last 5 messages for context
      { role: 'user', content: userQuery }
    ];

    try {
      const response = await this.makeRequest(messages);
      
      // Generate suggestions based on response
      const suggestions = this.generateNutritionSuggestions(userQuery, response);
      
      return { response, suggestions };
    } catch (error) {
      return {
        response: "I'm having connection issues. Please try again in a moment.",
        suggestions: ['Try again', 'Ask about protein', 'Calculate calories']
      };
    }
  }

  private static generateNutritionSuggestions(userQuery: string, aiResponse: string): string[] {
    const lowerQuery = userQuery.toLowerCase();
    const suggestions = [];

    // Generate contextual suggestions based on user query
    if (lowerQuery.includes('protein') || lowerQuery.includes('amino')) {
      suggestions.push('Protein sources', 'Daily protein needs', 'Plant-based protein');
    } else if (lowerQuery.includes('calorie') || lowerQuery.includes('weight loss')) {
      suggestions.push('Calorie deficit', 'Portion control', 'Low-calorie foods');
    } else if (lowerQuery.includes('workout') || lowerQuery.includes('exercise')) {
      suggestions.push('Pre-workout meals', 'Post-workout nutrition', 'Sports nutrition');
    } else if (lowerQuery.includes('plan') || lowerQuery.includes('meal')) {
      suggestions.push('Weekly menu', 'Healthy snacks', 'Eating schedule');
    } else if (lowerQuery.includes('vitamin') || lowerQuery.includes('mineral')) {
      suggestions.push('Vitamin sources', 'Daily requirements', 'Vitamin deficiency');
    } else if (lowerQuery.includes('breakfast') || lowerQuery.includes('lunch') || lowerQuery.includes('dinner')) {
      suggestions.push('Breakfast ideas', 'Healthy dinner', 'Balanced lunch');
    } else {
      suggestions.push('Healthy foods', 'Hydration tips', 'Macro balance');
    }

    return suggestions.slice(0, 3);
  }


  static async getMaterialInfo(materialName: string): Promise<string> {
    const systemPrompt = `You are a construction materials expert. Provide a brief but informative description of the material "${materialName}". 
    Include key characteristics, applications, advantages and disadvantages. Respond conversationally and interestingly in English.`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Tell me about the material "${materialName}"` }
    ];

    try {
      return await this.makeRequest(messages);
    } catch (error) {
      return `I'd love to tell you more about "${materialName}", but I'm having trouble accessing that information right now.`;
    }
  }

  static async calculateMaterials(projectDetails: string): Promise<string> {
    const systemPrompt = `You are a construction materials calculator. Help calculate the necessary materials for the project.
    Provide an approximate calculation with formula explanations and material reserve allowance (usually 10-15%).
    Respond in a structured and clear manner.`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Help me calculate materials for: ${projectDetails}` }
    ];

    try {
      return await this.makeRequest(messages);
    } catch (error) {
      return `I can't perform the calculation for "${projectDetails}" right now. Please try later.`;
    }
  }

  static async analyzeFoodImage(imageBase64: string): Promise<{ name: string; calories: number } | null> {
    try {
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a nutrition expert. Analyze the food image and return ONLY valid JSON without any additional text.
              
Response format:
{
  "name": "Dish name in English",
  "calories": number_of_calories
}

Rules:
- If the photo is NOT food, return: {"name": "Unable to identify dish", "calories": 0}
- Name should be brief and clear
- Calories should be for the average portion in the photo
- Return ONLY JSON, without markdown or other characters`
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Analyze this food image and return JSON with the dish name and calorie count.'
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${imageBase64}`,
                    detail: 'low'
                  }
                }
              ]
            }
          ],
          max_tokens: 300,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI Vision API error:', errorText);
        throw new Error(`OpenAI Vision API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content in response');
      }

      // Clean the response - remove markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/```\n?/g, '');
      }

      const result = JSON.parse(cleanContent);
      
      // Validate the result
      if (result && typeof result.name === 'string' && typeof result.calories === 'number') {
        return {
          name: result.name,
          calories: Math.max(0, Math.round(result.calories))
        };
      }

      return null;
    } catch (error) {
      console.error('Error analyzing food image:', error);
      return null;
    }
  }
}
