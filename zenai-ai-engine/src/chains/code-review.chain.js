const { LLMChain } = require('langchain/chains');
const { ChatOpenAI } = require('@langchain/openai');
const { PromptTemplate } = require('langchain/prompts');

class CodeReviewChain {
  constructor() {
    this.model = new ChatOpenAI({
      modelName: process.env.OPENAI_MODEL || 'gpt-4',
      temperature: 0.2
    });

    this.promptTemplate = new PromptTemplate({
      template: `You are an expert code reviewer. Review this code thoroughly.

Language: {language}
Context: {context}

Code:
\`\`\`{language}
{code}
\`\`\`

Provide detailed review covering:
1. Code quality and maintainability
2. Potential bugs and issues
3. Security vulnerabilities
4. Performance concerns
5. Best practice violations
6. Suggestions for improvement

Format as structured JSON with issues array.`,
      inputVariables: ['code', 'language', 'context']
    });

    this.chain = new LLMChain({
      llm: this.model,
      prompt: this.promptTemplate
    });
  }

  async review(code, language, context = '') {
    try {
      const result = await this.chain.call({
        code,
        language,
        context
      });

      return JSON.parse(result.text);
    } catch (error) {
      logger.error('Code review chain error:', error);
      throw error;
    }
  }
}

module.exports = CodeReviewChain;