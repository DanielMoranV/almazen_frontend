<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useAuthStore } from '@/stores/authStore';

const toast = useToast();
const authStore = useAuthStore();
const loading = ref(false);
const sessions = ref([]);
const displayNewSessionDialog = ref(false);
const displayCloseSessionDialog = ref(false);
const selectedSession = ref(null);
const initialAmount = ref(0);
const closingAmount = ref(0);
const closingNotes = ref('');

// Datos de ejemplo para las sesiones
const mockSessions = [
    {
        id: 1,
        cashier: 'Juan Pérez',
        openedAt: '2025-06-01 08:00:00',
        closedAt: '2025-06-01 16:00:00',
        initialAmount: 1000,
        closingAmount: 5600,
        status: 'closed',
        sales: 15,
        totalSales: 4600
    },
    {
        id: 2,
        cashier: 'María López',
        openedAt: '2025-06-01 16:00:00',
        closedAt: '2025-06-02 00:00:00',
        initialAmount: 1000,
        closingAmount: 3800,
        status: 'closed',
        sales: 10,
        totalSales: 2800
    },
    {
        id: 3,
        cashier: 'Carlos Rodríguez',
        openedAt: '2025-06-02 08:00:00',
        closedAt: null,
        initialAmount: 1000,
        closingAmount: null,
        status: 'active',
        sales: 5,
        totalSales: 1500
    }
];

onMounted(() => {
    loadSessions();
});

const loadSessions = () => {
    loading.value = true;
    // Simulación de carga de datos
    setTimeout(() => {
        sessions.value = mockSessions;
        loading.value = false;
    }, 500);
};

const openNewSessionDialog = () => {
    // Verificar si ya hay una sesión activa
    const activeSession = sessions.value.find(session => session.status === 'active');
    if (activeSession) {
        toast.add({
            severity: 'warn',
            summary: 'Advertencia',
            detail: 'Ya existe una sesión activa. Debe cerrarla antes de abrir una nueva.',
            life: 3000
        });
        return;
    }
    
    initialAmount.value = 1000; // Monto inicial predeterminado
    displayNewSessionDialog.value = true;
};

const createNewSession = () => {
    if (initialAmount.value <= 0) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'El monto inicial debe ser mayor a cero',
            life: 3000
        });
        return;
    }
    
    loading.value = true;
    
    // Simulación de creación de sesión
    setTimeout(() => {
        const newSession = {
            id: sessions.value.length + 1,
            cashier: authStore.currentUser?.name || 'Usuario Actual',
            openedAt: new Date().toLocaleString(),
            closedAt: null,
            initialAmount: initialAmount.value,
            closingAmount: null,
            status: 'active',
            sales: 0,
            totalSales: 0
        };
        
        sessions.value.unshift(newSession);
        displayNewSessionDialog.value = false;
        loading.value = false;
        
        toast.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Sesión de caja abierta correctamente',
            life: 3000
        });
    }, 1000);
};

const openCloseSessionDialog = (session) => {
    selectedSession.value = session;
    closingAmount.value = session.initialAmount + session.totalSales;
    closingNotes.value = '';
    displayCloseSessionDialog.value = true;
};

const closeSession = () => {
    if (closingAmount.value <= 0) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'El monto de cierre debe ser mayor a cero',
            life: 3000
        });
        return;
    }
    
    loading.value = true;
    
    // Simulación de cierre de sesión
    setTimeout(() => {
        const index = sessions.value.findIndex(s => s.id === selectedSession.value.id);
        if (index !== -1) {
            sessions.value[index].closedAt = new Date().toLocaleString();
            sessions.value[index].closingAmount = closingAmount.value;
            sessions.value[index].status = 'closed';
        }
        
        displayCloseSessionDialog.value = false;
        selectedSession.value = null;
        loading.value = false;
        
        toast.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Sesión de caja cerrada correctamente',
            life: 3000
        });
    }, 1000);
};

const getSessionStatusClass = (status) => {
    return {
        'bg-green-100 text-green-700': status === 'active',
        'bg-blue-100 text-blue-700': status === 'closed'
    };
};

const formatCurrency = (value) => {
    return value ? `$${value.toLocaleString()}` : '-';
};
</script>

<template>
    <div class="grid">
        <div class="col-12">
            <div class="card">
                <div class="flex justify-content-between align-items-center mb-4">
                    <h5 class="m-0">Sesiones de Caja</h5>
                    <button class="p-button p-component" @click="openNewSessionDialog">
                        <i class="pi pi-plus mr-2"></i>
                        <span class="p-button-label">Nueva Sesión</span>
                    </button>
                </div>
                
                <div v-if="loading" class="flex justify-content-center">
                    <i class="pi pi-spin pi-spinner text-2xl"></i>
                </div>
                
                <div v-else-if="sessions.length === 0" class="text-center p-5">
                    <i class="pi pi-clock text-4xl text-500 mb-3"></i>
                    <p>No hay sesiones de caja registradas</p>
                </div>
                
                <div v-else class="overflow-x-auto">
                    <table class="w-full">
                        <thead>
                            <tr>
                                <th class="text-left p-3 border-bottom-1 surface-border">ID</th>
                                <th class="text-left p-3 border-bottom-1 surface-border">Cajero</th>
                                <th class="text-left p-3 border-bottom-1 surface-border">Apertura</th>
                                <th class="text-left p-3 border-bottom-1 surface-border">Cierre</th>
                                <th class="text-right p-3 border-bottom-1 surface-border">Monto Inicial</th>
                                <th class="text-right p-3 border-bottom-1 surface-border">Ventas</th>
                                <th class="text-right p-3 border-bottom-1 surface-border">Total Ventas</th>
                                <th class="text-right p-3 border-bottom-1 surface-border">Monto Cierre</th>
                                <th class="text-center p-3 border-bottom-1 surface-border">Estado</th>
                                <th class="text-center p-3 border-bottom-1 surface-border">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="session in sessions" :key="session.id">
                                <td class="p-3 border-bottom-1 surface-border">{{ session.id }}</td>
                                <td class="p-3 border-bottom-1 surface-border">{{ session.cashier }}</td>
                                <td class="p-3 border-bottom-1 surface-border">{{ session.openedAt }}</td>
                                <td class="p-3 border-bottom-1 surface-border">{{ session.closedAt || '-' }}</td>
                                <td class="text-right p-3 border-bottom-1 surface-border">{{ formatCurrency(session.initialAmount) }}</td>
                                <td class="text-right p-3 border-bottom-1 surface-border">{{ session.sales }}</td>
                                <td class="text-right p-3 border-bottom-1 surface-border">{{ formatCurrency(session.totalSales) }}</td>
                                <td class="text-right p-3 border-bottom-1 surface-border">{{ formatCurrency(session.closingAmount) }}</td>
                                <td class="text-center p-3 border-bottom-1 surface-border">
                                    <span class="px-2 py-1 text-xs border-round" :class="getSessionStatusClass(session.status)">
                                        {{ session.status === 'active' ? 'Activa' : 'Cerrada' }}
                                    </span>
                                </td>
                                <td class="text-center p-3 border-bottom-1 surface-border">
                                    <button v-if="session.status === 'active'" 
                                            class="p-button p-component p-button-sm p-button-danger" 
                                            @click="openCloseSessionDialog(session)">
                                        <span class="p-button-label">Cerrar</span>
                                    </button>
                                    <button v-else class="p-button p-component p-button-sm p-button-text">
                                        <i class="pi pi-eye"></i>
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        
        <!-- Diálogo para nueva sesión -->
        <div v-if="displayNewSessionDialog" class="fixed top-0 left-0 w-full h-full flex justify-content-center align-items-center bg-black-alpha-40" style="z-index: 1000;">
            <div class="surface-card p-4 shadow-2 border-round w-full md:w-6">
                <div class="flex justify-content-between align-items-center mb-4">
                    <h5 class="m-0">Nueva Sesión de Caja</h5>
                    <button class="p-button p-component p-button-icon-only p-button-rounded p-button-text" @click="displayNewSessionDialog = false">
                        <i class="pi pi-times"></i>
                    </button>
                </div>
                
                <div class="field mb-4">
                    <label for="initialAmount" class="block mb-2">Monto Inicial</label>
                    <div class="p-inputgroup">
                        <span class="p-inputgroup-addon">$</span>
                        <input id="initialAmount" type="number" v-model="initialAmount" class="p-inputtext p-component w-full" />
                    </div>
                </div>
                
                <div class="flex justify-content-end">
                    <button class="p-button p-component p-button-secondary mr-2" @click="displayNewSessionDialog = false">
                        <span class="p-button-label">Cancelar</span>
                    </button>
                    <button class="p-button p-component" :disabled="loading" @click="createNewSession">
                        <i v-if="loading" class="pi pi-spin pi-spinner mr-2"></i>
                        <span class="p-button-label">Abrir Sesión</span>
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Diálogo para cerrar sesión -->
        <div v-if="displayCloseSessionDialog" class="fixed top-0 left-0 w-full h-full flex justify-content-center align-items-center bg-black-alpha-40" style="z-index: 1000;">
            <div class="surface-card p-4 shadow-2 border-round w-full md:w-6">
                <div class="flex justify-content-between align-items-center mb-4">
                    <h5 class="m-0">Cerrar Sesión de Caja</h5>
                    <button class="p-button p-component p-button-icon-only p-button-rounded p-button-text" @click="displayCloseSessionDialog = false">
                        <i class="pi pi-times"></i>
                    </button>
                </div>
                
                <div v-if="selectedSession" class="mb-4">
                    <div class="grid">
                        <div class="col-6">
                            <p class="mb-2"><strong>Cajero:</strong></p>
                            <p class="text-500">{{ selectedSession.cashier }}</p>
                        </div>
                        <div class="col-6">
                            <p class="mb-2"><strong>Apertura:</strong></p>
                            <p class="text-500">{{ selectedSession.openedAt }}</p>
                        </div>
                        <div class="col-6">
                            <p class="mb-2"><strong>Monto Inicial:</strong></p>
                            <p class="text-500">{{ formatCurrency(selectedSession.initialAmount) }}</p>
                        </div>
                        <div class="col-6">
                            <p class="mb-2"><strong>Total Ventas:</strong></p>
                            <p class="text-500">{{ formatCurrency(selectedSession.totalSales) }}</p>
                        </div>
                    </div>
                </div>
                
                <div class="field mb-4">
                    <label for="closingAmount" class="block mb-2">Monto de Cierre</label>
                    <div class="p-inputgroup">
                        <span class="p-inputgroup-addon">$</span>
                        <input id="closingAmount" type="number" v-model="closingAmount" class="p-inputtext p-component w-full" />
                    </div>
                </div>
                
                <div class="field mb-4">
                    <label for="closingNotes" class="block mb-2">Notas de Cierre</label>
                    <textarea id="closingNotes" v-model="closingNotes" rows="3" class="p-inputtextarea p-component w-full"></textarea>
                </div>
                
                <div class="flex justify-content-end">
                    <button class="p-button p-component p-button-secondary mr-2" @click="displayCloseSessionDialog = false">
                        <span class="p-button-label">Cancelar</span>
                    </button>
                    <button class="p-button p-component p-button-danger" :disabled="loading" @click="closeSession">
                        <i v-if="loading" class="pi pi-spin pi-spinner mr-2"></i>
                        <span class="p-button-label">Cerrar Sesión</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.overflow-x-auto {
    overflow-x: auto;
}
</style>
