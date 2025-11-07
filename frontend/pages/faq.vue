<template>
<Header />
<section class="max-w-5xl mx-auto py-16">
  <h1 class="text-3xl md:text-4xl font-bold text-center mb-8">FAQ</h1>
  <div class="text-lg text-gray-700 max-w-2xl mx-auto mb-8">
    <p>Her finder du svar på de mest stillede spørgsmål om GoPro leje, betaling, levering og forsikring. Kontakt os hvis du har andre spørgsmål!</p>
  </div>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
    <div v-for="(item, i) in items" :key="i" class="w-full h-full cursor-pointer" @click="openIndex = openIndex === i ? -1 : i">
      <UAccordion
        :items="[item]"
        :open="openIndex === i"
        :ui="{ ...ui, item: ui.item + ' w-full h-full min-h-full py-1 px-6 border-b-2 border-[#B8082A] !border-b-2 !border-[#B8082A] cursor-pointer' }"
      />
    </div>
  </div>
</section>
</template>

<script setup>
import { ref } from 'vue'

const items = ref([
  {
    label: 'Hvad er den korteste lejeperiode?',
    icon: 'i-lucide-calendar',
    content: '3 dage'
  },
  {
    label: 'Hvordan og hvornår skal man betale?',
    icon: 'i-lucide-credit-card',
    content: 'Betaling sker online via vores sikre betalingsløsning under checkout processen. Du kan betale med kort (Visa, Mastercard, osv.). Beløbet trækkes med det samme når din booking bekræftes, og du modtager en kvittering på email.'
  },
  {
    label: 'Hvorfor udlejer i kun GoPro Hero 10?',
    icon: 'i-lucide-star',
    content: 'Vi udlejer kun det bedste produkt på markedet. Sådan sikrer vi os, at alle får den bedste oplevelse med de bedste optagelser.'
  },
  {
    label: 'Hvor længe holder et GoPro strøm?',
    icon: 'i-lucide-battery-charging',
    content: 'Et GoPro kan optage i cirka 2-3 timer, før batteriet skal oplades eller udskiftes. Du kan tilføje et ekstra batteri for blot 49,- kr.'
  },
  {
    label: 'Hvor lang tid tager det at oplade et GoPro?',
    icon: 'i-lucide-clock',
    content: 'Cirka 2 timer'
  },
  {
    label: 'Er kameraet forsikret?',
    icon: 'i-lucide-shield',
    content: 'Det er på nuværende tidspunkt ikke muligt at tilkøbe forsikring hos os. Du er i de fleste tilfælde dækket igennem din egen indboforsikring – vi opfordrer til at snakke med dit forsikringsselskab inden du lejer. Hvis kameraet går i stykker, hæfter du for hele værdien til LejGoPro.'
  },
  {
    label: 'Kan jeg få kameraet leveret direkte til døren?',
    icon: 'i-lucide-truck',
    content: 'Ja, det kan du. Hvis du ønsker direkte levering til døren bedes du kontakte os inden for mulighed og pris.'
  },
  {
    label: 'Kan jeg bruge kameraet uden download af app?',
    icon: 'i-lucide-smartphone',
    content: 'Ja, Kameraet bliver sendt som en ”plug & play” løsning. Du kan bruge kameraet fra modtagelsen og ved hjælp af det medfølgende stik kan du nemt og hurtigt overføre alle dine fede billeder og videoer til din computer.'
  },
  {
    label: 'Hvad skal jeg gøre når jeg er færdig med at bruge kameraet?',
    icon: 'i-lucide-upload',
    content: 'Når du er færdig med at overføre alle dine store øjeblikke til din computer, skal du huske at slette alle billeder på kameraet inden du sender det retur. I tilfælde af at du glemmer dette bedes du kontakte os med det samme.'
  }
])

const openIndex = ref(-1)

const ui = {
  item: 'bg-white border border-gray-200 rounded-xl font-medium text-black hover:border-[#B8082A] transition flex flex-col items-center justify-center text-center',
  leadingIcon: 'mb-2 text-[#B8082A]',
  trigger: 'flex justify-center items-center w-full h-full cursor-pointer',
  content: 'py-2 text-gray-700 text-center flex flex-col items-center justify-center w-full'
}

</script>

