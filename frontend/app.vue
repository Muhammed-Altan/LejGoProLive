<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>

<script setup>
// Business Schema for SEO and local search
useHead({
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: 'LejGoPro',
        description: 'Professionel GoPro actionkamera udlejning i Danmark. Lej GoPro Hero kameraer med komplet tilbehør til eventyr, sport og rejser.',
        url: 'https://lejgopro.dk',
        telephone: '+4553805954',
        email: 'kontakt@lejgopro.dk',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'København', // UPDATE: Add your city
          addressCountry: 'DK'
          // TODO: Add streetAddress and postalCode when available
        },
        priceRange: '$$',
        areaServed: {
          '@type': 'Country',
          name: 'Denmark'
        },
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'GoPro Udlejning',
          itemListElement: [
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Product',
                name: 'GoPro Hero Actionkamera'
              }
            }
          ]
        }
        // TODO: Add openingHoursSpecification when business hours are confirmed
        // openingHoursSpecification: [
        //   {
        //     '@type': 'OpeningHoursSpecification',
        //     dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        //     opens: '09:00',
        //     closes: '17:00'
        //   }
        // ]
      })
    }
  ]
})
</script>