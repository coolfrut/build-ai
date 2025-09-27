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
        throw new Error(`OpenAI API error: ${response.status}`);
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
    const systemPrompt = `You are an AI Building Assistant. You help with construction questions, material calculations, work planning, and construction project consultations.

Your capabilities:
1. Material calculations (cement, brick, metal, wood, etc.)
2. Construction work planning
3. Project cost estimation
4. Construction technology advice
5. Tool and equipment recommendations
6. Material selection assistance

Guidelines:
1. Be friendly and professional
2. Provide specific recommendations when possible
3. Ask clarifying questions for better understanding
4. Suggest alternative solutions
5. Keep responses concise but helpful
6. If information is lacking, ask for more details

Respond in English naturally and conversationally.`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...chatHistory.slice(-5), // Keep last 5 messages for context
      { role: 'user', content: userQuery }
    ];

    try {
      const response = await this.makeRequest(messages);
      
      // Generate suggestions based on response
      const suggestions = this.generateSuggestions(userQuery, response);
      
      return { response, suggestions };
    } catch (error) {
      return {
        response: "I'm having connection issues right now. Please try again in a moment.",
        suggestions: ['Try again', 'Ask about materials', 'Cost calculation']
      };
    }
  }

  private static generateSuggestions(userQuery: string, aiResponse: string): string[] {
    const lowerQuery = userQuery.toLowerCase();
    const suggestions = [];

    // Generate contextual suggestions based on user query
    if (lowerQuery.includes('cement') || lowerQuery.includes('concrete')) {
      suggestions.push('Rebar calculation', 'Mix proportions', 'Curing time');
    } else if (lowerQuery.includes('brick') || lowerQuery.includes('masonry')) {
      suggestions.push('Mortar calculation', 'Brick types', 'Laying technique');
    } else if (lowerQuery.includes('estimate') || lowerQuery.includes('cost')) {
      suggestions.push('Material calculation', 'Labor costs', 'Cost optimization');
    } else if (lowerQuery.includes('plan') || lowerQuery.includes('stages')) {
      suggestions.push('Preparation work', 'Main stages', 'Timeline');
    } else if (lowerQuery.includes('foundation')) {
      suggestions.push('Foundation types', 'Depth requirements', 'Waterproofing');
    } else if (lowerQuery.includes('roof') || lowerQuery.includes('roofing')) {
      suggestions.push('Roofing materials', 'Roof insulation', 'Gutters');
    } else {
      suggestions.push('Popular materials', 'New technologies', 'Proven solutions');
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
}
