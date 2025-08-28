import { 
    fetchQuotes, 
    getQuote, 
    createQuote, 
    updateQuote, 
    deleteQuote, 
    approveQuote, 
    rejectQuote, 
    downloadQuotePdf, 
    downloadQuoteExcel, 
    fetchQuoteStatistics 
} from '@/api';
import { handleProcessError, handleProcessSuccess } from '@/utils/apiHelpers';
import { defineStore } from 'pinia';

// Fechas por defecto para filtros (últimos 30 días)
const today = new Date();
const defaultDateTo = today.toISOString().split('T')[0];
const monthAgo = new Date(today);
monthAgo.setDate(today.getDate() - 30);
const defaultDateFrom = monthAgo.toISOString().split('T')[0];

/**
 * Store para operaciones de cotizaciones
 * Gestiona la creación, edición, eliminación y listado de cotizaciones con paginación y filtros.
 */
export const useQuotesStore = defineStore('quotesStore', {
    state: () => ({
        quotes: [],
        allQuotes: [], // Todos los datos descargados
        currentQuote: null,
        statistics: null,
        filters: {
            status: '',
            customer_id: null,
            date_from: defaultDateFrom,
            date_to: defaultDateTo,
            search: ''
        },
        pagination: {
            current_page: 1,
            per_page: 20,
            total: 0,
            last_page: 1
        },
        isLoading: false,
        isLoadingStatistics: false,
        message: '',
        success: false,
        validationErrors: [],
        currentSearchTerm: null
    }),

    getters: {
        quotesList: (state) => state.quotes,
        allQuotesList: (state) => state.allQuotes,
        isLoadingQuotes: (state) => state.isLoading,
        getCurrentQuote: (state) => state.currentQuote,
        getCurrentSearchTerm: (state) => state.currentSearchTerm,
        totalQuotes: (state) => state.pagination.total,
        hasActiveFilters: (state) => {
            return state.filters.status || 
                   state.filters.customer_id || 
                   state.filters.search ||
                   state.filters.date_from || 
                   state.filters.date_to;
        },
        
        // Getters para estadísticas
        getStatistics: (state) => state.statistics,
        isLoadingStats: (state) => state.isLoadingStatistics,

        // Getters para estados de cotización
        pendingQuotes: (state) => state.allQuotes.filter(quote => quote.status === 'PENDIENTE'),
        approvedQuotes: (state) => state.allQuotes.filter(quote => quote.status === 'APROBADO'),
        rejectedQuotes: (state) => state.allQuotes.filter(quote => quote.status === 'RECHAZADO'),
        expiredQuotes: (state) => state.allQuotes.filter(quote => quote.status === 'VENCIDO'),

        // Getter para métricas rápidas
        quickMetrics: (state) => {
            const allQuotes = state.allQuotes;
            return {
                total: allQuotes.length,
                pending: allQuotes.filter(q => q.status === 'PENDIENTE').length,
                approved: allQuotes.filter(q => q.status === 'APROBADO').length,
                rejected: allQuotes.filter(q => q.status === 'RECHAZADO').length,
                expired: allQuotes.filter(q => q.status === 'VENCIDO').length,
                totalAmount: allQuotes.reduce((sum, q) => sum + parseFloat(q.total_amount || 0), 0),
                approvedAmount: allQuotes.filter(q => q.status === 'APROBADO').reduce((sum, q) => sum + parseFloat(q.total_amount || 0), 0)
            };
        }
    },

    actions: {
        /**
         * Obtiene todas las cotizaciones con paginación opcional
         * @param {Object} params - Parámetros de consulta
         * @param {Boolean} forceRefresh - Forzar recarga desde API
         */
        async fetchQuotes(params = {}, forceRefresh = false) {
            this.isLoading = true;
            try {
                const queryParams = {
                    paginate: params.paginate !== false,
                    per_page: params.per_page || this.pagination.per_page,
                    page: params.page || 1,
                    ...this.filters,
                    ...params
                };

                const res = await fetchQuotes(queryParams);
                const processed = handleProcessSuccess(res, this);

                if (processed.success) {
                    if (queryParams.paginate === false) {
                        // Sin paginación - guardamos todos los datos
                        this.allQuotes = processed.data || [];
                        this.applyLocalFilters();
                    } else {
                        // Con paginación - guardamos datos paginados
                        this.quotes = processed.data?.data || [];
                        this.pagination = {
                            current_page: processed.data?.current_page || 1,
                            per_page: processed.data?.per_page || 20,
                            total: processed.data?.total || 0,
                            last_page: processed.data?.last_page || 1
                        };
                    }
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },

        /**
         * Aplica filtros localmente sin llamar a la API
         */
        applyLocalFilters() {
            let filteredQuotes = [...this.allQuotes];

            // Aplicar filtros
            if (this.filters.status) {
                filteredQuotes = filteredQuotes.filter((quote) => quote.status === this.filters.status);
            }

            if (this.filters.customer_id) {
                filteredQuotes = filteredQuotes.filter((quote) => 
                    quote.customer_id === this.filters.customer_id || 
                    quote.customer?.id === this.filters.customer_id
                );
            }

            if (this.filters.search) {
                const searchTerm = this.filters.search.toLowerCase();
                filteredQuotes = filteredQuotes.filter((quote) => 
                    quote.quote_number?.toLowerCase().includes(searchTerm) ||
                    quote.notes?.toLowerCase().includes(searchTerm) ||
                    quote.customer?.name?.toLowerCase().includes(searchTerm)
                );
            }

            if (this.filters.date_from) {
                filteredQuotes = filteredQuotes.filter((quote) => 
                    new Date(quote.quote_date) >= new Date(this.filters.date_from)
                );
            }

            if (this.filters.date_to) {
                filteredQuotes = filteredQuotes.filter((quote) => 
                    new Date(quote.quote_date) <= new Date(this.filters.date_to)
                );
            }

            this.quotes = filteredQuotes;
            this.currentSearchTerm = this.hasActiveFilters ? 'active' : null;
        },

        /**
         * Actualiza filtros y aplica filtrado local
         */
        updateFilters(newFilters) {
            this.filters = { ...this.filters, ...newFilters };
            this.applyLocalFilters();
        },

        /**
         * Obtiene una cotización específica
         * @param {Number} id - ID de la cotización
         */
        async getQuote(id) {
            this.isLoading = true;
            try {
                const res = await getQuote(id);
                const processed = handleProcessSuccess(res, this);
                
                if (processed.success) {
                    this.currentQuote = processed.data;
                }
                
                return processed;
            } catch (error) {
                handleProcessError(error, this);
                throw error;
            } finally {
                this.isLoading = false;
            }
        },

        /**
         * Crea una nueva cotización
         * @param {Object} payload - Datos de la cotización
         */
        async createQuote(payload) {
            this.isLoading = true;
            try {
                // Validar estructura de detalles
                if (payload.details && Array.isArray(payload.details)) {
                    const validation = this.validateQuoteDetails(payload.details, payload);
                    if (!validation.valid) {
                        throw new Error(validation.message);
                    }
                }

                const res = await createQuote(payload);
                const processed = handleProcessSuccess(res, this);
                
                if (processed.success) {
                    const quoteRecord = processed.data;
                    if (quoteRecord) {
                        // Agregar a allQuotes y aplicar filtros
                        this.allQuotes.unshift(quoteRecord);
                        this.applyLocalFilters();
                    }
                }
                
                return processed;
            } catch (error) {
                handleProcessError(error, this);
                throw error;
            } finally {
                this.isLoading = false;
            }
        },

        /**
         * Actualiza una cotización existente
         * @param {Object} payload - Datos de la cotización
         */
        async updateQuote(payload) {
            this.isLoading = true;
            try {
                const res = await updateQuote(payload, payload.id);
                const processed = handleProcessSuccess(res, this);
                
                if (processed.success) {
                    const updatedQuote = processed.data;
                    if (updatedQuote) {
                        // Actualizar en allQuotes
                        const allIndex = this.allQuotes.findIndex((quote) => quote.id === updatedQuote.id);
                        if (allIndex !== -1) {
                            this.allQuotes[allIndex] = updatedQuote;
                        }

                        // Actualizar currentQuote si es la misma
                        if (this.currentQuote?.id === updatedQuote.id) {
                            this.currentQuote = updatedQuote;
                        }

                        // Reaplicar filtros
                        this.applyLocalFilters();
                    }
                }
                
                return processed;
            } catch (error) {
                handleProcessError(error, this);
                throw error;
            } finally {
                this.isLoading = false;
            }
        },

        /**
         * Elimina una cotización
         * @param {Number} quoteId - ID de la cotización
         */
        async removeQuote(quoteId) {
            this.isLoading = true;
            try {
                const res = await deleteQuote(quoteId);
                const processed = handleProcessSuccess(res, this);
                
                if (processed.success) {
                    // Remover de allQuotes
                    this.allQuotes = this.allQuotes.filter((quote) => quote.id !== quoteId);
                    // Reaplicar filtros
                    this.applyLocalFilters();
                    
                    // Limpiar currentQuote si era la eliminada
                    if (this.currentQuote?.id === quoteId) {
                        this.currentQuote = null;
                    }
                }
                
                return processed;
            } catch (error) {
                // Manejar errores específicos de reglas de negocio
                if (error.response?.status === 400) {
                    this.message = error.response.data?.message || 'No se puede eliminar esta cotización';
                    this.success = false;
                    this.validationErrors = [];
                } else {
                    handleProcessError(error, this);
                }
                throw error;
            } finally {
                this.isLoading = false;
            }
        },

        /**
         * Aprueba una cotización con métodos de pago y tipo de comprobante
         * @param {Number} quoteId - ID de la cotización
         * @param {Object} approvalData - Datos de aprobación incluyendo métodos de pago
         */
        async approveQuote(quoteId, approvalData = {}) {
            this.isLoading = true;
            try {
                const res = await approveQuote(quoteId, approvalData);
                const processed = handleProcessSuccess(res, this);
                
                if (processed.success) {
                    const updatedQuote = processed.data;
                    if (updatedQuote) {
                        // Actualizar en allQuotes
                        const allIndex = this.allQuotes.findIndex((quote) => quote.id === updatedQuote.id);
                        if (allIndex !== -1) {
                            this.allQuotes[allIndex] = updatedQuote;
                        }

                        // Actualizar currentQuote si es la misma
                        if (this.currentQuote?.id === updatedQuote.id) {
                            this.currentQuote = updatedQuote;
                        }

                        // Reaplicar filtros
                        this.applyLocalFilters();
                    }
                }
                
                return processed;
            } catch (error) {
                handleProcessError(error, this);
                throw error;
            } finally {
                this.isLoading = false;
            }
        },

        /**
         * Rechaza una cotización
         * @param {Number} quoteId - ID de la cotización
         * @param {String} rejectionReason - Razón del rechazo (opcional)
         */
        async rejectQuote(quoteId, rejectionReason = '') {
            this.isLoading = true;
            try {
                const payload = rejectionReason ? { rejection_reason: rejectionReason } : {};
                const res = await rejectQuote(quoteId, payload);
                const processed = handleProcessSuccess(res, this);
                
                if (processed.success) {
                    const updatedQuote = processed.data;
                    if (updatedQuote) {
                        // Actualizar en allQuotes
                        const allIndex = this.allQuotes.findIndex((quote) => quote.id === updatedQuote.id);
                        if (allIndex !== -1) {
                            this.allQuotes[allIndex] = updatedQuote;
                        }

                        // Actualizar currentQuote si es la misma
                        if (this.currentQuote?.id === updatedQuote.id) {
                            this.currentQuote = updatedQuote;
                        }

                        // Reaplicar filtros
                        this.applyLocalFilters();
                    }
                }
                
                return processed;
            } catch (error) {
                handleProcessError(error, this);
                throw error;
            } finally {
                this.isLoading = false;
            }
        },

        /**
         * Descarga PDF de una cotización
         * @param {Number} quoteId - ID de la cotización
         */
        async downloadPdf(quoteId) {
            try {
                const response = await downloadQuotePdf(quoteId);
                
                // Crear blob y descargar
                const blob = new Blob([response.data], { type: 'application/pdf' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                
                // Obtener el número de cotización para el nombre del archivo
                const quote = this.allQuotes.find(q => q.id === quoteId) || this.currentQuote;
                const fileName = `cotizacion_${quote?.quote_number || quoteId}.pdf`;
                
                link.setAttribute('download', fileName);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
                
                return { success: true, message: 'PDF descargado exitosamente' };
            } catch (error) {
                handleProcessError(error, this);
                throw error;
            }
        },

        /**
         * Descarga Excel de una cotización
         * @param {Number} quoteId - ID de la cotización
         */
        async downloadExcel(quoteId) {
            try {
                const response = await downloadQuoteExcel(quoteId);
                
                // Crear blob y descargar
                const blob = new Blob([response.data], { 
                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
                });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                
                // Obtener el número de cotización para el nombre del archivo
                const quote = this.allQuotes.find(q => q.id === quoteId) || this.currentQuote;
                const fileName = `cotizacion_${quote?.quote_number || quoteId}.xlsx`;
                
                link.setAttribute('download', fileName);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
                
                return { success: true, message: 'Excel descargado exitosamente' };
            } catch (error) {
                handleProcessError(error, this);
                throw error;
            }
        },

        /**
         * Obtiene estadísticas de cotizaciones
         * @param {Object} params - Parámetros de filtro
         */
        async fetchStatistics(params = {}) {
            this.isLoadingStatistics = true;
            try {
                const res = await fetchQuoteStatistics(params);
                const processed = handleProcessSuccess(res, this);
                
                if (processed.success) {
                    this.statistics = processed.data;
                }
                
                return processed;
            } catch (error) {
                handleProcessError(error, this);
                throw error;
            } finally {
                this.isLoadingStatistics = false;
            }
        },

        /**
         * Limpia filtros y muestra todos los datos
         */
        clearFilters() {
            this.filters = {
                status: '',
                customer_id: null,
                date_from: '',
                date_to: '',
                search: ''
            };
            this.currentSearchTerm = null;
            this.applyLocalFilters();
        },

        /**
         * Limpia el término de búsqueda actual
         */
        clearSearch() {
            this.currentSearchTerm = null;
        },

        /**
         * Limpia la cotización actual
         */
        clearCurrentQuote() {
            this.currentQuote = null;
        },

        /**
         * Valida los detalles de una cotización
         * @param {Array} details - Detalles de la cotización
         * @param {Object} quote - Datos principales de la cotización
         * @returns {Object} Resultado de validación
         */
        validateQuoteDetails(details, quote) {
            if (!Array.isArray(details) || details.length === 0) {
                return { valid: false, message: 'Debe incluir al menos un producto en la cotización' };
            }

            if (details.length > 50) {
                return { valid: false, message: 'Máximo 50 productos por cotización' };
            }

            // Validar cada detalle
            for (let i = 0; i < details.length; i++) {
                const detail = details[i];

                if (!detail.stock_id) {
                    return { valid: false, message: `Producto ${i + 1}: ID de stock requerido` };
                }

                if (!detail.quantity || detail.quantity <= 0) {
                    return { valid: false, message: `Producto ${i + 1}: La cantidad debe ser mayor a cero` };
                }

                if (!detail.unit_price || detail.unit_price <= 0) {
                    return { valid: false, message: `Producto ${i + 1}: El precio unitario debe ser mayor a cero` };
                }

                if (!detail.total_amount || detail.total_amount <= 0) {
                    return { valid: false, message: `Producto ${i + 1}: El total debe ser mayor a cero` };
                }
            }

            // Validar consistencia de totales
            const detailsSubtotal = details.reduce((sum, d) => sum + parseFloat(d.subtotal_amount || 0), 0);
            const detailsTotal = details.reduce((sum, d) => sum + parseFloat(d.total_amount || 0), 0);
            
            const tolerance = 0.01; // Tolerancia de 1 centavo
            
            if (Math.abs(detailsSubtotal - parseFloat(quote.subtotal_amount || 0)) > tolerance) {
                return {
                    valid: false,
                    message: 'El subtotal de los detalles no coincide con el subtotal de la cotización'
                };
            }

            if (Math.abs(detailsTotal - parseFloat(quote.total_amount || 0)) > tolerance) {
                return {
                    valid: false,
                    message: 'El total de los detalles no coincide con el total de la cotización'
                };
            }

            return { valid: true, message: 'Detalles de cotización válidos' };
        },

        /**
         * Verifica si una cotización puede ser editada
         * @param {Object} quote - Cotización a verificar
         * @returns {Boolean} True si puede ser editada
         */
        canEditQuote(quote) {
            if (!quote) return false;
            
            // Solo se pueden editar cotizaciones PENDIENTE
            if (quote.status !== 'PENDIENTE') return false;
            
            // No se puede editar si está vencida
            const today = new Date();
            const validUntil = new Date(quote.valid_until);
            
            return validUntil >= today;
        },

        /**
         * Verifica si una cotización puede ser aprobada
         * @param {Object} quote - Cotización a verificar
         * @returns {Boolean} True si puede ser aprobada
         */
        canApproveQuote(quote) {
            if (!quote) return false;
            
            // Solo se pueden aprobar cotizaciones PENDIENTE
            if (quote.status !== 'PENDIENTE') return false;
            
            // No se puede aprobar si está vencida
            const today = new Date();
            const validUntil = new Date(quote.valid_until);
            
            return validUntil >= today;
        }
    }
});