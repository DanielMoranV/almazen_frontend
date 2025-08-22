<script setup>
import { useProductsStore } from '@/stores/productsStore';
import { useProvidersStore } from '@/stores/providersStore';
import { useWarehousesStore } from '@/stores/warehousesStore';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';

const toast = useToast();

const providersStore = useProvidersStore();
const warehousesStore = useWarehousesStore();
const productsStore = useProductsStore();

const providers = computed(() => providersStore.providersList);
const warehouses = computed(() => warehousesStore.warehousesList);
const products = computed(() => productsStore.productsList);

/**
 * Función personalizada para filtrar productos por nombre, código de barras y SKU
 * @param {string} value - Término de búsqueda ingresado por el usuario
 * @param {Object} option - Objeto de producto a filtrar
 * @returns {boolean} - true si el producto coincide con la búsqueda
 */
const filterProductsBy = (value, option) => {
    if (!value) return true;

    // Depurar la estructura del objeto producto (solo para el primer producto)
    if (!window._debuggedProduct) {
        console.log('Estructura del objeto producto:', option);
        window._debuggedProduct = true;
    }

    const searchValue = value.toString().toLowerCase().trim();

    // Buscar coincidencias en nombre, barcode y SKU
    // Asegurarse de que los campos existan antes de intentar acceder a ellos
    const nameMatch = option.name?.toLowerCase().includes(searchValue);

    // Verificar si barcode existe y tiene un valor antes de buscar
    const barcodeMatch = option.barcode ? option.barcode.toString().toLowerCase().includes(searchValue) : option.code ? option.code.toString().toLowerCase().includes(searchValue) : false;

    // Verificar si sku existe y tiene un valor antes de buscar
    const skuMatch = option.sku ? option.sku.toString().toLowerCase().includes(searchValue) : false;

    return nameMatch || barcodeMatch || skuMatch;
};

const submitted = ref(false);

onMounted(async () => {
    await providersStore.fetchProviders();
    await warehousesStore.fetchWarehouses();
    await productsStore.fetchProducts();
});

const props = defineProps({
    visible: Boolean,
    loading: Boolean,
    order: {
        type: Object,
        default: null
    }
});

const emit = defineEmits(['update:visible', 'submit']);

const documenTypeList = computed(() => {
    return [
        { name: 'Factura', value: 'FACTURA' },
        { name: 'Boleta', value: 'BOLETA' },
        { name: 'Ticket', value: 'TICKET' }
    ];
});

// Detecta si el documento es factura o boleta
const isFacturaOrBoleta = computed(() => form.value.document_type === 'FACTURA' || form.value.document_type === 'BOLETA');

const form = ref({
    id: null,
    provider_id: null,
    warehouse_id: null,
    document_type: null,
    document_number: null,
    purchase_date: null,
    total_amount: 0,
    tax_amount: 0,
    discount_amount: 0,
    notes: null,
    details: []
});

// Product search states
const showProductSearchDialog = ref(false);
const searchQuery = ref('');
const searchResults = ref([]);
const searchLoading = ref(false);
const selectedProductForAdd = ref(null);
const debounceTimer = ref(null);

const filteredProducts = computed(() => {
    if (!searchQuery.value) return [];
    
    const query = searchQuery.value.toLowerCase().trim();
    return products.value.filter(product => {
        const nameMatch = product.name?.toLowerCase().includes(query);
        const barcodeMatch = product.barcode?.toLowerCase().includes(query);
        const codeMatch = product.code?.toLowerCase().includes(query);
        const skuMatch = product.sku?.toLowerCase().includes(query);
        
        return nameMatch || barcodeMatch || codeMatch || skuMatch;
    }).slice(0, 20); // Limit to 20 results for performance
});

const searchProducts = () => {
    if (debounceTimer.value) {
        clearTimeout(debounceTimer.value);
    }
    
    debounceTimer.value = setTimeout(() => {
        searchLoading.value = true;
        // Simulate search delay
        setTimeout(() => {
            searchResults.value = filteredProducts.value;
            searchLoading.value = false;
        }, 300);
    }, 500);
};

watch(searchQuery, () => {
    if (searchQuery.value.trim()) {
        searchProducts();
    } else {
        searchResults.value = [];
    }
});

// Watcher para calcular precio unitario cuando cambia el total manualmente
watch(() => form.value.details.map(d => d.total_amount), (newTotals, oldTotals) => {
    if (!newTotals || !oldTotals || isCalculatingFromTotal.value) return;
    
    newTotals.forEach((newTotal, index) => {
        const oldTotal = oldTotals[index];
        const detail = form.value.details[index];
        
        if (oldTotal !== undefined && newTotal !== oldTotal && newTotal && detail) {
            console.log(`Total cambió de ${oldTotal} a ${newTotal} para el producto ${index}`);
            // Usar setTimeout para evitar conflictos con otros watchers
            setTimeout(() => {
                calculateUnitPriceFromTotal(detail);
            }, 50);
        }
    });
});

const openProductSearch = () => {
    showProductSearchDialog.value = true;
    searchQuery.value = '';
    searchResults.value = [];
    selectedProductForAdd.value = null;
};

const selectProductForAdd = (product) => {
    selectedProductForAdd.value = product;
};

const confirmAddProduct = () => {
    if (selectedProductForAdd.value) {
        const newDetail = {
            product_id: selectedProductForAdd.value.id,
            batch_id: null,
            quantity: 1,
            unit_price: selectedProductForAdd.value.sale_price || 0,
            total_amount: selectedProductForAdd.value.sale_price || 0,
            discount_amount: 0,
            _product: selectedProductForAdd.value // Store product info for display
        };
        
        form.value.details.push(newDetail);
        showProductSearchDialog.value = false;
        const productName = selectedProductForAdd.value.name;
        selectedProductForAdd.value = null;
        searchQuery.value = '';
        
        toast.add({
            severity: 'success',
            summary: 'Producto Agregado',
            detail: `${productName} agregado a la orden`,
            life: 2000
        });
    }
};

const getProductName = (productId) => {
    const product = products.value.find(p => p.id === productId);
    return product ? product.name : 'Producto no encontrado';
};

const getProductCode = (productId) => {
    const product = products.value.find(p => p.id === productId);
    return product ? (product.barcode || product.code || product.sku) : '';
};

// Variable para evitar bucles de cálculo
const isCalculatingFromTotal = ref(false);

const calculateUnitPriceFromTotal = (detail) => {
    console.log('Calculando precio unitario desde total:', detail);
    
    if (isCalculatingFromTotal.value) {
        console.log('Ya estamos calculando, evitando bucle');
        return;
    }
    
    if (detail.total_amount && detail.quantity && detail.quantity > 0) {
        isCalculatingFromTotal.value = true;
        
        // Calcular precio unitario basado en el total
        // Total = (cantidad * precio_unitario) - descuento
        // Precio_unitario = (total + descuento) / cantidad
        const totalWithDiscount = Number(detail.total_amount) + (Number(detail.discount_amount) || 0);
        const newUnitPrice = totalWithDiscount / Number(detail.quantity);
        
        detail.unit_price = +newUnitPrice.toFixed(2);
        
        console.log('Nuevo precio unitario calculado:', detail.unit_price);
        
        toast.add({
            severity: 'info',
            summary: 'Precio Recalculado',
            detail: `Precio unitario actualizado a S/ ${detail.unit_price}`,
            life: 2000
        });
        
        // Resetear flag después de un breve delay
        setTimeout(() => {
            isCalculatingFromTotal.value = false;
        }, 200);
    } else {
        console.log('No se puede calcular: total_amount =', detail.total_amount, 'quantity =', detail.quantity);
        
        if (!detail.quantity || detail.quantity <= 0) {
            toast.add({
                severity: 'warn',
                summary: 'Cantidad Requerida',
                detail: 'Ingrese una cantidad válida para calcular el precio unitario',
                life: 3000
            });
        }
    }
};

const addDetail = (detail = null) => {
    if (detail) {
        form.value.details.push(detail);
    } else {
        openProductSearch();
    }
};

const removeDetail = (index) => {
    form.value.details.splice(index, 1);
};

const resetForm = () => {
    form.value = {
        id: null,
        provider_id: null,
        warehouse_id: null,
        document_type: null,
        document_number: null,
        purchase_date: null,
        total_amount: 0,
        tax_amount: 0,
        discount_amount: 0,
        notes: null,
        details: []
    };
};

const isFormValid = computed(() => {
    return form.value.provider_id && form.value.warehouse_id && form.value.document_type && form.value.document_number && form.value.purchase_date && form.value.total_amount && form.value.details.length > 0;
});

watch(
    () => props.order,
    (order) => {
        if (order) {
            form.value = { ...order };
        } else {
            resetForm();
        }
    },
    { immediate: true }
);

const handleSubmit = () => {
    submitted.value = true;
    if (isFormValid.value) {
        emit('submit', form.value);
        resetForm();
    }
};

const handleCancel = () => {
    emit('update:visible', false);
    resetForm();
};
// --- Autocálculo de totales y descuentos ---
// Autocálculo de IGV incluido en boleta/factura
watch([() => form.value.total_amount, () => form.value.document_type], ([total]) => {
    if (isFacturaOrBoleta.value && total > 0) {
        const base = +(total / 1.18).toFixed(2);
        const igv = +(total - base).toFixed(2);
        form.value.tax_amount = igv;
    }
});
watch(
    () => form.value.details.map((d) => [d.quantity, d.unit_price, d.discount_amount]),
    () => {
        // No ejecutar si estamos calculando desde el total
        if (isCalculatingFromTotal.value) {
            return;
        }
        
        let totalGeneral = 0;
        let totalDescuentos = 0;
        form.value.details.forEach((detail) => {
            const qty = Number(detail.quantity) || 0;
            const price = Number(detail.unit_price) || 0;
            let descuento = Number(detail.discount_amount) || 0;
            const bruto = +(qty * price).toFixed(2);
            // Validar: descuento no mayor al subtotal
            if (descuento > bruto) {
                descuento = bruto;
                detail.discount_amount = bruto;
                toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'El descuento no puede ser mayor al subtotal',
                    life: 3000
                });
            }
            // El total del detalle es bruto - descuento, nunca menor a 0
            detail.total_amount = Math.max(+(bruto - descuento).toFixed(2), 0);
            totalGeneral += detail.total_amount;
            totalDescuentos += descuento;
        });
        // Descuentos generales: suma de descuentos de los detalles
        // Validar: descuento general no mayor al total bruto
        let totalBruto = form.value.details.reduce((sum, d) => sum + Number(d.quantity) * Number(d.unit_price), 0);
        if (totalDescuentos > totalBruto) {
            totalDescuentos = totalBruto;
            form.value.discount_amount = +totalBruto.toFixed(2);
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: 'El descuento general no puede ser mayor al total bruto',
                life: 3000
            });
        } else {
            form.value.discount_amount = +totalDescuentos.toFixed(2);
        }
        // Total general: suma de netos de los detalles (ya incluye IGV)
        let igv = Number(form.value.tax_amount) || 0;
        // Validar: IGV no puede ser negativo
        if (igv < 0) igv = 0;
        form.value.tax_amount = igv;
        form.value.total_amount = +totalGeneral.toFixed(2);
    },
    { deep: true }
);
// Si cambia el IGV, recalcula el total_amount general
watch(
    () => form.value.tax_amount,
    () => {
        let totalGeneral = form.value.details.reduce((sum, d) => sum + (Number(d.quantity) * Number(d.unit_price) - (Number(d.discount_amount) || 0)), 0);
        let igv = Number(form.value.tax_amount) || 0;
        // Validar: IGV no puede ser negativo
        if (igv < 0) igv = 0;
        form.value.tax_amount = igv;
        form.value.total_amount = +totalGeneral.toFixed(2);
    }
);
</script>

<template>
    <Dialog
        :visible="visible"
        @update:visible="(val) => emit('update:visible', val)"
        :style="{ width: '95vw', maxWidth: '1200px' }"
        :header="form.id ? 'Editar Orden de Compra' : 'Nueva Orden de Compra'"
        :modal="true"
        class="p-fluid"
        :breakpoints="{ '1024px': '90vw', '768px': '95vw' }"
        :draggable="false"
        :resizable="false"
    >
        <div class="relative max-h-[70vh] overflow-y-auto p-4">
            <!-- Loading Skeleton -->
            <div v-if="loading" class="absolute inset-0 z-20 bg-white/80 flex flex-col justify-center items-center">
                <div class="w-full space-y-3">
                    <Skeleton width="90%" height="2.5rem" borderRadius="12px" />
                    <Skeleton width="60%" height="2.5rem" borderRadius="12px" />
                    <Skeleton width="100%" height="10rem" borderRadius="12px" />
                    <Skeleton width="100%" height="3.5rem" borderRadius="12px" />
                </div>
            </div>

            <!-- Información básica -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <!-- Proveedor -->
                <div class="flex flex-col gap-2">
                    <label class="flex items-center gap-2 font-semibold text-sm after:content-['*'] after:text-red-500">
                        <i class="pi pi-building text-gray-500 text-xs"></i>
                        Proveedor
                    </label>
                    <Select v-model="form.provider_id" :options="providers" optionLabel="name" optionValue="id" placeholder="Seleccionar proveedor" :class="{ 'p-invalid': submitted && !form.provider_id }" filter showClear />
                    <small class="p-error" v-if="submitted && !form.provider_id">Requerido</small>
                </div>

                <!-- Almacén -->
                <div class="flex flex-col gap-2">
                    <label class="flex items-center gap-2 font-semibold text-sm after:content-['*'] after:text-red-500">
                        <i class="pi pi-home text-gray-500 text-xs"></i>
                        Almacén
                    </label>
                    <Select v-model="form.warehouse_id" :options="warehouses" optionLabel="name" optionValue="id" placeholder="Seleccionar almacén" :class="{ 'p-invalid': submitted && !form.warehouse_id }" filter showClear />
                    <small class="p-error" v-if="submitted && !form.warehouse_id">Requerido</small>
                </div>

                <!-- Tipo de Documento -->
                <div class="flex flex-col gap-2">
                    <label class="flex items-center gap-2 font-semibold text-sm after:content-['*'] after:text-red-500">
                        <i class="pi pi-file text-gray-500 text-xs"></i>
                        Tipo de Documento
                    </label>
                    <Select v-model="form.document_type" :options="documenTypeList" optionLabel="name" optionValue="value" placeholder="Tipo documento" :class="{ 'p-invalid': submitted && !form.document_type }" />
                    <small class="p-error" v-if="submitted && !form.document_type">Requerido</small>
                </div>

                <!-- N° Documento -->
                <div class="flex flex-col gap-2">
                    <label class="flex items-center gap-2 font-semibold text-sm after:content-['*'] after:text-red-500">
                        <i class="pi pi-hashtag text-gray-500 text-xs"></i>
                        N° Documento
                    </label>
                    <InputText v-model="form.document_number" placeholder="001-001-000001" :class="{ 'p-invalid': submitted && !form.document_number }" />
                    <small class="p-error" v-if="submitted && !form.document_number">Requerido</small>
                </div>

                <!-- Fecha de Compra -->
                <div class="flex flex-col gap-2">
                    <label class="flex items-center gap-2 font-semibold text-sm after:content-['*'] after:text-red-500">
                        <i class="pi pi-calendar text-gray-500 text-xs"></i>
                        Fecha de Compra
                    </label>
                    <DatePicker v-model="form.purchase_date" :class="{ 'p-invalid': submitted && !form.purchase_date }" dateFormat="dd/mm/yy" showIcon />
                    <small class="p-error" v-if="submitted && !form.purchase_date">Requerido</small>
                </div>

                <!-- Total -->
                <div class="flex flex-col gap-2">
                    <label class="flex items-center gap-2 font-semibold text-sm after:content-['*'] after:text-red-500">
                        <i class="pi pi-money-bill text-gray-500 text-xs"></i>
                        Total
                    </label>
                    <InputNumber v-model="form.total_amount" :class="{ 'p-invalid': submitted && !form.total_amount }" mode="currency" currency="PEN" locale="es-PE" placeholder="0.00" />
                    <small class="p-error" v-if="submitted && !form.total_amount">Requerido</small>
                </div>

                <!-- IGV -->
                <div class="flex flex-col gap-2">
                    <label class="flex items-center gap-2 font-semibold text-sm">
                        <i class="pi pi-percentage text-gray-500 text-xs"></i>
                        IGV
                    </label>
                    <InputNumber v-model="form.tax_amount" mode="currency" currency="PEN" locale="es-PE" placeholder="0.00" :disabled="isFacturaOrBoleta" />
                </div>

                <!-- Descuento -->
                <div class="flex flex-col gap-2">
                    <label class="flex items-center gap-2 font-semibold text-sm">
                        <i class="pi pi-minus-circle text-gray-500 text-xs"></i>
                        Descuento
                    </label>
                    <InputNumber v-model="form.discount_amount" mode="currency" currency="PEN" locale="es-PE" placeholder="0.00" />
                </div>

                <!-- Notas (span completo) -->
                <div class="flex flex-col gap-2 md:col-span-2">
                    <label class="flex items-center gap-2 font-semibold text-sm">
                        <i class="pi pi-comment text-gray-500 text-xs"></i>
                        Notas
                    </label>
                    <Textarea v-model="form.notes" placeholder="Observaciones adicionales..." :rows="2" :autoResize="true" />
                </div>
            </div>

            <!-- Separador -->
            <div class="flex items-center my-8">
                <div class="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                <div class="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-sm">
                    <i class="pi pi-shopping-cart text-blue-600 text-lg"></i>
                    <span class="font-bold text-gray-800">Productos de la Orden</span>
                </div>
                <div class="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
            </div>

            <!-- Sección de productos -->
            <div class="bg-gray-50 rounded-xl p-6 border border-gray-200 space-y-6">
                <!-- Header -->
                <div class="flex justify-between items-center">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <i class="pi pi-box text-blue-600 text-lg"></i>
                        </div>
                        <div>
                            <h3 class="font-semibold text-gray-900">Productos de la Orden</h3>
                            <p class="text-sm text-gray-500">
                                {{ form.details.length === 0 ? 'Sin productos agregados' : `${form.details.length} producto${form.details.length !== 1 ? 's' : ''}` }}
                            </p>
                        </div>
                    </div>
                    <Button 
                        label="Buscar Producto" 
                        icon="pi pi-search" 
                        @click="openProductSearch()" 
                        :disabled="loading"
                        class="px-4 py-2 bg-blue-500 hover:bg-blue-600 border-0 transition-all duration-200"
                    />
                </div>

                <!-- Estado vacío -->
                <div v-if="form.details.length === 0" class="text-center py-16">
                    <div class="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center">
                        <i class="pi pi-shopping-cart text-3xl text-blue-500"></i>
                    </div>
                    <h4 class="text-xl font-semibold mb-3 text-gray-900">¡Comienza agregando productos!</h4>
                    <p class="text-gray-500 mb-6 max-w-md mx-auto">Busca y selecciona los productos que necesitas para tu orden de compra</p>
                    <Button 
                        label="Buscar Productos" 
                        icon="pi pi-search" 
                        @click="openProductSearch()" 
                        :disabled="loading"
                        class="px-6 py-3 text-lg bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 border-0 transition-all duration-200 shadow-lg"
                    />
                </div>

                <!-- Lista de productos -->
                <div v-else class="space-y-4">
                    <TransitionGroup name="product-card" tag="div" class="space-y-4">
                        <div 
                            v-for="(detail, index) in form.details" 
                            :key="index"
                            class="bg-white rounded-xl p-6 border border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-sm group"
                        >
                            <div class="space-y-4">
                                <!-- Información del Producto -->
                                <div class="flex items-center justify-between">
                                    <div class="flex-1">
                                        <h4 class="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-lg">
                                            {{ getProductName(detail.product_id) }}
                                        </h4>
                                        <p class="text-sm text-gray-500 mt-1" v-if="getProductCode(detail.product_id)">
                                            📦 {{ getProductCode(detail.product_id) }}
                                        </p>
                                    </div>
                                    
                                    <!-- Acción de eliminar -->
                                    <Button 
                                        icon="pi pi-trash" 
                                        severity="danger" 
                                        text 
                                        rounded 
                                        size="small" 
                                        @click="removeDetail(index)" 
                                        v-tooltip.top="'Eliminar producto'"
                                        class="opacity-60 hover:opacity-100 transition-opacity ml-4"
                                    />
                                </div>

                                <!-- Campos de entrada organizados en grid más espacioso -->
                                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <!-- Cantidad -->
                                    <div class="space-y-2">
                                        <label class="block text-sm font-semibold text-gray-700">
                                            <i class="pi pi-hashtag text-gray-500 mr-1"></i>
                                            Cantidad
                                            <span class="text-xs text-red-500 font-normal ml-1">*</span>
                                        </label>
                                        <InputNumber 
                                            v-model="detail.quantity" 
                                            :min="1" 
                                            :step="1" 
                                            placeholder="1" 
                                            class="w-full" 
                                            :inputClass="'text-center font-medium text-lg'"
                                            :showButtons="true"
                                            buttonLayout="horizontal"
                                            :incrementButtonClass="'bg-blue-50 text-blue-600 hover:bg-blue-100'"
                                            :decrementButtonClass="'bg-gray-50 text-gray-600 hover:bg-gray-100'"
                                        />
                                        <p class="text-xs text-gray-500 mt-1">
                                            📝 Necesaria para calcular precio unitario
                                        </p>
                                    </div>

                                    <!-- Precio Unitario -->
                                    <div class="space-y-2">
                                        <label class="block text-sm font-semibold text-gray-700">
                                            <i class="pi pi-money-bill text-gray-500 mr-1"></i>
                                            Precio Unitario
                                            <span class="text-xs text-gray-500 font-normal ml-1">(auto-calc)</span>
                                        </label>
                                        <InputNumber 
                                            v-model="detail.unit_price" 
                                            mode="currency" 
                                            currency="PEN" 
                                            locale="es-PE" 
                                            placeholder="0.00" 
                                            class="w-full"
                                            :inputClass="'text-lg'"
                                        />
                                        <p class="text-xs text-gray-500 mt-1">
                                            🔄 Se calcula automáticamente desde el total
                                        </p>
                                    </div>

                                    <!-- Descuento -->
                                    <div class="space-y-2">
                                        <label class="block text-sm font-semibold text-gray-700">
                                            <i class="pi pi-minus-circle text-gray-500 mr-1"></i>
                                            Descuento
                                        </label>
                                        <InputNumber 
                                            v-model="detail.discount_amount" 
                                            mode="currency" 
                                            currency="PEN" 
                                            locale="es-PE" 
                                            placeholder="0.00" 
                                            class="w-full"
                                            :inputClass="'text-lg'"
                                        />
                                    </div>

                                    <!-- Total -->
                                    <div class="space-y-2">
                                        <label class="block text-sm font-semibold text-gray-700">
                                            <i class="pi pi-calculator text-gray-500 mr-1"></i>
                                            Total
                                            <span class="text-xs text-gray-500 font-normal ml-1">(editable)</span>
                                        </label>
                                        <InputNumber 
                                            v-model="detail.total_amount" 
                                            mode="currency" 
                                            currency="PEN" 
                                            locale="es-PE" 
                                            placeholder="0.00" 
                                            class="w-full"
                                            :inputClass="'text-lg font-bold text-green-700'"
                                        />
                                        <p class="text-xs text-gray-500 mt-1">
                                            💡 Al cambiar el total se recalcula el precio unitario
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TransitionGroup>
                </div>

                <!-- Agregar más productos -->
                <div v-if="form.details.length > 0" class="text-center pt-4 border-t border-gray-200">
                    <Button 
                        label="Agregar Otro Producto" 
                        icon="pi pi-plus" 
                        @click="openProductSearch()" 
                        :disabled="loading"
                        outlined
                        class="px-6 py-2 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
                    />
                </div>
            </div>

            <!-- Product Search Dialog -->
            <Dialog 
                v-model:visible="showProductSearchDialog" 
                :style="{ width: '90vw', maxWidth: '800px', maxHeight: '80vh' }" 
                header="🔍 Buscar y Seleccionar Producto" 
                :modal="true" 
                class="product-search-dialog"
                :draggable="false"
                :resizable="false"
            >
                <div class="space-y-6">
                    <!-- Search Input -->
                    <div class="relative">
                        <div class="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                            <i class="pi pi-search text-gray-400"></i>
                        </div>
                        <InputText 
                            v-model="searchQuery" 
                            placeholder="Buscar por nombre, código de barras, código o SKU..." 
                            class="w-full pl-10 pr-4 py-3 text-lg border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                            :class="{ 'border-blue-300': searchQuery }"
                        />
                    </div>

                    <!-- Search Tips -->
                    <div v-if="!searchQuery" class="text-center py-12">
                        <div class="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center">
                            <i class="pi pi-info-circle text-2xl text-blue-500"></i>
                        </div>
                        <h3 class="text-lg font-semibold mb-2">¿Cómo buscar productos?</h3>
                        <div class="text-gray-600 space-y-2">
                            <p>• Escribe el nombre del producto</p>
                            <p>• Ingresa el código de barras</p>
                            <p>• Usa el código interno o SKU</p>
                        </div>
                    </div>

                    <!-- Loading State -->
                    <div v-else-if="searchLoading" class="text-center py-12">
                        <ProgressSpinner class="w-12 h-12" strokeWidth="3" />
                        <p class="mt-4 text-gray-600">Buscando productos...</p>
                    </div>

                    <!-- No Results -->
                    <div v-else-if="searchQuery && filteredProducts.length === 0" class="text-center py-12">
                        <div class="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
                            <i class="pi pi-search text-2xl text-gray-400"></i>
                        </div>
                        <h3 class="text-lg font-semibold mb-2">Sin resultados</h3>
                        <p class="text-gray-600">No encontramos productos que coincidan con "{{ searchQuery }}"</p>
                    </div>

                    <!-- Search Results -->
                    <div v-else-if="filteredProducts.length > 0" class="space-y-4">
                        <div class="flex items-center justify-between">
                            <h3 class="font-semibold text-gray-900">Resultados de búsqueda</h3>
                            <Badge :value="filteredProducts.length" severity="info" />
                        </div>
                        
                        <div class="max-h-96 overflow-y-auto space-y-3 pr-2">
                            <div 
                                v-for="product in filteredProducts" 
                                :key="product.id"
                                @click="selectProductForAdd(product)"
                                :class="[
                                    'border-2 rounded-xl p-4 cursor-pointer transition-all duration-200',
                                    selectedProductForAdd?.id === product.id 
                                        ? 'border-blue-500 bg-blue-50' 
                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                ]"
                            >
                                <div class="flex items-center justify-between">
                                    <div class="flex-1">
                                        <h4 class="font-semibold text-gray-900 mb-1">{{ product.name }}</h4>
                                        <div class="flex items-center gap-4 text-sm text-gray-600">
                                            <span v-if="product.barcode || product.code">📦 {{ product.barcode || product.code }}</span>
                                            <span v-if="product.sku">🏷️ {{ product.sku }}</span>
                                            <span v-if="product.sale_price" class="font-medium text-green-600">S/ {{ product.sale_price }}</span>
                                        </div>
                                    </div>
                                    <div class="flex items-center">
                                        <div v-if="selectedProductForAdd?.id === product.id" class="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-2">
                                            <i class="pi pi-check text-white text-xs"></i>
                                        </div>
                                        <i class="pi pi-angle-right text-gray-400"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <template #footer>
                    <div class="flex justify-between items-center">
                        <div class="text-sm text-gray-600">
                            {{ selectedProductForAdd ? `Seleccionado: ${selectedProductForAdd.name}` : 'Selecciona un producto para continuar' }}
                        </div>
                        <div class="flex gap-3">
                            <Button 
                                label="Cancelar" 
                                icon="pi pi-times" 
                                text 
                                severity="secondary" 
                                @click="showProductSearchDialog = false" 
                            />
                            <Button 
                                label="Agregar Producto" 
                                icon="pi pi-plus" 
                                @click="confirmAddProduct()" 
                                :disabled="!selectedProductForAdd"
                                class="bg-blue-500 hover:bg-blue-600 border-0"
                            />
                        </div>
                    </div>
                </template>
            </Dialog>

            <!-- Error de validación -->
            <div v-if="submitted && form.details.length === 0" class="mt-6">
                <Message severity="error" :closable="false" class="rounded-xl">
                    <div class="flex items-center gap-3">
                        <i class="pi pi-exclamation-triangle text-red-500"></i>
                        <div>
                            <p class="font-semibold">Productos requeridos</p>
                            <p class="text-sm opacity-90">Debe agregar al menos un producto a la orden de compra.</p>
                        </div>
                    </div>
                </Message>
            </div>
        </div>

        <!-- Footer -->
        <template #footer>
            <div class="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t">
                <small class="text-gray-500 flex items-center gap-1">
                    <i class="pi pi-info-circle"></i>
                    {{ isFormValid ? 'Orden lista para guardar' : 'Complete los campos requeridos' }}
                </small>
                <div class="flex gap-3">
                    <Button label="Cancelar" icon="pi pi-times" text severity="secondary" @click="handleCancel" />
                    <Button :label="form.id ? 'Actualizar Orden' : 'Crear Orden'" icon="pi pi-check" :loading="loading" :disabled="!isFormValid" @click="handleSubmit" />
                </div>
            </div>
        </template>
    </Dialog>
</template>

<style scoped>
/* Product card animations */
.product-card-enter-active,
.product-card-leave-active {
    transition: all 0.3s ease;
}

.product-card-enter-from {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
}

.product-card-leave-to {
    opacity: 0;
    transform: translateX(20px) scale(0.95);
}

.product-card-move {
    transition: transform 0.3s ease;
}

/* Enhanced input focus states */
:deep(.p-inputtext:focus) {
    border-color: #3b82f6 !important;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
}

:deep(.p-inputnumber:focus-within) {
    border-color: #3b82f6 !important;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
}

/* Button hover effects */
:deep(.p-button:hover) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

:deep(.p-button:active) {
    transform: translateY(0);
}

/* Custom scrollbar */
.overflow-y-auto::-webkit-scrollbar {
    width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
    background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
    background: #e5e7eb;
    border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
}

/* Dialog animations */
:deep(.product-search-dialog .p-dialog) {
    animation: slideInDown 0.3s ease-out;
}

@keyframes slideInDown {
    from {
        opacity: 0;
        transform: translateY(-50px) scale(0.95);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

/* Enhanced card hover effects */
.group:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

/* Modern input number buttons */
:deep(.p-inputnumber-button) {
    border-radius: 8px !important;
    border: 1px solid #e5e7eb !important;
    transition: all 0.2s ease !important;
}

:deep(.p-inputnumber-button:hover) {
    transform: scale(1.05) !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
}

/* Enhanced select focus */
:deep(.p-select:focus) {
    border-color: #3b82f6 !important;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
}

/* Modern datepicker styling */
:deep(.p-datepicker:focus) {
    border-color: #3b82f6 !important;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
}

/* Textarea focus enhancement */
:deep(.p-textarea:focus) {
    border-color: #3b82f6 !important;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
}
</style>
