const BaseAgent = require('./base.agent');
const { DynamicTool } = require('langchain/tools');

class CodeReviewerAgent extends BaseAgent {
  constructor() {
    const tools = [
      new DynamicTool({
        name: 'analyze_code',
        description: 'Analyze code for bugs, security issues, and best practices',
        func: async (code) => {
          return `Code analysis complete for ${code.length} characters`;
        }
      }),
      new DynamicTool({
        name: 'suggest_improvements',
        description: 'Suggest code improvements and refactoring',
        func: async (input) => {
          return 'Improvement suggestions generated';
        }
      })
    ];

    super({
      name: 'CodeReviewerAgent',
      description: 'Expert code reviewer for quality, security, and best practices',
      tools,
      modelType: 'openai',
      temperature: 0.3,
      maxIterations: 5
    });
  }

  getSystemPrompt() {
    return `You are an expert code reviewer with deep knowledge of:
- Software architecture patterns
- Security vulnerabilities (OWASP Top 10)
- Performance optimization
- Code quality and maintainability
- Testing best practices
- Language-specific idioms

**Review Focus:**
- Bugs and logic errors
- Security vulnerabilities
- Performance issues
- Code smells
- Best practice violations
- Test coverage gaps

**Output Format:**
Provide structured feedback with:
1. Severity (critical/high/medium/low)
2. Issue description
3. Suggested fix
4. Code example

Be constructive and educational in your feedback.`;
  }

  async reviewCode(code, language, context = {}) {
    const prompt = `Review this ${language} code:

\`\`\`${language}
${code}
\`\`\`

Context: ${context.description || 'General code review'}

Provide comprehensive review in JSON format:
{
  "overall_score": 0-100,
  "issues": [
    {
      "severity": "critical|high|medium|low",
      "type": "bug|security|performance|style",
      "line": number,
      "description": "Issue description",
      "suggestion": "How to fix",
      "example": "Code example"
    }
  ],
  "strengths": ["strength1", "strength2"],
  "recommendations": ["rec1", "rec2"]
}`;

    const response = await this.model.call([
      { role: 'system', content: this.getSystemPrompt() },
      { role: 'user', content: prompt }
    ]);

    return JSON.parse(response.content);
  }

  async suggestRefactoring(code, language) {
    const prompt = `Suggest refactoring for this ${language} code:

\`\`\`${language}
${code}
\`\`\`

Return JSON:
{
  "refactored_code": "improved version",
  "changes": [
    {
      "type": "extract method|rename|simplify",
      "reason": "Why this change",
      "before": "old code",
      "after": "new code"
    }
  ],
  "impact": "low|medium|high"
}`;

    const response = await this.model.call([
      { role: 'system', content: this.getSystemPrompt() },
      { role: 'user', content: prompt }
    ]);

    return JSON.parse(response.content);
  }

  async detectSecurityIssues(code, language) {
    const prompt = `Analyze for security vulnerabilities:

\`\`\`${language}
${code}
\`\`\`

Return JSON array of security issues:
[{
  "vulnerability": "SQL Injection|XSS|etc",
  "severity": "critical|high|medium|low",
  "location": "line number or function",
  "description": "detailed explanation",
  "exploit_scenario": "how it could be exploited",
  "fix": "how to fix it",
  "cwe_id": "CWE number if applicable"
}]`;

    const response = await this.model.call([
      { role: 'system', content: this.getSystemPrompt() },
      { role: 'user', content: prompt }
    ]);

    return JSON.parse(response.content);
  }
}

module.exports = CodeReviewerAgent;