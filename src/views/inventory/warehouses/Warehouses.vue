<script setup>
import { ref, computed, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';

const toast = useToast();
const loading = ref(false);
const warehouses = ref([]);
const searchQuery = ref('');
const statusFilter = ref(null);
const displayWarehouseDialog = ref(false);
const editingWarehouse = ref(null);

// Opciones de estado para filtrar
const statusOptions = [
    { label: 'Todos', value: null },
    { label: 'Activo', value: 'active' },
    { label: 'Inactivo', value: 'inactive' }
];

// Formulario para nuevo/editar almacén
const warehouseForm = ref({
    name: '',
    code: '',
    address: '',
    city: '',
    phone: '',
    manager: '',
    status: 'active',
    notes: ''
});

// Datos de ejemplo para los almacenes
const mockWarehouses = [
    {
        id: 1,
        name: 'Almacén Principal',
        code: 'ALM-001',
        address: 'Av. Industrial 123',
        city: 'Ciudad de México',
        phone: '555-123-4567',
        manager: 'Juan Pérez',
        status: 'active',
        products: 120,
        totalStock: 2500,
        lastInventory: '2025-05-15'
    },
    {
        id: 2,
        name: 'Almacén Secundario',
        code: 'ALM-002',
        address: 'Calle Comercio 456',
        city: 'Guadalajara',
        phone: '555-987-6543',
        manager: 'María González',
        status: 'active',
        products: 85,
        totalStock: 1800,
        lastInventory: '2025-05-20'
    },
    {
        id: 3,
        name: 'Tienda Central',
        code: 'TIE-001',
        address: 'Plaza Mayor 789',
        city: 'Ciudad de México',
        phone: '555-456-7890',
        manager: 'Carlos Rodríguez',
        status: 'active',
        products: 65,
        totalStock: 950,
        lastInventory: '2025-05-25'
    },
    {
        id: 4,
        name: 'Almacén Norte',
        code: 'ALM-003',
        address: 'Blvd. Industrial 567',
        city: 'Monterrey',
        phone: '555-234-5678',
        manager: 'Ana Martínez',
        status: 'inactive',
        products: 0,
        totalStock: 0,
        lastInventory: '2025-04-10'
    }
];

onMounted(() => {
    loadWarehouses();
});

const loadWarehouses = () => {
    loading.value = true;
    // Simulación de carga de datos
    setTimeout(() => {
        warehouses.value = mockWarehouses;
        loading.value = false;
    }, 500);
};

const openNewWarehouseDialog = () => {
    warehouseForm.value = {
        name: '',
        code: '',
        address: '',
        city: '',
        phone: '',
        manager: '',
        status: 'active',
        notes: ''
    };
    editingWarehouse.value = null;
    displayWarehouseDialog.value = true;
};

const openEditWarehouseDialog = (warehouse) => {
    warehouseForm.value = {
        name: warehouse.name,
        code: warehouse.code,
        address: warehouse.address || '',
        city: warehouse.city || '',
        phone: warehouse.phone || '',
        manager: warehouse.manager || '',
        status: warehouse.status,
        notes: warehouse.notes || ''
    };
    editingWarehouse.value = warehouse;
    displayWarehouseDialog.value = true;
};

const saveWarehouse = () => {
    if (!warehouseForm.value.name || !warehouseForm.value.code) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Nombre y código son obligatorios',
            life: 3000
        });
        return;
    }
    
    loading.value = true;
    
    // Simulación de guardado
    setTimeout(() => {
        if (editingWarehouse.value) {
            // Actualizar almacén existente
            const index = warehouses.value.findIndex(w => w.id === editingWarehouse.value.id);
            if (index !== -1) {
                warehouses.value[index] = {
                    ...warehouses.value[index],
                    name: warehouseForm.value.name,
                    code: warehouseForm.value.code,
                    address: warehouseForm.value.address,
                    city: warehouseForm.value.city,
                    phone: warehouseForm.value.phone,
                    manager: warehouseForm.value.manager,
                    status: warehouseForm.value.status
                };
                
                toast.add({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: `Almacén ${warehouseForm.value.name} actualizado correctamente`,
                    life: 3000
                });
            }
        } else {
            // Crear nuevo almacén
            const newId = Math.max(...warehouses.value.map(w => w.id)) + 1;
            warehouses.value.push({
                id: newId,
                name: warehouseForm.value.name,
                code: warehouseForm.value.code,
                address: warehouseForm.value.address,
                city: warehouseForm.value.city,
                phone: warehouseForm.value.phone,
                manager: warehouseForm.value.manager,
                status: warehouseForm.value.status,
                products: 0,
                totalStock: 0,
                lastInventory: new Date().toISOString().slice(0, 10)
            });
            
            toast.add({
                severity: 'success',
                summary: 'Éxito',
                detail: `Almacén ${warehouseForm.value.name} creado correctamente`,
                life: 3000
            });
        }
        
        loading.value = false;
        displayWarehouseDialog.value = false;
    }, 1000);
};

const toggleWarehouseStatus = (warehouse) => {
    loading.value = true;
    
    // Simulación de cambio de estado
    setTimeout(() => {
        const index = warehouses.value.findIndex(w => w.id === warehouse.id);
        if (index !== -1) {
            const newStatus = warehouse.status === 'active' ? 'inactive' : 'active';
            warehouses.value[index].status = newStatus;
            
            toast.add({
                severity: 'success',
                summary: 'Éxito',
                detail: `Almacén ${warehouse.name} ${newStatus === 'active' ? 'activado' : 'desactivado'} correctamente`,
                life: 3000
            });
        }
        
        loading.value = false;
    }, 1000);
};

const runInventory = (warehouse) => {
    toast.add({
        severity: 'info',
        summary: 'Información',
        detail: `Iniciando inventario para ${warehouse.name}`,
        life: 3000
    });
    
    // Aquí se redireccionaría a la página de inventario o se abriría un diálogo
};

const filteredWarehouses = computed(() => {
    let result = warehouses.value;
    
    // Filtrar por búsqueda
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        result = result.filter(warehouse => 
            warehouse.name.toLowerCase().includes(query) || 
            warehouse.code.toLowerCase().includes(query) ||
            warehouse.city.toLowerCase().includes(query) ||
            warehouse.manager.toLowerCase().includes(query)
        );
    }
    
    // Filtrar por estado
    if (statusFilter.value) {
        result = result.filter(warehouse => warehouse.status === statusFilter.value);
    }
    
    return result;
});

const getStatusClass = (status) => {
    switch (status) {
        case 'active':
            return 'bg-green-100 text-green-700';
        case 'inactive':
            return 'bg-red-100 text-red-700';
        default:
            return 'bg-gray-100 text-gray-700';
    }
};

const getStatusLabel = (status) => {
    switch (status) {
        case 'active':
            return 'Activo';
        case 'inactive':
            return 'Inactivo';
        default:
            return status;
    }
};

const clearFilters = () => {
    searchQuery.value = '';
    statusFilter.value = null;
};
</script>

<template>
    <div class="grid">
        <div class="col-12">
            <div class="card">
                <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                    <h5 class="m-0">Almacenes</h5>
                    <div class="mt-3 md:mt-0">
                        <button class="p-button p-component" @click="openNewWarehouseDialog">
                            <i class="pi pi-plus mr-2"></i>
                            <span class="p-button-label">Nuevo Almacén</span>
                        </button>
                    </div>
                </div>
                
                <div class="grid mt-4">
                    <div class="col-12 md:col-6 mb-3">
                        <div class="p-input-icon-left w-full">
                            <i class="pi pi-search"></i>
                            <input type="text" v-model="searchQuery" class="p-inputtext p-component w-full" placeholder="Buscar almacén..." />
                        </div>
                    </div>
                    
                    <div class="col-6 md:col-3 mb-3">
                        <label for="status-filter" class="block mb-2">Estado</label>
                        <select id="status-filter" v-model="statusFilter" class="p-inputtext p-component w-full">
                            <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                                {{ option.label }}
                            </option>
                        </select>
                    </div>
                    
                    <div class="col-6 md:col-3 mb-3 flex align-items-end">
                        <button class="p-button p-component p-button-outlined w-full" @click="clearFilters">
                            <i class="pi pi-filter-slash mr-2"></i>
                            <span>Limpiar</span>
                        </button>
                    </div>
                </div>
                
                <div v-if="loading" class="flex justify-content-center mt-4">
                    <i class="pi pi-spin pi-spinner text-2xl"></i>
                </div>
                
                <div v-else-if="filteredWarehouses.length === 0" class="text-center p-5">
                    <i class="pi pi-home text-4xl text-500 mb-3"></i>
                    <p>No hay almacenes que coincidan con los filtros</p>
                </div>
                
                <div v-else class="grid mt-4">
                    <div v-for="warehouse in filteredWarehouses" :key="warehouse.id" class="col-12 md:col-6 xl:col-4 mb-3">
                        <div class="surface-card shadow-2 p-4 border-round">
                            <div class="flex justify-content-between align-items-center mb-3">
                                <div class="flex align-items-center">
                                    <i class="pi pi-building text-xl mr-2"></i>
                                    <span class="font-bold text-lg">{{ warehouse.name }}</span>
                                </div>
                                <span class="px-2 py-1 text-xs border-round" :class="getStatusClass(warehouse.status)">
                                    {{ getStatusLabel(warehouse.status) }}
                                </span>
                            </div>
                            
                            <div class="text-500 mb-2">Código: {{ warehouse.code }}</div>
                            
                            <div class="grid mb-3">
                                <div class="col-6">
                                    <div class="text-500 font-medium">Productos</div>
                                    <div class="font-bold">{{ warehouse.products }}</div>
                                </div>
                                <div class="col-6">
                                    <div class="text-500 font-medium">Stock Total</div>
                                    <div class="font-bold">{{ warehouse.totalStock }}</div>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <div class="text-500 font-medium">Ubicación</div>
                                <div>{{ warehouse.city }}</div>
                            </div>
                            
                            <div class="mb-3">
                                <div class="text-500 font-medium">Encargado</div>
                                <div>{{ warehouse.manager }}</div>
                            </div>
                            
                            <div class="mb-4">
                                <div class="text-500 font-medium">Último Inventario</div>
                                <div>{{ warehouse.lastInventory }}</div>
                            </div>
                            
                            <div class="flex justify-content-between">
                                <button class="p-button p-component p-button-outlined mr-2" @click="openEditWarehouseDialog(warehouse)">
                                    <i class="pi pi-pencil mr-2"></i>
                                    <span>Editar</span>
                                </button>
                                <button class="p-button p-component p-button-outlined mr-2" @click="runInventory(warehouse)">
                                    <i class="pi pi-list mr-2"></i>
                                    <span>Inventario</span>
                                </button>
                                <button 
                                    class="p-button p-component p-button-outlined" 
                                    :class="{'p-button-danger': warehouse.status === 'active', 'p-button-success': warehouse.status === 'inactive'}"
                                    @click="toggleWarehouseStatus(warehouse)"
                                >
                                    <i class="pi" :class="{'pi-power-off': warehouse.status === 'active', 'pi-check': warehouse.status === 'inactive'}"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Diálogo de Nuevo/Editar Almacén -->
        <div v-if="displayWarehouseDialog" class="fixed top-0 left-0 w-full h-full flex justify-content-center align-items-center bg-black-alpha-40" style="z-index: 1000;">
            <div class="surface-card p-4 shadow-2 border-round w-full md:w-8">
                <div class="flex justify-content-between align-items-center mb-4">
                    <h5 class="m-0">{{ editingWarehouse ? 'Editar Almacén' : 'Nuevo Almacén' }}</h5>
                    <button class="p-button p-component p-button-icon-only p-button-rounded p-button-text" @click="displayWarehouseDialog = false">
                        <i class="pi pi-times"></i>
                    </button>
                </div>
                
                <div class="grid formgrid">
                    <div class="field col-12 md:col-6 mb-4">
                        <label for="name" class="block mb-2">Nombre*</label>
                        <input id="name" type="text" v-model="warehouseForm.name" class="p-inputtext p-component w-full" placeholder="Nombre del almacén" />
                    </div>
                    
                    <div class="field col-12 md:col-6 mb-4">
                        <label for="code" class="block mb-2">Código*</label>
                        <input id="code" type="text" v-model="warehouseForm.code" class="p-inputtext p-component w-full" placeholder="Código único" />
                    </div>
                    
                    <div class="field col-12 mb-4">
                        <label for="address" class="block mb-2">Dirección</label>
                        <input id="address" type="text" v-model="warehouseForm.address" class="p-inputtext p-component w-full" placeholder="Dirección completa" />
                    </div>
                    
                    <div class="field col-12 md:col-6 mb-4">
                        <label for="city" class="block mb-2">Ciudad</label>
                        <input id="city" type="text" v-model="warehouseForm.city" class="p-inputtext p-component w-full" placeholder="Ciudad" />
                    </div>
                    
                    <div class="field col-12 md:col-6 mb-4">
                        <label for="phone" class="block mb-2">Teléfono</label>
                        <input id="phone" type="text" v-model="warehouseForm.phone" class="p-inputtext p-component w-full" placeholder="Teléfono de contacto" />
                    </div>
                    
                    <div class="field col-12 md:col-6 mb-4">
                        <label for="manager" class="block mb-2">Encargado</label>
                        <input id="manager" type="text" v-model="warehouseForm.manager" class="p-inputtext p-component w-full" placeholder="Nombre del encargado" />
                    </div>
                    
                    <div class="field col-12 md:col-6 mb-4">
                        <label for="status" class="block mb-2">Estado</label>
                        <select id="status" v-model="warehouseForm.status" class="p-inputtext p-component w-full">
                            <option value="active">Activo</option>
                            <option value="inactive">Inactivo</option>
                        </select>
                    </div>
                    
                    <div class="field col-12 mb-4">
                        <label for="notes" class="block mb-2">Notas</label>
                        <textarea id="notes" v-model="warehouseForm.notes" rows="3" class="p-inputtextarea p-component w-full" placeholder="Notas adicionales sobre el almacén..."></textarea>
                    </div>
                </div>
                
                <div class="flex justify-content-end">
                    <button class="p-button p-component p-button-secondary mr-2" @click="displayWarehouseDialog = false">
                        <span class="p-button-label">Cancelar</span>
                    </button>
                    <button class="p-button p-component" @click="saveWarehouse">
                        <span class="p-button-label">Guardar</span>
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
</style>
