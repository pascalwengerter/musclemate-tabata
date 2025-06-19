<template>
  <div class="w-full flex justify-center">
    <div
      class="bg-white w-full rounded-xl space-y-4 flex flex-col md:flex-row justify-between gap-3 p-4 max-w-3xl"
    >
      <div class="flex flex-col gap-3 my-0">
        <div class="flex justify-center p-8 border border-dotted">
          <WaveformPlayer
            v-if="activeFile"
            :id="'exercise'"
            :file="activeFile"
            :duration="20"
            @region-change="handleActiveRegionChange"
          />
          <p v-if="activeFile">{{ activeFile.name }}</p>
          <label
            for="file1"
            :class="[
              'inline-block bg-rose-400 text-white py-2 px-4 rounded',
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
        <div class="flex justify-center p-8 border border-dotted">
          <WaveformPlayer
            v-if="restFile"
            :id="'rest'"
            :file="restFile"
            :duration="10"
            @region-change="handleRestRegionChange"
          />
          <p v-if="restFile">{{ restFile.name }}</p>
          <label
            for="file2"
            :class="[
              'inline-block bg-rose-400 text-white py-2 px-4 rounded',
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
      <div class="flex flex-col gap-3 justify-center border border-dotted p-8">
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
  if (file) editor.setActiveFile(file)
}

function onRestFileChange(event: Event) {
  const file = (event.target as HTMLInputElement)?.files?.[0]
  if (file) editor.setRestFile(file)
}

function handleActiveRegionChange({ start, end }: { start: number; end: number }) {
  editor.setActiveTimestamps({ start, end })
}

function handleRestRegionChange({ start, end }: { start: number; end: number }) {
  editor.setRestTimestamps({ start, end })
}
</script>
