<template>
  <AppHeader />
  <main>
    <TrackCreator />
  </main>
  <AppFooter />
  <MobileWarningModal />
</template>

<script setup lang="ts">
import AppFooter from './components/AppFooter.vue'
import AppHeader from './components/AppHeader.vue'
import TrackCreator from './components/TrackCreator.vue'
import MobileWarningModal from './components/MobileWarningModal.vue'
</script>
