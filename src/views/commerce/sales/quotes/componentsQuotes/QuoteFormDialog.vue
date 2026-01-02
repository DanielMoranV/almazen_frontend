<script setup>
import { useCustomersStore } from '@/stores/customersStore';
import { useProductsStore } from '@/stores/productsStore';

import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';

const toast = useToast();
const submitted = ref(false);
const customersStore = useCustomersStore();

const productsStore = useProductsStore();

const props = defineProps({
    visible: Boolean,
    loading: Boolean,
    quote: {
        type: Object,
        default: null
    }
});

const emit = defineEmits(['update:visible', 'submit']);

// Formulario principal
const form = ref({
    id: null,
    customer_id: null,
    quote_date: new Date().toISOString().split('T')[0],
    valid_until: getDefaultValidUntil(),
    subtotal_amount: 0,
    tax_amount: 0,
    discount_amount: 0,
    total_amount: 0,
    notes: '',
    terms_and_conditions: 'Cotización válida por 30 días. Precios sujetos a cambios sin previo aviso.'
});

// Detalles de la cotización
const details = ref([]);
const showProductDialog = ref(false);

// Búsqueda de productos
const productSearchQuery = ref('');
const productSearchResults = ref([]);
const isSearchingProducts = ref(false);
const selectedProduct = ref(null);
const selectedStockId = ref(null);

// Estados calculados
const isCreating = computed(() => !form.value.id);
const isFormValid = computed(() => form.value.customer_id && form.value.quote_date && form.value.valid_until && form.value.total_amount > 0 && details.value.length > 0);

// Computed para el stock seleccionado específico
const selectedStockInfo = computed(() => {
    if (!selectedProduct.value || !selectedStockId.value) return null;

    // Buscar el stock específico seleccionado
    for (const stock of selectedProduct.value.available_stock || []) {
        // Si el stock_id coincide con el stock general
        if (stock.stock_id === selectedStockId.value) {
            return stock;
        }
        // Si el stock_id coincide con un lote específico
        if (stock.batches) {
            const batch = stock.batches.find((b) => b.stock_id === selectedStockId.value);
            if (batch) {
                return batch;
            }
        }
    }

    return null;
});

// Funciones de utilidad
function getDefaultValidUntil() {
    const today = new Date();
    today.setDate(today.getDate() + 30); // 30 días por defecto
    return today.toISOString().split('T')[0];
}

// Gestión de detalles
const addProduct = () => {
    showProductDialog.value = true;
};

const removeDetail = (index) => {
    details.value.splice(index, 1);
    calculateTotals();
};

const updateDetailQuantity = (index, quantity) => {
    const numQuantity = parseFloat(quantity) || 0;
    if (numQuantity <= 0) return;

    const detail = details.value[index];
    detail.quantity = numQuantity;
    detail.subtotal_amount = numQuantity * parseFloat(detail.unit_price || 0);
    detail.tax_amount = detail.subtotal_amount * 0.18; // IGV 18%
    detail.total_amount = detail.subtotal_amount + detail.tax_amount - parseFloat(detail.discount_amount || 0);

    calculateTotals();
};

const updateDetailPrice = (index, price) => {
    const numPrice = parseFloat(price) || 0;
    if (numPrice <= 0) return;

    const detail = details.value[index];
    detail.unit_price = numPrice;
    detail.subtotal_amount = parseFloat(detail.quantity || 0) * numPrice;
    detail.tax_amount = detail.subtotal_amount * 0.18; // IGV 18%
    detail.total_amount = detail.subtotal_amount + detail.tax_amount - parseFloat(detail.discount_amount || 0);

    calculateTotals();
};

const updateDetailDiscount = (index, discount) => {
    const detail = details.value[index];
    detail.discount_amount = parseFloat(discount) || 0;
    detail.total_amount = parseFloat(detail.subtotal_amount || 0) + parseFloat(detail.tax_amount || 0) - detail.discount_amount;

    calculateTotals();
};

const calculateTotals = () => {
    const subtotal = details.value.reduce((sum, detail) => sum + parseFloat(detail.subtotal_amount || 0), 0);
    const tax = details.value.reduce((sum, detail) => sum + parseFloat(detail.tax_amount || 0), 0);
    const discount = details.value.reduce((sum, detail) => sum + parseFloat(detail.discount_amount || 0), 0);

    form.value.subtotal_amount = Number(subtotal.toFixed(2));
    form.value.tax_amount = Number(tax.toFixed(2));
    form.value.discount_amount = Number(discount.toFixed(2));
    form.value.total_amount = Number((subtotal + tax - discount).toFixed(2));
};

// Búsqueda de productos con debounce
let searchTimeout = null;
const searchProducts = async (query = '') => {
    if (!query.trim()) {
        productSearchResults.value = [];
        return;
    }

    isSearchingProducts.value = true;
    try {
        await productsStore.searchProductsForSale(query.trim());
        productSearchResults.value = productsStore.saleProductsList || [];

        if (productSearchResults.value.length === 0) {
            toast.add({
                severity: 'info',
                summary: 'Sin resultados',
                detail: 'No se encontraron productos disponibles',
                life: 2000
            });
        }
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error de búsqueda',
            detail: 'Error al buscar productos'
        });
        productSearchResults.value = [];
    } finally {
        isSearchingProducts.value = false;
    }
};

// Debounced search
const debouncedSearch = (query) => {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        searchProducts(query);
    }, 300);
};

// Watch para búsqueda automática
watch(productSearchQuery, (newQuery) => {
    debouncedSearch(newQuery);
});

// Gestión de productos
const selectProductForAdd = (product) => {
    // Seleccionar el producto para mostrar opciones de stock
    selectedProduct.value = product;

    // Verificar si hay stock disponible
    if (!product.available_stock || product.available_stock.length === 0) {
        toast.add({
            severity: 'error',
            summary: 'Sin Stock',
            detail: 'Este producto no tiene stock disponible',
            life: 3000
        });
        return;
    }

    // Si solo hay un stock sin lotes, seleccionarlo automáticamente
    const firstStock = product.available_stock[0];

    if (product.available_stock.length === 1 && (!firstStock.batches || firstStock.batches.length === 0)) {
        selectStockId(firstStock.stock_id);
        return;
    }

    // Para múltiples almacenes, no auto-seleccionar nada
    // El usuario debe elegir manualmente el almacén específico

    selectedStockId.value = null;

    // Limpiar búsqueda pero no cerrar el diálogo - mostrar opciones de stock
    productSearchQuery.value = '';
    productSearchResults.value = [];

    toast.add({
        severity: 'success',
        summary: 'Producto seleccionado',
        detail: `${product.name} seleccionado. Ahora selecciona el stock específico.`,
        life: 2000
    });
};

// Función para seleccionar un stock_id específico
const selectStockId = (stockId) => {
    selectedStockId.value = stockId;

    toast.add({
        severity: 'success',
        summary: 'Stock seleccionado',
        detail: 'Stock seleccionado correctamente',
        life: 1500
    });
};

// Función para confirmar la adición del producto con el stock seleccionado
const confirmAddProduct = () => {
    if (!selectedProduct.value || !selectedStockId.value) {
        toast.add({
            severity: 'error',
            summary: 'Selección Incompleta',
            detail: 'Debe seleccionar un producto y un stock específico',
            life: 3000
        });
        return;
    }

    // Verificar si el producto ya está en la lista
    const exists = details.value.find((detail) => detail.stock_id === selectedStockId.value);
    if (exists) {
        toast.add({
            severity: 'warn',
            summary: 'Producto Duplicado',
            detail: 'Este stock ya está en la cotización',
            life: 3000
        });
        return;
    }

    // Obtener información del stock seleccionado
    const stockInfo = selectedStockInfo.value;
    if (!stockInfo) {
        toast.add({
            severity: 'error',
            summary: 'Error de Stock',
            detail: 'No se pudo obtener información del stock seleccionado',
            life: 3000
        });
        return;
    }

    // Agregar nuevo detalle usando la estructura de available_stock
    const unitPrice = parseFloat(selectedProduct.value.sale_price || stockInfo.sale_price || 0);
    const quantity = 1;
    const subtotal = unitPrice * quantity;
    const tax = subtotal * 0.18;
    const discount = 0;
    const total = subtotal + tax - discount;

    const newDetail = {
        stock_id: selectedStockId.value,
        quantity: quantity,
        unit_price: unitPrice,
        subtotal_amount: subtotal,
        tax_amount: tax,
        discount_amount: discount,
        total_amount: total,
        notes: '',
        stock: {
            id: selectedStockId.value,
            actual_quantity: parseFloat(stockInfo.total_stock || stockInfo.available_quantity || 0),
            sale_price: unitPrice,
            warehouse: stockInfo.warehouse || { name: stockInfo.warehouse_name },
            product: selectedProduct.value
        }
    };

    details.value.push(newDetail);
    calculateTotals();

    // Guardar el nombre del producto antes de limpiar
    const productName = selectedProduct.value.name;

    // Limpiar selección y cerrar diálogo
    selectedProduct.value = null;
    selectedStockId.value = null;
    productSearchQuery.value = '';
    productSearchResults.value = [];
    showProductDialog.value = false;

    toast.add({
        severity: 'success',
        summary: 'Producto agregado',
        detail: `${productName} agregado a la cotización`,
        life: 2000
    });
};

// Función para cancelar la selección de producto
const cancelProductSelection = () => {
    selectedProduct.value = null;
    selectedStockId.value = null;
    productSearchQuery.value = '';
    productSearchResults.value = [];
};

// Formulario principal
const resetForm = () => {
    form.value = {
        id: null,
        customer_id: null,
        quote_date: new Date().toISOString().split('T')[0],
        valid_until: getDefaultValidUntil(),
        subtotal_amount: 0,
        tax_amount: 0,
        discount_amount: 0,
        total_amount: 0,
        notes: '',
        terms_and_conditions: 'Cotización válida por 30 días. Precios sujetos a cambios sin previo aviso.'
    };
    details.value = [];
    submitted.value = false;

    // Limpiar búsqueda de productos
    productSearchQuery.value = '';
    productSearchResults.value = [];
    isSearchingProducts.value = false;
    selectedProduct.value = null;
    selectedStockId.value = null;
};

// Cargar datos iniciales
onMounted(async () => {
    try {
        // Solo cargar clientes al inicio, productos se cargan bajo demanda
        await customersStore.fetchCustomers();
    } catch (error) {
        console.error('Error loading initial data:', error);
        toast.add({
            severity: 'warn',
            summary: 'Advertencia',
            detail: 'Error al cargar datos iniciales. Los productos se cargarán al buscar.',
            life: 3000
        });
    }
});

// Observar cambios en la cotización
watch(
    () => props.quote,
    (quote) => {
        if (quote) {
            form.value = {
                ...quote,
                quote_date: quote.quote_date ? quote.quote_date.split('T')[0] : new Date().toISOString().split('T')[0],
                valid_until: quote.valid_until ? quote.valid_until.split('T')[0] : getDefaultValidUntil()
            };

            // Cargar detalles si existen
            if (quote.details && quote.details.length > 0) {
                details.value = quote.details.map((detail) => ({
                    ...detail,
                    quantity: Number(parseFloat(detail.quantity || 0).toFixed(4)),
                    unit_price: Number(parseFloat(detail.unit_price || 0).toFixed(2)),
                    subtotal_amount: Number(parseFloat(detail.subtotal_amount || 0).toFixed(2)),
                    tax_amount: Number(parseFloat(detail.tax_amount || 0).toFixed(2)),
                    discount_amount: Number(parseFloat(detail.discount_amount || 0).toFixed(2)),
                    total_amount: Number(parseFloat(detail.total_amount || 0).toFixed(2)),
                    stock: {
                        ...detail.stock,
                        actual_quantity: Number(parseFloat(detail.stock?.actual_quantity || 0).toFixed(2))
                    }
                }));
            } else {
                details.value = [];
            }
        } else {
            resetForm();
        }
    },
    { immediate: true }
);

// Validar fechas
watch(
    () => form.value.quote_date,
    (newDate) => {
        if (newDate) {
            const quoteDate = new Date(newDate);
            const validUntilDate = new Date(form.value.valid_until);

            if (validUntilDate <= quoteDate) {
                // Ajustar valid_until si es menor o igual a quote_date
                const newValidUntil = new Date(quoteDate);
                newValidUntil.setDate(newValidUntil.getDate() + 30);
                form.value.valid_until = newValidUntil.toISOString().split('T')[0];
            }
        }
    }
);

const handleSubmit = () => {
    submitted.value = true;

    if (!isFormValid.value) {
        toast.add({
            severity: 'error',
            summary: 'Formulario Inválido',
            detail: 'Por favor complete todos los campos requeridos',
            life: 3000
        });
        return;
    }

    if (details.value.length === 0) {
        toast.add({
            severity: 'error',
            summary: 'Sin Productos',
            detail: 'Debe agregar al menos un producto a la cotización',
            life: 3000
        });
        return;
    }

    // Preparar datos para envío
    // Preparar datos para envío
    const rawDiscountAmount = parseFloat(form.value.discount_amount) || 0;
    // Quote form aggregates item discounts, so we classify it as 'fixed' if > 0, else 'none'
    const finalDiscountType = rawDiscountAmount > 0 ? 'fixed' : 'none';

    const quoteData = {
        ...form.value,
        subtotal_amount: parseFloat(form.value.subtotal_amount) || 0,
        tax_amount: parseFloat(form.value.tax_amount) || 0,
        total_amount: parseFloat(form.value.total_amount) || 0,
        
        // Strict Validation Rules for Defaults
        discount_amount: rawDiscountAmount,
        discount_type: finalDiscountType,
        discount_percentage: null, // Quotes only use item discounts or fixed aggregation
        discount_code: null, // No discount code support in quotes yet

        details: details.value.map((detail) => ({
            stock_id: detail.stock_id,
            quantity: parseFloat(detail.quantity),
            unit_price: parseFloat(detail.unit_price),
            subtotal_amount: parseFloat(detail.subtotal_amount),
            tax_amount: parseFloat(detail.tax_amount || 0),
            discount_amount: parseFloat(detail.discount_amount || 0),
            total_amount: parseFloat(detail.total_amount),
            notes: detail.notes || ''
        }))
    };

    emit('submit', quoteData);
    resetForm();
};

const handleCancel = () => {
    emit('update:visible', false);
    resetForm();
};

const formatCurrency = (value) => {
    return value ? `S/ ${parseFloat(value).toLocaleString('es-PE', { minimumFractionDigits: 2 })}` : 'S/ 0.00';
};
</script>

<template>
    <Dialog
        :visible="visible"
        @update:visible="(val) => emit('update:visible', val)"
        :style="{ width: '1200px', maxWidth: '98vw', maxHeight: '95vh' }"
        :header="isCreating ? '📝 Nueva Cotización' : '✏️ Editar Cotización'"
        :modal="true"
        class="p-fluid quote-dialog enhanced-dialog"
        :closable="true"
        :dismissableMask="false"
        :resizable="false"
    >
        <div class="form-content enhanced-layout">
            <!-- Header compacto con información esencial -->
            <div class="quote-header-section">
                <div class="header-grid">
                    <!-- Cliente (más espacio) -->
                    <div class="field-container customer-field">
                        <label for="customer_id" class="field-label enhanced">
                            <i class="pi pi-user field-icon"></i>
                            Cliente *
                        </label>
                        <Select
                            id="customer_id"
                            v-model="form.customer_id"
                            :options="customersStore.customersList"
                            optionLabel="name"
                            optionValue="id"
                            placeholder="Seleccionar cliente..."
                            :class="{ 'p-invalid': submitted && !form.customer_id }"
                            class="form-select enhanced"
                            filter
                            showClear
                        />
                        <small class="p-error" v-if="submitted && !form.customer_id">Cliente requerido</small>
                    </div>

                    <!-- Fechas compactas -->
                    <div class="field-container date-field">
                        <label for="quote_date" class="field-label enhanced">
                            <i class="pi pi-calendar field-icon"></i>
                            Fecha Cotización *
                        </label>
                        <DatePicker id="quote_date" v-model="form.quote_date" dateFormat="dd/mm/yy" :class="{ 'p-invalid': submitted && !form.quote_date }" class="form-input enhanced compact" showIcon />
                        <small class="p-error" v-if="submitted && !form.quote_date">Fecha requerida</small>
                    </div>

                    <div class="field-container date-field">
                        <label for="valid_until" class="field-label enhanced">
                            <i class="pi pi-clock field-icon"></i>
                            Válido Hasta *
                        </label>
                        <DatePicker
                            id="valid_until"
                            v-model="form.valid_until"
                            dateFormat="dd/mm/yy"
                            :class="{ 'p-invalid': submitted && !form.valid_until }"
                            class="form-input enhanced compact"
                            :minDate="form.quote_date ? new Date(form.quote_date) : new Date()"
                            showIcon
                        />
                        <small class="p-error" v-if="submitted && !form.valid_until">Fecha requerida</small>
                    </div>
                </div>
            </div>

            <!-- Sección Principal de Productos -->
            <div class="products-main-section">
                <div class="products-toolbar">
                    <div class="toolbar-left">
                        <div class="products-title-container">
                            <i class="pi pi-shopping-cart products-icon"></i>
                            <h3 class="products-title">
                                Productos
                                <span class="products-badge">{{ details.length }}</span>
                            </h3>
                        </div>
                        <div class="products-summary" v-if="details.length > 0">
                            <span class="summary-text">{{ formatCurrency(form.total_amount) }}</span>
                            <small class="summary-label">Total</small>
                        </div>
                    </div>
                    <div class="toolbar-right">
                        <Button icon="pi pi-plus" :label="details.length === 0 ? 'Agregar Producto' : ''" class="add-product-btn modern" @click="addProduct" size="small" />
                    </div>
                </div>

                <!-- Estado vacío mejorado -->
                <div v-if="details.length === 0" class="empty-state-modern">
                    <div class="empty-illustration">
                        <i class="pi pi-shopping-cart"></i>
                    </div>
                    <div class="empty-message">
                        <h4>Cotización sin productos</h4>
                        <p>Comienza agregando productos a tu cotización</p>
                    </div>
                </div>

                <!-- Lista de productos optimizada -->
                <div v-else class="products-list-container">
                    <!-- Productos como cards compactas -->
                    <div class="products-list">
                        <div v-for="(detail, index) in details" :key="`detail-${index}-${detail.stock_id}`" class="product-card">
                            <!-- Info del producto -->
                            <div class="product-info">
                                <div class="product-details">
                                    <h5 class="product-name">{{ detail.stock?.product?.name }}</h5>
                                    <div class="product-meta">
                                        <span class="product-sku">{{ detail.stock?.product?.sku }}</span>
                                        <span class="product-stock">Stock: {{ detail.stock?.actual_quantity }}</span>
                                    </div>
                                </div>
                                <Button icon="pi pi-trash" class="p-button-text p-button-danger p-button-sm delete-btn" @click="removeDetail(index)" v-tooltip.left="'Eliminar producto'" />
                            </div>

                            <!-- Controles compactos -->
                            <div class="product-controls">
                                <div class="control-group">
                                    <label class="control-label">Cantidad</label>
                                    <InputNumber
                                        :modelValue="parseFloat(detail.quantity) || 0"
                                        @update:modelValue="(val) => updateDetailQuantity(index, val)"
                                        :min="0.01"
                                        :max="parseFloat(detail.stock?.actual_quantity) || 999999"
                                        mode="decimal"
                                        :minFractionDigits="2"
                                        :maxFractionDigits="4"
                                        class="control-input compact"
                                        size="small"
                                    />
                                </div>

                                <div class="control-group">
                                    <label class="control-label">Precio Unit.</label>
                                    <InputNumber
                                        :modelValue="parseFloat(detail.unit_price) || 0"
                                        @update:modelValue="(val) => updateDetailPrice(index, val)"
                                        mode="currency"
                                        currency="PEN"
                                        locale="es-PE"
                                        :min="0.01"
                                        class="control-input compact"
                                        size="small"
                                    />
                                </div>

                                <div class="control-group">
                                    <label class="control-label">Descuento</label>
                                    <InputNumber
                                        :modelValue="parseFloat(detail.discount_amount) || 0"
                                        @update:modelValue="(val) => updateDetailDiscount(index, val)"
                                        mode="currency"
                                        currency="PEN"
                                        locale="es-PE"
                                        :min="0"
                                        :max="parseFloat(detail.subtotal_amount) + parseFloat(detail.tax_amount)"
                                        class="control-input compact"
                                        size="small"
                                    />
                                </div>

                                <!-- Totales del producto -->
                                <div class="product-totals">
                                    <div class="total-item">
                                        <span class="total-label">Subtotal:</span>
                                        <span class="total-value">{{ formatCurrency(detail.subtotal_amount) }}</span>
                                    </div>
                                    <div class="total-item final">
                                        <span class="total-label">Total:</span>
                                        <span class="total-value primary">{{ formatCurrency(detail.total_amount) }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Resumen de totales flotante -->
                    <div class="quote-totals-summary">
                        <div class="totals-grid">
                            <div class="total-item">
                                <span class="label">Subtotal</span>
                                <span class="value">{{ formatCurrency(form.subtotal_amount) }}</span>
                            </div>
                            <div class="total-item">
                                <span class="label">IGV (18%)</span>
                                <span class="value">{{ formatCurrency(form.tax_amount) }}</span>
                            </div>
                            <div class="total-item">
                                <span class="label">Descuento</span>
                                <span class="value discount">{{ formatCurrency(form.discount_amount) }}</span>
                            </div>
                            <div class="total-item final">
                                <span class="label">Total Final</span>
                                <span class="value final">{{ formatCurrency(form.total_amount) }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Notas y Términos (layout horizontal optimizado) -->
            <div class="notes-section">
                <div class="notes-grid">
                    <div class="notes-field">
                        <label for="notes" class="field-label enhanced">
                            <i class="pi pi-comment field-icon"></i>
                            Observaciones
                        </label>
                        <Textarea id="notes" v-model="form.notes" rows="2" placeholder="Notas internas o comentarios..." class="form-input enhanced compact" autoResize />
                    </div>
                    <div class="terms-field">
                        <label for="terms_and_conditions" class="field-label enhanced">
                            <i class="pi pi-file-check field-icon"></i>
                            Términos y Condiciones
                        </label>
                        <Textarea id="terms_and_conditions" v-model="form.terms_and_conditions" rows="2" placeholder="Condiciones comerciales..." class="form-input enhanced compact" autoResize />
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer optimizado -->
        <template #footer>
            <div class="quote-dialog-footer">
                <div class="footer-left">
                    <div class="form-validation-status" v-if="submitted">
                        <div v-if="isFormValid" class="validation-success">
                            <i class="pi pi-check-circle"></i>
                            <span>Formulario válido</span>
                        </div>
                        <div v-else class="validation-error">
                            <i class="pi pi-exclamation-triangle"></i>
                            <span>Revisar campos requeridos</span>
                        </div>
                    </div>
                </div>
                <div class="footer-right">
                    <Button label="Cancelar" icon="pi pi-times" class="p-button-text cancel-btn" @click="handleCancel" />
                    <Button :label="isCreating ? 'Crear Cotización' : 'Actualizar Cotización'" icon="pi pi-check" class="p-button-primary submit-btn" @click="handleSubmit" :loading="loading" :disabled="!isFormValid" />
                </div>
            </div>
        </template>
    </Dialog>

    <!-- Dialog de selección de productos optimizado -->
    <Dialog v-model:visible="showProductDialog" :style="{ width: '900px', maxWidth: '95vw', maxHeight: '80vh' }" header="🔍 Buscar Productos" :modal="true" class="p-fluid product-search-dialog" :closable="true">
        <!-- Búsqueda optimizada -->
        <div class="product-search-container">
            <div class="search-input-modern">
                <div class="search-icon-wrapper">
                    <i class="pi pi-search search-icon"></i>
                </div>
                <InputText id="product-search" v-model="productSearchQuery" placeholder="Escribe el nombre, SKU o código de barras del producto..." class="search-input modern" :loading="isSearchingProducts" />
                <div class="search-status" v-if="isSearchingProducts">
                    <i class="pi pi-spin pi-spinner"></i>
                </div>
            </div>
            <div class="search-tips" v-if="!productSearchQuery && !isSearchingProducts">
                <span class="tip-item"><i class="pi pi-info-circle"></i> Busca por nombre del producto</span>
                <span class="tip-item"><i class="pi pi-tag"></i> Código SKU</span>
                <span class="tip-item"><i class="pi pi-qrcode"></i> Código de barras</span>
            </div>
        </div>

        <!-- Resultados modernos -->
        <div v-if="productSearchResults.length > 0" class="search-results modern">
            <div class="results-header">
                <span class="results-count">{{ productSearchResults.length }} productos encontrados</span>
            </div>
            <div class="results-list">
                <div v-for="product in productSearchResults" :key="product.id" @click="selectProductForAdd(product)" class="product-result modern">
                    <div class="product-main-info">
                        <div class="product-identity">
                            <h4 class="product-title">{{ product.name }}</h4>
                            <div class="product-codes">
                                <span class="code-badge sku">{{ product.sku }}</span>
                                <span class="code-badge barcode" v-if="product.barcode">{{ product.barcode }}</span>
                            </div>
                        </div>
                        <div class="product-availability" v-if="product.available_stock && product.available_stock.length > 0">
                            <div class="stock-info">
                                <span class="stock-quantity">{{ product.available_stock[0].total_stock || product.available_stock[0].available_quantity || 0 }}</span>
                                <span class="stock-label">en stock</span>
                            </div>
                            <div class="warehouse-info">
                                <i class="pi pi-building"></i>
                                <span>{{ product.available_stock[0].warehouse_name || product.available_stock[0].warehouse?.name || 'Almacén' }}</span>
                            </div>
                        </div>
                    </div>
                    <div class="product-price-action">
                        <div class="price-display">
                            {{ formatCurrency(product.sale_price || product.available_stock?.[0]?.sale_price || 0) }}
                        </div>
                        <div class="add-button">
                            <i class="pi pi-plus"></i>
                            <span>Agregar</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Selección de stock/lote cuando hay un producto seleccionado -->
        <div v-if="selectedProduct" class="stock-selection-container">
            <div class="selected-product-header">
                <div class="product-info">
                    <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-3">
                        <i class="pi pi-check-circle text-green-600 text-xl"></i>
                    </div>
                    <div>
                        <div class="font-bold text-green-800 text-lg">{{ selectedProduct.name }}</div>
                        <div class="text-sm text-green-600"><i class="pi pi-tag mr-1"></i>SKU: {{ selectedProduct.sku }}</div>
                    </div>
                </div>
                <Button icon="pi pi-times" class="p-button-text p-button-sm p-button-rounded" @click="cancelProductSelection" v-tooltip.left="'Cambiar producto'" />
            </div>

            <div class="stock-options-section">
                <div class="section-title">
                    <i class="pi pi-building mr-2 text-blue-600"></i>
                    Selecciona el stock específico:
                </div>

                <div v-for="stock in selectedProduct.available_stock" :key="stock.id" class="stock-option-card">
                    <div class="stock-header">
                        <div class="warehouse-info">
                            <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                <i class="pi pi-building text-blue-600"></i>
                            </div>
                            <div>
                                <div class="font-bold text-gray-900">{{ stock.warehouse_name || stock.warehouse?.name }}</div>
                                <div class="text-sm text-gray-500"><i class="pi pi-box mr-1"></i>Stock total: {{ stock.total_stock || stock.available_quantity || 0 }} unidades</div>
                            </div>
                        </div>
                    </div>

                    <!-- Lotes si existen -->
                    <div v-if="stock.batches && stock.batches.length > 0" class="batches-section">
                        <div class="batches-header">
                            <i class="pi pi-list mr-2 text-purple-600"></i>
                            Lotes disponibles ({{ stock.batches.length }}):
                        </div>
                        <div class="batches-list">
                            <div v-for="batch in stock.batches" :key="batch.id" class="batch-card">
                                <div class="batch-info">
                                    <div class="batch-details">
                                        <span class="batch-code">{{ batch.batch_code }}</span>
                                        <span class="batch-quantity"> {{ parseFloat(batch.available_quantity).toFixed(2) }} unidades </span>
                                    </div>
                                    <div class="batch-meta"><i class="pi pi-calendar mr-1"></i>Vence: {{ batch.expiration_date }}</div>
                                </div>
                                <Button
                                    size="small"
                                    :label="selectedStockId === batch.stock_id ? 'Seleccionado' : 'Seleccionar'"
                                    :class="selectedStockId === batch.stock_id ? 'p-button-success' : 'p-button-outlined'"
                                    @click="selectStockId(batch.stock_id)"
                                />
                            </div>
                        </div>
                    </div>

                    <!-- Stock sin lotes -->
                    <div v-else class="single-stock-section">
                        <Button size="small" :label="selectedStockId === stock.stock_id ? 'Seleccionado' : 'Seleccionar'" :class="selectedStockId === stock.stock_id ? 'p-button-success' : 'p-button-outlined'" @click="selectStockId(stock.stock_id)" />
                    </div>
                </div>
            </div>

            <!-- Botones de confirmación -->
            <div class="stock-selection-actions">
                <Button label="Cancelar" icon="pi pi-times" class="p-button-outlined" @click="cancelProductSelection" />
                <Button label="Agregar Producto" icon="pi pi-check" class="p-button-success" @click="confirmAddProduct" :disabled="!selectedStockId" />
            </div>
        </div>

        <!-- Estados vacíos modernos -->
        <div v-else-if="productSearchQuery && !isSearchingProducts" class="empty-results-state">
            <div class="empty-icon">
                <i class="pi pi-search-minus"></i>
            </div>
            <div class="empty-message">
                <h4>Sin resultados</h4>
                <p>
                    No encontramos productos que coincidan con "<strong>{{ productSearchQuery }}</strong
                    >"
                </p>
                <small>Intenta con otro término de búsqueda</small>
            </div>
        </div>

        <div v-else-if="!productSearchQuery" class="search-placeholder-state">
            <div class="placeholder-icon">
                <i class="pi pi-search"></i>
            </div>
            <div class="placeholder-message">
                <h4>Buscar productos</h4>
                <p>Comienza escribiendo para encontrar productos disponibles</p>
            </div>
        </div>

        <template #footer>
            <Button label="Cancelar" icon="pi pi-times" class="p-button-text" @click="showProductDialog = false" />
        </template>
    </Dialog>
</template>

<style scoped>
/* Layout mejorado y espaciado optimizado */
:deep(.enhanced-dialog) {
    .p-dialog {
        border-radius: 16px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }

    .p-dialog-content {
        @apply p-0 overflow-hidden;
        max-height: calc(95vh - 200px);
        overflow-y: auto;
    }
}

:deep(.quote-dialog .p-dialog-header) {
    @apply bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 text-white p-4 relative overflow-hidden;
    border-radius: 16px 16px 0 0;
}

:deep(.quote-dialog .p-dialog-header::before) {
    content: '';
    @apply absolute inset-0 opacity-10;
    background-image: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.5) 2px, transparent 2px);
    background-size: 40px 40px;
}

:deep(.quote-dialog .p-dialog-title) {
    @apply text-lg font-bold relative z-10;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

:deep(.quote-dialog .p-dialog-header .p-dialog-header-icon) {
    @apply text-white opacity-90 relative z-10 transition-all rounded-lg w-8 h-8 hover:bg-white/20;
}

/* Layout principal optimizado */
.form-content.enhanced-layout {
    @apply p-6 space-y-4;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

/* Header compacto de cotización */
.quote-header-section {
    @apply bg-white rounded-xl p-4 shadow-sm border border-gray-200;
}

.header-grid {
    @apply grid grid-cols-1 md:grid-cols-4 gap-4;
}

.field-container {
    @apply flex flex-col;
}

.field-container.customer-field {
    @apply md:col-span-2;
}

.field-container.date-field {
    @apply md:col-span-1;
}

.field-label.enhanced {
    @apply flex items-center gap-2 font-semibold text-sm text-gray-700 mb-2;
}

.field-icon {
    @apply text-blue-600 text-xs;
}

.form-select.enhanced,
.form-input.enhanced {
    @apply border border-gray-300 rounded-lg transition-all duration-200;
}

.form-select.enhanced:focus,
.form-input.enhanced:focus {
    @apply border-blue-500 ring-2 ring-blue-500/10;
}

.form-input.enhanced.compact {
    @apply text-sm;
}

/* Sección de productos moderna */
.products-main-section {
    @apply bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden;
}

.products-toolbar {
    @apply flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200;
}

.toolbar-left {
    @apply flex items-center gap-4;
}

.products-title-container {
    @apply flex items-center gap-3;
}

.products-icon {
    @apply text-2xl text-blue-600;
}

.products-title {
    @apply text-lg font-bold text-gray-800 m-0 flex items-center gap-2;
}

.products-badge {
    @apply inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-xs font-bold;
}

.products-summary {
    @apply flex flex-col items-end;
}

.summary-text {
    @apply text-xl font-bold text-green-600;
}

.summary-label {
    @apply text-xs text-gray-500 uppercase tracking-wide;
}

.toolbar-right {
    @apply flex items-center;
}

.add-product-btn.modern {
    @apply bg-blue-600 hover:bg-blue-700 border-none rounded-lg px-4 py-2 transition-all duration-200 flex items-center gap-2;
}

.add-product-btn.modern:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

/* Estado vacío moderno */
.empty-state-modern {
    @apply flex flex-col items-center justify-center p-12 text-center;
}

.empty-illustration {
    @apply w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4;
}

.empty-illustration i {
    @apply text-3xl text-gray-400;
}

.empty-message h4 {
    @apply text-lg font-semibold text-gray-700 m-0 mb-2;
}

.empty-message p {
    @apply text-gray-500 m-0;
}

/* Lista de productos como cards */
.products-list-container {
    @apply p-4;
}

.products-list {
    @apply space-y-4 mb-6;
}

.product-card {
    @apply bg-gray-50 border border-gray-200 rounded-lg p-4 transition-all duration-200;
}

.product-card:hover {
    @apply border-blue-300 shadow-md;
}

.product-info {
    @apply flex items-start justify-between mb-4;
}

.product-details {
    @apply flex-1;
}

.product-name {
    @apply text-base font-semibold text-gray-800 m-0 mb-1;
}

.product-meta {
    @apply flex items-center gap-4 text-xs text-gray-500;
}

.product-sku {
    @apply bg-blue-100 text-blue-700 px-2 py-1 rounded;
}

.product-stock {
    @apply bg-green-100 text-green-700 px-2 py-1 rounded;
}

.delete-btn {
    @apply opacity-60 hover:opacity-100 transition-opacity;
}

.product-controls {
    @apply grid grid-cols-1 sm:grid-cols-4 gap-4;
}

.control-group {
    @apply flex flex-col;
}

.control-label {
    @apply text-xs font-semibold text-gray-600 mb-1;
}

.control-input.compact {
    @apply text-sm;
}

.product-totals {
    @apply flex flex-col gap-1 pt-2 border-t border-gray-200;
}

.total-item {
    @apply flex justify-between items-center text-sm;
}

.total-item.final {
    @apply font-bold;
}

.total-label {
    @apply text-gray-600;
}

.total-value {
    @apply font-semibold text-gray-800;
}

.total-value.primary {
    @apply text-blue-600;
}

/* Resumen de totales */
.quote-totals-summary {
    @apply bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4;
}

.totals-grid {
    @apply grid grid-cols-2 sm:grid-cols-4 gap-4;
}

.quote-totals-summary .total-item {
    @apply text-center;
}

.quote-totals-summary .label {
    @apply block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide;
}

.quote-totals-summary .value {
    @apply block text-lg font-bold text-gray-800;
}

.quote-totals-summary .value.discount {
    @apply text-red-600;
}

.quote-totals-summary .value.final {
    @apply text-2xl text-blue-600;
}

/* Sección de notas optimizada */
.notes-section {
    @apply bg-white rounded-xl p-4 shadow-sm border border-gray-200;
}

.notes-grid {
    @apply grid grid-cols-1 md:grid-cols-2 gap-4;
}

.notes-field,
.terms-field {
    @apply flex flex-col;
}

/* Footer mejorado */
.quote-dialog-footer {
    @apply flex items-center justify-between p-4 bg-gray-50 border-t border-gray-200;
}

.footer-left {
    @apply flex items-center;
}

.form-validation-status {
    @apply flex items-center gap-2 text-sm;
}

.validation-success {
    @apply flex items-center gap-2 text-green-600;
}

.validation-error {
    @apply flex items-center gap-2 text-red-600;
}

.footer-right {
    @apply flex items-center gap-3;
}

.cancel-btn {
    @apply hover:bg-gray-100;
}

.submit-btn {
    @apply bg-blue-600 hover:bg-blue-700 border-none px-6 py-2 rounded-lg;
}

/* Modal de búsqueda moderno */
:deep(.product-search-dialog) {
    .p-dialog {
        border-radius: 16px;
        overflow: hidden;
    }

    .p-dialog-header {
        @apply bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4;
    }

    .p-dialog-content {
        @apply p-0;
        max-height: 70vh;
        overflow-y: auto;
    }
}

.product-search-container {
    @apply p-6 border-b border-gray-200;
}

.search-input-modern {
    @apply relative flex items-center bg-white border-2 border-gray-300 rounded-xl overflow-hidden transition-all duration-200;
}

.search-input-modern:focus-within {
    @apply border-emerald-500 ring-2 ring-emerald-500/20;
}

.search-icon-wrapper {
    @apply flex items-center justify-center w-12 h-12 text-gray-500;
}

.search-input.modern {
    @apply flex-1 border-none outline-none px-4 py-3 text-base;
}

.search-status {
    @apply flex items-center justify-center w-12 h-12 text-emerald-600;
}

.search-tips {
    @apply flex flex-wrap gap-4 mt-4 text-sm text-gray-600;
}

.tip-item {
    @apply flex items-center gap-1;
}

/* Resultados modernos */
.search-results.modern {
    @apply bg-white;
}

.results-header {
    @apply px-6 py-3 bg-gray-50 border-b border-gray-200;
}

.results-count {
    @apply text-sm font-semibold text-gray-600;
}

.results-list {
    @apply max-h-96 overflow-y-auto;
}

.product-result.modern {
    @apply flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-all duration-200;
}

.product-result.modern:hover {
    @apply bg-emerald-50 border-emerald-200;
}

.product-main-info {
    @apply flex-1;
}

.product-identity {
    @apply mb-2;
}

.product-title {
    @apply text-base font-semibold text-gray-800 m-0 mb-1;
}

.product-codes {
    @apply flex items-center gap-2;
}

.code-badge {
    @apply text-xs px-2 py-1 rounded font-medium;
}

.code-badge.sku {
    @apply bg-blue-100 text-blue-700;
}

.code-badge.barcode {
    @apply bg-purple-100 text-purple-700;
}

.product-availability {
    @apply flex items-center gap-4 text-sm text-gray-600;
}

.stock-info {
    @apply flex items-center gap-1;
}

.stock-quantity {
    @apply font-semibold text-green-600;
}

.warehouse-info {
    @apply flex items-center gap-1;
}

.product-price-action {
    @apply flex flex-col items-end gap-2;
}

.price-display {
    @apply text-lg font-bold text-green-600;
}

.add-button {
    @apply flex items-center gap-1 px-3 py-1 bg-emerald-600 text-white rounded-lg text-sm font-medium transition-all duration-200;
}

.product-result.modern:hover .add-button {
    @apply bg-emerald-700;
}

/* Estados vacíos */
.empty-results-state,
.search-placeholder-state {
    @apply flex flex-col items-center justify-center p-12 text-center;
}

.empty-icon,
.placeholder-icon {
    @apply w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4;
}

.empty-icon i,
.placeholder-icon i {
    @apply text-2xl text-gray-400;
}

.empty-message h4,
.placeholder-message h4 {
    @apply text-lg font-semibold text-gray-700 m-0 mb-2;
}

.empty-message p,
.placeholder-message p {
    @apply text-gray-500 m-0;
}

/* Estilos globales PrimeVue mejorados */
:deep(.p-inputtext),
:deep(.p-dropdown),
:deep(.p-calendar),
:deep(.p-inputnumber .p-inputtext) {
    @apply border-2 rounded-lg font-medium transition-all border-gray-300;
}

:deep(.p-inputtext:focus),
:deep(.p-dropdown:not(.p-disabled).p-focus),
:deep(.p-calendar:not(.p-disabled).p-focus),
:deep(.p-inputnumber:not(.p-disabled).p-focus .p-inputtext) {
    @apply border-blue-500 ring-2 ring-blue-500/20;
}

:deep(.p-dialog-footer) {
    @apply p-0 border-t-0;
}

:deep(.p-invalid) {
    @apply border-red-400 bg-red-50 shadow-sm;
}

:deep(.p-invalid:focus) {
    @apply border-red-500 ring-2 ring-red-500/20 bg-red-50;
}

.p-error {
    @apply text-red-600 text-xs mt-1 font-medium flex items-start gap-1;
}

.p-error::before {
    content: '⚠';
    @apply text-red-500 text-xs;
}

/* Optimizaciones responsive */
@media (max-width: 768px) {
    .form-content.enhanced-layout {
        @apply p-3 space-y-3;
    }

    .quote-header-section {
        @apply p-3;
    }

    .header-grid {
        @apply grid-cols-1 gap-3;
    }

    .field-container.customer-field,
    .field-container.date-field {
        @apply col-span-1;
    }

    .products-toolbar {
        @apply flex-col items-start gap-3 p-3;
    }

    .toolbar-left {
        @apply w-full;
    }

    .toolbar-right {
        @apply w-full justify-end;
    }

    .product-controls {
        @apply grid-cols-1 gap-3;
    }

    .totals-grid {
        @apply grid-cols-2 gap-3;
    }

    .notes-grid {
        @apply grid-cols-1 gap-3;
    }

    .quote-dialog-footer {
        @apply flex-col items-stretch gap-3 p-3;
    }

    .footer-left,
    .footer-right {
        @apply justify-center;
    }

    :deep(.enhanced-dialog) {
        .p-dialog-content {
            max-height: calc(100vh - 150px);
        }
    }
}

@media (max-width: 480px) {
    .products-summary {
        @apply items-start;
    }

    .summary-text {
        @apply text-lg;
    }

    .product-result.modern {
        @apply flex-col items-start gap-3;
    }

    .product-price-action {
        @apply flex-row items-center justify-between w-full;
    }

    .search-tips {
        @apply flex-col gap-2;
    }
}

/* Transiciones suaves */
.product-card,
.add-product-btn.modern,
.product-result.modern {
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Mejoras para accesibilidad */
.add-product-btn.modern:focus,
.product-result.modern:focus {
    @apply outline-none ring-2 ring-blue-500 ring-offset-2;
}

/* Animaciones de entrada */
.product-card {
    animation: slideInUp 0.3s ease-out;
}

@keyframes slideInUp {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.product-result.modern {
    animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

/* Estilos para selección de stock/lotes */
.stock-selection-container {
    @apply mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl shadow-sm;
    animation: slideInDown 0.3s ease-out;
}

@keyframes slideInDown {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.selected-product-header {
    @apply flex justify-between items-center mb-4 p-3 bg-white rounded-lg shadow-sm;
}

.product-info {
    @apply flex items-center;
}

.stock-options-section {
    @apply space-y-4;
}

.section-title {
    @apply text-sm font-semibold text-gray-700 mb-3 flex items-center;
}

.stock-option-card {
    @apply bg-white rounded-lg border border-gray-200 p-4 shadow-sm;
}

.stock-header {
    @apply flex items-center justify-between mb-3;
}

.warehouse-info {
    @apply flex items-center;
}

.batches-section {
    @apply mt-4;
}

.batches-header {
    @apply text-sm font-semibold text-gray-700 mb-2 flex items-center;
}

.batches-list {
    @apply space-y-2;
}

.batch-card {
    @apply flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors duration-200;
}

.batch-info {
    @apply flex-1;
}

.batch-details {
    @apply flex items-center space-x-3 mb-1;
}

.batch-code {
    @apply font-semibold text-gray-900;
}

.batch-quantity {
    @apply text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full;
}

.batch-meta {
    @apply text-xs text-gray-500 flex items-center;
}

.single-stock-section {
    @apply mt-3;
}

.stock-selection-actions {
    @apply flex justify-end gap-3 mt-4 pt-4 border-t border-green-200;
}

/* Responsive para selección de stock */
@media (max-width: 768px) {
    .stock-option-card {
        @apply p-3;
    }

    .batch-card {
        @apply flex-col items-start gap-3 p-2;
    }

    .batch-details {
        @apply flex-col items-start space-x-0 space-y-1;
    }

    .stock-selection-actions {
        @apply flex-col gap-2;
    }

    .stock-selection-actions .p-button {
        @apply w-full;
    }
}
</style>
