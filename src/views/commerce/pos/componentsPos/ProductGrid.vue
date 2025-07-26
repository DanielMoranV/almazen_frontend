<script setup>
import { defineProps, defineEmits, ref } from 'vue';

defineProps({
    isSearching: Boolean,
    filteredProducts: Array,
    searchQuery: String,
    searchResults: Array
});

defineEmits(['add-to-cart']);

// Reactive variable to track image loading errors
const imageErrors = ref({});

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: 'PEN'
    }).format(amount);
};

const handleImageError = (event) => {
    const productElement = event.target.closest('[data-product-id]');
    if (productElement) {
        const productId = productElement.getAttribute('data-product-id');
        imageErrors.value[productId] = true;
    }
};

const handleImageLoad = (event) => {
    const productElement = event.target.closest('[data-product-id]');
    if (productElement) {
        const productId = productElement.getAttribute('data-product-id');
        imageErrors.value[productId] = false;
    }
};

</script>

<template>
    <div v-if="isSearching" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <Card v-for="i in 10" :key="i" class="shadow-sm">
            <template #content>
                <div class="space-y-3">
                    <Skeleton width="100%" height="8rem" />
                    <Skeleton width="80%" height="1rem" />
                    <Skeleton width="60%" height="1rem" />
                    <Skeleton width="40%" height="1rem" />
                </div>
            </template>
        </Card>
    </div>

    <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        <Card v-for="product in filteredProducts" :key="product.id" @click="$emit('add-to-cart', product)"
            :data-product-id="product.id" class="cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl
                   active:scale-95 touch-manipulation shadow-lg border-0 bg-white/90 backdrop-blur-sm
                   hover:bg-white/95 group" :class="{
                    'opacity-60 cursor-not-allowed': product.stock === 0,
                    'ring-2 ring-red-200': product.stock === 0
                }">
            <template #content>
                <div class="p-2">
                    <!-- Product Image -->
                    <div
                        class="relative aspect-square mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden">
                        <img :src="product.image" :alt="product.name"
                            class="w-full h-full object-cover transition-all duration-300 group-hover:scale-110"
                            @error="handleImageError($event)" @load="handleImageLoad($event)"
                            v-if="product.image && !imageErrors[product.id]" />
                        <!-- Fallback -->
                        <div v-if="!product.image || imageErrors[product.id]"
                            class="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                            <div class="text-center">
                                <i class="pi pi-shopping-bag text-4xl text-blue-400 mb-2"></i>
                                <div class="text-xs text-blue-600 font-medium px-2 leading-tight">
                                    {{ product.name.length > 15 ? product.name.substring(0, 15) + '...'
                                        : product.name }}
                                </div>
                            </div>
                        </div>

                        <!-- Stock overlay for out of stock -->
                        <div v-if="product.stock === 0"
                            class="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl">
                            <Chip label="SIN STOCK" severity="danger" class="font-bold" />
                        </div>
                    </div>

                    <!-- Product Info -->
                    <div class="text-center space-y-2">
                        <h3
                            class="font-bold text-gray-900 text-sm leading-tight line-clamp-2 min-h-[2.5rem]">
                            {{ product.name }}
                        </h3>
                        <div class="text-xl font-black text-blue-600">
                            {{ formatCurrency(product.price) }}
                        </div>

                        <!-- Stock Badge -->
                        <Tag :value="`Stock: ${product.stock}`"
                            :severity="product.stock > 10 ? 'success' : product.stock > 0 ? 'warning' : 'danger'"
                            class="text-xs font-bold" />
                    </div>
                </div>
            </template>
        </Card>
    </div>

    <!-- No Products Message -->
    <div v-if="!isSearching && filteredProducts.length === 0 && searchQuery" class="text-center py-16">
        <div class="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <i class="pi pi-search text-4xl text-gray-400"></i>
        </div>
        <h3 class="text-xl font-bold text-gray-600 mb-2">No se encontraron productos</h3>
        <p class="text-gray-500">Intenta con otros términos de búsqueda</p>
    </div>

    <!-- Initial state message -->
    <div v-if="!searchQuery && searchResults.length === 0" class="text-center py-16">
        <div class="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <i class="pi pi-search text-4xl text-blue-500"></i>
        </div>
        <h3 class="text-xl font-bold text-gray-700 mb-2">Comienza buscando productos</h3>
        <p class="text-gray-500">Escribe en el campo de búsqueda para encontrar productos</p>
    </div>
</template>