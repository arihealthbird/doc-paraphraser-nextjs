/**
 * Hallucination Detection Service
 * Calculates how much the paraphrased text deviates from the original meaning
 * Returns a score from 0-100 where:
 * - 0-20: Excellent fidelity (minimal deviation)
 * - 21-40: Good (acceptable changes)
 * - 41-60: Moderate (noticeable changes)
 * - 61-80: Poor (significant deviation)
 * - 81-100: Critical (likely hallucinations or major content changes)
 */

export class HallucinationDetector {
  /**
   * Calculate hallucination score by comparing original and paraphrased text
   * Uses multiple metrics: length deviation, keyword preservation, sentence structure
   */
  async calculateScore(originalText: string, paraphrasedText: string): Promise<number> {
    // Normalize texts
    const original = this.normalizeText(originalText);
    const paraphrased = this.normalizeText(paraphrasedText);

    // Multiple scoring dimensions
    const lengthScore = this.calculateLengthDeviation(original, paraphrased);
    const keywordScore = this.calculateKeywordPreservation(original, paraphrased);
    const structureScore = this.calculateStructuralSimilarity(original, paraphrased);
    const semanticScore = this.calculateSemanticSimilarity(original, paraphrased);

    // Weighted average (adjust weights as needed)
    const finalScore = Math.round(
      lengthScore * 0.15 +
      keywordScore * 0.35 +
      structureScore * 0.20 +
      semanticScore * 0.30
    );

    return Math.max(0, Math.min(100, finalScore));
  }

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Score based on length deviation (excessive length changes may indicate hallucination)
   * Expected: paraphrased text should be 70-130% of original length
   */
  private calculateLengthDeviation(original: string, paraphrased: string): number {
    const ratio = paraphrased.length / original.length;
    
    if (ratio >= 0.7 && ratio <= 1.3) {
      return 0; // Perfect range
    } else if (ratio >= 0.5 && ratio <= 1.5) {
      return 20; // Acceptable
    } else if (ratio >= 0.3 && ratio <= 2.0) {
      return 50; // Concerning
    } else {
      return 80; // Very concerning
    }
  }

  /**
   * Score based on keyword preservation
   * Important keywords should appear in paraphrased text
   */
  private calculateKeywordPreservation(original: string, paraphrased: string): number {
    const originalWords = this.extractKeywords(original);
    const paraphrasedWords = this.extractKeywords(paraphrased);

    if (originalWords.size === 0) return 0;

    let preservedCount = 0;
    for (const word of originalWords) {
      // Check for word or its variants
      if (paraphrasedWords.has(word) || this.hasSimilarWord(word, paraphrasedWords)) {
        preservedCount++;
      }
    }

    const preservationRate = preservedCount / originalWords.size;
    
    if (preservationRate >= 0.7) return 0;    // Excellent
    if (preservationRate >= 0.5) return 20;   // Good
    if (preservationRate >= 0.3) return 50;   // Moderate
    if (preservationRate >= 0.15) return 70;  // Poor
    return 90; // Critical
  }

  private extractKeywords(text: string): Set<string> {
    const commonWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
      'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
      'would', 'should', 'could', 'may', 'might', 'can', 'this', 'that',
      'these', 'those', 'it', 'its', 'which', 'who', 'what', 'when', 'where',
      'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most',
      'other', 'some', 'such', 'than', 'too', 'very', 'just', 'not'
    ]);

    const words = text.split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !commonWords.has(word));

    return new Set(words);
  }

  private hasSimilarWord(word: string, wordSet: Set<string>): boolean {
    // Check for simple stemming/variants
    for (const w of wordSet) {
      if (this.areSimilar(word, w)) {
        return true;
      }
    }
    return false;
  }

  private areSimilar(word1: string, word2: string): boolean {
    // Simple similarity: check if one is a prefix/suffix of the other
    if (word1.length < 4 || word2.length < 4) return word1 === word2;
    
    const minLength = Math.min(word1.length, word2.length);
    const stem1 = word1.substring(0, Math.floor(minLength * 0.7));
    const stem2 = word2.substring(0, Math.floor(minLength * 0.7));
    
    return stem1 === stem2;
  }

  /**
   * Score based on structural similarity (sentence count, paragraph structure)
   */
  private calculateStructuralSimilarity(original: string, paraphrased: string): number {
    const originalSentences = this.countSentences(original);
    const paraphrasedSentences = this.countSentences(paraphrased);
    
    const sentenceRatio = paraphrasedSentences / originalSentences;
    
    if (sentenceRatio >= 0.8 && sentenceRatio <= 1.2) return 0;   // Excellent
    if (sentenceRatio >= 0.6 && sentenceRatio <= 1.4) return 20;  // Good
    if (sentenceRatio >= 0.4 && sentenceRatio <= 1.8) return 50;  // Moderate
    return 80; // Poor
  }

  private countSentences(text: string): number {
    return (text.match(/[.!?]+/g) || []).length || 1;
  }

  /**
   * Semantic similarity using simple word overlap (Jaccard similarity)
   * More sophisticated: could use embeddings, but that requires API calls
   */
  private calculateSemanticSimilarity(original: string, paraphrased: string): number {
    const originalWords = new Set(original.split(/\s+/));
    const paraphrasedWords = new Set(paraphrased.split(/\s+/));

    const intersection = new Set(
      [...originalWords].filter(word => paraphrasedWords.has(word))
    );
    const union = new Set([...originalWords, ...paraphrasedWords]);

    const jaccardSimilarity = intersection.size / union.size;
    
    // Inverse score: lower similarity = higher hallucination score
    if (jaccardSimilarity >= 0.4) return 0;    // High overlap
    if (jaccardSimilarity >= 0.3) return 20;   // Good overlap
    if (jaccardSimilarity >= 0.2) return 40;   // Moderate
    if (jaccardSimilarity >= 0.1) return 60;   // Low
    return 80; // Very low overlap
  }

  /**
   * Get human-readable assessment
   */
  getAssessment(score: number): {
    label: string;
    color: string;
    description: string;
  } {
    if (score <= 20) {
      return {
        label: 'Excellent',
        color: 'green',
        description: 'Paraphrase maintains original meaning with high fidelity',
      };
    } else if (score <= 40) {
      return {
        label: 'Good',
        color: 'blue',
        description: 'Acceptable paraphrase with minor deviations',
      };
    } else if (score <= 60) {
      return {
        label: 'Moderate',
        color: 'yellow',
        description: 'Noticeable changes; review recommended',
      };
    } else if (score <= 80) {
      return {
        label: 'Poor',
        color: 'orange',
        description: 'Significant deviations detected; careful review needed',
      };
    } else {
      return {
        label: 'Critical',
        color: 'red',
        description: 'Major content changes or potential hallucinations',
      };
    }
  }
}
