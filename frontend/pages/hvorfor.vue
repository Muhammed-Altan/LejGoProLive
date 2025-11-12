<template>
	<Header />
	<section class="bg-gray-100 py-12">
		<div class="max-w-3xl mx-auto text-center">
			<h1 class="text-3xl font-bold mb-4">Hvorfor leje fremfor køb?</h1>
			<p class="text-lg mb-8">Med et lejet GoPro-kamera er du sikret fantastiske optagelser på din ferie, uden at skulle investere i dyrt udstyr, som kun bruges få gange om året.</p>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
				<div class="bg-white rounded-xl shadow p-6">
					<h2 class="font-semibold text-xl mb-2 text-[#B8082A]">Økonomisk Fordel</h2>
					<ul class="list-disc ml-6 text-gray-700">
						<li>Du undgår en stor engangsudgift – betal kun for den periode du bruger kameraet.</li>
						<li>Ingen bekymring for værditab eller forældet teknologi.</li>
					</ul>
				</div>
				<div class="bg-white rounded-xl shadow p-6">
					<h2 class="font-semibold text-xl mb-2 text-[#B8082A]">Miljø & Bæredygtighed</h2>
					<ul class="list-disc ml-6 text-gray-700">
						<li>Reducer elektronikaffald ved at dele udstyr med andre.</li>
						<li>Leje fremmer genbrug og mindsker overforbrug.</li>
					</ul>
				</div>
				<div class="bg-white rounded-xl shadow p-6">
					<h2 class="font-semibold text-xl mb-2 text-[#B8082A]">Bekvemmelighed</h2>
					<ul class="list-disc ml-6 text-gray-700">
						<li>Gratis levering og retur i hele Danmark.</li>
						<li>Du får altid et opdateret og klargjort kamera – ingen vedligeholdelse.</li>
					</ul>
				</div>
				<div class="bg-white rounded-xl shadow p-6">
					<h2 class="font-semibold text-xl mb-2 text-[#B8082A]">Fleksibilitet</h2>
					<ul class="list-disc ml-6 text-gray-700">
						<li>Lej kun det udstyr du har brug for – tilpasset dit eventyr.</li>
						<li>Mulighed for at tilføje tilbehør og ekstraudstyr efter behov.</li>
					</ul>
				</div>
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
  title: 'Hvorfor Leje GoPro i Stedet for at Købe? Fordele & Besparelser | LejGoPro',
  description: 'Opdag fordelene ved at leje GoPro frem for køb: Spar penge, beskyt miljøet og få gratis levering. Perfekt til ferie og eventyr uden store investeringer.',
  keywords: 'hvorfor leje gopro, gopro leje fordele, spare penge actionkamera, miljøvenlig udlejning, ferie kamera leje',
  robots: 'index, follow',
  
  // Open Graph
  ogTitle: 'Hvorfor Leje GoPro i Stedet for at Købe? Fordele & Besparelser',
  ogDescription: 'Lær hvorfor det er smartere at leje GoPro: Spar penge, beskyt miljøet og få professionelt udstyr uden store investeringer.',
  ogType: 'article',
  ogUrl: 'https://lejgopro.dk/hvorfor',
  
  // Twitter Card
  twitterCard: 'summary',
  twitterTitle: 'Hvorfor Leje GoPro? Fordele & Besparelser - LejGoPro',
  twitterDescription: 'Opdag fordelene ved GoPro leje: Økonomi, miljø, bekvemmelighed og fleksibilitet.'
})
</script>