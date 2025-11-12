const { DynamicTool } = require('langchain/tools');
const axios = require('axios');
const logger = require('../utils/logger');

class SearchTool {
  constructor() {
    this.serpApiKey = process.env.SERPAPI_API_KEY;
    this.tavilyApiKey = process.env.TAVILY_API_KEY;
  }

  createTools() {
    return [
      new DynamicTool({
        name: 'web_search',
        description: 'Search the web for information',
        func: async (query) => {
          try {
            const results = await this.search(query);
            return JSON.stringify(results);
          } catch (error) {
            logger.error('Web search error:', error);
            return `Error searching: ${error.message}`;
          }
        }
      }),

      new DynamicTool({
        name: 'search_documentation',
        description: 'Search technical documentation',
        func: async (input) => {
          try {
            const { query, source } = JSON.parse(input);
            const results = await this.searchDocs(query, source);
            return JSON.stringify(results);
          } catch (error) {
            logger.error('Documentation search error:', error);
            return `Error searching docs: ${error.message}`;
          }
        }
      })
    ];
  }

  async search(query, numResults = 5) {
    if (this.tavilyApiKey) {
      return await this.tavilySearch(query, numResults);
    } else if (this.serpApiKey) {
      return await this.serpApiSearch(query, numResults);
    }
    
    throw new Error('No search API configured');
  }

  async tavilySearch(query, maxResults) {
    const response = await axios.post('https://api.tavily.com/search', {
      api_key: this.tavilyApiKey,
      query,
      max_results: maxResults,
      search_depth: 'advanced'
    });

    return response.data.results.map(r => ({
      title: r.title,
      url: r.url,
      snippet: r.content,
      score: r.score
    }));
  }

  async serpApiSearch(query, numResults) {
    const response = await axios.get('https://serpapi.com/search', {
      params: {
        api_key: this.serpApiKey,
        q: query,
        num: numResults
      }
    });

    return response.data.organic_results?.map(r => ({
      title: r.title,
      url: r.link,
      snippet: r.snippet
    })) || [];
  }

  async searchDocs(query, source = 'all') {
    // Implement documentation-specific search
    // Could integrate with Algolia, ReadTheDocs, etc.
    const docSources = {
      react: 'https://react.dev',
      nodejs: 'https://nodejs.org/docs',
      mdn: 'https://developer.mozilla.org'
    };

    if (source !== 'all' && docSources[source]) {
      return await this.search(`${query} site:${docSources[source]}`);
    }

    return await this.search(`${query} documentation`);
  }
}

module.exports = SearchTool;

