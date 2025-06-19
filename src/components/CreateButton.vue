<template>
  <div>
    <div v-if="state === 'done'" class="flex flex-col items-center justify-center h-full">
      <CheckBadgeIcon class="w-16 h-16" />
      <p class="text-green-600 text-center mb-4">
        {{ buttonText }}
      </p>
      <button
        class="cursor-pointer border border-rose-400 text-rose-400 px-4 py-2 rounded-md hover:border-rose-500 hover:text-rose-500"
        type="button"
        @click="resetAll"
      >
        Go again
      </button>
    </div>
    <div v-else-if="state === 'processing'">
      <CogIcon class="animate-spin w-16 h-16" />
      <p>
        {{ buttonText }}
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
import { CheckBadgeIcon, CogIcon } from '@heroicons/vue/16/solid'
import { storeToRefs } from 'pinia'
import { computed, ref, unref, watch } from 'vue'
import { createTrack } from '@/utils'
import { useEditorStore } from '@/stores'

type State = 'disabled' | 'enabled' | 'processing' | 'error' | 'done'

const editor = useEditorStore()

const { activeFile, restFile, activeTimestamps, restTimestamps } = storeToRefs(editor)

const state = ref<State>('disabled')

watch([activeFile, restFile], ([newActiveFile, newRestFile]) => {
  if (newActiveFile && newRestFile && state.value === 'disabled') {
    state.value = 'enabled'
  } else if ((!newActiveFile || !newRestFile) && state.value === 'enabled') {
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
</script>
