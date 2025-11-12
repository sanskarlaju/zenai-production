const TOOL_CONFIGS = {
  notion: {
    name: 'Notion Integration',
    enabled: !!process.env.NOTION_API_KEY,
    apiKey: process.env.NOTION_API_KEY,
    databaseId: process.env.NOTION_DATABASE_ID,
    rateLimit: {
      requestsPerSecond: 3
    },
    capabilities: [
      'create_page',
      'query_database',
      'update_page',
      'search_pages'
    ],
    config: {
      version: '2022-06-28',
      baseURL: 'https://api.notion.com/v1'
    }
  },

  slack: {
    name: 'Slack Integration',
    enabled: !!process.env.SLACK_BOT_TOKEN,
    botToken: process.env.SLACK_BOT_TOKEN,
    webhookUrl: process.env.SLACK_WEBHOOK_URL,
    rateLimit: {
      requestsPerMinute: 60
    },
    capabilities: [
      'send_message',
      'send_notification',
      'get_channels',
      'get_users',
      'upload_file'
    ],
    config: {
      baseURL: 'https://slack.com/api'
    }
  },

  github: {
    name: 'GitHub Integration',
    enabled: !!process.env.GITHUB_TOKEN,
    token: process.env.GITHUB_TOKEN,
    rateLimit: {
      requestsPerHour: 5000
    },
    capabilities: [
      'create_issue',
      'create_pr',
      'get_repo_info',
      'list_commits',
      'create_comment',
      'update_issue'
    ],
    config: {
      baseURL: 'https://api.github.com'
    }
  },

  calendar: {
    name: 'Google Calendar Integration',
    enabled: !!process.env.GOOGLE_CALENDAR_CREDENTIALS,
    credentialsPath: process.env.GOOGLE_CALENDAR_CREDENTIALS,
    rateLimit: {
      requestsPerMinute: 100
    },
    capabilities: [
      'create_event',
      'list_events',
      'update_event',
      'delete_event',
      'check_availability'
    ],
    config: {
      scopes: ['https://www.googleapis.com/auth/calendar']
    }
  },

  search: {
    name: 'Web Search',
    enabled: !!(process.env.SERPAPI_API_KEY || process.env.TAVILY_API_KEY),
    providers: {
      serpapi: {
        enabled: !!process.env.SERPAPI_API_KEY,
        apiKey: process.env.SERPAPI_API_KEY
      },
      tavily: {
        enabled: !!process.env.TAVILY_API_KEY,
        apiKey: process.env.TAVILY_API_KEY
      }
    },
    rateLimit: {
      requestsPerMinute: 10
    },
    capabilities: [
      'web_search',
      'search_documentation',
      'news_search',
      'image_search'
    ]
  },

  whisper: {
    name: 'Whisper Transcription',
    enabled: !!process.env.OPENAI_API_KEY,
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.WHISPER_MODEL || 'whisper-1',
    rateLimit: {
      requestsPerMinute: 50
    },
    capabilities: [
      'transcribe',
      'translate'
    ],
    config: {
      maxFileSize: 25 * 1024 * 1024, // 25MB
      supportedFormats: ['mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'wav', 'webm']
    }
  },

  vectorStore: {
    name: 'Pinecone Vector Store',
    enabled: !!process.env.PINECONE_API_KEY,
    apiKey: process.env.PINECONE_API_KEY,
    environment: process.env.PINECONE_ENVIRONMENT,
    indexName: process.env.PINECONE_INDEX || 'zenai-embeddings',
    capabilities: [
      'index_documents',
      'similarity_search',
      'delete_documents',
      'update_metadata'
    ],
    config: {
      dimension: parseInt(process.env.EMBEDDING_DIMENSIONS) || 1536,
      metric: 'cosine'
    }
  }
};

const getToolConfig = (toolName) => {
  return TOOL_CONFIGS[toolName] || null;
};

const listEnabledTools = () => {
  return Object.entries(TOOL_CONFIGS)
    .filter(([_, config]) => config.enabled)
    .map(([name, _]) => name);
};

const isToolEnabled = (toolName) => {
  return TOOL_CONFIGS[toolName]?.enabled || false;
};

const validateToolConfig = (toolName) => {
  const config = TOOL_CONFIGS[toolName];
  
  if (!config) {
    throw new Error(`Tool not found: ${toolName}`);
  }

  if (!config.enabled) {
    throw new Error(`Tool not enabled: ${toolName}. Check environment variables.`);
  }

  return true;
};

module.exports = {
  TOOL_CONFIGS,
  getToolConfig,
  listEnabledTools,
  isToolEnabled,
  validateToolConfig
};