<script setup>
import { useCustomersStore } from '@/stores/customersStore';
import { useQuotesStore } from '@/stores/quotesStore';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import Button from 'primevue/button';
import ConfirmDialog from 'primevue/confirmdialog';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import Menu from 'primevue/menu';
import ProgressSpinner from 'primevue/progressspinner';
import Toast from 'primevue/toast';
import QuoteFormDialog from './componentsQuotes/QuoteFormDialog.vue';
import QuoteDetailDialog from './componentsQuotes/QuoteDetailDialog.vue';

const toast = useToast();
const router = useRouter();
const confirm = useConfirm();
const quotesStore = useQuotesStore();
const customersStore = useCustomersStore();

const searchQuery = ref('');
const statusFilter = ref('');
const showFilters = ref(false);
const dateFrom = ref('');
const dateTo = ref('');
const customerFilter = ref(null);

// Opciones de estado para filtrar
const statusOptions = [
    { label: 'Todos', value: '' },
    { label: 'Pendiente', value: 'PENDIENTE' },
    { label: 'Aprobado', value: 'APROBADO' },
    { label: 'Rechazado', value: 'RECHAZADO' },
    { label: 'Vencido', value: 'VENCIDO' }
];

// Estados adicionales
const showQuoteDialog = ref(false);
const showQuoteDetailDialog = ref(false);
const selectedQuote = ref(null);
const selectedQuoteId = ref(null);
const error = ref('');

// Referencias para menús contextuales
const menuRefs = ref({});
const menuItems = ref({});

// Computed properties para acceder a los datos del store
const quotes = computed(() => quotesStore.quotesList);
const loading = computed(() => quotesStore.isLoadingQuotes);
const quickMetrics = computed(() => quotesStore.quickMetrics);
const customerOptions = computed(() => [{ id: null, name: 'Todos los clientes' }, ...(customersStore.customersList || [])]);

// Estadísticas computadas
const totalQuotes = computed(() => quotes.value?.length || 0);
const pendingQuotes = computed(() => quotes.value?.filter((q) => q.status === 'PENDIENTE').length || 0);
const approvedQuotes = computed(() => quotes.value?.filter((q) => q.status === 'APROBADO').length || 0);
const totalValue = computed(() => quotes.value?.reduce((sum, q) => sum + (parseFloat(q.total_amount) || 0), 0) || 0);
const hasActiveFilters = computed(() => searchQuery.value || statusFilter.value || customerFilter.value || dateFrom.value || dateTo.value);

onMounted(async () => {
    await loadQuotes();
});

const loadQuotes = async () => {
    try {
        await quotesStore.fetchQuotes({ paginate: false });
    } catch (error) {
        console.error('Error loading quotes:', error);

        // Mostrar información detallada del error del servidor
        let errorMessage = 'Error al cargar las cotizaciones';
        let errorDetail = 'Error desconocido';

        if (error.response) {
            // El servidor respondió con un código de error
            const status = error.response.status;
            const statusText = error.response.statusText;

            errorMessage = `Error del servidor (${status})`;

            if (status === 500) {
                errorDetail = `Error interno del servidor: ${statusText}. El endpoint /api/quotes no está implementado o tiene un error en el backend.`;
            } else if (status === 404) {
                errorDetail = `Endpoint no encontrado: ${statusText}. La ruta /api/quotes no existe en el servidor.`;
            } else if (status === 401) {
                errorDetail = `No autorizado: ${statusText}. Verificar autenticación.`;
            } else if (status === 403) {
                errorDetail = `Acceso denegado: ${statusText}. Sin permisos para acceder a cotizaciones.`;
            } else {
                errorDetail = `${statusText}. Código de error: ${status}`;
            }

            // Mostrar datos adicionales del error si están disponibles
            if (error.response.data) {
                console.error('Server error data:', error.response.data);
                if (error.response.data.message) {
                    errorDetail += `\nMensaje del servidor: ${error.response.data.message}`;
                }
            }
        } else if (error.request) {
            // La petición se hizo pero no hubo respuesta
            errorMessage = 'Error de conexión';
            errorDetail = 'No se puede conectar al servidor. Verificar que el backend esté ejecutándose.';
        } else {
            // Algo más pasó
            errorMessage = 'Error de configuración';
            errorDetail = error.message || 'Error desconocido en la configuración de la petición.';
        }

        toast.add({
            severity: 'error',
            summary: errorMessage,
            detail: errorDetail,
            life: 10000
        });
    }
};

const createNewQuote = () => {
    // Limpiar selección y abrir modal para nueva cotización
    selectedQuote.value = null;
    showQuoteDialog.value = true;
};

const applyFilters = () => {
    const filters = {
        search: searchQuery.value,
        status: statusFilter.value,
        customer_id: customerFilter.value,
        date_from: dateFrom.value,
        date_to: dateTo.value
    };

    quotesStore.updateFilters(filters);
};

const clearFilters = () => {
    searchQuery.value = '';
    statusFilter.value = '';
    customerFilter.value = null;
    dateFrom.value = '';
    dateTo.value = '';
    quotesStore.clearFilters();
};

// Usar directamente los datos del store sin filtros adicionales
const filteredQuotes = computed(() => {
    return quotes.value || [];
});

const viewQuote = (quoteId) => {
    router.push(`/commerce/sales/quotes/${quoteId}`);
};

const viewQuoteDetails = (quote) => {
    selectedQuoteId.value = quote.id;
    showQuoteDetailDialog.value = true;
};

const approveQuote = async (quote, event) => {
    event.stopPropagation();

    if (!quotesStore.canApproveQuote(quote)) {
        toast.add({
            severity: 'warn',
            summary: 'Advertencia',
            detail: 'Esta cotización no se puede aprobar',
            life: 3000
        });
        return;
    }

    confirm.require({
        message: '¿Está seguro de aprobar esta cotización? Se creará una venta automáticamente y se descontará el stock.',
        header: 'Confirmar Aprobación',
        icon: 'pi pi-check',
        accept: async () => {
            try {
                const result = await quotesStore.approveQuote(quote.id);
                if (result.success) {
                    toast.add({
                        severity: 'success',
                        summary: 'Éxito',
                        detail: result.message || 'Cotización aprobada exitosamente',
                        life: 3000
                    });
                }
            } catch (error) {
                console.error('Error approving quote:', error);
                toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: quotesStore.message || 'Error al aprobar la cotización',
                    life: 3000
                });
            }
        }
    });
};

const rejectQuote = async (quote, event) => {
    event.stopPropagation();

    if (quote.status !== 'PENDIENTE') {
        toast.add({
            severity: 'warn',
            summary: 'Advertencia',
            detail: 'Solo se pueden rechazar cotizaciones pendientes',
            life: 3000
        });
        return;
    }

    confirm.require({
        message: '¿Está seguro de rechazar esta cotización?',
        header: 'Confirmar Rechazo',
        icon: 'pi pi-times',
        acceptClass: 'p-button-danger',
        accept: async () => {
            try {
                const result = await quotesStore.rejectQuote(quote.id);
                if (result.success) {
                    toast.add({
                        severity: 'success',
                        summary: 'Éxito',
                        detail: result.message || 'Cotización rechazada exitosamente',
                        life: 3000
                    });
                }
            } catch (error) {
                console.error('Error rejecting quote:', error);
                toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: quotesStore.message || 'Error al rechazar la cotización',
                    life: 3000
                });
            }
        }
    });
};

const downloadPdf = async (quote, event) => {
    event.stopPropagation();

    try {
        const result = await quotesStore.downloadPdf(quote.id);
        if (result.success) {
            toast.add({
                severity: 'success',
                summary: 'Éxito',
                detail: result.message,
                life: 3000
            });
        }
    } catch (error) {
        console.error('Error downloading PDF:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al descargar el PDF',
            life: 3000
        });
    }
};

const downloadExcel = async (quote, event) => {
    event.stopPropagation();

    try {
        const result = await quotesStore.downloadExcel(quote.id);
        if (result.success) {
            toast.add({
                severity: 'success',
                summary: 'Éxito',
                detail: result.message,
                life: 3000
            });
        }
    } catch (error) {
        console.error('Error downloading Excel:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al descargar el Excel',
            life: 3000
        });
    }
};

const editQuote = async (quote, event) => {
    event.stopPropagation();

    // Solo se pueden editar cotizaciones pendientes
    if (quote.status !== 'PENDIENTE') {
        toast.add({
            severity: 'warn',
            summary: 'Advertencia',
            detail: 'Solo se pueden editar cotizaciones pendientes',
            life: 3000
        });
        return;
    }

    try {
        // Cargar los detalles completos de la cotización
        toast.add({
            severity: 'info',
            summary: 'Cargando',
            detail: 'Cargando detalles de la cotización...',
            life: 2000
        });

        const result = await quotesStore.getQuote(quote.id);
        if (result.success) {
            const fullQuote = result.data;
            console.log('Full quote with details:', fullQuote);
            console.log('Quote details:', fullQuote.details);

            // Abrir el modal con la cotización completa
            selectedQuote.value = fullQuote;
            showQuoteDialog.value = true;
        } else {
            throw new Error(result.message || 'Error al cargar la cotización');
        }
    } catch (error) {
        console.error('Error loading quote for edit:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al cargar los detalles de la cotización',
            life: 5000
        });
    }
};

const deleteQuote = async (quote, event) => {
    event.stopPropagation();

    if (quote.status !== 'PENDIENTE') {
        toast.add({
            severity: 'warn',
            summary: 'Advertencia',
            detail: 'Solo se pueden eliminar cotizaciones pendientes',
            life: 3000
        });
        return;
    }

    confirm.require({
        message: '¿Está seguro de eliminar esta cotización? Esta acción no se puede deshacer.',
        header: 'Confirmar Eliminación',
        icon: 'pi pi-trash',
        acceptClass: 'p-button-danger',
        accept: async () => {
            try {
                const result = await quotesStore.removeQuote(quote.id);
                if (result.success) {
                    toast.add({
                        severity: 'success',
                        summary: 'Éxito',
                        detail: result.message || 'Cotización eliminada exitosamente',
                        life: 3000
                    });
                }
            } catch (error) {
                console.error('Error deleting quote:', error);
                toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: quotesStore.message || 'Error al eliminar la cotización',
                    life: 3000
                });
            }
        }
    });
};

const getStatusClass = (status) => {
    switch (status) {
        case 'PENDIENTE':
            return 'bg-yellow-100 text-yellow-700';
        case 'APROBADO':
            return 'bg-green-100 text-green-700';
        case 'RECHAZADO':
            return 'bg-red-100 text-red-700';
        case 'VENCIDO':
            return 'bg-gray-100 text-gray-700';
        default:
            return 'bg-gray-100 text-gray-700';
    }
};

const getStatusLabel = (status) => {
    switch (status) {
        case 'PENDIENTE':
            return 'Pendiente';
        case 'APROBADO':
            return 'Aprobado';
        case 'RECHAZADO':
            return 'Rechazado';
        case 'VENCIDO':
            return 'Vencido';
        default:
            return status;
    }
};

// Funciones simplificadas para evitar bucles de reactividad
const formatCurrency = (value) => {
    if (!value) return 'S/ 0.00';
    try {
        return `S/ ${parseFloat(value).toFixed(2)}`;
    } catch {
        return 'S/ 0.00';
    }
};

const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
        return new Date(dateString).toLocaleDateString();
    } catch {
        return '-';
    }
};

const isExpiringSoon = (validUntil) => {
    return false; // Temporalmente deshabilitado para evitar bucles
};

const getStatusSeverity = (status) => {
    switch (status) {
        case 'PENDIENTE':
            return 'warning';
        case 'APROBADO':
            return 'success';
        case 'RECHAZADO':
            return 'danger';
        case 'VENCIDO':
            return 'secondary';
        default:
            return 'secondary';
    }
};

// Función simplificada para evitar bucles de reactividad
const getRowClass = () => {
    return 'cursor-pointer hover:bg-gray-50';
};

// Función para obtener items del menú contextual basado en el estado de la cotización
const getMenuItems = (quote) => {
    const items = [];
    
    // Opción de editar solo para cotizaciones pendientes
    if (quote.status === 'PENDIENTE') {
        items.push({
            label: 'Editar',
            icon: 'pi pi-pencil',
            command: () => editQuoteFromMenu(quote),
            class: 'text-blue-600'
        });
        
        items.push({ separator: true });
    }
    
    // Siempre mostrar opciones de descarga
    items.push({
        label: 'Descargar PDF',
        icon: 'pi pi-file-pdf',
        command: () => downloadPdfFromMenu(quote)
    });
    
    items.push({
        label: 'Descargar Excel',
        icon: 'pi pi-file-excel',
        command: () => downloadExcelFromMenu(quote)
    });
    
    // Mostrar opciones de estado solo para cotizaciones pendientes
    if (quote.status === 'PENDIENTE') {
        items.push({ separator: true });
        
        items.push({
            label: 'Aprobar',
            icon: 'pi pi-check',
            command: () => approveQuoteFromMenu(quote),
            class: 'text-green-600'
        });
        
        items.push({
            label: 'Rechazar',
            icon: 'pi pi-times',
            command: () => rejectQuoteFromMenu(quote),
            class: 'text-red-600'
        });
    }
    
    return items;
};

// Función para mostrar el menú contextual
const toggleMenu = (event, quote) => {
    menuItems.value[quote.id] = getMenuItems(quote);
    menuRefs.value[quote.id]?.toggle(event);
};

// Función para configurar la referencia del menú
const setMenuRef = (el, quoteId) => {
    if (el) {
        menuRefs.value[quoteId] = el;
    }
};

// Funciones wrapper para el menú contextual (sin parámetros de evento)
const downloadPdfFromMenu = async (quote) => {
    try {
        const result = await quotesStore.downloadPdf(quote.id);
        if (result.success) {
            toast.add({
                severity: 'success',
                summary: 'Éxito',
                detail: result.message,
                life: 3000
            });
        }
    } catch (error) {
        console.error('Error downloading PDF:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al descargar el PDF',
            life: 3000
        });
    }
};

const downloadExcelFromMenu = async (quote) => {
    try {
        const result = await quotesStore.downloadExcel(quote.id);
        if (result.success) {
            toast.add({
                severity: 'success',
                summary: 'Éxito',
                detail: result.message,
                life: 3000
            });
        }
    } catch (error) {
        console.error('Error downloading Excel:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al descargar el Excel',
            life: 3000
        });
    }
};

const approveQuoteFromMenu = async (quote) => {
    if (!quotesStore.canApproveQuote(quote)) {
        toast.add({
            severity: 'warn',
            summary: 'Advertencia',
            detail: 'Esta cotización no se puede aprobar',
            life: 3000
        });
        return;
    }

    confirm.require({
        message: '¿Está seguro de aprobar esta cotización? Se creará una venta automáticamente y se descontará el stock.',
        header: 'Confirmar Aprobación',
        icon: 'pi pi-check',
        accept: async () => {
            try {
                const result = await quotesStore.approveQuote(quote.id);
                if (result.success) {
                    toast.add({
                        severity: 'success',
                        summary: 'Éxito',
                        detail: result.message || 'Cotización aprobada exitosamente',
                        life: 3000
                    });
                }
            } catch (error) {
                console.error('Error approving quote:', error);
                toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: quotesStore.message || 'Error al aprobar la cotización',
                    life: 3000
                });
            }
        }
    });
};

const rejectQuoteFromMenu = async (quote) => {
    if (quote.status !== 'PENDIENTE') {
        toast.add({
            severity: 'warn',
            summary: 'Advertencia',
            detail: 'Solo se pueden rechazar cotizaciones pendientes',
            life: 3000
        });
        return;
    }

    confirm.require({
        message: '¿Está seguro de rechazar esta cotización?',
        header: 'Confirmar Rechazo',
        icon: 'pi pi-times',
        acceptClass: 'p-button-danger',
        accept: async () => {
            try {
                const result = await quotesStore.rejectQuote(quote.id);
                if (result.success) {
                    toast.add({
                        severity: 'success',
                        summary: 'Éxito',
                        detail: result.message || 'Cotización rechazada exitosamente',
                        life: 3000
                    });
                }
            } catch (error) {
                console.error('Error rejecting quote:', error);
                toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: quotesStore.message || 'Error al rechazar la cotización',
                    life: 3000
                });
            }
        }
    });
};

const editQuoteFromMenu = async (quote) => {
    // Solo se pueden editar cotizaciones pendientes
    if (quote.status !== 'PENDIENTE') {
        toast.add({
            severity: 'warn',
            summary: 'Advertencia',
            detail: 'Solo se pueden editar cotizaciones pendientes',
            life: 3000
        });
        return;
    }

    try {
        // Cargar los detalles completos de la cotización
        toast.add({
            severity: 'info',
            summary: 'Cargando',
            detail: 'Cargando detalles de la cotización...',
            life: 2000
        });

        const result = await quotesStore.getQuote(quote.id);
        if (result.success) {
            const fullQuote = result.data;
            console.log('Full quote from menu:', fullQuote);

            // Abrir el modal con la cotización completa
            selectedQuote.value = fullQuote;
            showQuoteDialog.value = true;
        } else {
            throw new Error(result.message || 'Error al cargar la cotización');
        }
    } catch (error) {
        console.error('Error loading quote for edit from menu:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al cargar los detalles de la cotización',
            life: 5000
        });
    }
};

const handleQuoteUpdated = async (updatedQuote) => {
    // Recargar la lista de cotizaciones cuando se actualiza una cotización desde el modal
    await loadQuotes();
    
    toast.add({
        severity: 'info',
        summary: 'Actualizado',
        detail: 'La cotización ha sido actualizada',
        life: 3000
    });
};

const handleEditQuote = async (quote) => {
    try {
        // Si la cotización ya tiene detalles, usarla directamente
        if (quote.details && quote.details.length > 0) {
            selectedQuote.value = quote;
            showQuoteDialog.value = true;
            return;
        }

        // Cargar los detalles completos de la cotización si no los tiene
        toast.add({
            severity: 'info',
            summary: 'Cargando',
            detail: 'Cargando detalles de la cotización...',
            life: 2000
        });

        const result = await quotesStore.getQuote(quote.id);
        if (result.success) {
            const fullQuote = result.data;
            console.log('Full quote from handleEditQuote:', fullQuote);

            // Abrir el modal con la cotización completa
            selectedQuote.value = fullQuote;
            showQuoteDialog.value = true;
        } else {
            throw new Error(result.message || 'Error al cargar la cotización');
        }
    } catch (error) {
        console.error('Error in handleEditQuote:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al cargar los detalles de la cotización',
            life: 5000
        });
    }
};

const handleQuoteSubmit = async (quoteData) => {
    try {
        let result;
        if (selectedQuote.value) {
            // Editar cotización existente
            result = await quotesStore.updateQuote(quoteData);
        } else {
            // Crear nueva cotización
            result = await quotesStore.createQuote(quoteData);
        }

        if (result.success) {
            toast.add({
                severity: 'success',
                summary: 'Éxito',
                detail: selectedQuote.value 
                    ? 'Cotización actualizada exitosamente' 
                    : 'Cotización creada exitosamente',
                life: 3000
            });

            // Cerrar el modal y recargar datos
            showQuoteDialog.value = false;
            selectedQuote.value = null;
            await loadQuotes();
        }
    } catch (error) {
        console.error('Error saving quote:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: quotesStore.message || 'Error al guardar la cotización',
            life: 5000
        });
    }
};
</script>

<template>
    <div class="quotes-page">
        <Toast />

        <!-- Mostrar error específico del servidor -->
        <div v-if="error && error.includes('500')" class="mb-4">
            <Message severity="error" :sticky="true" :life="0">
                <template #messageicon>
                    <i class="pi pi-server text-red-600"></i>
                </template>
                <div class="flex flex-column gap-2">
                    <div class="font-semibold">Error del Servidor (500)</div>
                    <div class="text-sm">
                        El endpoint <code>/api/quotes</code> no está implementado en el backend.
                        <br />
                        <strong>Acción requerida:</strong> Implementar los endpoints de cotizaciones según la documentación de la API.
                    </div>
                </div>
            </Message>
        </div>

        <!-- Toolbar Principal con Filtros Integrados -->
        <div class="quotes-toolbar">
            <div class="toolbar-header">
                <div class="header-backdrop"></div>
                <div class="header-content">
                    <!-- Sección izquierda: Título y estadísticas -->
                    <div class="title-section">
                        <div class="title-wrapper">
                            <div class="icon-container animate-pulse-soft">
                                <i class="pi pi-file-edit"></i>
                                <div class="icon-glow"></div>
                            </div>
                            <div class="title-text">
                                <h1 class="page-title">
                                    Cotizaciones
                                    <div class="title-underline"></div>
                                </h1>
                                <div class="subtitle-container">
                                    <div v-if="totalQuotes > 0" class="subtitle-animated">
                                        <div class="subtitle-item">
                                            <i class="pi pi-chart-bar subtitle-icon"></i>
                                            <span>{{ totalQuotes }} {{ totalQuotes === 1 ? 'cotización' : 'cotizaciones' }}</span>
                                        </div>
                                        <div class="subtitle-separator"></div>
                                        <div class="subtitle-item pending-indicator" v-if="pendingQuotes > 0">
                                            <div class="status-dot pending-dot"></div>
                                            <span>{{ pendingQuotes }} pendientes</span>
                                        </div>
                                        <div class="subtitle-separator" v-if="pendingQuotes > 0 && approvedQuotes > 0"></div>
                                        <div class="subtitle-item approved-indicator" v-if="approvedQuotes > 0">
                                            <div class="status-dot approved-dot"></div>
                                            <span>{{ approvedQuotes }} aprobadas</span>
                                        </div>
                                    </div>
                                    <div v-else class="subtitle-empty">
                                        <i class="pi pi-info-circle"></i>
                                        <span>Listo para crear tu primera cotización</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Sección central: Filtros compactos -->
                    <div class="filters-section-compact">
                        <div class="compact-filters">
                            <!-- Búsqueda mejorada -->
                            <div class="search-input-container enhanced">
                                <div class="search-wrapper">
                                    <i class="pi pi-search search-icon"></i>
                                    <InputText
                                        v-model="searchQuery"
                                        placeholder="Buscar por número, cliente, notas..."
                                        class="filter-search-compact enhanced"
                                        @input="applyFilters"
                                        @focus="$event.target.parentElement.classList.add('focused')"
                                        @blur="$event.target.parentElement.classList.remove('focused')"
                                    />
                                    <div class="search-glow"></div>
                                </div>
                            </div>

                            <!-- Estado mejorado -->
                            <div class="filter-wrapper">
                                <Dropdown
                                    v-model="statusFilter"
                                    :options="statusOptions"
                                    optionLabel="label"
                                    optionValue="value"
                                    placeholder="📋 Estado"
                                    class="filter-select-compact enhanced"
                                    showClear
                                    @change="applyFilters"
                                    v-tooltip.bottom="'Filtrar por estado de cotización'"
                                />
                                <div class="filter-glow"></div>
                            </div>

                            <!-- Cliente mejorado -->
                            <div class="filter-wrapper">
                                <Dropdown
                                    v-model="customerFilter"
                                    :options="customerOptions"
                                    optionLabel="name"
                                    optionValue="id"
                                    placeholder="👤 Cliente"
                                    class="filter-select-compact enhanced"
                                    showClear
                                    filter
                                    @change="applyFilters"
                                    v-tooltip.bottom="'Filtrar por cliente específico'"
                                />
                                <div class="filter-glow"></div>
                            </div>

                            <!-- Botón para limpiar filtros mejorado -->
                            <div class="clear-filter-wrapper">
                                <Button
                                    icon="pi pi-filter-slash"
                                    outlined
                                    @click="clearFilters"
                                    v-tooltip.bottom="'Limpiar todos los filtros'"
                                    class="clear-filters-btn-compact enhanced"
                                    :disabled="!hasActiveFilters"
                                    :class="{ 'pulse-hint': hasActiveFilters }"
                                />
                                <div class="clear-glow" v-if="hasActiveFilters"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Sección derecha: Acciones -->
                    <div class="actions-section enhanced">
                        <div class="action-button-wrapper">
                            <Button icon="pi pi-refresh" class="refresh-btn-compact enhanced" :loading="loading" @click="loadQuotes" v-tooltip.bottom="'Actualizar lista de cotizaciones'" :disabled="loading" />
                            <div class="action-ripple" v-if="!loading"></div>
                        </div>

                        <div class="action-button-wrapper primary">
                            <Button icon="pi pi-plus" class="new-quote-btn-compact enhanced" @click="createNewQuote" v-tooltip.bottom="'✨ Crear nueva cotización'" />
                            <div class="action-ripple primary"></div>
                            <div class="button-shine"></div>
                        </div>
                    </div>
                </div>

                <!-- Tags de filtros activos -->
                <div v-if="hasActiveFilters" class="active-filters-compact">
                    <div class="filter-tags-compact">
                        <span v-if="searchQuery" class="filter-tag-compact">
                            <i class="pi pi-search"></i>
                            "{{ searchQuery }}"
                            <button
                                @click="
                                    searchQuery = '';
                                    applyFilters();
                                "
                                class="tag-remove-compact"
                            >
                                <i class="pi pi-times"></i>
                            </button>
                        </span>

                        <span v-if="statusFilter" class="filter-tag-compact">
                            <i class="pi pi-tag"></i>
                            {{ getStatusLabel(statusFilter) }}
                            <button
                                @click="
                                    statusFilter = '';
                                    applyFilters();
                                "
                                class="tag-remove-compact"
                            >
                                <i class="pi pi-times"></i>
                            </button>
                        </span>

                        <span v-if="customerFilter" class="filter-tag-compact">
                            <i class="pi pi-user"></i>
                            {{ customerOptions.find((c) => c.id === customerFilter)?.name || 'Cliente' }}
                            <button
                                @click="
                                    customerFilter = null;
                                    applyFilters();
                                "
                                class="tag-remove-compact"
                            >
                                <i class="pi pi-times"></i>
                            </button>
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Estadísticas mejoradas -->
        <div class="quotes-statistics enhanced">
            <div class="stats-card total-quotes enhanced" v-tooltip.top="'Vista general de todas las cotizaciones'">
                <div class="card-background"></div>
                <div class="stat-icon">
                    <i class="pi pi-file-edit"></i>
                    <div class="icon-pulse"></div>
                </div>
                <div class="stat-content">
                    <div class="stat-value animated">
                        <span class="number-counter">{{ totalQuotes }}</span>
                        <div class="value-trend" v-if="totalQuotes > 0">
                            <i class="pi pi-arrow-up trend-icon"></i>
                        </div>
                    </div>
                    <div class="stat-label">Total Cotizaciones</div>
                </div>
                <div class="card-shine"></div>
            </div>

            <div class="stats-card pending-quotes enhanced" v-tooltip.top="'Cotizaciones esperando aprobación'">
                <div class="card-background"></div>
                <div class="stat-icon">
                    <i class="pi pi-clock"></i>
                    <div class="icon-pulse warning" v-if="pendingQuotes > 0"></div>
                </div>
                <div class="stat-content">
                    <div class="stat-value animated">
                        <span class="number-counter">{{ pendingQuotes }}</span>
                        <div class="urgency-indicator" v-if="pendingQuotes > 5">
                            <i class="pi pi-exclamation-triangle"></i>
                        </div>
                    </div>
                    <div class="stat-label">Pendientes</div>
                    <div class="progress-bar" v-if="totalQuotes > 0">
                        <div class="progress-fill" :style="{ width: `${(pendingQuotes / totalQuotes) * 100}%` }"></div>
                    </div>
                </div>
                <div class="card-shine"></div>
            </div>

            <div class="stats-card approved-quotes enhanced" v-tooltip.top="'Cotizaciones aprobadas exitosamente'">
                <div class="card-background"></div>
                <div class="stat-icon">
                    <i class="pi pi-check-circle"></i>
                    <div class="icon-pulse success" v-if="approvedQuotes > 0"></div>
                </div>
                <div class="stat-content">
                    <div class="stat-value animated">
                        <span class="number-counter">{{ approvedQuotes }}</span>
                        <div class="success-badge" v-if="approvedQuotes > 0">
                            <i class="pi pi-check"></i>
                        </div>
                    </div>
                    <div class="stat-label">Aprobadas</div>
                    <div class="progress-bar" v-if="totalQuotes > 0">
                        <div class="progress-fill success" :style="{ width: `${(approvedQuotes / totalQuotes) * 100}%` }"></div>
                    </div>
                </div>
                <div class="card-shine"></div>
            </div>

            <div class="stats-card total-value enhanced" v-tooltip.top="'Valor total de todas las cotizaciones'">
                <div class="card-background"></div>
                <div class="stat-icon">
                    <i class="pi pi-dollar"></i>
                    <div class="icon-pulse value" v-if="totalValue > 0"></div>
                </div>
                <div class="stat-content">
                    <div class="stat-value animated">
                        <span class="currency-counter">{{ formatCurrency(totalValue) }}</span>
                        <div class="value-indicator" v-if="totalValue > 10000">
                            <i class="pi pi-star-fill"></i>
                        </div>
                    </div>
                    <div class="stat-label">Valor Total</div>
                    <div class="sparkline" v-if="totalValue > 0">
                        <div class="spark-line"></div>
                    </div>
                </div>
                <div class="card-shine"></div>
            </div>
        </div>

        <!-- Lista de cotizaciones mejorada -->
        <transition name="slide-up" appear>
            <div class="quotes-table-container">
                <div v-if="loading" class="loading-state">
                    <div class="loading-content">
                        <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
                        <p>Cargando cotizaciones...</p>
                    </div>
                </div>

                <div v-else-if="filteredQuotes.length === 0" class="empty-state">
                    <div class="empty-content">
                        <i class="pi pi-file-edit empty-icon"></i>
                        <h3>No hay cotizaciones</h3>
                        <p>No se encontraron cotizaciones que coincidan con los filtros aplicados.</p>
                        <Button icon="pi pi-plus" label="Crear primera cotización" @click="createNewQuote" class="create-first-btn" />
                    </div>
                </div>

                <!-- Tabla mejorada -->
                <div v-else class="quotes-table">
                    <div class="table-header">
                        <div class="header-cell col-quote">Cotización</div>
                        <div class="header-cell col-customer">Cliente</div>
                        <div class="header-cell col-status">Estado</div>
                        <div class="header-cell col-date">Fecha</div>
                        <div class="header-cell col-valid-until">Válido hasta</div>
                        <div class="header-cell col-total">Total</div>
                        <div class="header-cell col-actions">Acciones</div>
                    </div>

                    <div class="table-body">
                        <div v-for="quote in filteredQuotes" :key="quote.id" class="table-row" @click="viewQuoteDetails(quote)">
                            <div class="table-cell col-quote">
                                <div class="quote-info">
                                    <span class="quote-number">Q-{{ String(quote.id).padStart(6, '0') }}</span>
                                    <span class="quote-notes">{{ quote.notes || 'Sin notas' }}</span>
                                </div>
                            </div>

                            <div class="table-cell col-customer">
                                <div class="customer-info">
                                    <span class="customer-name">{{ quote.customer?.name || 'Cliente no especificado' }}</span>
                                    <span class="customer-email">{{ quote.customer?.email }}</span>
                                </div>
                            </div>

                            <div class="table-cell col-status">
                                <span :class="`status-badge status-${quote.status?.toLowerCase() || 'unknown'}`">
                                    {{ getStatusLabel(quote.status) }}
                                </span>
                            </div>

                            <div class="table-cell col-date">
                                {{ formatDate(quote.quote_date) }}
                            </div>

                            <div class="table-cell col-valid-until">
                                {{ formatDate(quote.valid_until) }}
                            </div>

                            <div class="table-cell col-total">
                                <span class="total-amount">{{ formatCurrency(quote.total_amount) }}</span>
                            </div>

                            <div class="table-cell col-actions">
                                <div class="action-buttons">
                                    <Button icon="pi pi-eye" class="action-btn view-btn" @click.stop="viewQuoteDetails(quote)" v-tooltip="'Ver detalles'" />
                                    <Button 
                                        v-if="quote.status === 'PENDIENTE'" 
                                        icon="pi pi-pencil" 
                                        class="action-btn edit-btn" 
                                        @click="editQuote(quote, $event)" 
                                        v-tooltip="'Editar'" 
                                    />
                                    <Button 
                                        v-else 
                                        icon="pi pi-pencil" 
                                        class="action-btn edit-btn disabled" 
                                        disabled 
                                        v-tooltip="'Solo se pueden editar cotizaciones pendientes'" 
                                    />
                                    <Button icon="pi pi-ellipsis-v" class="action-btn more-btn" @click.stop="toggleMenu($event, quote)" v-tooltip="'Más opciones'" />
                                    
                                    <!-- Menú contextual -->
                                    <Menu 
                                        :ref="(el) => setMenuRef(el, quote.id)"
                                        :model="menuItems[quote.id] || []"
                                        popup
                                        class="quote-context-menu"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </transition>

        <!-- Dialog de nueva/editar cotización -->
        <QuoteFormDialog 
            v-model:visible="showQuoteDialog" 
            :quote="selectedQuote" 
            :loading="loading" 
            @submit="handleQuoteSubmit" 
            @update:visible="(val) => { if (!val) selectedQuote = null; }"
        />

        <!-- Dialog de detalles de cotización -->
        <QuoteDetailDialog 
            v-model:visible="showQuoteDetailDialog" 
            :quote-id="selectedQuoteId" 
            @quote-updated="handleQuoteUpdated"
            @edit-quote="handleEditQuote" 
        />

        <!-- Confirmación de acciones -->
        <ConfirmDialog />
    </div>
</template>

<style scoped>
/* Contenedor principal de la página de cotizaciones */
.quotes-page {
    @apply min-h-screen space-y-6;
}

/* Toolbar principal con efecto de elevación */
.quotes-toolbar {
    @apply bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 mb-6 overflow-hidden;
    box-shadow:
        0 10px 25px -5px rgba(0, 0, 0, 0.1),
        0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

/* Encabezado del toolbar con gradiente azul para cotizaciones */
.toolbar-header {
    @apply relative overflow-hidden;
    background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%);
    padding: 1.5rem 2rem;
    position: relative;
}

/* Fondo decorativo con patrón */
.header-backdrop {
    @apply absolute inset-0 opacity-10;
    background-image: radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.3) 2px, transparent 2px), radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.2) 1px, transparent 1px);
    background-size:
        50px 50px,
        30px 30px;
    animation: pattern-move 20s linear infinite;
}

.header-content {
    @apply relative z-10 flex justify-between items-center gap-6;
}

/* Sección del título */
.title-section {
    @apply flex-1;
}

.title-wrapper {
    @apply flex items-center gap-4;
}

/* Contenedor del ícono con efecto glassmorphism mejorado */
.icon-container {
    @apply w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30 relative overflow-hidden;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.icon-container:hover {
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.icon-container i {
    @apply text-3xl text-white relative z-10;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* Efectos de glow para el ícono */
.icon-glow {
    @apply absolute inset-0 rounded-2xl opacity-0;
    background: radial-gradient(circle at center, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
    transition: opacity 0.3s ease;
}

.icon-container:hover .icon-glow {
    opacity: 1;
}

/* Animación suave de pulso */
.animate-pulse-soft {
    animation: pulse-soft 3s ease-in-out infinite;
}

@keyframes pulse-soft {
    0%,
    100% {
        transform: scale(1);
    }
    50% {
        transform: scale(1.02);
    }
}

/* Texto del título mejorado */
.title-text {
    @apply flex flex-col gap-2;
}

.page-title {
    @apply text-2xl font-bold text-white relative;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    letter-spacing: -0.025em;
    transition: all 0.3s ease;
}

/* Underline animado para el título */
.title-underline {
    @apply absolute -bottom-1 left-0 h-0.5 bg-white/60 rounded-full;
    width: 0;
    transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    animation: underline-expand 2s ease-out 0.5s forwards;
}

@keyframes underline-expand {
    to {
        width: 100%;
    }
}

/* Container de subtítulos mejorado */
.subtitle-container {
    @apply mt-1;
}

.subtitle-animated {
    @apply flex items-center gap-3 flex-wrap;
    animation: subtitle-fade-in 0.8s ease-out 0.3s both;
}

.subtitle-empty {
    @apply flex items-center gap-2 text-white/70;
    animation: subtitle-fade-in 0.8s ease-out 0.3s both;
}

@keyframes subtitle-fade-in {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Items de subtítulo */
.subtitle-item {
    @apply flex items-center gap-2 text-white/80 font-medium text-sm;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;
}

.subtitle-item:hover {
    @apply text-white;
    transform: translateY(-1px);
}

.subtitle-icon {
    @apply text-white/60;
}

/* Separadores */
.subtitle-separator {
    @apply w-1 h-1 bg-white/40 rounded-full;
}

/* Indicadores de estado en subtítulo */
.status-dot {
    @apply w-2 h-2 rounded-full;
    box-shadow: 0 0 4px currentColor;
}

.pending-dot {
    @apply bg-yellow-400;
    animation: pulse-warning 2s ease-in-out infinite;
}

.approved-dot {
    @apply bg-green-400;
    animation: pulse-success 3s ease-in-out infinite;
}

@keyframes pulse-warning {
    0%,
    100% {
        box-shadow: 0 0 4px rgba(251, 191, 36, 0.5);
    }
    50% {
        box-shadow:
            0 0 8px rgba(251, 191, 36, 0.8),
            0 0 16px rgba(251, 191, 36, 0.3);
    }
}

@keyframes pulse-success {
    0%,
    100% {
        box-shadow: 0 0 4px rgba(34, 197, 94, 0.5);
    }
    50% {
        box-shadow:
            0 0 8px rgba(34, 197, 94, 0.8),
            0 0 16px rgba(34, 197, 94, 0.3);
    }
}

/* Sección de filtros compacta */
.filters-section-compact {
    @apply flex items-center;
}

.compact-filters {
    @apply flex items-center gap-3;
}

/* Input de búsqueda con ícono integrado */
.search-input-container {
    @apply relative;
}

.search-icon {
    @apply absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 z-10;
    pointer-events: none;
}

.filter-search-compact {
    @apply bg-white/90 backdrop-blur-sm border-2 border-white/50 text-gray-800 text-sm font-medium transition-all duration-300 pl-10;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    height: 40px;
    min-width: 200px;
    border-radius: 10px;
    padding-right: 12px;
}

.filter-search-compact:hover {
    @apply bg-white border-white/70;
}

.filter-search-compact:focus {
    @apply bg-white border-white ring-2 ring-white/30;
}

/* Filtros de dropdown compactos */
.filter-select-compact {
    @apply bg-white/90 backdrop-blur-sm border-2 border-white/50 text-gray-800 text-sm font-medium transition-all duration-300;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    height: 40px;
    min-width: 120px;
    border-radius: 10px;
    padding: 0 12px;
}

.filter-select-compact:hover {
    @apply bg-white border-white/70;
}

.filter-select-compact:focus {
    @apply bg-white border-white ring-2 ring-white/30;
}

/* Botón limpiar filtros */
.clear-filters-btn-compact {
    @apply bg-white/20 backdrop-blur-sm border-2 border-white/30 text-white hover:bg-white/30 hover:border-white/40 transition-all duration-300;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    width: 40px;
    height: 40px;
    min-width: 40px;
    min-height: 40px;
    border-radius: 10px;
    padding: 0;
}

.clear-filters-btn-compact:disabled {
    @apply opacity-50 cursor-not-allowed;
}

/* Sección de acciones */
.actions-section {
    @apply flex items-center gap-3;
}

/* Botón de refrescar */
.refresh-btn-compact {
    @apply bg-white/20 border-2 border-white/30 text-white hover:bg-white/30 hover:border-white/40;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    width: 40px;
    height: 40px;
    min-width: 40px;
    min-height: 40px;
    border-radius: 10px;
    transition: all 0.3s ease;
    padding: 0;
}

.refresh-btn-compact:hover {
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
    transform: translateY(-1px);
}

.refresh-btn-compact:disabled {
    @apply opacity-60 cursor-not-allowed;
    transform: none !important;
}

/* Botón de nueva cotización - circular */
.new-quote-btn-compact {
    @apply bg-white/20 border-2 border-white/30 text-white hover:bg-white/30 hover:border-white/40 hover:scale-105;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    width: 40px;
    height: 40px;
    min-width: 40px;
    min-height: 40px;
    border-radius: 50%;
    transition: all 0.3s ease;
    padding: 0;
}

.new-quote-btn-compact:hover {
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
    transform: scale(1.05);
}

/* Tags de filtros activos */
.active-filters-compact {
    @apply mt-3 pt-3 border-t border-white/20;
}

.filter-tags-compact {
    @apply flex flex-wrap gap-2;
}

.filter-tag-compact {
    @apply inline-flex items-center gap-2 px-2 py-1 bg-white/20 backdrop-blur-sm text-white rounded-full text-xs font-medium border border-white/30;
}

.tag-remove-compact {
    @apply ml-1 w-3 h-3 rounded-full hover:bg-white/30 flex items-center justify-center transition-colors;
}

.tag-remove-compact i {
    @apply text-xs;
}

/* Estadísticas mejoradas */
.quotes-statistics {
    @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6;
}

.stats-card {
    @apply bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-xl hover:-translate-y-1;
}

.stats-card.total-quotes {
    @apply bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 border-blue-200 dark:border-blue-700;
}

.stats-card.pending-quotes {
    @apply bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900 dark:to-yellow-800 border-yellow-200 dark:border-yellow-700;
}

.stats-card.approved-quotes {
    @apply bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 border-green-200 dark:border-green-700;
}

.stats-card.total-value {
    @apply bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 border-purple-200 dark:border-purple-700;
}

.stat-icon {
    @apply w-12 h-12 rounded-xl flex items-center justify-center mb-4;
}

.total-quotes .stat-icon {
    @apply bg-blue-500/20 text-blue-600 dark:text-blue-400;
}

.pending-quotes .stat-icon {
    @apply bg-yellow-500/20 text-yellow-600 dark:text-yellow-400;
}

.approved-quotes .stat-icon {
    @apply bg-green-500/20 text-green-600 dark:text-green-400;
}

.total-value .stat-icon {
    @apply bg-purple-500/20 text-purple-600 dark:text-purple-400;
}

.stat-icon i {
    @apply text-xl;
}

.stat-content {
    @apply space-y-1;
}

.stat-value {
    @apply text-2xl font-bold text-gray-900 dark:text-gray-100;
}

.stat-label {
    @apply text-sm font-medium text-gray-600 dark:text-gray-400;
}

/* Contenedor de tabla mejorado */
.quotes-table-container {
    @apply bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden;
}

/* Estados de carga y vacío */
.loading-state,
.empty-state {
    @apply p-12 text-center;
}

.loading-content,
.empty-content {
    @apply flex flex-col items-center gap-4;
}

.loading-content p,
.empty-content p {
    @apply text-gray-600 dark:text-gray-400;
}

.empty-icon {
    @apply text-6xl text-gray-300 dark:text-gray-600;
}

.empty-content h3 {
    @apply text-xl font-semibold text-gray-700 dark:text-gray-300;
}

.create-first-btn {
    @apply mt-4;
}

/* Tabla personalizada */
.quotes-table {
    @apply overflow-hidden;
}

.table-header {
    @apply bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600 p-4 grid grid-cols-7 gap-4 font-semibold text-sm text-gray-700 dark:text-gray-300;
}

.table-body {
    @apply divide-y divide-gray-200 dark:divide-gray-700;
}

.table-row {
    @apply p-4 grid grid-cols-7 gap-4 items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors;
}

.table-cell {
    @apply text-sm;
}

.header-cell {
    @apply font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide;
}

/* Columnas específicas */
.col-quote {
    @apply col-span-1;
}

.col-customer {
    @apply col-span-1;
}

.col-status {
    @apply col-span-1;
}

.col-date {
    @apply col-span-1;
}

.col-valid-until {
    @apply col-span-1;
}

.col-total {
    @apply col-span-1;
}

.col-actions {
    @apply col-span-1 text-center;
}

/* Información de cotización */
.quote-info {
    @apply space-y-1;
}

.quote-number {
    @apply font-semibold text-blue-600 dark:text-blue-400;
}

.quote-notes {
    @apply text-xs text-gray-500 dark:text-gray-400;
}

/* Información de cliente */
.customer-info {
    @apply space-y-1;
}

.customer-name {
    @apply font-medium text-gray-900 dark:text-gray-100;
}

.customer-email {
    @apply text-xs text-gray-500 dark:text-gray-400;
}

/* Badges de estado */
.status-badge {
    @apply inline-flex items-center px-2 py-1 rounded-full text-xs font-medium;
}

.status-pendiente {
    @apply bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300;
}

.status-aprobado {
    @apply bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300;
}

.status-rechazado {
    @apply bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300;
}

.status-vencido {
    @apply bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300;
}

.status-unknown {
    @apply bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300;
}

/* Monto total */
.total-amount {
    @apply font-semibold text-gray-900 dark:text-gray-100;
}

/* Botones de acción */
.action-buttons {
    @apply flex items-center justify-center gap-2;
}

.action-btn {
    @apply w-8 h-8 min-w-8 min-h-8 rounded-lg border-0 transition-all duration-200;
}

.view-btn {
    @apply bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-400 dark:hover:bg-blue-800;
}

.edit-btn {
    @apply bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-400 dark:hover:bg-green-800;
}

.edit-btn.disabled {
    @apply bg-gray-100 text-gray-400 cursor-not-allowed opacity-50 dark:bg-gray-700 dark:text-gray-500;
}

.edit-btn.disabled:hover {
    @apply bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500;
}

.more-btn {
    @apply bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600;
}

/* Estilos para el menú contextual */
:deep(.quote-context-menu) {
    @apply bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl;
    min-width: 180px;
}

:deep(.quote-context-menu .p-menuitem-link) {
    @apply px-3 py-2 text-sm transition-colors duration-200;
}

:deep(.quote-context-menu .p-menuitem-link:hover) {
    @apply bg-gray-50 dark:bg-gray-700;
}

:deep(.quote-context-menu .p-menuitem-icon) {
    @apply mr-3;
}

:deep(.quote-context-menu .p-separator) {
    @apply my-1 border-gray-200 dark:border-gray-700;
}

/* Animación del patrón de fondo */
@keyframes pattern-move {
    0% {
        background-position:
            0% 0%,
            0% 0%;
    }

    100% {
        background-position:
            100% 100%,
            -100% -100%;
    }
}

/* Animación de transición */
.slide-up-enter-active {
    transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.slide-up-enter-from {
    transform: translateY(20px);
    opacity: 0;
}

/* Ajustes responsivos */
@media (max-width: 768px) {
    .quotes-page {
        @apply space-y-4 p-2;
    }

    .toolbar-header {
        @apply p-4;
    }

    .header-content {
        @apply flex-col items-start gap-3;
    }

    .title-wrapper {
        @apply gap-3;
    }

    .icon-container {
        @apply w-12 h-12;
    }

    .icon-container i {
        @apply text-2xl;
    }

    .page-title {
        @apply text-xl;
    }

    .subtitle {
        @apply text-xs;
    }

    .filters-section-compact {
        @apply w-full;
    }

    .compact-filters {
        @apply flex-wrap gap-2;
    }

    .filter-select-compact,
    .filter-search-compact {
        height: 36px;
        min-width: 110px;
        font-size: 0.875rem;
    }

    .actions-section {
        @apply w-full justify-end;
    }

    .quotes-statistics {
        @apply grid-cols-2 gap-3;
    }

    .table-header,
    .table-row {
        @apply grid-cols-1 gap-2;
    }

    .table-cell {
        @apply border-b border-gray-100 dark:border-gray-700 pb-2 mb-2 last:border-b-0;
    }

    .header-cell::before,
    .table-cell::before {
        content: attr(data-label);
        @apply font-semibold text-gray-700 dark:text-gray-300 block;
    }
}

@media (max-width: 480px) {
    .toolbar-header {
        @apply p-3;
    }

    .page-title {
        @apply text-lg;
    }

    .compact-filters {
        @apply flex-col gap-2 w-full;
    }

    .filter-select-compact,
    .filter-search-compact {
        @apply w-full min-w-full;
    }

    .quotes-statistics {
        @apply grid-cols-1;
    }
}

/* Estilos para los componentes mejorados */

/* Efectos de glow y focus para inputs de búsqueda */
.search-input-container.enhanced {
    @apply relative;
}

.search-wrapper {
    @apply relative;
}

.search-wrapper.focused .search-glow {
    opacity: 1;
    transform: scale(1.02);
}

.search-glow {
    @apply absolute inset-0 rounded-lg pointer-events-none opacity-0;
    background: linear-gradient(45deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.1));
    transition: all 0.3s ease;
    filter: blur(1px);
}

.filter-search-compact.enhanced:focus + .search-glow {
    opacity: 1;
    transform: scale(1.02);
}

/* Wrapper para filtros con efectos de glow */
.filter-wrapper {
    @apply relative;
}

.filter-glow {
    @apply absolute inset-0 rounded-lg pointer-events-none opacity-0;
    background: linear-gradient(45deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
    transition: all 0.3s ease;
    filter: blur(1px);
}

.filter-wrapper:hover .filter-glow {
    opacity: 0.7;
}

.filter-select-compact.enhanced:focus ~ .filter-glow {
    opacity: 1;
    transform: scale(1.02);
}

/* Wrapper para botón de limpiar filtros */
.clear-filter-wrapper {
    @apply relative;
}

.clear-glow {
    @apply absolute inset-0 rounded-lg pointer-events-none;
    background: radial-gradient(circle at center, rgba(255, 255, 255, 0.4) 0%, transparent 70%);
    animation: clear-pulse 2s ease-in-out infinite;
}

@keyframes clear-pulse {
    0%,
    100% {
        opacity: 0.3;
        transform: scale(1);
    }
    50% {
        opacity: 0.6;
        transform: scale(1.05);
    }
}

.pulse-hint {
    animation: hint-pulse 1.5s ease-in-out infinite;
}

@keyframes hint-pulse {
    0%,
    100% {
        transform: scale(1);
    }
    50% {
        transform: scale(1.02);
    }
}

/* Estilos mejorados para la sección de acciones */
.actions-section.enhanced {
    @apply flex items-center gap-3;
}

.action-button-wrapper {
    @apply relative overflow-hidden rounded-lg;
}

.action-ripple {
    @apply absolute inset-0 rounded-lg pointer-events-none opacity-0;
    background: radial-gradient(circle at center, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
    transition: all 0.3s ease;
}

.action-button-wrapper:hover .action-ripple {
    opacity: 1;
    animation: ripple-effect 0.6s ease-out;
}

.action-ripple.primary {
    background: radial-gradient(circle at center, rgba(255, 255, 255, 0.4) 0%, transparent 70%);
}

@keyframes ripple-effect {
    0% {
        transform: scale(0.8);
        opacity: 0;
    }
    50% {
        transform: scale(1.1);
        opacity: 1;
    }
    100% {
        transform: scale(1.3);
        opacity: 0;
    }
}

.button-shine {
    @apply absolute inset-0 rounded-lg pointer-events-none opacity-0;
    background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.5) 50%, transparent 70%);
    transition: all 0.3s ease;
}

.action-button-wrapper.primary:hover .button-shine {
    opacity: 1;
    animation: shine-sweep 1s ease-out;
}

@keyframes shine-sweep {
    0% {
        transform: translateX(-100%) skewX(-25deg);
    }
    100% {
        transform: translateX(100%) skewX(-25deg);
    }
}

/* Estilos mejorados para estadísticas */
.quotes-statistics.enhanced {
    @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6;
}

.stats-card.enhanced {
    @apply relative overflow-hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.stats-card.enhanced:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.card-background {
    @apply absolute inset-0 opacity-0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
    transition: opacity 0.3s ease;
}

.stats-card.enhanced:hover .card-background {
    opacity: 1;
}

.stat-icon {
    @apply relative;
}

.icon-pulse {
    @apply absolute inset-0 rounded-xl opacity-0;
    background: radial-gradient(circle at center, currentColor 0%, transparent 70%);
    animation: icon-pulse 2s ease-in-out infinite;
}

.icon-pulse.warning {
    animation: icon-pulse-warning 1.5s ease-in-out infinite;
}

.icon-pulse.success {
    animation: icon-pulse-success 2.5s ease-in-out infinite;
}

.icon-pulse.value {
    animation: icon-pulse-value 3s ease-in-out infinite;
}

@keyframes icon-pulse {
    0%,
    100% {
        opacity: 0;
        transform: scale(1);
    }
    50% {
        opacity: 0.2;
        transform: scale(1.1);
    }
}

@keyframes icon-pulse-warning {
    0%,
    100% {
        opacity: 0;
        transform: scale(1);
    }
    50% {
        opacity: 0.3;
        transform: scale(1.15);
    }
}

@keyframes icon-pulse-success {
    0%,
    100% {
        opacity: 0;
        transform: scale(1);
    }
    50% {
        opacity: 0.25;
        transform: scale(1.08);
    }
}

@keyframes icon-pulse-value {
    0%,
    100% {
        opacity: 0;
        transform: scale(1);
    }
    50% {
        opacity: 0.2;
        transform: scale(1.05);
    }
}

.stat-value.animated {
    @apply relative;
}

.number-counter,
.currency-counter {
    @apply inline-block;
    animation: counter-fade-in 0.8s ease-out;
}

@keyframes counter-fade-in {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.value-trend,
.urgency-indicator,
.success-badge,
.value-indicator {
    @apply ml-2 inline-flex items-center;
}

.trend-icon {
    @apply text-green-500;
    animation: trend-bounce 2s ease-in-out infinite;
}

@keyframes trend-bounce {
    0%,
    100% {
        transform: translateY(0);
    }
    50% {
        transform: translateY(-2px);
    }
}

.urgency-indicator {
    @apply text-red-500;
    animation: urgency-flash 1s ease-in-out infinite;
}

@keyframes urgency-flash {
    0%,
    100% {
        opacity: 1;
    }
    50% {
        opacity: 0.5;
    }
}

.success-badge {
    @apply text-green-600;
    animation: success-glow 2s ease-in-out infinite;
}

@keyframes success-glow {
    0%,
    100% {
        transform: scale(1);
    }
    50% {
        transform: scale(1.1);
    }
}

.value-indicator {
    @apply text-yellow-500;
    animation: value-sparkle 3s ease-in-out infinite;
}

@keyframes value-sparkle {
    0%,
    100% {
        transform: rotate(0deg) scale(1);
    }
    25% {
        transform: rotate(90deg) scale(1.1);
    }
    50% {
        transform: rotate(180deg) scale(1);
    }
    75% {
        transform: rotate(270deg) scale(1.1);
    }
}

/* Barras de progreso */
.progress-bar {
    @apply w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full mt-2 overflow-hidden;
}

.progress-fill {
    @apply h-full bg-yellow-500 rounded-full transition-all duration-1000 ease-out;
    animation: progress-grow 1.5s ease-out;
}

.progress-fill.success {
    @apply bg-green-500;
}

@keyframes progress-grow {
    from {
        width: 0%;
    }
}

/* Sparkline para valor total */
.sparkline {
    @apply w-full h-4 mt-2 relative overflow-hidden;
}

.spark-line {
    @apply absolute inset-0 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full;
    height: 2px;
    top: 50%;
    transform: translateY(-50%);
    animation: sparkline-flow 3s ease-in-out infinite;
}

@keyframes sparkline-flow {
    0%,
    100% {
        transform: translateY(-50%) scaleX(0.8);
    }
    50% {
        transform: translateY(-50%) scaleX(1.2);
    }
}

.card-shine {
    @apply absolute inset-0 pointer-events-none opacity-0;
    background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.3) 50%, transparent 70%);
    transition: all 0.3s ease;
}

.stats-card.enhanced:hover .card-shine {
    opacity: 1;
    animation: card-shine-sweep 1.2s ease-out;
}

@keyframes card-shine-sweep {
    0% {
        transform: translateX(-100%) skewX(-25deg);
    }
    100% {
        transform: translateX(100%) skewX(-25deg);
    }
}

/* Mejoras para modo oscuro */
@media (prefers-color-scheme: dark) {
    .quotes-toolbar {
        box-shadow:
            0 10px 25px -5px rgba(0, 0, 0, 0.3),
            0 4px 6px -2px rgba(0, 0, 0, 0.2);
    }

    .search-glow {
        background: linear-gradient(45deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
    }

    .filter-glow {
        background: linear-gradient(45deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04));
    }

    .action-ripple {
        background: radial-gradient(circle at center, rgba(255, 255, 255, 0.15) 0%, transparent 70%);
    }

    .button-shine {
        background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.2) 50%, transparent 70%);
    }
}
</style>
