<template>
    <Dialog v-model:visible="visible" :modal="true" :closable="true" header="Imprimir Orden de Compra" :style="{ width: '900px' }" @hide="onClose" :draggable="false">
        <div ref="printSection" class="print-section">
            <!-- Header de la empresa -->
            <div class="company-header">
                <h1 class="company-name">{{ user.company_name }}</h1>
                <div class="company-details">
                    <p v-if="user.company_address">{{ user.company_address }}</p>
                    <p v-if="user.company_phone">Tel: {{ user.company_phone }}</p>
                    <p v-if="user.company_email">Email: {{ user.company_email }}</p>
                </div>
            </div>

            <!-- Título del documento -->
            <div class="document-title">
                <h2>ORDEN DE COMPRA</h2>
                <div class="order-number">#{{ order.id }}</div>
            </div>

            <!-- Información principal en dos columnas -->
            <div class="main-info">
                <div class="info-column">
                    <div class="info-group">
                        <h3>Información del Proveedor</h3>
                        <p><strong>Nombre:</strong> {{ order.provider?.name || 'N/A' }}</p>
                        <p v-if="order.provider?.address"><strong>Dirección:</strong> {{ order.provider.address }}</p>
                        <p v-if="order.provider?.phone"><strong>Teléfono:</strong> {{ order.provider.phone }}</p>
                        <p v-if="order.provider?.email"><strong>Email:</strong> {{ order.provider.email }}</p>
                    </div>
                </div>

                <div class="info-column">
                    <div class="info-group">
                        <h3>Información de la Orden</h3>
                        <p><strong>Almacén:</strong> {{ order.warehouse?.name || 'N/A' }}</p>
                        <p><strong>Fecha de Creación:</strong> {{ formatDate(order.created_at) }}</p>
                        <p><strong>Fecha de Compra:</strong> {{ formatDate(order.purchase_date) }}</p>
                        <p><strong>Documento:</strong> {{ order.document_number || 'N/A' }}</p>
                        <p>
                            <strong>Estado:</strong> <span :class="getStatusClass(order.status)">{{ getStatusLabel(order.status) }}</span>
                        </p>
                        <p><strong>Solicitado por:</strong> {{ order.user?.name || 'N/A' }}</p>
                    </div>
                </div>
            </div>

            <!-- Tabla de productos -->
            <div class="products-section">
                <h3>Detalle de Productos</h3>
                <table class="products-table">
                    <thead>
                        <tr>
                            <th class="col-item">#</th>
<th class="col-product">Producto</th>
<th class="col-quantity">Cantidad</th>
<th class="col-unit">Unidad</th>
<th class="col-price">P. Unitario</th>
<th class="col-price-no-igv">P. sin IGV</th>
<th class="col-discount">Desc. Unitario</th>
<th class="col-subtotal">Subtotal</th>
<th class="col-subtotal-no-igv">Op. Gravadas</th>
<th class="col-igv-total">IGV 18%</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(item, index) in order.details" :key="item.id">
                            <td class="text-center">{{ index + 1 }}</td>
                            <td>
                                <div class="product-info">
                                    <strong>{{ item.product?.name || 'Producto sin nombre' }}</strong>
                                    <small v-if="item.product?.code" class="product-code">Código: {{ item.product.code }}</small>
                                </div>
                            </td>
                            <td class="text-center">{{ formatNumber(item.quantity) }}</td>
<td class="text-center">{{ item.product?.unit || 'UND' }}</td>
<td class="text-right">{{ formatCurrency(item.unit_price) }}</td>
<td class="text-right">{{ formatCurrency(getUnitPriceNoIGV(item)) }}</td>
<td class="text-right">{{ formatCurrency(item.discount_amount) }}</td>
<td class="text-right">{{ formatCurrency(getDetailSubtotal(item)) }}</td>
<td class="text-right">{{ formatCurrency(getDetailSubtotalNoIGV(item)) }}</td>
<td class="text-right">{{ formatCurrency(getDetailIGV(item)) }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="discount-note" style="font-size: 0.95em; color: #888; margin-bottom: 1.5rem">
    El subtotal ya incluye los descuentos unitarios aplicados por producto.<br>
    Total descuentos: {{ formatCurrency(totalUnitDiscounts()) }}
</div>

            <!-- Resumen de totales -->
            <div class="totals-section">
                <div class="totals-container">
                    <div class="total-line">
    <span>Op. Gravadas:</span>
    <span>{{ formatCurrency(calculateSubtotalNoIGV()) }}</span>
</div>
<div class="total-line">
    <span>IGV 18%:</span>
    <span>{{ formatCurrency(calculateTotalIGV()) }}</span>
</div>
<div class="total-line total-final">
    <span><strong>TOTAL:</strong></span>
    <span><strong>{{ formatCurrency(props.order.total_amount) }}</strong></span>
</div>
<div class="discount-note" style="font-size:0.95em; color:#888; margin-top:0.5rem;">
    El IGV y el total han sido calculados automáticamente a partir de los precios con IGV incluido.
</div>
                </div>
            </div>

            <!-- Notas adicionales -->
            <div class="notes-section" v-if="order.notes">
                <h3>Observaciones</h3>
                <p>{{ order.notes }}</p>
            </div>

            <!-- Footer -->
            <div class="print-footer">
                <div class="footer-info">
                    <p><strong>Impreso por:</strong> {{ user.name }}</p>
                    <p><strong>Fecha de impresión:</strong> {{ formatDate(new Date()) }}</p>
                </div>
                <div class="signatures">
                    <div class="signature-box">
                        <div class="signature-line"></div>
                        <div class="signature-info">
                            <p class="signature-role"><strong>Solicitado por:</strong></p>
                            <p class="signature-name">{{ getRequestedBy() }}</p>
                            <p class="signature-date">{{ getRequestedDate() }}</p>
                        </div>
                    </div>
                    <div class="signature-box" v-if="order.status !== 'PENDIENTE'">
                        <div class="signature-line"></div>
                        <div class="signature-info">
                            <p class="signature-role"><strong>Aprobado por:</strong></p>
                            <p class="signature-name">{{ getApprovedBy() }}</p>
                            <p class="signature-date">{{ getApprovedDate() }}</p>
                        </div>
                    </div>
                    <div class="signature-box" v-if="order.status === 'RECIBIDO'">
                        <div class="signature-line"></div>
                        <div class="signature-info">
                            <p class="signature-role"><strong>Recibido por:</strong></p>
                            <p class="signature-name">{{ getReceivedBy() }}</p>
                            <p class="signature-date">{{ getReceivedDate() }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <template #footer>
            <div class="dialog-footer">
                <Button label="Vista Previa" icon="pi pi-eye" @click="handlePreview" class="p-button-outlined" />
                <Button label="Imprimir" icon="pi pi-print" @click="handlePrint" class="p-button-success" />
                <Button label="Cerrar" icon="pi pi-times" @click="onClose" class="p-button-text" />
            </div>
        </template>
    </Dialog>
</template>

<script setup>
import { ref, defineProps, defineEmits, computed } from 'vue';
import { useAuthStore } from '@/stores/authStore';

const authStore = useAuthStore();
const user = authStore.currentUser;

const props = defineProps({
    order: {
        type: Object,
        required: true
    }
});

const emit = defineEmits(['close']);
const visible = ref(true);

function onClose() {
    visible.value = false;
    emit('close');
}

function handlePreview() {
    const printContent = generatePrintContent();
    const previewWindow = window.open('', '', 'width=900,height=700');
    previewWindow.document.write(printContent);
    previewWindow.document.close();
    previewWindow.focus();
}

function handlePrint() {
    const printContent = generatePrintContent();
    const printWindow = window.open('', '', 'width=900,height=700');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
}

function generatePrintContent() {
    const content = document.querySelector('.print-section').innerHTML;
    return `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Orden de Compra #${props.order.id}</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: 'Arial', sans-serif;
                    font-size: 12px;
                    line-height: 1.4;
                    color: #333;
                    background: white;
                }
                .print-section { padding: 20px; max-width: 800px; margin: 0 auto; }
                .company-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2c3e50; padding-bottom: 15px; }
                .company-name { font-size: 24px; font-weight: bold; color: #2c3e50; margin-bottom: 10px; }
                .company-details p { margin: 2px 0; color: #666; }
                .document-title { text-align: center; margin-bottom: 30px; }
                .document-title h2 { font-size: 20px; color: #2c3e50; margin-bottom: 5px; }
                .order-number { font-size: 16px; font-weight: bold; color: #e74c3c; }
                .main-info { display: flex; gap: 30px; margin-bottom: 30px; }
                .info-column { flex: 1; }
                .info-group { background: #f8f9fa; padding: 15px; border-radius: 5px; }
                .info-group h3 { color: #2c3e50; margin-bottom: 10px; font-size: 14px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
                .info-group p { margin: 5px 0; }
                .products-section { margin-bottom: 30px; }
                .products-section h3 { color: #2c3e50; margin-bottom: 15px; font-size: 16px; }
                .products-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                .products-table th { background: #2c3e50; color: white; padding: 12px 8px; text-align: left; font-weight: bold; }
                .products-table td { padding: 10px 8px; border-bottom: 1px solid #ddd; }
                .products-table tbody tr:nth-child(even) { background: #f8f9fa; }
                .product-info strong { display: block; margin-bottom: 2px; }
                .product-code { color: #666; font-size: 10px; }
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                .totals-section { margin-bottom: 30px; }
                .totals-container { width: 300px; margin-left: auto; }
                .total-line { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
                .total-final { border-top: 2px solid #2c3e50; border-bottom: 2px solid #2c3e50; font-size: 14px; }
                .discount { color: #e74c3c; }
                .notes-section { margin-bottom: 30px; padding: 15px; background: #f8f9fa; border-radius: 5px; }
                .notes-section h3 { color: #2c3e50; margin-bottom: 10px; }
                .print-footer { border-top: 1px solid #ddd; padding-top: 20px; }
                .footer-info { margin-bottom: 30px; }
                .signatures { display: flex; justify-content: space-between; }
                .signature-box { text-align: center; width: 180px; padding: 0 10px; }
                .signature-line { height: 1px; background: #333; margin: 40px 0 10px 0; }
                .signature-info { font-size: 0.85rem; }
                .signature-role { font-weight: bold; color: #2c3e50; margin-bottom: 5px; }
                .signature-name { color: #666; margin-bottom: 3px; font-weight: 500; }
                .signature-date { color: #999; font-size: 0.8rem; }
                .status-pendiente { color: #f39c12; }
                .status-aprobado { color: #27ae60; }
                .status-recibido { color: #3498db; }
                .status-anulado { color: #e74c3c; }
                .status-rechazado { color: #e74c3c; }
                @media print {
                    body { font-size: 11px; }
                    .print-section { padding: 15px; }
                    .company-header { margin-bottom: 20px; }
                    .document-title { margin-bottom: 20px; }
                    .main-info { margin-bottom: 20px; }
                    .products-section { margin-bottom: 20px; }
                    .totals-section { margin-bottom: 20px; }
                }
            </style>
        </head>
        <body>
            ${content}
        </body>
        </html>
    `;
}

// Subtotal de cada producto (cantidad * precio unitario - descuento individual)
function getDetailSubtotal(item) {
    const subtotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
    const discount = parseFloat(item.discount_amount) || 0;
    return Math.max(subtotal - discount, 0);
}
// Precio unitario sin IGV
function getUnitPriceNoIGV(item) {
    return +(parseFloat(item.unit_price) / 1.18).toFixed(2);
}
// IGV por unidad
function getUnitIGV(item) {
    return +(parseFloat(item.unit_price) - getUnitPriceNoIGV(item)).toFixed(2);
}
// Subtotal sin IGV por producto
function getDetailSubtotalNoIGV(item) {
    return +(getDetailSubtotal(item) / 1.18).toFixed(2);
}
// IGV total por producto
function getDetailIGV(item) {
    return +(getDetailSubtotal(item) - getDetailSubtotalNoIGV(item)).toFixed(2);
}
// Suma total de subtotales sin IGV
function calculateSubtotalNoIGV() {
    if (!props.order.details) return 0;
    return props.order.details.reduce((sum, item) => sum + getDetailSubtotalNoIGV(item), 0);
}
// Suma total de IGV de todos los productos
function calculateTotalIGV() {
    if (!props.order.details) return 0;
    return props.order.details.reduce((sum, item) => sum + getDetailIGV(item), 0);
}
// Suma total de descuentos unitarios aplicados en el detalle
function totalUnitDiscounts() {
    if (!props.order.details) return 0;
    return props.order.details.reduce((sum, item) => sum + (parseFloat(item.discount_amount) || 0), 0);
}
// Suma de subtotales de productos (antes de descuento general)
function calculateSubtotal() {
    if (!props.order.details) return 0;
    return props.order.details.reduce((sum, item) => sum + getDetailSubtotal(item), 0);
}
// Descuento general de la orden
function calculateGeneralDiscount() {
    return parseFloat(props.order.discount_amount) || 0;
}
// Base imponible (subtotal - descuento general)
function calculateBaseImponible() {
    return Math.max(calculateSubtotal() - calculateGeneralDiscount(), 0);
}
// IGV (18%)
function calculateIGV() {
    const igvPercent = 0.18;
    return Math.round(calculateBaseImponible() * igvPercent * 100) / 100;
}
// Total final
function calculateTotal() {
    return Math.round((calculateBaseImponible() + calculateIGV()) * 100) / 100;
}

function formatCurrency(value) {
    if (typeof value === 'string') value = parseFloat(value);
    if (isNaN(value)) return 'S/ 0.00';
    return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: 'PEN',
        minimumFractionDigits: 2
    }).format(value);
}

function formatNumber(value) {
    if (typeof value === 'string') value = parseFloat(value);
    if (isNaN(value)) return '0';
    return new Intl.NumberFormat('es-PE', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(value);
}

function formatDate(value) {
    if (!value) return 'N/A';
    return new Intl.DateTimeFormat('es-PE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(value));
}

function getStatusLabel(status) {
    const statusLabels = {
        PENDIENTE: 'Pendiente',
        APROBADO: 'Aprobado',
        RECIBIDO: 'Recibido',
        ANULADO: 'Anulado',
        RECHAZADO: 'Rechazado'
    };
    return statusLabels[status] || status;
}

function getStatusClass(status) {
    return `status-${status?.toLowerCase()}`;
}

// Funciones para obtener información de responsables
function getRequestedBy() {
    return props.order?.user?.name || 'N/A';
}

function getRequestedDate() {
    return props.order?.created_at ? formatDateOnly(props.order.created_at) : 'N/A';
}

function getApprovedBy() {
    return props.order?.status_tracking?.approved_by?.name || 'N/A';
}

function getApprovedDate() {
    return props.order?.status_tracking?.approved_at ? formatDateOnly(props.order.status_tracking.approved_at) : 'N/A';
}

function getReceivedBy() {
    return props.order?.status_tracking?.received_by?.name || 'N/A';
}

function getReceivedDate() {
    return props.order?.status_tracking?.received_at ? formatDateOnly(props.order.status_tracking.received_at) : 'N/A';
}

function formatDateOnly(value) {
    if (!value) return 'N/A';
    return new Intl.DateTimeFormat('es-PE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(new Date(value));
}
</script>

<style scoped>
.print-section {
    padding: 2rem;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.company-header {
    text-align: center;
    margin-bottom: 2rem;
    border-bottom: 2px solid #2c3e50;
    padding-bottom: 1rem;
}

.company-name {
    font-size: 1.8rem;
    font-weight: bold;
    color: #2c3e50;
    margin-bottom: 0.5rem;
}

.company-details p {
    margin: 0.2rem 0;
    color: #666;
    font-size: 0.9rem;
}

.document-title {
    text-align: center;
    margin-bottom: 2rem;
}

.document-title h2 {
    font-size: 1.5rem;
    color: #2c3e50;
    margin-bottom: 0.5rem;
}

.order-number {
    font-size: 1.2rem;
    font-weight: bold;
    color: #e74c3c;
}

.main-info {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    margin-bottom: 2rem;
}

.info-group {
    background: #f8f9fa;
    padding: 1.5rem;
    border-radius: 8px;
    border-left: 4px solid #3498db;
}

.info-group h3 {
    color: #2c3e50;
    margin-bottom: 1rem;
    font-size: 1.1rem;
    border-bottom: 1px solid #ddd;
    padding-bottom: 0.5rem;
}

.info-group p {
    margin: 0.5rem 0;
    font-size: 0.9rem;
}

.products-section {
    margin-bottom: 2rem;
}

.products-section h3 {
    color: #2c3e50;
    margin-bottom: 1rem;
    font-size: 1.2rem;
}

.products-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 1rem;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    overflow: hidden;
}

.products-table th {
    background: #2c3e50;
    color: white;
    padding: 1rem 0.8rem;
    text-align: left;
    font-weight: 600;
    font-size: 0.9rem;
}

.products-table td {
    padding: 0.8rem;
    border-bottom: 1px solid #eee;
    font-size: 0.9rem;
}

.products-table tbody tr:hover {
    background: #f8f9fa;
}

.col-item {
    width: 5%;
    text-align: center;
}
.col-product {
    width: 40%;
}
.col-quantity {
    width: 10%;
    text-align: center;
}
.col-unit {
    width: 10%;
    text-align: center;
}
.col-price {
    width: 15%;
    text-align: right;
}
.col-subtotal {
    width: 15%;
    text-align: right;
}

.product-info strong {
    display: block;
    margin-bottom: 0.2rem;
}

.product-code {
    color: #666;
    font-size: 0.8rem;
}

.text-center {
    text-align: center;
}
.text-right {
    text-align: right;
}

.totals-section {
    margin-bottom: 2rem;
}

.totals-container {
    width: 350px;
    margin-left: auto;
    background: #f8f9fa;
    padding: 1.5rem;
    border-radius: 8px;
    border: 1px solid #ddd;
}

.total-line {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0;
    border-bottom: 1px solid #eee;
}

.total-final {
    border-top: 2px solid #2c3e50;
    border-bottom: 2px solid #2c3e50;
    margin-top: 0.5rem;
    padding-top: 1rem;
    font-size: 1.1rem;
    font-weight: bold;
}

.discount {
    color: #e74c3c;
}

.notes-section {
    margin-bottom: 2rem;
    padding: 1.5rem;
    background: #fff3cd;
    border: 1px solid #ffeaa7;
    border-radius: 8px;
}

.notes-section h3 {
    color: #856404;
    margin-bottom: 1rem;
}

.print-footer {
    border-top: 2px solid #2c3e50;
    padding-top: 1.5rem;
}

.footer-info {
    margin-bottom: 2rem;
    display: flex;
    justify-content: space-between;
    font-size: 0.9rem;
    color: #666;
}

.signatures {
    display: flex;
    justify-content: space-between;
    margin-top: 3rem;
}

.signature-box {
    text-align: center;
    width: 180px;
    padding: 0 10px;
}

.signature-line {
    height: 1px;
    background: #333;
    margin: 3rem 0 1rem 0;
}

.signature-info {
    font-size: 0.85rem;
}

.signature-role {
    font-weight: bold;
    color: #2c3e50;
    margin-bottom: 0.5rem;
}

.signature-name {
    color: #666;
    margin-bottom: 0.3rem;
    font-weight: 500;
}

.signature-date {
    color: #999;
    font-size: 0.8rem;
}

.dialog-footer {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
}

/* Status colors */
.status-pendiente {
    color: #f39c12;
    font-weight: bold;
}
.status-aprobado {
    color: #27ae60;
    font-weight: bold;
}
.status-recibido {
    color: #3498db;
    font-weight: bold;
}
.status-anulado {
    color: #e74c3c;
    font-weight: bold;
}
.status-rechazado {
    color: #e74c3c;
    font-weight: bold;
}

/* Responsive */
@media (max-width: 768px) {
    .main-info {
        grid-template-columns: 1fr;
        gap: 1rem;
    }

    .signatures {
        flex-direction: column;
        gap: 2rem;
    }

    .footer-info {
        flex-direction: column;
        gap: 0.5rem;
    }
}
</style>
