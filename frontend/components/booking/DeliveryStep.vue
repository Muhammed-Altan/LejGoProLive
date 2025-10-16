
<template>
	<form class="bg-white rounded-xl flex flex-col gap-4 max-w-2xl w-full mx-auto">
		<article>
			<h1 class="font-semibold text-lg">Levering</h1>
			<h2 class="font-medium text-base">Udfyld formularen nedenfor for at se Leveringsmetoder</h2>
		</article>
		<div class="flex flex-col md:flex-row gap-4">
			<div class="flex-1">
				<input
					type="text"
					v-model="fullName"
					id="fullName"
					@input="touchedFullName = true"
					placeholder="Indtast dit fulde navn"
					class="w-full px-4 py-3 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900 placeholder-gray-500"
					autocomplete="name"
				/>
			</div>
			<div class="flex-1 flex flex-col">
				<input
					type="tel"
					v-model="phone"
					placeholder="+45 12 34 56 78"
					id="phone"
					@input="handlePhoneInput"
					@focus="onPhoneFocus"
					@paste.prevent="onPhonePaste"
					:class="['w-full px-4 py-3 rounded-lg', (errors.phone && touchedPhone) ? 'bg-red-50 border border-red-300 focus:ring-red-400' : 'bg-gray-100 focus:ring-blue-400 text-gray-900 placeholder-gray-500']"
					autocomplete="tel"
				/>
				<p v-if="errors.phone && touchedPhone" class="mt-1 text-sm text-red-600">{{ errors.phone }}</p>
			</div>
		</div>
		<div>
			<input
				type="email"
				v-model="email"
				placeholder="din@email.com"
				id="email"
				@input="touchedEmail = true"
				:class="['w-full px-4 py-3 rounded-lg', (errors.email && touchedEmail) ? 'bg-red-50 border border-red-300 focus:ring-red-400' : 'bg-gray-100 focus:ring-blue-400 text-gray-900 placeholder-gray-500']"
				autocomplete="email"
			/>
			<p v-if="errors.email && touchedEmail" class="mt-1 text-sm text-red-600">{{ errors.email }}</p>
		</div>
		<input
			type="text"
			v-model="address"
			placeholder="Adresse"
			class="w-full px-4 py-3 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900 placeholder-gray-500"
			autocomplete="address-line1"
		/>
		<input
			type="text"
			v-model="apartment"
			placeholder="Lejlighed, etage osv. (Valgfri)"
			class="w-full px-4 py-3 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900 placeholder-gray-500"
			autocomplete="address-line2"
		/>
		<div class="flex flex-col md:flex-row gap-4">
			<input
				type="text"
				v-model="postalCode"
				placeholder="Postnummer"
				class="flex-1 px-4 py-3 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900 placeholder-gray-500"
				autocomplete="postal-code"
			/>
			<input
				type="text"
				v-model="city"
				placeholder="By"
				class="flex-1 px-4 py-3 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900 placeholder-gray-500"
				autocomplete="address-level2"
			/>
		</div>
		<!-- <div class="bg-blue-50 text-center text-gray-800 rounded-lg py-4 px-2 mt-2 text-base font-medium">
			Angiv din leveringsadresse for at se de tilgængelige leveringsmetoder
		</div> -->
	</form>
</template>

<script setup>
import { useCheckoutStore } from '@/stores/checkout';
import { watch, ref, computed, nextTick } from 'vue';
import DOMPurify from 'dompurify';

// Field name constants for type safety
const FIELD_FULL_NAME = 'fullName';
const FIELD_PHONE = 'phone';
const FIELD_EMAIL = 'email';
const FIELD_ADDRESS = 'address';
const FIELD_APARTMENT = 'apartment';
const FIELD_POSTAL_CODE = 'postalCode';
const FIELD_CITY = 'city';

const store = useCheckoutStore();

// Local refs for form fields, synced to store
const fullName = ref('');
const phone = ref('');
const email = ref('');
const address = ref('');
const apartment = ref('');
const postalCode = ref('');
const city = ref('');

// Error refs
const errors = ref({
	fullName: '',
	phone: '',
	email: '',
	address: '',
	postalCode: '',
	city: ''
});

// Touched flags to avoid showing validation before user interaction
const touchedFullName = ref(false)
const touchedPhone = ref(false)
const touchedEmail = ref(false)

// Sanitization helper using DOMPurify
function stripTags(input) {
	if (!input) return ''
	return String(input).replace(/<[^>]*>/g, '').trim()
}

function sanitizeInput(value) {
	// DOMPurify may not expose sanitize during SSR depending on how it's imported.
	// Only call DOMPurify.sanitize when running in the browser and the function exists.
	try {
		if (typeof window !== 'undefined' && DOMPurify && typeof DOMPurify.sanitize === 'function') {
			return DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
		}
	} catch (e) {
		// Fallthrough to safe fallback
	}
	return stripTags(value)
}

function isValidEmail(val) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
}
function isValidPhone(val) {
	return /^\+45\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{2}$/.test(val);
}
function isValidPostalCode(val) {
	return /^\d{4}$/.test(val);
}

function validateAndSync() {
	// Sanitize all inputs
	const n = sanitizeInput(fullName.value);
	const p = sanitizeInput(phone.value);
	const e = sanitizeInput(email.value);
	const a = sanitizeInput(address.value);
	const ap = sanitizeInput(apartment.value);
	const pc = sanitizeInput(postalCode.value);
	const c = sanitizeInput(city.value);

	// Reset errors
	errors.value = {
		fullName: '',
		phone: '',
		email: '',
		address: '',
		postalCode: '',
		city: ''
	};

	let valid = true;
	if (!n) {
		errors.value.fullName = 'Navn er påkrævet.';
		valid = false;
	}
	if (!isValidPhone(p)) {
		errors.value.phone = 'Ugyldigt telefonnummer.';
		valid = false;
	}
	if (!isValidEmail(e)) {
		errors.value.email = 'Ugyldig email.';
		valid = false;
	}
	if (!a) {
		errors.value.address = 'Adresse er påkrævet.';
		valid = false;
	}
	if (!isValidPostalCode(pc)) {
		errors.value.postalCode = 'Ugyldigt postnummer.';
		valid = false;
	}
	if (!c) {
		errors.value.city = 'By er påkrævet.';
		valid = false;
	}

	if (valid) {
		store.setDeliveryInfo({
			[FIELD_FULL_NAME]: n,
			[FIELD_PHONE]: p,
			[FIELD_EMAIL]: e,
			[FIELD_ADDRESS]: a,
			[FIELD_APARTMENT]: ap,
			[FIELD_POSTAL_CODE]: pc,
			[FIELD_CITY]: c
		});
	}
}

watch(
	[fullName, phone, email, address, apartment, postalCode, city],
	validateAndSync,
	{ immediate: true }
);

// Phone input helpers
function setCaretToEnd(el) {
	if (!el) return
	const len = el.value.length
	try {
		el.setSelectionRange(len, len)
	} catch (e) {
		// ignore
	}
}

function onPhoneFocus(e) {
	// Only run in client
	if (typeof window === 'undefined') return
	const el = e && e.target && e.target instanceof HTMLInputElement ? e.target : null
	if (!el) return
	if (!phone.value || phone.value.trim() === '') {
		phone.value = '+45 '
		nextTick(() => setCaretToEnd(el))
	}
	touchedPhone.value = true
}

function normalizePhoneValue(val) {
	if (!val) return ''
	// Keep plus sign, digits and spaces only
	let v = val.replace(/[^+\d\s]/g, '')
	v = v.replace(/\s+/g, ' ').trim()
	// If user typed leading 45 without +, add +
	if (/^(45\s?)/.test(v)) {
		v = '+' + v
	}
	// If starts with single 0 followed by digits, replace with +45
	if (/^0\d+/.test(v)) {
		v = v.replace(/^0/, '+45 ')
	}
	// Ensure +45 is present
	if (!v.startsWith('+45') && /^\d/.test(v)) {
		v = '+45 ' + v
	}
	return v
}

function handlePhoneInput(e) {
	const el = e && e.target && e.target instanceof HTMLInputElement ? e.target : null
	touchedPhone.value = true
	const raw = el ? (el.value || '') : (phone.value || '')
	const normalized = normalizePhoneValue(raw)
	if (normalized !== raw) {
		phone.value = normalized
		// set caret
		nextTick(() => setCaretToEnd(el))
	}
}

function onPhonePaste(e) {
	const pasted = e && e.clipboardData ? (e.clipboardData.getData('text') || '') : ''
	const normalized = normalizePhoneValue(pasted)
	phone.value = normalized
	const el = document.getElementById('phone')
	nextTick(() => setCaretToEnd(el))
	touchedPhone.value = true
}
</script>

<style scoped>

</style>
