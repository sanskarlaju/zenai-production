// src/agents/meeting-summarizer.agent.js
const BaseAgent = require('./base.agent');
const WhisperService = require('../whisper/transcription.service');

class MeetingSummarizerAgent extends BaseAgent {
  constructor() {
    super({
      name: 'MeetingSummarizerAgent',
      description: 'Transcribes meetings and generates summaries with action items',
      modelType: 'openai',
      temperature: 0.3,
      maxTokens: 3000
    });

    this.whisperService = new WhisperService();
  }

  getSystemPrompt() {
    return `You are an expert meeting summarizer. You analyze meeting transcripts to:
- Extract key discussion points
- Identify decisions made
- List action items with owners
- Capture important questions and blockers
- Provide concise executive summary

Format your summaries professionally and highlight critical information.`;
  }

  async transcribeAndSummarize(audioFilePath, meetingContext = {}) {
    try {
      // Step 1: Transcribe audio using Whisper
      console.log('Transcribing audio...');
      const transcription = await this.whisperService.transcribe(audioFilePath);

      // Step 2: Generate summary
      console.log('Generating summary...');
      const summary = await this.generateSummary(transcription, meetingContext);

      // Step 3: Extract action items
      console.log('Extracting action items...');
      const actionItems = await this.extractActionItems(transcription);

      return {
        transcription,
        summary,
        actionItems,
        metadata: {
          duration: transcription.duration,
          participants: meetingContext.participants || [],
          date: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error('Meeting summarization error:', error);
      throw error;
    }
  }

  async generateSummary(transcription, context) {
    const prompt = `Analyze this meeting transcript and provide a comprehensive summary:

Meeting: ${context.title || 'Team Meeting'}
Date: ${context.date || new Date().toISOString()}
Participants: ${context.participants?.join(', ') || 'N/A'}

Transcript:
${transcription.text}

Generate a structured summary:
{
  "executiveSummary": "2-3 sentence overview",
  "keyPoints": ["point1", "point2", "point3"],
  "decisions": ["decision1", "decision2"],
  "nextSteps": ["step1", "step2"],
  "questions": ["question1"],
  "blockers": ["blocker1"]
}`;

    const response = await this.model.call([
      { role: 'system', content: this.getSystemPrompt() },
      { role: 'user', content: prompt }
    ]);

    return JSON.parse(response.content);
  }

  async extractActionItems(transcription) {
    const prompt = `Extract all action items from this transcript:

${transcription.text}

For each action item, identify:
- What needs to be done
- Who is responsible (if mentioned)
- When it's due (if mentioned)
- Priority level

Return JSON:
[{
  "action": "Description of action",
  "owner": "Person name or null",
  "dueDate": "Date or null",
  "priority": "high|medium|low",
  "context": "Brief context"
}]`;

    const response = await this.model.call([
      { role: 'system', content: this.getSystemPrompt() },
      { role: 'user', content: prompt }
    ]);

    return JSON.parse(response.content);
  }

  async generateMeetingReport(summaryData) {
    const prompt = `Create a professional meeting report:

${JSON.stringify(summaryData, null, 2)}

Generate a well-formatted markdown report with sections:
- Meeting Overview
- Executive Summary
- Key Discussion Points
- Decisions Made
- Action Items (table format)
- Next Steps
- Open Questions & Blockers

Make it professional and ready to share.`;

    const response = await this.model.call([
      { role: 'system', content: this.getSystemPrompt() },
      { role: 'user', content: prompt }
    ]);

    return response.content;
  }
}

module.exports = MeetingSummarizerAgent;