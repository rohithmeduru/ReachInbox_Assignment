import { esClient, emailIndexName, emailMapping } from '../config/elasticsearch';
import { Email } from '../models/email';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class ElasticsearchService {
  async initializeIndex(): Promise<void> {
    try {
      const exists = await esClient.indices.exists({ index: emailIndexName });

      if (!exists) {
        await esClient.indices.create({
          index: emailIndexName,
          body: emailMapping
        });
        logger.info(`Created Elasticsearch index: ${emailIndexName}`);
      } else {
        logger.info(`Elasticsearch index already exists: ${emailIndexName}`);
      }
    } catch (error) {
      logger.error('Failed to initialize Elasticsearch index:', error);
      throw error;
    }
  }

  async indexEmail(email: Email): Promise<string> {
    try {
      const emailId = email.id || uuidv4();
      const response = await esClient.index({
        index: emailIndexName,
        id: emailId,
        body: { ...email, id: emailId },
        refresh: 'wait_for'
      });

      logger.debug(`Indexed email: ${emailId}`);
      return response._id!;
    } catch (error) {
      logger.error(`Failed to index email ${email.id}:`, error);
      throw error;
    }
  }

  async updateEmailCategory(emailId: string, category: string, confidence: number): Promise<void> {
    try {
      await esClient.update({
        index: emailIndexName,
        id: emailId,
        body: {
          doc: {
            category,
            categoryConfidence: confidence,
            aiProcessed: true,
            updatedAt: new Date()
          }
        }
      });

      logger.debug(`Updated category for email ${emailId}: ${category}`);
    } catch (error) {
      logger.error(`Failed to update category for email ${emailId}:`, error);
      throw error;
    }
  }

  async searchEmails(params: {
    query?: string;
    accountId?: string;
    folder?: string;
    category?: string;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ emails: Email[]; total: number }> {
    try {
      const must: any[] = [];
      const filter: any[] = [];

      // Text search
      if (params.query) {
        must.push({
          multi_match: {
            query: params.query,
            fields: [
              'subject^3',
              'body^2',
              'from.name^2',
              'from.email',
              'to.name',
              'to.email'
            ],
            type: 'best_fields',
            fuzziness: 'AUTO'
          }
        });
      }

      // Account filter
      if (params.accountId) {
        filter.push({ term: { accountId: params.accountId } });
      }

      // Folder filter
      if (params.folder) {
        filter.push({ term: { folder: params.folder } });
      }

      // Category filter
      if (params.category) {
        filter.push({ term: { category: params.category } });
      }

      // Date range filter
      if (params.dateFrom || params.dateTo) {
        const dateRange: any = {};
        if (params.dateFrom) dateRange.gte = params.dateFrom;
        if (params.dateTo) dateRange.lte = params.dateTo;
        filter.push({ range: { date: dateRange } });
      }

      const searchQuery = {
        query: {
          bool: {
            must: must.length > 0 ? must : [{ match_all: {} }],
            filter
          }
        },
        sort: [
          { date: { order: 'desc' as const } },
          { _score: { order: 'desc' as const } }
        ],
        from: params.offset || 0,
        size: params.limit || 50
      };

      const response = await esClient.search({
        index: emailIndexName,
        body: searchQuery
      });

      const emails = response.hits.hits.map((hit: any) => ({
        ...hit._source,
        id: hit._id
      }));

      return {
        emails,
        total: response.hits.total.value
      };

    } catch (error) {
      logger.error('Failed to search emails:', error);
      throw error;
    }
  }

  async getEmailById(emailId: string): Promise<Email | null> {
    try {
      const response = await esClient.get({
        index: emailIndexName,
        id: emailId
      });

      return {
        ...response._source,
        id: response._id
      };
    } catch (error: any) {
      if (error.meta?.statusCode === 404) {
        return null;
      }
      logger.error(`Failed to get email ${emailId}:`, error);
      throw error;
    }
  }

  async getEmailStats(accountId?: string): Promise<{
    total: number;
    byCategory: Record<string, number>;
    byFolder: Record<string, number>;
  }> {
    try {
      const filter = accountId ? [{ term: { accountId } }] : [];

      const response = await esClient.search({
        index: emailIndexName,
        body: {
          query: {
            bool: {
              filter,
              must: [{ match_all: {} }]
            }
          },
          size: 0,
          aggs: {
            categories: {
              terms: { field: 'category' }
            },
            folders: {
              terms: { field: 'folder' }
            }
          }
        }
      });

      return {
        total: response.hits.total.value,
        byCategory: response.aggregations.categories.buckets.reduce(
          (acc: Record<string, number>, bucket: any) => {
            acc[bucket.key] = bucket.doc_count;
            return acc;
          },
          {}
        ),
        byFolder: response.aggregations.folders.buckets.reduce(
          (acc: Record<string, number>, bucket: any) => {
            acc[bucket.key] = bucket.doc_count;
            return acc;
          },
          {}
        )
      };

    } catch (error) {
      logger.error('Failed to get email stats:', error);
      throw error;
    }
  }

  async deleteEmail(emailId: string): Promise<void> {
    try {
      await esClient.delete({
        index: emailIndexName,
        id: emailId
      });
      logger.info(`Deleted email: ${emailId}`);
    } catch (error) {
      logger.error(`Failed to delete email ${emailId}:`, error);
      throw error;
    }
  }

  async updateEmail(emailId: string, updates: Partial<Email>): Promise<void> {
    try {
      await esClient.update({
        index: emailIndexName,
        id: emailId,
        body: {
          doc: {
            ...updates,
            updatedAt: new Date()
          }
        }
      });
      logger.debug(`Updated email: ${emailId}`);
    } catch (error) {
      logger.error(`Failed to update email ${emailId}:`, error);
      throw error;
    }
  }
}

export const elasticsearchService = new ElasticsearchService();