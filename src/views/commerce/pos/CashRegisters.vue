<script setup>
import { ref, onMounted, computed } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useCashRegistersStore } from '@/stores/cashRegistersStore';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog.vue';

const toast = useToast();
const cashRegistersStore = useCashRegistersStore();

// Reactive State
const showFormDialog = ref(false);
const showDeleteDialog = ref(false);
const isCreating = ref(true);
const selectedRegister = ref(null);

const form = ref({
    name: '',
    code: '',
    location: '',
    max_cash_amount: null,
    max_discrepancy: null,
    allow_concurrent_sessions: false,
    is_active: true
});

// Load list
onMounted(async () => {
    await cashRegistersStore.fetchCashRegisters();
});

const registers = computed(() => cashRegistersStore.cashRegistersList);
const isLoading = computed(() => cashRegistersStore.isLoadingCashRegisters);

// helpers
const resetForm = () => {
    form.value = {
        name: '',
        code: '',
        location: '',
        max_cash_amount: null,
        max_discrepancy: null,
        allow_concurrent_sessions: false,
        is_active: true
    };
};

const openCreateDialog = () => {
    isCreating.value = true;
    resetForm();
    showFormDialog.value = true;
};

const openEditDialog = (reg) => {
    isCreating.value = false;
    selectedRegister.value = reg;
    form.value = {
        name: reg.name,
        code: reg.code,
        location: reg.location,
        max_cash_amount: reg.max_cash_amount ? parseFloat(reg.max_cash_amount) : null,
        max_discrepancy: reg.max_discrepancy ? parseFloat(reg.max_discrepancy) : null,
        allow_concurrent_sessions: reg.allow_concurrent_sessions,
        is_active: reg.is_active
    };
    showFormDialog.value = true;
};

const openDelete = (reg) => {
    selectedRegister.value = reg;
    showDeleteDialog.value = true;
};

const handleSubmit = async () => {
    try {
        if (isCreating.value) {
            await cashRegistersStore.createCashRegister(form.value);
        } else if (selectedRegister.value) {
            await cashRegistersStore.updateCashRegister(form.value, selectedRegister.value.id);
        }
        if (cashRegistersStore.success) {
            toast.add({
                severity: 'success',
                summary: 'Éxito',
                detail: cashRegistersStore.message || 'Guardado correctamente',
                life: 3000
            });
            showFormDialog.value = false;
            await cashRegistersStore.fetchCashRegisters();
        } else {
            showErrors();
        }
    } catch (e) {
        showErrors();
    }
};

const handleDelete = async () => {
    try {
        await cashRegistersStore.removeCashRegister(selectedRegister.value.id);
        if (cashRegistersStore.success) {
            toast.add({
                severity: 'success',
                summary: 'Eliminado',
                detail: cashRegistersStore.message || 'Caja eliminada',
                life: 3000
            });
        } else {
            showErrors();
        }
    } catch (e) {
        showErrors();
    } finally {
        showDeleteDialog.value = false;
    }
};

const showErrors = () => {
    if (cashRegistersStore.validationErrors.length) {
        cashRegistersStore.validationErrors.forEach((err) => toast.add({ severity: 'error', summary: 'Validación', detail: err, life: 4000 }));
    } else {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: cashRegistersStore.message || 'Ocurrió un error',
            life: 4000
        });
    }
};
</script>

<template>
    <Toast />
    <div class="grid">
        <div class="col-12">
            <Card class="shadow-lg border-0">
                <template #header>
                    <div class="bg-gradient-to-r from-amber-600 to-yellow-500 text-white p-6 rounded-t-lg">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-3">
                                <i class="pi pi-desktop text-2xl"></i>
                                <div>
                                    <h1 class="text-2xl font-bold">Cajas Registradoras</h1>
                                    <p class="text-amber-100">Administración de puntos de cobro</p>
                                </div>
                            </div>
                            <Button label="Nueva Caja" icon="pi pi-plus" severity="contrast" size="large" @click="openCreateDialog" />
                        </div>
                    </div>
                </template>

                <template #content>
                    <div v-if="isLoading" class="flex justify-center py-8"><ProgressSpinner /></div>

                    <div v-else-if="!registers.length" class="text-center py-12">
                        <p class="text-gray-600 mb-4">No hay cajas registradoras registradas.</p>
                        <Button label="Crear Caja" icon="pi pi-plus" severity="success" @click="openCreateDialog" />
                    </div>

                    <DataTable v-else :value="registers" :paginator="true" :rows="15" stripedRows responsiveLayout="scroll" class="shadow-sm">
                        <Column field="name" header="Nombre" sortable />
                        <Column field="code" header="Código" sortable />
                        <Column field="location" header="Ubicación" sortable />
                        <Column field="is_active" header="Estado" sortable>
                            <template #body="{ data }">
                                <Tag :value="data.is_active ? 'Activa' : 'Inactiva'" :severity="data.is_active ? 'success' : 'danger'" />
                            </template>
                        </Column>
                        <Column header="Acciones">
                            <template #body="{ data }">
                                <div class="flex space-x-2">
                                    <Button icon="pi pi-pencil" size="small" severity="info" outlined rounded @click="openEditDialog(data)" />
                                    <Button icon="pi pi-trash" size="small" severity="danger" outlined rounded @click="openDelete(data)" />
                                </div>
                            </template>
                        </Column>
                    </DataTable>
                </template>
            </Card>
        </div>
    </div>

    <!-- Form Dialog -->
    <Dialog
        v-model:visible="showFormDialog"
        :header="isCreating ? 'Nueva Caja Registradora' : 'Editar Caja Registradora'"
        :modal="true"
        :style="{ width: '600px' }"
        :pt="{ header: 'bg-gradient-to-r from-amber-600 to-yellow-500 text-white', content: 'p-6' }"
    >
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-bold text-gray-700 mb-2">Nombre *</label>
                <InputText v-model="form.name" class="w-full" />
            </div>
            <div>
                <label class="block text-sm font-bold text-gray-700 mb-2">Código *</label>
                <InputText v-model="form.code" class="w-full uppercase" />
                <small class="text-gray-500">Solo letras mayúsculas, números y guiones bajos</small>
            </div>
            <div>
                <label class="block text-sm font-bold text-gray-700 mb-2">Ubicación</label>
                <InputText v-model="form.location" class="w-full" />
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2">Máx. Efectivo</label>
                    <InputNumber v-model="form.max_cash_amount" :min="0" mode="decimal" :minFractionDigits="2" :maxFractionDigits="2" class="w-full" />
                </div>
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2">Máx. Diferencia %</label>
                    <InputNumber v-model="form.max_discrepancy" :min="0" mode="decimal" :minFractionDigits="2" :maxFractionDigits="2" class="w-full" />
                </div>
            </div>
            <div class="flex items-center space-x-3">
                <Checkbox v-model="form.allow_concurrent_sessions" binary />
                <label>Permitir sesiones concurrentes</label>
            </div>
            <div class="flex items-center space-x-3">
                <Checkbox v-model="form.is_active" binary />
                <label>Caja activa</label>
            </div>
        </div>
        <template #footer>
            <div class="flex justify-end space-x-3">
                <Button label="Cancelar" icon="pi pi-times" severity="secondary" outlined @click="showFormDialog = false" />
                <Button :label="isCreating ? 'Crear' : 'Actualizar'" icon="pi pi-check" severity="success" @click="handleSubmit" :loading="isLoading" />
            </div>
        </template>
    </Dialog>

    <!-- Delete Dialog -->
    <DeleteConfirmationDialog v-model:visible="showDeleteDialog" :item-name="selectedRegister?.name" item-type="caja registradora" @confirm="handleDelete" :loading="isLoading" />
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
</style>
