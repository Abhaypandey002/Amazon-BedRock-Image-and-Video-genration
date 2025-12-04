/**
 * Simple token counter for prompt validation
 * This is a rough approximation. For production, consider using a proper tokenizer
 * like tiktoken or the specific tokenizer for the model being used.
 */
export function countTokens(text: string): number {
  // Rough approximation: 1 token ≈ 4 characters for English text
  // This is a simplified version. Real tokenization is more complex.
  
  // Remove extra whitespace
  const normalized = text.trim().replace(/\s+/g, ' ');
  
  // Count words and punctuation
  const words = normalized.split(/\s+/);
  const punctuation = (normalized.match(/[.,!?;:()[\]{}'"]/g) || []).length;
  
  // Estimate tokens (words + punctuation + some overhead)
  return words.length + punctuation;
}

/**
 * Validate prompt token count
 */
export function validatePromptTokens(
  prompt: string,
  maxTokens: number
): { valid: boolean; tokenCount: number; error?: string } {
  const tokenCount = countTokens(prompt);

  if (tokenCount > maxTokens) {
    return {
      valid: false,
      tokenCount,
      error: `Prompt exceeds maximum token limit of ${maxTokens}. Current: ${tokenCount} tokens`,
    };
  }

  return {
    valid: true,
    tokenCount,
  };
}
