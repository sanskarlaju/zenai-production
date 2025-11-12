const { LLMChain } = require('langchain/chains');
const { ChatOpenAI } = require('@langchain/openai');
const { PromptTemplate } = require('langchain/prompts');

class MeetingSummaryChain {
  constructor() {
    this.model = new ChatOpenAI({
      modelName: process.env.OPENAI_MODEL || 'gpt-4',
      temperature: 0.3
    });

    this.promptTemplate = new PromptTemplate({
      template: `Analyze this meeting transcript and create a comprehensive summary.

Meeting: {title}
Date: {date}
Participants: {participants}

Transcript:
{transcript}

Provide structured summary with:
1. Executive Summary (2-3 sentences)
2. Key Discussion Points
3. Decisions Made
4. Action Items (with owners and due dates)
5. Questions and Concerns
6. Next Steps

Format as JSON.`,
      inputVariables: ['title', 'date', 'participants', 'transcript']
    });

    this.chain = new LLMChain({
      llm: this.model,
      prompt: this.promptTemplate
    });
  }

  async summarize(meetingData) {
    try {
      const result = await this.chain.call({
        title: meetingData.title || 'Meeting',
        date: meetingData.date || new Date().toISOString(),
        participants: meetingData.participants?.join(', ') || 'N/A',
        transcript: meetingData.transcript
      });

      return JSON.parse(result.text);
    } catch (error) {
      logger.error('Meeting summary chain error:', error);
      throw error;
    }
  }
}

module.exports = MeetingSummaryChain;