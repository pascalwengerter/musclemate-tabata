<template>
  <div class="waveform-wrapper w-full">
    <div :id="waveformId" class="h-16 sm:h-24 w-full"></div>
    <div :id="timelineId" class="text-xs"></div>
    <div class="mt-2 flex gap-2 justify-center flex-wrap">
      <button
        class="inline-flex items-center px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
        @click="togglePlayPause"
        :disabled="!waveSurfer"
      >
        <PlayIcon v-if="!isPlaying" class="w-4 h-4 mr-1" />
        <PauseIcon v-else class="w-4 h-4 mr-1" />
        {{ isPlaying ? 'Pause' : 'Play' }}
      </button>
      <button
        class="inline-flex items-center px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        @click="resetPosition"
        :disabled="!waveSurfer"
      >
        <ArrowPathIcon class="w-4 h-4 mr-1" />
        Reset
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { PlayIcon, PauseIcon, ArrowPathIcon } from '@heroicons/vue/16/solid'
import WaveSurfer from 'wavesurfer.js'
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.esm.js'
import RegionsPlugin, { type Region } from 'wavesurfer.js/dist/plugins/regions.esm.js'

const props = defineProps<{
  id: string
  file: File
  duration: number
  regionColorFactor?: number
}>()

const emit = defineEmits<{
  (e: 'region-change', payload: { start: number; end: number }): void
}>()

const waveformId = `waveform-${props.id}`
const timelineId = `timeline-${props.id}`

const waveSurfer = ref<WaveSurfer | null>(null)
const isPlaying = ref(false)

const togglePlayPause = () => {
  if (!waveSurfer.value) return

  if (isPlaying.value) {
    waveSurfer.value.pause()
  } else {
    waveSurfer.value.play()
  }
}

const resetPosition = () => {
  if (!waveSurfer.value) return
  waveSurfer.value.seekTo(0)
  waveSurfer.value.pause()
}

onMounted(() => {
  const regionsPlugin = RegionsPlugin.create()
  const ws = WaveSurfer.create({
    container: `#${waveformId}`,
    waveColor: 'rgb(200, 0, 0)',
    progressColor: 'rgb(100, 0, 100)',
    barWidth: 2,
    barGap: 1,
    barRadius: 2,
    plugins: [TimelinePlugin.create({ container: `#${timelineId}` }), regionsPlugin],
  })

  waveSurfer.value = ws

  const blobURL = URL.createObjectURL(props.file)
  ws.load(blobURL)

  ws.on('decode', () => {
    const region: Region = regionsPlugin.addRegion({
      start: 0,
      end: props.duration,
      minLength: 1,
      color: `rgba(200, 0, 0, ${props.regionColorFactor ?? 0.5})`,
      resize: false,
      drag: true,
    })

    region.on('update-end', () => {
      emit('region-change', {
        start: region.start,
        end: region.end,
      })
    })
  })

  ws.on('play', () => {
    isPlaying.value = true
  })

  ws.on('pause', () => {
    isPlaying.value = false
  })

  ws.on('finish', () => {
    isPlaying.value = false
  })

  ws.on('destroy', () => {
    URL.revokeObjectURL(blobURL)
  })
})

onBeforeUnmount(() => {
  waveSurfer.value?.destroy()
})
</script>
