const OPENAI_API_KEY = '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';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
import * as FileSystem from 'expo-file-system';

export interface VisionAnalysisResult {
  extractedText: string;
  success: boolean;
  error?: string;
}

export class VisionService {
  private static async convertImageToBase64(imageUri: string): Promise<string> {
    try {
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    } catch (error) {
      console.error('Error converting image to base64:', error);
      throw new Error('Failed to convert image to base64');
    }
  }

  static async analyzeImage(imageUri: string): Promise<VisionAnalysisResult> {
    try {
      console.log('Analyzing image:', imageUri);
      
      // Convert image to base64
      const base64Image = await this.convertImageToBase64(imageUri);
      
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
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Extract all text from this image. This could be a construction document, blueprint, receipt, invoice, or any other document related to building/construction. Please extract ALL text you can see in the image, including numbers, measurements, prices, addresses, names, and any other readable text. Return only the extracted text without any additional commentary.',
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`,
                    detail: 'high'
                  },
                },
              ],
            },
          ],
          max_tokens: 1000,
          temperature: 0.1, // Low temperature for more accurate text extraction
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Vision API error:', response.status, errorText);
        
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again in a moment.');
        } else if (response.status === 401) {
          throw new Error('Invalid API key. Please check your configuration.');
        } else if (response.status >= 500) {
          throw new Error('Server error. Please try again later.');
        } else {
          throw new Error(`API error: ${response.status}`);
        }
      }

      const data = await response.json();
      const extractedText = data.choices[0]?.message?.content?.trim() || '';
      
      if (!extractedText) {
        return {
          extractedText: '',
          success: false,
          error: 'No text found in the image'
        };
      }

      console.log('Extracted text:', extractedText);
      
      return {
        extractedText,
        success: true
      };
    } catch (error) {
      console.error('Vision analysis failed:', error);
      return {
        extractedText: '',
        success: false,
        error: error instanceof Error ? error.message : 'Failed to analyze image'
      };
    }
  }

  static async sendToAIBuilder(extractedText: string): Promise<void> {
    try {
      // Import the OpenAI service
      const { OpenAIService } = await import('./openAIService');
      
      // Create a message for AI Builder
      const message = `I have a question about my project: ${extractedText}`;
      
      // Navigate to AI Builder and pass the message
      // This will be handled by the scanner screen
      console.log('Ready to send to AI Builder:', message);
    } catch (error) {
      console.error('Error preparing message for AI Builder:', error);
      throw new Error('Failed to prepare message for AI Builder');
    }
  }
}
