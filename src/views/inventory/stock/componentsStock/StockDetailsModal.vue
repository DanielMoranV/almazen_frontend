<script setup>
import { Button, Dialog, ProgressSpinner } from 'primevue';
import { computed } from 'vue';

const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    },
    productData: {
        type: Object,
        default: null
    },
    loading: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['update:visible']);

const visible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
});

// Methods
const closeModal = () => {
    visible.value = false;
};

const getStockClass = (stock) => {
    if (!stock || stock === 0) return 'stock-empty';
    if (stock <= 10) return 'stock-low';
    return 'stock-normal';
};

const getExpiryClass = (expirationDate) => {
    if (!expirationDate) return '';
    if (isExpired(expirationDate)) return 'expired';
    if (isExpiringSoon(expirationDate)) return 'expiring-soon';
    return 'normal';
};

const isExpired = (expirationDate) => {
    if (!expirationDate) return false;
    return new Date(expirationDate) < new Date();
};

const isExpiringSoon = (expirationDate) => {
    if (!expirationDate) return false;
    const expiry = new Date(expirationDate);
    const today = new Date();
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
};

const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (error) {
        return dateString;
    }
};

// Helper function to safely format currency
const formatCurrency = (value) => {
    if (!value || isNaN(value) || value === null || value === undefined) return '-';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '-';
    return `S/ ${numValue.toFixed(2)}`;
};

// Helper function to calculate profit margin
const calculateProfitMargin = (salePrice, unitCost) => {
    if (!salePrice || !unitCost || isNaN(salePrice) || isNaN(unitCost)) return '-';
    const sale = parseFloat(salePrice);
    const cost = parseFloat(unitCost);
    if (isNaN(sale) || isNaN(cost) || cost === 0) return '-';

    const margin = ((sale - cost) / cost) * 100;
    return `${margin.toFixed(1)}%`;
};

// Helper function to format percentage
const formatPercentage = (value) => {
    if (!value || isNaN(value) || value === null || value === undefined) return '-';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '-';
    return `${numValue.toFixed(1)}%`;
};

// Helper function to get profit margin class for styling
const getProfitMarginClass = (salePrice, unitCost) => {
    if (!salePrice || !unitCost || isNaN(salePrice) || isNaN(unitCost)) return '';
    const sale = parseFloat(salePrice);
    const cost = parseFloat(unitCost);
    if (isNaN(sale) || isNaN(cost) || cost === 0) return '';

    const margin = ((sale - cost) / cost) * 100;
    if (margin < 10) return 'margin-low';
    if (margin < 30) return 'margin-medium';
    return 'margin-high';
};

// Helper function to check if product requires batches but has no batches created
const requiresBatchesButNoBatches = (productData, warehouse) => {
    if (!productData?.requires_batches) return false;
    return !warehouse.batches || warehouse.batches.length === 0;
};

// Helper function to check if warehouse has any batches
const hasAnyBatches = (warehouse) => {
    return warehouse.batches && warehouse.batches.length > 0;
};
</script>

<template>
    <Dialog v-model:visible="visible" modal :header="`Detalles de Stock - ${productData?.name || 'Producto'}`" :style="{ width: '90vw', maxWidth: '1200px' }" :closable="true" :draggable="false" class="stock-details-modal">
        <div v-if="loading" class="loading-container">
            <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="3" />
            <p class="loading-text">Cargando detalles del stock...</p>
        </div>

        <div v-else-if="productData" class="modal-content">
            <!-- Product Header -->
            <div class="product-header">
                <div class="product-info">
                    <h3 class="product-name">{{ productData.name }}</h3>
                    <div class="product-meta">
                        <span v-if="productData.sku" class="sku">SKU: {{ productData.sku }}</span>
                        <span v-if="productData.barcode" class="barcode">Código: {{ productData.barcode }}</span>
                    </div>
                </div>
                <div class="product-summary">
                    <div class="summary-item">
                        <span class="label">Stock Total</span>
                        <span class="value stock-total" :class="getStockClass(productData.total_stock)">
                            {{ productData.total_stock || 0 }}
                        </span>
                    </div>
                    <div class="summary-item">
                        <span class="label">Costo Promedio</span>
                        <span class="value cost-value">
                            {{ formatCurrency(productData.avg_unit_cost) }}
                        </span>
                    </div>
                    <div class="summary-item">
                        <span class="label">Precio Promedio</span>
                        <span class="value">
                            {{ formatCurrency(productData.avg_sale_price) }}
                        </span>
                    </div>
                    <div class="summary-item">
                        <span class="label">Margen Promedio</span>
                        <span class="value margin-value">
                            {{ calculateProfitMargin(productData.avg_sale_price, productData.avg_unit_cost) }}
                        </span>
                    </div>
                    <div class="summary-item">
                        <span class="label">Valor Total</span>
                        <span class="value total-value">
                            {{ formatCurrency(productData.total_sale_value) }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Warehouses Details -->
            <div class="warehouses-section">
                <h4 class="section-title">
                    <i class="pi pi-building"></i>
                    Detalle por Almacén
                </h4>

                <div v-if="productData.stock_by_warehouse?.length" class="warehouses-grid">
                    <div v-for="warehouse in productData.stock_by_warehouse" :key="warehouse.warehouse_id" class="warehouse-card">
                        <div class="warehouse-header">
                            <h5 class="warehouse-name">{{ warehouse.warehouse_name }}</h5>
                            <div class="warehouse-stock">
                                <span class="stock-amount" :class="getStockClass(warehouse.total_stock)">
                                    {{ warehouse.total_stock || 0 }}
                                </span>
                                <span class="stock-label">unidades</span>
                            </div>
                        </div>

                        <!-- Stock Limits -->
                        <div class="stock-limits">
                            <div class="limit-item">
                                <span class="limit-label">Mín:</span>
                                <span class="limit-value">{{ warehouse.min_stock || 0 }}</span>
                            </div>
                            <div class="limit-item">
                                <span class="limit-label">Máx:</span>
                                <span class="limit-value">{{ warehouse.max_stock || 0 }}</span>
                            </div>
                        </div>

                        <!-- Batches Section -->
                        <div v-if="productData.requires_batches && hasAnyBatches(warehouse)" class="batches-section">
                            <h6 class="batches-title">
                                <i class="pi pi-tags"></i>
                                Lotes ({{ warehouse.batches.length }})
                            </h6>

                            <div class="batches-table">
                                <div class="batch-header">
                                    <span>Lote</span>
                                    <span>Stock</span>
                                    <span>Costo</span>
                                    <span>Precio Venta</span>
                                    <span>Margen</span>
                                    <span>Vencimiento</span>
                                </div>

                                <div
                                    v-for="batch in warehouse.batches"
                                    :key="batch.stock_id"
                                    class="batch-row"
                                    :class="{
                                        expired: isExpired(batch.expiration_date),
                                        'expiring-soon': isExpiringSoon(batch.expiration_date)
                                    }"
                                >
                                    <span class="batch-code">{{ batch.batch_code || '-' }}</span>
                                    <span class="batch-stock" :class="getStockClass(batch.stock)">
                                        {{ batch.stock || 0 }}
                                    </span>
                                    <span class="batch-cost">
                                        {{ formatCurrency(batch.unit_cost) }}
                                    </span>
                                    <span class="batch-price">
                                        {{ formatCurrency(batch.sale_price) }}
                                    </span>
                                    <span class="batch-margin" :class="getProfitMarginClass(batch.sale_price, batch.unit_cost)">
                                        {{ calculateProfitMargin(batch.sale_price, batch.unit_cost) }}
                                    </span>
                                    <span class="batch-expiry" :class="getExpiryClass(batch.expiration_date)">
                                        {{ formatDate(batch.expiration_date) }}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <!-- Warning for products that require batches but have no batches created -->
                        <div v-else-if="requiresBatchesButNoBatches(productData, warehouse)" class="batch-warning">
                            <div class="warning-header">
                                <i class="pi pi-exclamation-triangle"></i>
                                <span class="warning-title">Producto requiere lotes</span>
                            </div>
                            <p class="warning-message">Este producto está configurado para manejar lotes, pero aún no se han creado lotes para este almacén. Se muestran los datos generales del stock.</p>

                            <!-- Show direct stock data as fallback -->
                            <div class="stock-details">
                                <div class="detail-item">
                                    <span class="detail-label">Costo Unitario:</span>
                                    <span class="detail-value">
                                        {{ formatCurrency(warehouse.unit_cost) }}
                                    </span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Precio de Venta:</span>
                                    <span class="detail-value">
                                        {{ formatCurrency(warehouse.sale_price) }}
                                    </span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Margen de Ganancia:</span>
                                    <span class="detail-value margin-value" :class="getProfitMarginClass(warehouse.sale_price, warehouse.unit_cost)">
                                        {{ calculateProfitMargin(warehouse.sale_price, warehouse.unit_cost) }}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <!-- No Batches - Direct Stock (for products that don't require batches) -->
                        <div v-else-if="!productData.requires_batches" class="direct-stock">
                            <div class="stock-details">
                                <div class="detail-item">
                                    <span class="detail-label">Costo Unitario:</span>
                                    <span class="detail-value">
                                        {{ formatCurrency(warehouse.unit_cost) }}
                                    </span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Precio de Venta:</span>
                                    <span class="detail-value">
                                        {{ formatCurrency(warehouse.sale_price) }}
                                    </span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Margen de Ganancia:</span>
                                    <span class="detail-value margin-value" :class="getProfitMarginClass(warehouse.sale_price, warehouse.unit_cost)">
                                        {{ calculateProfitMargin(warehouse.sale_price, warehouse.unit_cost) }}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <!-- Empty Batches State (fallback) -->
                        <div v-else class="empty-batches">
                            <i class="pi pi-info-circle"></i>
                            <span>Sin información de stock disponible</span>
                        </div>
                    </div>
                </div>

                <div v-else class="no-warehouses">
                    <i class="pi pi-exclamation-triangle"></i>
                    <span>No hay información de almacenes disponible</span>
                </div>
            </div>

            <!-- Summary Statistics -->
            <div class="statistics-section">
                <h4 class="section-title">
                    <i class="pi pi-chart-bar"></i>
                    Resumen Estadístico
                </h4>

                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon cost">
                            <i class="pi pi-dollar"></i>
                        </div>
                        <div class="stat-content">
                            <span class="stat-label">Costo Promedio</span>
                            <span class="stat-value">
                                {{ formatCurrency(productData.avg_unit_cost) }}
                            </span>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon sale">
                            <i class="pi pi-tag"></i>
                        </div>
                        <div class="stat-content">
                            <span class="stat-label">Precio Promedio Venta</span>
                            <span class="stat-value">
                                {{ formatCurrency(productData.avg_sale_price) }}
                            </span>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon total-cost">
                            <i class="pi pi-wallet"></i>
                        </div>
                        <div class="stat-content">
                            <span class="stat-label">Valor Total Costo</span>
                            <span class="stat-value">
                                {{ formatCurrency(productData.total_cost_value) }}
                            </span>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon total-sale">
                            <i class="pi pi-money-bill"></i>
                        </div>
                        <div class="stat-content">
                            <span class="stat-label">Valor Total Venta</span>
                            <span class="stat-value">
                                {{ formatCurrency(productData.total_sale_value) }}
                            </span>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon margin">
                            <i class="pi pi-percentage"></i>
                        </div>
                        <div class="stat-content">
                            <span class="stat-label">Margen Promedio</span>
                            <span class="stat-value" :class="getProfitMarginClass(productData.avg_sale_price, productData.avg_unit_cost)">
                                {{ calculateProfitMargin(productData.avg_sale_price, productData.avg_unit_cost) }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <template #footer>
            <div class="modal-footer">
                <Button label="Cerrar" icon="pi pi-times" class="close-btn" @click="closeModal" />
            </div>
        </template>
    </Dialog>
</template>
<style scoped>
.stock-details-modal {
    font-family: 'Inter', sans-serif;
}

.loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    gap: 1rem;
}

.loading-text {
    color: #6b7280;
    font-size: 1.1rem;
    font-weight: 500;
}

.modal-content {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    max-height: 70vh;
    overflow-y: auto;
}

/* Product Header */
.product-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 1.5rem;
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    border-radius: 12px;
    border: 1px solid #e2e8f0;
}

.product-info {
    flex: 1;
}

.product-name {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 0.5rem 0;
}

.product-meta {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
}

.sku,
.barcode {
    padding: 0.25rem 0.75rem;
    background: #ffffff;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.875rem;
    color: #4b5563;
    font-weight: 500;
}

.product-summary {
    display: flex;
    gap: 2rem;
    align-items: center;
}

.summary-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
}

.summary-item .label {
    font-size: 0.75rem;
    color: #6b7280;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.25rem;
}

.summary-item .value {
    font-size: 1.25rem;
    font-weight: 700;
    color: #1e293b;
}

.stock-total.stock-normal {
    color: #059669;
}

.stock-total.stock-low {
    color: #d97706;
}

.stock-total.stock-empty {
    color: #dc2626;
}

.total-value {
    color: #7c3aed;
}

.cost-value {
    color: #dc2626;
}

.margin-value {
    color: #059669;
}

/* Profit Margin Classes */
.margin-low {
    color: #dc2626 !important;
}

.margin-medium {
    color: #d97706 !important;
}

.margin-high {
    color: #059669 !important;
}

/* Section Titles */
.section-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.25rem;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 1rem 0;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid #e2e8f0;
}

.section-title i {
    color: #6366f1;
}

/* Warehouses Section */
.warehouses-section {
    background: #ffffff;
    padding: 1.5rem;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
}

.warehouses-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 1.5rem;
}

.warehouse-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 1.25rem;
    transition: all 0.2s ease;
}

.warehouse-card:hover {
    border-color: #6366f1;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.1);
}

.warehouse-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.warehouse-name {
    font-size: 1.1rem;
    font-weight: 600;
    color: #1e293b;
    margin: 0;
}

.warehouse-stock {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
}

.stock-amount {
    font-size: 1.5rem;
    font-weight: 700;
}

.stock-amount.stock-normal {
    color: #059669;
}

.stock-amount.stock-low {
    color: #d97706;
}

.stock-amount.stock-empty {
    color: #dc2626;
}

.stock-label {
    font-size: 0.75rem;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.stock-limits {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
    padding: 0.75rem;
    background: #ffffff;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
}

.limit-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.limit-label {
    font-size: 0.875rem;
    color: #6b7280;
    font-weight: 500;
}

.limit-value {
    font-size: 0.875rem;
    color: #1e293b;
    font-weight: 600;
}

/* Batches Section */
.batches-section {
    margin-top: 1rem;
}

.batches-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 0.75rem 0;
}

.batches-title i {
    color: #8b5cf6;
}

.batches-table {
    background: #ffffff;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    overflow: hidden;
}

.batch-header {
    display: grid;
    grid-template-columns: 1fr 60px 80px 90px 70px 90px;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: #f3f4f6;
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
    border-bottom: 1px solid #e5e7eb;
}

.batch-row {
    display: grid;
    grid-template-columns: 1fr 60px 80px 90px 70px 90px;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #f3f4f6;
    align-items: center;
    transition: background-color 0.2s ease;
}

.batch-row:hover {
    background: #f9fafb;
}

.batch-row:last-child {
    border-bottom: none;
}

.batch-row.expired {
    background: #fef2f2;
    border-left: 4px solid #dc2626;
}

.batch-row.expiring-soon {
    background: #fffbeb;
    border-left: 4px solid #d97706;
}

.batch-code {
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 0.875rem;
    color: #4b5563;
    font-weight: 500;
}

.batch-stock {
    font-weight: 600;
    text-align: center;
}

.batch-cost {
    font-weight: 600;
    color: #dc2626;
    text-align: right;
    font-size: 0.875rem;
}

.batch-price {
    font-weight: 600;
    color: #059669;
    text-align: right;
}

.batch-margin {
    font-weight: 600;
    text-align: center;
    font-size: 0.875rem;
}

.batch-expiry {
    font-size: 0.875rem;
    text-align: center;
}

.batch-expiry.expired {
    color: #dc2626;
    font-weight: 600;
}

.batch-expiry.expiring-soon {
    color: #d97706;
    font-weight: 600;
}

.batch-expiry.normal {
    color: #4b5563;
}

/* Direct Stock */
.direct-stock {
    margin-top: 1rem;
    padding: 1rem;
    background: #ffffff;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
}

.stock-details {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.detail-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.detail-label {
    font-size: 0.875rem;
    color: #6b7280;
    font-weight: 500;
}

.detail-value {
    font-size: 0.875rem;
    color: #1e293b;
    font-weight: 600;
}

/* Batch Warning Section */
.batch-warning {
    margin-top: 1rem;
    padding: 1.25rem;
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    border: 1px solid #f59e0b;
    border-radius: 10px;
    border-left: 4px solid #d97706;
}

.warning-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
}

.warning-header i {
    color: #d97706;
    font-size: 1.25rem;
}

.warning-title {
    font-size: 1rem;
    font-weight: 600;
    color: #92400e;
}

.warning-message {
    color: #78350f;
    font-size: 0.875rem;
    line-height: 1.5;
    margin: 0 0 1rem 0;
    padding: 0;
}

.batch-warning .stock-details {
    background: rgba(255, 255, 255, 0.7);
    padding: 1rem;
    border-radius: 8px;
    border: 1px solid rgba(217, 119, 6, 0.2);
}

/* Empty States */
.empty-batches,
.no-warehouses {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 2rem;
    color: #6b7280;
    font-style: italic;
}

.empty-batches i,
.no-warehouses i {
    color: #9ca3af;
}

/* Statistics Section */
.statistics-section {
    background: #ffffff;
    padding: 1.5rem;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
}

.stat-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.25rem;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    transition: all 0.2s ease;
}

.stat-card:hover {
    border-color: #6366f1;
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.1);
}

.stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    color: #ffffff;
}

.stat-icon.cost {
    background: linear-gradient(135deg, #10b981, #059669);
}

.stat-icon.sale {
    background: linear-gradient(135deg, #6366f1, #4f46e5);
}

.stat-icon.total-cost {
    background: linear-gradient(135deg, #f59e0b, #d97706);
}

.stat-icon.total-sale {
    background: linear-gradient(135deg, #8b5cf6, #7c3aed);
}

.stat-icon.margin {
    background: linear-gradient(135deg, #06b6d4, #0891b2);
}

.stat-content {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.stat-label {
    font-size: 0.875rem;
    color: #6b7280;
    font-weight: 500;
}

.stat-value {
    font-size: 1.25rem;
    font-weight: 700;
    color: #1e293b;
}

/* Modal Footer */
.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #e2e8f0;
}

.close-btn {
    background: #6b7280;
    border: none;
    color: #ffffff;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 500;
    transition: all 0.2s ease;
}

.close-btn:hover {
    background: #4b5563;
    transform: translateY(-1px);
}

/* Responsive Design */
@media (max-width: 768px) {
    .product-header {
        flex-direction: column;
        gap: 1rem;
    }

    .product-summary {
        flex-direction: column;
        gap: 1rem;
        width: 100%;
    }

    .warehouses-grid {
        grid-template-columns: 1fr;
    }

    .batch-header,
    .batch-row {
        grid-template-columns: 1fr 50px 70px 70px 60px 80px;
        gap: 0.25rem;
        padding: 0.5rem;
        font-size: 0.75rem;
    }

    .stats-grid {
        grid-template-columns: 1fr;
    }

    .stat-card {
        padding: 1rem;
    }
}

@media (max-width: 480px) {
    .modal-content {
        gap: 1rem;
    }

    .warehouses-section,
    .statistics-section {
        padding: 1rem;
    }

    .warehouse-card {
        padding: 1rem;
    }

    .batch-header,
    .batch-row {
        font-size: 0.75rem;
        padding: 0.5rem 0.25rem;
    }

    .product-name {
        font-size: 1.25rem;
    }

    .summary-item .value {
        font-size: 1rem;
    }
}
</style>
