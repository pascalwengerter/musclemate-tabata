<template>
  <div class="container-fluid">
    <div class="bg-white rounded-5">
      <h2>Upload tracks</h2>
      <form @submit.prevent="handleCreateTrack">
        <div class="col-md-8">
          <div
            v-for="(track, index) in tracks"
            :key="index"
            class="d-inline-flex bg-light rounded-5 p-3 mb-3"
          >
            <div class="waveform-container my-3">
              <div :id="track.waveformId"></div>
              <div :id="track.timelineId"></div>
            </div>
            <input
              required
              accept="audio/*"
              :name="track.name"
              type="file"
              :id="track.fileInputId"
              @change="handleFileChange(track, $event)"
            />
            <div class="mt-3">
              <button
                :id="track.playBtnId"
                class="btn btn-red"
                type="button"
                @click="playTrack(track)"
              >
                Play
              </button>
              <button
                :id="track.pauseBtnId"
                class="btn btn-secondary"
                type="button"
                @click="pauseTrack(track)"
              >
                Stop
              </button>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <button class="btn btn-lg btn-dark mb-3" type="submit">Create track</button>
        </div>
        <div v-if="errorMessage" class="col-md-12 pb-5">
          <div class="text-danger">{{ errorMessage }}</div>
        </div>
      </form>

      <div class="col-md-12">
        <noscript>
          <div class="card">
            <div class="card-body">
              <h3>This site doesn't work without JavaScript</h3>
            </div>
          </div>
        </noscript>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, type Ref } from 'vue'
import WaveSurfer from 'wavesurfer.js'
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js'
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.esm.js'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

interface Track {
  ref: Ref<HTMLInputElement | null>
  label: string
  name: string
  waveformId: string
  timelineId: string
  fileInputId: string
  playBtnId: string
  pauseBtnId: string
  waveSurfer: WaveSurfer | null
  regionColorFactor: string
  duration: number
}

const activeFileInput = ref<HTMLInputElement | null>(null)
const restFileInput = ref<HTMLInputElement | null>(null)
const activeFile = ref<File | null>(null)
const restFile = ref<File | null>(null)
const errorMessage = ref<string>('')

const tracks = ref<Track[]>([
  {
    ref: activeFileInput,
    label: 'Exercise',
    name: 'active_track',
    waveformId: 'waveform-active',
    timelineId: 'wave-active-timeline',
    fileInputId: 'fileinput-active',
    playBtnId: 'active-play-btn',
    pauseBtnId: 'active-pause-btn',
    waveSurfer: null,
    regionColorFactor: '0.5',
    duration: 20,
  },
  {
    ref: restFileInput,
    label: 'Rest',
    name: 'rest_track',
    waveformId: 'waveform-relax',
    timelineId: 'wave-relax-timeline',
    fileInputId: 'fileinput-relax',
    playBtnId: 'relax-play-btn',
    pauseBtnId: 'relax-pause-btn',
    waveSurfer: null,
    regionColorFactor: '0.7',
    duration: 10,
  },
])

const createWaveSurfer = (track: Track) => {
  const waveSurfer = WaveSurfer.create({
    container: `#${track.waveformId}`,
    waveColor: 'rgb(200, 0, 0)',
    progressColor: 'rgb(100, 0, 100)',
    barWidth: 2,
    barGap: 1,
    barRadius: 2,
    plugins: [
      TimelinePlugin.create({
        container: `#${track.timelineId}`,
      }),
    ],
  })

  const regions = waveSurfer.registerPlugin(RegionsPlugin.create())

  waveSurfer.on('decode', () => {
    regions.addRegion({
      start: 0,
      end: track.duration,
      minLength: track.duration,
      maxLength: track.duration,
      color: `rgba(200, 0, 0, ${track.regionColorFactor})`,
      resize: false,
    })
  })

  return waveSurfer
}

onMounted(() => {
  tracks.value.forEach((track) => {
    track.waveSurfer = createWaveSurfer(track)
  })
})

const handleFileChange = (track: Track, event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file && track.waveSurfer) {
    const blobURL = URL.createObjectURL(file)
    track.waveSurfer.load(blobURL)

    URL.revokeObjectURL(blobURL)
  }
}

const playTrack = (track: Track) => {
  if (track.waveSurfer) {
    track.waveSurfer.play()
  }
}

const pauseTrack = (track: Track) => {
  if (track.waveSurfer?.isPlaying) {
    track.waveSurfer.pause()
  }
}

const revealInterval = (track: Track) => {
  const currentInterval = track.waveSurfer!.plugins[1].regions[0]
  return [currentInterval.start, currentInterval.end]
}

let loaded = false
const ffmpeg = new FFmpeg()
const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm'

const loadFFmpeg = async () => {
  if (loaded) return

  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  })

  loaded = true
}

const createTabataTrack = async (
  activeFile: File,
  restFile: File,
  activeRegion: number[],
  restRegion: number[],
) => {
  await loadFFmpeg()

  // Write original files
  await ffmpeg.writeFile('active.mp3', await fetchFile(activeFile))
  await ffmpeg.writeFile('rest.mp3', await fetchFile(restFile))

  // Cut active/rest regions
  await ffmpeg.exec([
    '-ss',
    activeRegion[0].toString(),
    '-to',
    activeRegion[1].toString(),
    '-i',
    'active.mp3',
    '-c',
    'copy',
    'active_cut.mp3',
  ])

  await ffmpeg.exec([
    '-ss',
    restRegion[0].toString(),
    '-to',
    restRegion[1].toString(),
    '-i',
    'rest.mp3',
    '-c',
    'copy',
    'rest_cut.mp3',
  ])

  // Merge one round
  await ffmpeg.exec(['-i', 'concat:active_cut.mp3|rest_cut.mp3', '-c', 'copy', 'interval.mp3'])

  // Make 8x concat.txt
  const concatList = Array(8).fill('file interval.mp3').join('\n')
  await ffmpeg.writeFile('concat.txt', concatList)

  await ffmpeg.exec(['-f', 'concat', '-safe', '0', '-i', 'concat.txt', '-c', 'copy', 'output.mp3'])

  // Read back and trigger download
  const data = await ffmpeg.readFile('output.mp3')
  const blob = new Blob([data.buffer], { type: 'audio/mpeg' })

  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'tabata-track.mp3'
  a.click()
}

const handleCreateTrack = async () => {
  if (!activeFile.value || !restFile.value) {
    errorMessage.value = 'Please select both audio files.'
    return
  }

  const activeRegion = revealInterval(tracks.value[0]) // [start, end]
  const restRegion = revealInterval(tracks.value[1])

  try {
    await createTabataTrack(activeFile.value, restFile.value, activeRegion, restRegion)
    errorMessage.value = 'Track created successfully!'
  } catch (e) {
    console.error(e)
    errorMessage.value = 'Error: ' + e.message
  }
}
</script>
