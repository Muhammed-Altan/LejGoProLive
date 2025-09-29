

<template>
	<div class="flex flex-col items-center justify-center min-h-[160px] bg-white w-full max-w-2xl mx-auto">
		<div class="flex flex-row items-center w-full px-6 py-4 mb-4">
			<input
				id="acceptTerms"
				type="checkbox"
				v-model="accepted"
				class="form-checkbox h-5 w-5 text-[#B90C2C] focus:ring-[#B90C2C] border-gray-300 rounded mr-3"
				:disabled="true"
			/>
			<label
				for="acceptTerms"
				class="text-base text-gray-800 select-none cursor-pointer"
				@click="openModal"
			>
				Jeg accepterer
				<span class="text-[#B90C2C] underline hover:text-[#a10a25]">lejebetingelserne</span>
			</label>
		</div>
		<button
			:disabled="!canBook"
			@click="bookNow"
			class="w-full bg-[#B90C2C] hover:bg-[#a10a25] text-white text-lg font-semibold py-3 rounded-b-lg focus:outline-none transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
		>
			Betal Nu
		</button>

		<!-- Modal -->
		<div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
			<div class="bg-white rounded-lg shadow-lg w-full max-w-lg flex flex-col max-h-[80vh] relative">
				<div class="px-6 pt-6 pb-2 text-xl font-semibold border-b">Lejebetingelser</div>
				<div
					ref="modalContent"
					class="overflow-y-auto px-6 py-4 text-gray-700 flex-1"
					style="max-height: 50vh;"
					@scroll="handleScroll"
				>
					<p>
						Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque euismod, urna eu tincidunt consectetur, nisi nisl aliquam nunc, eget aliquam massa nisl quis neque. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Etiam nec facilisis urna. Suspendisse potenti. Mauris euismod, sapien eu commodo cursus, enim erat dictum erat, nec dictum erat erat eu erat. Sed euismod, sapien eu commodo cursus, enim erat dictum erat, nec dictum erat erat eu erat. Pellentesque euismod, urna eu tincidunt consectetur, nisi nisl aliquam nunc, eget aliquam massa nisl quis neque. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Etiam nec facilisis urna. Suspendisse potenti. Mauris euismod, sapien eu commodo cursus, enim erat dictum erat, nec dictum erat erat eu erat. Sed euismod, sapien eu commodo cursus, enim erat dictum erat, nec dictum erat erat eu erat. Pellentesque euismod, urna eu tincidunt consectetur, nisi nisl aliquam nunc, eget aliquam massa nisl quis neque. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Etiam nec facilisis urna. Suspendisse potenti. Mauris euismod, sapien eu commodo cursus, enim erat dictum erat, nec dictum erat erat eu erat. Sed euismod, sapien eu commodo cursus, enim erat dictum erat, nec dictum erat erat eu erat. Pellentesque euismod, urna eu tincidunt consectetur, nisi nisl aliquam nunc, eget aliquam massa nisl quis neque. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Etiam nec facilisis urna. Suspendisse potenti. Mauris euismod, sapien eu commodo cursus, enim erat dictum erat, nec dictum erat erat eu erat. Sed euismod, sapien eu commodo cursus, enim erat dictum erat, nec dictum erat erat eu erat.
					</p>
				</div>
				<div class="px-6 pb-6 pt-2 flex flex-col gap-2">
					<button
						class="w-full bg-[#B90C2C] hover:bg-[#a10a25] text-white font-semibold py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
						:disabled="!scrolledToBottom"
						@click="acceptTerms"
					>
						Jeg har læst og accepterer
					</button>
					<button class="w-full text-gray-500 hover:text-gray-700 py-2" @click="closeModal">Luk</button>
				</div>
			</div>
		</div>
	</div>
</template>


<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { useCheckoutStore } from '@/stores/checkout';

const accepted = ref(false);
const showModal = ref(false);
const scrolledToBottom = ref(false);
const modalContent = ref(null);
const toast = useToast();

let store;
if (process.client) {
	store = useCheckoutStore();
} else {
	// fallback for SSR, use empty/defaults
	store = {
		startDate: null,
		endDate: null,
		productId: null,
	};
}

const canBook = computed(() => !!accepted.value && !!store.startDate && !!store.endDate);

function openModal() {
	showModal.value = true;
	scrolledToBottom.value = false;
	nextTick(() => {
		if (modalContent.value) {
			modalContent.value.scrollTop = 0;
		}
	});
}

function closeModal() {
	showModal.value = false;
}

function handleScroll() {
	const el = modalContent.value;
	if (!el) return;
	// Allow a small threshold for bottom
	if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) {
		scrolledToBottom.value = true;
	}
}

function acceptTerms() {
	accepted.value = true;
	closeModal();
}

async function bookNow() {
	if (!store.startDate || !store.endDate) return;
	try {
		const productId = (store.getFirstProductId && store.getFirstProductId()) || store.productId || 1;
		const { $config } = useNuxtApp();
		const base = ($config?.public?.apiBase) || 'http://localhost:3001';
		const bookingData = {
			productId,
			startDate: store.startDate,
			endDate: store.endDate,
			fullName: store.fullName,
			phone: store.phone,
			email: store.email,
			address: store.address,
			apartment: store.apartment,
			postalCode: store.postalCode,
			city: store.city,
			accessoryIds: store.selectedAccessories ? store.selectedAccessories.map(a => a.instanceId) : [],
			totalPrice: store.backendTotal || 0
		};
		const res = await fetch(`${base}/bookings/by-product`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(bookingData),
		});
		if (!res.ok) {
			const txt = await res.text();
			throw new Error(txt || 'Booking failed');
		}
		const data = await res.json();
		alert('Booking successful! ID: ' + data.id);
	} catch (e) {
		alert('Booking failed: ' + (e?.message ?? e));
		// Use the existing Supabase booking method from the store
// 		await store.saveBookingToSupabase();
// 		toast.add({ 
// 			title: 'Booking succesfuld!', 
// 			description: `Din booking ID: ${store.bookingId}`,
// 			color: 'success',
// 			ui: {
// 				title: 'text-gray-900 font-semibold',
// 				description: 'text-gray-700'
// 			}
// 		});
		
// 		// Optionally redirect to a success page or reset the form
// 		// navigateTo('/booking-success');
// 	} catch (e) {
// 		console.error('Booking error:', e);
// 		toast.add({ 
// 			title: 'Booking mislykkedes', 
// 			description: e?.message ?? 'Der opstod en fejl ved booking. Prøv igen.',
// 			color: 'error',
// 			ui: {
// 				title: 'text-gray-900 font-semibold',
// 				description: 'text-gray-700'
// 			}
// 		});
	}
}
</script>
