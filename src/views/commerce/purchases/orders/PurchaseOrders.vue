<script setup>
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog.vue';
import { useAuthStore } from '@/stores/authStore';
import { usePurchaseStore } from '@/stores/purchaseStore';
import { useBatchesStore } from '@/stores/batchesStore';
import { addPurchaseBonuses } from '@/api/index';
import { DatePicker, InputNumber, InputText, Select } from 'primevue';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';
import PurchaseOrderFormDialog from './componentsOrders/PurchaseOrderFormDialog.vue';
import PurchaseOrdersTable from './componentsOrders/PurchaseOrdersTable.vue';
import PurchaseOrderStatistics from './componentsOrders/PurchaseOrderStatistics.vue';
import BatchManagementDialog from './componentsOrders/BatchManagementDialog.vue';
import BonusManagementDialog from './componentsOrders/BonusManagementDialog.vue';

const toast = useToast();
const purchaseStore = usePurchaseStore();
const authStore = useAuthStore();
const batchesStore = useBatchesStore();

// Estados
const purchaseOrders = ref([]);
const selectedOrder = ref(null);
const showPurchaseOrderDialog = ref(false);
const showDeleteDialog = ref(false);

// Filtros rápidos y avanzados
const quickFilters = ref({
    status: null,
    period: null,
    orderNumber: null,
    orderNumberFrom: null,
    orderNumberTo: null,
    providerId: null,
    warehouseId: null,
    documentNumber: '',
    dateFrom: null,
    dateTo: null
});

// Estado para búsqueda avanzada
const showAdvancedSearch = ref(false);
const searchMode = ref('simple');
const providerOptions = ref([]); // Se cargará desde el store
const warehouseOptions = ref([]); // Se cargará desde el store

const statusFilterOptions = ref([
    { name: 'Todos los estados', value: null },
    { name: 'Pendiente', value: 'PENDIENTE' },
    { name: 'Aprobado', value: 'APROBADO' },
    { name: 'Recibido', value: 'RECIBIDO' },
    { name: 'Anulado', value: 'ANULADO' }
]);

const periodFilterOptions = ref([
    { name: 'Todos los períodos', value: null },
    { name: 'Última semana', value: 'week' },
    { name: 'Último mes', value: 'month' },
    { name: 'Últimos 3 meses', value: 'quarter' },
    { name: 'Este año', value: 'year' }
]);

// Inicialización
onMounted(async () => {
    await Promise.all([loadPurchaseOrders(), loadAuxiliaryData()]);
    console.log(authStore.user);
});

// Métodos
const handleApproveOrder = async (order) => {
    await purchaseStore.approvePurchaseOrder(order.id);
    if (purchaseStore.success) {
        purchaseOrders.value = purchaseStore.purchaseOrdersList;
        showSuccess('Orden aprobada', `Orden #${order.order_number} aprobada exitosamente`);
    } else {
        handleError('Error al aprobar orden', purchaseStore.message, purchaseStore.validationErrors);
    }
};

const handleReceiveOrder = async (order) => {
    // Validar workflow de compras
    if (authStore.user?.company_config?.purchase_workflow === 'standard' && order.status === 'APROBADO') {
        // Verificar si hay productos que requieren lotes
        const productsRequiringBatches = order.details?.filter(detail => 
            detail.product?.requires_batches === true
        ) || [];
        
        if (productsRequiringBatches.length > 0) {
            // Separar productos que auto-generan lotes de los que no
            const autoGenerateProducts = productsRequiringBatches.filter(detail => 
                detail.product?.auto_generate_batches === true
            );
            const manualBatchProducts = productsRequiringBatches.filter(detail => 
                detail.product?.auto_generate_batches !== true
            );
            
            if (manualBatchProducts.length > 0) {
                // Mostrar diálogo para gestionar lotes manualmente
                showBatchManagementDialog(order, manualBatchProducts, autoGenerateProducts);
                return;
            }
            
            // Si solo hay productos con auto-generación, continuar con el proceso
            if (autoGenerateProducts.length > 0) {
                showSuccess('Procesando lotes', 'Generando lotes automáticamente para productos configurados...');
                // Los lotes se generarán automáticamente en el backend
            }
        }
    }
    
    // Proceder con la recepción normal
    await purchaseStore.receivePurchaseOrder(order.id);
    if (purchaseStore.success) {
        purchaseOrders.value = purchaseStore.purchaseOrdersList;
        showSuccess('Orden recibida', `Orden #${order.order_number} marcada como recibida`);
    } else {
        handleError('Error al recibir orden', purchaseStore.message, purchaseStore.validationErrors);
    }
};

// Estado para gestión de lotes
const showBatchDialog = ref(false);
const selectedOrderForBatch = ref(null);
const batchManagementData = ref({
    manualProducts: [],
    autoProducts: []
});

// Estados para gestión de bonificaciones
const showBonusDialog = ref(false);
const selectedOrderForBonus = ref(null);

const showBatchManagementDialog = (order, manualProducts, autoProducts) => {
    selectedOrderForBatch.value = order;
    batchManagementData.value = {
        manualProducts,
        autoProducts
    };
    showBatchDialog.value = true;
};

const handleBatchManagementSubmit = async (batchData) => {
    try {
        // Procesar lotes y obtener IDs antes de la recepción
        const details = [];

        // Procesar lotes manuales
        for (const productBatch of batchData.manualBatches || []) {
            for (const batch of productBatch.batches) {
                let batchId = null;

                if (batch.batchType === 'existing') {
                    // Usar lote existente
                    batchId = batch.existingBatchId;
                } else {
                    // Crear nuevo lote
                    const newBatchData = {
                        product_id: productBatch.productId,
                        code: batch.batchNumber,
                        expiration_date: batch.expirationDate ? 
                            new Date(batch.expirationDate).toISOString().split('T')[0] : null,
                        notes: batch.notes || null
                    };

                    console.log('Creando nuevo lote:', newBatchData);
                    
                    // Crear el lote usando el batchesStore
                    await batchesStore.createBatch(newBatchData);
                    
                    if (batchesStore.success && batchesStore.batch) {
                        batchId = batchesStore.batch.id;
                        console.log('Lote creado con ID:', batchId);
                    } else {
                        throw new Error(`Error al crear lote: ${batchesStore.message}`);
                    }
                }

                // Agregar al array de detalles
                details.push({
                    purchase_detail_id: productBatch.purchaseDetailId,
                    batch_id: batchId
                });
            }
        }

        // Procesar productos con auto-generación (batch_id = null para auto-generación)
        batchData.autoGenerateProducts?.forEach(product => {
            details.push({
                purchase_detail_id: product.purchaseDetailId,
                batch_id: null // null indica auto-generación en el backend
            });
        });

        const requestData = details.length > 0 ? { details } : null;
        
        console.log('Datos para recepción de orden:', requestData);
        
        // Proceder con la recepción de la orden
        await purchaseStore.receivePurchaseOrder(selectedOrderForBatch.value.id, requestData);
        
        if (purchaseStore.success) {
            purchaseOrders.value = purchaseStore.purchaseOrdersList;
            showSuccess('Orden recibida', `Orden #${selectedOrderForBatch.value.order_number} recibida con lotes asignados`);
            showBatchDialog.value = false;
        } else {
            handleError('Error al recibir orden', purchaseStore.message, purchaseStore.validationErrors);
        }
    } catch (error) {
        handleError('Error en gestión de lotes', error.message || 'Error inesperado');
    }
};

// Funciones para gestión de bonificaciones
const handleManageBonuses = (order) => {
    selectedOrderForBonus.value = order;
    showBonusDialog.value = true;
};

const handleBonusSubmit = async (bonusData) => {
    try {
        console.log('Agregando bonificaciones:', bonusData);
        
        const response = await addPurchaseBonuses(selectedOrderForBonus.value.id, bonusData);
        
        if (response && response.data) {
            // Recargar la lista de órdenes para mostrar las bonificaciones
            await loadPurchaseOrders();
            
            showSuccess(
                'Bonificaciones agregadas', 
                `Se agregaron ${bonusData.bonuses.length} bonificaciones a la orden #${selectedOrderForBonus.value.order_number}`
            );
            showBonusDialog.value = false;
        }
    } catch (error) {
        console.error('Error al agregar bonificaciones:', error);
        
        if (error.response && error.response.data && error.response.data.message) {
            handleError('Error al agregar bonificaciones', error.response.data.message);
        } else {
            handleError('Error al agregar bonificaciones', 'Error inesperado al procesar las bonificaciones');
        }
    }
};

const handleCancelOrder = async (order) => {
    await purchaseStore.cancelPurchaseOrder(order.id);
    if (purchaseStore.success) {
        purchaseOrders.value = purchaseStore.purchaseOrdersList;
        showSuccess('Orden cancelada', `Orden #${order.order_number} cancelada exitosamente`);
    } else {
        handleError('Error al cancelar orden', purchaseStore.message, purchaseStore.validationErrors);
    }
};

const loadPurchaseOrders = async () => {
    await purchaseStore.fetchPurchaseOrders();

    if (purchaseStore.success) {
        purchaseOrders.value = purchaseStore.purchaseOrdersList;
        // Solo mostrar mensaje de éxito en carga manual
        if (!purchaseStore.isInitialLoad) {
            showSuccess('Lista actualizada', 'Órdenes de compra actualizadas correctamente');
        }
    } else {
        handleError('Error al cargar órdenes', purchaseStore.message, purchaseStore.validationErrors);
    }
};

// Nuevos métodos de búsqueda
const performAdvancedSearch = async () => {
    const searchParams = {
        order_number: quickFilters.value.orderNumber,
        order_number_from: quickFilters.value.orderNumberFrom,
        order_number_to: quickFilters.value.orderNumberTo,
        date_from: quickFilters.value.dateFrom ? formatDateForAPI(quickFilters.value.dateFrom) : null,
        date_to: quickFilters.value.dateTo ? formatDateForAPI(quickFilters.value.dateTo) : null,
        status: quickFilters.value.status,
        provider_id: quickFilters.value.providerId,
        warehouse_id: quickFilters.value.warehouseId,
        document_number: quickFilters.value.documentNumber,
        paginate: false // Para obtener compresión gzip
    };

    // Filtrar parámetros vacíos
    const filteredParams = Object.fromEntries(Object.entries(searchParams).filter(([_, value]) => value !== null && value !== ''));

    await purchaseStore.searchPurchaseOrdersAdvanced(filteredParams);

    if (purchaseStore.success) {
        purchaseOrders.value = purchaseStore.purchaseOrdersList;
        showSuccess('Búsqueda completada', `Se encontraron ${purchaseOrders.value.length} órdenes`);
        searchMode.value = 'advanced';
    } else {
        handleError('Error en búsqueda', purchaseStore.message, purchaseStore.validationErrors);
    }
};

// Búsqueda rápida por número de orden
const searchByOrderNumber = async (orderNumber) => {
    if (!orderNumber) return;

    await purchaseStore.searchPurchaseOrdersByNumber(orderNumber);

    if (purchaseStore.success) {
        purchaseOrders.value = purchaseStore.purchaseOrdersList;
        if (purchaseOrders.value.length > 0) {
            showSuccess('Búsqueda por número', `Orden #${orderNumber} encontrada`);
        } else {
            showError(`No se encontró la orden #${orderNumber}`);
        }
        searchMode.value = 'number';
    } else {
        handleError('Orden no encontrada', purchaseStore.message);
    }
};

// Helper para formatear fechas
const formatDateForAPI = (date) => {
    if (!date) return null;
    const d = new Date(date);
    return d.toISOString().split('T')[0]; // YYYY-MM-DD
};

// Cargar datos auxiliares
const loadAuxiliaryData = async () => {
    // Cargar proveedores y almacenes para los filtros
    await Promise.all([purchaseStore.fetchProviders?.(), purchaseStore.fetchWarehouses?.()]);

    if (purchaseStore.providersList) {
        providerOptions.value = [{ name: 'Todos los proveedores', id: null }, ...purchaseStore.providersList];
    }

    if (purchaseStore.warehousesList) {
        warehouseOptions.value = [{ name: 'Todos los almacenes', id: null }, ...purchaseStore.warehousesList];
    }
};

// Métodos mejorados para manejo de diálogos
const openCreateDialog = () => {
    selectedOrder.value = null;
    showPurchaseOrderDialog.value = true;
};

const openEditDialog = (order) => {
    selectedOrder.value = order;
    showPurchaseOrderDialog.value = true;
};

const openDeleteDialog = (order) => {
    selectedOrder.value = order;
    showDeleteDialog.value = true;
};

// Filtros computados
const filteredOrders = computed(() => {
    let filtered = [...purchaseOrders.value];

    // Filtro por estado
    if (quickFilters.value.status) {
        filtered = filtered.filter((order) => order.status === quickFilters.value.status);
    }

    // Filtro por período
    if (quickFilters.value.period) {
        const now = new Date();
        const filterDate = new Date();

        switch (quickFilters.value.period) {
            case 'week':
                filterDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                filterDate.setMonth(now.getMonth() - 1);
                break;
            case 'quarter':
                filterDate.setMonth(now.getMonth() - 3);
                break;
            case 'year':
                filterDate.setFullYear(now.getFullYear() - 1);
                break;
        }

        filtered = filtered.filter((order) => new Date(order.purchase_date) >= filterDate);
    }

    return filtered;
});

// Métodos para filtros
const applyQuickFilters = () => {
    // Los filtros se aplican automáticamente via computed
};

const clearFilters = () => {
    quickFilters.value = {
        status: null,
        period: null,
        orderNumber: null,
        orderNumberFrom: null,
        orderNumberTo: null,
        providerId: null,
        warehouseId: null,
        documentNumber: '',
        dateFrom: null,
        dateTo: null
    };
    searchMode.value = 'simple';
    showAdvancedSearch.value = false;
    loadPurchaseOrders(); // Recargar datos originales
};

const exportOrders = () => {
    // TODO: Implementar exportación
    showSuccess('Exportación', 'Funcionalidad de exportación próximamente');
};

const handlePurchaseOrderSubmit = async (purchaseOrderData) => {
    const action = purchaseOrderData.id ? purchaseStore.updatePurchaseOrder : purchaseStore.createPurchaseOrder;
    await action(purchaseOrderData);

    if (purchaseStore.success) {
        purchaseOrders.value = purchaseStore.purchaseOrdersList;
        showSuccess(purchaseOrderData.id ? 'Orden actualizada' : 'Orden creada', purchaseOrderData.id ? `Orden #${purchaseOrderData.id} actualizada exitosamente` : 'Nueva orden de compra creada exitosamente');
        showPurchaseOrderDialog.value = false;
    } else {
        handleError(purchaseOrderData.id ? 'Error al actualizar orden' : 'Error al crear orden', purchaseStore.message, purchaseStore.validationErrors);
    }
};

const handlePurchaseOrderDelete = async () => {
    await purchaseStore.deletePurchaseOrder(selectedOrder.value.id);
    if (purchaseStore.success) {
        purchaseOrders.value = purchaseStore.purchaseOrdersList;
        showSuccess('Orden eliminada', `Orden #${selectedOrder.value.order_number} eliminada exitosamente`);
    } else {
        handleError('Error al eliminar orden', purchaseStore.message, purchaseStore.validationErrors);
    }
    showDeleteDialog.value = false;
};

// Helpers mejorados
const showSuccess = (summary, detail) => {
    toast.add({ severity: 'success', summary, detail, life: 3000 });
};

const showError = (detail) => {
    toast.add({ severity: 'error', summary: 'Error', detail, life: 4000 });
};

const handleError = (summary, message, validationErrors = null) => {
    if (validationErrors && validationErrors.length > 0) {
        validationErrors.forEach((err) => {
            toast.add({ severity: 'error', summary: 'Error de validación', detail: err, life: 4000 });
        });
    } else {
        toast.add({ severity: 'error', summary, detail: message, life: 4000 });
    }
};

// Estadísticas reactivas mejoradas con tracking
const statistics = computed(() => {
    const orders = purchaseOrders.value;
    const activeOrders = orders.filter((order) => order.status !== 'ANULADO');

    // Calculaciones de bonificaciones
    const totalBonusItems = orders.reduce((total, order) => {
        return total + (order.totals?.bonus_quantity || 0);
    }, 0);

    const ordersWithBonuses = orders.filter((order) => (order.totals?.bonus_quantity || 0) > 0).length;

    return {
        totalOrders: orders.length,
        totalAmount: activeOrders.reduce((total, order) => total + (Number(order.total_amount) || 0), 0),
        averageAmount: activeOrders.length > 0 ? activeOrders.reduce((total, order) => total + (Number(order.total_amount) || 0), 0) / activeOrders.length : 0,
        highestAmount: activeOrders.length > 0 ? Math.max(...activeOrders.map((order) => Number(order.total_amount) || 0)) : 0,
        lowestAmount: activeOrders.length > 0 ? Math.min(...activeOrders.map((order) => Number(order.total_amount) || 0)) : 0,
        pendingOrders: orders.filter((order) => order.status === 'PENDIENTE').length,
        approvedOrders: orders.filter((order) => order.status === 'APROBADO').length,
        receivedOrders: orders.filter((order) => order.status === 'RECIBIDO').length,
        cancelledOrders: orders.filter((order) => order.status === 'ANULADO').length,
        // Nuevas estadísticas de bonificaciones
        totalBonusItems,
        ordersWithBonuses,
        bonusPercentage: orders.length > 0 ? (ordersWithBonuses / orders.length) * 100 : 0
    };
});

function formatCurrencyPEN(value) {
    // Siempre muestra el símbolo S/ para el sol peruano
    if (typeof value !== 'number') return '';
    return `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
</script>
<template>
    <div class="purchase-orders-view">
        <Toast />
        <ConfirmDialog />

        <!-- Header principal -->
        <div class="page-header">
            <div class="header-content">
                <div class="header-info">
                    <div class="breadcrumb">
                        <i class="pi pi-home"></i>
                        <span>Compras</span>
                        <i class="pi pi-chevron-right"></i>
                        <span>Órdenes de Compra</span>
                    </div>
                    <h1 class="page-title">
                        <i class="pi pi-shopping-cart"></i>
                        Gestión de Órdenes de Compra
                    </h1>
                    <p class="page-description">Administra y controla todas las órdenes de compra de tu empresa</p>
                </div>
                <div class="header-actions">
                    <Button icon="pi pi-refresh" label="Actualizar" outlined class="refresh-btn" @click="loadPurchaseOrders" :loading="purchaseStore.isLoadingPurchaseOrders" v-tooltip.top="'Actualizar lista de órdenes'" />
                    <Button icon="pi pi-plus" label="Nueva Orden" severity="success" @click="openCreateDialog" v-tooltip.top="'Crear nueva orden de compra'" />
                </div>
            </div>
        </div>

        <!-- Estadísticas -->
        <div class="statistics-section">
            <PurchaseOrderStatistics :statistics="statistics" :formatCurrencyPEN="formatCurrencyPEN" :loading="purchaseStore.isLoadingPurchaseOrders" />
        </div>

        <!-- Toolbar con filtros rápidos y avanzados -->
        <div class="toolbar-section">
            <div class="toolbar-content">
                <!-- Búsqueda rápida por número -->
                <div class="quick-search-group">
                    <div class="search-item">
                        <label>Buscar por Orden #:</label>
                        <div class="search-input-group">
                            <InputNumber v-model="quickFilters.orderNumber" placeholder="Ej: 15" class="order-search" @keyup.enter="searchByOrderNumber(quickFilters.orderNumber)" />
                            <Button icon="pi pi-search" @click="searchByOrderNumber(quickFilters.orderNumber)" :disabled="!quickFilters.orderNumber" v-tooltip.top="'Buscar orden específica'" />
                        </div>
                    </div>
                </div>

                <!-- Filtros básicos existentes -->
                <div class="filters-group">
                    <div class="filter-item">
                        <label>Estado:</label>
                        <Select v-model="quickFilters.status" :options="statusFilterOptions" optionLabel="name" optionValue="value" placeholder="Todos los estados" class="status-filter" @change="applyQuickFilters" />
                    </div>
                    <div class="filter-item">
                        <label>Fecha:</label>
                        <Select v-model="quickFilters.period" :options="periodFilterOptions" optionLabel="name" optionValue="value" placeholder="Todos los períodos" class="period-filter" @change="applyQuickFilters" />
                    </div>
                </div>

                <!-- Toggle búsqueda avanzada -->
                <div class="actions-group">
                    <Button
                        :icon="showAdvancedSearch ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"
                        :label="showAdvancedSearch ? 'Ocultar Avanzado' : 'Búsqueda Avanzada'"
                        outlined
                        @click="showAdvancedSearch = !showAdvancedSearch"
                        v-tooltip.top="'Mostrar/ocultar filtros avanzados'"
                    />
                    <Button icon="pi pi-filter-slash" label="Limpiar" outlined @click="clearFilters" v-tooltip.top="'Limpiar todos los filtros'" />
                    <Button icon="pi pi-download" label="Exportar" outlined @click="exportOrders" :disabled="!purchaseOrders.length" v-tooltip.top="'Exportar órdenes a Excel'" />
                </div>
            </div>

            <!-- Panel de búsqueda avanzada -->
            <div v-if="showAdvancedSearch" class="advanced-search-panel">
                <div class="panel-header">
                    <h3 class="panel-title">
                        <i class="pi pi-filter"></i>
                        Filtros Avanzados
                    </h3>
                    <p class="panel-description">Combina múltiples criterios para refinar tu búsqueda</p>
                </div>

                <!-- Grid organizado por categorías -->
                <div class="filters-categories">
                    <!-- Filtros por Números -->
                    <div class="filter-category">
                        <h4 class="category-title">
                            <i class="pi pi-hashtag"></i>
                            Números y Documentos
                        </h4>
                        <div class="category-filters">
                            <div class="filter-item">
                                <label>Rango de Órdenes:</label>
                                <div class="range-inputs">
                                    <InputNumber v-model="quickFilters.orderNumberFrom" placeholder="Desde" :min="1" class="range-input" fluid />
                                    <span class="range-separator">→</span>
                                    <InputNumber v-model="quickFilters.orderNumberTo" placeholder="Hasta" :min="1" class="range-input" fluid />
                                </div>
                            </div>

                            <div class="filter-item">
                                <label>Número de Documento:</label>
                                <InputText v-model="quickFilters.documentNumber" placeholder="Ej: C000001" class="document-input" />
                            </div>
                        </div>
                    </div>

                    <!-- Filtros por Fechas -->
                    <div class="filter-category">
                        <h4 class="category-title">
                            <i class="pi pi-calendar"></i>
                            Fechas
                        </h4>
                        <div class="category-filters">
                            <div class="filter-item">
                                <label>Fecha Desde:</label>
                                <DatePicker v-model="quickFilters.dateFrom" placeholder="Seleccionar fecha" dateFormat="dd/mm/yy" showIcon iconDisplay="input" class="date-picker" />
                            </div>

                            <div class="filter-item">
                                <label>Fecha Hasta:</label>
                                <DatePicker v-model="quickFilters.dateTo" placeholder="Seleccionar fecha" dateFormat="dd/mm/yy" showIcon iconDisplay="input" class="date-picker" />
                            </div>
                        </div>
                    </div>

                    <!-- Filtros por Entidades -->
                    <div class="filter-category">
                        <h4 class="category-title">
                            <i class="pi pi-building"></i>
                            Proveedores y Almacenes
                        </h4>
                        <div class="category-filters">
                            <div class="filter-item">
                                <label>Proveedor:</label>
                                <Select v-model="quickFilters.providerId" :options="providerOptions" optionLabel="name" optionValue="id" placeholder="Seleccionar proveedor" class="entity-select" filter filterPlaceholder="Buscar proveedor..." />
                            </div>

                            <div class="filter-item">
                                <label>Almacén:</label>
                                <Select v-model="quickFilters.warehouseId" :options="warehouseOptions" optionLabel="name" optionValue="id" placeholder="Seleccionar almacén" class="entity-select" filter filterPlaceholder="Buscar almacén..." />
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Acciones del panel -->
                <div class="panel-actions">
                    <div class="action-buttons">
                        <Button icon="pi pi-search" label="Buscar Avanzado" @click="performAdvancedSearch" :loading="purchaseStore.isLoadingPurchaseOrders" class="search-button" v-tooltip.top="'Ejecutar búsqueda con filtros avanzados'" />
                        <Button icon="pi pi-refresh" label="Resetear" outlined @click="loadPurchaseOrders" class="reset-button" v-tooltip.top="'Volver a la lista completa'" />
                    </div>

                    <!-- Indicador del modo de búsqueda activo -->
                    <div v-if="searchMode !== 'simple'" class="search-status">
                        <div class="status-badge" :class="searchMode">
                            <i
                                class="pi"
                                :class="{
                                    'pi-search': searchMode === 'number',
                                    'pi-filter': searchMode === 'advanced'
                                }"
                            ></i>
                            <span v-if="searchMode === 'number'">Búsqueda por número activa</span>
                            <span v-else-if="searchMode === 'advanced'">Filtros avanzados aplicados</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Tabla principal -->
        <div class="table-section">
            <PurchaseOrdersTable
                :purchaseOrders="filteredOrders"
                :loading="purchaseStore.isLoadingPurchaseOrders"
                @edit="openEditDialog"
                @delete="openDeleteDialog"
                @approve-order="handleApproveOrder"
                @receive-order="handleReceiveOrder"
                @cancel-order="handleCancelOrder"
                @manage-bonuses="handleManageBonuses"
            />
        </div>

        <!-- Diálogos -->
        <PurchaseOrderFormDialog v-model:visible="showPurchaseOrderDialog" :order="selectedOrder" @submit="handlePurchaseOrderSubmit" :loading="purchaseStore.isLoadingPurchaseOrders" />
        <DeleteConfirmationDialog v-model:visible="showDeleteDialog" :item-name="selectedOrder?.order_number ? `Orden #${selectedOrder.order_number}` : ''" @confirm="handlePurchaseOrderDelete" />
        <BatchManagementDialog 
            v-model:visible="showBatchDialog" 
            :order="selectedOrderForBatch" 
            :batch-data="batchManagementData" 
            @submit="handleBatchManagementSubmit" 
            :loading="purchaseStore.isLoadingPurchaseOrders" 
        />
        <BonusManagementDialog 
            v-model:visible="showBonusDialog" 
            :order="selectedOrderForBonus" 
            @submit="handleBonusSubmit" 
        />
    </div>
</template>
<style scoped>
/* Layout principal */
.purchase-orders-view {
    @apply min-h-screen;
}

/* Header principal */
.page-header {
    @apply bg-white dark:bg-gray-800 rounded-2xl shadow-lg mb-6 overflow-hidden;
    background: linear-gradient(135deg, #059669 0%, #10b981 50%, #3b82f6 100%);
}

.header-content {
    @apply p-6 flex justify-between items-start gap-6;
}

.header-info {
    @apply flex-1;
}

.breadcrumb {
    @apply flex items-center gap-2 text-white/80 text-sm mb-3;
}

.breadcrumb i {
    @apply text-xs;
}

.page-title {
    @apply text-3xl font-bold text-white mb-2 flex items-center gap-3;
}

.page-title i {
    @apply text-2xl;
}

.page-description {
    @apply text-white/90 text-lg;
}

.header-actions {
    @apply flex gap-3;
}

.refresh-btn {
    @apply bg-white/20 backdrop-blur-sm border-2 border-white/30 text-white;
}

.create-btn {
    @apply bg-white text-purple-600 font-semibold hover:bg-white/90 border-none;
}

/* Sección de estadísticas */
.statistics-section {
    @apply mb-6;
}

/* Toolbar con filtros */
.toolbar-section {
    @apply bg-white dark:bg-gray-800 rounded-xl shadow-md mb-6 p-4;
}

.toolbar-content {
    @apply flex justify-between items-center gap-4;
}

.filters-group {
    @apply flex gap-4;
}

.filter-item {
    @apply flex flex-col gap-2;
}

.filter-item label {
    @apply text-sm font-semibold text-gray-700 dark:text-gray-300;
}

.status-filter,
.period-filter {
    @apply min-w-48;
}

.actions-group {
    @apply flex gap-3;
}

.clear-filters-btn,
.export-btn {
    @apply text-sm;
}

/* Sección de tabla */
.table-section {
    @apply bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden;
}

/* Búsqueda rápida */
.quick-search-group {
    @apply flex gap-3 items-end;
}

.search-item {
    @apply flex flex-col gap-2;
}

.search-item label {
    @apply text-sm font-semibold text-gray-700 dark:text-gray-300;
}

.search-input-group {
    @apply flex gap-2;
}

.order-search {
    @apply min-w-32;
}

/* Panel de búsqueda avanzada */
.advanced-search-panel {
    @apply mt-4 p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 shadow-inner;
}

/* Header del panel */
.panel-header {
    @apply mb-6 text-center;
}

.panel-title {
    @apply text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center justify-center gap-2 mb-2;
}

.panel-description {
    @apply text-sm text-gray-600 dark:text-gray-400;
}

/* Categorías de filtros */
.filters-categories {
    @apply grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6;
}

.filter-category {
    @apply bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-600;
}

.category-title {
    @apply text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-3 pb-2 border-b border-gray-200 dark:border-gray-600;
}

.category-filters {
    @apply space-y-4;
}

/* Inputs específicos */
.range-inputs {
    @apply flex items-center gap-3;
}

.range-input {
    @apply flex-1 min-w-0;
}

.range-separator {
    @apply text-blue-500 font-bold text-lg;
}

.document-input,
.date-picker,
.entity-select {
    @apply w-full;
}

/* Acciones del panel */
.panel-actions {
    @apply bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600;
}

.action-buttons {
    @apply flex justify-center gap-3 mb-4;
}

.search-button {
    @apply bg-blue-600 hover:bg-blue-700 border-blue-600 text-white font-semibold px-6;
}

.reset-button {
    @apply border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700;
}

/* Estado de búsqueda */
.search-status {
    @apply flex justify-center;
}

.status-badge {
    @apply inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium shadow-sm;
}

.status-badge.number {
    @apply bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700;
}

.status-badge.advanced {
    @apply bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-700;
}

/* Responsive design */
@media (max-width: 768px) {
    .purchase-orders-view {
        @apply p-2;
    }

    .header-content {
        @apply flex-col gap-4 p-4;
    }

    .header-actions {
        @apply w-full;
    }

    .refresh-btn,
    .create-btn {
        @apply flex-1;
    }

    .toolbar-content {
        @apply flex-col gap-4;
    }

    .quick-search-group {
        @apply w-full flex-col gap-2;
    }

    .search-input-group {
        @apply w-full;
    }

    .order-search {
        @apply flex-1;
    }

    .filters-group {
        @apply w-full flex-col gap-3;
    }

    .filter-item {
        @apply w-full;
    }

    .status-filter,
    .period-filter {
        @apply min-w-full;
    }

    .actions-group {
        @apply w-full;
    }

    .clear-filters-btn,
    .export-btn {
        @apply flex-1;
    }

    /* Búsqueda avanzada responsive */
    .filters-categories {
        @apply grid-cols-1 gap-4;
    }

    .panel-header {
        @apply mb-4;
    }

    .panel-title {
        @apply text-base;
    }

    .category-title {
        @apply text-xs;
    }

    .range-inputs {
        @apply flex-col gap-2;
    }

    .range-separator {
        @apply self-center text-base;
    }

    .action-buttons {
        @apply flex-col gap-2;
    }

    .search-button,
    .reset-button {
        @apply w-full text-sm;
    }
}

@media (max-width: 480px) {
    .page-title {
        @apply text-2xl;
    }

    .page-description {
        @apply text-base;
    }

    .header-actions {
        @apply flex-col;
    }

    .search-item label {
        @apply text-xs;
    }

    .status-badge {
        @apply text-xs px-2 py-1;
    }

    .panel-actions {
        @apply p-3;
    }

    .advanced-search-panel {
        @apply p-4;
    }

    .filter-category {
        @apply p-3;
    }
}
</style>
