<template>
  <div class="w-full flex justify-center px-4 pb-20">
    <div
      class="bg-white w-full rounded-xl space-y-4 flex flex-col lg:flex-row justify-between gap-4 p-4 max-w-4xl"
    >
      <div class="flex flex-col gap-4 my-0 flex-1">
        <div class="flex flex-col items-center p-4 sm:p-8 border border-dotted rounded-lg">
          <h3 class="text-lg font-semibold mb-3 text-gray-700">Exercise Track</h3>
          <div class="w-full mb-4">
            <WaveformPlayer
              v-if="activeFile"
              :id="'exercise'"
              :file="activeFile"
              :duration="20"
              @region-change="handleActiveRegionChange"
            />
          </div>
          <p v-if="activeFile" class="text-sm text-gray-600 mb-3 truncate max-w-full">
            {{ activeFile.name }}
          </p>
          <label
            for="file1"
            :class="[
              'inline-block bg-rose-400 text-white py-2 px-4 rounded text-center min-w-[140px]',
              isRunning
                ? 'opacity-50 cursor-not-allowed pointer-events-none'
                : 'hover:bg-rose-500 cursor-pointer',
            ]"
          >
            Choose Active File
          </label>
          <input
            id="file1"
            type="file"
            accept="audio/*"
            @change="onActiveFileChange"
            class="hidden"
            :disabled="isRunning"
          />
        </div>
        <div class="flex flex-col items-center p-4 sm:p-8 border border-dotted rounded-lg">
          <h3 class="text-lg font-semibold mb-3 text-gray-700">Rest Track</h3>
          <div class="w-full mb-4">
            <WaveformPlayer
              v-if="restFile"
              :id="'rest'"
              :file="restFile"
              :duration="10"
              @region-change="handleRestRegionChange"
            />
          </div>
          <p v-if="restFile" class="text-sm text-gray-600 mb-3 truncate max-w-full">
            {{ restFile.name }}
          </p>
          <label
            for="file2"
            :class="[
              'inline-block bg-rose-400 text-white py-2 px-4 rounded text-center min-w-[140px]',
              isRunning
                ? 'opacity-50 cursor-not-allowed pointer-events-none'
                : 'hover:bg-rose-500 cursor-pointer',
            ]"
          >
            Choose Rest File
          </label>
          <input
            id="file2"
            type="file"
            accept="audio/*"
            @change="onRestFileChange"
            class="hidden"
            :disabled="isRunning"
          />
        </div>
      </div>
      <div
        class="flex flex-col gap-3 justify-center border border-dotted rounded-lg p-4 sm:p-8 lg:min-w-[280px]"
      >
        <h3 class="text-lg font-semibold text-gray-700 text-center mb-2">Create Track</h3>
        <CreateButton />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useEditorStore } from '@/stores'
import { storeToRefs } from 'pinia'
import CreateButton from './CreateButton.vue'
import WaveformPlayer from './WaveformPlayer.vue'

const editor = useEditorStore()
const { activeFile, restFile, isRunning } = storeToRefs(editor)

function onActiveFileChange(event: Event) {
  const file = (event.target as HTMLInputElement)?.files?.[0]
  if (file) {
    if (isValidAudioFile(file)) {
      editor.setActiveFile(file)
    } else {
      alert('Please select a valid audio file (MP3, WAV, AAC, OGG, M4A)')
      // Reset the input
      ;(event.target as HTMLInputElement).value = ''
    }
  }
}

function onRestFileChange(event: Event) {
  const file = (event.target as HTMLInputElement)?.files?.[0]
  if (file) {
    if (isValidAudioFile(file)) {
      editor.setRestFile(file)
    } else {
      alert('Please select a valid audio file (MP3, WAV, AAC, OGG, M4A)')
      // Reset the input
      ;(event.target as HTMLInputElement).value = ''
    }
  }
}

function isValidAudioFile(file: File): boolean {
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

  // Check MIME type
  if (validTypes.includes(file.type)) {
    return true
  }

  // Fallback: check file extension
  const fileName = file.name.toLowerCase()
  return validExtensions.some((ext) => fileName.endsWith(ext))
}

function handleActiveRegionChange({ start, end }: { start: number; end: number }) {
  editor.setActiveTimestamps({ start, end })
}

function handleRestRegionChange({ start, end }: { start: number; end: number }) {
  editor.setRestTimestamps({ start, end })
}
</script>
