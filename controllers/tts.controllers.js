const { ttsService } = require('../services/tts.services');
const { ttsServicev2 } = require('../services/ttsv2.services');
exports.genSpeech = async (req, res) => {
    try {
        const { text, voiceId, speed, model } = req.body;
        const result = await ttsService.ttsIntelligent(text, voiceId, speed, model);
        res.status(200).json({
            success: true,
            message: 'Speech generated successfully',
            media_url: result.url,
            timestamp: result.timestamp,
            error: null
        });
    } catch (error) {
        if (!req.headersSent) {
            return res.status(500).json({
                success: false,
                message: 'Failed to generate speech',
                error: error.message
            });
        }
    }
};

exports.genSpeechV2 = async (req, res) => {
    try {
        const { text, voiceId, speed, language } = req.body;
        const result = await ttsServicev2.ttsIntelligent(text, voiceId, speed, language);
        res.status(200).json({
            success: true,
            message: 'Speech generated successfully',
            media_url: result.url,
            timestamp: result.timestamp,
            error: null
        });
    } catch (error) {
        if (!req.headersSent) {
            return res.status(500).json({
                success: false,
                message: 'Failed to generate speech',
                error: error.message
            });
        }
    }
}