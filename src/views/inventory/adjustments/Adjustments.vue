<script setup>
import { ref, computed, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useRouter } from 'vue-router';

const toast = useToast();
const router = useRouter();
const loading = ref(false);
const adjustments = ref([]);
const searchQuery = ref('');
const typeFilter = ref(null);
const dateRange = ref([null, null]);
const displayAdjustmentDialog = ref(false);

// Opciones de tipo para filtrar
const typeOptions = [
    { label: 'Todos', value: null },
    { label: 'Incremento', value: 'increase' },
    { label: 'Decremento', value: 'decrease' },
    { label: 'Inventario Inicial', value: 'initial' },
    { label: 'Corrección', value: 'correction' }
];

// Opciones de almacenes
const warehouseOptions = [
    { label: 'Almacén Principal', value: 1 },
    { label: 'Almacén Secundario', value: 2 },
    { label: 'Tienda', value: 3 }
];

// Formulario para nuevo ajuste
const adjustmentForm = ref({
    warehouse: null,
    type: 'correction',
    date: new Date().toISOString().slice(0, 10),
    reason: '',
    notes: ''
});

// Datos de ejemplo para los ajustes
const mockAdjustments = [
    {
        id: 'ADJ-001',
        warehouse: 'Almacén Principal',
        date: '2025-06-01',
        type: 'increase',
        reason: 'Productos no registrados',
        items: 3,
        totalQuantity: 15,
        createdBy: 'Juan Pérez'
    },
    {
        id: 'ADJ-002',
        warehouse: 'Tienda',
        date: '2025-05-28',
        type: 'decrease',
        reason: 'Productos dañados',
        items: 2,
        totalQuantity: 8,
        createdBy: 'María González'
    },
    {
        id: 'ADJ-003',
        warehouse: 'Almacén Secundario',
        date: '2025-06-02',
        type: 'initial',
        reason: 'Inventario inicial',
        items: 10,
        totalQuantity: 50,
        createdBy: 'Carlos Rodríguez'
    },
    {
        id: 'ADJ-004',
        warehouse: 'Almacén Principal',
        date: '2025-05-25',
        type: 'correction',
        reason: 'Error de conteo',
        items: 5,
        totalQuantity: 20,
        createdBy: 'Ana Martínez'
    },
    {
        id: 'ADJ-005',
        warehouse: 'Tienda',
        date: '2025-06-02',
        type: 'decrease',
        reason: 'Productos vencidos',
        items: 4,
        totalQuantity: 12,
        createdBy: 'Juan Pérez'
    }
];

onMounted(() => {
    loadAdjustments();
});

const loadAdjustments = () => {
    loading.value = true;
    // Simulación de carga de datos
    setTimeout(() => {
        adjustments.value = mockAdjustments;
        loading.value = false;
    }, 500);
};

const openNewAdjustmentDialog = () => {
    adjustmentForm.value = {
        warehouse: null,
        type: 'correction',
        date: new Date().toISOString().slice(0, 10),
        reason: '',
        notes: ''
    };
    displayAdjustmentDialog.value = true;
};

const createAdjustment = () => {
    if (!adjustmentForm.value.warehouse || !adjustmentForm.value.reason) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Debe seleccionar almacén y especificar motivo',
            life: 3000
        });
        return;
    }

    // Por ahora mostrar toast, luego se implementará la ruta
    toast.add({
        severity: 'info',
        summary: 'Funcionalidad en Desarrollo',
        detail: 'La creación de ajustes estará disponible pronto',
        life: 3000
    });

    displayAdjustmentDialog.value = false;
};

const viewAdjustmentDetails = (adjustment) => {
    // Por ahora mostrar toast, luego se implementará la ruta
    toast.add({
        severity: 'info',
        summary: 'Funcionalidad en Desarrollo',
        detail: `Detalles de ajuste ${adjustment.id} estarán disponibles pronto`,
        life: 3000
    });
};

const filteredAdjustments = computed(() => {
    let result = adjustments.value;

    // Filtrar por búsqueda
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        result = result.filter(
            (adjustment) => adjustment.id.toLowerCase().includes(query) || adjustment.warehouse.toLowerCase().includes(query) || adjustment.reason.toLowerCase().includes(query) || adjustment.createdBy.toLowerCase().includes(query)
        );
    }

    // Filtrar por tipo
    if (typeFilter.value) {
        result = result.filter((adjustment) => adjustment.type === typeFilter.value);
    }

    // Filtrar por rango de fechas
    if (dateRange.value[0] && dateRange.value[1]) {
        const startDate = new Date(dateRange.value[0]);
        const endDate = new Date(dateRange.value[1]);

        result = result.filter((adjustment) => {
            const adjustmentDate = new Date(adjustment.date);
            return adjustmentDate >= startDate && adjustmentDate <= endDate;
        });
    }

    return result;
});

const getTypeClass = (type) => {
    switch (type) {
        case 'increase':
            return 'bg-green-100 text-green-700';
        case 'decrease':
            return 'bg-red-100 text-red-700';
        case 'initial':
            return 'bg-blue-100 text-blue-700';
        case 'correction':
            return 'bg-yellow-100 text-yellow-700';
        default:
            return 'bg-gray-100 text-gray-700';
    }
};

const getTypeLabel = (type) => {
    switch (type) {
        case 'increase':
            return 'Incremento';
        case 'decrease':
            return 'Decremento';
        case 'initial':
            return 'Inventario Inicial';
        case 'correction':
            return 'Corrección';
        default:
            return type;
    }
};

const clearFilters = () => {
    searchQuery.value = '';
    typeFilter.value = null;
    dateRange.value = [null, null];
};

// Razones predefinidas para ajustes
const predefinedReasons = {
    increase: ['Productos no registrados', 'Devolución de cliente', 'Donación recibida', 'Excedente de producción'],
    decrease: ['Productos dañados', 'Productos vencidos', 'Productos robados', 'Productos donados', 'Muestras para clientes'],
    initial: ['Inventario inicial', 'Apertura de almacén', 'Migración de sistema'],
    correction: ['Error de conteo', 'Corrección de inventario', 'Ajuste por auditoría']
};

// Actualizar razones predefinidas cuando cambia el tipo
const updateReasonOptions = () => {
    return predefinedReasons[adjustmentForm.value.type] || [];
};
</script>

<template>
    <div class="grid">
        <div class="col-12">
            <div class="card">
                <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                    <h5 class="m-0">Ajustes de Inventario</h5>
                    <div class="mt-3 md:mt-0">
                        <button class="p-button p-component" @click="openNewAdjustmentDialog">
                            <i class="pi pi-plus mr-2"></i>
                            <span class="p-button-label">Nuevo Ajuste</span>
                        </button>
                    </div>
                </div>

                <div class="grid mt-4">
                    <div class="col-12 md:col-4 mb-3">
                        <div class="p-input-icon-left w-full">
                            <i class="pi pi-search"></i>
                            <input type="text" v-model="searchQuery" class="p-inputtext p-component w-full" placeholder="Buscar..." />
                        </div>
                    </div>

                    <div class="col-6 md:col-3 mb-3">
                        <label for="type-filter" class="block mb-2">Tipo</label>
                        <select id="type-filter" v-model="typeFilter" class="p-inputtext p-component w-full">
                            <option v-for="option in typeOptions" :key="option.value" :value="option.value">
                                {{ option.label }}
                            </option>
                        </select>
                    </div>

                    <div class="col-6 md:col-4 mb-3">
                        <label class="block mb-2">Rango de Fechas</label>
                        <div class="flex">
                            <input type="date" v-model="dateRange[0]" class="p-inputtext p-component w-full mr-2" />
                            <input type="date" v-model="dateRange[1]" class="p-inputtext p-component w-full" />
                        </div>
                    </div>

                    <div class="col-12 md:col-1 mb-3 flex align-items-end">
                        <button class="p-button p-component p-button-outlined w-full" @click="clearFilters">
                            <i class="pi pi-filter-slash"></i>
                        </button>
                    </div>
                </div>

                <div v-if="loading" class="flex justify-content-center mt-4">
                    <i class="pi pi-spin pi-spinner text-2xl"></i>
                </div>

                <div v-else-if="filteredAdjustments.length === 0" class="text-center p-5">
                    <i class="pi pi-sliders-h text-4xl text-500 mb-3"></i>
                    <p>No hay ajustes que coincidan con los filtros</p>
                </div>

                <div v-else class="overflow-x-auto mt-4">
                    <table class="w-full">
                        <thead>
                            <tr>
                                <th class="text-left p-3 border-bottom-1 surface-border"># Ajuste</th>
                                <th class="text-left p-3 border-bottom-1 surface-border">Almacén</th>
                                <th class="text-left p-3 border-bottom-1 surface-border">Fecha</th>
                                <th class="text-center p-3 border-bottom-1 surface-border">Tipo</th>
                                <th class="text-left p-3 border-bottom-1 surface-border">Motivo</th>
                                <th class="text-right p-3 border-bottom-1 surface-border">Items</th>
                                <th class="text-right p-3 border-bottom-1 surface-border">Cantidad</th>
                                <th class="text-left p-3 border-bottom-1 surface-border">Creado por</th>
                                <th class="text-center p-3 border-bottom-1 surface-border">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="adjustment in filteredAdjustments" :key="adjustment.id" class="cursor-pointer hover:surface-200" @click="viewAdjustmentDetails(adjustment)">
                                <td class="p-3 border-bottom-1 surface-border">
                                    {{ adjustment.id }}
                                </td>
                                <td class="p-3 border-bottom-1 surface-border">
                                    {{ adjustment.warehouse }}
                                </td>
                                <td class="p-3 border-bottom-1 surface-border">
                                    {{ adjustment.date }}
                                </td>
                                <td class="text-center p-3 border-bottom-1 surface-border">
                                    <span class="px-2 py-1 text-xs border-round" :class="getTypeClass(adjustment.type)">
                                        {{ getTypeLabel(adjustment.type) }}
                                    </span>
                                </td>
                                <td class="p-3 border-bottom-1 surface-border">
                                    {{ adjustment.reason }}
                                </td>
                                <td class="text-right p-3 border-bottom-1 surface-border">
                                    {{ adjustment.items }}
                                </td>
                                <td class="text-right p-3 border-bottom-1 surface-border">
                                    {{ adjustment.totalQuantity }}
                                </td>
                                <td class="p-3 border-bottom-1 surface-border">
                                    {{ adjustment.createdBy }}
                                </td>
                                <td class="text-center p-3 border-bottom-1 surface-border">
                                    <div class="flex justify-content-center">
                                        <button class="p-button p-component p-button-icon-only p-button-rounded p-button-text" @click.stop="viewAdjustmentDetails(adjustment)">
                                            <i class="pi pi-eye"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Diálogo de Nuevo Ajuste -->
        <div v-if="displayAdjustmentDialog" class="fixed top-0 left-0 w-full h-full flex justify-content-center align-items-center bg-black-alpha-40" style="z-index: 1000">
            <div class="surface-card p-4 shadow-2 border-round w-full md:w-6">
                <div class="flex justify-content-between align-items-center mb-4">
                    <h5 class="m-0">Nuevo Ajuste de Inventario</h5>
                    <button class="p-button p-component p-button-icon-only p-button-rounded p-button-text" @click="displayAdjustmentDialog = false">
                        <i class="pi pi-times"></i>
                    </button>
                </div>

                <div class="grid formgrid">
                    <div class="field col-12 md:col-6 mb-4">
                        <label for="warehouse" class="block mb-2">Almacén*</label>
                        <select id="warehouse" v-model="adjustmentForm.warehouse" class="p-inputtext p-component w-full">
                            <option v-for="option in warehouseOptions" :key="option.value" :value="option.value">
                                {{ option.label }}
                            </option>
                        </select>
                    </div>

                    <div class="field col-12 md:col-6 mb-4">
                        <label for="type" class="block mb-2">Tipo de Ajuste*</label>
                        <select id="type" v-model="adjustmentForm.type" class="p-inputtext p-component w-full">
                            <option v-for="option in typeOptions.filter((o) => o.value)" :key="option.value" :value="option.value">
                                {{ option.label }}
                            </option>
                        </select>
                    </div>

                    <div class="field col-12 mb-4">
                        <label for="date" class="block mb-2">Fecha</label>
                        <input id="date" type="date" v-model="adjustmentForm.date" class="p-inputtext p-component w-full" />
                    </div>

                    <div class="field col-12 mb-4">
                        <label for="reason" class="block mb-2">Motivo*</label>
                        <div class="flex flex-column">
                            <select v-if="updateReasonOptions().length > 0" class="p-inputtext p-component w-full mb-2" @change="(e) => (adjustmentForm.reason = e.target.value)">
                                <option value="">-- Seleccionar motivo predefinido --</option>
                                <option v-for="(reason, index) in updateReasonOptions()" :key="index" :value="reason">
                                    {{ reason }}
                                </option>
                            </select>
                            <input id="reason" type="text" v-model="adjustmentForm.reason" class="p-inputtext p-component w-full" placeholder="Especifique el motivo del ajuste" />
                        </div>
                    </div>

                    <div class="field col-12 mb-4">
                        <label for="notes" class="block mb-2">Notas</label>
                        <textarea id="notes" v-model="adjustmentForm.notes" rows="3" class="p-inputtextarea p-component w-full" placeholder="Ingrese notas o comentarios sobre este ajuste..."></textarea>
                    </div>
                </div>

                <div class="flex justify-content-end">
                    <button class="p-button p-component p-button-secondary mr-2" @click="displayAdjustmentDialog = false">
                        <span class="p-button-label">Cancelar</span>
                    </button>
                    <button class="p-button p-component" @click="createAdjustment">
                        <span class="p-button-label">Continuar</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.cursor-pointer {
    cursor: pointer;
}

.overflow-x-auto {
    overflow-x: auto;
}
</style>
