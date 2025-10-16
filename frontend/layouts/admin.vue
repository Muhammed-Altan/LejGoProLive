<template>
  <div>
    <slot />
  </div>
</template>

<script setup lang="ts">
// This layout applies admin middleware to all pages in the /admin directory
definePageMeta({
  middleware: 'admin'
})
</script>