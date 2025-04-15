const contextService = require('../services/context.services');
const { modelsList } = require('../helpers/main.helpers');

exports.getModelsList = async (req, res) => {
    try {
        const models = modelsList();
        res.status(200).json({ success: true, data: models });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error get models list from server', error: error.message });
    }
};

exports.getMessageInContext = async (req, res) => {
    try {
        const { contextId } = req.body;
        if (!contextId) {
            return res.status(400).json({ success: false, message: 'contextId is required' });
        }
        const messages = await contextService.getAllMessagesInContext(contextId);
        res.status(200).json({ success: true, data: messages });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error get message in context from server', error: error.message });
    }
};

exports.getFileInContext = async (req, res) => {
    try {
        const { contextId } = req.body;
        if (!contextId) {
            return res.status(400).json({ success: false, message: 'contextId is required' });
        }
        const files = await contextService.getAllFilesInContext(contextId);
        res.status(200).json({ success: true, data: files });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error get file in context from server', error: error.message });
    }
};