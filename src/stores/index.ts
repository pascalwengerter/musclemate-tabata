import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useEditorStore = defineStore('editor', () => {
  type Timestamps = { start: number; end: number }

  const activeFile = ref<File | null>(null)
  const restFile = ref<File | null>(null)

  const activeTimestamps = ref<Timestamps>({ start: 0, end: 20 })
  const restTimestamps = ref<Timestamps>({ start: 0, end: 10 })

  const isRunning = ref(false)

  function setActiveFile(file: File) {
    activeFile.value = file
  }

  function setRestFile(file: File) {
    restFile.value = file
  }

  function setActiveTimestamps(ts: Timestamps) {
    activeTimestamps.value = ts
  }

  function setRestTimestamps(ts: Timestamps) {
    restTimestamps.value = ts
  }

  function setRunning(state: boolean) {
    isRunning.value = state
  }

  function reset() {
    activeFile.value = null
    restFile.value = null
    activeTimestamps.value = { start: 0, end: 20 }
    restTimestamps.value = { start: 0, end: 10 }
    isRunning.value = false
  }

  return {
    activeFile,
    restFile,
    activeTimestamps,
    restTimestamps,
    isRunning,
    setActiveFile,
    setRestFile,
    setActiveTimestamps,
    setRestTimestamps,
    setRunning,
    reset,
  }
})
