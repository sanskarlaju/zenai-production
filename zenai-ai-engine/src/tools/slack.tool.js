const { DynamicTool } = require('langchain/tools');
const axios = require('axios');
const logger = require('../utils/logger');

class SlackTool {
  constructor() {
    this.botToken = process.env.SLACK_BOT_TOKEN;
    this.webhookUrl = process.env.SLACK_WEBHOOK_URL;
    
    this.client = axios.create({
      baseURL: 'https://slack.com/api',
      headers: {
        'Authorization': `Bearer ${this.botToken}`,
        'Content-Type': 'application/json'
      }
    });
  }

  createTools() {
    return [
      new DynamicTool({
        name: 'slack_send_message',
        description: 'Send message to Slack channel',
        func: async (input) => {
          try {
            const { channel, message } = JSON.parse(input);
            await this.sendMessage(channel, message);
            return `Message sent to ${channel}`;
          } catch (error) {
            logger.error('Slack send message error:', error);
            return `Error sending message: ${error.message}`;
          }
        }
      }),

      new DynamicTool({
        name: 'slack_send_notification',
        description: 'Send rich notification with attachments',
        func: async (input) => {
          try {
            const data = JSON.parse(input);
            await this.sendNotification(data);
            return 'Notification sent successfully';
          } catch (error) {
            logger.error('Slack notification error:', error);
            return `Error sending notification: ${error.message}`;
          }
        }
      }),

      new DynamicTool({
        name: 'slack_get_channels',
        description: 'List available Slack channels',
        func: async () => {
          try {
            const channels = await this.getChannels();
            return JSON.stringify(channels);
          } catch (error) {
            logger.error('Slack get channels error:', error);
            return `Error getting channels: ${error.message}`;
          }
        }
      })
    ];
  }

  async sendMessage(channel, text) {
    const response = await this.client.post('/chat.postMessage', {
      channel,
      text
    });
    
    return response.data;
  }

  async sendNotification(data) {
    const payload = {
      text: data.title || 'Notification',
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: data.title || 'Notification'
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: data.message
          }
        }
      ]
    };

    if (data.fields) {
      payload.blocks.push({
        type: 'section',
        fields: data.fields.map(field => ({
          type: 'mrkdwn',
          text: `*${field.label}:*\n${field.value}`
        }))
      });
    }

    if (data.actions) {
      payload.blocks.push({
        type: 'actions',
        elements: data.actions.map(action => ({
          type: 'button',
          text: {
            type: 'plain_text',
            text: action.text
          },
          url: action.url
        }))
      });
    }

    if (this.webhookUrl) {
      await axios.post(this.webhookUrl, payload);
    } else {
      await this.client.post('/chat.postMessage', {
        channel: data.channel,
        ...payload
      });
    }
  }

  async getChannels() {
    const response = await this.client.get('/conversations.list');
    return response.data.channels.map(ch => ({
      id: ch.id,
      name: ch.name
    }));
  }
}

module.exports = SlackTool;