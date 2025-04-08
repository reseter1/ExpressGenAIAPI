const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const moment = require('moment-timezone');
const db = require('../models/db.models');

const viVoiceList = [
    { type: 2, ssml: 0, voiceType: "", languageCode: "vi-VN", voiceName: "vi-VN-NamMinhNeural", gender: "Male", displayName: "NamMinh" },
    { type: 0, ssml: 0, voiceType: "WaveNet", languageCode: "vi-VN", voiceName: "vi-VN-Wavenet-B", gender: "MALE", displayName: "Tony Lara" },
    { type: 0, ssml: 0, voiceType: "WaveNet", languageCode: "vi-VN", voiceName: "vi-VN-Wavenet-D", gender: "MALE", displayName: "Steve Daniels" },
    { type: 0, ssml: 0, voiceType: "WaveNet", languageCode: "vi-VN", voiceName: "vi-VN-Wavenet-A", gender: "FEMALE", displayName: "Gloria Castillo" },
    { type: 0, ssml: 0, voiceType: "WaveNet", languageCode: "vi-VN", voiceName: "vi-VN-Wavenet-C", gender: "FEMALE", displayName: "Veronica Chan" },
    { type: 2, ssml: 0, voiceType: "", languageCode: "vi-VN", voiceName: "vi-VN-HoaiMyNeural", gender: "Female", displayName: "HoaiMy" }
]

const enVoiceList = [
    { type: 1, ssml: 0, voiceType: "Standard", languageCode: "en-US", voiceName: "Justin", gender: "Male-child", displayName: "Jeff Shah" },
    { type: 1, ssml: 0, voiceType: "Standard", languageCode: "en-US", voiceName: "Joey", gender: "Male", displayName: "Brandon Ponce" },
    { type: 0, ssml: 0, voiceType: "Standard", languageCode: "en-US", voiceName: "en-US-Standard-J", gender: "MALE", displayName: "Anthony Arroyo" },
    { type: 0, ssml: 0, voiceType: "Standard", languageCode: "en-US", voiceName: "en-US-Standard-C", gender: "FEMALE", displayName: "Melissa Salazar" },
    { type: 0, ssml: 0, voiceType: "Standard", languageCode: "en-US", voiceName: "en-US-Standard-E", gender: "FEMALE", displayName: "Amanda Ayala" },
    { type: 0, ssml: 0, voiceType: "Standard", languageCode: "en-US", voiceName: "en-US-Standard-H", gender: "FEMALE", displayName: "Emily Hunter" }
]

const tts = async (text, voiceId, speed, language) => {
    const cookies = process.env.AUTH_TTS_V2_COOKIE.split('|');
    const actions_next = process.env.AUTH_TTS_V2_ACTION_NEXT.split('|');

    let voiceList = language === "vi" ? JSON.parse(JSON.stringify(viVoiceList)) : JSON.parse(JSON.stringify(enVoiceList));

    for (let i = 0; i < cookies.length; i++) {
        const response = await fetch("https://freetts.com/text-to-speech", {
            "headers": {
                "accept": "text/x-component",
                "accept-language": "en-US,en;q=0.9",
                "content-type": "text/plain;charset=UTF-8",
                "next-action": actions_next[i],
                "cookie": cookies[i],
                "Referer": "https://freetts.com/text-to-speech",
                "Referrer-Policy": "strict-origin-when-cross-origin"
            },
            "body": JSON.stringify([
                {
                    "text": text,
                    "type": voiceList[voiceId - 1].type,
                    "ssml": voiceList[voiceId - 1].ssml,
                    "voiceType": voiceList[voiceId - 1].voiceType,
                    "languageCode": voiceList[voiceId - 1].languageCode,
                    "voiceName": voiceList[voiceId - 1].voiceName,
                    "gender": voiceList[voiceId - 1].gender,
                    "speed": speed,
                    "pitch": "0",
                    "volume": "0",
                    "format": "mp3",
                    "quality": 0,
                    "isListenlingMode": 0,
                    "displayName": voiceList[voiceId - 1].displayName
                }
            ]),
            "method": "POST"
        });

        if (!response.ok) {
            throw new Error("Failed to initiate text-to-speech conversion from server");
        }

        const data = await response.text();
        const regex = /"audiourl":"([^"]+)"/;
        const match = data.match(regex);
        if (match && match[1]) {
            return match[1];
        }
        continue;
    }
    return null;
}

const fetchMp3 = async (url) => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

const mergeMp3Buffers = async (urls) => {
    const buffers = await Promise.all(urls.map(url => fetchMp3(url)));
    const mergedBuffer = Buffer.concat(buffers);
    return mergedBuffer;
}

const splitTextIntelligent = async (text) => {
    const maxLength = 1000;
    const punctuation = ['.', '!', '?', ',', ';', ':'];

    const splitByPunctuation = (str) => {
        for (let i = maxLength; i >= 0; i--) {
            if (punctuation.includes(str[i])) {
                return i + 1;
            }
        }
        return maxLength;
    };

    const result = [];
    while (text.length > maxLength) {
        const splitIndex = splitByPunctuation(text);
        result.push(text.slice(0, splitIndex).trim());
        text = text.slice(splitIndex).trim();
    }
    if (text.length > 0) {
        result.push(text);
    }
    return result;
}

const saveBufferToFile = async (buffer, text, voiceId) => {
    const hash = crypto.createHash('md5')
        .update(text + voiceId + Date.now())
        .digest('hex');
    const fileName = `tts-${hash}.mp3`;

    const filePath = path.join(__dirname, '../public/tts-audio', fileName);

    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    await fs.promises.writeFile(filePath, buffer);

    return fileName;
}

const ttsServicev2 = {
    ttsIntelligent: async (text, voiceId, speed, language) => {
        const splitText = await splitTextIntelligent(text);
        const mediaUrls = await Promise.all(splitText.map(async (chunk) => {
            const mediaUrl = await tts(chunk, voiceId, speed, language);
            if (!mediaUrl) {
                throw new Error("Failed to create TTS, please check credit balance from server");
            }
            return mediaUrl;
        }));
        const bufferMedia = await mergeMp3Buffers(mediaUrls);
        const fileName = await saveBufferToFile(bufferMedia, text, voiceId);
        const url = process.env.APP_URL + '/files/tts-audio/' + fileName;
        const transaction = await db.sequelize.transaction();
        let createAt = moment.tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DD HH:mm:ss");
        try {
            await db.SpeechRecords.create({ recordName: fileName, serverUrl: url, createdAt: createAt, updatedAt: createAt }, { transaction });
            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw new Error("Failed to save speech record from server");
        }
        return { url, timestamp: createAt };
    }
}

module.exports = { ttsServicev2 };