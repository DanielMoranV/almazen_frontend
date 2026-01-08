<script setup>
import { defineEmits, defineProps, ref } from 'vue';

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
    <div v-if="isSearching" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
        <Card v-for="i in 10" :key="i" class="shadow-sm">
            <template #content>
                <div class="space-y-2">
                    <Skeleton width="100%" height="6rem" />
                    <Skeleton width="80%" height="0.8rem" />
                    <Skeleton width="60%" height="0.8rem" />
                    <Skeleton width="40%" height="0.8rem" />
                </div>
            </template>
        </Card>
    </div>

    <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
        <Card
            v-for="product in filteredProducts"
            :key="product.id"
            @click="$emit('add-to-cart', product)"
            :data-product-id="product.id"
            class="cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95 touch-manipulation shadow-sm border border-gray-100 bg-white hover:bg-white/95 group min-h-[140px]"
            :class="{
                'opacity-60 cursor-not-allowed': product.stock === 0,
                'ring-1 ring-red-200': product.stock === 0,
                'ring-1 ring-purple-200': product.promotions && product.promotions.length > 0
            }"
            :pt="{ content: 'p-0' }"
        >
            <template #content>
                <div class="p-2 flex flex-col h-full">
                    <!-- Product Image -->
                    <div class="relative w-full aspect-[4/3] mb-2 bg-gray-50 rounded-lg overflow-hidden shrink-0">
                        <img
                            :src="product.image_url"
                            :alt="product.name"
                            class="w-full h-full object-cover transition-all duration-300 group-hover:scale-110"
                            @error="handleImageError($event)"
                            @load="handleImageLoad($event)"
                            v-if="product.image_url && !imageErrors[product.id]"
                        />
                        <!-- Fallback -->
                        <div v-if="!product.image_url || imageErrors[product.id]" class="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
                            <div class="text-center">
                                <i class="pi pi-shopping-bag text-2xl text-blue-300 mb-1"></i>
                                <div class="text-[10px] text-blue-600 font-medium px-1 leading-tight line-clamp-2">
                                    {{ product.name }}
                                </div>
                            </div>
                        </div>

                        <!-- Stock overlay for out of stock -->
                        <div v-if="product.stock === 0" class="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <span class="text-white text-[10px] font-bold px-2 py-1 bg-red-500 rounded">AGOTADO</span>
                        </div>

                         <!-- Promotion Badge -->
                        <div v-if="product.promotions && product.promotions.length > 0" class="absolute top-1 right-1 flex flex-col items-end gap-1">
                             <div class="bg-yellow-400 text-yellow-900 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm flex items-center gap-1">
                                <i class="pi pi-bolt text-[8px]"></i> OFERTA
                             </div>
                        </div>
                    </div>

                    <!-- Product Info -->
                    <div class="text-center mt-auto flex flex-col justify-end">
                        <h3 class="font-bold text-gray-800 text-xs leading-tight line-clamp-2 min-h-[2rem] mb-1" :title="product.name">
                            {{ product.name }}
                        </h3>
                        
                        <div v-if="product.promotions && product.promotions.length > 0" class="flex flex-col items-center leading-none">
                             <div class="text-[10px] text-gray-400 line-through">
                                {{ formatCurrency(product.price) }}
                            </div>
                             <div class="text-sm font-black text-purple-600">
                                {{ formatCurrency(Math.min(product.price, ...product.promotions.map(p => parseFloat(p.price)))) }}
                            </div>
                        </div>
                        <div v-else class="text-sm font-black text-blue-600">
                            {{ formatCurrency(product.price) }}
                        </div>

                        <!-- Stock Badge -->
                         <div class="mt-1">
                            <span class="text-[10px] font-medium px-1.5 py-0.5 rounded-full" :class="product.stock > 10 ? 'bg-green-100 text-green-700' : product.stock > 0 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'">
                                Stock: {{ product.stock }}
                            </span>
                         </div>
                    </div>
                </div>
            </template>
        </Card>
    </div>

    <!-- No Products Message -->
    <div v-if="!isSearching && filteredProducts.length === 0 && searchQuery" class="text-center py-10">
        <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="pi pi-search text-2xl text-gray-400"></i>
        </div>
        <h3 class="text-lg font-bold text-gray-600 mb-1">No se encontraron productos</h3>
        <p class="text-xs text-gray-500">Intenta con otros términos de búsqueda</p>
    </div>

    <!-- Initial state message -->
    <div v-if="!searchQuery && searchResults.length === 0" class="text-center py-10">
        <div class="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="pi pi-search text-2xl text-blue-400"></i>
        </div>
        <h3 class="text-lg font-bold text-gray-700 mb-1">Buscar productos</h3>
        <p class="text-xs text-gray-500">Escribe para encontrar productos</p>
    </div>
</template>
