// src/chains/task-creation.chain.js
const { LLMChain } = require('langchain/chains');
const { ChatOpenAI } = require('@langchain/openai');
const { PromptTemplate } = require('langchain/prompts');
const { StructuredOutputParser } = require('langchain/output_parsers');

class TaskCreationChain {
  constructor() {
    this.model = new ChatOpenAI({
      modelName: process.env.OPENAI_MODEL,
      temperature: 0.7
    });

    this.outputParser = StructuredOutputParser.fromNamesAndDescriptions({
      title: 'Concise task title',
      description: 'Detailed task description',
      priority: 'Priority level: low, medium, high, or urgent',
      estimatedHours: 'Estimated time in hours',
      tags: 'Comma-separated relevant tags',
      acceptanceCriteria: 'List of acceptance criteria'
    });

    this.promptTemplate = new PromptTemplate({
      template: `You are an expert project manager creating a well-structured task.

User Request: {userInput}
Project Context: {projectContext}

Create a comprehensive task with the following structure:
{format_instructions}

Task:`,
      inputVariables: ['userInput', 'projectContext'],
      partialVariables: {
        format_instructions: this.outputParser.getFormatInstructions()
      }
    });

    this.chain = new LLMChain({
      llm: this.model,
      prompt: this.promptTemplate,
      outputParser: this.outputParser
    });
  }

  async create(userInput, projectContext = {}) {
    try {
      const result = await this.chain.call({
        userInput,
        projectContext: JSON.stringify(projectContext)
      });

      return result.text;
    } catch (error) {
      logger.error('Task creation chain error:', error);
      throw error;
    }
  }
}

module.exports = TaskCreationChain;