<template>
    <Header />
    <div class="max-w-5xl mx-auto py-12 mb-10">
        <h1 class="text-3xl font-bold mb-8 text-center">Admin Panel</h1>
        <div class="flex justify-center gap-4 mb-8">
            <button
                class="px-6 py-2 rounded font-semibold border transition cursor-pointer"
                :class="activeTab === 'products' ? 'bg-[#B8082A] text-white border-[#B8082A]' : 'bg-white text-[#B8082A] border-[#B8082A]'"
                @click="activeTab = 'products'"
            >Produkter</button>
            <button
                class="px-6 py-2 rounded font-semibold border transition cursor-pointer"
                :class="activeTab === 'accessory' ? 'bg-[#B8082A] text-white border-[#B8082A]' : 'bg-white text-[#B8082A] border-[#B8082A]'"
                @click="activeTab = 'accessory'"
            >Tilbehør</button>
            <button
                class="px-6 py-2 rounded font-semibold border transition cursor-pointer"
                :class="activeTab === 'orders' ? 'bg-[#B8082A] text-white border-[#B8082A]' : 'bg-white text-[#B8082A] border-[#B8082A]'"
                @click="activeTab = 'orders'"
            >Ordrer</button>
        </div>
        <div v-if="activeTab === 'products'">
                    <div class="flex justify-end mb-4">
                        <button class="bg-[#B8082A] text-white px-4 py-2 rounded font-semibold shadow hover:bg-[#a10725] transition" @click="showModal = true">Opret Produkt</button>
                    </div>
                    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                        <div class="bg-white rounded-xl shadow-md p-8 w-full max-w-lg relative">
                            <button @click="showModal = false" class="absolute top-4 right-4 text-gray-400 hover:text-[#B8082A] text-2xl font-bold">&times;</button>
                            <h2 class="mb-1 text-xl font-semibold cursor-pointer">Opret Produkt</h2>
                            <form @submit.prevent="createProduct" class="space-y-7">
                                <div class="flex flex-col">
                                    <label for="name" class="text-base font-semibold mb-1 text-gray-900">Navn</label>
                                    <input id="name" v-model="form.name" required class="p-3 border border-gray-200 rounded-lg bg-gray-50 text-base" />
                                </div>
                                <div class="flex flex-col">
                                    <label for="description" class="text-base font-semibold mb-1 text-gray-900">Beskrivelse</label>
                                    <textarea id="description" v-model="form.description" required class="p-3 border border-gray-200 rounded-lg bg-gray-50 text-base" />
                                </div>
                                <div class="flex flex-col">
                                    <label for="features" class="text-base font-semibold mb-1 text-gray-900">Features (kommasepareret)</label>
                                    <input id="features" v-model="form.features" class="p-3 border border-gray-200 rounded-lg bg-gray-50 text-base" placeholder="fx: 📷 5K Video, 🖥️ GP2 Processor" />
                                </div>
                                <div class="flex flex-row gap-4">
                                    <div class="flex flex-col">
                                        <label class="text-base font-semibold mb-1 text-gray-900">Pris pr. dag</label>
                                        <input v-model.number="form.dailyPrice" type="number" min="0" required class="p-3 border border-gray-200 rounded-lg bg-gray-50 text-base" />
                                    </div>
                                    <div class="flex flex-col">
                                        <label class="text-base font-semibold mb-1 text-gray-900">Pris pr. uge</label>
                                        <input v-model.number="form.weeklyPrice" type="number" min="0" required class="p-3 border border-gray-200 rounded-lg bg-gray-50 text-base" />
                                    </div>
                                </div>
                                <div class="flex flex-row gap-4">
                                    <div class="flex flex-col">
                                        <label class="text-base font-semibold mb-1 text-gray-900">Pris pr. 2 uger</label>
                                        <input v-model.number="form.twoWeekPrice" type="number" min="0" required class="p-3 border border-gray-200 rounded-lg bg-gray-50 text-base" />
                                    </div>
                                    <div class="flex flex-col">
                                        <label class="text-base font-semibold mb-1 text-gray-900">Antal kameraer</label>
                                        <input v-model.number="form.quantity" type="number" min="1" required class="p-3 border border-gray-200 rounded-lg bg-gray-50 text-base" />
                                    </div>
                                </div>
                                <div class="flex justify-end">
                                    <button type="submit" class="bg-[#B8082A] text-white px-6 py-2 rounded font-semibold shadow hover:bg-[#a10725] transition">Opret</button>
                                </div>
                            </form>
                        </div>
                    </div>
                        <div class="space-y-6">
                            <div v-for="product in products" :key="product.id" class="border rounded-xl p-6 bg-white shadow">
                                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div>
                                        <h3 class="text-lg font-bold mb-1">{{ product.name }}</h3>
                                        <p class="text-gray-600 mb-2">{{ product.description }}</p>
                                        <div class="flex flex-wrap gap-2 mb-2">
                                            <span v-for="feature in (Array.isArray(product.features) ? product.features : product.features.split(','))" :key="feature" class="bg-gray-100 px-2 py-1 rounded text-xs">{{ feature }}</span>
                                        </div>
                                    </div>
                                    <div class="flex flex-col gap-1 min-w-[150px]">
                                        <span class="font-semibold">Pris pr. dag: <span class="text-[#B8082A]">{{ product.dailyPrice }} kr</span></span>
                                        <span class="font-semibold">Pris pr. uge: <span class="text-[#B8082A]">{{ product.weeklyPrice }} kr</span></span>
                                        <span class="font-semibold">Pris pr. 2 uger: <span class="text-[#B8082A]">{{ product.twoWeekPrice }} kr</span></span>
                                        <span class="font-semibold">Antal kameraer: <span class="text-[#B8082A]">{{ product.quantity }}</span></span>
                                    </div>
                                    <div class="flex gap-2 mt-2 md:mt-0">
                                        <button class="bg-blue-500 text-white px-3 py-1 rounded text-xs cursor-pointer" @click="editProduct(product)">Rediger</button>
                                        <button class="bg-red-500 text-white px-3 py-1 rounded text-xs cursor-pointer" @click="deleteProduct(product)">Slet</button>
                                    </div>
                                </div>
                                <div class="mt-4">
                                    <details>
                                        <summary class="cursor-pointer font-semibold">Kameraer ({{ product.cameras.length }})</summary>
                                        <div class="pl-4 pt-2">
                                            <div v-for="(camera, idx) in product.cameras" :key="camera.id" class="mb-4">
                                                <div class="font-bold">Kamera {{ idx + 1 }}</div>
                                                <ProductCalendar
                                                :camera-id="camera.id"
                                                :camera-name="`Kamera ${idx + 1}`"
                                                :product-name="product.name"
                                                :bookings="bookings.filter(b => b.cameraId === camera.id)"
                                                />
                                            </div>
                                        </div>
                                    </details>
                                </div>
                            </div>
                        </div>
        </div>

    <div v-else-if="activeTab === 'accessory'">
            <div class="flex justify-end mb-4">
                <button class="bg-[#B8082A] text-white px-4 py-2 rounded font-semibold shadow hover:bg-[#a10725] transition cursor-pointer" @click="showAccessoryModal = true">Opret Tilbehør</button>
            </div>
            <div v-if="showAccessoryModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                <div class="bg-white rounded-xl shadow-md p-8 w-full max-w-lg relative">
                    <button @click="showAccessoryModal = false" class="absolute top-4 right-4 text-gray-400 hover:text-[#B8082A] text-2xl font-bold cursor-pointer">&times;</button>
                    <h2 class="mb-1 text-xl font-semibold cursor-pointer">Opret Tilbehør</h2>
                    <form @submit.prevent="createAccessory" class="space-y-7">
                        <div class="flex flex-col">
                            <label for="accessoryName" class="text-base font-semibold mb-1 text-gray-900">Navn</label>
                            <input id="accessoryName" v-model="accessoryForm.name" required class="p-3 border border-gray-200 rounded-lg bg-gray-50 text-base" />
                        </div>
                        <div class="flex flex-col">
                            <label for="accessoryDescription" class="text-base font-semibold mb-1 text-gray-900">Beskrivelse</label>
                            <textarea id="accessoryDescription" v-model="accessoryForm.description" required class="p-3 border border-gray-200 rounded-lg bg-gray-50 text-base" />
                        </div>
                        <div class="flex flex-row gap-4">
                            <div class="flex-1 flex flex-col">
                                <label for="accessoryPrice" class="text-base font-semibold mb-1 text-gray-900">Pris</label>
                                <input id="accessoryPrice" type="number" v-model.number="accessoryForm.price" required class="p-3 border border-gray-200 rounded-lg bg-gray-50 text-base" />
                            </div>
                            <div class="flex-1 flex flex-col">
                                <label for="accessoryQuantity" class="text-base font-semibold mb-1 text-gray-900">Antal</label>
                                <input id="accessoryQuantity" type="number" min="1" v-model.number="accessoryForm.quantity" required class="p-3 border border-gray-200 rounded-lg bg-gray-50 text-base" />
                            </div>
                        </div>
                        <div class="flex justify-end">
                            <button type="submit" class="bg-[#B8082A] text-white px-6 py-2 rounded font-semibold shadow hover:bg-[#a10725] transition cursor-pointer">Opret</button>
                        </div>
                    </form>
                </div>
            </div>
            <div class="space-y-6">
                <div v-for="accessoryItem in accessory" :key="accessoryItem.id" class="border rounded-xl p-6 bg-white shadow flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div class="flex items-center gap-4">
                        <div>
                            <h3 class="text-lg font-bold mb-1">{{ accessoryItem.name }}</h3>
                            <p class="text-gray-600 mb-2">{{ accessoryItem.description }}</p>
                        </div>
                    </div>
                    <div class="flex flex-col gap-1 min-w-[150px]">
                        <span class="font-semibold">Pris: <span class="text-[#B8082A]">{{ accessoryItem.price }} kr</span></span>
                        <span class="font-semibold">Antal: <span class="text-[#B8082A]">{{ accessoryItem.quantity || 1 }}</span></span>
                    </div>
                    <div class="flex gap-2 mt-2 md:mt-0">
                        <button class="bg-blue-500 text-white px-3 py-1 rounded text-xs cursor-pointer" @click="editAccessory(accessoryItem)">Rediger</button>
                        <button class="bg-red-500 text-white px-3 py-1 rounded text-xs cursor-pointer" @click="deleteAccessory(accessoryItem.id)">Slet</button>
                    </div>
                    <div class="flex flex-col gap-2 mt-4">
                        <select v-model="selectedInstance[accessoryItem.id]" @change="fetchInstanceBookings(selectedInstance[accessoryItem.id])" class="p-2 border rounded w-32">
                            <option v-for="instance in accessoryInstances[accessoryItem.id] || []" :key="instance.id" :value="instance.id">
                                Enhed #{{ instance.id }}
                            </option>
                        </select>
                    </div>
                </div>
            </div>
                <div class="space-y-6">
                    <div v-for="accessoryItem in accessory" :key="accessoryItem.id" class="border rounded-xl p-6 bg-white shadow flex flex-col gap-4">
                        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <h3 class="text-lg font-bold mb-1">{{ accessoryItem.name }}</h3>
                                <p class="text-gray-600 mb-2">{{ accessoryItem.description }}</p>
                            </div>
                            <div class="flex flex-col gap-1 min-w-[150px]">
                                <span class="font-semibold">Pris: <span class="text-[#B8082A]">{{ accessoryItem.price }} kr</span></span>
                                <span class="font-semibold">Antal: <span class="text-[#B8082A]">{{ accessoryItem.quantity || 1 }}</span></span>
                            </div>
                            <div class="flex gap-2 mt-2 md:mt-0">
                                <button class="bg-blue-500 text-white px-3 py-1 rounded text-xs cursor-pointer" @click="editAccessory(accessoryItem)">Rediger</button>
                                <button class="bg-red-500 text-white px-3 py-1 rounded text-xs cursor-pointer" @click="deleteAccessory(accessoryItem.id)">Slet</button>
                            </div>
                        </div>
                        <div class="mt-4">
                            <label class="font-semibold mb-2 block">Tilgængelige enheder:</label>
                            <select v-model="selectedInstance[accessoryItem.id]" @change="fetchInstanceBookings(selectedInstance[accessoryItem.id])" class="p-2 border rounded mb-4">
                                <option v-for="instance in accessoryInstances[accessoryItem.id] || []" :key="instance.id" :value="instance.id">
                                    Enhed #{{ instance.id }}
                                </option>
                            </select>
                            <div v-if="selectedInstance[accessoryItem.id]">
                                <h4 class="font-bold mb-2">Bookingoversigt for enhed #{{ selectedInstance[accessoryItem.id] }}</h4>
                                <ul class="mb-2">
                                    <li v-for="booking in instanceBookings[selectedInstance[accessoryItem.id]] || []" :key="booking.id" class="text-sm mb-1">
                                        <span class="font-semibold text-[#B8082A]">{{ accessoryItem.name }}</span> (Enhed #{{ selectedInstance[accessoryItem.id] }})<br>
                                        {{ booking.startDate }} - {{ booking.endDate }}: {{ booking.customerName || 'Ukendt' }} ({{ booking.status }})
                                    </li>
                                    <li v-if="(instanceBookings[selectedInstance[accessoryItem.id]] || []).length === 0" class="text-gray-400">Ingen bookinger</li>
                                </ul>
                                <form @submit.prevent="createInstanceBooking(selectedInstance[accessoryItem.id])" class="flex gap-2 items-center">
                                    <input type="date" v-model="bookingForm.startDate" required class="border rounded p-1" />
                                    <input type="date" v-model="bookingForm.endDate" required class="border rounded p-1" />
                                    <input type="text" v-model="bookingForm.customerName" placeholder="Kundenavn" required class="border rounded p-1" />
                                    <button type="submit" class="bg-[#B8082A] text-white px-3 py-1 rounded">Book</button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
        </div>

        <div v-else-if="activeTab === 'orders'">
            <div class="max-w-4xl mx-auto py-8">
                <h2 class="text-xl font-semibold mb-6 text-center">Ordrer</h2>
                <div v-if="bookings.length === 0" class="text-center text-gray-500 py-12">
                    <p>Ingen ordrer at vise endnu.</p>
                </div>
                <div v-else class="space-y-6">
                    <div v-for="booking in bookings" :key="booking.id" class="border rounded-xl p-6 bg-white shadow">
                        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <h3 class="text-lg font-bold mb-1">{{ booking.fullName || booking.customerName || booking.name || 'Ukendt kunde' }}</h3>
                                <p class="text-gray-600 mb-2">{{ booking.email }}</p>
                                <div class="flex flex-wrap gap-2 mb-2">
                                    <span class="bg-gray-100 px-2 py-1 rounded text-xs">Start: {{ booking.startDate }}</span>
                                    <span class="bg-gray-100 px-2 py-1 rounded text-xs">Slut: {{ booking.endDate }}</span>
                                </div>
                                <div class="flex flex-wrap gap-2 mb-2">
                                    <span class="bg-gray-100 px-2 py-1 rounded text-xs">Adresse: {{ booking.address }}</span>
                                    <span class="bg-gray-100 px-2 py-1 rounded text-xs">Lejlighed: {{ booking.apartment }}</span>
                                    <span class="bg-gray-100 px-2 py-1 rounded text-xs">By: {{ booking.city }}</span>
                                    <span class="bg-gray-100 px-2 py-1 rounded text-xs">Postnummer: {{ booking.postalCode }}</span>
                                    <span class="bg-gray-100 px-2 py-1 rounded text-xs">Telefon: {{ booking.phone }}</span>
                                </div>
                                <div class="flex flex-wrap gap-2 mb-2">
                                    <span class="bg-gray-100 px-2 py-1 rounded text-xs">Produkt: {{ booking.productName || booking.product || 'Ukendt produkt' }}</span>
                                    <span class="bg-gray-100 px-2 py-1 rounded text-xs">Kamera: {{ booking.cameraName }}</span>
                                    <span class="bg-gray-100 px-2 py-1 rounded text-xs">Kamera ID: {{ booking.cameraId }}</span>
                                    <span class="bg-gray-100 px-2 py-1 rounded text-xs">Tilbehør enheder: {{ booking.accessoryInstanceIds ? booking.accessoryInstanceIds.join(', ') : 'Ingen' }}</span>
                                    <span class="bg-gray-100 px-2 py-1 rounded text-xs">Total pris: {{ booking.totalPrice }} kr</span>
                                </div>
                                <div class="flex gap-2 mt-2">
                                    <button class="bg-blue-500 text-white px-3 py-1 rounded text-xs cursor-pointer" @click="openEditBooking(booking)">Rediger</button>
                                    <button class="bg-red-500 text-white px-3 py-1 rounded text-xs cursor-pointer" @click="deleteBooking(booking.id)">Slet</button>
                                </div>
                            </div>
                            <div class="flex flex-col gap-1 min-w-[150px]">
                                <span class="font-semibold">Status: <span class="text-[#B8082A]">{{ booking.status || 'Ukendt' }}</span></span>
                                <span class="font-semibold">Booking ID: <span class="text-[#B8082A]">{{ booking.id }}</span></span>
                            </div>
                        </div>
                    </div>
                    <div v-if="showEditBookingModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                                    <div class="bg-white rounded-xl shadow-md p-8 w-full max-w-lg relative overflow-y-auto" style="max-height: 90vh;">
                            <button @click="closeEditBooking" class="absolute top-4 right-4 text-gray-400 hover:text-[#B8082A] text-2xl font-bold">&times;</button>
                            <h2 class="mb-1 text-xl font-semibold cursor-pointer">Rediger Booking</h2>
                            <form @submit.prevent="submitEditBooking" class="space-y-7">
                                <div class="flex flex-col">
                                    <label class="text-base font-semibold mb-1 text-gray-900">Navn</label>
                                    <input v-model="editBookingForm.fullName" required class="p-3 border border-gray-200 rounded-lg bg-gray-50 text-base" />
                                </div>
                                <div class="flex flex-col">
                                    <label class="text-base font-semibold mb-1 text-gray-900">Email</label>
                                    <input v-model="editBookingForm.email" required class="p-3 border border-gray-200 rounded-lg bg-gray-50 text-base" />
                                </div>
                                <div class="flex flex-col">
                                    <label class="text-base font-semibold mb-1 text-gray-900">Telefon</label>
                                    <input v-model="editBookingForm.phone" required class="p-3 border border-gray-200 rounded-lg bg-gray-50 text-base" />
                                </div>
                                <div class="flex flex-col">
                                    <label class="text-base font-semibold mb-1 text-gray-900">Adresse</label>
                                    <input v-model="editBookingForm.address" required class="p-3 border border-gray-200 rounded-lg bg-gray-50 text-base" />
                                </div>
                                <div class="flex flex-col">
                                    <label class="text-base font-semibold mb-1 text-gray-900">Lejlighed</label>
                                    <input v-model="editBookingForm.apartment" class="p-3 border border-gray-200 rounded-lg bg-gray-50 text-base" />
                                </div>
                                <div class="flex flex-col">
                                    <label class="text-base font-semibold mb-1 text-gray-900">By</label>
                                    <input v-model="editBookingForm.city" required class="p-3 border border-gray-200 rounded-lg bg-gray-50 text-base" />
                                </div>
                                <div class="flex flex-col">
                                    <label class="text-base font-semibold mb-1 text-gray-900">Postnummer</label>
                                    <input v-model="editBookingForm.postalCode" required class="p-3 border border-gray-200 rounded-lg bg-gray-50 text-base" />
                                </div>
                                <!-- Status field removed -->
                                <div class="flex flex-col">
                                    <label class="text-base font-semibold mb-1 text-gray-900">Produkt navn</label>
                                    <select v-model="editBookingForm.productName" class="p-3 border border-gray-200 rounded-lg bg-gray-50 text-base">
                                        <option v-for="product in products" :key="product.id" :value="product.name">{{ product.name }}</option>
                                    </select>
                                </div>
                                <div class="flex flex-col">
                                    <label class="text-base font-semibold mb-1 text-gray-900">Kamera navn</label>
                                    <select v-model="editBookingForm.cameraName" class="p-3 border border-gray-200 rounded-lg bg-gray-50 text-base" @change="updateCameraId">
                                        <option v-for="camera in selectedProductCameras" :key="camera.id" :value="`Kamera ${camera.id}`">Kamera {{ camera.id }}</option>
                                    </select>
                                </div>
                                <!-- Kamera ID field removed -->
                                <div class="flex flex-col">
                                    <label class="text-base font-semibold mb-1 text-gray-900">Tilbehør enheder (kommasepareret)</label>
                                    <input v-model="editBookingForm.accessoryInstanceIds" class="p-3 border border-gray-200 rounded-lg bg-gray-50 text-base" placeholder="fx: 1,2,3" />
                                </div>
                                <div class="flex flex-col">
                                    <label class="text-base font-semibold mb-1 text-gray-900">Total pris</label>
                                    <input v-model="editBookingForm.totalPrice" class="p-3 border border-gray-200 rounded-lg bg-gray-50 text-base" />
                                </div>
                                <div class="flex justify-end">
                                    <button type="submit" class="bg-[#B8082A] text-white px-6 py-2 rounded font-semibold shadow hover:bg-[#a10725] transition">Gem ændringer</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <Footer />
</template>

<script setup lang="ts">
async function deleteBooking(id: number) {
    await fetch(`http://localhost:3001/bookings/${id}`, {
        method: 'DELETE',
    });
    await fetchBookings();
}
function updateCameraId() {
    // Find camera id from selected name
    const match = /^Kamera (\d+)$/.exec(editBookingForm.value.cameraName);
        if (match) {
            const id = match[1];
            editBookingForm.value.cameraId = id;
        } else {
            editBookingForm.value.cameraId = '';
        }
}
// Cameras for selected product only
const selectedProductCameras = computed(() => {
    const selectedProduct = products.value.find(p => p.name === editBookingForm.value.productName);
    return selectedProduct ? selectedProduct.cameras || [] : [];
});
import { computed } from 'vue';
// Aggregate all cameras from all products for select dropdowns
const allCameras = computed(() => {
    return products.value.flatMap(product => product.cameras || []);
});
const showEditBookingModal = ref(false);
const editBookingForm = ref({
    id: undefined,
    fullName: '',
    email: '',
    phone: '',
    address: '',
    apartment: '',
    city: '',
    postalCode: '',
    status: '',
    cameraName: '',
    cameraId: '',
    productName: '',
    accessoryInstanceIds: '',
    totalPrice: ''
});

function openEditBooking(booking: any) {
    showEditBookingModal.value = true;
    editBookingForm.value = {
        id: booking.id,
        fullName: booking.fullName || '',
        email: booking.email || '',
        phone: booking.phone || '',
        address: booking.address || '',
        apartment: booking.apartment || '',
        city: booking.city || '',
        postalCode: booking.postalCode || '',
        status: booking.status || '',
        cameraName: booking.cameraName || '',
        cameraId: booking.cameraId || '',
        productName: booking.productName || '',
        accessoryInstanceIds: booking.accessoryInstanceIds ? booking.accessoryInstanceIds.join(',') : '',
        totalPrice: booking.totalPrice || ''
    };
}

function closeEditBooking() {
    showEditBookingModal.value = false;
}

async function submitEditBooking() {
        const id = editBookingForm.value.id;
        // Build PATCH payload with correct types
                const patchPayload = {
                    ...editBookingForm.value,
                    cameraId: Number(editBookingForm.value.cameraId),
                    accessoryInstanceIds: editBookingForm.value.accessoryInstanceIds
                        ? editBookingForm.value.accessoryInstanceIds.split(',').map(x => Number(x.trim())).filter(x => !isNaN(x))
                        : [],
                    totalPrice: Number(editBookingForm.value.totalPrice),
                };
            delete patchPayload.id;
            delete patchPayload.status;
        await fetch(`http://localhost:3001/bookings/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patchPayload)
        });
        showEditBookingModal.value = false;
        await fetchBookings();
}
import { ref, onMounted } from 'vue';
import { reactive } from 'vue';
const accessoryInstances = reactive<Record<number, any[]>>({});
const selectedInstance = reactive<Record<number, number>>({});
const instanceBookings = reactive<Record<number, any[]>>({});
const bookingForm = reactive({ startDate: '', endDate: '', customerName: '' });
async function fetchAccessoryInstances(accessoryId: number) {
    const res = await fetch(`http://localhost:3001/accessory-instance/${accessoryId}`);
    accessoryInstances[accessoryId] = await res.json();
    if (accessoryInstances[accessoryId].length > 0) {
        selectedInstance[accessoryId] = accessoryInstances[accessoryId][0].id;
        await fetchInstanceBookings(selectedInstance[accessoryId]);
    }
}

async function fetchInstanceBookings(instanceId: number) {
    const res = await fetch(`http://localhost:3001/accessory-booking/${instanceId}`);
    instanceBookings[instanceId] = await res.json();
}

async function createInstanceBooking(instanceId: number) {
    const payload = {
        accessoryInstanceId: instanceId,
        startDate: bookingForm.startDate,
        endDate: bookingForm.endDate,
        customerName: bookingForm.customerName,
        status: 'Booked'
    };
    await fetch('http://localhost:3001/accessory-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    bookingForm.startDate = '';
    bookingForm.endDate = '';
    bookingForm.customerName = '';
    await fetchInstanceBookings(instanceId);
}
import ProductCalendar from '@/components/booking/ProductCalendar.vue';

const showModal = ref(false);
const editingId = ref<number|null>(null);
const form = ref({
    name: '',
    description: '',
    features: '',
    dailyPrice: 0,
    weeklyPrice: 0,
    twoWeekPrice: 0,
    popular: false,
    quantity: 1
});
interface Product {
    id: number;
    name: string;
    description: string;
    features: string;
    dailyPrice: number;
    weeklyPrice: number;
    twoWeekPrice: number;
    popular: boolean;
    quantity: number;
    cameras: Camera[];
}

interface Camera {
    id: number;
    productId: number;
    dailyPrice: number;
    weeklyPrice: number;
    twoWeekPrice: number;
}
const products = ref<Product[]>([]);

async function fetchProducts() {
    const { $config } = useNuxtApp();
    const base = ($config?.public?.apiBase) || 'http://localhost:3001';
    const res = await fetch(`${base}/products`);
    products.value = await res.json();
}

fetchProducts();

async function createProduct() {
    // Log all form data
    const payload = {
        name: form.value.name,
        description: form.value.description,
        features: form.value.features,
        dailyPrice: form.value.dailyPrice,
        weeklyPrice: form.value.weeklyPrice,
        twoWeekPrice: form.value.twoWeekPrice,
        popular: form.value.popular,
        quantity: form.value.quantity
    };
    if (editingId.value) {
        // Update existing product
    const { $config } = useNuxtApp();
    const base = ($config?.public?.apiBase) || 'http://localhost:3001';
    await fetch(`${base}/products/${editingId.value}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } else {
        // Create new product
    const { $config } = useNuxtApp();
    const base = ($config?.public?.apiBase) || 'http://localhost:3001';
    await fetch(`${base}/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    }
    showModal.value = false;
    editingId.value = null;
    form.value = { name: '', description: '', features: '', dailyPrice: 0, weeklyPrice: 0, twoWeekPrice: 0, popular: false, quantity: 1 };
    await fetchProducts();
}

async function deleteProduct(product: any) {
    const { $config } = useNuxtApp();
    const base = ($config?.public?.apiBase) || 'http://localhost:3001';
    await fetch(`${base}/products/${product.id}`, {
        method: 'DELETE'
    });
    await fetchProducts();
}

function editProduct(product: any) {
    editingId.value = product.id;
    form.value = {
        name: product.name,
        description: product.description,
        features: Array.isArray(product.features) ? product.features.join(', ') : product.features,
        dailyPrice: product.dailyPrice,
        weeklyPrice: product.weeklyPrice,
        twoWeekPrice: product.twoWeekPrice || 0,
        popular: product.popular || false,
        quantity: product.quantity || 1
    };
    showModal.value = true;
}

const activeTab = ref('products');

interface Booking {
    id: number;
    customerName?: string;
    fullName?: string;
    name?: string;
    email?: string;
    startDate?: string;
    endDate?: string;
    productName?: string;
    product?: string;
    price?: number;
    status?: string;
    address?: string;
    apartment?: string;
    city?: string;
    postalCode?: string;
    phone?: string;
    cameraName?: string;
    cameraId?: number;
    accessoryInstanceIds?: number[];
    totalPrice?: number;
}
const bookings = ref<Booking[]>([]);

async function fetchBookings() {
    try {
        const res = await fetch('http://localhost:3001/bookings');
        const data = await res.json();
        console.log('Fetched bookings:', data);
        bookings.value = data;
    } catch (e) {
        bookings.value = [];
    }
}

onMounted(() => {
    fetchBookings();
    // Fetch instances for all accessories
    accessory.value.forEach(a => fetchAccessoryInstances(a.id));
});

const showAccessoryModal = ref(false);
const editingAccessoryId = ref<number|null>(null);
interface Accessory {
    id: number;
    name: string;
    description: string;
    price: number;
    quantity?: number;
}
const accessory = ref<Accessory[]>([]);
const accessoryForm = ref({ name: '', description: '', price: 0, quantity: 1 });

async function fetchAccessory() {
    const { $config } = useNuxtApp();
    const base = ($config?.public?.apiBase) || 'http://localhost:3001';
    const res = await fetch(`${base}/accessory`);
    accessory.value = await res.json();
}
fetchAccessory();

async function createAccessory() {
    const payload = { name: accessoryForm.value.name, description: accessoryForm.value.description, price: accessoryForm.value.price, quantity: accessoryForm.value.quantity };
    if (editingAccessoryId.value) {
        const { $config } = useNuxtApp();
        const base = ($config?.public?.apiBase) || 'http://localhost:3001';
        await fetch(`${base}/accessory/${editingAccessoryId.value}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } else {
        const { $config } = useNuxtApp();
        const base = ($config?.public?.apiBase) || 'http://localhost:3001';
        await fetch(`${base}/accessory`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    }
    showAccessoryModal.value = false;
    editingAccessoryId.value = null;
    accessoryForm.value = { name: '', description: '', price: 0, quantity: 1 };
    await fetchAccessory();
}

async function deleteAccessory(id: number) {
    const { $config } = useNuxtApp();
    const base = ($config?.public?.apiBase) || 'http://localhost:3001';
    await fetch(`${base}/accessory/${id}`, { method: 'DELETE' });
    await fetchAccessory();
}

function editAccessory(accessory: any) {
    editingAccessoryId.value = accessory.id;
    accessoryForm.value = {
        name: accessory.name,
        description: accessory.description,
        price: accessory.price,
        quantity: accessory.quantity || 1
    };
    showAccessoryModal.value = true;
}
</script>

<style scoped>
table {
    border-collapse: collapse;
}
th, td {
    border-bottom: 1px solid #e5e7eb;
}

button {
    cursor: pointer;
}
</style>