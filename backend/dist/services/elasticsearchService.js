"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.elasticsearchService = exports.ElasticsearchService = void 0;
const elasticsearch_1 = require("../config/elasticsearch");
const logger_1 = require("../utils/logger");
const uuid_1 = require("uuid");
class ElasticsearchService {
    async initializeIndex() {
        try {
            const exists = await elasticsearch_1.esClient.indices.exists({ index: elasticsearch_1.emailIndexName });
            if (!exists) {
                await elasticsearch_1.esClient.indices.create({
                    index: elasticsearch_1.emailIndexName,
                    body: elasticsearch_1.emailMapping
                });
                logger_1.logger.info(`Created Elasticsearch index: ${elasticsearch_1.emailIndexName}`);
            }
            else {
                logger_1.logger.info(`Elasticsearch index already exists: ${elasticsearch_1.emailIndexName}`);
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize Elasticsearch index:', error);
            throw error;
        }
    }
    async indexEmail(email) {
        try {
            const emailId = email.id || (0, uuid_1.v4)();
            const response = await elasticsearch_1.esClient.index({
                index: elasticsearch_1.emailIndexName,
                id: emailId,
                body: { ...email, id: emailId },
                refresh: 'wait_for'
            });
            logger_1.logger.debug(`Indexed email: ${emailId}`);
            return response._id;
        }
        catch (error) {
            logger_1.logger.error(`Failed to index email ${email.id}:`, error);
            throw error;
        }
    }
    async updateEmailCategory(emailId, category, confidence) {
        try {
            await elasticsearch_1.esClient.update({
                index: elasticsearch_1.emailIndexName,
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
            logger_1.logger.debug(`Updated category for email ${emailId}: ${category}`);
        }
        catch (error) {
            logger_1.logger.error(`Failed to update category for email ${emailId}:`, error);
            throw error;
        }
    }
    async searchEmails(params) {
        try {
            const must = [];
            const filter = [];
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
                const dateRange = {};
                if (params.dateFrom)
                    dateRange.gte = params.dateFrom;
                if (params.dateTo)
                    dateRange.lte = params.dateTo;
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
                    { date: { order: 'desc' } },
                    { _score: { order: 'desc' } }
                ],
                from: params.offset || 0,
                size: params.limit || 50
            };
            const response = await elasticsearch_1.esClient.search({
                index: elasticsearch_1.emailIndexName,
                body: searchQuery
            });
            const emails = response.hits.hits.map((hit) => ({
                ...hit._source,
                id: hit._id
            }));
            const total = typeof response.hits.total === 'number'
                ? response.hits.total
                : response.hits.total?.value || 0;
            return {
                emails,
                total
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to search emails:', error);
            throw error;
        }
    }
    async getEmailById(emailId) {
        try {
            const response = await elasticsearch_1.esClient.get({
                index: elasticsearch_1.emailIndexName,
                id: emailId
            });
            return {
                ...response._source,
                id: response._id
            };
        }
        catch (error) {
            if (error.meta?.statusCode === 404) {
                return null;
            }
            logger_1.logger.error(`Failed to get email ${emailId}:`, error);
            throw error;
        }
    }
    async getEmailStats(accountId) {
        try {
            const filter = accountId ? [{ term: { accountId } }] : [];
            const response = await elasticsearch_1.esClient.search({
                index: elasticsearch_1.emailIndexName,
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
            const total = typeof response.hits.total === 'number'
                ? response.hits.total
                : response.hits.total?.value || 0;
            const categoriesAgg = response.aggregations?.categories;
            const foldersAgg = response.aggregations?.folders;
            return {
                total,
                byCategory: categoriesAgg?.buckets?.reduce((acc, bucket) => {
                    acc[bucket.key] = bucket.doc_count;
                    return acc;
                }, {}) || {},
                byFolder: foldersAgg?.buckets?.reduce((acc, bucket) => {
                    acc[bucket.key] = bucket.doc_count;
                    return acc;
                }, {}) || {}
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get email stats:', error);
            throw error;
        }
    }
    async deleteEmail(emailId) {
        try {
            await elasticsearch_1.esClient.delete({
                index: elasticsearch_1.emailIndexName,
                id: emailId
            });
            logger_1.logger.info(`Deleted email: ${emailId}`);
        }
        catch (error) {
            logger_1.logger.error(`Failed to delete email ${emailId}:`, error);
            throw error;
        }
    }
    async updateEmail(emailId, updates) {
        try {
            await elasticsearch_1.esClient.update({
                index: elasticsearch_1.emailIndexName,
                id: emailId,
                body: {
                    doc: {
                        ...updates,
                        updatedAt: new Date()
                    }
                }
            });
            logger_1.logger.debug(`Updated email: ${emailId}`);
        }
        catch (error) {
            logger_1.logger.error(`Failed to update email ${emailId}:`, error);
            throw error;
        }
    }
}
exports.ElasticsearchService = ElasticsearchService;
exports.elasticsearchService = new ElasticsearchService();
//# sourceMappingURL=elasticsearchService.js.map