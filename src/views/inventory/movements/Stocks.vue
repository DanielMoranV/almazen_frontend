<template>
    <div class="stock-movements-page">
        <!-- Toast notifications -->
        <Toast />

        <!-- Toolbar Principal -->
        <StockMovementsToolbar :total-movements="totalMovements" :total-entries="totalEntries" :total-exits="totalExits"
            :is-loading="loading" v-model:type-filter="typeFilter" v-model:warehouse-filter="warehouseFilter"
            v-model:date-from-filter="dateFromFilter" v-model:date-to-filter="dateToFilter"
            :warehouse-options="warehouseOptions" @refresh="handleRefresh" @clear-filters="clearFilters" />

        <!-- Estadísticas -->
        <StockMovementsStatistics :total-movements="totalMovements" :total-entries="totalEntries"
            :total-exits="totalExits" :total-adjustments="totalAdjustments" :total-transfers="totalTransfers"
            :loading="loading" />

        <!-- Tabla de Movimientos -->
        <transition name="slide-up" appear>
            <StockMovementsTable :movements="movementItems" :loading="loading" @view-details="viewMovementDetails"
                @clear-filters="clearFilters" />
        </transition>

        <!-- Modal de Detalles -->
        <StockMovementDetailsModal v-model:visible="showDetailsModal" :movement-data="selectedMovementForDetails" />
    </div>
</template>

<script setup>
import { useStockMovementsStore } from '@/stores/stockMovementsStore';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';

// Components
import StockMovementDetailsModal from './componentsStockMovements/StockMovementDetailsModal.vue';
import StockMovementsStatistics from './componentsStockMovements/StockMovementsStatistics.vue';
import StockMovementsTable from './componentsStockMovements/StockMovementsTable.vue';
import StockMovementsToolbar from './componentsStockMovements/StockMovementsToolbar.vue';

const toast = useToast();
const movementsStore = useStockMovementsStore();

// Function to get default date range (30 days back from today)
const getDefaultDateRange = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    return {
        from: thirtyDaysAgo,
        to: today
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
const selectedMovementForDetails = ref(null);

// Error handling state
const hasError = ref(false);
const errorMessage = ref('');

// Computed properties using store data
const loading = computed(() => movementsStore.isLoadingMovements);
const movementItems = computed(() => movementsStore.filteredMovements);

// Statistics computed from store - all using filtered data for consistency
const totalMovements = computed(() => movementsStore.filteredMovements.length);
const totalEntries = computed(() => movementsStore.totalEntries);
const totalExits = computed(() => movementsStore.totalExits);
const totalAdjustments = computed(() => movementsStore.totalAdjustments);
const totalTransfers = computed(() => movementsStore.totalTransfers);

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

    movementsStore.movementsList.forEach((movement) => {
        if (movement.warehouse_id && movement.warehouse_name) {
            if (!warehouses.has(movement.warehouse_id)) {
                warehouses.set(movement.warehouse_id, {
                    label: movement.warehouse_name,
                    value: movement.warehouse_id
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
        movementsStore.setTypeFilter(type);
        movementsStore.setWarehouseFilter(warehouse);

        // Format dates to YYYY-MM-DD format for API
        const formattedDateFrom = dateFrom ? formatDateForAPI(dateFrom, 'start') : null;
        const formattedDateTo = dateTo ? formatDateForAPI(dateTo, 'end') : null;

        movementsStore.setDateFromFilter(formattedDateFrom);
        movementsStore.setDateToFilter(formattedDateTo);

        // Debug: Log the formatted dates
        console.log('Date filters:', {
            original: { dateFrom, dateTo },
            formatted: { formattedDateFrom, formattedDateTo }
        });
    },
    { immediate: true }
);

// Lifecycle
onMounted(async () => {
    await loadMovements();

    // Show success/error messages from store
    if (movementsStore.message) {
        const severity = movementsStore.success ? 'success' : 'error';
        const summary = movementsStore.success ? 'Éxito' : 'Error';
        showToast(severity, summary, movementsStore.message);
        movementsStore.clearMessage();
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
const loadMovements = async () => {
    try {
        hasError.value = false;
        errorMessage.value = '';
        await movementsStore.fetchMovements();

        // Debug: Log para verificar los datos y filtros
        console.log('Movements loaded:', movementsStore.movementsList.length);
        console.log('Sample movement:', movementsStore.movementsList[0]);
        console.log('Filtered movements:', movementsStore.filteredMovements.length);
        console.log('Total entries:', movementsStore.totalEntries);
        console.log('Total exits:', movementsStore.totalExits);
        console.log('Current filters in store:', {
            type: movementsStore.filters.type,
            warehouse: movementsStore.filters.warehouse,
            dateFrom: movementsStore.filters.dateFrom,
            dateTo: movementsStore.filters.dateTo
        });
    } catch (error) {
        console.error('Error loading movements:', error);
        hasError.value = true;
        errorMessage.value = 'Error al cargar los movimientos de stock';
        showToast('error', 'Error', errorMessage.value);
    }
};

const handleRefresh = async () => {
    try {
        await loadMovements();
        if (movementsStore.success) {
            showToast('success', 'Éxito', 'Movimientos actualizados correctamente');
        }
    } catch (error) {
        console.error('Error refreshing movements:', error);
        showToast('error', 'Error', 'Error al actualizar los movimientos');
    }
};

const viewMovementDetails = (movement) => {
    selectedMovementForDetails.value = movement;
    showDetailsModal.value = true;
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
    movementsStore.clearFilters();

    console.log('Filters cleared, dates reset to default range:', {
        from: formatDateForAPI(newDefaultDates.from),
        to: formatDateForAPI(newDefaultDates.to)
    });
};
</script>

<style scoped>
/* Contenedor principal de la página de movimientos */
.stock-movements-page {
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
    .stock-movements-page {
        @apply space-y-4 p-2;
    }
}
</style>
