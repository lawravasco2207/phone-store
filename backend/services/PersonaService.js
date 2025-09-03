// PersonaService for adjusting AI sales assistant tone and behavior
import 'dotenv/config';

/**
 * Service to manage the AI Sales Assistant's persona and tone
 */
class PersonaService {
  constructor() {
    this.defaultTone = 'casual';
    this.tones = {
      casual: {
        style: 'friendly and conversational',
        vocabulary: 'simple and accessible',
        persuasionLevel: 'subtle'
      },
      professional: {
        style: 'polite and business-like',
        vocabulary: 'precise and technical',
        persuasionLevel: 'moderate'
      },
      proactive: {
        style: 'enthusiastic and energetic',
        vocabulary: 'persuasive and benefit-focused',
        persuasionLevel: 'high'
      }
    };
  }

  /**
   * Get tone configuration by name
   * @param {string} toneName - The tone name (casual, professional, proactive)
   * @returns {Object} The tone configuration
   */
  getTone(toneName) {
    return this.tones[toneName] || this.tones[this.defaultTone];
  }

  /**
   * Get the appropriate tone based on conversation context
   * @param {Object} context - The conversation context
   * @returns {Object} The selected tone configuration
   */
  getContextualTone(context) {
    // Default to casual tone
    let toneName = this.defaultTone;
    
    // If we have preference data, use it to determine the tone
    if (context && context.prefs) {
      // Technical users might prefer professional tone
      if (context.prefs.technicalUser) {
        toneName = 'professional';
      }
      
      // Price-sensitive users might need more persuasion
      if (context.prefs.priceSensitive) {
        toneName = 'proactive';
      }
      
      // Use explicit tone preference if set
      if (context.prefs.preferredTone && this.tones[context.prefs.preferredTone]) {
        toneName = context.prefs.preferredTone;
      }
    }
    
    return this.getTone(toneName);
  }

  /**
   * Enhance the system prompt with persona and tone instructions
   * @param {string} basePrompt - The base system prompt
   * @param {Object} context - The conversation context
   * @returns {string} The enhanced system prompt
   */
  enhancePrompt(basePrompt, context) {
    const tone = this.getContextualTone(context);
    
    // Add tone-specific instructions to the prompt
    const toneInstructions = `
Use a ${tone.style} tone with ${tone.vocabulary} language.
Apply a ${tone.persuasionLevel} level of persuasion based on user engagement.
`;
    
    return basePrompt + toneInstructions;
  }
}

export default new PersonaService();
