<template>
  <div>
    <div v-if="state === 'done'" class="flex flex-col items-center justify-center h-full">
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
      class="flex flex-col items-center justify-center h-full"
    >
      <CogIcon class="animate-spin w-16 h-16 text-rose-400 mb-4" />
      <p class="text-center text-gray-700">
        {{ buttonText }}
      </p>
      <p class="text-sm text-gray-500 mt-2">This may take a moment...</p>
    </div>
    <div v-else-if="state === 'error'" class="flex flex-col items-center justify-center h-full">
      <ExclamationTriangleIcon class="w-16 h-16 text-red-500 mb-4" />
      <p class="text-red-600 text-center mb-4">
        {{ buttonText }}
      </p>
      <p class="text-sm text-gray-500 text-center">
        Please try again. The error will reset automatically in a few seconds.
      </p>
    </div>
    <div v-else>
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
import { createTrack } from '@/utils'
import { useEditorStore } from '@/stores'

type State = 'disabled' | 'enabled' | 'processing' | 'error' | 'done'

const editor = useEditorStore()

const { activeFile, restFile, activeTimestamps, restTimestamps } = storeToRefs(editor)

const state = ref<State>('disabled')

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
      return 'Processing...'
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

  try {
    await createTrack({
      file1,
      file2,
      activeInterval: unref(activeTimestamps),
      restInterval: unref(restTimestamps),
    })

    state.value = 'done'
  } catch (error) {
    console.error('Error creating track:', error)
    state.value = 'error'
  }
}

const resetAll = () => {
  editor.reset()
  state.value = 'disabled'
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
