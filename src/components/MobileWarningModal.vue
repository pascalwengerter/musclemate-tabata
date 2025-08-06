<template>
  <div
    v-if="showModal"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    @click="closeModal"
  >
    <div class="bg-white rounded-lg p-6 max-w-sm w-full mx-4" @click.stop>
      <div class="text-center">
        <ExclamationTriangleIcon class="w-16 h-16 text-amber-500 mx-auto mb-4" />
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Mobile Data Warning</h3>
        <p class="text-gray-600 mb-6">
          This app requires downloading approximately 50MB of data for audio processing. This may
          consume significant mobile data. Are you sure you want to continue?
        </p>
        <div class="flex gap-3">
          <button
            @click="acceptAndContinue"
            class="flex-1 bg-rose-400 text-white py-2 px-4 rounded hover:bg-rose-500"
          >
            Continue
          </button>
          <button
            @click="closeModal"
            class="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { ExclamationTriangleIcon } from '@heroicons/vue/16/solid'

const showModal = ref(false)

const emit = defineEmits<{
  (e: 'accepted'): void
}>()

const isMobileDevice = () => {
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth < 768
  )
}

const hasAcceptedWarning = () => {
  return localStorage.getItem('mobile-warning-accepted') === 'true'
}

onMounted(() => {
  if (isMobileDevice() && !hasAcceptedWarning()) {
    showModal.value = true
  }
})

const acceptAndContinue = () => {
  localStorage.setItem('mobile-warning-accepted', 'true')
  showModal.value = false
  emit('accepted')
}

const closeModal = () => {
  showModal.value = false
}
</script>
