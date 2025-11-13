import { Client } from '@elastic/elasticsearch';
import type { MappingProperty } from '@elastic/elasticsearch';

export const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
});

// Email index mapping
export const emailIndexName = 'emails';

export const emailMapping = {
  mappings: {
    properties: {
      messageId: { type: 'keyword' },
      threadId: { type: 'keyword' },
      subject: {
        type: 'text',
        fields: {
          keyword: { type: 'keyword' }
        }
      },
      from: {
        properties: {
          email: { type: 'keyword' },
          name: { type: 'text' }
        }
      },
      to: {
        properties: {
          email: { type: 'keyword' },
          name: { type: 'text' }
        }
      },
      body: { type: 'text' },
      htmlBody: { type: 'text' },
      date: { type: 'date' },
      accountId: { type: 'keyword' },
      folder: { type: 'keyword' },
      flags: { type: 'keyword' },
      attachments: {
        properties: {
          filename: { type: 'keyword' },
          contentType: { type: 'keyword' },
          size: { type: 'long' }
        }
      },
      category: { type: 'keyword' },
      categoryConfidence: { type: 'float' },
      aiProcessed: { type: 'boolean' },
      createdAt: { type: 'date' },
      updatedAt: { type: 'date' }
    }
  }
};