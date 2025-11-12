// src/whisper/transcription.service.js
const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('ffmpeg-static');
const { exec } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);
const logger = require('../utils/logger');

class WhisperService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.model = process.env.WHISPER_MODEL || 'whisper-1';
    this.maxFileSize = 25 * 1024 * 1024; // 25MB limit
  }

  async transcribe(audioFilePath, options = {}) {
    try {
      // Validate file
      if (!fs.existsSync(audioFilePath)) {
        throw new Error('Audio file not found');
      }

      const stats = fs.statSync(audioFilePath);
      if (stats.size > this.maxFileSize) {
        logger.info('File too large, splitting audio...');
        return await this.transcribeLargeFile(audioFilePath, options);
      }

      // Process audio file
      const processedPath = await this.preprocessAudio(audioFilePath);

      // Transcribe
      logger.info(`Transcribing: ${processedPath}`);
      const transcription = await this.openai.audio.transcriptions.create({
        file: fs.createReadStream(processedPath),
        model: this.model,
        language: options.language || process.env.WHISPER_LANGUAGE || 'en',
        response_format: options.format || 'verbose_json',
        temperature: options.temperature || 0
      });

      // Cleanup
      if (processedPath !== audioFilePath) {
        fs.unlinkSync(processedPath);
      }

      return {
        text: transcription.text,
        segments: transcription.segments || [],
        duration: transcription.duration,
        language: transcription.language
      };
    } catch (error) {
      logger.error('Transcription error:', error);
      throw error;
    }
  }

  async preprocessAudio(inputPath) {
    const ext = path.extname(inputPath).toLowerCase();
    
    // If already in supported format, return as-is
    if (['.mp3', '.wav', '.m4a'].includes(ext)) {
      return inputPath;
    }

    // Convert to MP3
    const outputPath = inputPath.replace(ext, '_processed.mp3');
    
    try {
      await execPromise(
        `${ffmpeg} -i "${inputPath}" -acodec libmp3lame -ar 16000 -ac 1 -ab 32k "${outputPath}"`
      );
      
      logger.info(`Audio converted: ${outputPath}`);
      return outputPath;
    } catch (error) {
      logger.error('Audio preprocessing error:', error);
      throw new Error('Failed to preprocess audio');
    }
  }

  async transcribeLargeFile(audioFilePath, options) {
    // Split large audio file into chunks
    const chunks = await this.splitAudio(audioFilePath);
    
    // Transcribe each chunk
    const transcriptions = await Promise.all(
      chunks.map(chunk => this.transcribe(chunk, options))
    );

    // Merge transcriptions
    const fullText = transcriptions.map(t => t.text).join(' ');
    const allSegments = transcriptions.flatMap(t => t.segments || []);

    // Cleanup chunks
    chunks.forEach(chunk => fs.unlinkSync(chunk));

    return {
      text: fullText,
      segments: allSegments,
      duration: transcriptions.reduce((sum, t) => sum + (t.duration || 0), 0),
      language: transcriptions[0]?.language
    };
  }

  async splitAudio(inputPath, chunkDuration = 600) {
    // Split into 10-minute chunks
    const outputPattern = inputPath.replace(path.extname(inputPath), '_chunk_%03d.mp3');
    
    try {
      await execPromise(
        `${ffmpeg} -i "${inputPath}" -f segment -segment_time ${chunkDuration} -c copy "${outputPattern}"`
      );

      // Get list of created chunks
      const dir = path.dirname(inputPath);
      const basename = path.basename(inputPath, path.extname(inputPath));
      const chunks = fs.readdirSync(dir)
        .filter(f => f.startsWith(`${basename}_chunk_`))
        .map(f => path.join(dir, f));

      return chunks;
    } catch (error) {
      logger.error('Audio splitting error:', error);
      throw error;
    }
  }

  async transcribeStream(audioStream, options = {}) {
    // For real-time transcription
    const tempFile = path.join('/tmp', `stream_${Date.now()}.mp3`);
    const writeStream = fs.createWriteStream(tempFile);

    return new Promise((resolve, reject) => {
      audioStream.pipe(writeStream);

      writeStream.on('finish', async () => {
        try {
          const result = await this.transcribe(tempFile, options);
          fs.unlinkSync(tempFile);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      writeStream.on('error', reject);
    });
  }

  async translate(audioFilePath, targetLanguage = 'en') {
    try {
      const processedPath = await this.preprocessAudio(audioFilePath);

      const translation = await this.openai.audio.translations.create({
        file: fs.createReadStream(processedPath),
        model: this.model
      });

      if (processedPath !== audioFilePath) {
        fs.unlinkSync(processedPath);
      }

      return {
        text: translation.text,
        sourceLanguage: 'auto-detected',
        targetLanguage
      };
    } catch (error) {
      logger.error('Translation error:', error);
      throw error;
    }
  }
}

module.exports = WhisperService;