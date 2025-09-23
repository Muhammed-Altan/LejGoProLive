<template>
  <div>
    <Header />
    <h1 class="text-3xl md:text-4xl font-bold text-center mb-8 mt-8">Vores GoPro Produkter</h1>
    <div class="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-7xl mx-auto mt-12 mb-16">
      <ProductCard
        title="GoPro HERO12 Black"
        description="Seneste model med avanceret billedkvalitet og forbedret stabilisering."
        img="https://static.gopro.com/assets/blta2b8522e5372af40/blt86b2d5c67d4f1ed5/64d0e286369276296caf7a71/02-pdp-h12b-gallery-1920.png?width=1920&quality=80&auto=webp&disable=upscale"
        :features="['📷 5.3K Video', '⚡ HyperSmooth 6.0', '🕑 Vandtæt', '🔋 Forbedret batteri']"
        :priceDay="49"
        :priceWeek="159"
        :popular="true"
      />
      <ProductCard
        title="GoPro HERO11 Black"
        description="Fremragende allround kamera med 5.3K video og forbedret natoptagelse."
        img="https://static.gopro.com/assets/blta2b8522e5372af40/bltb0e158820591a2a1/645147b2d5d03c0794f168cd/pdp-h11b-SA-image02-1920-2x.png?width=3840&quality=80&auto=webp&disable=upscale"
        :features="['📷 5.3K Video', '🌙 Nightlapse', '⚡ HyperSmooth 5.0', '🕑 Vandtæt til 10m']"
        :priceDay="39"
        :priceWeek="129"
      />
      <ProductCard
        title="GoPro HERO10 Black"
        description="Kraftfuld performance med GP2 processor og glimrende stabilisering."
        img="https://static.gopro.com/assets/blta2b8522e5372af40/blt2c7d09c3f92e1c63/643ee1005f834b59633e106f/pdp-h10-image02-1920-2x.png?width=1920&quality=80&auto=webp&disable=upscale"
        :features="['📷 5.3K Video', '🖥️ GP2 Processor', '⚡ HyperSmooth 4.0', '🕑 Vandtæt']"
        :priceDay="29"
        :priceWeek="109"
      />
      <ProductCard
        title="GoPro HERO9 Black"
        description="Pålidelig og prisvenlig mulighed med fremskærm og 5K video."
  img="https://static.gopro.com/assets/blta2b8522e5372af40/blt2c7d09c3f92e1c63/643ee1005f834b59633e106f/pdp-h10-image02-1920-2x.png?width=1920&quality=80&auto=webp&disable=upscale"
        :features="['📷 5K Video', '🖥️ Fremskærm', '⚡ HyperSmooth 3.0', '⏩ TimeWarp 3.0']"
        :priceDay="25"
        :priceWeek="89"
      />
    </div>
    <div class="flex flex-wrap justify-center gap-8 my-12 max-w-7xl mx-auto">
      <div class="w-full md:w-[30%] lg:w-[30%] bg-gray-50 rounded-xl p-6 shadow flex flex-col items-center mb-8">
        <img src="https://static.gopro.com/assets/blta2b8522e5372af40/blt4a6b3e1087b3473f/663a841c2a72d93452178ba2/01-pdp-h12b-handler-gallery-1920.png?width=1920&quality=80&auto=webp&disable=upscale" alt="Grip" class="w-24 h-24 object-cover rounded-lg mb-3" />
        <h4 class="text-lg font-bold mb-1">Grip</h4>
        <p class="text-sm text-gray-600 text-center">Stabilt håndtag til actionoptagelser og nem håndtering af kameraet.</p>
      </div>
      <div class="w-full md:w-[30%] lg:w-[30%] bg-gray-50 rounded-xl p-6 shadow flex flex-col items-center mb-8">
        <img src="https://static.gopro.com/assets/blta2b8522e5372af40/blt4a3f356761a12e6d/6465f1c79cb8cadbd353f013/pdp-max-enduro-battery-image01-1920-2x.png?width=1920&quality=80&auto=webp&disable=upscale" alt="Ekstra batteri" class="w-24 h-24 object-cover rounded-lg mb-3" />
        <h4 class="text-lg font-bold mb-1">Ekstra batteri</h4>
        <p class="text-sm text-gray-600 text-center">Sørger for ekstra strøm, så du kan optage længere tid uden afbrydelser.</p>
      </div>
      <div class="w-full md:w-[30%] lg:w-[30%] bg-gray-50 rounded-xl p-6 shadow flex flex-col items-center mb-8">
        <img src="https://static.gopro.com/assets/blta2b8522e5372af40/blt5028e412643854ae/65cbdc3afcd8646428eec8a5/01-pdp-h12b-headstrap-gallery-1920.png?width=1920&quality=80&auto=webp&disable=upscale" alt="Headstrap" class="w-24 h-24 object-cover rounded-lg mb-3" />
        <h4 class="text-lg font-bold mb-1">Headstrap</h4>
        <p class="text-sm text-gray-600 text-center">Monter kameraet på hovedet for hands-free POV-optagelser.</p>
      </div>
      <div class="w-full md:w-[30%] lg:w-[30%] bg-gray-50 rounded-xl p-6 shadow flex flex-col items-center mb-8">
        <img src="https://static.gopro.com/assets/blta2b8522e5372af40/bltbc6b778286c13383/64ccd3c131eb6a3cbbd4c86f/01-pdp-h12b-chesty-gallery-1920.png?width=1920&quality=80&auto=webp&disable=upscale" alt="Brystmount" class="w-24 h-24 object-cover rounded-lg mb-3" />
        <h4 class="text-lg font-bold mb-1">Brystmount</h4>
        <p class="text-sm text-gray-600 text-center">Perfekt til sport og aktiviteter, hvor du vil have kameraet tæt på kroppen.</p>
      </div>
      <div class="w-full md:w-[30%] lg:w-[30%] bg-gray-50 rounded-xl p-6 shadow flex flex-col items-center mb-8">
        <img src="https://static.gopro.com/assets/blta2b8522e5372af40/blt412da0ad3ddaa0f6/64835bbbcc30bb258ab04e57/pdp-protective-housing-image03-1920-2x.png?width=1920&quality=80&auto=webp&disable=upscale" alt="Beskyttelsescase" class="w-24 h-24 object-cover rounded-lg mb-3" />
        <h4 class="text-lg font-bold mb-1">Beskyttelsescase</h4>
        <p class="text-sm text-gray-600 text-center">Robust etui der beskytter kameraet mod stød, vand og snavs.</p>
      </div>
      <div class="w-full md:w-[30%] lg:w-[30%] bg-gray-50 rounded-xl p-6 shadow flex flex-col items-center mb-8">
        <img src="https://static.gopro.com/assets/blta2b8522e5372af40/blt865a9a20edc4b79b/663a899c8447cbcee89cb5a8/01-pdp-h12b-suction-cup-gallery-1920.png?width=1920&quality=80&auto=webp&disable=upscale" alt="Sugekop til ruder" class="w-24 h-24 object-cover rounded-lg mb-3" />
        <h4 class="text-lg font-bold mb-1">Sugekop til ruder</h4>
        <p class="text-sm text-gray-600 text-center">Fastgør kameraet sikkert til bilruder og glatte overflader for unikke vinkler.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ProductCard from '@/components/ProductCard.vue';
import Header from '@/components/Header.vue';
import { ref, onMounted } from 'vue';
import { useNuxtApp } from '#app';

interface Product {
  id: number;
  name: string;
  description: string;
  features: string | string[];
  dailyPrice: number;
  weeklyPrice: number;
  twoWeekPrice: number;
  popular: boolean;
}

const products = ref<Product[]>([]);
const placeholderImage = 'https://images.unsplash.com/photo-1519183071298-a2962be56693?auto=format&fit=crop&w=400&q=80';

onMounted(async () => {
  const { $config } = useNuxtApp();
  const base = ($config?.public?.apiBase) || 'http://localhost:3001';
  const res = await fetch(`${base}/products`);
  if (res.ok) {
    products.value = await res.json();
  }
});
</script>
