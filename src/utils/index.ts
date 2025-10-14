import { FFmpeg, type LogEvent } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

const ffmpeg = new FFmpeg()
let isFFmpegLoaded = false

export interface ProgressCallback {
  (step: string, progress: number): void
}

export class AudioProcessingError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message)
    this.name = 'AudioProcessingError'
  }
}

// File size limit: 50MB per file
const MAX_FILE_SIZE = 50 * 1024 * 1024

export function validateAudioFile(file: File): { isValid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File "${file.name}" is too large (${Math.round(file.size / 1024 / 1024)}MB). Maximum size is 50MB.`,
    }
  }

  // Check file type
  const validTypes = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/wave',
    'audio/x-wav',
    'audio/aac',
    'audio/ogg',
    'audio/mp4',
    'audio/m4a',
    'audio/x-m4a',
  ]

  const validExtensions = ['.mp3', '.wav', '.aac', '.ogg', '.m4a']
  const fileName = file.name.toLowerCase()

  const hasValidType = validTypes.includes(file.type)
  const hasValidExtension = validExtensions.some((ext) => fileName.endsWith(ext))

  if (!hasValidType && !hasValidExtension) {
    return {
      isValid: false,
      error: `"${file.name}" is not a supported audio format. Please use MP3, WAV, AAC, OGG, or M4A files.`,
    }
  }

  return { isValid: true }
}

export async function createTrack({
  file1,
  file2,
  activeInterval,
  restInterval,
  onProgress,
}: {
  file1: File
  file2: File
  activeInterval: { start: number; end: number }
  restInterval: { start: number; end: number }
  onProgress?: ProgressCallback
}) {
  try {
    // Validate files first
    const file1Validation = validateAudioFile(file1)
    if (!file1Validation.isValid) {
      throw new AudioProcessingError(file1Validation.error!, 'INVALID_FILE')
    }

    const file2Validation = validateAudioFile(file2)
    if (!file2Validation.isValid) {
      throw new AudioProcessingError(file2Validation.error!, 'INVALID_FILE')
    }

    // Validate intervals
    if (activeInterval.start >= activeInterval.end) {
      throw new AudioProcessingError(
        'Active interval start time must be before end time',
        'INVALID_INTERVAL',
      )
    }
    if (restInterval.start >= restInterval.end) {
      throw new AudioProcessingError(
        'Rest interval start time must be before end time',
        'INVALID_INTERVAL',
      )
    }

    onProgress?.('Initializing audio processor...', 5)

    const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@0.12.9/dist/esm'

    ffmpeg.on('log', ({ type, message: msg }: LogEvent) => {
      if (type === 'error' || type === 'warning') {
        console.warn('FFmpeg:', type, msg)
      }
    })

    // Only load FFmpeg if not already loaded
    if (!isFFmpegLoaded) {
      onProgress?.('Loading audio processor (this may take a moment)...', 10)
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript'),
      })
      isFFmpegLoaded = true
      onProgress?.('Audio processor loaded successfully', 20)
    } else {
      onProgress?.('Using cached audio processor', 20)
    }

    onProgress?.('Preparing audio files...', 30)
    await ffmpeg.writeFile('input1.mp3', await fetchFile(file1))
    await ffmpeg.writeFile('input2.mp3', await fetchFile(file2))

    const acStart = activeInterval.start.toString()
    const acEnd = activeInterval.end.toString()
    const reStart = restInterval.start.toString()
    const reEnd = restInterval.end.toString()

    onProgress?.('Extracting exercise segment...', 40)
    const trackInstruct = (start: string, end: string, original: string, target: string) => {
      return ['-ss', start, '-to', end, '-i', original, '-c', 'copy', target]
    }
    const activeTrackInstruct = trackInstruct(acStart, acEnd, 'input1.mp3', 'active_cut.mp3')
    const restTrackInstruct = trackInstruct(reStart, reEnd, 'input2.mp3', 'rest_cut.mp3')

    await ffmpeg.exec(activeTrackInstruct)

    onProgress?.('Extracting rest segment...', 50)
    await ffmpeg.exec(restTrackInstruct)

    onProgress?.('Creating interval pattern...', 60)
    await ffmpeg.exec(['-i', 'concat:active_cut.mp3|rest_cut.mp3', '-c', 'copy', 'interval.mp3'])

    onProgress?.('Building final Tabata track...', 70)
    const concatList = Array(8).fill('file interval.mp3').join('\n')
    await ffmpeg.writeFile('concat.txt', concatList)

    onProgress?.('Finalizing audio...', 85)
    await ffmpeg.exec([
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      'concat.txt',
      '-c',
      'copy',
      'output.mp3',
    ])

    onProgress?.('Preparing download...', 95)
    const data = await ffmpeg.readFile('output.mp3')

    if (data instanceof Uint8Array) {
      const arrayBuffer = new ArrayBuffer(data.byteLength)
      const view = new Uint8Array(arrayBuffer)
      view.set(data)
      const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = 'tabata-track.mp3'
      a.click()

      onProgress?.('Track created successfully!', 100)

      // Cleanup temporary files
      try {
        await ffmpeg.deleteFile('input1.mp3')
        await ffmpeg.deleteFile('input2.mp3')
        await ffmpeg.deleteFile('active_cut.mp3')
        await ffmpeg.deleteFile('rest_cut.mp3')
        await ffmpeg.deleteFile('interval.mp3')
        await ffmpeg.deleteFile('concat.txt')
        await ffmpeg.deleteFile('output.mp3')
      } catch (cleanupError) {
        console.warn('Cleanup warning:', cleanupError)
      }
    } else {
      throw new AudioProcessingError(
        'Failed to generate audio file. The output format is invalid.',
        'OUTPUT_ERROR',
      )
    }
  } catch (error) {
    // Provide specific error messages based on error type
    if (error instanceof AudioProcessingError) {
      throw error
    }

    if (error instanceof Error) {
      if (error.message.includes('SharedArrayBuffer')) {
        throw new AudioProcessingError(
          "Your browser doesn't support the required audio processing features. Please try using Chrome, Firefox, or Safari with a secure connection (HTTPS).",
          'BROWSER_UNSUPPORTED',
        )
      }

      if (error.message.includes('network') || error.message.includes('fetch')) {
        throw new AudioProcessingError(
          'Failed to download audio processing components. Please check your internet connection and try again.',
          'NETWORK_ERROR',
        )
      }

      if (error.message.includes('memory') || error.message.includes('allocation')) {
        throw new AudioProcessingError(
          'Not enough memory to process these audio files. Try using smaller files or refresh the page and try again.',
          'MEMORY_ERROR',
        )
      }
    }

    // Generic fallback
    throw new AudioProcessingError(
      'An unexpected error occurred during audio processing. Please try again or use different audio files.',
      'UNKNOWN_ERROR',
    )
  }
}
