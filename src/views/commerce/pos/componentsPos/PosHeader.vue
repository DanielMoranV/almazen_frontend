<script setup>
import { defineProps, defineEmits } from 'vue';

defineProps({
    currentSessionInfo: Object,
    selectedCustomer: Object,
    cartItemsCount: Number
});

defineEmits(['show-customer-dialog', 'clear-customer', 'show-cart-summary']);

const formatDateTime = (dateTime) => {
    return dateTime ? new Date(dateTime).toLocaleString('es-PE') : '--';
};
</script>

<template>
    <div class="bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex flex-wrap items-center justify-between py-3 sm:py-0 sm:h-20 gap-y-3">
                <!-- Session Info -->
                <div class="flex items-center space-x-3 sm:space-x-6">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                            <i class="pi pi-user text-white text-xl"></i>
                        </div>
                        <div>
                            <span class="font-bold text-gray-900 text-sm sm:text-lg">
                                {{ currentSessionInfo?.cashier || 'Sin sesión' }}
                            </span>
                            <div class="text-sm text-gray-500">Cajero</div>
                        </div>
                    </div>
                    <div class="hidden sm:flex items-center space-x-3 bg-gray-100 px-4 py-2 rounded-full">
                        <i class="pi pi-clock text-blue-600"></i>
                        <span class="text-sm font-medium text-gray-700">{{ currentSessionInfo ? formatDateTime(currentSessionInfo.openedAt) : '--' }}</span>
                    </div>
                </div>

                <!-- Customer and Cart Section -->
                <div class="flex items-center space-x-2 sm:space-x-4">
                    <!-- Customer Selection -->
                    <div class="flex items-center space-x-3">
                        <Button @click="$emit('show-customer-dialog')" :severity="selectedCustomer ? 'success' : 'secondary'" :outlined="!selectedCustomer" class="h-10 sm:h-14 px-2 sm:px-4 touch-manipulation" size="large">
                            <i class="pi pi-user mr-2 text-lg"></i>
                            <span class="font-semibold">
                                {{ selectedCustomer ? selectedCustomer.name.substring(0, 15) + (selectedCustomer.name.length > 15 ? '...' : '') : 'Cliente' }}
                            </span>
                        </Button>

                        <Button v-if="selectedCustomer" @click="$emit('clear-customer')" icon="pi pi-times" severity="danger" text rounded size="small" class="w-8 h-8" v-tooltip="'Quitar cliente'" />
                    </div>

                    <!-- Cart Summary -->
                    <Button @click="$emit('show-cart-summary')" class="relative h-10 sm:h-14 px-3 sm:px-6 touch-manipulation" severity="info" outlined size="large">
                        <i class="pi pi-shopping-cart mr-3 text-xl"></i>
                        <span class="font-semibold">Carrito</span>
                        <Badge v-if="cartItemsCount > 0" :value="cartItemsCount" severity="danger" class="absolute top-1 right-1" />
                    </Button>
                </div>
            </div>
        </div>
    </div>
</template>
