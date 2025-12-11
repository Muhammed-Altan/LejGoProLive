<template>
	<div class="bg-white rounded-xl p-4 border border-gray-200">
		<div class="mb-4">
			<h3 class="font-semibold text-lg mb-2">Vælg leveringsmetode</h3>
			<div class="flex gap-4">
				<button
					type="button"
					@click="store.setDeliveryMethod('home')"
					:class="[
						'flex-1 py-3 px-4 rounded-lg border-2 transition-all',
						store.deliveryMethod === 'home'
							? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
							: 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
					]"
				>
					🏠 Hjemlevering
				</button>
				<button
					type="button"
					@click="store.setDeliveryMethod('servicepoint')"
					:class="[
						'flex-1 py-3 px-4 rounded-lg border-2 transition-all',
						store.deliveryMethod === 'servicepoint'
							? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
							: 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
					]"
				>
					📦 Afhentningssted
				</button>
			</div>
		</div>

		<div v-if="store.deliveryMethod === 'servicepoint'">
			<div v-if="loading" class="text-center py-8 text-gray-600">
				<div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
				<p>Henter afhentningssteder...</p>
			</div>

			<div v-else-if="error" class="bg-red-50 text-red-700 p-4 rounded-lg">
				{{ error }}
			</div>

			<div v-else-if="servicePoints.length === 0" class="text-center py-8 text-gray-500">
				Ingen afhentningssteder fundet for dit postnummer.
			</div>

			<div v-else>
				<p class="text-sm text-gray-600 mb-3">
					{{ servicePoints.length }} afhentningssteder nær dig
				</p>
				
				<div class="space-y-3 max-h-[500px] overflow-y-auto pr-2">
					<div
						v-for="point in servicePoints"
						:key="point.id"
						@click="selectServicePoint(point)"
						:class="[
							'border rounded-lg p-4 cursor-pointer transition-all',
							store.selectedServicePoint?.id === point.id
								? 'border-blue-500 bg-blue-50'
								: 'border-gray-300 hover:border-blue-300 hover:bg-gray-50'
						]"
					>
						<div class="flex justify-between items-start">
							<div class="flex-1">
								<h4 class="font-semibold text-gray-900">{{ point.name }}</h4>
								<p class="text-sm text-gray-600 mt-1">
									{{ point.address.street }} {{ point.address.streetNumber }}
								</p>
								<p class="text-sm text-gray-600">
									{{ point.address.postalCode }} {{ point.address.city }}
								</p>
								<p class="text-xs text-gray-500 mt-2">
									📍 {{ formatDistance(point.distance) }}
								</p>
							</div>
							<div
								v-if="store.selectedServicePoint?.id === point.id"
								class="text-blue-500 ml-4"
							>
								✓
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { useCheckoutStore } from '@/stores/checkout'
import { usePostNord } from '@/composables/usePostNord'
import { watch } from 'vue'

const props = defineProps<{
	postalCode: string
	city?: string
	address?: string
}>()

const store = useCheckoutStore()
const { servicePoints, loading, error, fetchServicePoints } = usePostNord()

// Parse street name and number from address
const parseAddress = (address: string) => {
	if (!address) return { streetName: '', streetNumber: '' }
	
	// Try to extract street number (last set of digits/letters)
	const match = address.match(/^(.+?)\s+(\d+[a-zA-Z]*)$/)
	if (match) {
		return {
			streetName: match[1].trim(),
			streetNumber: match[2].trim()
		}
	}
	
	// If no number found, return the whole address as street name
	return {
		streetName: address.trim(),
		streetNumber: ''
	}
}

// Fetch service points when postal code, city, or address changes
watch(
	() => [props.postalCode, props.city, props.address],
	([newPostalCode, newCity, newAddress]) => {
		if (newPostalCode && /^\d{4}$/.test(newPostalCode as string)) {
			const { streetName, streetNumber } = parseAddress(newAddress as string || '')
			
			fetchServicePoints({
				postalCode: newPostalCode as string,
				city: newCity as string,
				streetName,
				streetNumber
			})
		}
	},
	{ immediate: true }
)

const selectServicePoint = (point: any) => {
	store.setSelectedServicePoint(point)
}

const formatDistance = (meters: number): string => {
	if (meters < 1000) {
		return `${Math.round(meters)} m`
	}
	return `${(meters / 1000).toFixed(1)} km`
}
</script>
