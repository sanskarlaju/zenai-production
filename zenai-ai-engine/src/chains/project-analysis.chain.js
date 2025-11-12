const { LLMChain } = require('langchain/chains');
const { ChatOpenAI } = require('@langchain/openai');
const { PromptTemplate } = require('langchain/prompts');
const { StructuredOutputParser } = require('langchain/output_parsers');

class ProjectAnalysisChain {
  constructor() {
    this.model = new ChatOpenAI({
      modelName: process.env.OPENAI_MODEL || 'gpt-4',
      temperature: 0.3
    });

    this.outputParser = StructuredOutputParser.fromNamesAndDescriptions({
      health_score: 'Overall project health score 0-100',
      status: 'Current status: healthy, at-risk, or critical',
      velocity: 'Team velocity assessment',
      blockers: 'Identified blockers',
      risks: 'Potential risks',
      recommendations: 'Actionable recommendations',
      predicted_completion: 'Estimated completion date'
    });

    this.promptTemplate = new PromptTemplate({
      template: `You are a project management expert analyzing project health.

Project Data:
{projectData}

Tasks Data:
{tasksData}

Team Data:
{teamData}

Provide comprehensive analysis:
{format_instructions}`,
      inputVariables: ['projectData', 'tasksData', 'teamData'],
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

  async analyze(projectData, tasksData, teamData) {
    try {
      const result = await this.chain.call({
        projectData: JSON.stringify(projectData),
        tasksData: JSON.stringify(tasksData),
        teamData: JSON.stringify(teamData)
      });

      return result.text;
    } catch (error) {
      logger.error('Project analysis chain error:', error);
      throw error;
    }
  }
}

module.exports = ProjectAnalysisChain;