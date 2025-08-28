<script setup>
import Card from 'primevue/card';
import ConfirmDialog from 'primevue/confirmdialog';
import Toast from 'primevue/toast';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';

import { useCreditsStore } from '@/stores/creditsStore';
import CreditDetailDialog from './componentsCredits/CreditDetailDialog.vue';
import CreditPaymentDialog from './componentsCredits/CreditPaymentDialog.vue';
import CreditsTable from './componentsCredits/CreditsTable.vue';
import CreditsToolbar from './componentsCredits/CreditsToolbar.vue';

const toast = useToast();
const confirm = useConfirm();

// Store
const creditsStore = useCreditsStore();

// Estado reactivo
const selectedCredits = ref(null);
const showPaymentDialog = ref(false);
const showDetailDialog = ref(false);

// Computadas del store
const credits = computed(() => creditsStore.creditsList || []);
const loading = computed(() => creditsStore.isLoadingCredits);
const selectedCredit = computed(() => creditsStore.selectedCredit);
const pagination = computed(() => ({
    page: creditsStore.currentPagination.page,
    size: creditsStore.currentPagination.size,
    total: creditsStore.creditsTotal
}));

// Métodos para cargar datos
const loadCredits = async () => {
    try {
        await creditsStore.fetchCredits();
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al cargar los créditos',
            life: 3000
        });
    }
};

// Handlers de eventos
const onFilterChange = (newFilters) => {
    creditsStore.updateFilters(newFilters);
    creditsStore.updatePagination({ page: 1 });
    loadCredits();
};

const onPageChange = (event) => {
    creditsStore.updatePagination({
        page: event.page + 1,
        size: event.rows
    });
    loadCredits();
};

const onRowSelect = (event) => {
    creditsStore.selectCredit(event.data);
    showDetailDialog.value = true;
};

const onPaymentRequest = (credit) => {
    creditsStore.selectCredit(credit);
    showPaymentDialog.value = true;
};

const onPaymentSuccess = () => {
    showPaymentDialog.value = false;
    loadCredits();
    toast.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Pago registrado correctamente',
        life: 3000
    });
};

// Estadísticas calculadas
const statistics = computed(() => {
    const totalCredits = credits.value.length;
    const totalAmount = credits.value.reduce((sum, credit) => sum + (credit.total_amount || 0), 0);
    const totalPaid = credits.value.reduce((sum, credit) => sum + (credit.paid_amount || 0), 0);
    const totalPending = credits.value.reduce((sum, credit) => sum + (credit.remaining_amount || 0), 0);
    const overdueCount = credits.value.filter((credit) => credit.is_overdue).length;

    return {
        totalCredits,
        totalAmount,
        totalPaid,
        totalPending,
        overdueCount
    };
});

onMounted(() => {
    loadCredits();
});
</script>

<template>
    <div class="credits-container">
        <!-- Header -->
        <div class="page-header">
            <div class="header-content">
                <h1 class="page-title">
                    <i class="pi pi-credit-card"></i>
                    Gestión de Créditos
                </h1>
                <p class="page-subtitle">Administra los créditos otorgados a tus clientes</p>
            </div>
        </div>

        <!-- Estadísticas rápidas -->
        <div class="statistics-grid">
            <Card class="stat-card stat-card-blue">
                <template #content>
                    <div class="stat-content">
                        <div class="stat-icon">
                            <i class="pi pi-list"></i>
                        </div>
                        <div class="stat-info">
                            <h3 class="stat-value">{{ statistics.totalCredits }}</h3>
                            <p class="stat-label">Total Créditos</p>
                        </div>
                    </div>
                </template>
            </Card>

            <Card class="stat-card stat-card-green">
                <template #content>
                    <div class="stat-content">
                        <div class="stat-icon">
                            <i class="pi pi-money-bill"></i>
                        </div>
                        <div class="stat-info">
                            <h3 class="stat-value">S/ {{ statistics.totalAmount.toFixed(2) }}</h3>
                            <p class="stat-label">Monto Total</p>
                        </div>
                    </div>
                </template>
            </Card>

            <Card class="stat-card stat-card-orange">
                <template #content>
                    <div class="stat-content">
                        <div class="stat-icon">
                            <i class="pi pi-clock"></i>
                        </div>
                        <div class="stat-info">
                            <h3 class="stat-value">S/ {{ statistics.totalPending.toFixed(2) }}</h3>
                            <p class="stat-label">Pendiente</p>
                        </div>
                    </div>
                </template>
            </Card>

            <Card class="stat-card stat-card-red">
                <template #content>
                    <div class="stat-content">
                        <div class="stat-icon">
                            <i class="pi pi-exclamation-triangle"></i>
                        </div>
                        <div class="stat-info">
                            <h3 class="stat-value">{{ statistics.overdueCount }}</h3>
                            <p class="stat-label">Vencidos</p>
                        </div>
                    </div>
                </template>
            </Card>
        </div>

        <!-- Contenido principal -->
        <Card class="main-card">
            <template #content>
                <!-- Toolbar con filtros -->
                <CreditsToolbar :filters="creditsStore.currentFilters" :loading="loading" @filter-change="onFilterChange" @refresh="loadCredits" />

                <!-- Tabla de créditos -->
                <CreditsTable
                    :credits="credits"
                    :loading="loading"
                    :pagination="pagination"
                    :selection="selectedCredits"
                    @update:selection="selectedCredits = $event"
                    @page-change="onPageChange"
                    @row-select="onRowSelect"
                    @payment-request="onPaymentRequest"
                />
            </template>
        </Card>

        <!-- Diálogos -->
        <CreditPaymentDialog v-model:visible="showPaymentDialog" :credit="selectedCredit" @success="onPaymentSuccess" />

        <CreditDetailDialog v-model:visible="showDetailDialog" :credit="selectedCredit" @payment-request="onPaymentRequest" />

        <Toast />
        <ConfirmDialog />
    </div>
</template>

<style scoped>
.credits-container {
    @apply min-h-screen bg-gray-50 dark:bg-gray-900 p-6;
}

.page-header {
    @apply mb-8;
}

.header-content {
    @apply bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700;
}

.page-title {
    @apply text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3 mb-2;
}

.page-title i {
    @apply text-purple-600 dark:text-purple-400;
}

.page-subtitle {
    @apply text-gray-600 dark:text-gray-300 text-lg;
}

.statistics-grid {
    @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8;
}

.stat-card {
    @apply transition-all duration-200 hover:shadow-lg;
}

.stat-card-blue {
    @apply bg-gradient-to-br from-blue-500 to-blue-600 text-white;
}

.stat-card-green {
    @apply bg-gradient-to-br from-green-500 to-green-600 text-white;
}

.stat-card-orange {
    @apply bg-gradient-to-br from-orange-500 to-orange-600 text-white;
}

.stat-card-red {
    @apply bg-gradient-to-br from-red-500 to-red-600 text-white;
}

.stat-content {
    @apply flex items-center gap-4 p-2;
}

.stat-icon {
    @apply text-3xl opacity-80;
}

.stat-info {
    @apply flex-1;
}

.stat-value {
    @apply text-2xl font-bold mb-1;
}

.stat-label {
    @apply text-sm opacity-90;
}

.main-card {
    @apply shadow-sm border border-gray-200 dark:border-gray-700;
}

:deep(.main-card .p-card-content) {
    @apply p-0;
}

:deep(.stat-card .p-card-content) {
    @apply p-4;
}
</style>
