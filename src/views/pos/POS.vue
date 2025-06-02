<script setup>
import { ref, computed, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useAuthStore } from '@/stores/authStore';

const toast = useToast();
const authStore = useAuthStore();
const loading = ref(false);
const searchQuery = ref('');
const activeSession = ref(null);
const products = ref([]);
const cart = ref([]);
const paymentMethod = ref('efectivo');
const paymentMethods = ref([
    { name: 'Efectivo', value: 'efectivo' },
    { name: 'Tarjeta de Crédito', value: 'credito' },
    { name: 'Tarjeta de Débito', value: 'debito' },
    { name: 'Transferencia', value: 'transferencia' }
]);

// Productos de ejemplo
const mockProducts = [
    { id: 1, name: 'Producto 1', price: 100, stock: 50, image: '/demo/images/product/product-placeholder.svg' },
    { id: 2, name: 'Producto 2', price: 200, stock: 30, image: '/demo/images/product/product-placeholder.svg' },
    { id: 3, name: 'Producto 3', price: 150, stock: 20, image: '/demo/images/product/product-placeholder.svg' },
    { id: 4, name: 'Producto 4', price: 300, stock: 10, image: '/demo/images/product/product-placeholder.svg' },
    { id: 5, name: 'Producto 5', price: 250, stock: 15, image: '/demo/images/product/product-placeholder.svg' },
    { id: 6, name: 'Producto 6', price: 180, stock: 25, image: '/demo/images/product/product-placeholder.svg' }
];

onMounted(() => {
    products.value = mockProducts;
    checkActiveSession();
    toast.add({ severity: 'info', summary: 'Información', detail: 'Punto de venta cargado', life: 3000 });
});

const checkActiveSession = () => {
    // Simulación de verificación de sesión activa
    setTimeout(() => {
        activeSession.value = {
            id: 1,
            cashier: authStore.currentUser?.name || 'Usuario',
            openedAt: new Date().toLocaleString(),
            initialAmount: 1000
        };
    }, 500);
};

const filteredProducts = computed(() => {
    if (!searchQuery.value) return products.value;
    
    return products.value.filter(product => 
        product.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
});

const addToCart = (product) => {
    const existingItem = cart.value.find(item => item.id === product.id);
    
    if (existingItem) {
        if (existingItem.quantity < product.stock) {
            existingItem.quantity++;
        } else {
            toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'Stock insuficiente', life: 3000 });
        }
    } else {
        cart.value.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            subtotal: product.price
        });
    }
    
    updateCartTotals();
};

const removeFromCart = (index) => {
    cart.value.splice(index, 1);
    updateCartTotals();
};

const updateQuantity = (item, newQuantity) => {
    const product = products.value.find(p => p.id === item.id);
    
    if (newQuantity <= 0) {
        const index = cart.value.findIndex(i => i.id === item.id);
        if (index !== -1) {
            cart.value.splice(index, 1);
        }
    } else if (newQuantity <= product.stock) {
        item.quantity = newQuantity;
        item.subtotal = item.price * newQuantity;
    } else {
        toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'Stock insuficiente', life: 3000 });
    }
    
    updateCartTotals();
};

const updateCartTotals = () => {
    cart.value.forEach(item => {
        item.subtotal = item.price * item.quantity;
    });
};

const cartTotal = computed(() => {
    return cart.value.reduce((total, item) => total + item.subtotal, 0);
});

const processPayment = () => {
    if (cart.value.length === 0) {
        toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'El carrito está vacío', life: 3000 });
        return;
    }
    
    loading.value = true;
    
    // Simulación de procesamiento de pago
    setTimeout(() => {
        toast.add({ 
            severity: 'success', 
            summary: 'Éxito', 
            detail: `Venta procesada correctamente. Método de pago: ${paymentMethod.value}`,
            life: 3000 
        });
        
        cart.value = [];
        loading.value = false;
    }, 1500);
};
</script>

<template>
    <div class="grid">
        <div class="col-12">
            <div class="card">
                <div class="flex flex-column md:flex-row">
                    <!-- Información de sesión -->
                    <div class="w-full md:w-3 flex align-items-center p-3 border-round bg-primary-50">
                        <div v-if="activeSession" class="w-full">
                            <h5 class="mb-2">Sesión Activa</h5>
                            <div class="text-sm">
                                <div><strong>Cajero:</strong> {{ activeSession.cashier }}</div>
                                <div><strong>Apertura:</strong> {{ activeSession.openedAt }}</div>
                                <div><strong>Monto Inicial:</strong> ${{ activeSession.initialAmount }}</div>
                            </div>
                        </div>
                        <div v-else class="w-full text-center">
                            <i class="pi pi-spin pi-spinner text-xl"></i>
                            <p>Verificando sesión...</p>
                        </div>
                    </div>
                    
                    <!-- Título y búsqueda -->
                    <div class="w-full md:w-9 p-3">
                        <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                            <h5 class="m-0">Punto de Venta</h5>
                            <span class="p-input-icon-left w-full md:w-4">
                                <i class="pi pi-search" />
                                <input type="text" v-model="searchQuery" class="p-inputtext p-component w-full" placeholder="Buscar productos..." />
                            </span>
                        </div>
                    </div>
                </div>
                
                <div class="grid">
                    <!-- Productos -->
                    <div class="col-12 md:col-8">
                        <div class="card">
                            <h6>Productos</h6>
                            <div class="grid">
                                <div v-for="product in filteredProducts" :key="product.id" class="col-6 md:col-4 lg:col-3">
                                    <div class="card m-2 border-1 surface-border cursor-pointer" @click="addToCart(product)">
                                        <div class="flex flex-column align-items-center">
                                            <img :src="product.image" :alt="product.name" class="w-9 shadow-2 my-3 mx-0" />
                                            <div class="text-center">
                                                <h6 class="mb-1">{{ product.name }}</h6>
                                                <h6 class="text-primary font-bold">${{ product.price }}</h6>
                                                <span class="product-badge status-instock">Stock: {{ product.stock }}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Carrito -->
                    <div class="col-12 md:col-4">
                        <div class="card">
                            <h6>Carrito</h6>
                            <div v-if="cart.length === 0" class="text-center p-4">
                                <i class="pi pi-shopping-cart text-4xl text-500 mb-3"></i>
                                <p>El carrito está vacío</p>
                            </div>
                            <div v-else>
                                <ul class="list-none p-0 m-0">
                                    <li v-for="(item, index) in cart" :key="index" class="flex flex-column md:flex-row md:align-items-center p-2 border-bottom-1 surface-border">
                                        <div class="flex-1">
                                            <span class="font-medium">{{ item.name }}</span>
                                            <div class="text-500">${{ item.price }} x {{ item.quantity }}</div>
                                        </div>
                                        <div class="flex align-items-center mt-2 md:mt-0">
                                            <button class="p-button p-component p-button-icon-only p-button-rounded p-button-text p-button-sm" @click="updateQuantity(item, item.quantity - 1)">
                                                <span class="p-button-icon pi pi-minus"></span>
                                            </button>
                                            <span class="mx-2">{{ item.quantity }}</span>
                                            <button class="p-button p-component p-button-icon-only p-button-rounded p-button-text p-button-sm" @click="updateQuantity(item, item.quantity + 1)">
                                                <span class="p-button-icon pi pi-plus"></span>
                                            </button>
                                            <button class="p-button p-component p-button-icon-only p-button-rounded p-button-danger p-button-text p-button-sm ml-2" @click="removeFromCart(index)">
                                                <span class="p-button-icon pi pi-trash"></span>
                                            </button>
                                        </div>
                                    </li>
                                </ul>
                                
                                <div class="flex justify-content-between align-items-center mt-4 p-2">
                                    <span class="font-bold">Total:</span>
                                    <span class="text-xl font-bold">${{ cartTotal }}</span>
                                </div>
                                
                                <div class="mt-3">
                                    <label class="block mb-2">Método de Pago</label>
                                    <select v-model="paymentMethod" class="p-inputtext p-component w-full mb-3">
                                        <option v-for="method in paymentMethods" :key="method.value" :value="method.value">
                                            {{ method.name }}
                                        </option>
                                    </select>
                                    
                                    <button class="p-button p-component w-full" :disabled="loading" @click="processPayment">
                                        <span v-if="loading" class="pi pi-spin pi-spinner mr-2"></span>
                                        <span class="p-button-label">Procesar Pago</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.cursor-pointer {
    cursor: pointer;
}

.product-badge {
    border-radius: 2px;
    padding: 0.25em 0.5rem;
    text-transform: uppercase;
    font-weight: 700;
    font-size: 12px;
    letter-spacing: 0.3px;
}

.status-instock {
    background: #C8E6C9;
    color: #256029;
}
</style>
