/**
 * Prompt Enhancement Utility
 * Enhances user prompts for better, more realistic AI-generated content
 */

interface EnhancementOptions {
  style?: 'photorealistic' | 'cinematic' | 'artistic' | 'none';
  quality?: 'standard' | 'high';
  mediaType?: 'image' | 'video';
}

/**
 * Enhance a user prompt for better generation results
 */
export function enhancePrompt(
  userPrompt: string,
  options: EnhancementOptions = {}
): string {
  const {
    style = 'photorealistic',
    quality = 'high',
    mediaType = 'image',
  } = options;

  // Clean the user prompt
  const cleanPrompt = userPrompt.trim();

  // Don't enhance if prompt is already very detailed (>200 chars)
  if (cleanPrompt.length > 200) {
    console.log('🔵 [PROMPT] User prompt is detailed, minimal enhancement');
    return cleanPrompt;
  }

  // Build enhancement based on style
  const enhancements: string[] = [];

  // Add style-specific enhancements
  if (style === 'photorealistic') {
    enhancements.push(
      'photorealistic',
      'highly detailed',
      'professional photography',
      '8k resolution',
      'sharp focus',
      'realistic lighting',
      'natural colors'
    );
  } else if (style === 'cinematic') {
    enhancements.push(
      'cinematic',
      'film quality',
      'dramatic lighting',
      'depth of field',
      'professional color grading',
      'high production value'
    );
  } else if (style === 'artistic') {
    enhancements.push(
      'artistic',
      'creative composition',
      'vibrant colors',
      'professional quality'
    );
  }

  // Add quality enhancements
  if (quality === 'high') {
    enhancements.push(
      'high quality',
      'masterpiece',
      'best quality'
    );
  }

  // Add media-specific enhancements
  if (mediaType === 'video') {
    enhancements.push(
      'smooth motion',
      'stable camera',
      'professional video quality'
    );
  }

  // Combine user prompt with enhancements
  const enhancedPrompt = `${cleanPrompt}, ${enhancements.join(', ')}`;

  console.log('🔵 [PROMPT ENHANCEMENT]');
  console.log('Original:', cleanPrompt);
  console.log('Enhanced:', enhancedPrompt);

  return enhancedPrompt;
}

/**
 * Add negative prompt guidance (what to avoid)
 */
export function getNegativePrompt(): string {
  return [
    'blurry',
    'low quality',
    'distorted',
    'deformed',
    'ugly',
    'bad anatomy',
    'watermark',
    'text',
    'signature',
    'cartoon',
    'anime',
    'illustration',
    'painting',
    'drawing',
    'art',
    'unrealistic',
    'artificial',
  ].join(', ');
}

/**
 * Validate and clean user prompt
 */
export function validateAndCleanPrompt(prompt: string): {
  valid: boolean;
  cleaned: string;
  error?: string;
} {
  // Remove extra whitespace
  const cleaned = prompt.trim().replace(/\s+/g, ' ');

  // Check minimum length
  if (cleaned.length < 3) {
    return {
      valid: false,
      cleaned,
      error: 'Prompt is too short. Please provide more details.',
    };
  }

  // Check maximum length (before enhancement)
  if (cleaned.length > 500) {
    return {
      valid: false,
      cleaned,
      error: 'Prompt is too long. Please keep it under 500 characters.',
    };
  }

  // Check for inappropriate content (basic filter)
  const inappropriateWords = ['nsfw', 'nude', 'explicit', 'violence', 'gore'];
  const lowerPrompt = cleaned.toLowerCase();
  
  for (const word of inappropriateWords) {
    if (lowerPrompt.includes(word)) {
      return {
        valid: false,
        cleaned,
        error: 'Prompt contains inappropriate content.',
      };
    }
  }

  return {
    valid: true,
    cleaned,
  };
}

/**
 * Get prompt enhancement suggestions for UI
 */
export function getPromptSuggestions(basePrompt: string): string[] {
  const suggestions: string[] = [];

  // Add context suggestions
  if (!basePrompt.toLowerCase().includes('lighting')) {
    suggestions.push('Add lighting details (e.g., "golden hour lighting", "soft natural light")');
  }

  if (!basePrompt.toLowerCase().includes('background')) {
    suggestions.push('Describe the background or setting');
  }

  if (!basePrompt.toLowerCase().includes('camera') && !basePrompt.toLowerCase().includes('angle')) {
    suggestions.push('Specify camera angle (e.g., "wide angle shot", "close-up")');
  }

  if (!basePrompt.toLowerCase().includes('color')) {
    suggestions.push('Mention color palette or mood');
  }

  return suggestions;
}
