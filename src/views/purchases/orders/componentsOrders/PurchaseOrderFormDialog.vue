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
watch([() => form.value.total_amount, () => form.value.document_type], ([total, docType]) => {
    if (isFacturaOrBoleta.value && total > 0) {
        const base = +(total / 1.18).toFixed(2);
        const igv = +(total - base).toFixed(2);
        form.value.tax_amount = igv;
        // (Opcional: podrías guardar la base imponible si quieres mostrarla)
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
                // TODO: mostrar advertencia visual al usuario
                toast.add({ severity: 'error', summary: 'Error', detail: 'El descuento no puede ser mayor al subtotal', life: 3000 });
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
            // TODO: mostrar advertencia visual al usuario
            toast.add({ severity: 'error', summary: 'Error', detail: 'El descuento general no puede ser mayor al total bruto', life: 3000 });
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
        class="p-fluid purchase-order-dialog"
        :breakpoints="{ '1024px': '90vw', '768px': '95vw' }"
        :draggable="false"
        :resizable="false"
    >
        <div class="purchase-order-form" style="position: relative">
            <div v-if="loading" class="form-skeleton-overlay">
                <div class="form-skeleton-content">
                    <Skeleton width="90%" height="2.5rem" class="mb-3" borderRadius="12px" />
                    <Skeleton width="60%" height="2.5rem" class="mb-3" borderRadius="12px" />
                    <Skeleton width="100%" height="10rem" class="mb-3" borderRadius="12px" />
                    <Skeleton width="100%" height="3.5rem" class="mb-3" borderRadius="12px" />
                    <Skeleton width="100%" height="3.5rem" class="mb-3" borderRadius="12px" />
                    <Skeleton width="100%" height="2.5rem" class="mb-3" borderRadius="12px" />
                    <Skeleton width="100%" height="4rem" class="mb-3" borderRadius="12px" />
                </div>
                <div class="form-skeleton-footer">
                    <Skeleton width="120px" height="2.5rem" class="mr-2" borderRadius="8px" />
                    <Skeleton width="180px" height="2.5rem" borderRadius="8px" />
                </div>
            </div>
            <!-- Información básica compacta -->
            <div class="basic-info-grid">
                <!-- Fila 1: Proveedor y Almacén -->
                <div class="field-group">
                    <label class="required-field">
                        <i class="pi pi-building"></i>
                        Proveedor
                    </label>
                    <Select v-model="form.provider_id" :options="providers" optionLabel="name" optionValue="id" placeholder="Seleccionar proveedor" :class="{ 'p-invalid': submitted && !form.provider_id }" filter showClear class="compact-select" />
                    <small class="p-error" v-if="submitted && !form.provider_id">Requerido</small>
                </div>

                <div class="field-group">
                    <label class="required-field">
                        <i class="pi pi-home"></i>
                        Almacén
                    </label>
                    <Select v-model="form.warehouse_id" :options="warehouses" optionLabel="name" optionValue="id" placeholder="Seleccionar almacén" :class="{ 'p-invalid': submitted && !form.warehouse_id }" filter showClear class="compact-select" />
                    <small class="p-error" v-if="submitted && !form.warehouse_id">Requerido</small>
                </div>

                <!-- Fila 2: Documento y Fecha -->
                <div class="field-group">
                    <label class="required-field">
                        <i class="pi pi-file"></i>
                        Tipo de Documento
                    </label>
                    <Select v-model="form.document_type" :options="documenTypeList" optionLabel="name" optionValue="value" placeholder="Tipo documento" :class="{ 'p-invalid': submitted && !form.document_type }" class="compact-select" />
                    <small class="p-error" v-if="submitted && !form.document_type">Requerido</small>
                </div>

                <div class="field-group">
                    <label class="required-field">
                        <i class="pi pi-hashtag"></i>
                        N° Documento
                    </label>
                    <InputText v-model="form.document_number" placeholder="001-001-000001" :class="{ 'p-invalid': submitted && !form.document_number }" class="compact-input" />
                    <small class="p-error" v-if="submitted && !form.document_number">Requerido</small>
                </div>

                <!-- Fila 3: Fecha y Montos -->
                <div class="field-group">
                    <label class="required-field">
                        <i class="pi pi-calendar"></i>
                        Fecha de Compra
                    </label>
                    <DatePicker v-model="form.purchase_date" :class="{ 'p-invalid': submitted && !form.purchase_date }" dateFormat="dd/mm/yy" showIcon class="compact-datepicker" />
                    <small class="p-error" v-if="submitted && !form.purchase_date">Requerido</small>
                </div>

                <div class="field-group">
                    <label class="required-field">
                        <i class="pi pi-money-bill"></i>
                        Total
                    </label>
                    <InputNumber v-model="form.total_amount" :class="{ 'p-invalid': submitted && !form.total_amount }" mode="currency" currency="PEN" locale="es-PE" placeholder="0.00" class="compact-number" />
                    <small class="p-error" v-if="submitted && !form.total_amount">Requerido</small>
                </div>

                <!-- Fila 4: Montos adicionales -->
                <div class="field-group">
                    <label>
                        <i class="pi pi-percentage"></i>
                        IGV
                    </label>
                    <InputNumber v-model="form.tax_amount" mode="currency" currency="PEN" locale="es-PE" placeholder="0.00" class="compact-number" :disabled="isFacturaOrBoleta" />
                </div>

                <div class="field-group">
                    <label>
                        <i class="pi pi-minus-circle"></i>
                        Descuento
                    </label>
                    <InputNumber v-model="form.discount_amount" mode="currency" currency="PEN" locale="es-PE" placeholder="0.00" class="compact-number" />
                </div>

                <!-- Fila 5: Notas (span completo) -->
                <div class="field-group notes-field">
                    <label>
                        <i class="pi pi-comment"></i>
                        Notas
                    </label>
                    <Textarea v-model="form.notes" placeholder="Observaciones adicionales..." :rows="2" :autoResize="true" class="compact-textarea" />
                </div>
            </div>

            <!-- Separador visual -->
            <div class="section-divider">
                <div class="divider-line"></div>
                <div class="divider-content">
                    <i class="pi pi-list"></i>
                    <span>Productos de la Orden</span>
                </div>
                <div class="divider-line"></div>
            </div>

            <!-- Tabla de productos optimizada -->
            <div class="products-section">
                <div class="products-header">
                    <div class="products-title">
                        <Badge :value="form.details.length" severity="info" v-if="form.details.length > 0" />
                        <span>{{ form.details.length === 0 ? 'Sin productos' : `${form.details.length} producto${form.details.length !== 1 ? 's' : ''}` }}</span>
                    </div>
                    <Button label="Agregar Producto" icon="pi pi-plus" size="small" outlined @click="addDetail()" :disabled="loading" />
                </div>

                <div class="products-content">
                    <!-- Estado vacío optimizado -->
                    <div class="empty-state" v-if="form.details.length === 0">
                        <div class="empty-icon">
                            <i class="pi pi-inbox"></i>
                        </div>
                        <div class="empty-text">
                            <h4>No hay productos agregados</h4>
                            <p>Comienza agregando productos a tu orden de compra</p>
                        </div>
                        <Button label="Agregar Primer Producto" icon="pi pi-plus" @click="addDetail()" :disabled="loading" />
                    </div>

                    <!-- Tabla compacta -->
                    <div class="products-table" v-else>
                        <DataTable
                            :value="form.details"
                            :paginator="form.details.length > 6"
                            :rows="6"
                            :rowsPerPageOptions="[6, 12, 24]"
                            responsiveLayout="scroll"
                            size="small"
                            class="compact-table"
                            stripedRows
                            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
                        >
                            <Column field="product_id" header="Producto" style="min-width: 200px">
                                <template #body="{ data }">
                                    <Select v-model="data.product_id" :options="products" optionLabel="name" optionValue="id" placeholder="Seleccionar..." filter size="small" class="table-select" />
                                </template>
                            </Column>

                            <Column field="quantity" header="Cant." style="width: 100px">
                                <template #body="{ data }">
                                    <InputNumber v-model="data.quantity" :min="0" :step="1" placeholder="0" size="small" unstyled class="table-number" />
                                </template>
                            </Column>

                            <Column field="unit_price" header="P. Unit." style="width: 120px">
                                <template #body="{ data }">
                                    <InputNumber v-model="data.unit_price" mode="currency" currency="PEN" locale="es-PE" placeholder="0.00" size="small" class="table-currency" />
                                </template>
                            </Column>

                            <Column field="total_amount" header="Total" style="width: 120px">
                                <template #body="{ data }">
                                    <InputNumber :modelValue="data.total_amount" mode="currency" currency="PEN" locale="es-PE" placeholder="0.00" size="small" class="table-currency" disabled />
                                </template>
                            </Column>

                            <Column field="discount_amount" header="Desc." style="width: 100px">
                                <template #body="{ data }">
                                    <InputNumber v-model="data.discount_amount" mode="currency" currency="PEN" locale="es-PE" placeholder="0.00" size="small" class="table-currency" />
                                </template>
                            </Column>

                            <Column header="" style="width: 60px">
                                <template #body="{ index }">
                                    <Button icon="pi pi-trash" severity="danger" text rounded size="small" @click="removeDetail(index)" v-tooltip.top="'Eliminar'" class="delete-btn" />
                                </template>
                            </Column>
                        </DataTable>
                    </div>
                </div>

                <!-- Error de validación -->
                <div v-if="submitted && form.details.length === 0" class="validation-error">
                    <Message severity="error" :closable="false">
                        <i class="pi pi-exclamation-triangle mr-2"></i>
                        Debe agregar al menos un producto a la orden de compra.
                    </Message>
                </div>
            </div>
        </div>

        <!-- Footer optimizado -->
        <template #footer>
            <div class="dialog-footer">
                <div class="footer-info">
                    <small class="text-muted">
                        <i class="pi pi-info-circle mr-1"></i>
                        {{ isFormValid ? 'Orden lista para guardar' : 'Complete los campos requeridos' }}
                    </small>
                </div>
                <div class="footer-actions">
                    <Button label="Cancelar" icon="pi pi-times" text severity="secondary" @click="handleCancel" />
                    <Button :label="form.id ? 'Actualizar Orden' : 'Crear Orden'" icon="pi pi-check" :loading="loading" :disabled="!isFormValid" @click="handleSubmit" />
                </div>
            </div>
        </template>
    </Dialog>
</template>

<style scoped>
.purchase-order-dialog {
    --primary: #2563eb;
    --primary-50: #eff6ff;
    --surface: #ffffff;
    --surface-50: #f8fafc;
    --surface-100: #f1f5f9;
    --surface-200: #e2e8f0;
    --text: #0f172a;
    --text-secondary: #64748b;
    --border: #e2e8f0;
    --danger: #dc2626;
    --success: #16a34a;
    --radius: 8px;
    --spacing: 1rem;
}

.purchase-order-form {
    max-height: 70vh;
    overflow-y: auto;
    padding: 1rem;
    position: relative;
}
.form-skeleton-overlay {
    position: absolute;
    z-index: 20;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.82);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    pointer-events: all;
}
.form-skeleton-content {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.7rem;
    margin-bottom: 2.5rem;
}
.form-skeleton-footer {
    width: 100%;
    display: flex;
    justify-content: flex-end;
    gap: 1.5rem;
    margin-top: 1.5rem;
}

/* Grid básico optimizado */
.basic-info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem 1.5rem;
    margin-bottom: 2rem;
}

.field-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.notes-field {
    grid-column: 1 / -1;
}

.field-group label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    font-size: 0.875rem;
    color: var(--text);
    margin: 0;
}

.field-group label i {
    color: var(--text-secondary);
    font-size: 0.8rem;
    width: 14px;
}

.required-field::after {
    content: ' *';
    color: var(--danger);
    font-weight: bold;
}

/* Componentes compactos */
.compact-select,
.compact-input,
.compact-datepicker,
.compact-number,
.compact-textarea {
    font-size: 0.875rem;
}

:deep(.compact-select .p-select-label) {
    padding: 0.5rem 0.75rem;
}

:deep(.compact-input) {
    padding: 0.5rem 0.75rem;
}

.p-error {
    font-size: 0.75rem;
    margin-top: 0.25rem;
}

/* Separador visual */
.section-divider {
    display: flex;
    align-items: center;
    margin: 2rem 0 1.5rem;
    gap: 1rem;
}

.divider-line {
    flex: 1;
    height: 1px;
    background: var(--border);
}

.divider-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: var(--surface-50);
    border-radius: var(--radius);
    font-weight: 600;
    color: var(--text);
    border: 1px solid var(--border);
}

.divider-content i {
    color: var(--primary);
}

/* Sección de productos */
.products-section {
    background: var(--surface-50);
    border-radius: var(--radius);
    padding: 1rem;
    border: 1px solid var(--border);
}

.products-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.products-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    color: var(--text);
}

/* Estado vacío mejorado */
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 3rem 1rem;
    text-align: center;
    background: var(--surface);
    border-radius: var(--radius);
    border: 2px dashed var(--border);
}

.empty-icon {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: var(--surface-100);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1rem;
}

.empty-icon i {
    font-size: 2rem;
    color: var(--text-secondary);
}

.empty-text h4 {
    margin: 0 0 0.5rem;
    color: var(--text);
    font-size: 1.1rem;
}

.empty-text p {
    margin: 0 0 1.5rem;
    color: var(--text-secondary);
    font-size: 0.875rem;
}

/* Tabla compacta */
.products-table {
    background: var(--surface);
    border-radius: var(--radius);
    overflow: hidden;
}

:deep(.compact-table) {
    font-size: 0.875rem;
}

:deep(.compact-table .p-datatable-thead > tr > th) {
    padding: 0.75rem 0.5rem;
    background: var(--surface-100);
    font-weight: 600;
    font-size: 0.8rem;
    border-bottom: 1px solid var(--border);
}

:deep(.compact-table .p-datatable-tbody > tr > td) {
    padding: 0.5rem;
    border-bottom: 1px solid var(--surface-200);
}

.table-select,
.table-number,
.table-currency {
    width: 100%;
}

:deep(.table-select .p-select-label) {
    padding: 0.4rem 0.6rem;
    font-size: 0.8rem;
}

:deep(.table-number input, .table-currency input) {
    padding: 0.4rem 0.6rem;
    font-size: 0.8rem;
    text-align: center;
}

.delete-btn {
    width: 2rem;
    height: 2rem;
}

.validation-error {
    margin-top: 1rem;
}

/* Footer mejorado */
.dialog-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 0 0;
    border-top: 1px solid var(--border);
    margin-top: 1.5rem;
}

.footer-info {
    flex: 1;
}

.footer-actions {
    display: flex;
    gap: 0.75rem;
}

.text-muted {
    color: var(--text-secondary);
    font-size: 0.8rem;
}

/* Responsive */
@media (max-width: 1024px) {
    .basic-info-grid {
        grid-template-columns: 1fr;
        gap: 0.75rem;
    }

    .notes-field {
        grid-column: 1;
    }
}

@media (max-width: 768px) {
    .purchase-order-form {
        padding: 0.75rem;
    }

    .products-header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
    }

    .dialog-footer {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
    }

    .footer-actions {
        justify-content: stretch;
        flex-direction: column-reverse;
    }

    .footer-actions .p-button {
        width: 100%;
    }

    :deep(.compact-table .p-datatable-thead > tr > th, .compact-table .p-datatable-tbody > tr > td) {
        padding: 0.4rem 0.3rem;
        font-size: 0.8rem;
    }
}

/* Scrollbar personalizado */
.purchase-order-form::-webkit-scrollbar {
    width: 6px;
}

.purchase-order-form::-webkit-scrollbar-track {
    background: transparent;
}

.purchase-order-form::-webkit-scrollbar-thumb {
    background: var(--border);
    border-radius: 3px;
}

.purchase-order-form::-webkit-scrollbar-thumb:hover {
    background: var(--text-secondary);
}
</style>
