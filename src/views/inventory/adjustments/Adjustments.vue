<script setup>
import { useStockAdjustmentsStore } from '@/stores/stockAdjustmentsStore';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';

// Components
import NewStockAdjustmentModal from './componentsStockAdjustments/NewStockAdjustmentModal.vue';
import StockAdjustmentDetailsModal from './componentsStockAdjustments/StockAdjustmentDetailsModal.vue';
import StockAdjustmentsStatistics from './componentsStockAdjustments/StockAdjustmentsStatistics.vue';
import StockAdjustmentsTable from './componentsStockAdjustments/StockAdjustmentsTable.vue';
import StockAdjustmentsToolbar from './componentsStockAdjustments/StockAdjustmentsToolbar.vue';

const toast = useToast();
const adjustmentsStore = useStockAdjustmentsStore();

// Function to get default date range (from 30 days ago up to tomorrow)
const getDefaultDateRange = () => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    return {
        from: thirtyDaysAgo,
        to: tomorrow
    };
};

// Initialize default date range
const defaultDates = getDefaultDateRange();

// Local reactive refs for UI with default values
const typeFilter = ref(null);
const warehouseFilter = ref(null);
const dateFromFilter = ref(defaultDates.from);
const dateToFilter = ref(defaultDates.to);

// Dialog refs
const showDetailsModal = ref(false);
const showNewAdjustmentModal = ref(false);
const selectedAdjustmentForDetails = ref(null);

// Error handling state
const hasError = ref(false);
const errorMessage = ref('');

// Computed properties using store data
const loading = computed(() => adjustmentsStore.isLoadingAdjustments);
const adjustmentItems = computed(() => adjustmentsStore.filteredAdjustments);

// Statistics computed from store - all using filtered data for consistency
const totalAdjustments = computed(() => adjustmentsStore.filteredAdjustments.length);
const totalPositive = computed(() => adjustmentsStore.totalPositive);
const totalNegative = computed(() => adjustmentsStore.totalNegative);
const totalQuantityAdjusted = computed(() => adjustmentsStore.totalQuantityAdjusted);

// Utility function to format dates for API (YYYY-MM-DD format)
const formatDateForAPI = (date, type = 'start') => {
    if (!date) return null;

    try {
        // Handle different date input types
        let dateObj;

        if (date instanceof Date) {
            dateObj = new Date(date);
        } else if (typeof date === 'string') {
            dateObj = new Date(date);
        } else {
            return null;
        }

        // Check if date is valid
        if (isNaN(dateObj.getTime())) {
            console.warn('Invalid date provided:', date);
            return null;
        }

        // For 'end' dates, set time to end of day to include all records from that day
        if (type === 'end') {
            dateObj.setHours(23, 59, 59, 999);
        } else {
            // For 'start' dates, set time to beginning of day
            dateObj.setHours(0, 0, 0, 0);
        }

        // Format to YYYY-MM-DD HH:mm:ss for better API compatibility
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        const hours = String(dateObj.getHours()).padStart(2, '0');
        const minutes = String(dateObj.getMinutes()).padStart(2, '0');
        const seconds = String(dateObj.getSeconds()).padStart(2, '0');

        // Return full datetime for end dates, just date for start dates
        if (type === 'end') {
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        } else {
            return `${year}-${month}-${day}`;
        }
    } catch (error) {
        console.error('Error formatting date:', error);
        return null;
    }
};

// Dynamic warehouse options based on actual data
const warehouseOptions = computed(() => {
    const warehouses = new Map();
    warehouses.set(null, { label: 'Todos los almacenes', value: null });

    adjustmentsStore.adjustmentsList.forEach((adjustment) => {
        if (adjustment.warehouse_id && adjustment.warehouse_name) {
            if (!warehouses.has(adjustment.warehouse_id)) {
                warehouses.set(adjustment.warehouse_id, {
                    label: adjustment.warehouse_name,
                    value: adjustment.warehouse_id
                });
            }
        }
    });

    return Array.from(warehouses.values());
});

// Watch for filter changes and update store
watch(
    [typeFilter, warehouseFilter, dateFromFilter, dateToFilter],
    ([type, warehouse, dateFrom, dateTo]) => {
        adjustmentsStore.setTypeFilter(type);
        adjustmentsStore.setWarehouseFilter(warehouse);

        // Format dates to YYYY-MM-DD format for API
        const formattedDateFrom = dateFrom ? formatDateForAPI(dateFrom, 'start') : null;
        const formattedDateTo = dateTo ? formatDateForAPI(dateTo, 'end') : null;

        adjustmentsStore.setDateFromFilter(formattedDateFrom);
        adjustmentsStore.setDateToFilter(formattedDateTo);
    },
    { immediate: true }
);

// Lifecycle
onMounted(async () => {
    await loadAdjustments();

    // Show success/error messages from store
    if (adjustmentsStore.message) {
        const severity = adjustmentsStore.success ? 'success' : 'error';
        const summary = adjustmentsStore.success ? 'Éxito' : 'Error';
        showToast(severity, summary, adjustmentsStore.message);
        adjustmentsStore.clearMessage();
    }
});

// Utility function for showing toast messages
const showToast = (severity, summary, detail) => {
    toast.add({
        severity,
        summary,
        detail,
        life: 3000
    });
};

// Methods
const loadAdjustments = async () => {
    try {
        hasError.value = false;
        errorMessage.value = '';
        await adjustmentsStore.fetchAdjustments();
    } catch (error) {
        console.error('Error loading adjustments:', error);
        hasError.value = true;
        errorMessage.value = 'Error al cargar los ajustes de stock';
        showToast('error', 'Error', errorMessage.value);
    }
};

const handleRefresh = async () => {
    try {
        await loadAdjustments();
        if (adjustmentsStore.success) {
            showToast('success', 'Éxito', 'Ajustes actualizados correctamente');
        }
    } catch (error) {
        console.error('Error refreshing adjustments:', error);
        showToast('error', 'Error', 'Error al actualizar los ajustes');
    }
};

const viewAdjustmentDetails = (adjustment) => {
    selectedAdjustmentForDetails.value = adjustment;
    showDetailsModal.value = true;
};

const openNewAdjustmentModal = () => {
    showNewAdjustmentModal.value = true;
};

const handleAdjustmentCreated = async (adjustmentData) => {
    // Recargar la lista de ajustes
    await loadAdjustments();
    showToast('success', 'Éxito', 'Ajuste de stock creado correctamente');
};

const clearFilters = () => {
    // Reset filters to default values
    typeFilter.value = null;
    warehouseFilter.value = null;

    // Reset dates to default range (30 days back)
    const newDefaultDates = getDefaultDateRange();
    dateFromFilter.value = newDefaultDates.from;
    dateToFilter.value = newDefaultDates.to;

    // Clear store filters (this will trigger the watcher to update with new default dates)
    adjustmentsStore.clearFilters();
};
</script>

<template>
    <div class="stock-adjustments-page">
        <!-- Toast notifications -->
        <Toast />

        <!-- Toolbar Principal con Filtros Integrados -->
        <StockAdjustmentsToolbar :total-adjustments="totalAdjustments" :total-positive="totalPositive"
            :total-negative="totalNegative" :is-loading="loading" v-model:type-filter="typeFilter"
            v-model:warehouse-filter="warehouseFilter" v-model:date-from-filter="dateFromFilter"
            v-model:date-to-filter="dateToFilter" :warehouse-options="warehouseOptions" @refresh="handleRefresh"
            @clear-filters="clearFilters" @new-adjustment="openNewAdjustmentModal" />

        <!-- Estadísticas -->
        <StockAdjustmentsStatistics :total-adjustments="totalAdjustments" :total-positive="totalPositive"
            :total-negative="totalNegative" :total-quantity-adjusted="totalQuantityAdjusted" :loading="loading" />

        <!-- Tabla de Ajustes -->
        <transition name="slide-up" appear>
            <StockAdjustmentsTable :adjustments="adjustmentItems" :loading="loading"
                @view-details="viewAdjustmentDetails" @clear-filters="clearFilters" />
        </transition>

        <!-- Modal de Detalles -->
        <StockAdjustmentDetailsModal v-model:visible="showDetailsModal"
            :adjustment-data="selectedAdjustmentForDetails" />

        <!-- Modal de Nuevo Ajuste -->
        <NewStockAdjustmentModal v-model:visible="showNewAdjustmentModal"
            @adjustment-created="handleAdjustmentCreated" />
    </div>
</template>

<style scoped>
/* Contenedor principal de la página de ajustes */
.stock-adjustments-page {
    @apply min-h-screen space-y-6;
}

/* Animaciones de transición */
.slide-up-enter-active {
    transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.slide-up-enter-from {
    transform: translateY(20px);
    opacity: 0;
}

/* Ajustes responsivos para pantallas pequeñas */
@media (max-width: 640px) {
    .stock-adjustments-page {
        @apply space-y-4 p-2;
    }
}
</style>
