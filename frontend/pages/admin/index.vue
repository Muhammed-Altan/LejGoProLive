<template>
    <Header />
    <div class="max-w-5xl mx-auto py-12 mb-10">
        <div class="flex justify-between items-center mb-8">
            <h1 class="text-3xl font-bold text-center flex-1">Admin Panel</h1>
            <button 
                @click="handleLogout"
                class="bg-red-600 text-white px-4 py-2 rounded font-semibold shadow hover:bg-red-700 transition"
            >
                Log ud
            </button>
        </div>
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
            <button
                class="px-6 py-2 rounded font-semibold border transition cursor-pointer"
                :class="activeTab === 'integrations' ? 'bg-[#B8082A] text-white border-[#B8082A]' : 'bg-white text-[#B8082A] border-[#B8082A]'"
                @click="activeTab = 'integrations'"
            >Integrationer</button>
        </div>
        <div v-if="activeTab === 'products'">
                    <div class="flex justify-end mb-4">
                        <button class="bg-[#B8082A] text-white px-4 py-2 rounded font-semibold shadow hover:bg-[#a10725] transition" @click="showModal = true">Opret Produkt</button>
                    </div>
                    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                        <div class="bg-white rounded-xl shadow-md p-8 w-full max-w-lg relative overflow-y-auto" style="max-height: 90vh;">
                            <button @click="showModal = false" class="absolute top-4 right-4 text-gray-400 hover:text-[#B8082A] text-2xl font-bold">&times;</button>
                            <h2 class="mb-1 text-xl font-semibold cursor-pointer">Opret Produkt</h2>
                            <form @submit.prevent="createProduct" class="space-y-7">
                                <div class="flex flex-col">
                                    <label for="name" class="text-base font-semibold mb-1 text-gray-900">Navn</label>
                                    <input id="name" v-model="form.name" required class="p-3 border border-gray-200 rounded-lg bg-gray-50 text-base" />
                                </div>
                                <div class="flex flex-col">
                                    <label for="features" class="text-base font-semibold mb-1 text-gray-900">Features (kommasepareret)</label>
                                    <input id="features" v-model="form.features" class="p-3 border border-gray-200 rounded-lg bg-gray-50 text-base" placeholder="fx: 📷 5K Video, 🖥️ GP2 Processor" />
                                </div>
                                <!-- Image Upload Section -->
                                <div class="flex flex-col">
                                    <label for="image" class="text-base font-semibold mb-1 text-gray-900">Produktbillede</label>
                                    <input 
                                        id="image" 
                                        ref="imageInput"
                                        type="file" 
                                        accept="image/*" 
                                        @change="handleImageUpload" 
                                        class="p-3 border border-gray-200 rounded-lg bg-gray-50 text-base" 
                                    />
                                    <!-- Image Preview -->
                                    <div v-if="imagePreview || form.imageUrl" class="mt-3">
                                        <img 
                                            :src="imagePreview || form.imageUrl" 
                                            alt="Product preview" 
                                            class="w-32 h-32 object-cover rounded-lg border border-gray-200"
                                        />
                                        <button 
                                            type="button" 
                                            @click="removeImage" 
                                            class="mt-2 text-sm text-red-600 hover:text-red-800"
                                        >
                                            Fjern billede
                                        </button>
                                    </div>
                                    <div v-if="uploadingImage" class="mt-2 text-sm text-blue-600">
                                        Uploader billede...
                                    </div>
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
                            <!-- Debug section -->
                            <div class="bg-yellow-50 border border-yellow-200 p-4 rounded">
                                <p><strong>Debug:</strong> Products count: {{ products.length }}</p>
                                <p v-if="products.length === 0" class="text-red-600">No products found. Check console for errors.</p>
                                <button @click="fetchProducts" class="bg-blue-500 text-white px-3 py-1 rounded text-sm mt-2">Refresh Products</button>
                            </div>
                            
                            <div v-for="product in products" :key="product.id" class="border rounded-xl p-6 bg-white shadow">
                                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div>
                                        <h3 class="text-lg font-bold mb-1">{{ product.name }}</h3>
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
                <div class="bg-white rounded-xl shadow-md p-8 w-full max-w-lg relative overflow-y-auto" style="max-height: 90vh;">
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
            <!-- Debug section for accessories -->
            <div class="bg-yellow-50 border border-yellow-200 p-4 rounded mb-4">
                <h3 class="font-bold mb-2">Debug Info:</h3>
                <p><strong>Accessories count:</strong> {{ accessory.length }}</p>
                <p v-if="accessory.length === 0" class="text-red-600">No accessories found. Check console for errors.</p>
                <p><strong>Accessory instances loaded:</strong> {{ Object.keys(accessoryInstances).length }} types</p>
                <div v-if="debugError" class="mt-2 p-2 bg-red-100 border border-red-300 rounded">
                    <p class="text-red-700 font-bold">Error:</p>
                    <pre class="text-red-600 text-sm whitespace-pre-wrap">{{ debugError }}</pre>
                </div>
                <div class="mt-2 space-x-2">
                    <button @click="fetchAccessory()" class="bg-blue-500 text-white px-3 py-1 rounded text-sm">Refresh Accessories</button>
                    <button @click="fetchAllAccessoryInstances()" class="bg-green-500 text-white px-3 py-1 rounded text-sm">Refresh Instances</button>
                    <button @click="clearDebugError()" class="bg-gray-500 text-white px-3 py-1 rounded text-sm">Clear Error</button>
                </div>
            </div>

            <div class="space-y-6">
                <div v-for="accessoryItem in accessory" :key="accessoryItem.id" class="border rounded-xl p-6 bg-white shadow">
                    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h3 class="text-lg font-bold mb-1">{{ accessoryItem.name }}</h3>
                            <p class="text-gray-600 mb-2">{{ accessoryItem.description }}</p>
                        </div>
                        <div class="flex flex-col gap-1 min-w-[150px]">
                            <span class="font-semibold">Pris: <span class="text-[#B8082A]">{{ accessoryItem.price }} kr</span></span>
                            <span class="font-semibold">Antal enheder: <span class="text-[#B8082A]">{{ (accessoryInstances[accessoryItem.id] || []).length }} / {{ accessoryItem.quantity || 1 }}</span></span>
                        </div>
                        <div class="flex gap-2 mt-2 md:mt-0">
                            <button class="bg-blue-500 text-white px-3 py-1 rounded text-xs cursor-pointer" @click="editAccessory(accessoryItem)">Rediger</button>
                            <button class="bg-red-500 text-white px-3 py-1 rounded text-xs cursor-pointer" @click="deleteAccessory(accessoryItem.id)">Slet</button>
                        </div>
                    </div>
                    <div class="mt-4">
                        <details>
                            <summary class="cursor-pointer font-semibold">Enheder ({{ (accessoryInstances[accessoryItem.id] || []).length }})</summary>
                            <div class="pl-4 pt-2">
                                <div v-for="(instance, idx) in (accessoryInstances[accessoryItem.id] || [])" :key="instance.id" class="mb-4 p-4 border rounded-lg bg-gray-50">
                                    <div class="flex justify-between items-center mb-2">
                                        <div class="font-bold">Enhed #{{ instance.id }} ({{ accessoryItem.name }})</div>
                                        <div class="text-sm text-gray-600">
                                            Status: <span :class="instance.isAvailable ? 'text-green-600' : 'text-red-600'">
                                                {{ instance.isAvailable ? 'Ledig' : 'Optaget' }}
                                            </span>
                                        </div>
                                    </div>
                                    <div class="text-sm text-gray-600">
                                        Serial Number: {{ instance.serialNumber }}
                                    </div>
                                </div>
                                <div v-if="(accessoryInstances[accessoryItem.id] || []).length === 0" 
                                     class="text-gray-400 p-4 text-center">
                                    Ingen enheder oprettet for dette tilbehør
                                </div>
                            </div>
                        </details>
                    </div>
                </div>
            </div>
        </div>

        <div v-else-if="activeTab === 'orders'">
            <div class="max-w-4xl mx-auto py-8">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-xl font-semibold text-center">Produktinformation</h2>
                    <button 
                        @click="fixBookingCameraIds" 
                        class="bg-blue-500 text-white px-4 py-2 rounded font-semibold shadow hover:bg-blue-600 transition cursor-pointer text-sm"
                    >
                        Distribute Bookings
                    </button>
                </div>
                
                <div v-if="products.length === 0" class="text-center text-gray-500 py-12">
                    <p>Ingen produkter at vise endnu.</p>
                </div>
                
                <div v-else class="space-y-6">
                    <!-- Debug info -->
                    <div class="bg-yellow-50 border border-yellow-200 p-4 rounded mb-4">
                        <h4 class="font-bold mb-2">Debug Info:</h4>
                        <p>Total bookings: {{ bookings.length }}</p>
                        <div v-for="product in products" :key="product.id">
                            <p><strong>{{ product.name }} (Product ID: {{ product.id }}):</strong></p>
                            <div v-for="(camera, index) in product.cameras" :key="camera.id" class="ml-4">
                                <p>Camera ID {{ camera.id }} (Kamera {{ index + 1 }}): {{ getBookingsForCamera(camera.id).length }} bookings</p>
                            </div>
                        </div>
                    </div>
                    
                    <div v-for="product in products" :key="product.id" class="border rounded-xl p-6 bg-white shadow">
                        <div class="mb-4">
                            <h3 class="text-lg font-bold text-red-600 mb-2">Produktinformation</h3>
                        </div>
                        
                        <!-- Loop through each camera for this product -->
                        <div v-for="(camera, cameraIndex) in product.cameras" :key="camera.id" class="mb-6">
                            <div class="border-l-4 border-gray-300 pl-4">
                                <div class="flex justify-between items-start mb-3">
                                    <div>
                                        <h4 class="font-bold text-lg">Kamera: Kamera {{ cameraIndex + 1 }} (ID: {{ camera.id }})</h4>
                                        <p class="text-gray-600">Produkt: {{ product.name }} (ID: {{ product.id }})</p>
                                    </div>
                                </div>
                                
                                <div class="ml-4">
                                    <h5 class="font-semibold text-red-600 mb-3">Bookinger:</h5>
                                    
                                    <!-- Get bookings for this specific camera -->
                                    <div v-if="getBookingsForCamera(camera.id).length === 0" class="text-gray-500 italic">
                                        Ingen bookinger for dette kamera.
                                    </div>
                                    
                                    <div v-else class="space-y-3">
                                        <div v-for="booking in getBookingsForCamera(camera.id)" :key="booking.id" 
                                             class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                            <div class="flex justify-between items-start">
                                                <div class="flex-1">
                                                    <div class="font-medium text-sm">
                                                        {{ booking.startDate && booking.endDate ? formatDateRange(booking.startDate, booking.endDate) : 'Ukendt periode' }} 
                                                        <span class="text-red-600">{{ booking.fullName || booking.customerName || booking.name || 'Ukendt kunde' }}</span>
                                                    </div>
                                                </div>
                                                <div class="flex gap-2 ml-4">
                                                    <button class="bg-blue-500 text-white px-2 py-1 rounded text-xs cursor-pointer" @click="openEditBooking(booking)">Rediger</button>
                                                    <button class="bg-green-600 text-white px-2 py-1 rounded text-xs cursor-pointer" @click="createInvoice(booking)" :disabled="creatingInvoice === booking.id">
                                                        {{ creatingInvoice === booking.id ? 'Opretter...' : 'Faktura' }}
                                                    </button>
                                                    <button class="bg-red-500 text-white px-2 py-1 rounded text-xs cursor-pointer" @click="deleteBooking(booking.id)">Slet</button>
                                                </div>
                                            </div>
                                            
                                            <!-- Additional booking details -->
                                            <div class="mt-2 text-xs text-gray-600 space-y-1">
                                                <div>Email: {{ booking.email }}</div>
                                                <div>Telefon: {{ booking.phone }}</div>
                                                <div>Adresse: {{ booking.address }}, {{ booking.city }} {{ booking.postalCode }}</div>
                                                <div>Total pris: {{ booking.totalPrice ? (booking.totalPrice / 100).toFixed(2) : '0.00' }} kr</div>
                                                <div v-if="booking.accessoryInstanceNames && booking.accessoryInstanceNames.length > 0">
                                                    Tilbehør: {{ booking.accessoryInstanceNames.join(', ') }}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Edit Booking Modal -->
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

        <div v-else-if="activeTab === 'integrations'">
            <div class="max-w-4xl mx-auto py-8">
                <h2 class="text-2xl font-bold text-center mb-8 text-gray-900">Integrationer</h2>
                <div class="space-y-6">
                    <DineroAuth />
                    
                    <!-- Dinero API Test Section -->
                    <div class="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                        <h3 class="text-lg font-bold text-gray-900 mb-4">Dinero API Test</h3>
                        <div class="space-y-4">
                            <button 
                                @click="testDineroOAuth"
                                class="bg-blue-600 text-white px-4 py-2 rounded font-semibold shadow hover:bg-blue-700 transition"
                                :disabled="testingOAuth"
                            >
                                {{ testingOAuth ? 'Testing OAuth...' : 'Test OAuth Authentication' }}
                            </button>
                            
                            <div v-if="oauthTestResult" class="mt-4 p-4 rounded-lg" 
                                 :class="oauthTestResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'">
                                <h4 class="font-semibold" :class="oauthTestResult.success ? 'text-green-700' : 'text-red-700'">
                                    {{ oauthTestResult.success ? 'Success!' : 'Error' }}
                                </h4>
                                <pre class="text-sm mt-2 whitespace-pre-wrap" :class="oauthTestResult.success ? 'text-green-600' : 'text-red-600'">{{ JSON.stringify(oauthTestResult, null, 2) }}</pre>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <Footer />
</template>

<script setup lang="ts">
import { ref, onMounted, computed, reactive } from 'vue';
import ProductCalendar from '@/components/booking/ProductCalendar.vue';
import DineroAuth from '@/components/integrations/DineroAuth.vue';

definePageMeta({
  middleware: 'admin'
})

const toast = useToast();

// Add logout functionality
const handleLogout = async () => {
    try {
        const auth = useAuth()
        await auth.logout()
    } catch (error) {
        console.error('Logout error:', error)
        // Force navigation to login page even if logout API fails
        await navigateTo('/admin/login')
    }
}

async function deleteBooking(id: number) {
    // Show confirmation dialog
    const confirmDelete = confirm(`Er du sikker på, at du vil slette denne booking? Denne handling kan ikke fortrydes.`);
    if (!confirmDelete) {
        return; // User cancelled the deletion
    }

    try {
        await fetch(`http://localhost:3001/bookings/${id}`, {
            method: 'DELETE',
        });
        await fetchBookings();
        toast.add({
            title: 'Booking slettet!',
            description: 'Bookingen blev slettet succesfuldt',
            color: 'success',
            ui: {
                title: 'text-gray-900 font-semibold',
                description: 'text-gray-700'
            }
        });
    } catch (error: any) {
        console.error('Error deleting booking:', error);
        toast.add({
            title: 'Fejl ved sletning af booking',
            description: 'Kunne ikke slette bookingen. Prøv igen.',
            color: 'error',
            ui: {
                title: 'text-gray-900 font-semibold',
                description: 'text-gray-700'
            }
        });
    }
}

// Create invoice for booking
async function createInvoice(booking: any) {
    // Show confirmation dialog
    const confirmCreate = confirm(`Er du sikker på, at du vil oprette en faktura for booking ${booking.id}?`);
    if (!confirmCreate) {
        return; // User cancelled
    }

    creatingInvoice.value = booking.id;
    
    try {
        // Prepare products data for invoice
        const products = [];
        
        // Add main product (GoPro rental)
        if (booking.productName) {
            products.push({
                name: `${booking.productName} - Udlejning (${formatDateRange(booking.startDate, booking.endDate)})`,
                quantity: 1,
                unitPrice: booking.totalPrice / 100, // Convert from øre to kroner
                productNumber: `GOPRO-${booking.productName?.replace(/\s+/g, '-').toUpperCase()}`
            });
        }

        // Prepare customer info
        const customerInfo = {
            name: booking.fullName,
            email: booking.email,
            phone: booking.phone,
            address: booking.address,
            city: booking.city,
            postalCode: booking.postalCode,
            apartment: booking.apartment || ''
        };

        // Call invoice creation API
        const response = await $fetch('/api/dinero/create-invoice', {
            method: 'POST',
            body: {
                bookingId: booking.id,
                customerInfo,
                products,
                totalAmount: booking.totalPrice / 100, // Convert from øre to kroner
                currency: 'DKK'
            }
        }) as { success: boolean; invoiceId: string; invoiceNumber: string; message: string };

        if (response.success) {
            toast.add({
                title: 'Faktura oprettet!',
                description: `Faktura ${response.invoiceNumber} blev oprettet succesfuldt i Dinero`,
                color: 'success',
                ui: {
                    title: 'text-gray-900 font-semibold',
                    description: 'text-gray-700'
                }
            });
            
            // Refresh bookings to show updated invoice status
            await fetchBookings();
        }
    } catch (error: any) {
        console.error('Error creating invoice:', error);
        toast.add({
            title: 'Fejl ved oprettelse af faktura',
            description: error.data?.message || 'Kunne ikke oprette fakturaen. Prøv igen.',
            color: 'error',
            ui: {
                title: 'text-gray-900 font-semibold',
                description: 'text-gray-700'
            }
        });
    } finally {
        creatingInvoice.value = null;
    }
}

// Helper function to get bookings for a specific camera
function getBookingsForCamera(cameraId: number) {
    const result = bookings.value.filter(booking => booking.cameraId === cameraId);
    return result;
}

// Helper function to format date range
function formatDateRange(startDate: string, endDate: string): string {
    const start = new Date(startDate).toLocaleDateString('da-DK');
    const end = new Date(endDate).toLocaleDateString('da-DK');
    return `${start} - ${end}`;
}

// Test Dinero OAuth authentication
async function testDineroOAuth() {
    testingOAuth.value = true;
    oauthTestResult.value = null;
    
    try {
        const response = await $fetch('/api/dinero/test-oauth', {
            method: 'POST'
        });
        
        oauthTestResult.value = response;
        
        if ((response as any).success) {
            toast.add({
                title: 'OAuth Test Successful!',
                description: `Found ${(response as any).organizationCount || 0} organization(s)`,
                color: 'success',
                ui: {
                    title: 'text-gray-900 font-semibold',
                    description: 'text-gray-700'
                }
            });
        }
    } catch (error: any) {
        console.error('OAuth test error:', error);
        oauthTestResult.value = {
            success: false,
            error: error.data?.message || error.message || 'Unknown error'
        };
        
        toast.add({
            title: 'OAuth Test Failed',
            description: error.data?.message || 'Authentication test failed',
            color: 'error',
            ui: {
                title: 'text-gray-900 font-semibold',
                description: 'text-gray-700'
            }
        });
    } finally {
        testingOAuth.value = false;
    }
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
    try {
        const id = editBookingForm.value.id;
        // Build PATCH payload with correct types
        const { id: _, status: __, ...patchPayload } = {
            ...editBookingForm.value,
            cameraId: Number(editBookingForm.value.cameraId),
            accessoryInstanceIds: editBookingForm.value.accessoryInstanceIds
                ? editBookingForm.value.accessoryInstanceIds.split(',').map(x => Number(x.trim())).filter(x => !isNaN(x))
                : [],
            totalPrice: Number(editBookingForm.value.totalPrice),
        };
        await fetch(`http://localhost:3001/bookings/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patchPayload)
        });
        showEditBookingModal.value = false;
        await fetchBookings();
        toast.add({ 
            title: 'Booking opdateret!',
            description: 'Bookingen blev opdateret succesfuldt',
            color: 'success',
            ui: {
                title: 'text-gray-900 font-semibold',
                description: 'text-gray-700'
            }
        });
    } catch (error: any) {
        console.error('Error updating booking:', error);
        toast.add({ 
            title: 'Fejl ved opdatering af booking',
            description: 'Kunne ikke opdatere bookingen. Prøv igen.',
            color: 'error',
            ui: {
                title: 'text-gray-900 font-semibold',
                description: 'text-gray-700'
            }
        });
    }
}
const accessoryInstances = reactive<Record<number, AccessoryInstance[]>>({});

async function fetchAccessoryInstances(accessoryId: number) {
    try {
        const supabase = useSupabase();
        if (!supabase) {
            console.error('Supabase client not available for accessory instances');
            accessoryInstances[accessoryId] = [];
            return;
        }
        
        const { data, error } = await supabase
            .from('AccessoryInstance')
            .select('*')
            .eq('accessoryId', accessoryId)
            .order('serialNumber');
        
        if (error) {
            console.warn('AccessoryInstance table not found, creating mock instances:', error);
            // Create mock instances if table doesn't exist
            accessoryInstances[accessoryId] = Array.from({ length: accessory.value.find(a => a.id === accessoryId)?.quantity || 1 }, (_, i) => ({
                id: accessoryId * 100 + i + 1,
                accessoryId,
                serialNumber: `${accessory.value.find(a => a.id === accessoryId)?.name} #${i + 1}`,
                isAvailable: true
            }));
        } else {
            accessoryInstances[accessoryId] = data || [];
        }
    } catch (error) {
        console.error('Error fetching accessory instances:', error);
        accessoryInstances[accessoryId] = [];
    }
}

const showModal = ref(false);
const editingId = ref<number|null>(null);
const form = ref({
    name: '',
    features: '',
    dailyPrice: 0,
    weeklyPrice: 0,
    twoWeekPrice: 0,
    popular: false,
    quantity: 1,
    imageUrl: ''
});

// Image upload related variables
const imageInput = ref<HTMLInputElement>();
const imagePreview = ref<string>('');
const uploadingImage = ref(false);
const selectedImageFile = ref<File | null>(null);

interface Product {
    id: number;
    name: string;
    features: string;
    dailyPrice: number;
    weeklyPrice: number;
    twoWeekPrice: number;
    popular: boolean;
    quantity: number;
    imageUrl?: string;
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
    try {
        const supabase = useSupabase();
        if (!supabase) {
            console.error('Supabase client not available. Please check your environment configuration.');
            products.value = [];
            return;
        }
        
        // First, get the products without the Camera relationship
        const { data, error } = await supabase
            .from('Product')
            .select('*')
            .order('id', { ascending: false});
        
        if (error) throw error;
        
        // Transform the data to match the expected interface
        products.value = (data || []).map(p => ({
            id: p.id,
            name: p.name || '',
            description: '', // No description column in your table
            features: p.features || '',
            dailyPrice: p.dailyPrice || 0,
            weeklyPrice: p.weeklyPrice || 0,
            twoWeekPrice: p.twoWeekPrice || 0,
            popular: p.popular || false,
            quantity: p.quantity || 1,
            cameras: [] // We'll load cameras separately if needed
        }));
        
        // Optionally, load cameras for each product separately
        for (const product of products.value) {
            try {
                const { data: cameras } = await supabase
                    .from('Camera')
                    .select('*')
                    .eq('productId', product.id);
                
                product.cameras = cameras || [];
            } catch (cameraError) {
                console.warn(`Could not load cameras for product ${product.id}:`, cameraError);
                product.cameras = [];
            }
        }
    } catch (error) {
        console.error('Error fetching products from Supabase:', error);
        products.value = [];
    }
}

// Only fetch data on client side to avoid SSR issues
if (process.client) {
    fetchProducts();
}

async function createProduct() {
    try {
        const supabase = useSupabase();
        if (!supabase) {
            console.error('Supabase client not available for creating product');
            toast.add({ 
                title: 'Forbindelsesfejl',
                description: 'Kan ikke oprette forbindelse til databasen',
                color: 'error'
            });
            return;
        }
        
        // Upload image if a new file is selected
        let imageUrl = form.value.imageUrl;
        if (selectedImageFile.value) {
            imageUrl = await uploadImageToSupabase(selectedImageFile.value);
        }
        
        // Prepare the payload for Supabase (matching your actual table structure)
        const payload = {
            name: form.value.name,
            features: form.value.features || '', // Ensure it's not null
            dailyPrice: form.value.dailyPrice,
            weeklyPrice: form.value.weeklyPrice,
            twoWeekPrice: form.value.twoWeekPrice,
            popular: form.value.popular,
            quantity: form.value.quantity || 1, // Ensure it's not null
            imageUrl: imageUrl
        };
        
        if (editingId.value) {
            // Update existing product
            const { error } = await supabase
                .from('Product')
                .update(payload)
                .eq('id', editingId.value);
            
            if (error) throw error;
        } else {
            // Create new product
            const { data: newProduct, error } = await supabase
                .from('Product')
                .insert([payload])
                .select()
                .single();
            
            if (error) throw error;
            
            // Create cameras for the new product (assuming you want to create 4 cameras per product)
            if (newProduct && form.value.quantity > 0) {
                const cameras = [];
                for (let i = 1; i <= form.value.quantity; i++) {
                    cameras.push({
                        productId: newProduct.id,
                        dailyPrice: form.value.dailyPrice,
                        weeklyPrice: form.value.weeklyPrice,
                        twoWeekPrice: form.value.twoWeekPrice
                    });
                }
                
                const { error: camerasError } = await supabase
                    .from('Camera')
                    .insert(cameras);
                
                if (camerasError) {
                    console.warn('Error creating cameras:', camerasError);
                    // Don't throw error here, product was created successfully
                }
            }
        }
        
        // Save the product name before resetting the form
        const productName = form.value.name;
        const isEditing = !!editingId.value;
        
        showModal.value = false;
        editingId.value = null;
        form.value = { name: '', features: '', dailyPrice: 0, weeklyPrice: 0, twoWeekPrice: 0, popular: false, quantity: 1, imageUrl: '' };
        
        // Reset image upload fields
        imagePreview.value = '';
        selectedImageFile.value = null;
        if (imageInput.value) {
            imageInput.value.value = '';
        }
        
        await fetchProducts();
        
        toast.add({ 
            title: isEditing ? 'Produkt opdateret!' : 'Produkt oprettet!',
            description: `${productName} blev ${isEditing ? 'opdateret' : 'oprettet'} succesfuldt`,
            color: 'success',
            ui: {
                title: 'text-gray-900 font-semibold',
                description: 'text-gray-700'
            }
        });
    } catch (error: any) {
        console.error('Error saving product to Supabase:', error);
        toast.add({ 
            title: 'Fejl ved gem af produkt',
            description: error?.message || 'Ukendt fejl opstod',
            color: 'error',
            ui: {
                title: 'text-gray-900 font-semibold',
                description: 'text-gray-700'
            }
        });
    }
}

async function deleteProduct(product: any) {
    // Show confirmation dialog
    const confirmDelete = confirm(`Er du sikker på, at du vil slette produktet "${product.name}"? Denne handling kan ikke fortrydes.`);
    if (!confirmDelete) {
        return; // User cancelled the deletion
    }

    try {
        const supabase = useSupabase();
        if (!supabase) {
            console.error('Supabase client not available for deleting product');
            toast.add({ 
                title: 'Forbindelsesfejl',
                description: 'Kan ikke oprette forbindelse til databasen',
                color: 'error'
            });
            return;
        }
        
        // First, delete all cameras associated with this product
        const { error: camerasError } = await supabase
            .from('Camera')
            .delete()
            .eq('productId', product.id);
            
        if (camerasError) {
            console.warn('Error deleting cameras for product:', camerasError);
            // Continue anyway - maybe there were no cameras
        }
        
        // Then delete the product
        const { error } = await supabase
            .from('Product')
            .delete()
            .eq('id', product.id);
        
        if (error) throw error;
        
        await fetchProducts();
        toast.add({ 
            title: 'Produkt slettet!',
            description: `${product.name} blev slettet succesfuldt`,
            color: 'success',
            ui: {
                title: 'text-gray-900 font-semibold',
                description: 'text-gray-700'
            }
        });
    } catch (error: any) {
        console.error('Error deleting product from Supabase:', error);
        toast.add({ 
            title: 'Fejl ved sletning af produkt',
            description: error?.message || 'Ukendt fejl opstod',
            color: 'error',
            ui: {
                title: 'text-gray-900 font-semibold',
                description: 'text-gray-700'
            }
        });
    }
}

function editProduct(product: any) {
    editingId.value = product.id;
    form.value = {
        name: product.name,
        features: Array.isArray(product.features) ? product.features.join(', ') : product.features,
        dailyPrice: product.dailyPrice,
        weeklyPrice: product.weeklyPrice,
        twoWeekPrice: product.twoWeekPrice || 0,
        popular: product.popular || false,
        quantity: product.quantity || 1,
        imageUrl: product.imageUrl || ''
    };
    showModal.value = true;
}

// Image upload functions
async function handleImageUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('Kun billedfiler er tilladt');
        return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('Billedet må ikke være større end 5MB');
        return;
    }
    
    selectedImageFile.value = file;
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
        imagePreview.value = e.target?.result as string;
    };
    reader.readAsDataURL(file);
}

async function uploadImageToSupabase(file: File): Promise<string> {
    const supabase = useSupabase();
    if (!supabase) {
        console.error('Supabase client not available for image upload');
        throw new Error('Kan ikke oprette forbindelse til databasen for billedupload');
    }
    
    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `products/${fileName}`;
    
    uploadingImage.value = true;
    
    try {
        // Try uploading with upsert option
        const { data, error } = await supabase.storage
            .from('productImage')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: true
            });
        
        if (error) {
            console.error('Supabase storage error details:', error);
            throw error;
        }
        
        // Get public URL
        const { data: publicData } = supabase.storage
            .from('productImage')
            .getPublicUrl(filePath);
        
        return publicData.publicUrl;
    } catch (error: any) {
        console.error('Error uploading image:', error);
        console.error('Error message:', error.message);
        console.error('Error details:', JSON.stringify(error, null, 2));
        
        // Provide more specific error messages
        if (error.message?.includes('not found') || error.message?.includes('does not exist')) {
            throw new Error('Storage bucket "productImages" findes ikke. Opret bucket i Supabase Dashboard.');
        } else if (error.message?.includes('policy') || error.message?.includes('permission')) {
            throw new Error('Ingen tilladelse til at uploade filer. Kontroller RLS policies i Supabase.');
        } else if (error.message?.includes('size') || error.message?.includes('too large')) {
            throw new Error('Filen er for stor. Max størrelse er 50MB.');
        } else {
            throw new Error(`Fejl ved upload af billede: ${error.message || 'Ukendt fejl'}`);
        }
    } finally {
        uploadingImage.value = false;
    }
}

function removeImage() {
    imagePreview.value = '';
    form.value.imageUrl = '';
    selectedImageFile.value = null;
    if (imageInput.value) {
        imageInput.value.value = '';
    }
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
    accessoryInstanceNames?: string[];
    totalPrice?: number;
}
const bookings = ref<Booking[]>([]);
const creatingInvoice = ref<number | null>(null);
const testingOAuth = ref(false);
const oauthTestResult = ref<any>(null);

async function fetchBookings() {
    try {
        const supabase = useSupabase();
        if (!supabase) {
            console.error('Supabase client not available. Please check your environment configuration.');
            bookings.value = [];
            return;
        }
        
        const { data, error } = await supabase
            .from('Booking')
            .select('*')
            .order('id', { ascending: false });
        
        if (error) {
            console.error('Error fetching bookings:', error);
            bookings.value = [];
            return;
        }
        
        bookings.value = data || [];
        
        // Enrich bookings with accessory instance names
        await enrichBookingsWithAccessoryNames();
    } catch (e) {
        console.error('Error fetching bookings:', e);
        bookings.value = [];
    }
}

async function enrichBookingsWithAccessoryNames() {
    try {
        const supabase = useSupabase();
        if (!supabase) return;
        
        // Get all accessory instances for lookup
        const { data: accessoryInstances, error } = await supabase
            .from('AccessoryInstance')
            .select(`
                id, 
                serialNumber, 
                Accessory:accessoryId (
                    name
                )
            `);
            
        if (error) {
            console.error('Error fetching accessory instances:', error);
            return;
        }
        
        // Create a lookup map for instance ID to instance info
        const instanceLookup = new Map();
        if (accessoryInstances) {
            accessoryInstances.forEach((instance: any) => {
                instanceLookup.set(instance.id, {
                    serialNumber: instance.serialNumber,
                    accessoryName: instance.Accessory?.name || 'Unknown'
                });
            });
        }
        
        // Enrich each booking with accessory instance names
        bookings.value.forEach(booking => {
            if (booking.accessoryInstanceIds && booking.accessoryInstanceIds.length > 0) {
                booking.accessoryInstanceNames = booking.accessoryInstanceIds.map(id => {
                    const instance = instanceLookup.get(id);
                    return instance ? `${instance.accessoryName} (${instance.serialNumber})` : `ID: ${id}`;
                });
            } else {
                booking.accessoryInstanceNames = [];
            }
        });
        
    } catch (e) {
        console.error('Error enriching bookings with accessory names:', e);
    }
}

async function fixBookingCameraIds() {
    console.log('🔄 Starting booking distribution...');
    
    try {
        const supabase = useSupabase();
        if (!supabase) {
            console.error('Supabase client not available');
            return;
        }
        
        // Get all products first
        const { data: allProducts, error: productsError } = await supabase
            .from('Product')
            .select('id, name')
            .order('id');
            
        if (productsError) {
            console.error('Error fetching products:', productsError);
            return;
        }
        
        // Get all cameras
        const { data: allCameras, error: camerasError } = await supabase
            .from('Camera')
            .select('id, productId')
            .order('id');
            
        if (camerasError) {
            console.error('Error fetching cameras:', camerasError);
            return;
        }
        
        // Group cameras by productId
        const camerasByProduct: Record<number, any[]> = {};
        for (const camera of allCameras || []) {
            if (!camerasByProduct[camera.productId]) {
                camerasByProduct[camera.productId] = [];
            }
            camerasByProduct[camera.productId].push(camera);
        }
        
        console.log('📦 Products:', allProducts);
        console.log('📷 Cameras by product:', camerasByProduct);
        
        // Get all bookings
        const { data: allBookings, error: bookingsError } = await supabase
            .from('Booking')
            .select('id, productName, cameraId, startDate, endDate')
            .order('startDate');
            
        if (bookingsError) {
            console.error('Error fetching bookings:', bookingsError);
            return;
        }
        
        console.log('📋 All bookings:', allBookings?.length || 0);
        
        // Group bookings by product name and redistribute
        for (const product of allProducts || []) {
            const productBookings = allBookings?.filter(b => b.productName === product.name) || [];
            const productCameras = camerasByProduct[product.id] || [];
            
            if (productBookings.length === 0) {
                console.log(`📦 ${product.name}: No bookings to redistribute`);
                continue;
            }
            
            if (productCameras.length === 0) {
                console.log(`📦 ${product.name}: No cameras available`);
                continue;
            }
            
            console.log(`📦 ${product.name}: Redistributing ${productBookings.length} bookings across ${productCameras.length} cameras`);
            
            // Sort bookings chronologically
            productBookings.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
            
            // Redistribute using round-robin
            for (let i = 0; i < productBookings.length; i++) {
                const booking = productBookings[i];
                const cameraIndex = i % productCameras.length;
                const targetCamera = productCameras[cameraIndex];
                
                if (booking.cameraId !== targetCamera.id) {
                    console.log(`🔄 Moving booking ${booking.id} from camera ${booking.cameraId} to camera ${targetCamera.id} (${product.name})`);
                    
                    const { error: updateError } = await supabase
                        .from('Booking')
                        .update({
                            cameraId: targetCamera.id,
                            cameraName: `Kamera ${cameraIndex + 1}`
                        })
                        .eq('id', booking.id);
                        
                    if (updateError) {
                        console.error(`❌ Failed to update booking ${booking.id}:`, updateError);
                    } else {
                        console.log(`✅ Updated booking ${booking.id}`);
                    }
                } else {
                    console.log(`✓ Booking ${booking.id} already correctly assigned to camera ${targetCamera.id}`);
                }
            }
        }
        
        await fetchBookings();
        console.log('✅ Distribution complete!');
        
        toast.add({
            title: 'Bookings redistributed!',
            description: 'All bookings have been properly assigned to cameras within their products',
            color: 'success',
            ui: {
                title: 'text-gray-900 font-semibold',
                description: 'text-gray-700'
            }
        });
        
    } catch (error) {
        console.error('Error redistributing bookings:', error);
        toast.add({
            title: 'Error redistributing bookings',
            description: 'Could not redistribute bookings properly',
            color: 'error',
            ui: {
                title: 'text-gray-900 font-semibold',
                description: 'text-gray-700'
            }
        });
    }
}

// Only fetch data on client side to avoid SSR issues
if (process.client) {
    onMounted(() => {
        fetchBookings();
        // Fetch instances for all accessories
        accessory.value.forEach(a => fetchAccessoryInstances(a.id));
    });
}

const showAccessoryModal = ref(false);
const editingAccessoryId = ref<number|null>(null);

interface Accessory {
    id: number;
    name: string;
    description: string;
    price: number;
    quantity?: number;
    instances?: AccessoryInstance[];
}

interface AccessoryInstance {
    id: number;
    accessoryId: number;
    serialNumber: string; // Like "Mount #1", "Mount #2"
    isAvailable: boolean;
}

const accessory = ref<Accessory[]>([]);
const accessoryForm = ref({ name: '', description: '', price: 0, quantity: 1 });

async function fetchAccessory() {
    try {
        const supabase = useSupabase();
        if (!supabase) {
            console.error('Supabase client not available. Please check your environment configuration.');
            accessory.value = [];
            return;
        }
        
        const { data, error } = await supabase
            .from('Accessory')
            .select('*')
            .order('id', { ascending: false });
        
        if (error) {
            // If accessories table doesn't exist, create some default ones
            console.warn('Accessory table not found, using defaults:', error);
            accessory.value = [];
            return;
        }
        
        // Transform the data and load instances for each accessory
        accessory.value = (data || []).map(a => ({
            id: a.id,
            name: a.name,
            description: a.description || '',
            price: a.price,
            quantity: a.quantity || 1
        }));
        
        // Load instances for each accessory
        for (const acc of accessory.value) {
            await fetchAccessoryInstances(acc.id);
        }
    } catch (error) {
        console.error('Error fetching accessories from Supabase:', error);
        accessory.value = [];
    }
}

// Only fetch data on client side to avoid SSR issues
if (process.client) {
    fetchAccessory();
}

async function createAccessory() {
    try {
        const supabase = useSupabase();
        if (!supabase) {
            console.error('Supabase client not available for creating accessory');
            toast.add({ 
                title: 'Forbindelsesfejl',
                description: 'Kan ikke oprette forbindelse til databasen',
                color: 'error'
            });
            return;
        }
        
        const isEditing = !!editingAccessoryId.value;
        const accessoryName = accessoryForm.value.name;
        
        const payload = { 
            name: accessoryForm.value.name, 
            description: accessoryForm.value.description, 
            price: accessoryForm.value.price, 
            quantity: accessoryForm.value.quantity 
        };
        
        let accessoryId: number;
        
        if (editingAccessoryId.value) {
            // Update existing accessory
            const { error } = await supabase
                .from('Accessory')
                .update(payload)
                .eq('id', editingAccessoryId.value);
            
            if (error) throw error;
            accessoryId = editingAccessoryId.value;
        } else {
            // Create new accessory
            const { data, error } = await supabase
                .from('Accessory')
                .insert([payload])
                .select()
                .single();
            
            if (error) throw error;
            accessoryId = data.id;
            
            // Create instances for the new accessory
            const instances = Array.from({ length: accessoryForm.value.quantity }, (_, i) => ({
                accessoryId,
                serialNumber: `${accessoryForm.value.name} #${i + 1}`,
                isAvailable: true
            }));
            
            try {
                const { error: instancesError } = await supabase
                    .from('AccessoryInstance')
                    .insert(instances);
                
                if (instancesError) {
                    console.warn('Could not create accessory instances:', instancesError);
                }
            } catch (instanceError) {
                console.warn('AccessoryInstance table may not exist:', instanceError);
            }
        }
        
        showAccessoryModal.value = false;
        editingAccessoryId.value = null;
        accessoryForm.value = { name: '', description: '', price: 0, quantity: 1 };
        await fetchAccessory();
        toast.add({ 
            title: isEditing ? 'Tilbehør opdateret!' : 'Tilbehør oprettet!',
            description: `${accessoryName} blev ${isEditing ? 'opdateret' : 'oprettet'} succesfuldt`,
            color: 'success',
            ui: {
                title: 'text-gray-900 font-semibold',
                description: 'text-gray-700'
            }
        });
    } catch (error: any) {
        console.error('Error saving accessory to Supabase:', error);
        toast.add({ 
            title: 'Fejl ved gem af tilbehør',
            description: error?.message || 'Ukendt fejl opstod',
            color: 'error',
            ui: {
                title: 'text-gray-900 font-semibold',
                description: 'text-gray-700'
            }
        });
    }
}

async function deleteAccessory(id: number) {
    // Show confirmation dialog
    const confirmDelete = confirm(`Er du sikker på, at du vil slette dette tilbehør? Denne handling kan ikke fortrydes.`);
    if (!confirmDelete) {
        return; // User cancelled the deletion
    }

    try {
        const supabase = useSupabase();
        if (!supabase) {
            console.error('Supabase client not available for deleting accessory');
            toast.add({ 
                title: 'Forbindelsesfejl',
                description: 'Kan ikke oprette forbindelse til databasen',
                color: 'error'
            });
            return;
        }
        
        // First, delete all accessory instances associated with this accessory
        const { error: instancesError } = await supabase
            .from('AccessoryInstance')
            .delete()
            .eq('accessoryId', id);
            
        if (instancesError) {
            console.warn('Error deleting accessory instances:', instancesError);
            // Continue anyway - maybe there were no instances
        }
        
        // Then delete the accessory
        const { error } = await supabase
            .from('Accessory')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        await fetchAccessory();
        toast.add({ 
            title: 'Tilbehør slettet!',
            description: 'Tilbehøret blev slettet succesfuldt',
            color: 'success',
            ui: {
                title: 'text-gray-900 font-semibold',
                description: 'text-gray-700'
            }
        });
    } catch (error: any) {
        console.error('Error deleting accessory from Supabase:', error);
        toast.add({ 
            title: 'Fejl ved sletning af tilbehør',
            description: error?.message || 'Ukendt fejl opstod',
            color: 'error',
            ui: {
                title: 'text-gray-900 font-semibold',
                description: 'text-gray-700'
            }
        });
    }
}

function editAccessory(accessoryItem: any) {
    editingAccessoryId.value = accessoryItem.id;
    accessoryForm.value = {
        name: accessoryItem.name,
        description: accessoryItem.description || '',
        price: accessoryItem.price,
        quantity: accessoryItem.quantity || 1
    };
    showAccessoryModal.value = true;
}

// Debug functionality
const debugError = ref<string>('');

async function fetchAllAccessoryInstances() {
    try {
        debugError.value = '';
        console.log('Fetching all accessory instances...');
        
        for (const acc of accessory.value) {
            await fetchAccessoryInstances(acc.id);
        }
        
        toast.add({
            title: 'Instances opdateret!',
            description: 'Alle tilbehør enheder blev hentet succesfuldt',
            color: 'success',
            ui: {
                title: 'text-gray-900 font-semibold',
                description: 'text-gray-700'
            }
        });
    } catch (error: any) {
        console.error('Error fetching all accessory instances:', error);
        debugError.value = error.message || JSON.stringify(error, null, 2);
        toast.add({
            title: 'Fejl ved hentning af enheder',
            description: 'Kunne ikke hente alle tilbehør enheder',
            color: 'error',
            ui: {
                title: 'text-gray-900 font-semibold',
                description: 'text-gray-700'
            }
        });
    }
}

function clearDebugError() {
    debugError.value = '';
    toast.add({
        title: 'Debug clearet!',
        description: 'Debug fejl blev ryddet',
        color: 'success',
        ui: {
            title: 'text-gray-900 font-semibold',
            description: 'text-gray-700'
        }
    });
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