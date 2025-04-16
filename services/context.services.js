const db = require('../models/db.models');

const contextService = {
    generateContextId: async () => {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        let contextId = '';
        let exists = true;

        while (exists) {
            contextId = Array.from({ length: 20 }, () => characters.charAt(Math.floor(Math.random() * charactersLength))).join('');
            exists = await db.ChatMessages.findOne({ where: { contextId }, attributes: ['contextId'] }) !== null;
        }

        return contextId;
    },
    contextIdExists: async (contextId) => {
        let hasContextId = await db.ChatMessages.findOne({ where: { contextId }, attributes: ['contextId'] });
        if (!hasContextId) {
            hasContextId = await db.Files.findOne({ where: { contextId }, attributes: ['contextId'] });
        }
        return hasContextId !== null;
    },
    getAllMessagesInContext: async (contextId) => {
        const messages = await db.ChatMessages.findAll({
            where: { contextId },
            order: [['index', 'ASC']]
        });
        return messages;
    },
    getAllFilesInContext: async (contextId) => {
        const files = await db.Files.findAll({
            where: { contextId },
            order: [['createdAt', 'ASC']]
        });
        return files;
    },
    isValidContextIdFormat: (contextId) => {
        const idRegex = /^[A-Za-z0-9]{20}$/;
        return idRegex.test(contextId);
    }
};

module.exports = contextService;