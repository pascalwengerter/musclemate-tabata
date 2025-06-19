import { FFmpeg, type LogEvent } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

const ffmpeg = new FFmpeg()

export async function createTrack({
  file1,
  file2,
  activeInterval,
  restInterval,
}: {
  file1: File
  file2: File
  activeInterval: { start: number; end: number }
  restInterval: { start: number; end: number }
}) {
  const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@0.12.9/dist/esm'

  ffmpeg.on('log', ({ message: msg }: LogEvent) => {
    console.log('FFmpeg log:', msg)
  })

  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript'),
  })

  await ffmpeg.writeFile('input1.mp3', await fetchFile(file1))
  await ffmpeg.writeFile('input2.mp3', await fetchFile(file2))

  const acStart = activeInterval.start.toString()
  const acEnd = activeInterval.end.toString()
  const reStart = restInterval.start.toString()
  const reEnd = restInterval.end.toString()

  const trackInstruct = (start: string, end: string, original: string, target: string) => {
    return ['-ss', start, '-to', end, '-i', original, '-c', 'copy', target]
  }
  const activeTrackInstruct = trackInstruct(acStart, acEnd, 'input1.mp3', 'active_cut.mp3')
  const restTrackInstruct = trackInstruct(reStart, reEnd, 'input2.mp3', 'rest_cut.mp3')

  await ffmpeg.exec(activeTrackInstruct)
  await ffmpeg.exec(restTrackInstruct)

  await ffmpeg.exec(['-i', 'concat:active_cut.mp3|rest_cut.mp3', '-c', 'copy', 'interval.mp3'])

  const concatList = Array(8).fill('file interval.mp3').join('\n')

  await ffmpeg.writeFile('concat.txt', concatList)

  await ffmpeg.exec(['-f', 'concat', '-safe', '0', '-i', 'concat.txt', '-c', 'copy', 'output.mp3'])

  const data = await ffmpeg.readFile('output.mp3')

  if (data instanceof Uint8Array) {
    const blob = new Blob([data], { type: 'audio/mpeg' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'tabata-track.mp3'
    a.click()
  } else {
    console.error('Error: Invalid file data', data)
  }
}
