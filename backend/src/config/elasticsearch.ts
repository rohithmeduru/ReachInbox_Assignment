import { Client } from '@elastic/elasticsearch';

export const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
});

// Email index mapping
export const emailIndexName = 'emails';

export const emailMapping = {
  mappings: {
    properties: {
      messageId: { type: 'keyword' } as MappingProperty,
      threadId: { type: 'keyword' } as MappingProperty,
      subject: {
        type: 'text',
        fields: {
          keyword: { type: 'keyword' } as MappingProperty
        }
      } as MappingProperty,
      from: {
        properties: {
          email: { type: 'keyword' } as MappingProperty,
          name: { type: 'text' } as MappingProperty
        }
      } as MappingProperty,
      to: {
        properties: {
          email: { type: 'keyword' } as MappingProperty,
          name: { type: 'text' } as MappingProperty
        }
      } as MappingProperty,
      body: { type: 'text' } as MappingProperty,
      htmlBody: { type: 'text' } as MappingProperty,
      date: { type: 'date' } as MappingProperty,
      accountId: { type: 'keyword' } as MappingProperty,
      folder: { type: 'keyword' } as MappingProperty,
      flags: { type: 'keyword' } as MappingProperty,
      attachments: {
        properties: {
          filename: { type: 'keyword' } as MappingProperty,
          contentType: { type: 'keyword' } as MappingProperty,
          size: { type: 'long' } as MappingProperty
        }
      } as MappingProperty,
      category: { type: 'keyword' } as MappingProperty,
      categoryConfidence: { type: 'float' } as MappingProperty,
      aiProcessed: { type: 'boolean' } as MappingProperty,
      createdAt: { type: 'date' } as MappingProperty,
      updatedAt: { type: 'date' } as MappingProperty
    }
  }
};