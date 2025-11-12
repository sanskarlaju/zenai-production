const ANALYSIS_PROMPTS = {
  projectHealth: (projectData, tasks, team) => `
Analyze project health comprehensively:

**Project:**
- Name: ${projectData.name}
- Status: ${projectData.status}
- Deadline: ${projectData.deadline || 'Not set'}
- Progress: ${projectData.progress}%

**Tasks:**
- Total: ${tasks.length}
- Completed: ${tasks.filter(t => t.status === 'done').length}
- In Progress: ${tasks.filter(t => t.status === 'in-progress').length}
- Blocked: ${tasks.filter(t => t.status === 'blocked').length}
- Overdue: ${tasks.filter(t => new Date(t.dueDate) < new Date()).length}

**Team:**
- Size: ${team.length}
- Utilization: ${team.map(m => `${m.name}: ${m.tasksCount} tasks`).join(', ')}

Provide analysis:
{
  "healthScore": 0-100,
  "status": "healthy|at-risk|critical",
  "velocity": "on-track|slow|fast",
  "insights": ["insight1", "insight2", "insight3"],
  "risks": [
    {
      "type": "schedule|resource|scope|quality",
      "severity": "high|medium|low",
      "description": "Risk description",
      "mitigation": "How to address"
    }
  ],
  "recommendations": [
    {
      "priority": "high|medium|low",
      "action": "What to do",
      "expectedImpact": "Expected outcome"
    }
  ],
  "predictedCompletion": "YYYY-MM-DD",
  "blockers": ["blocker1"]
}`,

  taskComplexity: (task, projectContext) => `
Analyze task complexity in detail:

Task: ${task.title}
Description: ${task.description}

Project Context:
- Type: ${projectContext.type || 'Software Development'}
- Tech Stack: ${projectContext.stack || 'Modern web stack'}
- Team Skills: ${projectContext.skills || 'Intermediate'}

Provide comprehensive analysis:
{
  "complexityScore": 1-10,
  "factors": {
    "technical": 1-10,
    "business": 1-10,
    "integration": 1-10,
    "unknown": 1-10
  },
  "estimatedHours": <number>,
  "confidenceLevel": "high|medium|low",
  "skillsRequired": ["skill1", "skill2"],
  "dependencies": [
    {
      "type": "technical|data|team",
      "description": "Dependency description",
      "impact": "high|medium|low"
    }
  ],
  "risks": [
    {
      "description": "Risk description",
      "probability": "high|medium|low",
      "impact": "high|medium|low",
      "mitigation": "How to address"
    }
  ],
  "recommendations": ["rec1", "rec2"],
  "similarTasks": ["If you've seen similar tasks"]
}`,

  codeQuality: (code, language, context) => `
Analyze code quality and provide detailed review:

Language: ${language}
Context: ${context.purpose || 'General code review'}

\`\`\`${language}
${code}
\`\`\`

Provide structured review:
{
  "overallScore": 0-100,
  "issues": [
    {
      "severity": "critical|high|medium|low|info",
      "type": "bug|security|performance|style|maintainability",
      "line": <number>,
      "description": "Issue description",
      "suggestion": "How to fix",
      "codeExample": "Fixed code"
    }
  ],
  "strengths": ["strength1", "strength2"],
  "metrics": {
    "maintainability": 0-100,
    "complexity": "low|medium|high",
    "testability": 0-100,
    "security": 0-100
  },
  "recommendations": [
    "recommendation1",
    "recommendation2"
  ]
}`,

  meetingInsights: (transcript, context) => `
Extract insights from meeting transcript:

Meeting: ${context.title || 'Team Meeting'}
Date: ${context.date}
Duration: ${context.duration || 'N/A'}
Participants: ${context.participants?.join(', ') || 'Not specified'}

Transcript:
${transcript}

Provide comprehensive summary:
{
  "executiveSummary": "2-3 sentence overview",
  "keyPoints": [
    {
      "topic": "Discussion topic",
      "summary": "What was discussed",
      "importance": "high|medium|low"
    }
  ],
  "decisions": [
    {
      "decision": "What was decided",
      "rationale": "Why",
      "impact": "Expected impact",
      "owner": "Person responsible"
    }
  ],
  "actionItems": [
    {
      "action": "What needs to be done",
      "owner": "Person or null",
      "dueDate": "YYYY-MM-DD or null",
      "priority": "high|medium|low",
      "dependencies": ["Other action items"],
      "estimatedEffort": "time estimate"
    }
  ],
  "questions": ["Unanswered question1"],
  "blockers": ["Blocker1"],
  "nextSteps": ["Next step1"],
  "sentiment": "positive|neutral|negative",
  "followUpNeeded": ["What needs follow-up"]
}`
};

module.exports = ANALYSIS_PROMPTS;