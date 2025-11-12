<template>
    <Header />
    <!-- Section 1: Kontakt os and contact cards -->
    <section class="bg-gray-100 py-10">
        <div class="max-w-3xl mx-auto text-center mb-12">
            <h1 class="text-3xl font-bold mb-2">Kontakt os</h1>
            <p class="text-lg mb-6">I tvivl om hvilket GoPro der passer dit eventyr? Ring eller skriv til os - så guider vi dig til det rigtige valg</p>
            <div class="flex flex-col md:flex-row justify-center gap-8 mb-8">
                <div class="flex flex-col items-center justify-center bg-white rounded-xl shadow p-8 border-2 border-[#B8082A] flex-1 text-center min-h-[120px]">
                <span class="font-semibold text-xl">+45 53 80 59 54</span>
                </div>
                <div class="flex flex-col items-center justify-center bg-white rounded-xl shadow p-8 border-2 border-[#B8082A] flex-1 text-center min-h-[120px]">
                <span class="font-semibold text-xl">kontakt@lejgopro.dk</span>
                </div>
            </div>
        </div>
    </section>
    <!-- Section 2: Eventyr and images -->
    <section class="py-10 bg-white">
        <div class="max-w-4xl mx-auto text-center mb-8">
            <h2 class="text-2xl font-bold mb-8">Kontakt Os — <span class="text-[#B8082A]">Dit Eventyr</span> Begynder Her</h2>
            <div class="py-8 rounded-xl">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-10 px-6 mb-8">
                <NuxtImg src="/eventyr/filip-lP5bWEhf4nA-unsplash.jpg" alt="GoPro eventyr på bjerget - fantastisk actionkamera optagelse til ferie og sport" class="rounded-xl object-cover w-full h-96" width="400" height="384" format="webp" quality="80" loading="lazy" />
                <NuxtImg src="/eventyr/GoPro-MountainTop.jpg" alt="GoPro på bjergtoppen - ekstremt actionkamera til bjergbestigning og outdoor eventyr" class="rounded-xl object-cover w-full h-96" width="400" height="384" format="webp" quality="80" loading="lazy" />
                <NuxtImg src="/eventyr/GoPro-Skiing.png" alt="GoPro til skiløb og vintersport - perfekt actionkamera leje til skiferie og snow aktiviteter" class="rounded-xl object-cover w-full h-96" width="400" height="384" format="webp" quality="80" loading="lazy" />
                </div>
                <NuxtLink to="/checkout" class="bg-[#B8082A] text-white font-semibold py-2 px-6 rounded shadow hover:bg-[#a10725] transition cursor-pointer">Begynd dit eventyr her</NuxtLink>
            </div>
        </div>
    </section>
    <Footer />
</template>

<script setup>
import Header from '@/components/Header.vue'
import Footer from '@/components/Footer.vue'

// SEO Meta Tags
useSeoMeta({
  title: 'Kontakt LejGoPro - Spørgsmål om GoPro Leje & Booking | LejGoPro',
  description: 'Har du spørgsmål om GoPro leje? Kontakt os på +45 53 80 59 54 eller kontakt@lejgopro.dk. Vi hjælper dig med at finde det rigtige actionkamera.',
  keywords: 'kontakt lejgopro, gopro leje hjælp, actionkamera rådgivning, booking support, telefon email',
  robots: 'index, follow',
  
  // Open Graph
  ogTitle: 'Kontakt LejGoPro - Spørgsmål om GoPro Leje & Booking',
  ogDescription: 'Kontakt os for hjælp med GoPro leje og booking. Telefon: +45 53 80 59 54 eller email: kontakt@lejgopro.dk',
  ogType: 'website',
  ogUrl: 'https://lejgopro.dk/kontakt',
  
  // Twitter Card
  twitterCard: 'summary',
  twitterTitle: 'Kontakt LejGoPro - Spørgsmål & Support',
  twitterDescription: 'Kontakt os for hjælp med GoPro leje: +45 53 80 59 54 eller kontakt@lejgopro.dk'
})
</script>
