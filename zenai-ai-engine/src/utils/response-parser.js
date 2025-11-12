const logger = require('./logger');

class ResponseParser {
  parseJSON(response) {
    try {
      // Remove markdown code blocks if present
      let cleaned = response.trim();
      
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/```\n?/g, '');
      }

      return JSON.parse(cleaned);
    } catch (error) {
      logger.error('JSON parsing error:', error);
      
      // Try to extract JSON from text
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (e) {
          throw new Error('Failed to parse JSON response');
        }
      }
      
      throw new Error('No valid JSON found in response');
    }
  }

  parseList(response) {
    // Extract list items from various formats
    const lines = response.split('\n');
    const items = [];

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Numbered list: 1. Item
      if (/^\d+\.\s/.test(trimmed)) {
        items.push(trimmed.replace(/^\d+\.\s/, ''));
      }
      // Bullet list: - Item or * Item
      else if (/^[-*]\s/.test(trimmed)) {
        items.push(trimmed.replace(/^[-*]\s/, ''));
      }
      // Plain items
      else if (trimmed && !trimmed.startsWith('#')) {
        items.push(trimmed);
      }
    }

    return items;
  }

  parseMarkdown(response) {
    const sections = {};
    const lines = response.split('\n');
    let currentSection = 'main';
    let currentContent = [];

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Check for headers
      const headerMatch = trimmed.match(/^(#{1,6})\s(.+)$/);
      if (headerMatch) {
        // Save previous section
        if (currentContent.length > 0) {
          sections[currentSection] = currentContent.join('\n').trim();
        }
        
        // Start new section
        currentSection = headerMatch[2].toLowerCase().replace(/\s+/g, '_');
        currentContent = [];
      } else {
        currentContent.push(line);
      }
    }

    // Save last section
    if (currentContent.length > 0) {
      sections[currentSection] = currentContent.join('\n').trim();
    }

    return sections;
  }

  extractCodeBlocks(response) {
    const codeBlocks = [];
    const regex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;

    while ((match = regex.exec(response)) !== null) {
      codeBlocks.push({
        language: match[1] || 'text',
        code: match[2].trim()
      });
    }

    return codeBlocks;
  }

  extractMetadata(response) {
    const metadata = {};
    
    // Extract key-value pairs from formats like "Key: Value"
    const kvRegex = /^([A-Z][a-zA-Z\s]+):\s*(.+)$/gm;
    let match;

    while ((match = kvRegex.exec(response)) !== null) {
      const key = match[1].toLowerCase().replace(/\s+/g, '_');
      const value = match[2].trim();
      metadata[key] = value;
    }

    return metadata;
  }

  cleanResponse(response) {
    // Remove common AI artifacts
    let cleaned = response.trim();
    
    // Remove thinking tags if present
    cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '');
    
    // Remove system messages
    cleaned = cleaned.replace(/^(System|Assistant|AI):\s*/gim, '');
    
    // Remove excessive whitespace
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    
    return cleaned.trim();
  }

  validateStructure(response, schema) {
    try {
      const parsed = this.parseJSON(response);
      
      // Check required fields
      for (const field of schema.required || []) {
        if (!(field in parsed)) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Validate types
      for (const [field, expectedType] of Object.entries(schema.properties || {})) {
        if (field in parsed) {
          const actualType = typeof parsed[field];
          if (actualType !== expectedType.type) {
            throw new Error(`Invalid type for ${field}: expected ${expectedType.type}, got ${actualType}`);
          }
        }
      }

      return { valid: true, data: parsed };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }
}

module.exports = ResponseParser;