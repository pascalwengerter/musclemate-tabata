<template>
  <div class="waveform-wrapper">
    <div :id="waveformId" class="h-24"></div>
    <div :id="timelineId" class="text-xs"></div>
    <div class="mt-2">
      <button class="btn btn-red" @click="waveSurfer?.play()">Play</button>
      <button class="btn btn-secondary" @click="waveSurfer?.pause()">Stop</button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
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

  ws.on('destroy', () => {
    URL.revokeObjectURL(blobURL)
  })
})

onBeforeUnmount(() => {
  waveSurfer.value?.destroy()
})
</script>
