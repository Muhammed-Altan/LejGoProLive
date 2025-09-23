<template>
  <div class="container mx-auto p-8">
    <h1 class="text-3xl font-bold mb-6">Database Schema Debug</h1>
    
    <div class="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 class="text-xl font-semibold mb-4">Product Table Structure</h2>
      
      <div v-if="loading" class="text-blue-600">
        Loading table structure...
      </div>
      
      <div v-else-if="error" class="text-red-600">
        Error: {{ error }}
      </div>
      
      <div v-else>
        <h3 class="font-semibold mb-2">Sample Product Data:</h3>
        <pre class="bg-gray-100 p-4 rounded text-sm overflow-auto">{{ JSON.stringify(sampleProduct, null, 2) }}</pre>
        
        <h3 class="font-semibold mb-2 mt-4">Available Columns:</h3>
        <ul class="list-disc list-inside">
          <li v-for="column in availableColumns" :key="column" class="text-gray-700">
            {{ column }}
          </li>
        </ul>
      </div>
      
      <button @click="checkSchema" class="bg-blue-500 text-white px-4 py-2 rounded mt-4">
        Refresh Schema Info
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const loading = ref(true);
const error = ref<string | null>(null);
const sampleProduct = ref<any>(null);
const availableColumns = ref<string[]>([]);

const checkSchema = async () => {
  try {
    loading.value = true;
    error.value = null;
    
    const supabase = useSupabase();
    
    // Try to get one product to see the structure
    const { data, error: supabaseError } = await supabase
      .from('Product')
      .select('*')
      .limit(1);
    
    if (supabaseError) {
      throw supabaseError;
    }
    
    if (data && data.length > 0) {
      sampleProduct.value = data[0];
      availableColumns.value = Object.keys(data[0]);
    } else {
      sampleProduct.value = null;
      availableColumns.value = [];
      error.value = "No products found in table";
    }
    
  } catch (err: any) {
    error.value = err.message || 'Unknown error occurred';
    console.error('Error checking schema:', err);
  } finally {
    loading.value = false;
  }
};

// Check schema on component mount
onMounted(() => {
  checkSchema();
});
</script>