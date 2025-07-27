<script setup>
import { ref, computed, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useRouter } from 'vue-router';

const toast = useToast();
const router = useRouter();
const loading = ref(false);
const quotes = ref([]);
const searchQuery = ref('');
const statusFilter = ref(null);

// Opciones de estado para filtrar
const statusOptions = [
    { label: 'Todos', value: null },
    { label: 'Pendiente', value: 'pending' },
    { label: 'Aprobada', value: 'approved' },
    { label: 'Rechazada', value: 'rejected' },
    { label: 'Expirada', value: 'expired' },
    { label: 'Convertida', value: 'converted' }
];

// Datos de ejemplo para las cotizaciones
const mockQuotes = [
    {
        id: 'COT-001',
        customer: 'Empresa ABC',
        date: '2025-06-01',
        validUntil: '2025-06-15',
        total: 5600,
        status: 'pending',
        items: 8
    },
    {
        id: 'COT-002',
        customer: 'Distribuidora XYZ',
        date: '2025-06-01',
        validUntil: '2025-06-15',
        total: 3200,
        status: 'approved',
        items: 5
    },
    {
        id: 'COT-003',
        customer: 'Comercial 123',
        date: '2025-06-02',
        validUntil: '2025-06-16',
        total: 1800,
        status: 'converted',
        items: 3
    },
    {
        id: 'COT-004',
        customer: 'Tienda Retail',
        date: '2025-05-15',
        validUntil: '2025-05-30',
        total: 4500,
        status: 'expired',
        items: 6
    },
    {
        id: 'COT-005',
        customer: 'Cliente Final',
        date: '2025-06-02',
        validUntil: '2025-06-16',
        total: 950,
        status: 'rejected',
        items: 2
    }
];

onMounted(() => {
    loadQuotes();
});

const loadQuotes = () => {
    loading.value = true;
    // Simulación de carga de datos
    setTimeout(() => {
        quotes.value = mockQuotes;
        loading.value = false;
    }, 500);
};

const createNewQuote = () => {
    // Por ahora mostrar toast, luego se implementará la ruta
    toast.add({
        severity: 'info',
        summary: 'Funcionalidad en Desarrollo',
        detail: 'La creación de cotizaciones estará disponible pronto',
        life: 3000
    });
};

const viewQuoteDetails = (quote) => {
    // Por ahora mostrar toast, luego se implementará la ruta
    toast.add({
        severity: 'info',
        summary: 'Funcionalidad en Desarrollo',
        detail: `Detalles de cotización ${quote.id} estarán disponibles pronto`,
        life: 3000
    });
};

const convertToOrder = (quote, event) => {
    event.stopPropagation();

    if (quote.status !== 'approved') {
        toast.add({
            severity: 'warn',
            summary: 'Advertencia',
            detail: 'Solo se pueden convertir cotizaciones aprobadas',
            life: 3000
        });
        return;
    }

    loading.value = true;

    // Simulación de conversión a orden
    setTimeout(() => {
        const index = quotes.value.findIndex((q) => q.id === quote.id);
        if (index !== -1) {
            quotes.value[index].status = 'converted';
        }

        toast.add({
            severity: 'success',
            summary: 'Éxito',
            detail: `Cotización ${quote.id} convertida a orden de venta`,
            life: 3000
        });

        loading.value = false;
    }, 1000);
};

const sendQuoteByEmail = (quote, event) => {
    event.stopPropagation();
    loading.value = true;

    // Simulación de envío por correo
    setTimeout(() => {
        toast.add({
            severity: 'success',
            summary: 'Éxito',
            detail: `Cotización ${quote.id} enviada por correo correctamente`,
            life: 3000
        });
        loading.value = false;
    }, 1000);
};

const filteredQuotes = computed(() => {
    let result = quotes.value;

    // Filtrar por búsqueda
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        result = result.filter((quote) => quote.id.toLowerCase().includes(query) || quote.customer.toLowerCase().includes(query));
    }

    // Filtrar por estado
    if (statusFilter.value) {
        result = result.filter((quote) => quote.status === statusFilter.value);
    }

    return result;
});

const getStatusClass = (status) => {
    switch (status) {
        case 'pending':
            return 'bg-yellow-100 text-yellow-700';
        case 'approved':
            return 'bg-blue-100 text-blue-700';
        case 'rejected':
            return 'bg-red-100 text-red-700';
        case 'expired':
            return 'bg-gray-100 text-gray-700';
        case 'converted':
            return 'bg-green-100 text-green-700';
        default:
            return 'bg-gray-100 text-gray-700';
    }
};

const getStatusLabel = (status) => {
    switch (status) {
        case 'pending':
            return 'Pendiente';
        case 'approved':
            return 'Aprobada';
        case 'rejected':
            return 'Rechazada';
        case 'expired':
            return 'Expirada';
        case 'converted':
            return 'Convertida';
        default:
            return status;
    }
};

const formatCurrency = (value) => {
    return value ? `$${value.toLocaleString()}` : '-';
};
</script>

<template>
    <div class="grid">
        <div class="col-12">
            <div class="card">
                <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                    <h5 class="m-0">Cotizaciones</h5>
                    <div class="mt-3 md:mt-0">
                        <button class="p-button p-component" @click="createNewQuote">
                            <i class="pi pi-plus mr-2"></i>
                            <span class="p-button-label">Nueva Cotización</span>
                        </button>
                    </div>
                </div>

                <div class="flex flex-column md:flex-row justify-content-between mt-4">
                    <div class="p-input-icon-left mb-3 md:mb-0 w-full md:w-4">
                        <i class="pi pi-search"></i>
                        <input type="text" v-model="searchQuery" class="p-inputtext p-component w-full" placeholder="Buscar..." />
                    </div>

                    <div class="flex align-items-center">
                        <label for="status-filter" class="mr-2">Estado:</label>
                        <select id="status-filter" v-model="statusFilter" class="p-inputtext p-component">
                            <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                                {{ option.label }}
                            </option>
                        </select>
                    </div>
                </div>

                <div v-if="loading" class="flex justify-content-center mt-4">
                    <i class="pi pi-spin pi-spinner text-2xl"></i>
                </div>

                <div v-else-if="filteredQuotes.length === 0" class="text-center p-5">
                    <i class="pi pi-file-edit text-4xl text-500 mb-3"></i>
                    <p>No hay cotizaciones que coincidan con los filtros</p>
                </div>

                <div v-else class="overflow-x-auto mt-4">
                    <table class="w-full">
                        <thead>
                            <tr>
                                <th class="text-left p-3 border-bottom-1 surface-border"># Cotización</th>
                                <th class="text-left p-3 border-bottom-1 surface-border">Cliente</th>
                                <th class="text-left p-3 border-bottom-1 surface-border">Fecha</th>
                                <th class="text-left p-3 border-bottom-1 surface-border">Válido Hasta</th>
                                <th class="text-right p-3 border-bottom-1 surface-border">Items</th>
                                <th class="text-right p-3 border-bottom-1 surface-border">Total</th>
                                <th class="text-center p-3 border-bottom-1 surface-border">Estado</th>
                                <th class="text-center p-3 border-bottom-1 surface-border">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="quote in filteredQuotes" :key="quote.id" class="cursor-pointer hover:surface-200" @click="viewQuoteDetails(quote)">
                                <td class="p-3 border-bottom-1 surface-border">{{ quote.id }}</td>
                                <td class="p-3 border-bottom-1 surface-border">{{ quote.customer }}</td>
                                <td class="p-3 border-bottom-1 surface-border">{{ quote.date }}</td>
                                <td class="p-3 border-bottom-1 surface-border">{{ quote.validUntil }}</td>
                                <td class="text-right p-3 border-bottom-1 surface-border">{{ quote.items }}</td>
                                <td class="text-right p-3 border-bottom-1 surface-border">{{ formatCurrency(quote.total) }}</td>
                                <td class="text-center p-3 border-bottom-1 surface-border">
                                    <span class="px-2 py-1 text-xs border-round" :class="getStatusClass(quote.status)">
                                        {{ getStatusLabel(quote.status) }}
                                    </span>
                                </td>
                                <td class="text-center p-3 border-bottom-1 surface-border">
                                    <div class="flex justify-content-center">
                                        <button class="p-button p-component p-button-icon-only p-button-rounded p-button-text mr-2" @click.stop="viewQuoteDetails(quote)">
                                            <i class="pi pi-eye"></i>
                                        </button>
                                        <button class="p-button p-component p-button-icon-only p-button-rounded p-button-text mr-2" @click.stop="sendQuoteByEmail(quote, $event)">
                                            <i class="pi pi-envelope"></i>
                                        </button>
                                        <button
                                            class="p-button p-component p-button-icon-only p-button-rounded p-button-text"
                                            :class="{ 'p-button-success': quote.status === 'approved' }"
                                            @click.stop="convertToOrder(quote, $event)"
                                            :disabled="quote.status !== 'approved'"
                                        >
                                            <i class="pi pi-shopping-cart"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
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
