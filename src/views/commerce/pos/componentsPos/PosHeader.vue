<script setup>
import { defineEmits, defineProps } from 'vue';

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
    <div class="bg-white/90 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-0 z-40 h-14 sm:h-16">
        <div class="max-w-full mx-auto px-3 sm:px-6 h-full">
            <div class="flex items-center justify-between h-full gap-x-4">
                <!-- Session Info -->
                <div class="flex items-center space-x-3 sm:space-x-4 min-w-0">
                    <div class="flex items-center space-x-2">
                        <div class="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shrink-0">
                            <i class="pi pi-user text-white text-sm sm:text-base"></i>
                        </div>
                        <div class="min-w-0">
                            <div class="font-bold text-gray-900 text-xs sm:text-sm truncate leading-tight">
                                {{ currentSessionInfo?.cashier || 'Sin sesión' }}
                            </div>
                            <div class="text-[10px] sm:text-xs text-gray-500 hidden sm:block">Cajero</div>
                        </div>
                    </div>
                    <div class="hidden md:flex items-center space-x-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                        <i class="pi pi-clock text-blue-600 text-xs"></i>
                        <span class="text-xs font-medium text-gray-700">{{ currentSessionInfo ? formatDateTime(currentSessionInfo.openedAt) : '--' }}</span>
                    </div>
                </div>

                <!-- Customer and Cart Section -->
                <div class="flex items-center space-x-2">
                    <!-- Customer Selection -->
                    <div class="flex items-center space-x-1 sm:space-x-2">
                        <Button @click="$emit('show-customer-dialog')" :severity="selectedCustomer ? 'success' : 'secondary'" :outlined="!selectedCustomer" class="h-9 sm:h-10 px-3 sm:px-4 text-sm" size="small">
                            <i class="pi pi-user mr-2 text-sm sm:text-base"></i>
                            <span class="font-semibold max-w-[80px] sm:max-w-[120px] truncate">
                                {{ selectedCustomer ? selectedCustomer.name : 'Cliente' }}
                            </span>
                        </Button>

                        <Button v-if="selectedCustomer" @click="$emit('clear-customer')" icon="pi pi-times" severity="danger" text rounded size="small" class="w-8 h-8 !p-0" v-tooltip="'Quitar cliente'" />
                    </div>

                    <!-- Cart Summary (Mobile only mainly, or redundant if cart sidebar is visible) -->
                    <Button @click="$emit('show-cart-summary')" class="relative h-9 sm:h-10 px-3 lg:hidden" severity="info" outlined size="small">
                        <i class="pi pi-shopping-cart text-lg"></i>
                        <Badge v-if="cartItemsCount > 0" :value="cartItemsCount" severity="danger" class="absolute -top-1 -right-1" />
                    </Button>
                </div>
            </div>
        </div>
    </div>
</template>
