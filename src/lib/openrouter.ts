import { ParaphrasingConfig } from './types';

export class OpenRouterService {
  private readonly apiKey: string;
  private readonly defaultModel = 'anthropic/claude-3.5-sonnet';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async paraphraseText(
    text: string,
    config: ParaphrasingConfig = {}
  ): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(config);
    const userPrompt = this.buildUserPrompt(text);

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://doc-paraphraser.vercel.app',
          'X-Title': 'Document Paraphraser',
        },
        body: JSON.stringify({
          model: config.model || this.defaultModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: this.getTemperature(config.creativity),
          max_tokens: Math.min(text.length * 2, 8000),
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`OpenRouter API error ${response.status}:`, error);
        throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      const paraphrasedText = data.choices[0]?.message?.content?.trim();

      if (!paraphrasedText) {
        throw new Error('No response from OpenRouter API');
      }

      return paraphrasedText;
    } catch (error: any) {
      console.error('OpenRouter API error:', error);
      throw new Error(`Failed to paraphrase text: ${error.message}`);
    }
  }

  private buildSystemPrompt(config: ParaphrasingConfig): string {
    const toneInstructions = this.getToneInstructions(config.tone);
    const formalityInstructions = this.getFormalityInstructions(config.formality);
    const intensityInstructions = this.getIntensityInstructions(config.intensity);
    const formattingInstructions = config.preserveFormatting
      ? 'Preserve the original document structure, including paragraph breaks, lists, and formatting cues.'
      : 'You may reorganize the text for better clarity, but maintain the overall meaning.';

    return `You are an expert document paraphraser. Your task is to rewrite text while:
- Maintaining the original meaning and key information
- ${intensityInstructions}
- ${toneInstructions}
- ${formalityInstructions}
- ${formattingInstructions}
- Using clear, natural language
- Avoiding plagiarism by thoroughly rephrasing
- NOT adding information that wasn't in the original text
- NOT removing important details

Output ONLY the paraphrased text, without any preamble or explanation.`;
  }

  private buildUserPrompt(text: string): string {
    return `Please paraphrase the following text:\n\n${text}`;
  }

  private getToneInstructions(tone?: string): string {
    switch (tone) {
      case 'formal':
        return 'Using a formal, professional tone suitable for academic or business contexts';
      case 'casual':
        return 'Using a casual, conversational tone that is easy to read';
      case 'neutral':
      default:
        return 'Using a neutral, balanced tone';
    }
  }

  private getFormalityInstructions(formality?: string): string {
    switch (formality) {
      case 'high':
        return 'Employing sophisticated vocabulary and complex sentence structures';
      case 'low':
        return 'Using simple, straightforward language accessible to all readers';
      case 'medium':
      default:
        return 'Balancing clarity with appropriate vocabulary';
    }
  }

  private getTemperature(creativity?: string): number {
    switch (creativity) {
      case 'conservative':
        return 0.3;
      case 'creative':
        return 0.9;
      case 'moderate':
      default:
        return 0.6;
    }
  }

  private getIntensityInstructions(intensity?: number): string {
    const level = intensity || 3; // Default to medium
    
    switch (level) {
      case 1:
        return 'Making MINIMAL changes - keep most of the original wording intact, only changing absolutely necessary words to avoid plagiarism while staying very close to the source';
      case 2:
        return 'Making LIGHT changes - modify sentence structures slightly and replace some vocabulary, but keep the writing style similar to the original';
      case 3:
        return 'Making MODERATE changes - rewrite sentences with different structures and varied vocabulary while maintaining the same meaning and tone';
      case 4:
        return 'Making SUBSTANTIAL changes - significantly rephrase all content with different sentence structures, alternative vocabulary, and varied expression while preserving core meaning';
      case 5:
        return 'Making COMPLETE rewrites - thoroughly transform the text with entirely different wording, creative sentence structures, and fresh expression while ensuring the same information is conveyed';
      default:
        return 'Making MODERATE changes - rewrite sentences with different structures and varied vocabulary while maintaining the same meaning and tone';
    }
  }
}
