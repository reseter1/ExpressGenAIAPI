const db = require('../models/db.models');

exports.normalizeModelAI = (modelAI) => {
    if (modelAI === 'null-flash') return process.env.FLASH_MODEL;
    if (modelAI === 'null-pro') return process.env.PRO_MODEL;
    if (modelAI === 'null-base') return process.env.BASE_MODEL;
    return '';
};

exports.modelsList = () => {
    return [
        {
            name: 'NULL Flash',
            value: 'null-flash',
            description: 'The best model for text generation'
        },
        {
            name: 'NULL Pro',
            value: 'null-pro',
            description: 'The best model for handling deep and complex tasks'
        },
        {
            name: 'NULL Base',
            value: 'null-base',
            description: 'Basic model for text generation'
        }
    ]
};