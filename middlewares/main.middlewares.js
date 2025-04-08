const express = require('express');

const errorHandlingMiddleware = (app) => {
    app.use((err, req, res, next) => {
        if (err) {
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: err.message
            });
        } else {
            next();
        }
    });
};

const expressJsonMiddleware = (app) => {
    app.use(express.json({
        verify: (req, res, buf) => {
            try {
                JSON.parse(buf);
            } catch (e) {
                throw new Error('JSON parse error');
            }
        }
    }));
};

const validateTTSParams = (req, res, next) => {
    const { text, voiceId, speed, model } = req.body;
    const errors = [];

    if (!text || typeof text !== 'string' || text.trim() === '') {
        errors.push('"text" is required and must not be empty');
    }

    const validVoiceIds = ["OA001", "OA002", "OA003", "OA004", "OA005", "OA006"];

    if (!voiceId) {
        errors.push(`"voiceId" is required`);
    } else if (!validVoiceIds.includes(voiceId)) {
        errors.push(`"voiceId" must be one of: ${validVoiceIds.join(', ')}`);
    }

    if (speed === undefined || speed === null) {
        errors.push('"speed" is required');
    } else {
        const speedValue = parseFloat(speed);
        if (isNaN(speedValue) || speedValue < 0.5 || speedValue > 2.0) {
            errors.push('"speed" must be a number between 0.5 and 2.0');
        } else {
            req.body.speed = parseFloat(speedValue.toFixed(2));
        }
    }

    if (!model) {
        errors.push('"model" is required');
    } else if (model !== 'tts-1') {
        errors.push('"model" must be "tts-1"');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Invalid parameters',
            error: errors.join('; ')
        });
    }

    next();
};

const validateTTSV2Params = (req, res, next) => {
    const { text, voiceId, speed, language } = req.body;
    const errors = [];

    if (!text || typeof text !== 'string' || text.trim() === '') {
        errors.push('"text" is required and must not be empty');
    }

    if (voiceId === undefined || voiceId === null) {
        errors.push('"voiceId" is required');
    } else {
        const voiceIdValue = parseInt(voiceId);
        if (isNaN(voiceIdValue) || voiceIdValue < 1 || voiceIdValue > 6) {
            errors.push('"voiceId" must be a number between 1 and 6');
        }
    }

    if (speed === undefined || speed === null) {
        errors.push('"speed" is required');
    } else {
        const speedValue = parseFloat(speed);
        if (isNaN(speedValue) || speedValue < 0.5 || speedValue > 2.0) {
            errors.push('"speed" must be a number between 0.5 and 2.0');
        } else {
            req.body.speed = parseFloat(speedValue.toFixed(2));
        }
    }

    if (!language) {
        errors.push('"language" is required');
    } else if (language !== 'vi' && language !== 'en') {
        errors.push('"language" must be "vi" or "en"');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Invalid parameters',
            error: errors.join('; ')
        });
    }

    next();
};

module.exports = { errorHandlingMiddleware, expressJsonMiddleware, validateTTSParams, validateTTSV2Params };