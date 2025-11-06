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
                :class="activeTab === 'inventory' ? 'bg-[#B8082A] text-white border-[#B8082A]' : 'bg-white text-[#B8082A] border-[#B8082A]'"
                @click="activeTab = 'inventory'"
            >Lager</button>
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
                    <button @click="showAccessoryModal = false; accessoryImagePreview = ''; editingAccessoryId = null;" class="absolute top-4 right-4 text-gray-400 hover:text-[#B8082A] text-2xl font-bold cursor-pointer">&times;</button>
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
                        <!-- Image Upload Section for Accessories -->
                        <div class="flex flex-col">
                            <label for="accessoryImage" class="text-base font-semibold mb-1 text-gray-900">Tilbehørsbillede</label>
                            <input 
                                id="accessoryImage" 
                                ref="accessoryImageInput"
                                type="file" 
                                accept="image/*" 
                                @change="handleAccessoryImageUpload" 
                                class="p-3 border border-gray-200 rounded-lg bg-gray-50 text-base" 
                            />
                            <!-- Image Preview -->
                            <div v-if="accessoryImagePreview || accessoryForm.imageUrl" class="mt-3">
                                <img 
                                    :src="accessoryImagePreview || accessoryForm.imageUrl" 
                                    alt="Accessory preview" 
                                    class="w-32 h-32 object-cover rounded-lg border border-gray-200"
                                />
                                <button 
                                    type="button" 
                                    @click="removeAccessoryImage" 
                                    class="mt-2 text-sm text-red-600 hover:text-red-800"
                                >
                                    Fjern billede
                                </button>
                            </div>
                            <div v-if="uploadingAccessoryImage" class="mt-2 text-sm text-blue-600">
                                Uploader billede...
                            </div>
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

            <!-- Commented out current accessory display for dynamic version -->
            <!--
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
            -->
            
            <!-- New dynamic accessory display with images -->
            <div class="space-y-6">
                <div v-for="accessoryItem in accessory" :key="accessoryItem.id" class="border rounded-xl p-6 bg-white shadow">
                    <div class="flex flex-col md:flex-row gap-6">
                        <!-- Image section -->
                        <div class="w-full md:w-48 flex-shrink-0">
                            <div v-if="accessoryItem.imageUrl" class="w-full h-48 rounded-lg overflow-hidden bg-gray-100">
                                <img 
                                    :src="accessoryItem.imageUrl" 
                                    :alt="accessoryItem.name"
                                    class="w-full h-full object-cover"
                                />
                            </div>
                            <div v-else class="w-full h-48 rounded-lg bg-gray-100 flex items-center justify-center">
                                <div class="text-center text-gray-500">
                                    <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <p class="mt-2 text-sm">Intet billede</p>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Content section -->
                        <div class="flex-1">
                            <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                <div class="flex-1">
                                    <h3 class="text-xl font-bold mb-2 text-gray-900">{{ accessoryItem.name }}</h3>
                                    <p class="text-gray-600 mb-4 leading-relaxed">{{ accessoryItem.description }}</p>
                                    
                                    <div class="flex flex-wrap gap-4 mb-4">
                                        <div class="bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                                            <span class="text-sm text-gray-600">Pris:</span>
                                            <span class="font-bold text-[#B8082A] ml-1">{{ accessoryItem.price }} kr</span>
                                        </div>
                                        <div class="bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                                            <span class="text-sm text-gray-600">Enheder:</span>
                                            <span class="font-bold text-gray-900 ml-1">
                                                {{ (accessoryInstances[accessoryItem.id] || []).length }} / {{ accessoryItem.quantity || 1 }}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="flex gap-2">
                                    <button class="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow hover:bg-blue-600 transition" @click="editAccessory(accessoryItem)">
                                        Rediger
                                    </button>
                                    <button class="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow hover:bg-red-600 transition" @click="deleteAccessory(accessoryItem.id)">
                                        Slet
                                    </button>
                                </div>
                            </div>
                            
                            <!-- Instances section -->
                            <div class="mt-6">
                                <details class="group">
                                    <summary class="cursor-pointer font-semibold text-gray-900 hover:text-[#B8082A] transition flex items-center">
                                        <span>Enheder ({{ (accessoryInstances[accessoryItem.id] || []).length }})</span>
                                        <svg class="ml-2 h-4 w-4 transform transition group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </summary>
                                    <div class="mt-4 pl-4 border-l-2 border-gray-200">
                                        <div v-for="(instance, idx) in (accessoryInstances[accessoryItem.id] || [])" :key="instance.id" class="mb-3 p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition">
                                            <div class="flex justify-between items-center mb-2">
                                                <div class="font-semibold text-gray-900">Enhed #{{ instance.id }} ({{ accessoryItem.name }})</div>
                                                <div class="text-sm">
                                                    Status: <span :class="instance.isAvailable ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'">
                                                        {{ instance.isAvailable ? 'Ledig' : 'Optaget' }}
                                                    </span>
                                                </div>
                                            </div>
                                            <div class="text-sm text-gray-600">
                                                <span class="font-medium">Serial Number:</span> {{ instance.serialNumber }}
                                            </div>
                                        </div>
                                        <div v-if="(accessoryInstances[accessoryItem.id] || []).length === 0" 
                                             class="text-gray-400 p-6 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                                            <svg class="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m14 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m14 0H6m14 0l-2-2m2 2l-2 2M6 13l2-2m-2 2l2 2" />
                                            </svg>
                                            <p>Ingen enheder oprettet for dette tilbehør</p>
                                        </div>
                                    </div>
                                </details>
                            </div>
                        </div>
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
                            <div class="flex flex-col md:flex-row gap-4">
                                <div class="flex-1">
                                    <label class="text-base font-semibold mb-1 text-gray-900">Start dato</label>
                                    <input v-model="editBookingForm.startDate" type="date" class="p-3 border border-gray-200 rounded-lg bg-gray-50 text-base w-full" />
                                </div>
                                <div class="flex-1">
                                    <label class="text-base font-semibold mb-1 text-gray-900">Slut dato</label>
                                    <input v-model="editBookingForm.endDate" type="date" class="p-3 border border-gray-200 rounded-lg bg-gray-50 text-base w-full" />
                                </div>
                            </div>
                            <div class="flex flex-col">
                                <label class="text-base font-semibold mb-1 text-gray-900">Total pris</label>
                                <input v-model="editBookingForm.totalPrice" class="p-3 border border-gray-200 rounded-lg bg-gray-50 text-base" />
                            </div>
                            
                            <!-- Price Difference Display -->
                            <div v-if="calculatingPrice" class="flex items-center justify-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span class="text-blue-700 text-sm">Beregner ny pris...</span>
                            </div>
                            
                            <div v-else-if="Math.abs(priceDifference) > 0.01" class="p-3 rounded-lg border" 
                                 :class="priceDifference > 0 ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <h4 class="font-semibold text-sm" 
                                            :class="priceDifference > 0 ? 'text-orange-800' : 'text-green-800'">
                                            {{ priceDifference > 0 ? 'Prisforøgelse' : 'Prisreduktion' }}
                                        </h4>
                                        <p class="text-xs" :class="priceDifference > 0 ? 'text-orange-600' : 'text-green-600'">
                                            {{ priceDifference > 0 ? '+' : '' }}{{ priceDifference.toFixed(2) }} DKK
                                        </p>
                                    </div>
                                    <div v-if="showSendInvoiceButton" class="ml-4">
                                        <button 
                                            type="button"
                                            @click="sendUpdatedInvoice"
                                            class="bg-blue-600 text-white px-3 py-1 rounded text-sm font-semibold shadow hover:bg-blue-700 transition"
                                        >
                                            Send Faktura
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="flex justify-end space-x-3">
                                <button type="button" @click="closeEditBooking" class="bg-gray-500 text-white px-6 py-2 rounded font-semibold shadow hover:bg-gray-600 transition">Annuller</button>
                                <button type="submit" class="bg-[#B8082A] text-white px-6 py-2 rounded font-semibold shadow hover:bg-[#a10725] transition">Gem ændringer</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>

        <!-- Inventory Tab -->
        <div v-else-if="activeTab === 'inventory'">
            <div class="max-w-7xl mx-auto">
                <InventoryStatus />
                
                <!-- Additional admin inventory tools can go here -->
                <div class="mt-8 grid grid-cols-1 md:grid-cols-1 gap-6">
                    <!-- Quick Actions -->
                    <div class="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                        <h3 class="text-lg font-bold text-gray-900 mb-4">📊 Hurtige Handlinger</h3>
                        <div class="space-y-3">
                            <button 
                                @click="exportInventoryReport"
                                class="w-full bg-blue-600 text-white px-4 py-2 rounded font-semibold shadow hover:bg-blue-700 transition text-sm"
                            >
                                Eksporter Lagerrapport
                            </button>
                            <button 
                                @click="refreshAllInventory"
                                class="w-full bg-green-600 text-white px-4 py-2 rounded font-semibold shadow hover:bg-green-700 transition text-sm"
                            >
                                Opdater Alt Lager
                            </button>
                        </div>
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
const auth = useAuth(); // Add auth composable at top level

// Add logout functionality
const handleLogout = async () => {
    try {
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
        // Use authenticated API endpoint
        const response = await auth.authenticatedFetch('/api/admin/bookings', {
            method: 'DELETE',
            body: { id }
        });
        
        if (!response.success) {
            throw new Error(response.message || 'Failed to delete booking');
        }
        
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
            description: error?.message || 'Kunne ikke slette bookingen. Prøv igen.',
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

// Function to send updated receipt when price has changed
async function sendUpdatedInvoice() {
    console.log('🔄 sendUpdatedInvoice started')
    
    if (!editBookingForm.value.id || Math.abs(priceDifference.value) <= 0.01) {
        console.log('❌ Early return: no booking ID or price difference too small')
        return;
    }
    
    // Helper function to convert øre to DKK if needed
    const convertToDKK = (amount: number) => {
        // If amount is a large integer (>1000), it's likely in øre, convert to DKK
        if (amount > 1000 && Number.isInteger(amount)) {
            return amount / 100;
        }
        return amount;
    };
    
    const confirmSend = confirm(
        `Send opdateret faktura med ${priceDifference.value > 0 ? 'merpris' : 'refusion'} på ${Math.abs(priceDifference.value).toFixed(2)} DKK?`
    );
    
    if (!confirmSend) {
        console.log('❌ User cancelled sending invoice')
        return;
    }
    
    try {
        console.log('📧 Starting invoice sending process...')
        
        // Create payment link for the difference amount (if positive)
        let paymentUrl = null
        if (priceDifference.value > 0) {
            console.log('💳 Creating payment link for positive difference...')
            const paymentResponse = await auth.authenticatedFetch('/api/payment/difference', {
                method: 'POST',
                body: {
                    bookingId: editBookingForm.value.id,
                    differenceAmount: priceDifference.value,
                    customerEmail: editBookingForm.value.email,
                    customerName: editBookingForm.value.fullName
                }
            })
            
            if (paymentResponse.success) {
                paymentUrl = paymentResponse.paymentUrl
                console.log('✅ Payment link created successfully:', paymentUrl)
                console.log('💰 Price difference for payment:', priceDifference.value)
            } else {
                console.error('❌ Failed to create payment link:', paymentResponse)
                throw new Error('Kunne ikke oprette betalingslink')
            }
        } else {
            console.log('💰 No payment link needed for negative or zero difference')
        }
        
        console.log('📧 Preparing email data...')
        
        // Import the email composable
        const { useEmail } = await import('@/composables/useEmail');
        const { sendReceiptPDF, validateBookingData } = useEmail();
        
        // Prepare booking data for email
        const bookingEmailData = {
            orderNumber: `UPDATED-${editBookingForm.value.id}`,
            customerName: editBookingForm.value.fullName,
            customerEmail: editBookingForm.value.email,
            customerPhone: editBookingForm.value.phone,
            service: editBookingForm.value.productName || 'LejGoPro Service',
            startDate: editBookingForm.value.startDate,
            endDate: editBookingForm.value.endDate,
            duration: `${editBookingForm.value.startDate} - ${editBookingForm.value.endDate}`,
            totalAmount: convertToDKK(parseFloat(editBookingForm.value.totalPrice) || 0),
            bookingDate: new Date().toISOString(),
            rentalPeriod: {
                startDate: editBookingForm.value.startDate,
                endDate: editBookingForm.value.endDate
            },
            deliveryAddress: editBookingForm.value.address ? 
                `${editBookingForm.value.address}${editBookingForm.value.apartment ? ', ' + editBookingForm.value.apartment : ''}, ${editBookingForm.value.postalCode || ''} ${editBookingForm.value.city || ''}`.trim() 
                : undefined,
            items: [{
                name: `${editBookingForm.value.productName} - Opdateret booking`,
                quantity: 1,
                unitPrice: convertToDKK(parseFloat(editBookingForm.value.totalPrice) || 0),
                totalPrice: convertToDKK(parseFloat(editBookingForm.value.totalPrice) || 0)
            }],
            // Include price difference information and payment link
            priceDifference: priceDifference.value,
            paymentUrl: paymentUrl,
            isUpdate: true
        };

        console.log('📧 Email data being sent:', {
            priceDifference: bookingEmailData.priceDifference,
            paymentUrl: bookingEmailData.paymentUrl,
            isUpdate: bookingEmailData.isUpdate,
            customerEmail: bookingEmailData.customerEmail,
            totalAmount: bookingEmailData.totalAmount,
            startDate: bookingEmailData.startDate,
            endDate: bookingEmailData.endDate,
            rawTotalPrice: editBookingForm.value.totalPrice
        });

        // Validate the booking data
        if (!validateBookingData(bookingEmailData)) {
            throw new Error('Ugyldig booking data til email');
        }

        // Send the updated receipt PDF
        const success = await sendReceiptPDF(bookingEmailData);

        if (success) {
            toast.add({
                title: 'Opdateret faktura sendt!',
                description: `Faktura med ${priceDifference.value > 0 ? 'merpris' : 'refusion'} på ${Math.abs(priceDifference.value).toFixed(2)} DKK blev sendt til ${editBookingForm.value.email}`,
                color: 'success',
                ui: {
                    title: 'text-gray-900 font-semibold',
                    description: 'text-gray-700'
                }
            });
            
            // Reset price difference after sending invoice
            showSendInvoiceButton.value = false;
            priceDifference.value = 0;
        } else {
            throw new Error('Kunne ikke sende email receipt');
        }
    } catch (error: any) {
        console.error('Error sending updated receipt:', error);
        toast.add({
            title: 'Fejl ved afsendelse af faktura',
            description: error.message || 'Kunne ikke sende den opdaterede faktura. Prøv igen.',
            color: 'error',
            ui: {
                title: 'text-gray-900 font-semibold',
                description: 'text-gray-700'
            }
        });
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
const priceDifference = ref(0);
const originalPrice = ref(0);
const calculatingPrice = ref(false);
const showSendInvoiceButton = ref(false);
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
    totalPrice: '',
    startDate: '',
    endDate: ''
});

function openEditBooking(booking: any) {
    showEditBookingModal.value = true;
    // Store original price for comparison
    originalPrice.value = booking.totalPrice || 0;
    priceDifference.value = 0;
    showSendInvoiceButton.value = false;
    
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
        totalPrice: booking.totalPrice || '',
        startDate: '', // Leave empty to show dd-mm-yyyy placeholder
        endDate: ''   // Leave empty to show dd-mm-yyyy placeholder
    };
}

// Function to calculate price difference when dates change (without saving)
async function calculatePriceDifference() {
    if (!editBookingForm.value.startDate || !editBookingForm.value.endDate || !editBookingForm.value.id) {
        return;
    }
    
    calculatingPrice.value = true;
    
    try {
        // Create a test payload to get the price calculation WITHOUT saving
        const payload = {
            id: editBookingForm.value.id,
            startDate: editBookingForm.value.startDate,
            endDate: editBookingForm.value.endDate,
            calculateOnly: true // This flag prevents database update
        };
        
        // Call the admin booking update API to get price calculation only
        const response = await auth.authenticatedFetch('/api/admin/bookings', {
            method: 'POST', 
            body: payload
        });
        
        console.log('Frontend received response:', response);
        
        if (response.success && response.priceDifference !== undefined) {
            priceDifference.value = response.priceDifference;
            
            // Update the total price field display (but don't save to database)
            if (response.newTotalPrice) {
                editBookingForm.value.totalPrice = response.newTotalPrice;
            }
            
            // Show send invoice button if there's a price difference
            showSendInvoiceButton.value = Math.abs(priceDifference.value) > 0.01; // More than 1 øre difference
            
            console.log('Price difference calculated (not saved):', priceDifference.value);
        } else {
            console.log('No priceDifference in response or response failed:', response);
        }
    } catch (error) {
        console.error('Error calculating price difference:', error);
        toast.add({ 
            title: 'Fejl ved prisberegning',
            description: 'Kunne ikke beregne prisforskellen. Prøv igen.',
            color: 'error'
        });
    } finally {
        calculatingPrice.value = false;
    }
}

// Watch for date changes to trigger price recalculation
watch([
    () => editBookingForm.value.startDate,
    () => editBookingForm.value.endDate
], async ([newStartDate, newEndDate], [oldStartDate, oldEndDate]) => {
    // Only recalculate if both dates are set and at least one has changed
    if (newStartDate && newEndDate && (newStartDate !== oldStartDate || newEndDate !== oldEndDate)) {
        await calculatePriceDifference();
    }
}, { deep: true });

function closeEditBooking() {
    showEditBookingModal.value = false;
}

async function submitEditBooking() {
    try {
        const id = editBookingForm.value.id;
        // Build payload with correct field mapping based on the actual booking schema
        const payload = {
            id,
            fullName: editBookingForm.value.fullName,
            email: editBookingForm.value.email,
            phone: editBookingForm.value.phone,
            address: editBookingForm.value.address,
            city: editBookingForm.value.city,
            postalCode: editBookingForm.value.postalCode,
            cameraId: editBookingForm.value.cameraId ? Number(editBookingForm.value.cameraId) : null,
            accessoryInstanceIds: editBookingForm.value.accessoryInstanceIds
                ? editBookingForm.value.accessoryInstanceIds.split(',').map(x => Number(x.trim())).filter(x => !isNaN(x))
                : [],
            totalPrice: Number(editBookingForm.value.totalPrice) || 0,
            status: editBookingForm.value.status,
            productName: editBookingForm.value.productName,
            startDate: editBookingForm.value.startDate,
            endDate: editBookingForm.value.endDate
        };
        
        // Use authenticated API endpoint
        const response = await auth.authenticatedFetch('/api/admin/bookings', {
            method: 'POST',
            body: payload
        });
        
        if (!response.success) {
            throw new Error(response.message || 'Failed to update booking');
        }
        
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
            description: error?.message || 'Kunne ikke opdatere bookingen. Prøv igen.',
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
        // Use authenticated API endpoint
        const response = await auth.authenticatedFetch(`/api/admin/accessory-instances?accessoryId=${accessoryId}`);
        
        if (!response.success) {
            console.warn('Failed to fetch accessory instances, creating mock instances');
            // Create mock instances if API fails
            accessoryInstances[accessoryId] = Array.from({ length: accessory.value.find(a => a.id === accessoryId)?.quantity || 1 }, (_, i) => ({
                id: accessoryId * 100 + i + 1,
                accessoryId,
                serialNumber: `${accessory.value.find(a => a.id === accessoryId)?.name} #${i + 1}`,
                isAvailable: true
            }));
        } else {
            accessoryInstances[accessoryId] = response.data || [];
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

// Accessory image handling
const accessoryImagePreview = ref<string>('');
const uploadingAccessoryImage = ref(false);
const accessoryImageInput = ref<HTMLInputElement>();
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
        console.log('🔄 Fetching products from server API...')
        // Use authenticated fetch with JWT token
        const response = await auth.authenticatedFetch('/api/admin/products')
        
        console.log('📦 Products API response:', response)
        
        if (!response.success) {
            throw new Error('Failed to fetch products')
        }
        
        // Transform the data to match the expected interface
        products.value = (response.data || []).map(p => ({
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
        
        console.log('✅ Products loaded:', products.value.length);
        
        // Load cameras for each product using server API
        try {
            const cameraResponse = await auth.authenticatedFetch('/api/admin/cameras')
            if (cameraResponse.success) {
                const cameras = cameraResponse.data || []
                console.log('📷 All cameras loaded:', cameras.length)
                
                // Group cameras by product
                products.value.forEach(product => {
                    product.cameras = cameras.filter(camera => camera.productId === product.id)
                    console.log(`📷 Product ${product.name} has ${product.cameras.length} cameras`)
                })
            }
        } catch (cameraError) {
            console.warn('Could not load cameras:', cameraError)
        }
        
    } catch (error) {
        console.error('Error fetching products from server:', error);
        products.value = [];
    }
}

// Only fetch data on client side to avoid SSR issues
if (process.client) {
    fetchProducts();
    fetchBookings();
    fetchAccessory();
}

async function createProduct() {
    try {
        // Upload image if a new file is selected
        let imageUrl = form.value.imageUrl;
        if (selectedImageFile.value) {
            const supabase = useSupabase();
            if (supabase) {
                imageUrl = await uploadImageToSupabase(selectedImageFile.value);
            }
        }
        
        // Prepare the payload for the API
        const payload: any = {
            name: form.value.name,
            features: form.value.features || '',
            dailyPrice: form.value.dailyPrice,
            weeklyPrice: form.value.weeklyPrice,
            twoWeekPrice: form.value.twoWeekPrice,
            popular: form.value.popular,
            quantity: form.value.quantity || 1,
            imageUrl: imageUrl
        };
        
        // Add ID if editing
        if (editingId.value) {
            payload.id = editingId.value;
        }
        
        // Use authenticated API endpoint
        const response = await auth.authenticatedFetch('/api/admin/products', {
            method: 'POST',
            body: payload
        });
        
        if (!response.success) {
            throw new Error(response.message || 'Failed to save product');
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
        console.error('Error saving product:', error);
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
        // Use authenticated API endpoint
        const response = await auth.authenticatedFetch('/api/admin/products', {
            method: 'DELETE',
            body: { id: product.id }
        });
        
        if (!response.success) {
            throw new Error(response.message || 'Failed to delete product');
        }
        
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
        console.error('Error deleting product:', error);
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

// Accessory image handling functions
async function handleAccessoryImageUpload(event: Event) {
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
    
    uploadingAccessoryImage.value = true;
    
    try {
        // Upload to Supabase
        const imageUrl = await uploadAccessoryImageToSupabase(file);
        accessoryForm.value.imageUrl = imageUrl;
        
        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            accessoryImagePreview.value = e.target?.result as string;
        };
        reader.readAsDataURL(file);
        
    } catch (error: any) {
        console.error('Error uploading accessory image:', error);
        alert(`Fejl ved upload af billede: ${error.message}`);
    } finally {
        uploadingAccessoryImage.value = false;
    }
}

async function uploadAccessoryImageToSupabase(file: File): Promise<string> {
    const supabase = useSupabase();
    if (!supabase) {
        console.error('Supabase client not available for image upload');
        throw new Error('Kan ikke oprette forbindelse til databasen for billedupload');
    }
    
    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `accessories/${fileName}`;
    
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
        console.error('Error uploading accessory image:', error);
        throw new Error(`Fejl ved upload af tilbehørsbillede: ${error.message || 'Ukendt fejl'}`);
    }
}

function removeAccessoryImage() {
    accessoryImagePreview.value = '';
    accessoryForm.value.imageUrl = '';
    if (accessoryImageInput.value) {
        accessoryImageInput.value.value = '';
    }
}

const activeTab = ref('products');

// Inventory management data
interface InventoryItem {
  productId: number;
  productName: string;
  available: number;
}

const lowStockItems = ref<InventoryItem[]>([]);
const outOfStockItems = ref<InventoryItem[]>([]);
const utilizationRate = ref(0);
const activeRentals = ref(0);
const averageRentalDuration = ref(0);

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
        console.log('🔄 Fetching bookings from server API...')
        // Use authenticated fetch with JWT token
        const response = await auth.authenticatedFetch('/api/admin/bookings')
        
        console.log('📋 Bookings API response:', response)
        
        if (!response.success) {
            throw new Error('Failed to fetch bookings')
        }
        
        bookings.value = response.data || [];
        
        console.log('✅ Bookings loaded:', bookings.value.length)
        
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
        
        console.log('🔍 Enriching bookings with accessory names...');
        
        // Get all accessory instances
        const { data: accessoryInstances, error: instanceError } = await supabase
            .from('AccessoryInstance')
            .select('id, serialNumber, accessoryId');
            
        if (instanceError) {
            console.error('Error fetching accessory instances:', instanceError);
            return;
        }
        
        // Get all accessories
        const { data: accessories, error: accessoryError } = await supabase
            .from('Accessory')
            .select('id, name');
            
        if (accessoryError) {
            console.error('Error fetching accessories:', accessoryError);
            return;
        }
        
        console.log('📦 Found accessories:', accessories);
        console.log('🔧 Found accessory instances:', accessoryInstances);
        
        // Create lookup maps
        const accessoryLookup = new Map();
        accessories?.forEach(accessory => {
            accessoryLookup.set(accessory.id, accessory.name);
        });
        
        const instanceLookup = new Map();
        accessoryInstances?.forEach(instance => {
            const accessoryName = accessoryLookup.get(instance.accessoryId) || 'Unknown';
            instanceLookup.set(instance.id, {
                serialNumber: instance.serialNumber,
                accessoryName: accessoryName
            });
        });
        
        console.log('🗂️ Instance lookup map:', instanceLookup);
        
        // Enrich each booking with accessory instance names
        bookings.value.forEach(booking => {
            if (booking.accessoryInstanceIds && booking.accessoryInstanceIds.length > 0) {
                console.log(`📋 Processing booking with accessory IDs: ${booking.accessoryInstanceIds}`);
                booking.accessoryInstanceNames = booking.accessoryInstanceIds.map(id => {
                    const instance = instanceLookup.get(id);
                    const result = instance ? `${instance.accessoryName} (${instance.serialNumber})` : `ID: ${id}`;
                    console.log(`🏷️ ID ${id} -> ${result}`);
                    return result;
                });
            } else {
                booking.accessoryInstanceNames = [];
            }
        });
        
        console.log('✅ Enrichment complete');
        
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
    imageUrl?: string;
    instances?: AccessoryInstance[];
}

interface AccessoryInstance {
    id: number;
    accessoryId: number;
    serialNumber: string; // Like "Mount #1", "Mount #2"
    isAvailable: boolean;
}

const accessory = ref<Accessory[]>([]);
const accessoryForm = ref({ name: '', description: '', price: 0, quantity: 1, imageUrl: '' });

async function fetchAccessory() {
    try {
        // Use authenticated fetch with JWT token
        const response = await auth.authenticatedFetch('/api/admin/accessories')
        
        if (!response.success) {
            throw new Error('Failed to fetch accessories')
        }
        
        // Transform the data and load instances for each accessory
        accessory.value = (response.data || []).map((a: any) => ({
            id: a.id,
            name: a.name,
            description: a.description || '',
            price: a.price,
            quantity: a.quantity || 1,
            imageUrl: a.imageUrl || null
        }));
        
        // Debug: Log the mapped accessory data
        console.log('🔧 Frontend mapped accessory data:', accessory.value.map(a => ({
            id: a.id,
            name: a.name,
            hasImageUrl: !!a.imageUrl,
            imageUrl: a.imageUrl
        })));
        
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
        const isEditing = !!editingAccessoryId.value;
        const accessoryName = accessoryForm.value.name;
        
        const payload: any = { 
            name: accessoryForm.value.name, 
            description: accessoryForm.value.description, 
            price: accessoryForm.value.price, 
            quantity: accessoryForm.value.quantity,
            imageUrl: accessoryForm.value.imageUrl
        };
        
        // Add ID if editing
        if (editingAccessoryId.value) {
            payload.id = editingAccessoryId.value;
        }
        
        // Use authenticated API endpoint
        const response = await auth.authenticatedFetch('/api/admin/accessories', {
            method: 'POST',
            body: payload
        });
        
        if (!response.success) {
            throw new Error(response.message || 'Failed to save accessory');
        }
        
        showAccessoryModal.value = false;
        editingAccessoryId.value = null;
        accessoryForm.value = { name: '', description: '', price: 0, quantity: 1, imageUrl: '' };
        accessoryImagePreview.value = '';
        
        // Force refresh accessories to ensure new data is loaded
        await fetchAccessory();
        await nextTick(); // Wait for Vue to update the DOM
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
        console.error('Error saving accessory:', error);
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
        // Use authenticated API endpoint
        const response = await auth.authenticatedFetch('/api/admin/accessories', {
            method: 'DELETE',
            body: { id }
        });
        
        if (!response.success) {
            throw new Error(response.message || 'Failed to delete accessory');
        }
        
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
        console.error('Error deleting accessory:', error);
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
        quantity: accessoryItem.quantity || 1,
        imageUrl: accessoryItem.imageUrl || ''
    };
    
    // Set image preview if editing and has imageUrl
    if (accessoryItem.imageUrl) {
        accessoryImagePreview.value = accessoryItem.imageUrl;
    } else {
        accessoryImagePreview.value = '';
    }
    
    console.log('🔧 Editing accessory:', {
        id: accessoryItem.id,
        name: accessoryItem.name,
        hasImageUrl: !!accessoryItem.imageUrl,
        imageUrl: accessoryItem.imageUrl
    });
    
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

// Inventory Management Functions
const exportInventoryReport = async () => {
  try {
    const response = await $fetch('/api/inventory-status');
    if (response.success) {
      // Create CSV content with proper formatting
      const headers = ['Product Name', 'Total Stock', 'Available', 'In Use', 'Status'];
      const csvRows = [
        headers.join(';'), // Use semicolon as delimiter for better Excel compatibility
        ...response.data.map((item: any) => [
          `"${item.productName}"`,
          item.inventory.total,
          item.inventory.available,
          item.inventory.inUse,
          `"${item.availabilityStatus}"`
        ].join(';'))
      ];
      
      const csvContent = csvRows.join('\r\n');
      
      // Add BOM for proper Excel encoding
      const BOM = '\uFEFF';
      const csvWithBOM = BOM + csvContent;
      
      // Download CSV
      const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      // Removed toast notification
    }
  } catch (error: any) {
    console.error('Error exporting inventory report:', error);
    // Removed toast notification
  }
};

const refreshAllInventory = async () => {
  try {
    const response = await $fetch('/api/inventory-status');
    if (response.success) {
      // Update inventory statistics
      const data = response.data;
      
      // Calculate low stock items (less than 2 available)
      lowStockItems.value = data
        .filter((item: any) => item.inventory.available > 0 && item.inventory.available < 2)
        .map((item: any) => ({
          productId: item.productId,
          productName: item.productName,
          available: item.inventory.available
        }));
      
      // Calculate out of stock items
      outOfStockItems.value = data
        .filter((item: any) => item.inventory.available === 0)
        .map((item: any) => ({
          productId: item.productId,
          productName: item.productName,
          available: item.inventory.available
        }));
      
      // Calculate utilization rate
      const totalStock = data.reduce((sum: number, item: any) => sum + item.inventory.total, 0);
      const inUse = data.reduce((sum: number, item: any) => sum + item.inventory.inUse, 0);
      utilizationRate.value = totalStock > 0 ? Math.round((inUse / totalStock) * 100) : 0;
      activeRentals.value = inUse;
      
      // Mock average rental duration (you might want to calculate this from actual booking data)
      averageRentalDuration.value = 4; // Default to 4 days
      
      // Removed toast notification
    }
  } catch (error: any) {
    console.error('Error refreshing inventory:', error);
    // Removed toast notification
  }
};

// Initialize inventory data on component mount  
refreshAllInventory();
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