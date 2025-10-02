<template>
  <div
    class="flex flex-col items-center justify-center min-h-[80px] bg-white w-full max-w-2xl mx-auto"
  >
    <div class="flex flex-row items-center w-full px-3 py-2 mb-2">
      <input 
        id="acceptTerms" 
        type="checkbox" 
        v-model="accepted" 
        class="form-checkbox h-5 w-5 text-[#B90C2C] focus:ring-[#B90C2C] border-gray-300 rounded mr-3 cursor-pointer opacity-60"
        aria-disabled="true"
        tabindex="0"
        @click.stop="openModal"
      />
      <label 
        for="acceptTerms" 
        class="text-base text-gray-800 select-none cursor-pointer"
        @click="openModal"
      >
        Jeg accepterer
        <span class="text-[#B90C2C] underline hover:text-[#a10a25] cursor-pointer" @click.stop="openModal">lejebetingelserne</span>
      </label>
    </div>
    <!-- Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div class="bg-white rounded-lg shadow-lg w-full max-w-lg flex flex-col max-h-[80vh] relative">
        <div class="px-6 pt-6 pb-2 text-xl font-semibold border-b">Lejebetingelser</div>
        <div
          ref="modalContent"
          class="overflow-y-auto px-6 py-4 text-gray-700 flex-1"
          style="max-height: 400px;"
          @scroll="handleScroll"
        >
          <p class="mb-4">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque euismod, urna eu tincidunt consectetur, nisi nisl aliquam nunc, eget aliquam massa nisl quis neque. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Etiam nec facilisis urna. Suspendisse potenti. Mauris euismod, sapien eu commodo cursus, enim erat dictum erat, nec dictum erat erat eu erat. Sed euismod, sapien eu commodo cursus, enim erat dictum erat, nec dictum erat erat eu erat.
          </p>
          <p class="mb-4">
            Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Mauris viverra veniam consectetur pellentesque. Donec auctor blandit quam, ac finibus ante aliquam ac. Ut vehicula rhoncus elementum. Etiam et tortor molestie, faucibus lorem in, facilisis nunc.
          </p>
          <p class="mb-4">
            Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Sed cursus turpis a purus adipiscing bibendum. Donec vitae sapien ut libero venenatis faucibus. Nullam quis ante etiam sit amet orci eget eros faucibus tincidunt. Duis leo.
          </p>
          <p class="mb-4">
            Sed fringilla mauris sit amet nibh. Donec sodales sagittis magna. Sed consequat, leo eget bibendum sodales, augue velit cursus nunc, quis gravida magna mi a libero. Fusce vulputate eleifend sapien.
          </p>
          <p>
            Vestibulum purus quam, scelerisque ut, mollis sed, nonummy id, metus. Nullam accumsan lorem in dui. Cras ultricies mi eu turpis hendrerit fringilla. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae.
          </p>
        </div>
        <div class="px-6 pb-6 pt-2 flex flex-col gap-2">
          <button
            class="w-full bg-[#B90C2C] hover:bg-[#a10a25] text-white font-semibold py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm transition-shadow hover:shadow-md"
            :disabled="!scrolledToBottom && !accepted"
            @click.stop="acceptTerms"
          >
            Jeg har læst og accepterer
          </button>
          <button class="w-full text-gray-500 hover:text-gray-700 py-2 cursor-pointer shadow-sm transition-shadow hover:shadow-md" @click.stop="closeModal">Luk</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'

const accepted = ref(false)
const showModal = ref(false)
const scrolledToBottom = ref(false)
const modalContent = ref<HTMLElement | null>(null)


function openModal() {
  showModal.value = true
  // Only reset scrolledToBottom if not already accepted
  if (!accepted.value) {
    scrolledToBottom.value = false
  }
  nextTick(() => {
    if (modalContent.value) {
      modalContent.value.scrollTop = 0
      // Check if content is already scrollable
      const el = modalContent.value
      if (el.scrollHeight <= el.clientHeight) {
        // Content fits without scrolling, enable button immediately
        scrolledToBottom.value = true
      }
    }
  })
}

// Make the whole div clickable except for the checkbox
function handleDivClick(event: MouseEvent) {
  // If the click is on the checkbox, do nothing
  const target = event.target as HTMLElement;
  if (target.tagName === 'INPUT' && target.getAttribute('type') === 'checkbox') {
    return;
  }
  openModal();
}

function closeModal() {
  showModal.value = false
  // Do not reset accepted or scrolledToBottom here
}

function handleScroll() {
  const el = modalContent.value
  if (!el) return
  // Check if scrolled to bottom with small threshold
  const isAtBottom = Math.abs(el.scrollHeight - el.clientHeight - el.scrollTop) < 5
  scrolledToBottom.value = isAtBottom
}

function acceptTerms() {
  accepted.value = true
  closeModal()
}

// Expose the accepted state so parent components can access it
defineExpose({
  accepted
})
</script>
