import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import path from 'path';
import fs from 'fs';

// Use the downloaded static ffmpeg binary
ffmpeg.setFfmpegPath(ffmpegStatic);

/**
 * Convert any audio file to WAV format (16kHz, mono) for AI processing.
 * Returns the path to the converted file.
 */
export const convertToWav = (inputPath) => {
    return new Promise((resolve, reject) => {
        const ext = path.extname(inputPath).toLowerCase();
        
        // If already a wav, we still normalize to 16kHz mono
        const outputPath = inputPath.replace(/\.[^/.]+$/, '') + '_converted.wav';

        ffmpeg(inputPath)
            .audioFrequency(16000)
            .audioChannels(1)
            .audioCodec('pcm_s16le')
            .format('wav')
            .on('end', () => {
                // Remove original if conversion succeeded and it's different
                if (inputPath !== outputPath) {
                    try { fs.unlinkSync(inputPath); } catch (e) { /* ignore */ }
                }
                resolve(outputPath);
            })
            .on('error', (err) => {
                console.error('FFmpeg conversion error:', err.message);
                // If ffmpeg fails, fall back to original file
                resolve(inputPath);
            })
            .save(outputPath);
    });
};
