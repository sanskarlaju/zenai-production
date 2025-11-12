const AGENT_CONFIGS = {
  productManager: {
    name: 'ProductManagerAgent',
    modelType: 'openai',
    modelName: 'gpt-4',
    temperature: 0.7,
    maxTokens: 2000,
    maxIterations: 5,
    verbose: true,
    capabilities: [
      'task_creation',
      'project_analysis',
      'prioritization',
      'roadmap_planning',
      'risk_assessment'
    ],
    tools: ['create_task', 'analyze_project', 'prioritize_tasks'],
    systemPromptKey: 'productManager',
    rateLimits: {
      requestsPerMinute: 30,
      tokensPerMinute: 90000
    }
  },

  taskAnalyzer: {
    name: 'TaskAnalyzerAgent',
    modelType: 'openai',
    modelName: 'gpt-4',
    temperature: 0.3,
    maxTokens: 1500,
    maxIterations: 3,
    verbose: false,
    capabilities: [
      'complexity_estimation',
      'dependency_analysis',
      'effort_estimation',
      'risk_identification'
    ],
    tools: ['estimate_complexity', 'suggest_dependencies'],
    systemPromptKey: 'taskAnalyzer',
    rateLimits: {
      requestsPerMinute: 40,
      tokensPerMinute: 60000
    }
  },

  codeReviewer: {
    name: 'CodeReviewerAgent',
    modelType: 'openai',
    modelName: 'gpt-4',
    temperature: 0.3,
    maxTokens: 3000,
    maxIterations: 5,
    verbose: true,
    capabilities: [
      'code_quality_check',
      'security_analysis',
      'performance_review',
      'best_practices',
      'refactoring_suggestions'
    ],
    tools: ['analyze_code', 'suggest_improvements'],
    systemPromptKey: 'codeReviewer',
    rateLimits: {
      requestsPerMinute: 20,
      tokensPerMinute: 60000
    }
  },

  meetingSummarizer: {
    name: 'MeetingSummarizerAgent',
    modelType: 'openai',
    modelName: 'gpt-4',
    temperature: 0.3,
    maxTokens: 3000,
    maxIterations: 3,
    verbose: false,
    capabilities: [
      'transcription_analysis',
      'action_item_extraction',
      'meeting_summary',
      'decision_tracking',
      'participant_analysis'
    ],
    tools: ['transcribe_audio', 'extract_action_items'],
    systemPromptKey: 'meetingSummarizer',
    rateLimits: {
      requestsPerMinute: 10,
      tokensPerMinute: 90000
    }
  },

  orchestrator: {
    name: 'OrchestratorAgent',
    modelType: 'openai',
    modelName: 'gpt-4',
    temperature: 0.7,
    maxTokens: 2000,
    maxIterations: 10,
    verbose: true,
    capabilities: [
      'agent_routing',
      'workflow_coordination',
      'result_synthesis',
      'multi_agent_collaboration'
    ],
    systemPromptKey: 'orchestrator',
    rateLimits: {
      requestsPerMinute: 30,
      tokensPerMinute: 90000
    },
    subAgents: [
      'productManager',
      'taskAnalyzer',
      'codeReviewer',
      'meetingSummarizer'
    ]
  }
};

const getAgentConfig = (agentName) => {
  return AGENT_CONFIGS[agentName] || null;
};

const listAgents = () => {
  return Object.keys(AGENT_CONFIGS);
};

const validateAgentConfig = (config) => {
  const required = ['name', 'modelType', 'capabilities'];
  
  for (const field of required) {
    if (!config[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  return true;
};

module.exports = {
  AGENT_CONFIGS,
  getAgentConfig,
  listAgents,
  validateAgentConfig
};