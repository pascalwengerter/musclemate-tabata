<template>
  <div>
    <div
      v-if="state === 'done'"
      class="flex flex-col items-center justify-center py-4 min-h-[140px]"
    >
      <CheckBadgeIcon class="w-16 h-16 text-green-600" />
      <p class="text-green-600 text-center mb-4">
        {{ buttonText }}
      </p>
      <button
        class="cursor-pointer inline-flex items-center border border-rose-400 text-rose-400 px-4 py-2 rounded-md hover:border-rose-500 hover:text-rose-500"
        type="button"
        @click="resetAll"
      >
        <ArrowPathIcon class="w-4 h-4 mr-2" />
        Go again
      </button>
    </div>
    <div
      v-else-if="state === 'processing'"
      class="flex flex-col items-center justify-center py-4 min-h-[140px]"
    >
      <CogIcon class="animate-spin w-16 h-16 text-rose-400 mb-4" />
      <div class="w-full max-w-xs">
        <p class="text-center text-gray-700 mb-3 min-h-[1.5rem]">
          {{ buttonText }}
        </p>
        <div class="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div
            class="bg-rose-400 h-2 rounded-full transition-all duration-300 ease-out"
            :style="{ width: `${progressPercent}%` }"
          ></div>
        </div>
        <p class="text-xs text-gray-500 text-center">{{ progressPercent }}% complete</p>
      </div>
    </div>
    <div
      v-else-if="state === 'error'"
      class="flex flex-col items-center justify-center py-4 min-h-[140px]"
    >
      <ExclamationTriangleIcon class="w-16 h-16 text-red-500 mb-4" />
      <p class="text-red-600 text-center mb-2 font-semibold">Processing Failed</p>
      <p class="text-sm text-gray-700 text-center mb-4 max-w-sm">
        {{ errorMessage }}
      </p>
      <p class="text-xs text-gray-500 text-center">
        The error will reset automatically in a few seconds.
      </p>
    </div>
    <div v-else class="flex flex-col items-center justify-center py-4 min-h-[140px]">
      <button
        :disabled="isDisabled"
        type="button"
        class="cursor-pointer inline-flex items-center justify-center px-4 py-2 bg-rose-400 text-white rounded-md hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed"
        @click="startCreating"
      >
        <span>{{ buttonText }}</span>
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  CheckBadgeIcon,
  CogIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from '@heroicons/vue/16/solid'
import { storeToRefs } from 'pinia'
import { computed, ref, unref, watch } from 'vue'
import { createTrack, AudioProcessingError } from '@/utils'
import { useEditorStore } from '@/stores'

type State = 'disabled' | 'enabled' | 'processing' | 'error' | 'done'

const editor = useEditorStore()

const { activeFile, restFile, activeTimestamps, restTimestamps } = storeToRefs(editor)

const state = ref<State>('disabled')
const progressText = ref('')
const progressPercent = ref(0)
const errorMessage = ref('')

watch([activeFile, restFile], ([newActiveFile, newRestFile]) => {
  if (newActiveFile && newRestFile && state.value !== 'processing' && state.value !== 'done') {
    state.value = 'enabled'
  } else if (
    (!newActiveFile || !newRestFile) &&
    state.value !== 'processing' &&
    state.value !== 'done'
  ) {
    state.value = 'disabled'
  }
})

const isDisabled = computed(
  () =>
    state.value === 'disabled' ||
    state.value === 'processing' ||
    state.value === 'error' ||
    state.value === 'done',
)

const buttonText = computed(() => {
  switch (state.value) {
    case 'disabled':
      return 'Choose Files'
    case 'processing':
      return progressText.value || 'Processing...'
    case 'error':
      return 'Error Occurred'
    case 'done':
      return 'Track Created Successfully'
    default:
      return 'Create Tabata Track'
  }
})

const startCreating = async () => {
  const file1 = unref(activeFile)
  const file2 = unref(restFile)

  if (isDisabled.value || !file1 || !file2) {
    return
  }

  state.value = 'processing'
  progressText.value = 'Starting...'
  progressPercent.value = 0
  errorMessage.value = ''

  try {
    await createTrack({
      file1,
      file2,
      activeInterval: unref(activeTimestamps),
      restInterval: unref(restTimestamps),
      onProgress: (step: string, progress: number) => {
        progressText.value = step
        progressPercent.value = progress
      },
    })

    state.value = 'done'
    progressText.value = 'Complete!'
    progressPercent.value = 100
  } catch (error) {
    console.error('Error creating track:', error)
    state.value = 'error'

    if (error instanceof AudioProcessingError) {
      errorMessage.value = error.message
    } else {
      errorMessage.value = 'An unexpected error occurred. Please try again.'
    }
  }
}

const resetAll = () => {
  editor.reset()
  state.value = 'disabled'
  progressText.value = ''
  progressPercent.value = 0
  errorMessage.value = ''
}

// Reset error state after some time
watch(state, (newState) => {
  if (newState === 'error') {
    setTimeout(() => {
      if (state.value === 'error') {
        state.value = activeFile.value && restFile.value ? 'enabled' : 'disabled'
      }
    }, 5000)
  }
})
</script>
