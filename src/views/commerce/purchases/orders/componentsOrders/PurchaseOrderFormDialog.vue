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

const addDetail = (detail = null) => {
    form.value.details.push(
        detail || {
            product_id: null,
            batch_id: null,
            quantity: 0,
            unit_price: 0,
            total_amount: 0,
            discount_amount: 0
        }
    );
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
        :style="{ width: '95vw', maxWidth: '1100px' }"
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
            <div class="flex items-center my-6">
                <div class="flex-1 h-px bg-gray-200"></div>
                <div class="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                    <i class="pi pi-list text-blue-600"></i>
                    <span class="font-semibold">Productos de la Orden</span>
                </div>
                <div class="flex-1 h-px bg-gray-200"></div>
            </div>

            <!-- Sección de productos -->
            <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div class="flex justify-between items-center mb-4">
                    <div class="flex items-center gap-2">
                        <Badge :value="form.details.length" severity="info" v-if="form.details.length > 0" />
                        <span class="font-semibold">
                            {{ form.details.length === 0 ? 'Sin productos' : `${form.details.length} producto${form.details.length !== 1 ? 's' : ''}` }}
                        </span>
                    </div>
                    <Button label="Agregar Producto" icon="pi pi-plus" size="small" outlined @click="addDetail()" :disabled="loading" />
                </div>

                <!-- Estado vacío -->
                <div v-if="form.details.length === 0" class="text-center py-12">
                    <div class="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <i class="pi pi-inbox text-2xl text-gray-400"></i>
                    </div>
                    <h4 class="text-lg font-semibold mb-2">No hay productos agregados</h4>
                    <p class="text-gray-500 mb-4">Comienza agregando productos a tu orden de compra</p>
                    <Button label="Agregar Primer Producto" icon="pi pi-plus" @click="addDetail()" :disabled="loading" />
                </div>

                <!-- Tabla de productos -->
                <div v-else class="bg-white rounded-lg overflow-hidden">
                    <DataTable
                        :value="form.details"
                        :paginator="form.details.length > 6"
                        :rows="6"
                        :rowsPerPageOptions="[6, 12, 24]"
                        responsiveLayout="scroll"
                        size="small"
                        stripedRows
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
                    >
                        <Column field="product_id" header="Producto" style="min-width: 180px">
                            <template #body="{ data }">
                                <Select
                                    v-model="data.product_id"
                                    :options="products"
                                    optionLabel="name"
                                    optionValue="id"
                                    placeholder="Seleccionar..."
                                    filter
                                    :filterBy="filterProductsBy"
                                    size="small"
                                    class="w-full"
                                    :filterFields="['name', 'barcode', 'code', 'sku']"
                                >
                                    <template #option="slotProps">
                                        <div class="flex flex-col gap-1">
                                            <span class="font-medium">{{ slotProps.option.name }}</span>
                                            <div class="flex items-center gap-2 text-xs text-gray-500">
                                                <span v-if="slotProps.option.barcode">Código: {{ slotProps.option.barcode }}</span>
                                                <span v-if="slotProps.option.code && !slotProps.option.barcode">Código: {{ slotProps.option.code }}</span>
                                                <span v-if="slotProps.option.sku">SKU: {{ slotProps.option.sku }}</span>
                                            </div>
                                        </div>
                                    </template>
                                </Select>
                            </template>
                        </Column>

                        <Column field="quantity" header="Cant." style="width: 80px">
                            <template #body="{ data }">
                                <InputNumber v-model="data.quantity" :min="0" :step="1" placeholder="0" size="small" class="w-full" :inputClass="'text-center'" />
                            </template>
                        </Column>

                        <Column field="unit_price" header="P. Unit." style="width: 100px">
                            <template #body="{ data }">
                                <InputNumber v-model="data.unit_price" mode="currency" currency="PEN" locale="es-PE" placeholder="0.00" size="small" class="w-full" />
                            </template>
                        </Column>

                        <Column field="discount_amount" header="Desc." style="width: 90px">
                            <template #body="{ data }">
                                <InputNumber v-model="data.discount_amount" mode="currency" currency="PEN" locale="es-PE" placeholder="0.00" size="small" class="w-full" />
                            </template>
                        </Column>

                        <Column field="total_amount" header="Total" style="width: 100px">
                            <template #body="{ data }">
                                <InputNumber :modelValue="data.total_amount" mode="currency" currency="PEN" locale="es-PE" placeholder="0.00" size="small" class="w-full opacity-60" disabled />
                            </template>
                        </Column>

                        <Column header="" style="width: 50px" class="text-center">
                            <template #body="{ index }">
                                <Button icon="pi pi-trash" severity="danger" text rounded size="small" @click="removeDetail(index)" v-tooltip.top="'Eliminar'" />
                            </template>
                        </Column>
                    </DataTable>
                </div>

                <!-- Error de validación -->
                <div v-if="submitted && form.details.length === 0" class="mt-4">
                    <Message severity="error" :closable="false">
                        <i class="pi pi-exclamation-triangle mr-2"></i>
                        Debe agregar al menos un producto a la orden de compra.
                    </Message>
                </div>
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
/* Solo estilos específicos que no se pueden lograr con Tailwind */
:deep(.p-datatable-small .p-datatable-tbody > tr > td) {
    padding: 0.5rem;
}

:deep(.p-datatable-small .p-datatable-thead > tr > th) {
    padding: 0.75rem 0.5rem;
}

/* Ajustes para inputs pequeños en la tabla */
:deep(.p-inputnumber-small input) {
    padding: 0.375rem 0.5rem;
    font-size: 0.875rem;
}

:deep(.p-select-small .p-select-label) {
    padding: 0.375rem 0.5rem;
    font-size: 0.875rem;
}

/* Scrollbar personalizado */
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
</style>
