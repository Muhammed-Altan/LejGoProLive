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
          <div class="space-y-6">
            <div>
              <h3 class="font-semibold text-lg mb-2 text-[#B8082A]">1. Generelle oplysninger</h3>
              <p>LejGoPro.dk drives af:</p>
              <p>LejGoPro<br />CVR-nr.: 41910437<br />Adresse: Snorresgade 1 st th, 2300 København S<br />E-mail: kontakt@lejgopro.dk<br />Telefon: +45 53 80 59 54</p>
            </div>
            
            <div>
              <h3 class="font-semibold text-lg mb-2 text-[#B8082A]">2. Anvendelsesområde</h3>
              <p>Disse handelsbetingelser gælder for alle lejeaftaler indgået via LejGoPro.dk. Ved bestilling accepterer du disse vilkår.</p>
            </div>
            
            <div>
              <h3 class="font-semibold text-lg mb-2 text-[#B8082A]">3. Produkter og ydelser</h3>
              <p>LejGoPro.dk tilbyder udlejning af kameraudstyr og tilbehør. Alle produkter lejes på dagsbasis med mulighed for forlængelse efter aftale.</p>
            </div>
            
            <div>
              <h3 class="font-semibold text-lg mb-2 text-[#B8082A]">4. Bestilling</h3>
              <p>Leje sker via vores hjemmeside. En lejeaftale er bindende, når ordrebekræftelsen er sendt til din e-mail.</p>
            </div>
            
            <div>
              <h3 class="font-semibold text-lg mb-2 text-[#B8082A]">5. Priser og betaling</h3>
              <p>Alle priser er angivet i DKK og inkl. moms. Betaling sker online via sikre betalingsløsninger. Beløbet trækkes ved bekræftelse af lejeperioden.</p>
            </div>
            
            <div>
              <h3 class="font-semibold text-lg mb-2 text-[#B8082A]">6. Depositum</h3>
              <p>Der opkræves et depositum ved visse produkter. Depositum returneres, når udstyret er afleveret i god stand.</p>
            </div>
            
            <div>
              <h3 class="font-semibold text-lg mb-2 text-[#B8082A]">7. Afhentning og returnering</h3>
              <p>Udstyret kan afhentes og returneres efter aftale. Returnering skal ske senest på det aftalte tidspunkt. Forsinket returnering kan medføre ekstra betaling.</p>
            </div>
            
            <div>
              <h3 class="font-semibold text-lg mb-2 text-[#B8082A]">8. Kundens ansvar</h3>
              <p>Lejer er ansvarlig for udstyret i hele lejeperioden. Skader eller bortkomst af udstyr erstattes af lejer. Det anbefales at tale med dit forsikringsselskab.</p>
            </div>
            
            <div>
              <h3 class="font-semibold text-lg mb-2 text-[#B8082A]">9. Forsikring</h3>
              <p>Forsikring kan ikke tilkøbes ved bestilling.</p>
            </div>
            
            <div>
              <h3 class="font-semibold text-lg mb-2 text-[#B8082A]">10. Fortrydelsesret og afbestilling</h3>
              <p>Lejeaftaler er undtaget den normale fortrydelsesret (jf. Forbrugeraftaleloven § 18, stk. 2, nr. 12), men vi tilbyder følgende fleksible afbestillingsbetingelser:</p>
              <ul class="list-disc ml-6 mt-2 mb-2">
                <li>Ved afbestilling senest 14 dage før lejeaftalens begyndelse refunderes 100%.</li>
                <li>Ved afbestilling senest 7 dage før lejeaftalens begyndelse refunderes 50%.</li>
                <li>Ved afbestilling mindre end 7 dage før lejeaftalens begyndelse gives ingen refundering.</li>
              </ul>
              <p>Afbestilling skal ske skriftligt til kontakt@lejgopro.dk.</p>
            </div>
            
            <div>
              <h3 class="font-semibold text-lg mb-2 text-[#B8082A]">11. Reklamation</h3>
              <p>Ved fejl eller mangler bedes du kontakte os straks. Du har 2 års reklamationsret i henhold til købeloven, hvor relevant.</p>
            </div>
            
            <div>
              <h3 class="font-semibold text-lg mb-2 text-[#B8082A]">12. Force Majeure</h3>
              <p>LejGoPro.dk er ikke ansvarlig for manglende opfyldelse af aftalen ved force majeure.</p>
            </div>
            
            <div>
              <h3 class="font-semibold text-lg mb-2 text-[#B8082A]">13. Persondata</h3>
              <p>Vi behandler dine oplysninger i overensstemmelse med vores privatlivspolitik.</p>
            </div>
            
            <div>
              <h3 class="font-semibold text-lg mb-2 text-[#B8082A]">14. Lovvalg og værneting</h3>
              <p>Aftalen er underlagt dansk ret. Eventuelle tvister afgøres ved de danske domstole.</p>
            </div>
          </div>
        </div>
        <div class="px-6 pb-6 pt-2 flex flex-col gap-2">
          <button
            class="w-full bg-[#B90C2C] hover:bg-[#a10a25] text-white font-semibold py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm transition-shadow hover:shadow-md"
            :disabled="!scrolledToBottom"
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
