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
            name: 'MFC Plus',
            value: 'null-flash',
            description: 'Hiệu quả cho các tác vụ suy luận ở mức trung bình, tốc độ cao'
        },
        {
            name: 'MFC Pro',
            value: 'null-pro',
            description: 'Hiệu quả cho các tác vụ suy luận ở mức cao, tốc độ trung bình'
        },
        {
            name: 'MFC Base',
            value: 'null-base',
            description: 'Hiệu quả cho các tác vụ suy luận ở mức thấp, tốc độ cao'
        }
    ]
};