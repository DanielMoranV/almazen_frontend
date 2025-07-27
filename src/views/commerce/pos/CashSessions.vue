<script setup>
import SessionReportPrint from '@/components/SessionReportPrint.vue';
import { useAuthStore } from '@/stores/authStore';
import { useCashRegistersStore } from '@/stores/cashRegistersStore';
import { useCashSessionsStore } from '@/stores/cashSessionsStore';
import { storeToRefs } from 'pinia';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';

const toast = useToast();
const authStore = useAuthStore();
const cashSessionsStore = useCashSessionsStore();
const cashRegistersStore = useCashRegistersStore();

// Reactive data from stores
const { sessionHistory, currentSession, hasActiveSession, isLoadingHistory } = storeToRefs(cashSessionsStore);
const { availableForNewSession, cashRegistersList } = storeToRefs(cashRegistersStore);

// Config de empresa
const requiresCashSession = computed(() => authStore.getCompanyConfig?.requires_cash_session ?? true);

const loading = ref(false);
const displayNewSessionDialog = ref(false);
const displayCloseSessionDialog = ref(false);
const displayReportDialog = ref(false);
const selectedSession = ref(null);
const sessionReport = ref(null);

// Form data
const sessionForm = ref({
    cash_register_id: null,
    opening_amount: 100,
    notes: ''
});

const closeForm = ref({
    actual_amount: 0,
    notes: ''
});

// Computed properties
const sessions = computed(() => sessionHistory.value);
const currentSessionInfo = computed(() => cashSessionsStore.currentSessionInfo);

onMounted(async () => {
    await loadInitialData();
});

const loadInitialData = async () => {
    loading.value = true;
    try {
        await Promise.all([cashSessionsStore.fetchSessionHistory(), cashSessionsStore.getCurrentSession(), cashRegistersStore.fetchCashRegisters()]);
        // Advertir si no hay sesión activa
        if (requiresCashSession.value && !hasActiveSession.value) {
            toast.add({
                severity: 'warn',
                summary: 'Sin Sesión Activa',
                detail: 'No tiene una sesión de caja activa. Abra una para comenzar a operar.',
                life: 4000
            });
        }
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error de carga',
            detail: 'Error al cargar datos iniciales',
            life: 4000
        });
    } finally {
        loading.value = false;
    }
};

const openNewSessionDialog = () => {
    if (hasActiveSession.value) {
        toast.add({
            severity: 'warn',
            summary: 'Sesión Activa',
            detail: 'Ya tiene una sesión de caja activa. Debe cerrarla antes de abrir una nueva.',
            life: 4000
        });
        return;
    }

    // Reset form
    sessionForm.value = {
        cash_register_id: null,
        opening_amount: 100,
        notes: ''
    };
    // Pre-seleccionar caja si solo existe una disponible
    if (cashRegistersList.value.length === 1) {
        sessionForm.value.cash_register_id = cashRegistersList.value[0].id;
    }

    if (availableForNewSession.length === 0) {
        toast.add({
            severity: 'warn',
            summary: 'Sin cajas disponibles',
            detail: 'No existen cajas registradoras listas para abrir sesión',
            life: 4000
        });
        return;
    }
    displayNewSessionDialog.value = true;
};

const createNewSession = async () => {
    // Parsear numéricos
    sessionForm.value.opening_amount = parseFloat(sessionForm.value.opening_amount || 0);
    const validation = cashSessionsStore.validateOpenSession(sessionForm.value);
    if (!validation.valid) {
        toast.add({
            severity: 'error',
            summary: 'Error de Validación',
            detail: validation.message,
            life: 4000
        });
        return;
    }

    loading.value = true;

    try {
        await cashSessionsStore.openSession(sessionForm.value);

        if (cashSessionsStore.success) {
            displayNewSessionDialog.value = false;
            await loadInitialData(); // Refresh data

            toast.add({
                severity: 'success',
                summary: 'Sesión Abierta',
                detail: 'Sesión de caja abierta correctamente',
                life: 3000
            });
        } else {
            handleStoreErrors();
        }
    } catch (error) {
        handleStoreErrors();
    } finally {
        loading.value = false;
    }
};

const openCloseSessionDialog = () => {
    if (!currentSessionInfo.value) {
        toast.add({
            severity: 'warn',
            summary: 'Sin Sesión',
            detail: 'No tiene una sesión activa para cerrar',
            life: 3000
        });
        return;
    }

    // Pre-fill with expected amount
    closeForm.value = {
        actual_amount: currentSessionInfo.value?.expected_amount ?? currentSessionInfo.value?.expectedAmount,
        notes: ''
    };

    displayCloseSessionDialog.value = true;
};

const closeCurrentSession = async () => {
    if (!currentSession.value) return;

    // Parsear numéricos
    closeForm.value.actual_amount = parseFloat(closeForm.value.actual_amount || 0);
    const validation = cashSessionsStore.validateCloseSession(closeForm.value);
    if (!validation.valid) {
        toast.add({
            severity: 'error',
            summary: 'Error de Validación',
            detail: validation.message,
            life: 4000
        });
        return;
    }

    loading.value = true;

    try {
        await cashSessionsStore.closeSession(currentSession.value.id, closeForm.value);

        if (cashSessionsStore.success) {
            displayCloseSessionDialog.value = false;
            await loadInitialData(); // Refresh data

            toast.add({
                severity: 'success',
                summary: 'Sesión Cerrada',
                detail: 'Sesión de caja cerrada correctamente',
                life: 3000
            });
        } else {
            handleStoreErrors();
        }
    } catch (error) {
        handleStoreErrors();
    } finally {
        loading.value = false;
    }
};

const showSessionReport = async (session) => {
    loading.value = true;

    try {
        const result = await cashSessionsStore.getSessionReport(session.id);
        console.log('showSessionReport result:', result);
        if (result.success) {
            sessionReport.value = cashSessionsStore.sessionReport;
            displayReportDialog.value = true;
        } else {
            handleStoreErrors();
        }
    } catch (error) {
        handleStoreErrors();
    } finally {
        loading.value = false;
    }
};

// Utility functions
const handleStoreErrors = () => {
    const store = cashSessionsStore;
    if (store.validationErrors.length > 0) {
        store.validationErrors.forEach((error) => {
            toast.add({
                severity: 'error',
                summary: 'Error de Validación',
                detail: error,
                life: 4000
            });
        });
    } else {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: store.message || 'Ocurrió un error inesperado',
            life: 4000
        });
    }
};

// const getSessionStatusClass = (status) => {
//     return {
//         'bg-green-100 text-green-700': status === 'OPEN',
//         'bg-blue-100 text-blue-700': status === 'CLOSED',
//         'bg-yellow-100 text-yellow-700': status === 'SUSPENDED'
//     };
// };

const getSessionStatusLabel = (status) => {
    const labels = {
        OPEN: 'Activa',
        CLOSED: 'Cerrada',
        SUSPENDED: 'Suspendida'
    };
    return labels[status] || status;
};

const formatCurrency = (value) => {
    return value
        ? new Intl.NumberFormat('es-PE', {
              style: 'currency',
              currency: 'PEN'
          }).format(value)
        : '-';
};

const formatDateTime = (dateTime) => {
    return dateTime ? new Date(dateTime).toLocaleString('es-PE') : '-';
};

// const calculateDifference = (expected, actual) => {
//     if (!expected || !actual) return 0;
//     return parseFloat(actual) - parseFloat(expected);
// };

const getDifferenceClass = (difference) => {
    if (difference === 0) return 'text-green-600 dark:text-green-400';
    return difference > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400';
};

// Imprimir reporte
const printRef = ref(null);

const printReport = () => {
    if (!printRef.value) return;
    const html = printRef.value.$el.innerHTML || printRef.value.$el.outerHTML;
    const win = window.open('', '', 'width=900,height=650');
    win.document.write(`<!doctype html><html><head><title>Reporte de Sesión</title>` + `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css"></head><body class='p-6'>` + html + `</body></html>`);
    win.document.close();
    win.focus();
    win.print();
    win.close();
};
</script>

<template>
    <Toast />

    <Card class="shadow-lg border-0 dark:bg-gray-800 dark:border-gray-700">
        <template #header>
            <div class="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-t-lg">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <div>
                            <h1 class="text-2xl font-bold text-white">Sesiones de Caja</h1>
                            <p class="text-green-100">Control de turnos y movimientos de efectivo</p>
                        </div>
                    </div>
                    <div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                        <Button v-if="hasActiveSession" @click="openCloseSessionDialog" label="Cerrar Sesión" icon="pi pi-sign-out" severity="contrast" size="large" />
                        <Button @click="openNewSessionDialog" label="Nueva Sesión" icon="pi pi-plus" :disabled="availableForNewSession.length === 0" severity="contrast" size="large" />
                    </div>
                </div>
            </div>
        </template>

        <template #content>
            <!-- Current Session Info -->
            <div v-if="currentSessionInfo" class="mb-6">
                <Panel header="Sesión Actual" class="shadow-sm dark:bg-gray-700">
                    <template #icons>
                        <i class="pi pi-circle-fill text-green-500"></i>
                    </template>

                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div class="bg-blue-50 dark:bg-blue-900/50 p-4 rounded-lg border dark:border-blue-800">
                            <div class="flex items-center space-x-3">
                                <i class="pi pi-user text-blue-600 text-xl"></i>
                                <div>
                                    <div class="text-sm text-blue-600 dark:text-blue-400 font-medium">Cajero</div>
                                    <div class="font-bold text-gray-800 dark:text-gray-200">
                                        {{ currentSessionInfo.cashier }}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="bg-green-50 dark:bg-green-900/50 p-4 rounded-lg border dark:border-green-800">
                            <div class="flex items-center space-x-3">
                                <i class="pi pi-wallet text-green-600 text-xl"></i>
                                <div>
                                    <div class="text-sm text-green-600 dark:text-green-400 font-medium">Monto Inicial</div>
                                    <div class="font-bold text-gray-800 dark:text-gray-200">
                                        {{ formatCurrency(currentSessionInfo.openingAmount) }}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="bg-purple-50 dark:bg-purple-900/50 p-4 rounded-lg border dark:border-purple-800">
                            <div class="flex items-center space-x-3">
                                <i class="pi pi-shopping-cart text-purple-600 text-xl"></i>
                                <div>
                                    <div class="text-sm text-purple-600 dark:text-purple-400 font-medium">Ventas</div>
                                    <div class="font-bold text-gray-800 dark:text-gray-200">{{ currentSessionInfo.salesCount }} ({{ formatCurrency(currentSessionInfo.totalSales) }})</div>
                                </div>
                            </div>
                        </div>

                        <div class="bg-orange-50 dark:bg-orange-900/50 p-4 rounded-lg border dark:border-orange-800">
                            <div class="flex items-center space-x-3">
                                <i class="pi pi-calculator text-orange-600 text-xl"></i>
                                <div>
                                    <div class="text-sm text-orange-600 dark:text-orange-400 font-medium">Esperado</div>
                                    <div class="font-bold text-gray-800 dark:text-gray-200">
                                        {{ formatCurrency(currentSessionInfo.expected_amount ?? currentSessionInfo.expectedAmount) }}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Panel>
            </div>

            <!-- Session History -->
            <div v-if="isLoadingHistory" class="flex justify-center py-8">
                <ProgressSpinner />
            </div>

            <div v-else-if="sessions.length === 0" class="text-center py-12">
                <div class="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                    <i class="pi pi-clock text-4xl text-gray-400 dark:text-gray-500"></i>
                </div>
                <h3 class="text-xl font-bold text-gray-600 dark:text-gray-300 mb-2">No hay sesiones registradas</h3>
                <p class="text-gray-500 dark:text-gray-400 mb-4">Abra la primera sesión de caja para comenzar</p>
                <Button @click="openNewSessionDialog" label="Abrir Primera Sesión" icon="pi pi-plus" severity="success" />
            </div>

            <DataTable v-else :value="sessions" :paginator="true" :rows="15" :loading="isLoadingHistory" stripedRows responsiveLayout="scroll" class="shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <Column field="id" header="ID" sortable>
                    <template #body="{ data }">
                        <span class="font-mono text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded dark:text-gray-200">#{{ data.id }}</span>
                    </template>
                </Column>

                <Column field="user" header="Cajero" sortable>
                    <template #body="{ data }">
                        <div class="flex items-center space-x-2">
                            <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                                <i class="pi pi-user text-blue-600 dark:text-blue-400 text-sm"></i>
                            </div>
                            <span class="font-medium dark:text-gray-200">{{ data.user?.name || 'Usuario' }}</span>
                        </div>
                    </template>
                </Column>

                <Column field="cash_register" header="Caja" sortable>
                    <template #body="{ data }">
                        <div class="flex items-center space-x-2">
                            <i class="pi pi-desktop text-gray-600 dark:text-gray-400"></i>
                            <span class="dark:text-gray-200">{{ data.cash_register?.name || 'N/A' }}</span>
                        </div>
                    </template>
                </Column>

                <Column field="opened_at" header="Apertura" sortable>
                    <template #body="{ data }">
                        <span class="dark:text-gray-200">{{ formatDateTime(data.opened_at) }}</span>
                    </template>
                </Column>

                <Column field="closed_at" header="Cierre" sortable>
                    <template #body="{ data }">
                        <span class="dark:text-gray-200">{{ formatDateTime(data.closed_at) }}</span>
                    </template>
                </Column>

                <Column field="opening_amount" header="Monto Inicial" sortable>
                    <template #body="{ data }">
                        <span class="font-mono dark:text-gray-200">{{ formatCurrency(data.opening_amount) }}</span>
                    </template>
                </Column>

                <Column field="actual_amount" header="Monto Final" sortable>
                    <template #body="{ data }">
                        <span class="font-mono dark:text-gray-200">{{ formatCurrency(data.actual_amount) }}</span>
                    </template>
                </Column>

                <Column field="difference_amount" header="Diferencia" sortable>
                    <template #body="{ data }">
                        <span v-if="data.difference_amount !== null" class="font-mono font-bold" :class="getDifferenceClass(parseFloat(data.difference_amount))">
                            {{ formatCurrency(data.difference_amount) }}
                        </span>
                        <span v-else class="text-gray-400 dark:text-gray-500">-</span>
                    </template>
                </Column>

                <Column field="status" header="Estado" sortable>
                    <template #body="{ data }">
                        <Tag :value="getSessionStatusLabel(data.status)" :severity="data.status === 'OPEN' ? 'success' : data.status === 'CLOSED' ? 'info' : 'warning'" />
                    </template>
                </Column>

                <Column header="Acciones">
                    <template #body="{ data }">
                        <div class="flex space-x-2">
                            <Button v-if="data.status === 'CLOSED'" @click="showSessionReport(data)" icon="pi pi-chart-bar" size="small" severity="info" outlined rounded v-tooltip="'Ver Reporte'" />
                            <Button v-if="data.status === 'OPEN' && data.id === currentSession?.id" @click="openCloseSessionDialog" icon="pi pi-sign-out" size="small" severity="danger" outlined rounded v-tooltip="'Cerrar Sesión'" />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </template>
    </Card>

    <!-- New Session Dialog -->
    <Dialog
        v-model:visible="displayNewSessionDialog"
        header="Nueva Sesión de Caja"
        :modal="true"
        :style="{ width: '90vw', maxWidth: '500px' }"
        :pt="{
            header: 'bg-gradient-to-r from-green-600 to-emerald-600 text-white',
            content: 'p-6 bg-white dark:bg-gray-800'
        }"
    >
        <div class="space-y-6">
            <div>
                <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2"> Caja Registradora * </label>
                <Select
                    v-model="sessionForm.cash_register_id"
                    :options="availableForNewSession"
                    option-label="name"
                    option-value="id"
                    placeholder="Seleccionar caja registradora..."
                    class="w-full"
                    :pt="{
                        root: 'border-2 border-gray-200 hover:border-green-300 focus:border-green-500 rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200',
                        input: 'py-3 px-4 text-base'
                    }"
                />
            </div>

            <div>
                <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2"> Monto Inicial * </label>
                <div class="p-inputgroup">
                    <span class="p-inputgroup-addon dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600">S/</span>
                    <InputNumber v-model="sessionForm.opening_amount" :min="0" mode="decimal" :minFractionDigits="2" :maxFractionDigits="2" class="flex-1 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600" />
                </div>
            </div>

            <div>
                <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2"> Notas (Opcional) </label>
                <Textarea
                    v-model="sessionForm.notes"
                    rows="3"
                    placeholder="Observaciones del turno..."
                    class="w-full"
                    :pt="{
                        root: 'border-2 border-gray-200 hover:border-green-300 focus:border-green-500 rounded-xl dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600'
                    }"
                />
            </div>
        </div>

        <template #footer>
            <div class="flex justify-end space-x-3">
                <Button @click="displayNewSessionDialog = false" label="Cancelar" icon="pi pi-times" severity="secondary" outlined />
                <Button @click="createNewSession" label="Abrir Sesión" icon="pi pi-check" severity="success" :loading="loading" />
            </div>
        </template>
    </Dialog>

    <!-- Close Session Dialog -->
    <Dialog
        v-model:visible="displayCloseSessionDialog"
        header="Cerrar Sesión de Caja"
        :modal="true"
        :style="{ width: '90vw', maxWidth: '600px' }"
        :pt="{
            header: 'bg-gradient-to-r from-red-600 to-pink-600 text-white',
            content: 'p-6 bg-white dark:bg-gray-800'
        }"
    >
        <div class="space-y-6" v-if="currentSessionInfo">
            <!-- Session Summary -->
            <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl border dark:border-gray-600">
                <h3 class="font-bold text-gray-800 dark:text-gray-200 mb-4">Resumen de la Sesión</h3>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">Cajero</div>
                        <div class="font-semibold dark:text-gray-200">{{ currentSessionInfo.cashier }}</div>
                    </div>
                    <div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">Caja</div>
                        <div class="font-semibold dark:text-gray-200">{{ currentSession?.cash_register?.name }}</div>
                    </div>
                    <div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">Monto Inicial</div>
                        <div class="font-semibold text-green-600 dark:text-green-400">
                            {{ formatCurrency(currentSessionInfo.openingAmount) }}
                        </div>
                    </div>
                    <div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">Ventas Realizadas</div>
                        <div class="font-semibold text-blue-600 dark:text-blue-400">
                            {{ currentSessionInfo.salesCount }}
                        </div>
                    </div>
                    <div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">Total en Ventas</div>
                        <div class="font-semibold text-purple-600 dark:text-purple-400">
                            {{ formatCurrency(currentSessionInfo.totalSales) }}
                        </div>
                    </div>
                    <div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">Monto Esperado</div>
                        <div class="font-semibold text-orange-600 dark:text-orange-400">
                            {{ formatCurrency(currentSessionInfo.expected_amount ?? currentSessionInfo.expectedAmount) }}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Close Form -->
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2"> Monto Real en Caja * </label>
                    <div class="p-inputgroup">
                        <span class="p-inputgroup-addon dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600">S/</span>
                        <InputNumber v-model="closeForm.actual_amount" :min="0" mode="decimal" :minFractionDigits="2" :maxFractionDigits="2" class="flex-1 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600" />
                    </div>
                    <small class="text-gray-500 dark:text-gray-400">Cuente el dinero físico en la caja registradora</small>
                </div>

                <!-- Difference Calculation -->
                <div
                    v-if="closeForm.actual_amount"
                    class="p-4 rounded-lg border-2"
                    :class="
                        cashSessionsStore.calculateDifference(closeForm.actual_amount) === 0 ? 'bg-green-50 border-green-200 dark:bg-green-900/50 dark:border-green-800' : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/50 dark:border-yellow-800'
                    "
                >
                    <div class="flex justify-between items-center">
                        <span class="font-medium dark:text-gray-200">Diferencia:</span>
                        <span class="font-bold text-lg" :class="getDifferenceClass(cashSessionsStore.calculateDifference(closeForm.actual_amount))">
                            {{ formatCurrency(cashSessionsStore.calculateDifference(closeForm.actual_amount)) }}
                        </span>
                    </div>
                    <div v-if="cashSessionsStore.hasSignificantDiscrepancy(closeForm.actual_amount)" class="text-sm text-yellow-700 dark:text-yellow-400 mt-2">
                        <i class="pi pi-exclamation-triangle mr-1"></i>
                        Diferencia significativa detectada
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2"> Notas de Cierre </label>
                    <Textarea v-model="closeForm.notes" rows="3" placeholder="Observaciones, explicación de diferencias..." class="w-full dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600" />
                </div>
            </div>
        </div>

        <template #footer>
            <div class="flex justify-end space-x-3">
                <Button @click="displayCloseSessionDialog = false" label="Cancelar" icon="pi pi-times" severity="secondary" outlined />
                <Button @click="closeCurrentSession" label="Cerrar Sesión" icon="pi pi-sign-out" severity="danger" :loading="loading" />
            </div>
        </template>
    </Dialog>

    <!-- Session Report Dialog -->
    <Dialog
        v-model:visible="displayReportDialog"
        header="Reporte de Sesión"
        :modal="true"
        :style="{ width: '90vw', maxWidth: '800px' }"
        :pt="{
            header: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white',
            content: 'p-6 bg-white dark:bg-gray-800'
        }"
    >
        <div v-if="sessionReport" class="space-y-6 printable">
            <!-- Session Header -->
            <div class="text-center pb-4 border-b dark:border-gray-700">
                <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-200">Reporte de Sesión #{{ sessionReport.session?.id }}</h2>
                <p class="text-gray-600 dark:text-gray-400">
                    {{ sessionReport.session?.user?.name }} -
                    {{ sessionReport.session?.cash_register?.name }}
                </p>
            </div>

            <!-- Summary Cards -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="bg-green-50 dark:bg-green-900/50 p-4 rounded-lg border dark:border-green-800">
                    <div class="text-center">
                        <div class="text-2xl font-bold text-green-600 dark:text-green-400">
                            {{ formatCurrency(sessionReport.movements_summary?.total_sales || 0) }}
                        </div>
                        <div class="text-sm text-green-700 dark:text-green-400">Total Ventas</div>
                    </div>
                </div>

                <div class="bg-blue-50 dark:bg-blue-900/50 p-4 rounded-lg border dark:border-blue-800">
                    <div class="text-center">
                        <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {{ sessionReport.movements_summary?.sales_count || 0 }}
                        </div>
                        <div class="text-sm text-blue-700 dark:text-blue-400">Transacciones</div>
                    </div>
                </div>

                <div class="bg-purple-50 dark:bg-purple-900/50 p-4 rounded-lg border dark:border-purple-800">
                    <div class="text-center">
                        <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">{{ Math.round((sessionReport.summary?.duration_minutes || 0) / 60) }}h</div>
                        <div class="text-sm text-purple-700 dark:text-purple-400">Duración</div>
                    </div>
                </div>
            </div>

            <!-- Sales Detail -->
            <div v-if="sessionReport.sales?.length" class="mt-6">
                <h3 class="font-bold text-gray-800 dark:text-gray-200 mb-3">Ventas Detalladas</h3>
                <div class="overflow-x-auto">
                    <table class="min-w-full text-sm">
                        <thead>
                            <tr class="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                <th class="px-2 py-1 text-left">#</th>
                                <th class="px-2 py-1 text-left">Comprobante</th>
                                <th class="px-2 py-1 text-right">Total</th>
                                <th class="px-2 py-1 text-left">Pagos</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="sale in sessionReport.sales" :key="sale.sale_id || sale.id" class="border-b dark:border-gray-700">
                                <td class="px-2 py-1 dark:text-gray-300">{{ sale.sale_id || sale.id }}</td>
                                <td class="px-2 py-1 dark:text-gray-300">
                                    {{ sale.document_number || sale.voucher_number || '-' }}
                                </td>
                                <td class="px-2 py-1 text-right dark:text-gray-300">
                                    {{ formatCurrency(sale.total_amount) }}
                                </td>
                                <td class="px-2 py-1 dark:text-gray-300">
                                    <span v-for="p in sale.payments" :key="p.payment_method_name" class="mr-2"> {{ p.payment_method_name }} ({{ formatCurrency(p.amount) }}) </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Payment Methods Breakdown -->
            <div v-if="sessionReport.payment_methods_breakdown?.length">
                <h3 class="font-bold text-gray-800 dark:text-gray-200 mb-3">Desglose por Método de Pago</h3>
                <div class="space-y-2">
                    <div v-for="method in sessionReport.payment_methods_breakdown" :key="method.method_id" class="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                            <span class="font-medium dark:text-gray-200">{{ method.method_name }}</span>
                            <span class="text-sm text-gray-500 dark:text-gray-400 ml-2">({{ method.transaction_count }} transacciones)</span>
                        </div>
                        <span class="font-bold text-green-600 dark:text-green-400">{{ formatCurrency(method.total_amount) }}</span>
                    </div>
                </div>
            </div>
        </div>

        <template #footer>
            <div class="flex justify-between w-full">
                <Button @click="printReport" label="Imprimir" icon="pi pi-print" severity="info" />
                <Button @click="displayReportDialog = false" label="Cerrar" icon="pi pi-times" severity="secondary" />
            </div>
        </template>
    </Dialog>

    <!-- Componente oculto para impresión -->
    <SessionReportPrint v-if="sessionReport" :report="sessionReport" ref="printRef" style="display: none" />
</template>

<style scoped>
.overflow-x-auto {
    overflow-x: auto;
}
@media print {
    body * {
        visibility: hidden;
    }
    .printable,
    .printable * {
        visibility: visible;
    }
    .p-dialog {
        position: static !important;
        width: 100% !important;
        overflow: visible !important;
    }
}
</style>
