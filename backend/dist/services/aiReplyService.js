"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiReplyService = exports.AiReplyService = void 0;
const openai_1 = __importDefault(require("openai"));
const elasticsearchService_1 = require("./elasticsearchService");
const logger_1 = require("../utils/logger");
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY,
});
class AiReplyService {
    constructor() {
        this.knowledgeBase = [
            "I am applying for a job position. If the lead is interested, share the meeting booking link: https://cal.com/example",
            "Our product helps businesses automate their email outreach and improve response rates.",
            "We offer a 14-day free trial with no credit card required.",
            "Our pricing starts at $49/month for the basic plan.",
            "We integrate with Gmail, Outlook, and other major email providers.",
            "Our AI-powered categorization has 95% accuracy.",
            "We provide 24/7 customer support via email and chat.",
            "Our platform is GDPR compliant and enterprise-grade secure."
        ];
    }
    async generateReplySuggestion(emailId) {
        try {
            // Get email from Elasticsearch
            const email = await elasticsearchService_1.elasticsearchService.getEmailById(emailId);
            if (!email) {
                throw new Error(`Email not found: ${emailId}`);
            }
            // Prepare context for RAG
            const relevantKnowledge = this.findRelevantKnowledge(email);
            // Generate reply suggestion using RAG
            const completion = await openai.chat.completions.create({
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: `You are an AI assistant that generates professional email replies.

Context about our business:
${relevantKnowledge.map(k => `- ${k}`).join('\n')}

Guidelines:
- Be professional and concise
- Match the tone of the original email
- Include relevant information from the context
- Be helpful and solution-oriented
- If scheduling is mentioned, include booking links
- Keep replies under 150 words

Generate a reply suggestion that addresses the sender's needs and moves the conversation forward.`
                    },
                    {
                        role: 'user',
                        content: `Original Email:
Subject: ${email.subject}
From: ${email.from.name} <${email.from.email}>

${email.body}

Please generate a professional reply suggestion.`
                    }
                ],
                temperature: 0.3,
                max_tokens: 300
            });
            const suggestion = completion.choices[0].message.content || '';
            const confidence = this.calculateConfidence(email, suggestion);
            logger_1.logger.info(`Generated reply suggestion for email ${emailId}`);
            return {
                suggestion,
                confidence,
                reasoning: 'Generated using RAG with business knowledge'
            };
        }
        catch (error) {
            logger_1.logger.error(`Failed to generate reply for email ${emailId}:`, error);
            return {
                suggestion: 'Thank you for your email. I will review your message and get back to you shortly.',
                confidence: 0.1,
                reasoning: 'Fallback response due to generation failure'
            };
        }
    }
    findRelevantKnowledge(email) {
        const relevant = [];
        const emailText = `${email.subject} ${email.body}`.toLowerCase();
        // Look for relevant knowledge based on email content
        if (emailText.includes('job') || emailText.includes('interview') || emailText.includes('position')) {
            relevant.push(this.knowledgeBase[0]); // Job application context
        }
        if (emailText.includes('product') || emailText.includes('features') || emailText.includes('how it works')) {
            relevant.push(this.knowledgeBase[1]); // Product info
        }
        if (emailText.includes('trial') || emailText.includes('demo') || emailText.includes('test')) {
            relevant.push(this.knowledgeBase[2]); // Free trial
        }
        if (emailText.includes('price') || emailText.includes('cost') || emailText.includes('how much')) {
            relevant.push(this.knowledgeBase[3]); // Pricing
        }
        if (emailText.includes('integrate') || emailText.includes('connect') || emailText.includes('compatibility')) {
            relevant.push(this.knowledgeBase[4]); // Integrations
        }
        if (emailText.includes('ai') || emailText.includes('accuracy') || emailText.includes('categorization')) {
            relevant.push(this.knowledgeBase[5]); // AI capabilities
        }
        if (emailText.includes('support') || emailText.includes('help') || emailText.includes('contact')) {
            relevant.push(this.knowledgeBase[6]); // Support
        }
        if (emailText.includes('security') || emailText.includes('gdpr') || emailText.includes('compliance')) {
            relevant.push(this.knowledgeBase[7]); // Security
        }
        return relevant.length > 0 ? relevant : [this.knowledgeBase[1]]; // Default to product info
    }
    calculateConfidence(email, suggestion) {
        let confidence = 0.5; // Base confidence
        // Increase confidence if suggestion mentions relevant keywords
        const emailText = `${email.subject} ${email.body}`.toLowerCase();
        const suggestionText = suggestion.toLowerCase();
        // Check for relevant business terms
        const businessTerms = ['meeting', 'demo', 'trial', 'pricing', 'product', 'features', 'support'];
        const matchedTerms = businessTerms.filter(term => emailText.includes(term) && suggestionText.includes(term));
        confidence += matchedTerms.length * 0.1;
        // Check for professional language
        if (suggestionText.includes('thank you') || suggestionText.includes('appreciate')) {
            confidence += 0.1;
        }
        // Check for action items
        if (suggestionText.includes('https://') || suggestionText.includes('would you like')) {
            confidence += 0.1;
        }
        return Math.min(1.0, confidence);
    }
    async addToKnowledgeBase(fact) {
        try {
            this.knowledgeBase.push(fact);
            logger_1.logger.info('Added new fact to knowledge base:', fact);
        }
        catch (error) {
            logger_1.logger.error('Failed to add to knowledge base:', error);
        }
    }
    getKnowledgeBase() {
        return [...this.knowledgeBase];
    }
    async generateMultipleSuggestions(emailId, count = 3) {
        try {
            const email = await elasticsearchService_1.elasticsearchService.getEmailById(emailId);
            if (!email) {
                throw new Error(`Email not found: ${emailId}`);
            }
            const tones = [
                'Professional and formal',
                'Friendly and casual',
                'Concise and direct'
            ];
            const suggestions = [];
            for (let i = 0; i < Math.min(count, tones.length); i++) {
                const completion = await openai.chat.completions.create({
                    model: 'gpt-4',
                    messages: [
                        {
                            role: 'system',
                            content: `Generate a ${tones[i]} email reply. Be professional and helpful. Keep it under 150 words.`
                        },
                        {
                            role: 'user',
                            content: `Original Email:\nSubject: ${email.subject}\nFrom: ${email.from.name}\n\n${email.body}\n\nGenerate a ${tones[i]} reply.`
                        }
                    ],
                    temperature: 0.3 + (i * 0.1), // Vary temperature slightly
                    max_tokens: 200
                });
                const suggestion = completion.choices[0].message.content || '';
                suggestions.push({
                    text: suggestion,
                    confidence: this.calculateConfidence(email, suggestion),
                    tone: tones[i]
                });
            }
            return { suggestions };
        }
        catch (error) {
            logger_1.logger.error(`Failed to generate multiple suggestions for email ${emailId}:`, error);
            throw error;
        }
    }
    async refineReply(emailId, originalSuggestion, feedback) {
        try {
            const completion = await openai.chat.completions.create({
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: 'You are refining an email suggestion based on user feedback. Make it better while maintaining professionalism.'
                    },
                    {
                        role: 'user',
                        content: `Original suggestion: ${originalSuggestion}\n\nUser feedback: ${feedback}\n\nRefine the suggestion based on this feedback.`
                    }
                ],
                temperature: 0.2,
                max_tokens: 250
            });
            const refinedSuggestion = completion.choices[0].message.content || originalSuggestion;
            const email = await elasticsearchService_1.elasticsearchService.getEmailById(emailId);
            const confidence = email ? this.calculateConfidence(email, refinedSuggestion) : 0.5;
            return {
                refinedSuggestion,
                confidence
            };
        }
        catch (error) {
            logger_1.logger.error(`Failed to refine reply for email ${emailId}:`, error);
            throw error;
        }
    }
}
exports.AiReplyService = AiReplyService;
exports.aiReplyService = new AiReplyService();
//# sourceMappingURL=aiReplyService.js.map