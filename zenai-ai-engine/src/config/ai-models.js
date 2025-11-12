const AI_MODELS = {
  openai: {
    'gpt-4-turbo': {
      name: 'gpt-4-turbo-preview',
      contextWindow: 128000,
      maxTokens: 4096,
      pricing: { input: 0.01, output: 0.03 },
      capabilities: ['chat', 'functions', 'vision'],
      bestFor: ['complex reasoning', 'code generation', 'analysis']
    },
    'gpt-4': {
      name: 'gpt-4',
      contextWindow: 8192,
      maxTokens: 4096,
      pricing: { input: 0.03, output: 0.06 },
      capabilities: ['chat', 'functions'],
      bestFor: ['reasoning', 'creative writing']
    },
    'gpt-3.5-turbo': {
      name: 'gpt-3.5-turbo',
      contextWindow: 16385,
      maxTokens: 4096,
      pricing: { input: 0.0015, output: 0.002 },
      capabilities: ['chat', 'functions'],
      bestFor: ['fast responses', 'simple tasks']
    }
  },

  anthropic: {
    'claude-3-opus': {
      name: 'claude-3-opus-20240229',
      contextWindow: 200000,
      maxTokens: 4096,
      pricing: { input: 0.015, output: 0.075 },
      capabilities: ['chat', 'vision', 'extended-context'],
      bestFor: ['complex analysis', 'research', 'long documents']
    },
    'claude-3-sonnet': {
      name: 'claude-3-sonnet-20240229',
      contextWindow: 200000,
      maxTokens: 4096,
      pricing: { input: 0.003, output: 0.015 },
      capabilities: ['chat', 'vision', 'extended-context'],
      bestFor: ['balanced performance', 'general tasks']
    },
    'claude-3-haiku': {
      name: 'claude-3-haiku-20240307',
      contextWindow: 200000,
      maxTokens: 4096,
      pricing: { input: 0.00025, output: 0.00125 },
      capabilities: ['chat', 'fast-response'],
      bestFor: ['quick tasks', 'high volume']
    }
  },

  embeddings: {
    'text-embedding-3-small': {
      name: 'text-embedding-3-small',
      dimensions: 1536,
      pricing: 0.00002,
      maxTokens: 8191
    },
    'text-embedding-3-large': {
      name: 'text-embedding-3-large',
      dimensions: 3072,
      pricing: 0.00013,
      maxTokens: 8191
    },
    'text-embedding-ada-002': {
      name: 'text-embedding-ada-002',
      dimensions: 1536,
      pricing: 0.0001,
      maxTokens: 8191
    }
  },

  whisper: {
    'whisper-1': {
      name: 'whisper-1',
      maxFileSize: 25 * 1024 * 1024, // 25MB
      supportedFormats: ['mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'wav', 'webm'],
      pricing: 0.006 // per minute
    }
  }
};

const selectModel = (task, priority = 'balanced') => {
  const modelMap = {
    'code-review': {
      fast: 'gpt-3.5-turbo',
      balanced: 'gpt-4',
      quality: 'gpt-4-turbo'
    },
    'task-analysis': {
      fast: 'claude-3-haiku',
      balanced: 'gpt-3.5-turbo',
      quality: 'gpt-4'
    },
    'project-planning': {
      fast: 'gpt-3.5-turbo',
      balanced: 'claude-3-sonnet',
      quality: 'claude-3-opus'
    },
    'meeting-summary': {
      fast: 'gpt-3.5-turbo',
      balanced: 'claude-3-haiku',
      quality: 'claude-3-sonnet'
    },
    'general-chat': {
      fast: 'gpt-3.5-turbo',
      balanced: 'gpt-3.5-turbo',
      quality: 'gpt-4'
    }
  };

  return modelMap[task]?.[priority] || 'gpt-3.5-turbo';
};

const getModelConfig = (modelName) => {
  for (const provider of Object.values(AI_MODELS)) {
    if (provider[modelName]) {
      return provider[modelName];
    }
  }
  return null;
};

module.exports = { AI_MODELS, selectModel, getModelConfig };