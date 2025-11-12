const { DynamicTool } = require('langchain/tools');
const axios = require('axios');
const logger = require('../utils/logger');

class NotionTool {
  constructor() {
    this.apiKey = process.env.NOTION_API_KEY;
    this.databaseId = process.env.NOTION_DATABASE_ID;
    this.baseURL = 'https://api.notion.com/v1';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      }
    });
  }

  createTools() {
    return [
      new DynamicTool({
        name: 'notion_create_page',
        description: 'Create a new page in Notion database',
        func: async (input) => {
          try {
            const data = JSON.parse(input);
            const response = await this.createPage(data);
            return `Page created successfully: ${response.url}`;
          } catch (error) {
            logger.error('Notion create page error:', error);
            return `Error creating page: ${error.message}`;
          }
        }
      }),

      new DynamicTool({
        name: 'notion_query_database',
        description: 'Query Notion database with filters',
        func: async (input) => {
          try {
            const filters = JSON.parse(input);
            const results = await this.queryDatabase(filters);
            return JSON.stringify(results);
          } catch (error) {
            logger.error('Notion query error:', error);
            return `Error querying database: ${error.message}`;
          }
        }
      }),

      new DynamicTool({
        name: 'notion_update_page',
        description: 'Update existing Notion page',
        func: async (input) => {
          try {
            const { pageId, properties } = JSON.parse(input);
            await this.updatePage(pageId, properties);
            return `Page ${pageId} updated successfully`;
          } catch (error) {
            logger.error('Notion update error:', error);
            return `Error updating page: ${error.message}`;
          }
        }
      })
    ];
  }

  async createPage(data) {
    const response = await this.client.post('/pages', {
      parent: { database_id: this.databaseId },
      properties: this.formatProperties(data)
    });
    
    return response.data;
  }

  async queryDatabase(filters = {}) {
    const response = await this.client.post(`/databases/${this.databaseId}/query`, {
      filter: filters,
      sorts: [{ property: 'Created', direction: 'descending' }]
    });
    
    return response.data.results;
  }

  async updatePage(pageId, properties) {
    const response = await this.client.patch(`/pages/${pageId}`, {
      properties: this.formatProperties(properties)
    });
    
    return response.data;
  }

  formatProperties(data) {
    const properties = {};
    
    if (data.title) {
      properties.Name = {
        title: [{ text: { content: data.title } }]
      };
    }
    
    if (data.status) {
      properties.Status = {
        select: { name: data.status }
      };
    }
    
    if (data.priority) {
      properties.Priority = {
        select: { name: data.priority }
      };
    }
    
    if (data.assignee) {
      properties.Assignee = {
        people: [{ id: data.assignee }]
      };
    }
    
    if (data.dueDate) {
      properties['Due Date'] = {
        date: { start: data.dueDate }
      };
    }
    
    if (data.tags) {
      properties.Tags = {
        multi_select: data.tags.map(tag => ({ name: tag }))
      };
    }
    
    return properties;
  }
}

module.exports = NotionTool;
