const TASK_PROMPTS = {
  createFromDescription: (description, projectContext) => `
Based on this description, create a well-structured task:

Description: "${description}"
Project: ${projectContext.name || 'N/A'}
Context: ${projectContext.description || 'General task'}

Extract and return JSON with:
{
  "title": "Clear, action-oriented title",
  "description": "Detailed description with acceptance criteria",
  "priority": "low|medium|high|urgent",
  "estimatedTime": <hours>,
  "tags": ["relevant", "tags"],
  "suggestedAssignee": "person or null",
  "acceptanceCriteria": [
    "Criterion 1",
    "Criterion 2"
  ],
  "subtasks": [
    "Subtask 1",
    "Subtask 2"
  ]
}

Return ONLY valid JSON, no additional text.`,

  breakdownEpic: (epic) => `
Break down this epic into smaller, actionable tasks:

Epic: ${epic.title}
Description: ${epic.description}

Create 3-7 subtasks that are:
- Specific and independently completable
- Can be finished in 1-3 days
- Have clear deliverables
- Properly sequenced

Return JSON array:
[{
  "title": "Task title",
  "description": "What needs to be done",
  "estimatedTime": <hours>,
  "priority": "low|medium|high",
  "dependencies": ["task_id"],
  "acceptanceCriteria": ["criteria"]
}]`,

  prioritizeTasks: (tasks, criteria) => `
Prioritize these tasks based on: ${criteria.factors || 'urgency, impact, dependencies'}

Tasks:
${tasks.map((t, i) => `${i + 1}. ${t.title} - ${t.description}`).join('\n')}

Context:
- Deadline: ${criteria.deadline || 'None'}
- Team Size: ${criteria.teamSize || 'Unknown'}
- Critical Path: ${criteria.criticalPath || 'Not defined'}

Return JSON:
{
  "prioritizedTasks": [
    {
      "taskId": "id",
      "rank": 1,
      "priority": "urgent|high|medium|low",
      "reasoning": "Why this priority",
      "suggestedOrder": 1
    }
  ],
  "recommendations": ["recommendation1", "recommendation2"]
}`,

  estimateEffort: (task, context) => `
Estimate effort for this task:

Task: ${task.title}
Description: ${task.description}

Context:
- Team Experience: ${context.experience || 'Medium'}
- Technical Stack: ${context.stack || 'Standard'}
- Complexity Factors: ${context.factors || 'None specified'}

Provide detailed estimation:
{
  "estimatedHours": <number>,
  "confidence": "high|medium|low",
  "breakdown": {
    "development": <hours>,
    "testing": <hours>,
    "review": <hours>,
    "documentation": <hours>
  },
  "assumptions": ["assumption1"],
  "risks": ["risk1"],
  "requiredSkills": ["skill1"]
}`
};

module.exports = TASK_PROMPTS;