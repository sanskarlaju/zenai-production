const ffmpeg = require('ffmpeg-static');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const execPromise = promisify(exec);

class AudioProcessor {
  constructor() {
    this.supportedFormats = ['.mp3', '.wav', '.m4a', '.ogg', '.flac'];
    this.outputFormat = 'mp3';
    this.sampleRate = 16000; // 16kHz for Whisper
    this.channels = 1; // Mono
  }

  async processAudio(inputPath, options = {}) {
    try {
      const ext = path.extname(inputPath).toLowerCase();
      
      // Check if already in supported format
      if (this.supportedFormats.includes(ext) && !options.forceConvert) {
        return inputPath;
      }

      const outputPath = this.getOutputPath(inputPath);
      await this.convert(inputPath, outputPath, options);
      
      return outputPath;
    } catch (error) {
      logger.error('Audio processing error:', error);
      throw error;
    }
  }

  async convert(inputPath, outputPath, options = {}) {
    const sampleRate = options.sampleRate || this.sampleRate;
    const channels = options.channels || this.channels;
    const bitrate = options.bitrate || '32k';

    const command = `${ffmpeg} -i "${inputPath}" \
      -acodec libmp3lame \
      -ar ${sampleRate} \
      -ac ${channels} \
      -ab ${bitrate} \
      "${outputPath}"`;

    try {
      await execPromise(command);
      logger.info(`Audio converted: ${outputPath}`);
    } catch (error) {
      logger.error('FFmpeg conversion error:', error);
      throw new Error('Failed to convert audio file');
    }
  }

  async extractAudioFromVideo(videoPath, outputPath) {
    const command = `${ffmpeg} -i "${videoPath}" \
      -vn \
      -acodec libmp3lame \
      -ar ${this.sampleRate} \
      -ac ${this.channels} \
      "${outputPath}"`;

    try {
      await execPromise(command);
      logger.info(`Audio extracted from video: ${outputPath}`);
      return outputPath;
    } catch (error) {
      logger.error('Audio extraction error:', error);
      throw error;
    }
  }

  async splitAudio(inputPath, chunkDuration = 600) {
    const outputPattern = inputPath.replace(
      path.extname(inputPath),
      '_chunk_%03d.mp3'
    );

    const command = `${ffmpeg} -i "${inputPath}" \
      -f segment \
      -segment_time ${chunkDuration} \
      -c copy \
      "${outputPattern}"`;

    try {
      await execPromise(command);
      
      const dir = path.dirname(inputPath);
      const basename = path.basename(inputPath, path.extname(inputPath));
      const chunks = fs.readdirSync(dir)
        .filter(f => f.startsWith(`${basename}_chunk_`))
        .map(f => path.join(dir, f))
        .sort();

      logger.info(`Audio split into ${chunks.length} chunks`);
      return chunks;
    } catch (error) {
      logger.error('Audio splitting error:', error);
      throw error;
    }
  }

  async getAudioInfo(filePath) {
    const command = `${ffmpeg} -i "${filePath}" 2>&1`;

    try {
      const { stdout, stderr } = await execPromise(command);
      const output = stderr || stdout;

      const duration = this.extractDuration(output);
      const format = this.extractFormat(output);
      const codec = this.extractCodec(output);
      const sampleRate = this.extractSampleRate(output);

      return { duration, format, codec, sampleRate };
    } catch (error) {
      // FFmpeg returns error code even on success for -i
      if (error.stderr) {
        const output = error.stderr;
        return {
          duration: this.extractDuration(output),
          format: this.extractFormat(output),
          codec: this.extractCodec(output),
          sampleRate: this.extractSampleRate(output)
        };
      }
      throw error;
    }
  }

  async normalizeVolume(inputPath, outputPath, targetLevel = -20) {
    const command = `${ffmpeg} -i "${inputPath}" \
      -af "loudnorm=I=${targetLevel}:TP=-1.5:LRA=11" \
      "${outputPath}"`;

    try {
      await execPromise(command);
      logger.info(`Audio volume normalized: ${outputPath}`);
      return outputPath;
    } catch (error) {
      logger.error('Volume normalization error:', error);
      throw error;
    }
  }

  async removeNoise(inputPath, outputPath) {
    // Simple noise reduction using highpass and lowpass filters
    const command = `${ffmpeg} -i "${inputPath}" \
      -af "highpass=f=200, lowpass=f=3000" \
      "${outputPath}"`;

    try {
      await execPromise(command);
      logger.info(`Noise reduction applied: ${outputPath}`);
      return outputPath;
    } catch (error) {
      logger.error('Noise reduction error:', error);
      throw error;
    }
  }

  getOutputPath(inputPath) {
    const dir = path.dirname(inputPath);
    const basename = path.basename(inputPath, path.extname(inputPath));
    return path.join(dir, `${basename}_processed.${this.outputFormat}`);
  }

  extractDuration(output) {
    const match = output.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/);
    if (match) {
      const hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      const seconds = parseFloat(match[3]);
      return hours * 3600 + minutes * 60 + seconds;
    }
    return null;
  }

  extractFormat(output) {
    const match = output.match(/Input #\d+, (\w+),/);
    return match ? match[1] : null;
  }

  extractCodec(output) {
    const match = output.match(/Audio: (\w+)/);
    return match ? match[1] : null;
  }

  extractSampleRate(output) {
    const match = output.match(/(\d+) Hz/);
    return match ? parseInt(match[1]) : null;
  }

  cleanup(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info(`Cleaned up file: ${filePath}`);
      }
    } catch (error) {
      logger.error(`Cleanup error for ${filePath}:`, error);
    }
  }
}

module.exports = AudioProcessor;