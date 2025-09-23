
<template>
	<article class="w-full max-w-2xl mx-auto">
		<h1 class="font-semibold text-lg">Betaling</h1>
		<h2 class="font-medium text-base">Vælg betaling metode</h2>
	</article>
		<div class="bg-[#eef5ff] rounded-xl p-6 w-full max-w-2xl mx-auto">
			<!-- Kreditkort Collapsible -->
				<div class="mb-2">
					<button
						class="w-full flex items-center px-0 py-0 rounded-t-xl focus:outline-none transition"
						:class="openCollapse === 'creditcard' ? '' : 'bg-white border border-[#eaf1fa] border-b-0'"
						style="min-height:80px"
						@click="toggleCollapse('creditcard')"
						type="button"
					>
						<span class="flex items-center w-full h-20 px-4">
							<span class="w-10 h-10 mr-3 flex items-center justify-center">
								<span :class="openCollapse === 'creditcard' ? 'bg-white border-black' : 'bg-white border-[#eaf1fa]'" class="inline-block rounded-full border-8 w-10 h-10 flex items-center justify-center transition-colors">
									<span v-if="openCollapse === 'creditcard'" class="bg-white rounded-full w-5 h-5"></span>
									<span v-else class="bg-[#eaf1fa] rounded-full w-5 h-5"></span>
								</span>
							</span>
							<span class="text-xl font-medium text-black">Kreditkort</span>
						</span>
					</button>
					<div v-if="openCollapse === 'creditcard'" class="space-y-3 px-4 py-4 rounded-b-xl">
					<input
						type="text"
						placeholder="Navn på kort"
						class="w-full rounded-lg px-4 py-3 bg-white text-base focus:outline-none focus:ring-2 focus:ring-blue-200"
					/>
					<input
						type="text"
						placeholder="Kortnummer"
						class="w-full rounded-lg px-4 py-3 bg-white text-base focus:outline-none focus:ring-2 focus:ring-blue-200"
					/>
					<div class="flex gap-3">
						<input
							type="text"
							placeholder="Udløbsdato (MM/ÅÅ)"
							class="flex-1 rounded-lg px-4 py-3 bg-white text-base focus:outline-none focus:ring-2 focus:ring-blue-200"
						/>
						<input
							type="text"
							placeholder="Sikkerhedskode"
							class="flex-1 rounded-lg px-4 py-3 bg-white text-base focus:outline-none focus:ring-2 focus:ring-blue-200"
						/>
					</div>
				</div>
			</div>
			<!-- MobilPay Collapsible -->
				<div class="mb-2">
					<button
						class="w-full flex items-center px-0 py-0 focus:outline-none transition"
						:class="openCollapse === 'mobilpay' ? '' : 'bg-white border border-[#eaf1fa] border-b-0'"
						style="min-height:80px"
						@click="toggleCollapse('mobilpay')"
						type="button"
					>
						<span class="flex items-center w-full h-20 px-4">
							<span class="w-10 h-10 mr-3 flex items-center justify-center">
								<span :class="openCollapse === 'mobilpay' ? 'bg-white border-black' : 'bg-white border-[#eaf1fa]'" class="inline-block rounded-full border-8 w-10 h-10 flex items-center justify-center transition-colors">
									<span v-if="openCollapse === 'mobilpay'" class="bg-white rounded-full w-5 h-5"></span>
									<span v-else class="bg-[#eaf1fa] rounded-full w-5 h-5"></span>
								</span>
							</span>
							<span class="text-xl font-medium text-black">MobilPay</span>
						</span>
					</button>
					<div v-if="openCollapse === 'mobilpay'" class="px-4 py-4 rounded-b-xl">
					<div class="bg-gray-100 rounded-lg p-4 text-center text-gray-500">Coming Soon</div>
				</div>
			</div>
			<!-- GooglePay Collapsible -->
				<div>
					<button
						class="w-full flex items-center px-0 py-0 focus:outline-none transition rounded-b-xl"
						:class="openCollapse === 'googlepay' ? '' : 'bg-white border border-[#eaf1fa]'"
						style="min-height:80px"
						@click="toggleCollapse('googlepay')"
						type="button"
					>
						<span class="flex items-center w-full h-20 px-4">
							<span class="w-10 h-10 mr-3 flex items-center justify-center">
								<span :class="openCollapse === 'googlepay' ? 'bg-white border-black' : 'bg-white border-[#eaf1fa]'" class="inline-block rounded-full border-8 w-10 h-10 flex items-center justify-center transition-colors">
									<span v-if="openCollapse === 'googlepay'" class="bg-white rounded-full w-5 h-5"></span>
									<span v-else class="bg-[#eaf1fa] rounded-full w-5 h-5"></span>
								</span>
							</span>
							<span class="text-xl font-medium text-black">GooglePay</span>
						</span>
					</button>
					<div v-if="openCollapse === 'googlepay'" class="px-4 py-4 rounded-b-xl">
					<div class="bg-gray-100 rounded-lg p-4 text-center text-gray-500">Coming Soon</div>
				</div>
			</div>
		</div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
const openCollapse = ref('creditcard');

function toggleCollapse(method: string) {
	openCollapse.value = openCollapse.value === method ? '' : method;
}
</script>

<style scoped>
* {
	color: black !important;
}

</style>