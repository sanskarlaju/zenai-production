const { DynamicTool } = require('langchain/tools');
const { google } = require('googleapis');
const logger = require('../utils/logger');

class CalendarTool {
  constructor() {
    this.auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_CALENDAR_CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/calendar']
    });
    
    this.calendar = google.calendar({ version: 'v3', auth: this.auth });
  }

  createTools() {
    return [
      new DynamicTool({
        name: 'calendar_create_event',
        description: 'Create calendar event',
        func: async (input) => {
          try {
            const data = JSON.parse(input);
            const event = await this.createEvent(data);
            return `Event created: ${event.htmlLink}`;
          } catch (error) {
            logger.error('Calendar create event error:', error);
            return `Error creating event: ${error.message}`;
          }
        }
      }),

      new DynamicTool({
        name: 'calendar_list_events',
        description: 'List upcoming calendar events',
        func: async (input) => {
          try {
            const { timeMin, timeMax, maxResults } = JSON.parse(input || '{}');
            const events = await this.listEvents(timeMin, timeMax, maxResults);
            return JSON.stringify(events);
          } catch (error) {
            logger.error('Calendar list events error:', error);
            return `Error listing events: ${error.message}`;
          }
        }
      }),

      new DynamicTool({
        name: 'calendar_check_availability',
        description: 'Check calendar availability',
        func: async (input) => {
          try {
            const { start, end } = JSON.parse(input);
            const available = await this.checkAvailability(start, end);
            return available ? 'Time slot available' : 'Time slot occupied';
          } catch (error) {
            logger.error('Calendar availability error:', error);
            return `Error checking availability: ${error.message}`;
          }
        }
      })
    ];
  }

  async createEvent(data) {
    const event = {
      summary: data.title,
      description: data.description,
      start: {
        dateTime: data.startTime,
        timeZone: data.timeZone || 'UTC'
      },
      end: {
        dateTime: data.endTime,
        timeZone: data.timeZone || 'UTC'
      },
      attendees: data.attendees?.map(email => ({ email })),
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 30 }
        ]
      }
    };

    const response = await this.calendar.events.insert({
      calendarId: 'primary',
      resource: event
    });
    
    return response.data;
  }

  async listEvents(timeMin, timeMax, maxResults = 10) {
    const response = await this.calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin || new Date().toISOString(),
      timeMax: timeMax,
      maxResults,
      singleEvents: true,
      orderBy: 'startTime'
    });
    
    return response.data.items.map(event => ({
      id: event.id,
      title: event.summary,
      start: event.start.dateTime || event.start.date,
      end: event.end.dateTime || event.end.date,
      attendees: event.attendees?.map(a => a.email)
    }));
  }

  async checkAvailability(start, end) {
    const events = await this.listEvents(start, end);
    return events.length === 0;
  }
}

module.exports = CalendarTool;
