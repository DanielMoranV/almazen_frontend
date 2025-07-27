<script setup>
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog.vue';
import { usePaymentMethodsStore } from '@/stores/paymentMethodsStore';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';

const toast = useToast();
const paymentMethodsStore = usePaymentMethodsStore();

// Estados locales
const selectedMethod = ref(null);
const showMethodDialog = ref(false);
const showDeleteDialog = ref(false);
const isCreating = ref(false);
const filters = ref({
    active_only: null,
    type: '',
    requires_cash_register: null
});

// Formulario
const methodForm = ref({
    name: '',
    code: '',
    type: 'CASH',
    requires_cash_register: true,
    requires_reference: false,
    max_amount: null,
    min_amount: null,
    is_active: true
});

// Estados computados del store
const methods = computed(() => paymentMethodsStore.paymentMethodsList);
const isLoading = computed(() => paymentMethodsStore.isLoadingPaymentMethods);
const hasMethods = computed(() => methods.value.length > 0);

// Opciones para formularios
const methodTypes = [
    { label: 'Efectivo', value: 'CASH' },
    { label: 'Tarjeta', value: 'CARD' },
    { label: 'Transferencia', value: 'TRANSFER' },
    { label: 'Crédito', value: 'CREDIT' }
];

const filterOptions = {
    activeOnly: [
        { label: 'Todos', value: null },
        { label: 'Solo Activos', value: true },
        { label: 'Solo Inactivos', value: false }
    ],
    types: [{ label: 'Todos los Tipos', value: '' }, ...methodTypes],
    cashRegister: [
        { label: 'Todos', value: null },
        { label: 'Requiere Caja', value: true },
        { label: 'No Requiere Caja', value: false }
    ]
};

// Inicialización
onMounted(async () => {
    await loadMethods();
});

// Gestión de carga
const loadMethods = async () => {
    await paymentMethodsStore.fetchPaymentMethods();
    if (paymentMethodsStore.success) {
        showSuccess('Métodos cargados', 'Lista actualizada correctamente');
    }
};

// Gestión de métodos de pago
const openCreateDialog = () => {
    selectedMethod.value = null;
    isCreating.value = true;
    resetForm();
    showMethodDialog.value = true;
};

const openEditDialog = (method) => {
    selectedMethod.value = { ...method };
    isCreating.value = false;
    fillForm(method);
    showMethodDialog.value = true;
};

const openDeleteDialog = (method) => {
    selectedMethod.value = method;
    showDeleteDialog.value = true;
};

const resetForm = () => {
    methodForm.value = {
        name: '',
        code: '',
        type: 'CASH',
        requires_cash_register: true,
        requires_reference: false,
        max_amount: null,
        min_amount: null,
        is_active: true
    };
};

const fillForm = (method) => {
    methodForm.value = {
        name: method.name,
        code: method.code,
        type: method.type,
        requires_cash_register: method.requires_cash_register,
        requires_reference: method.requires_reference,
        max_amount: method.max_amount ? parseFloat(method.max_amount) : null,
        min_amount: method.min_amount ? parseFloat(method.min_amount) : null,
        is_active: method.is_active
    };
};

const handleMethodSubmit = async () => {
    const payload = { ...methodForm.value };

    try {
        const action = isCreating.value ? paymentMethodsStore.createPaymentMethod : (data) => paymentMethodsStore.updatePaymentMethod(data, selectedMethod.value.id);

        await action(payload);

        if (paymentMethodsStore.success) {
            const message = isCreating.value ? 'Método de pago creado exitosamente' : 'Método de pago actualizado exitosamente';
            showSuccess(message, paymentMethodsStore.message);
            showMethodDialog.value = false;
            await loadMethods();
        } else {
            handleApiErrors();
        }
    } catch (error) {
        handleApiErrors();
    }
};

const handleMethodDelete = async () => {
    try {
        await paymentMethodsStore.removePaymentMethod(selectedMethod.value.id);

        if (paymentMethodsStore.success) {
            showSuccess('Método eliminado', paymentMethodsStore.message);
            showDeleteDialog.value = false;
            await loadMethods();
        } else {
            handleApiErrors();
            showDeleteDialog.value = false;
        }
    } catch (error) {
        handleApiErrors();
        showDeleteDialog.value = false;
    }
};

// Manejadores de filtros
const handleFilterUpdate = async () => {
    paymentMethodsStore.updateFilters(filters.value);
    await paymentMethodsStore.fetchPaymentMethods();
};

const clearFilters = async () => {
    filters.value = {
        active_only: null,
        type: '',
        requires_cash_register: null
    };
    paymentMethodsStore.clearFilters();
    await paymentMethodsStore.fetchPaymentMethods();
};

const handleRefresh = async () => {
    await paymentMethodsStore.fetchPaymentMethods();
    showSuccess('Datos actualizados', 'Lista de métodos de pago actualizada');
};

// Utilidades
const showSuccess = (summary, detail) => {
    toast.add({
        severity: 'success',
        summary,
        detail,
        life: 3000
    });
};

const showError = (summary, detail) => {
    toast.add({
        severity: 'error',
        summary,
        detail,
        life: 4000
    });
};

const handleApiErrors = () => {
    if (paymentMethodsStore.validationErrors.length > 0) {
        paymentMethodsStore.validationErrors.forEach((error) => {
            showError('Error de validación', error);
        });
    } else {
        showError('Error', paymentMethodsStore.message || 'Ocurrió un error inesperado');
    }
};

const getMethodTypeIcon = (type) => {
    const iconMap = {
        CASH: 'pi-money-bill',
        CARD: 'pi-credit-card',
        TRANSFER: 'pi-send',
        CREDIT: 'pi-clock'
    };
    return iconMap[type] || 'pi-circle';
};

const getMethodTypeColor = (type) => {
    const colorMap = {
        CASH: 'success',
        CARD: 'info',
        TRANSFER: 'warning',
        CREDIT: 'secondary'
    };
    return colorMap[type] || 'secondary';
};

const formatCurrency = (amount) => {
    return amount
        ? new Intl.NumberFormat('es-PE', {
              style: 'currency',
              currency: 'PEN'
          }).format(amount)
        : '-';
};

const generateCodeFromName = () => {
    if (methodForm.value.name) {
        methodForm.value.code = methodForm.value.name
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '');
    }
};
</script>

<template>
    <Toast />

    <div class="grid">
        <div class="col-12">
            <Card class="shadow-lg border-0">
                <template #header>
                    <div class="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-lg">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-3">
                                <i class="pi pi-credit-card text-2xl"></i>
                                <div>
                                    <h1 class="text-2xl font-bold">Métodos de Pago</h1>
                                    <p class="text-purple-100">Gestión de formas de cobro y pago</p>
                                </div>
                            </div>
                            <Button @click="openCreateDialog" label="Nuevo Método" icon="pi pi-plus" severity="contrast" size="large" />
                        </div>
                    </div>
                </template>

                <template #content>
                    <!-- Filtros -->
                    <Panel header="Filtros de Búsqueda" :collapsed="true" :toggleable="true" class="mb-6">
                        <template #icons>
                            <i class="pi pi-filter text-purple-600"></i>
                        </template>

                        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label class="block text-sm font-bold text-gray-700 mb-2">Estado</label>
                                <Select v-model="filters.active_only" :options="filterOptions.activeOnly" option-label="label" option-value="value" @change="handleFilterUpdate" class="w-full" />
                            </div>

                            <div>
                                <label class="block text-sm font-bold text-gray-700 mb-2">Tipo</label>
                                <Select v-model="filters.type" :options="filterOptions.types" option-label="label" option-value="value" @change="handleFilterUpdate" class="w-full" />
                            </div>

                            <div>
                                <label class="block text-sm font-bold text-gray-700 mb-2">Caja Registradora</label>
                                <Select v-model="filters.requires_cash_register" :options="filterOptions.cashRegister" option-label="label" option-value="value" @change="handleFilterUpdate" class="w-full" />
                            </div>

                            <div class="flex items-end space-x-2">
                                <Button @click="clearFilters" label="Limpiar" icon="pi pi-filter-slash" severity="secondary" outlined />
                                <Button @click="handleRefresh" label="Actualizar" icon="pi pi-refresh" severity="info" />
                            </div>
                        </div>
                    </Panel>

                    <!-- Tabla -->
                    <div v-if="isLoading" class="flex justify-center py-8">
                        <ProgressSpinner />
                    </div>

                    <div v-else-if="!hasMethods" class="text-center py-12">
                        <div class="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <i class="pi pi-credit-card text-4xl text-gray-400"></i>
                        </div>
                        <h3 class="text-xl font-bold text-gray-600 mb-2">No hay métodos de pago</h3>
                        <p class="text-gray-500 mb-4">Crea el primer método de pago para comenzar</p>
                        <Button @click="openCreateDialog" label="Crear Método de Pago" icon="pi pi-plus" severity="success" />
                    </div>

                    <DataTable v-else :value="methods" :paginator="true" :rows="15" :loading="isLoading" stripedRows responsiveLayout="scroll" class="shadow-sm">
                        <Column field="name" header="Método" sortable>
                            <template #body="{ data }">
                                <div class="flex items-center space-x-3">
                                    <div class="w-10 h-10 rounded-full flex items-center justify-center" :class="`bg-${getMethodTypeColor(data.type)}-100`">
                                        <i :class="[getMethodTypeIcon(data.type), `text-${getMethodTypeColor(data.type)}-600`]"></i>
                                    </div>
                                    <div>
                                        <div class="font-semibold">{{ data.name }}</div>
                                        <div class="text-sm text-gray-500">{{ data.code }}</div>
                                    </div>
                                </div>
                            </template>
                        </Column>

                        <Column field="type" header="Tipo" sortable>
                            <template #body="{ data }">
                                <Tag :value="data.type" :severity="getMethodTypeColor(data.type)" />
                            </template>
                        </Column>

                        <Column field="requires_cash_register" header="Requiere Caja" sortable>
                            <template #body="{ data }">
                                <Tag :value="data.requires_cash_register ? 'Sí' : 'No'" :severity="data.requires_cash_register ? 'warning' : 'secondary'" />
                            </template>
                        </Column>

                        <Column field="requires_reference" header="Requiere Ref." sortable>
                            <template #body="{ data }">
                                <Tag :value="data.requires_reference ? 'Sí' : 'No'" :severity="data.requires_reference ? 'info' : 'secondary'" />
                            </template>
                        </Column>

                        <Column field="min_amount" header="Monto Mín." sortable>
                            <template #body="{ data }">
                                {{ formatCurrency(data.min_amount) }}
                            </template>
                        </Column>

                        <Column field="max_amount" header="Monto Máx." sortable>
                            <template #body="{ data }">
                                {{ formatCurrency(data.max_amount) }}
                            </template>
                        </Column>

                        <Column field="is_active" header="Estado" sortable>
                            <template #body="{ data }">
                                <Tag :value="data.is_active ? 'Activo' : 'Inactivo'" :severity="data.is_active ? 'success' : 'danger'" />
                            </template>
                        </Column>

                        <Column header="Acciones">
                            <template #body="{ data }">
                                <div class="flex space-x-2">
                                    <Button @click="openEditDialog(data)" icon="pi pi-pencil" size="small" severity="info" outlined rounded v-tooltip="'Editar'" />
                                    <Button @click="openDeleteDialog(data)" icon="pi pi-trash" size="small" severity="danger" outlined rounded v-tooltip="'Eliminar'" />
                                </div>
                            </template>
                        </Column>
                    </DataTable>
                </template>
            </Card>
        </div>
    </div>

    <!-- Diálogo de Método de Pago -->
    <Dialog
        v-model:visible="showMethodDialog"
        :header="isCreating ? 'Nuevo Método de Pago' : 'Editar Método de Pago'"
        :modal="true"
        :style="{ width: '600px' }"
        :pt="{
            header: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white',
            content: 'p-6'
        }"
    >
        <div class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="col-span-2">
                    <label class="block text-sm font-bold text-gray-700 mb-2"> Nombre del Método * </label>
                    <InputText v-model="methodForm.name" @input="generateCodeFromName" placeholder="Ej: Efectivo, Visa, Yape" class="w-full" />
                </div>

                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2"> Código * </label>
                    <InputText v-model="methodForm.code" placeholder="Ej: CASH, VISA, YAPE" class="w-full" />
                    <small class="text-gray-500">Solo letras mayúsculas, números y guiones bajos</small>
                </div>

                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2"> Tipo * </label>
                    <Select v-model="methodForm.type" :options="methodTypes" option-label="label" option-value="value" class="w-full" />
                </div>

                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2"> Monto Mínimo </label>
                    <InputNumber v-model="methodForm.min_amount" :min="0" mode="decimal" :minFractionDigits="2" :maxFractionDigits="2" class="w-full" />
                </div>

                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2"> Monto Máximo </label>
                    <InputNumber v-model="methodForm.max_amount" :min="0" mode="decimal" :minFractionDigits="2" :maxFractionDigits="2" class="w-full" />
                </div>

                <div class="col-span-2">
                    <div class="space-y-3">
                        <div class="flex items-center">
                            <Checkbox v-model="methodForm.requires_cash_register" binary />
                            <label class="ml-3 text-sm font-medium text-gray-700"> Requiere caja registradora activa </label>
                        </div>

                        <div class="flex items-center">
                            <Checkbox v-model="methodForm.requires_reference" binary />
                            <label class="ml-3 text-sm font-medium text-gray-700"> Requiere número de referencia </label>
                        </div>

                        <div class="flex items-center">
                            <Checkbox v-model="methodForm.is_active" binary />
                            <label class="ml-3 text-sm font-medium text-gray-700"> Método activo </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <template #footer>
            <div class="flex justify-end space-x-3">
                <Button @click="showMethodDialog = false" label="Cancelar" icon="pi pi-times" severity="secondary" outlined />
                <Button @click="handleMethodSubmit" :label="isCreating ? 'Crear' : 'Actualizar'" icon="pi pi-check" severity="success" :loading="isLoading" />
            </div>
        </template>
    </Dialog>

    <!-- Diálogo de Confirmación de Eliminación -->
    <DeleteConfirmationDialog v-model:visible="showDeleteDialog" :item-name="selectedMethod?.name" item-type="método de pago" @confirm="handleMethodDelete" :loading="isLoading" />
</template>

<style scoped>
.grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
}

.col-12 {
    grid-column: span 12;
}

.col-span-2 {
    grid-column: span 2;
}

@media (min-width: 768px) {
    .grid-cols-1 {
        grid-template-columns: repeat(1, minmax(0, 1fr));
    }

    .grid-cols-4 {
        grid-template-columns: repeat(4, minmax(0, 1fr));
    }

    .grid-cols-2 {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}
</style>
