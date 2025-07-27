<script setup>
import { defineProps, defineEmits, ref, watch } from 'vue';

const props = defineProps({
    searchQuery: String,
    isSearching: Boolean,
    warehousesList: Array,
    isLoadingWarehouses: Boolean,
    selectedWarehouse: [String, Number],
    filteredProducts: Array
});

const emit = defineEmits(['update:searchQuery', 'update:selectedWarehouse', 'search-products']);

// Initialize internal search query with parent prop value
const internalSearchQuery = ref(props.searchQuery || '');

// Watch for changes in parent prop to sync internal state
watch(
    () => props.searchQuery,
    (newValue) => {
        if (newValue !== internalSearchQuery.value) {
            internalSearchQuery.value = newValue || '';
        }
    }
);

watch(internalSearchQuery, (newValue) => {
    emit('update:searchQuery', newValue);
});

const clearSearch = () => {
    internalSearchQuery.value = '';
    emit('update:searchQuery', '');
    emit('search-products', '');
};
</script>

<template>
    <Panel
        header="Buscar Productos"
        class="shadow-xl border-0 bg-white/90 backdrop-blur-sm"
        :pt="{
            header: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg',
            content: 'p-6'
        }"
    >
        <template #icons>
            <i class="pi pi-search text-white"></i>
        </template>

        <div class="space-y-6">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Enhanced Search -->
                <div class="lg:col-span-2">
                    <label class="block text-sm font-bold text-gray-700 mb-3">
                        <i class="pi pi-search mr-2 text-blue-600"></i>
                        Búsqueda de productos
                    </label>
                    <div class="relative">
                        <InputText
                            v-model="internalSearchQuery"
                            placeholder="Escribe el nombre del producto, código o SKU..."
                            class="w-full text-lg py-4 pl-14 pr-12 border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-200/50 rounded-xl transition-all duration-300 shadow-sm hover:border-blue-300 hover:shadow-md bg-white/80 backdrop-blur-sm"
                        />
                        <div v-if="isSearching" class="absolute right-4 top-1/2 transform -translate-y-1/2">
                            <ProgressSpinner class="w-6 h-6" stroke-width="4" />
                        </div>
                    </div>
                    <div class="flex items-center mt-2 text-xs text-gray-600">
                        <i class="pi pi-info-circle mr-1 text-blue-500"></i>
                        Búsqueda en tiempo real - mínimo 3 caracteres
                    </div>
                </div>

                <!-- Enhanced Warehouse Filter -->
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-3">
                        <i class="pi pi-building mr-2 text-blue-600"></i>
                        Almacén preferido
                    </label>
                    <Select
                        :modelValue="selectedWarehouse"
                        @update:modelValue="$emit('update:selectedWarehouse', $event)"
                        :options="warehousesList"
                        option-label="name"
                        option-value="id"
                        placeholder="Todos los almacenes..."
                        class="w-full"
                        :loading="isLoadingWarehouses"
                        checkmark
                        highlight-on-select
                        :pt="{
                            root: 'border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 rounded-xl shadow-sm transition-all duration-300 bg-white/80 backdrop-blur-sm',
                            input: 'py-3 px-4 text-base font-medium',
                            dropdown: 'p-3'
                        }"
                    />
                    <div class="flex items-center mt-2 text-xs text-gray-600">
                        <i class="pi pi-bookmark mr-1 text-blue-500"></i>
                        Se guarda tu preferencia automáticamente
                    </div>
                </div>
            </div>

            <!-- Search Stats -->
            <div v-if="searchQuery" class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 px-6 py-4 rounded-xl">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <i class="pi pi-chart-bar text-blue-600"></i>
                        </div>
                        <div>
                            <div class="font-bold text-blue-900">{{ filteredProducts.length }} productos encontrados</div>
                            <div v-if="selectedWarehouse" class="text-sm text-blue-700">
                                en <span class="font-semibold">{{ warehousesList.find((w) => w.id === selectedWarehouse)?.name }}</span>
                            </div>
                        </div>
                    </div>
                    <Button @click="clearSearch" icon="pi pi-times" size="small" text rounded severity="secondary" class="hover:bg-blue-100 transition-colors duration-200" v-tooltip="'Limpiar búsqueda'" />
                </div>
            </div>
        </div>
    </Panel>
</template>
