
<template>
  <header class="flex items-center justify-around py-2 px-10 bg-white border-b border-gray-200">
    <div class="flex items-center gap-2">
      <NuxtLink to="/">
        <img src="/lejgopro_-_origianl_1.svg" alt="LejGoPro logo" class="h-10 w-auto p-0 m-0" />
      </NuxtLink>
    </div>
    <nav class="flex items-center gap-8">
      <NuxtLink to="/products" class="text-gray-900 no-underline font-normal text-base transition-colors duration-200 hover:text-[#B8082A]">Produkter</NuxtLink>
      <NuxtLink to="/hvorfor" class="text-gray-900 no-underline font-normal text-base transition-colors duration-200 hover:text-[#B8082A]">Hvorfor leje?</NuxtLink>
      <NuxtLink to="/kontakt" class="text-gray-900 no-underline font-normal text-base transition-colors duration-200 hover:text-[#B8082A]">Kontakt</NuxtLink>
      <UButton to="/checkout" size="md" class="font-semibold rounded-lg px-5 py-2 ml-4 bg-[#B8082A] border border-transparent text-white hover:bg-white hover:text-[#B8082A] hover:border-[#B8082A] cursor-pointer transition-colors duration-200">Book Nu</UButton>
    </nav>
  </header>
</template>

<script setup>

</script>


