"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailMapping = exports.emailIndexName = exports.esClient = void 0;
const elasticsearch_1 = require("@elastic/elasticsearch");
exports.esClient = new elasticsearch_1.Client({
    node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
});
// Email index mapping
exports.emailIndexName = 'emails';
exports.emailMapping = {
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
//# sourceMappingURL=elasticsearch.js.map