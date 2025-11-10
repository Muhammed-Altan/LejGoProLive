<template>
    <Header />
    <!-- Section 1: Kontakt os and contact cards -->
    <section class="bg-gray-100 py-10">
        <div class="max-w-3xl mx-auto text-center mb-12">
            <h2 class="text-3xl font-bold mb-2">Kontakt os</h2>
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
            <h3 class="text-2xl font-bold mb-8">Kontakt Os — <span class="text-[#B8082A]">Dit Eventyr</span> Begynder Her</h3>
            <div class="py-8 rounded-xl">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-10 px-6 mb-8">
                <NuxtImg src="/eventyr/filip-lP5bWEhf4nA-unsplash.jpg" alt="Filip adventure" class="rounded-xl object-cover w-full h-96" width="400" height="384" format="webp" quality="80" loading="lazy" />
                <NuxtImg src="/eventyr/GoPro-MountainTop.jpg" alt="GoPro adventure" class="rounded-xl object-cover w-full h-96" width="400" height="384" format="webp" quality="80" loading="lazy" />
                <NuxtImg src="/eventyr/GoPro-Skiing.png" alt="GoPro adventure 2" class="rounded-xl object-cover w-full h-96" width="400" height="384" format="webp" quality="80" loading="lazy" />
                </div>
                <NuxtLink to="/checkout" class="bg-[#B8082A] text-white font-semibold py-2 px-6 rounded shadow hover:bg-[#a10725] transition cursor-pointer">Begynd dit eventyr her</NuxtLink>
            </div>
        </div>
    </section>
    <Footer />
</template>

