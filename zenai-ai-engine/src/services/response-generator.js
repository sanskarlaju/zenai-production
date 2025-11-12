const { ChatOpenAI } = require('@langchain/openai');
const logger = require('../utils/logger');

class ResponseGenerator {
  constructor() {
    this.model = new ChatOpenAI({
      modelName: process.env.OPENAI_MODEL || 'gpt-4',
      temperature: 0.7,
      streaming: true
    });
  }

  async generateResponse(prompt, context = {}, options = {}) {
    try {
      const systemPrompt = this.buildSystemPrompt(context);
      const userPrompt = this.buildUserPrompt(prompt, context);

      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ];

      if (options.stream) {
        return await this.streamResponse(messages, options.onToken);
      }

      const response = await this.model.call(messages);
      return response.content;
    } catch (error) {
      logger.error('Response generation error:', error);
      throw error;
    }
  }

  async streamResponse(messages, onToken) {
    const stream = await this.model.stream(messages);
    let fullResponse = '';

    for await (const chunk of stream) {
      const content = chunk.content;
      fullResponse += content;
      
      if (onToken) {
        onToken(content);
      }
    }

    return fullResponse;
  }

  buildSystemPrompt(context) {
    let prompt = `You are ZenAI, an intelligent assistant for project management and productivity.`;

    if (context.role) {
      prompt += `\n\nYou are currently acting as a ${context.role}.`;
    }

    if (context.capabilities) {
      prompt += `\n\nYour capabilities include: ${context.capabilities.join(', ')}.`;
    }

    prompt += `\n\nAlways be helpful, concise, and action-oriented. When appropriate, provide structured responses with clear next steps.`;

    return prompt;
  }

  buildUserPrompt(prompt, context) {
    let fullPrompt = prompt;

    if (context.projectContext) {
      fullPrompt = `${context.projectContext}\n\n${prompt}`;
    }

    return fullPrompt;
  }

  async generateStructuredResponse(prompt, schema, context = {}) {
    const systemPrompt = `${this.buildSystemPrompt(context)}

Return your response as valid JSON matching this schema:
${JSON.stringify(schema, null, 2)}

Only return the JSON, no additional text.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ];

    const response = await this.model.call(messages);
    
    try {
      return JSON.parse(response.content);
    } catch (error) {
      logger.error('Failed to parse structured response:', error);
      throw new Error('Invalid JSON response');
    }
  }

  async generateMultipleResponses(prompt, count = 3, context = {}) {
    const promises = Array(count).fill(null).map(() =>
      this.generateResponse(prompt, context)
    );

    return await Promise.all(promises);
  }

  async refineResponse(initialResponse, refinementPrompt, context = {}) {
    const prompt = `Given this initial response:

"${initialResponse}"

${refinementPrompt}`;

    return await this.generateResponse(prompt, context);
  }
}

module.exports = ResponseGenerator;