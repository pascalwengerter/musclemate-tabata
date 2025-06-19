<template>
  <footer class="footer p-3 bg-rose-400 text-white">
    <p class="text-center my-0">
      Like what you see?
      <a href="https://buymeacoffee.com/pascalwengerter" target="_blank" class="underline italic">
        Buy me a <s>coffee</s> protein shake!
      </a>
      | Feedback? <a href="mailto:gainz@musclemate.app" class="underline italic">Drop me a line</a>
      <br />
      Copyright © {{ currentYear }} Pascal Wengerter
    </p>
  </footer>
</template>

<script lang="ts" setup>
const currentYear = new Date().getFullYear()
</script>
