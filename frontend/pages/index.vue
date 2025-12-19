<template>
  <Header />

  <!-- Hero Section -->
  <section class="relative flex flex-col items-center justify-center min-h-[90vh] overflow-hidden">
    <NuxtPicture
      src="/hero-bg/federico-persiani-XvPuZ2Q71GA-unsplash.jpg"
      alt="GoPro actionkamera leje Danmark - professionelt udstyr til eventyr og ferie"
      class="absolute inset-0 w-full h-full object-cover"
      :img-attrs="{
        class: 'w-full h-full object-cover'
      }"
      format="webp"
      quality="85"
      loading="eager"
      preload
    />
    <div class="absolute inset-0 bg-white/50"></div>
    <div class="relative z-10 flex flex-col items-center justify-center py-24">
      <h1 class="text-4xl md:text-5xl font-bold text-center text-black mb-8">
  Lej et <span class="text-[#B8082A]">GoPro</span> til dit næste eventyr
      </h1>
      <p class="text-lg text-center text-black mb-8 max-w-xl">
        Professionelle actionkameraer til rejser og eventyr – nem booking, gratis levering og konkurrencedygtige priser.
      </p>
      <div class="flex gap-4 justify-center mb-8">
  <NuxtLink to="/products" class="bg-[#B8082A] text-white font-semibold py-3 px-8 rounded-full shadow-lg hover:bg-[#a10725] transition cursor-pointer">Se Alle Produkter</NuxtLink>
  <NuxtLink to="/checkout" class="bg-white text-[#B8082A] font-semibold py-3 px-8 rounded-full shadow-lg border border-[#B8082A] hover:bg-[#B8082A] hover:text-white transition cursor-pointer">Book Nu</NuxtLink>
      </div>
        <!-- <div class="trustpilot-widget" data-locale="da-DK" data-template-id="5419b6a8b0d04a076446a9ad" data-businessunit-id="62240c648bfea00299062db0" data-style-height="24px" data-style-width="100%" data-token="e198704e-54dd-42ed-b62a-a7d7eba86031" data-min-review-count="10" data-style-alignment="center">
          <a href="https://dk.trustpilot.com/review/lejgopro.dk" target="_blank" rel="noopener">Trustpilot</a>
        </div> -->
    </div>
  </section>

  <!-- Adventure Headline -->
  <section class="max-width mx-auto bg-white">
    <div class="w-full py-12">
      <div class="max-w-7xl mx-auto">
        <h2 class="text-3xl md:text-4xl font-bold text-center mb-8">
          Rejs Ikke Bare — <span class="text-[#B8082A]">Fang Eventyret.</span>
        </h2>
        <!-- Adventure Image Grid -->
        <div class="grid grid-cols-2 md:grid-cols-3 gap-10 mb-12">
          <NuxtImg src="/eventyr/benjamin-voros-FSvn9jMrDyk-unsplash.jpg" alt="GoPro actionkamera til vandfald og naturfotografering - perfekt til udendørs eventyr" class="rounded-2xl object-cover w-full h-80" width="400" height="320" format="webp" quality="95" loading="lazy" />
          <NuxtImg src="/eventyr/jack-delulio-Sgey0UZt6HY-unsplash.jpg" alt="GoPro til skiløb og vintersport - actionkamera leje til ferie" class="rounded-2xl object-cover w-full h-80" width="400" height="320" format="webp" quality="95" loading="lazy" />
          <NuxtImg src="/eventyr/patrick-hendry-3EtLikBpyfI-unsplash.jpg" alt="GoPro actionkamera til kæledyr og familieaktiviteter - udlejning til alle" class="rounded-2xl object-cover w-full h-80" width="400" height="320" format="webp" quality="95" loading="lazy" />
          <NuxtImg src="/eventyr/spenser-sembrat-I-fihlhsBWk-unsplash.jpg" alt="GoPro til bjergbestigning og ekstrem sport - professionel actionkamera leje" class="rounded-2xl object-cover w-full h-80" width="400" height="320" format="webp" quality="95" loading="lazy" />
          <NuxtImg src="/eventyr/lucas-favre-BRTV55ErUZg-unsplash.jpg" alt="GoPro actionkamera til snowboard og alpinaktiviteter - 4K optagelse kvalitet" class="rounded-2xl object-cover w-full h-80" width="400" height="320" format="webp" quality="95" loading="lazy" />
          <NuxtImg src="/eventyr/cristian-palmer-RaOKzBtN8fI-unsplash.jpg" alt="GoPro til klatring og outdoor aktiviteter - robust actionkamera udlejning" class="rounded-2xl object-cover w-full h-80" width="400" height="320" format="webp" quality="95" loading="lazy" />
        </div>
        <div class="flex justify-center mb-12">
          <NuxtLink to="/checkout" class="bg-[#B8082A] text-white font-semibold py-3 px-8 rounded-full shadow-lg hover:bg-[#a10725] transition cursor-pointer">Fang dit eventyr her</NuxtLink>
        </div>
      </div>
    </div>
  </section>

  <!-- Product Cards Section -->
  <section class="max-w-7xl mx-auto mt-16 mb-16">
    <h2 class="text-3xl md:text-4xl font-bold text-center mb-8 mt-8">Vores GoPro Produkter</h2>
    
    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center items-center my-12">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B8082A] mx-auto mb-4"></div>
        <p class="text-gray-600">Indlæser produkter...</p>
      </div>
    </div>
    
    <!-- Error state -->
    <div v-else-if="error" class="max-w-2xl mx-auto text-center my-12 p-6 bg-red-50 rounded-lg">
      <p class="text-red-600 mb-4">{{ error }}</p>
      <button @click="fetchProducts" class="bg-[#B8082A] text-white px-4 py-2 rounded hover:bg-[#a10725]">
        Prøv igen
      </button>
    </div>
    
    <!-- Products grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto mt-12 mb-16">
      <!-- Debug info -->
      <div v-if="products.length === 0" class="col-span-full text-center text-gray-500">
        Ingen produkter fundet
      </div>
      <!-- <div v-else class="col-span-full text-center text-sm text-gray-500 mb-4">
        {{ products.length }} produkter fundet
      </div> -->
      
      <ProductCard
        v-for="product in products"
        :key="product.id"
        :title="product.name"
        :description="''"
        :img="product.imageUrl || placeholderImage"
        :features="product.features ? product.features.split(',').map(f => f.trim()).slice(0, 3) : []"
        :priceDay="product.dailyPrice"
        :priceWeek="product.weeklyPrice"
        :twoWeekPrice="product.twoWeekPrice"
        :popular="false"
        :productId="product.id"
      />
    </div>
    <div class="flex flex-wrap justify-center gap-8 my-12 max-w-7xl mx-auto">
      <div class="w-full md:w-[30%] lg:w-[30%] bg-gray-50 rounded-xl p-6 shadow flex flex-col items-center mb-8">
        <img src="https://static.gopro.com/assets/blta2b8522e5372af40/blt4a6b3e1087b3473f/663a841c2a72d93452178ba2/01-pdp-h12b-handler-gallery-1920.png?width=400&quality=90&auto=webp" alt="GoPro grip håndtag til stabil actionkamera optagelse - professionelt tilbehør" class="w-24 h-24 object-cover rounded-lg mb-3" loading="lazy" />
        <h4 class="text-lg font-bold mb-1">Grip</h4>
        <p class="text-sm text-gray-600 text-center">Stabilt håndtag til actionoptagelser og nem håndtering af kameraet.</p>
      </div>
      <div class="w-full md:w-[30%] lg:w-[30%] bg-gray-50 rounded-xl p-6 shadow flex flex-col items-center mb-8">
        <img src="https://static.gopro.com/assets/blta2b8522e5372af40/blt4a3f356761a12e6d/6465f1c79cb8cadbd353f013/pdp-max-enduro-battery-image01-1920-2x.png?width=400&quality=90&auto=webp" alt="GoPro ekstra batteri til forlænget optagetid - actionkamera tilbehør leje" class="w-24 h-24 object-cover rounded-lg mb-3" loading="lazy" />
        <h4 class="text-lg font-bold mb-1">Ekstra batteri</h4>
        <p class="text-sm text-gray-600 text-center">Sørger for ekstra strøm, så du kan optage længere tid uden afbrydelser.</p>
      </div>
      <div class="w-full md:w-[30%] lg:w-[30%] bg-gray-50 rounded-xl p-6 shadow flex flex-col items-center mb-8">
        <img src="https://static.gopro.com/assets/blta2b8522e5372af40/blt5028e412643854ae/65cbdc3afcd8646428eec8a5/01-pdp-h12b-headstrap-gallery-1920.png?width=400&quality=90&auto=webp" alt="GoPro headstrap hovedrem til hands-free POV optagelser - perfekt til sport" class="w-24 h-24 object-cover rounded-lg mb-3" loading="lazy" />
        <h4 class="text-lg font-bold mb-1">Headstrap</h4>
        <p class="text-sm text-gray-600 text-center">Monter kameraet på hovedet for hands-free POV-optagelser.</p>
      </div>
      <div class="w-full md:w-[30%] lg:w-[30%] bg-gray-50 rounded-xl p-6 shadow flex flex-col items-center mb-8">
        <img src="https://static.gopro.com/assets/blta2b8522e5372af40/bltbc6b778286c13383/64ccd3c131eb6a3cbbd4c86f/01-pdp-h12b-chesty-gallery-1920.png?width=400&quality=90&auto=webp" alt="GoPro brystmount til sport og aktiviteter - actionkamera fæstning leje" class="w-24 h-24 object-cover rounded-lg mb-3" loading="lazy" />
        <h4 class="text-lg font-bold mb-1">Brystmount</h4>
        <p class="text-sm text-gray-600 text-center">Perfekt til sport og aktiviteter, hvor du vil have kameraet tæt på kroppen.</p>
      </div>
      <div class="w-full md:w-[30%] lg:w-[30%] bg-gray-50 rounded-xl p-6 shadow flex flex-col items-center mb-8 relative">
        <span class="absolute top-3 right-3 bg-green-600 text-white text-xs font-semibold px-3 py-1 rounded-full">Inkluderet</span>
        <img src="https://static.gopro.com/assets/blta2b8522e5372af40/blt412da0ad3ddaa0f6/64835bbbcc30bb258ab04e57/pdp-protective-housing-image03-1920-2x.png?width=400&quality=90&auto=webp" alt="GoPro beskyttelsescase vandtæt etui - robust beskyttelse mod stød og vand" class="w-24 h-24 object-cover rounded-lg mb-3" loading="lazy" />
        <h4 class="text-lg font-bold mb-1">Beskyttelsescase</h4>
        <p class="text-sm text-gray-600 text-center">Robust etui der beskytter kameraet mod stød, vand og snavs.</p>
      </div>
      <div class="w-full md:w-[30%] lg:w-[30%] bg-gray-50 rounded-xl p-6 shadow flex flex-col items-center mb-8">
        <img src="https://static.gopro.com/assets/blta2b8522e5372af40/blt865a9a20edc4b79b/663a899c8447cbcee89cb5a8/01-pdp-h12b-suction-cup-gallery-1920.png?width=400&quality=90&auto=webp" alt="GoPro sugekop til bilruder og glatte overflader - actionkamera mount leje" class="w-24 h-24 object-cover rounded-lg mb-3" loading="lazy" />
        <h4 class="text-lg font-bold mb-1">Sugekop til ruder</h4>
        <p class="text-sm text-gray-600 text-center">Fastgør kameraet sikkert til bilruder og glatte overflader for unikke vinkler.</p>
      </div>
    </div>
  </section>

  <!-- Booking Steps -->
  <section class="bg-white py-16">
  <h2 class="text-2xl md:text-3xl font-bold text-center mb-12">Sådan <span class="text-[#B8082A]">fungerer</span> det</h2>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
      <div class="flex flex-col items-center">
        <span class="text-5xl mb-4">🛒</span>
        <h3 class="font-bold mb-2">1. Book online</h3>
        <p class="text-center text-gray-600">Vælg din booking periode, GoPro model og tilbehør. Betal sikkert online.</p>
      </div>
      <div class="flex flex-col items-center">
        <span class="text-5xl mb-4" style="transform: scaleX(-1);">🚚</span>
        <h3 class="font-bold mb-2">2. Få leveret</h3>
        <p class="text-center text-gray-600">Vi sender dit GoPro udstyr til den nærmeste pakkeboks på den valgte dato.</p>
      </div>
      <div class="flex flex-col items-center">
        <span class="text-5xl mb-4">🎥</span>
        <h3 class="font-bold mb-2">3. Fang eventyret</h3>
        <p class="text-center text-gray-600">Brug dit GoPro til at filme alle dine eventyr og oplevelser i høj kvalitet.</p>
      </div>
      <div class="flex flex-col items-center">
        <span class="text-5xl mb-4">🚚</span>
        <h3 class="font-bold mb-2">4. Send tilbage</h3>
        <p class="text-center text-gray-600">Send udstyret tilbage med den medfølgende returlabel på slutdatoen.</p>
      </div>
    </div>
  </section>

  <!-- Why Rent GoPro Equipment Section -->
  <section class="bg-gray-50 py-16">
    <div class="max-w-6xl mx-auto px-4">
      <h2 class="text-3xl md:text-4xl font-bold text-center mb-4">
        Hvorfor <span class="text-[#B8082A]">Leje</span> GoPro Udstyr?
      </h2>
      <p class="text-center text-gray-600 mb-12 max-w-3xl mx-auto">
        Oplev fordelene ved at leje professionelt GoPro udstyr i stedet for at købe. Få adgang til det nyeste udstyr uden den store investering.
      </p>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div class="bg-white p-6 rounded-xl shadow-md">
          <div class="text-4xl mb-4 text-center">💰</div>
          <h3 class="text-xl font-bold mb-3 text-center">Økonomisk Smart</h3>
          <p class="text-gray-600 text-center">
            Spar tusindvis af kroner ved at leje i stedet for at købe. Perfekt til enkeltture, ferier eller specielle begivenheder. Få professionelt udstyr til en brøkdel af købsprisen.
          </p>
        </div>
        <div class="bg-white p-6 rounded-xl shadow-md">
          <div class="text-4xl mb-4 text-center">🎯</div>
          <h3 class="text-xl font-bold mb-3 text-center">Nyeste Teknologi</h3>
          <p class="text-gray-600 text-center">
            Få altid adgang til de nyeste GoPro modeller med de bedste funktioner. Vi opdaterer løbende vores udvalg, så du kan teste det nyeste udstyr uden forpligtelser.
          </p>
        </div>
        <div class="bg-white p-6 rounded-xl shadow-md">
          <div class="text-4xl mb-4 text-center">📦</div>
          <h3 class="text-xl font-bold mb-3 text-center">Komplet Pakke</h3>
          <p class="text-gray-600 text-center">
            Alle vores kameraer leveres med komplet tilbehør: beskyttelsescase, opladere, og memory cards. Du skal bare pakke ud og komme i gang med at filme.
          </p>
        </div>
        <div class="bg-white p-6 rounded-xl shadow-md">
          <div class="text-4xl mb-4 text-center">🚚</div>
          <h3 class="text-xl font-bold mb-3 text-center">Gratis Levering</h3>
          <p class="text-gray-600 text-center">
            Vi sender til hele Danmark uden ekstra omkostninger. Dit udstyr ankommer sikkert pakket til din nærmeste pakkeboks, klar til brug når du skal afsted.
          </p>
        </div>
        <div class="bg-white p-6 rounded-xl shadow-md">
          <div class="text-4xl mb-4 text-center">✅</div>
          <h3 class="text-xl font-bold mb-3 text-center">Kvalitet Garanteret</h3>
          <p class="text-gray-600 text-center">
            Alt vores udstyr er testet og kvalitetssikret før hver udlejning. Du kan være sikker på at få fuldt funktionelt professionelt udstyr hver gang.
          </p>
        </div>
        <div class="bg-white p-6 rounded-xl shadow-md">
          <div class="text-4xl mb-4 text-center">🔄</div>
          <h3 class="text-xl font-bold mb-3 text-center">Fleksible Perioder</h3>
          <p class="text-gray-600 text-center">
            Vælg den lejeperiode der passer dig - fra 3 dage til flere uger. Perfekt til både weekendture og længere rejser. Nem online booking.
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- Popular Use Cases Section -->
  <section class="bg-white py-16">
    <div class="max-w-6xl mx-auto px-4">
      <h2 class="text-3xl md:text-4xl font-bold text-center mb-4">
        Populære <span class="text-[#B8082A]">Anvendelser</span>
      </h2>
      <p class="text-center text-gray-600 mb-12 max-w-3xl mx-auto">
        GoPro actionkameraer er perfekte til mange forskellige aktiviteter og eventyr. Se hvad andre bruger deres lejede GoPro til.
      </p>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div class="bg-gradient-to-br from-blue-50 to-white p-6 rounded-xl border-2 border-blue-100">
          <div class="text-3xl mb-3">🏔️</div>
          <h3 class="text-lg font-bold mb-2">Action Sport & Eventyr</h3>
          <p class="text-gray-600 text-sm">
            Perfekt til skiløb, snowboard, mountainbike, klatring og andre ekstreme sportsgrene. Fang dine vildeste stunts i fantastisk 4K kvalitet.
          </p>
        </div>
        <div class="bg-gradient-to-br from-green-50 to-white p-6 rounded-xl border-2 border-green-100">
          <div class="text-3xl mb-3">🌊</div>
          <h3 class="text-lg font-bold mb-2">Vandsport & Dykning</h3>
          <p class="text-gray-600 text-sm">
            Vandtæt op til 10 meter uden ekstra hus. Ideel til surfing, snorkling, dykning, kajak og andre vandaktiviteter. Fang undervandsverdenen i klar HD.
          </p>
        </div>
        <div class="bg-gradient-to-br from-orange-50 to-white p-6 rounded-xl border-2 border-orange-100">
          <div class="text-3xl mb-3">✈️</div>
          <h3 class="text-lg font-bold mb-2">Rejser & Ferie</h3>
          <p class="text-gray-600 text-sm">
            Dokumentér dine rejseoplevelser i høj kvalitet. Kompakt og let at pakke - perfekt companion til backpacking, city trips og eksotiske destinationer.
          </p>
        </div>
        <div class="bg-gradient-to-br from-purple-50 to-white p-6 rounded-xl border-2 border-purple-100">
          <div class="text-3xl mb-3">🎬</div>
          <h3 class="text-lg font-bold mb-2">Vlogging & Content Creation</h3>
          <p class="text-gray-600 text-sm">
            Skab professionelt indhold til YouTube, Instagram og TikTok. Fantastisk stabilisering og lyd gør det nemt at producere engaging video content.
          </p>
        </div>
        <div class="bg-gradient-to-br from-pink-50 to-white p-6 rounded-xl border-2 border-pink-100">
          <div class="text-3xl mb-3">🎉</div>
          <h3 class="text-lg font-bold mb-2">Events & Begivenheder</h3>
          <p class="text-gray-600 text-sm">
            Bryllupper, fødselsdage, festivals og koncerter. Fang de særlige øjeblikke fra unikke vinkler og skab minder der holder livet ud.
          </p>
        </div>
        <div class="bg-gradient-to-br from-yellow-50 to-white p-6 rounded-xl border-2 border-yellow-100">
          <div class="text-3xl mb-3">🐕</div>
          <h3 class="text-lg font-bold mb-2">Familie & Kæledyr</h3>
          <p class="text-gray-600 text-sm">
            Følg dine børn eller kæledyr på deres eventyr. Robust og sikker til aktive familieaktiviteter, legepladser og udforskning af naturen.
          </p>
        </div>
      </div>
      <div class="flex justify-center mt-10">
        <NuxtLink to="/checkout" class="bg-[#B8082A] text-white font-semibold py-3 px-8 rounded-full shadow-lg hover:bg-[#a10725] transition cursor-pointer">
          Book Dit GoPro Nu
        </NuxtLink>
      </div>
    </div>
  </section>

  <!-- FAQ Section -->
  <section class="bg-white py-16 ">
    <h2 class="text-2xl md:text-3xl font-bold text-center mb-12">Frequently asked <span class="text-[#B8082A]">questions.</span></h2>
    <div class="flex flex-col md:flex-row gap-4 md:gap-10 justify-center items-center mx-auto mb-10 px-4">
      <UAccordion class = "!w-full md:!w-64" :items="[items[0]]" :ui="{ ...ui, item: ui.item + '  min-h-[100px] py-1 border-b-2 border-[#B8082A] !border-b-2 !border-[#B8082A]' }" />
      <UAccordion class = "!w-full md:!w-64" :items="[items[1]]" :ui="{ ...ui, item: ui.item + '  min-h-[100px] py-1 border-b-2 border-[#B8082A] !border-b-2 !border-[#B8082A]' }" />
      <UAccordion class = "!w-full md:!w-64" :items="[items[2]]" :ui="{ ...ui, item: ui.item + '  min-h-[100px] py-1 border-b-2 border-[#B8082A] !border-b-2 !border-[#B8082A]' }" />
      <UAccordion class = "!w-full md:!w-64" :items="[items[3]]" :ui="{ ...ui, item: ui.item + '  min-h-[100px] py-1 border-b-2 border-[#B8082A] !border-b-2 !border-[#B8082A]' }" />
    </div>
    <div class="flex justify-center">
      <NuxtLink to="/faq" class="bg-[#B8082A] text-white font-semibold py-3 px-8 rounded-full shadow-lg hover:bg-[#a10725] transition">Læs mere</NuxtLink>
    </div>
  </section>

  <!-- Footer -->
  <Footer />

</template>
<script setup lang="ts">
import { ref } from 'vue';
import ProductCard from '../components/ProductCard.vue';

// SEO Meta Tags
useSeoMeta({
  title: 'Lej GoPro Kamera Online - Professionel Actionkamera Udlejning | LejGoPro',
  description: 'Lej et professionelt GoPro actionkamera til dit næste eventyr. Gratis levering i Danmark, konkurrencedygtige priser og komplet udstyr. Book nemt online.',
  keywords: 'gopro leje, actionkamera udlejning, gopro rental danmark, leje gopro hero, actionkamera til rejse, eventyr kamera',
  author: 'LejGoPro',
  robots: 'index, follow',
  
  // Open Graph tags for social media
  ogTitle: 'Lej GoPro Kamera Online - Professionel Actionkamera Udlejning',
  ogDescription: 'Lej et professionelt GoPro actionkamera til dit næste eventyr. Gratis levering i Danmark og komplet udstyr.',
  ogType: 'website',
  ogUrl: 'https://lejgopro.dk',
  ogImage: 'https://lejgopro.dk/hero-bg/federico-persiani-XvPuZ2Q71GA-unsplash.jpg',
  
  // Twitter Card tags
  twitterCard: 'summary_large_image',
  twitterTitle: 'Lej GoPro Kamera Online - LejGoPro',
  twitterDescription: 'Professionel GoPro actionkamera udlejning med gratis levering i Danmark.',
  twitterImage: 'https://lejgopro.dk/hero-bg/federico-persiani-XvPuZ2Q71GA-unsplash.jpg',
  
  // Additional SEO
  viewport: 'width=device-width, initial-scale=1',
  charset: 'utf-8'
})

// Define the product interface to match Supabase table structure
interface Product {
  id: number;
  name: string;
  features: string;
  dailyPrice: number;
  weeklyPrice: number;
  twoWeekPrice?: number;
  quantity: number;
  imageUrl?: string;
}

// Reactive state
const products = ref<Product[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const placeholderImage = 'https://static.gopro.com/assets/blta2b8522e5372af40/blt6ff9ada3eca94bbc/643ee100b1f4db27b0203e9d/pdp-h10-image01-1920-2x.png';

// Get Supabase client
const supabase = useSupabase();

// Fetch products from Supabase
const fetchProducts = async () => {
  try {
    loading.value = true;
    error.value = null;
    
    if (!supabase) {
      throw new Error('Supabase client ikke tilgængelig');
    }
    
    const { data, error: supabaseError } = await supabase
      .from('Product')
      .select('*')
      .order('id', { ascending: true });
    
    if (supabaseError) {
      throw supabaseError;
    }
    
    console.log('Raw products data from Supabase:', data);
    
    // Use the data directly as it matches our interface
    products.value = data || [];
    
    console.log('Products:', products.value);
    console.log('First product dailyPrice:', products.value[0]?.dailyPrice);
    console.log('First product weeklyPrice:', products.value[0]?.weeklyPrice);
    console.log('Products length:', products.value.length);
  } catch (err: any) {
    error.value = err.message || 'Der opstod en fejl ved indlæsning af produkter';
    console.error('Error fetching products:', err);
  } finally {
    loading.value = false;
  }
};

// Fetch products on component mount
onMounted(() => {
  fetchProducts();
});

import type { AccordionItem } from '@nuxt/ui'

const items = ref<AccordionItem[]>([
  {
    label: 'Hvad er den korteste lejeperiode?',
    content: '3 dage'
  },
  {
    label: 'Hvordan og hvornår skal man betale?',
    content: 'Betaling sker online via vores sikre betalingsløsning under checkout processen. Du kan betale med kort (Visa, Mastercard, osv.). Beløbet trækkes med det samme når din booking bekræftes, og du modtager en kvittering på email.'
  },
  {
    label: 'Hvor længe holder et GoPro strøm?',
    content: 'Et GoPro holder typisk 1-2 timer afhængigt af brug og model. Med ekstra batterier kan du forlænge tiden.'
  },
  {
    label: 'Er kameraet forsikret?',
    content: 'Det er på nuværende tidspunkt ikke muligt at tilkøbe forsikring hos os. Du er i de fleste tilfælde dækket igennem din egen indboforsikring – vi opfordrer til at snakke med dit forsikringsselskab inden du lejer. Hvis kameraet går i stykker, hæfter du for hele værdien til LejGoPro.'
  }
])

const ui = {
  item: 'bg-white border border-gray-200 rounded-xl font-medium text-black hover:border-[#B8082A] transition flex flex-col items-center justify-center text-center',
  leadingIcon: 'mb-2 text-[#B8082A]',
  trigger: 'flex justify-center items-center px-4 w-full h-full min-h-[100px] cursor-pointer',
  content: 'p-2 text-gray-700 text-center flex flex-col items-center justify-center'
}

</script>

<style scoped>
/* Removed unused hero-bg CSS since we're using NuxtPicture component */
</style>

