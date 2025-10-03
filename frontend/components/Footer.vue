<template>
  <footer class="bg-[#161e2e] text-white py-12">
    <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 px-8">
      <!-- Brand & Social -->
      <div>
        <div class="flex items-center gap-2 mb-2">
          <span class="inline-block align-middle">
            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" style="vertical-align: middle;"><path fill="#fff" d="M11.5 8C14 8 16 10 16 12.5S14 17 11.5 17S7 15 7 12.5S9 8 11.5 8m0 1A3.5 3.5 0 0 0 8 12.5a3.5 3.5 0 0 0 3.5 3.5a3.5 3.5 0 0 0 3.5-3.5A3.5 3.5 0 0 0 11.5 9M5 5h2l2-2h5l2 2h2a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3m4.41-1l-2 2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-2.41l-2-2z"/></svg>
          </span>
          <span class="font-bold text-lg">LejGoPro</span>
        </div>
        <p class="text-sm text-gray-300 mb-4">Danmarks førende platform for GoPro udlejning til eventyrere og rejsende.</p>
        <div class="flex gap-4 text-xl">
          <NuxtLink to="#" aria-label="Facebook" class="hover:text-gray-400"><i class="fab fa-facebook"></i></NuxtLink>
          <NuxtLink to="#" aria-label="Instagram" class="hover:text-gray-400"><i class="fab fa-instagram"></i></NuxtLink>
          <NuxtLink to="#" aria-label="Twitter" class="hover:text-gray-400"><i class="fab fa-twitter"></i></NuxtLink>
        </div>
      </div>
      <!-- Quick Links -->
      <div>
        <h3 class="font-bold mb-4">Hurtige Links</h3>
        <ul class="space-y-2 text-gray-300">
          <li><NuxtLink to="/products" class="hover:text-white">Produkter</NuxtLink></li>
          <li><NuxtLink to="#" class="hover:text-white">Hvorfor leje?</NuxtLink></li>
          <li><NuxtLink to="/kontakt" class="hover:text-white">Kontakt Os</NuxtLink></li>
          <li><NuxtLink to="/faq" class="hover:text-white">Booking</NuxtLink></li>
          <li><NuxtLink to="/faq" class="hover:text-white">FAQ</NuxtLink></li>
        </ul>
      </div>
      <!-- Social Media & Reviews -->
      <div>
        <h3 class="font-bold mb-4">Sociale Medier</h3>
        <div class="space-y-4">
          <!-- Social Media Links -->
          <div class="flex flex-col space-y-2">
            <a href="https://www.facebook.com" target="_blank" rel="noopener" class="text-gray-300 hover:text-white transition-colors">
              <span>Facebook</span>
            </a>
            <a href="https://www.instagram.com" target="_blank" rel="noopener" class="text-gray-300 hover:text-white transition-colors">
              <span>Instagram</span>
            </a>
          </div>
          
          <!-- Trustpilot Widget -->
          <div class="mt-4">
            <div class="trustpilot-widget" data-locale="da-DK" data-template-id="56278e9abfbbba0bdcd568bc" data-businessunit-id="62240c648bfea00299062db0" data-style-height="52px" data-style-width="100%" data-token="a92258cd-5460-4ed9-be3b-a6d11ed9b1d9">
              <a href="https://dk.trustpilot.com/review/lejgopro.dk" target="_blank" rel="noopener">Trustpilot</a>
            </div>
          </div>
        </div>
      </div>
      <!-- Contact -->
      <div>
        <h3 class="font-bold mb-4">Kontakt Os</h3>
        <ul class="space-y-2 text-gray-300">
          <li><i class="fas fa-phone mr-2"></i> +45 53 80 59 54</li>
          <li><i class="fas fa-envelope mr-2"></i> kontakt@lejgopro.dk</li>
          <li><i class="fas fa-map-marker-alt mr-2"></i> København, Danmark</li>
        </ul>
        <div class="bg-[#1e293b] rounded-lg p-4 mt-4 text-sm">
          <div class="font-bold mb-1">Åbningstider:</div>
          <div>Man-Fre: 09:00-18:00</div>
          <div>Lør-Søn: 10:00-16:00</div>
        </div>
      </div>
    </div>
    <div class="border-t border-gray-700 mt-12 pt-6 text-xs text-gray-400 flex flex-col md:flex-row justify-between items-center px-8">
      <div>© 2024 GoProUdlejning.dk. Alle rettigheder forbeholdes.</div>
      <div class="flex gap-6 mt-2 md:mt-0">
        <NuxtLink to="#" class="hover:text-white">Privatlivspolitik</NuxtLink>
        <NuxtLink to="/handelsbetingelser" class="hover:text-white">Handelsbetingelser</NuxtLink>
        <NuxtLink to="#" class="hover:text-white">Cookies</NuxtLink>
      </div>
    </div>
  </footer>
</template>
