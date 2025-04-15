const { Router } = require('express');
const mainController = require('../controllers/aigen.controllers');
const uploadController = require('../controllers/upload.controllers');
const ttsController = require('../controllers/tts.controllers');
const { validateTTSParams, validateTTSV2Params } = require('../middlewares/main.middlewares');
const contextController = require('../controllers/context.controller');

const router = Router();

router.get('/helloworld', (req, res) => res.send('Hello World'));
router.post('/api/v2/ai-gen', mainController.aiGenerate);
router.post('/api/v2/upload-file', uploadController.uploadFile);
router.post('/api/v2/ttsv1-gen', validateTTSParams, ttsController.genSpeech);
router.post('/api/v2/ttsv2-gen', validateTTSV2Params, ttsController.genSpeechV2);
router.post('/api/admin/get-messages', contextController.getMessageInContext);
router.post('/api/admin/get-files', contextController.getFileInContext);
router.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found',
        error: '404 Not Found'
    });
});
module.exports = router;