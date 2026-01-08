<script setup>
import DiscountCodeInput from '@/components/discounts/DiscountCodeInput.vue';
import DiscountSummary from '@/components/discounts/DiscountSummary.vue';
import { defineEmits, defineProps, ref } from 'vue';

defineProps({
    cart: Array,
    cartItemsCount: Number,
    cartTotal: Number,
    canOperateWithoutSession: Boolean,
    loading: Boolean,
    showCartSummary: Boolean,
    // Discount Props
    hasDiscount: Boolean,
    discountInfo: Object,
    validating: Boolean,
    discountError: String
});

defineEmits(['update:showCartSummary', 'remove-from-cart', 'update-quantity', 'clear-cart', 'open-multiple-payment-dialog', 'apply-discount', 'remove-discount', 'toggle-promotion']);

const discountInput = ref('');
const showDiscountInput = ref(false);

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: 'PEN'
    }).format(amount);
};
</script>

<template>
    <div class="hidden lg:block h-full">
        <Card class="h-full shadow-md border-0 bg-white/90 backdrop-blur-sm flex flex-col" :pt="{ body: 'p-0 h-full flex flex-col', content: 'p-0 flex-1 flex flex-col overflow-hidden' }">
            <template #header>
                <div class="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-3 rounded-t-lg shrink-0">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-2">
                            <i class="pi pi-shopping-cart text-lg"></i>
                            <span class="text-base font-bold">Carrito</span>
                        </div>
                        <Badge :value="cartItemsCount" severity="contrast" v-if="cartItemsCount > 0" class="text-sm px-2" />
                    </div>
                </div>
            </template>

            <template #content>
                <!-- Empty Cart -->
                <div v-if="cart.length === 0" class="text-center py-10 flex flex-col items-center justify-center h-full">
                    <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                        <i class="pi pi-shopping-cart text-3xl text-gray-400"></i>
                    </div>
                    <h4 class="font-bold text-gray-600 text-sm mb-1">Tu carrito está vacío</h4>
                    <p class="text-gray-500 text-xs">Agrega productos para vender</p>
                </div>

                <!-- Cart Items Container -->
                <div v-else class="flex flex-col h-full">
                    <!-- Scrollable Items Area -->
                    <div class="flex-1 overflow-y-auto p-2 space-y-2 min-h-0">
                        <div v-for="(item, index) in cart" :key="index" class="bg-gray-50 p-2 rounded-lg border border-gray-200 hover:border-blue-200 transition-colors">
                            <div class="flex items-start justify-between mb-2">
                                <div class="flex-1 min-w-0 pr-2">
                                    <h5 class="font-bold text-gray-800 truncate text-xs mb-0.5" :title="item.name">
                                        {{ item.name }}
                                    </h5>
                                    
                                    <!-- Price Display -->
                                    <div v-if="item.applied_promotion" class="flex flex-col leading-none">
                                        <div class="flex items-center gap-1.5 flex-wrap">
                                            <span class="text-blue-600 font-bold text-xs">
                                                {{ formatCurrency(item.price) }}
                                            </span>
                                            <span class="text-[10px] text-gray-400 line-through">
                                                {{ formatCurrency(item.base_price || item.price) }}
                                            </span>
                                        </div>
                                        <small class="text-[10px] text-green-600 font-medium flex items-center mt-0.5">
                                            <i class="pi pi-bolt text-[9px] mr-1"></i> 
                                            <span class="truncate max-w-[100px]">{{ item.applied_promotion.name }}</span>
                                            <Button 
                                                icon="pi pi-times" 
                                                text 
                                                rounded 
                                                size="small" 
                                                class="h-4 w-4 ml-1 !p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                                                v-tooltip.top="'Quitar promoción'"
                                                @click.stop="$emit('toggle-promotion', item)"
                                            />
                                        </small>
                                    </div>
                                    <div v-else-if="item.promotions && item.promotions.length > 0" class="flex flex-col leading-none">
                                         <p class="text-blue-600 font-bold text-xs">
                                            {{ formatCurrency(item.price) }}
                                        </p>
                                        <small class="text-[10px] text-gray-400 font-medium flex items-center mt-0.5">
                                            <span>Promo disponible</span>
                                             <Button 
                                                icon="pi pi-bolt" 
                                                text 
                                                rounded 
                                                size="small" 
                                                class="h-4 w-4 ml-1 !p-0 text-green-400 hover:text-green-600 hover:bg-green-50"
                                                v-tooltip.top="'Aplicar promoción'"
                                                @click.stop="$emit('toggle-promotion', item)"
                                            />
                                        </small>
                                    </div>
                                    <p v-else class="text-blue-600 font-bold text-xs leading-none mt-0.5">
                                        {{ formatCurrency(item.price) }}
                                    </p>
                                </div>
                                <Button @click="$emit('remove-from-cart', index)" icon="pi pi-trash" size="small" severity="danger" text rounded class="h-6 w-6 !p-0 hover:bg-red-50" />
                            </div>

                            <div class="flex items-center justify-between">
                                <div class="flex items-center bg-white rounded border h-7">
                                    <Button @click="$emit('update-quantity', item, item.quantity - 1)" icon="pi pi-minus" size="small" text class="w-7 h-full !p-0 text-gray-600 hover:bg-gray-100 rounded-l" />
                                    <span class="w-8 text-center font-bold text-sm bg-gray-50 h-full flex items-center justify-center border-x border-dashed">{{ item.quantity }}</span>
                                    <Button @click="$emit('update-quantity', item, item.quantity + 1)" icon="pi pi-plus" size="small" text class="w-7 h-full !p-0 text-gray-600 hover:bg-gray-100 rounded-r" />
                                </div>
                                <div class="text-right">
                                    <div class="text-sm font-black text-green-600">
                                        {{ formatCurrency(item.subtotal) }}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Footer Section (Fixed at bottom) -->
                    <div class="p-3 bg-white border-t border-gray-100 shrink-0 space-y-2">
                        <!-- Discount Section -->
                       <div class="space-y-1.5">
                            <label class="font-bold text-gray-600 text-xs flex items-center gap-1 cursor-pointer hover:text-gray-800" @click="showDiscountInput = !showDiscountInput">
                                 <i class="pi pi-ticket text-emerald-500 text-xs"></i> 
                                 <span>{{ hasDiscount ? 'Descuento Aplicado' : 'Aplicar Descuento' }}</span>
                                 <i class="pi text-[10px]" :class="showDiscountInput || hasDiscount ? 'pi-chevron-up' : 'pi-chevron-down'"></i>
                            </label>
                            
                            <div v-if="showDiscountInput || hasDiscount" class="space-y-1">
                                <DiscountCodeInput
                                    v-if="!hasDiscount"
                                    v-model="discountInput"
                                    :loading="validating"
                                    @apply="$emit('apply-discount', $event)"
                                    class="scale-95 origin-left"
                                />
                                <small v-if="discountError" class="text-red-500 text-[10px] block">{{ discountError }}</small>
                                
                                <DiscountSummary
                                    v-if="hasDiscount"
                                    :discount="discountInfo"
                                    @remove="$emit('remove-discount')"
                                />
                            </div>
                       </div>

                        <div class="bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <div class="flex justify-between items-center">
                                <span class="text-sm font-bold text-gray-700">Total:</span>
                                <span class="text-2xl font-black text-blue-600">{{ formatCurrency(cartTotal) }}</span>
                            </div>
                        </div>

                        <!-- Actions -->
                        <div class="grid grid-cols-4 gap-2">
                             <Button @click="$emit('clear-cart')" icon="pi pi-trash" severity="secondary" outlined class="col-span-1 h-10" v-tooltip.top="'Limpiar'" />
                            <Button
                                @click="$emit('open-multiple-payment-dialog')"
                                label="COBRAR"
                                :disabled="!canOperateWithoutSession"
                                icon="pi pi-credit-card"
                                class="col-span-3 h-10 text-base font-bold"
                                severity="success"
                                :loading="loading"
                            />
                        </div>
                    </div>
                </div>
            </template>
        </Card>
    </div>

    <!-- Mobile Cart Dialog -->
    <Dialog
        :visible="showCartSummary"
        @update:visible="$emit('update:showCartSummary', $event)"
        header="Carrito de Compras"
        :modal="true"
        class="lg:hidden"
        :style="{ width: '95vw', maxWidth: '500px' }"
        :pt="{
            header: 'bg-gradient-to-r from-green-600 to-emerald-600 text-white',
            content: 'p-6'
        }"
    >
        <template #header>
            <div class="flex items-center space-x-3">
                <i class="pi pi-shopping-cart text-xl"></i>
                <span class="text-xl font-bold">Mi Carrito</span>
                <Badge :value="cartItemsCount" severity="contrast" v-if="cartItemsCount > 0" />
            </div>
        </template>

        <!-- Mobile Cart Content -->
        <div v-if="cart.length === 0" class="text-center py-12">
            <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i class="pi pi-shopping-cart text-4xl text-gray-400"></i>
            </div>
            <h4 class="font-bold text-gray-600 mb-2">El carrito está vacío</h4>
            <p class="text-gray-500 text-sm">Añade productos para comenzar</p>
        </div>

        <div v-else class="space-y-4">
            <div v-for="(item, index) in cart" :key="index" class="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
                <div class="flex items-start justify-between mb-3">
                    <div class="flex-1 min-w-0">
                        <h5 class="font-bold text-gray-900 truncate">{{ item.name }}</h5>
                        <div v-if="item.applied_promotion" class="flex flex-col">
                            <div class="flex items-center gap-2">
                                <span class="text-blue-600 font-semibold">
                                    {{ formatCurrency(item.price) }}
                                </span>
                                <span class="text-xs text-gray-400 line-through">
                                    {{ formatCurrency(item.base_price || item.price) }}
                                </span>
                            </div>
                            <small class="text-xs text-green-600 font-medium flex items-center justify-between">
                                <span><i class="pi pi-bolt text-[10px]"></i> {{ item.applied_promotion.name }}</span>
                                <Button 
                                    icon="pi pi-times" 
                                    text 
                                    rounded 
                                    size="small" 
                                    class="h-4 w-4 ml-1 !p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                                    @click.stop="$emit('toggle-promotion', item)"
                                />
                            </small>
                        </div>
                        <div v-else-if="item.promotions && item.promotions.length > 0" class="flex flex-col">
                                <p class="text-blue-600 font-semibold text-sm">
                                {{ formatCurrency(item.price) }}
                            </p>
                            <small class="text-xs text-gray-400 font-medium flex items-center">
                                <span>Promo disponible</span>
                                    <Button 
                                    icon="pi pi-bolt" 
                                    text 
                                    rounded 
                                    size="small" 
                                    class="h-4 w-4 ml-1 !p-0 text-green-400 hover:text-green-600 hover:bg-green-50"
                                    @click.stop="$emit('toggle-promotion', item)"
                                />
                            </small>
                        </div>
                        <p v-else class="text-blue-600 font-semibold">{{ formatCurrency(item.price) }}</p>
                    </div>
                    <Button @click="$emit('remove-from-cart', index)" icon="pi pi-trash" size="small" severity="danger" text rounded class="ml-2" />
                </div>

                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-2 bg-white rounded-lg p-1 border">
                        <Button @click="$emit('update-quantity', item, item.quantity - 1)" icon="pi pi-minus" size="small" text rounded class="w-10 h-10" />
                        <span class="w-8 text-center font-bold text-lg">{{ item.quantity }}</span>
                        <Button @click="$emit('update-quantity', item, item.quantity + 1)" icon="pi pi-plus" size="small" text rounded class="w-10 h-10" />
                    </div>
                    <div class="text-right">
                        <div class="text-lg font-black text-green-600">
                            {{ formatCurrency(item.subtotal) }}
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                 <label class="font-bold text-gray-700 text-sm flex items-center gap-2">
                      <i class="pi pi-ticket text-emerald-600"></i> Descuentos
                 </label>
                 
                 <DiscountCodeInput
                     v-if="!hasDiscount"
                     v-model="discountInput"
                     :loading="validating"
                     @apply="$emit('apply-discount', $event)"
                 />
                 <small v-if="discountError" class="text-red-500 text-xs block mt-1">{{ discountError }}</small>
                 
                 <DiscountSummary
                     v-if="hasDiscount"
                     :discount="discountInfo"
                     @remove="$emit('remove-discount')"
                 />
            </div>

            <Divider class="my-6" />

            <div class="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-200">
                <div class="flex justify-between items-center">
                    <span class="text-xl font-bold text-gray-800">Total:</span>
                    <span class="text-3xl font-black text-blue-600">{{ formatCurrency(cartTotal) }}</span>
                </div>
            </div>

            <div class="space-y-3 pt-4">
                <Button
                    @click="
                        $emit('open-multiple-payment-dialog');
                        $emit('update:showCartSummary', false);
                    "
                    label="Procesar Pago"
                    :disabled="!canOperateWithoutSession"
                    icon="pi pi-credit-card"
                    class="w-full h-14 text-lg font-bold"
                    size="large"
                    severity="success"
                    :loading="loading"
                />
                <Button @click="$emit('clear-cart')" label="Limpiar Carrito" icon="pi pi-trash" severity="secondary" outlined class="w-full h-12" />
            </div>
        </div>
    </Dialog>
</template>
