import { Router, Request, Response, NextFunction } from 'express';
import { getGenerationService } from '../services/generation.service.js';
import { getHistoryService } from '../services/history.service.js';
import { getFileService } from '../services/file.service.js';
import multer from 'multer';
import { config } from '../config/env.js';

const router = Router();
const generationService = getGenerationService();
const historyService = getHistoryService();
const fileService = getFileService();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.generation.maxFileSizeMB * 1024 * 1024,
  },
});

/**
 * POST /api/generate/text-to-video
 * Generate video from text prompt
 */
router.post(
  '/generate/text-to-video',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { prompt, parameters } = req.body;

      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({
          error: {
            code: 'INVALID_REQUEST',
            message: 'Prompt is required and must be a string',
            retryable: false,
          },
        });
      }

      // Generate video
      const result = await generationService.generateTextToVideo(prompt, parameters);

      // Save to history if successful
      if (result.status === 'completed') {
        await historyService.saveGeneration({
          type: 'text-to-video',
          prompt,
          mediaFilePath: result.mediaUrl || '',
          mediaType: result.mediaType || 'video/mp4',
          status: 'completed',
          metadata: result.metadata,
        });
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/generate/image-to-video
 * Generate video from uploaded image
 */
router.post(
  '/generate/image-to-video',
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { prompt, parameters } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          error: {
            code: 'INVALID_REQUEST',
            message: 'File is required',
            retryable: false,
          },
        });
      }

      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({
          error: {
            code: 'INVALID_REQUEST',
            message: 'Prompt is required and must be a string',
            retryable: false,
          },
        });
      }

      // Validate file
      const validation = fileService.validateFile(file.mimetype, file.size);
      if (!validation.valid) {
        return res.status(400).json({
          error: {
            code: 'INVALID_FILE',
            message: validation.error,
            retryable: false,
          },
        });
      }

      // Generate video
      const result = await generationService.generateImageToVideo(
        file.buffer,
        prompt,
        parameters
      );

      // Save to history if successful
      if (result.status === 'completed') {
        await historyService.saveGeneration({
          type: 'image-to-video',
          prompt,
          sourceFilePath: file.originalname,
          mediaFilePath: result.mediaUrl || '',
          mediaType: result.mediaType || 'video/mp4',
          status: 'completed',
          metadata: result.metadata,
        });
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/generate/text-to-image
 * Generate image from text prompt
 */
router.post(
  '/generate/text-to-image',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('🔵 [CHECKPOINT 1] Text-to-image request received');
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      
      const { prompt, parameters } = req.body;

      if (!prompt || typeof prompt !== 'string') {
        console.log('❌ [CHECKPOINT 1.1] Invalid prompt');
        return res.status(400).json({
          error: {
            code: 'INVALID_REQUEST',
            message: 'Prompt is required and must be a string',
            retryable: false,
          },
        });
      }

      console.log('✅ [CHECKPOINT 1.2] Prompt validated:', prompt);
      console.log('🔵 [CHECKPOINT 2] Calling generation service...');

      // Generate image
      const result = await generationService.generateTextToImage(prompt, parameters);

      console.log('✅ [CHECKPOINT 3] Generation service returned:', result.status);
      console.log('Result:', JSON.stringify(result, null, 2));

      // Save to history if successful
      if (result.status === 'completed') {
        console.log('🔵 [CHECKPOINT 4] Saving to history...');
        await historyService.saveGeneration({
          type: 'text-to-image',
          prompt,
          mediaFilePath: result.mediaUrl || '',
          mediaType: result.mediaType || 'image/png',
          status: 'completed',
          metadata: result.metadata,
        });
        console.log('✅ [CHECKPOINT 4.1] Saved to history');
      }

      console.log('✅ [CHECKPOINT 5] Sending response to client');
      res.json(result);
    } catch (error) {
      console.error('❌ [CHECKPOINT ERROR] Error in text-to-image route:', error);
      next(error);
    }
  }
);

/**
 * GET /api/generate/status/:jobId
 * Check generation job status
 */
router.get(
  '/generate/status/:jobId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { jobId } = req.params;

      const status = await generationService.getJobStatus(jobId);

      res.json(status);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/history
 * Retrieve generation history
 */
router.get('/history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const items = await historyService.getHistory(undefined, limit, offset);
    const total = await historyService.getCount();

    res.json({
      items,
      total,
      limit,
      offset,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/history/:id
 * Delete a history item
 */
router.delete('/history/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Get the item first to delete associated files
    const item = await historyService.getById(id);

    if (!item) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'History item not found',
          retryable: false,
        },
      });
    }

    // Delete from database
    const deleted = await historyService.deleteById(id);

    if (deleted) {
      // TODO: Delete associated media files
      res.json({ success: true });
    } else {
      res.status(500).json({
        error: {
          code: 'DELETE_FAILED',
          message: 'Failed to delete history item',
          retryable: true,
        },
      });
    }
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/media/:filename
 * Serve generated media files
 */
router.get('/media/:filename', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { filename } = req.params;

    // Check if file exists
    if (!fileService.fileExists(filename)) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Media file not found',
          retryable: false,
        },
      });
    }

    // Get file path
    const filePath = fileService.getFilePath(filename);

    // Set content type
    const mimeType = fileService.getMimeTypeFromExtension(filename);
    res.setHeader('Content-Type', mimeType);

    // Send file
    res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/prompt/enhance
 * Get enhanced version of a prompt
 */
router.post('/prompt/enhance', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { prompt, style, quality, mediaType } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        error: {
          code: 'INVALID_REQUEST',
          message: 'Prompt is required',
          retryable: false,
        },
      });
    }

    const { enhancePrompt, getPromptSuggestions } = await import('../utils/promptEnhancer.js');
    
    const enhanced = enhancePrompt(prompt, { style, quality, mediaType });
    const suggestions = getPromptSuggestions(prompt);

    res.json({
      original: prompt,
      enhanced,
      suggestions,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
