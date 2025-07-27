import { getBatchesByProduct, createBatch, deleteBatch, fetchBatches, updateBatch } from '@/api';
import { handleProcessError, handleProcessSuccess } from '@/utils/apiHelpers';
import cache from '@/utils/cache';
import { defineStore } from 'pinia';

export const useBatchesStore = defineStore('batchesStore', {
    state: () => ({
        batches: cache.getItem('batches') || [],
        batch: cache.getItem('batch') || null,
        message: '',
        success: false,
        isLoading: false,
        validationErrors: []
    }),
    getters: {
        batchesList: (state) => state.batches,
        isLoadingBatches: (state) => state.isLoading
    },
    actions: {
        async fetchBatches(params = {}) {
            this.resetState();
            try {
                const res = await fetchBatches(params);
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    this.batches = processed.data;
                    cache.setItem('batches', this.batches);
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },

        async createBatch(payload) {
            this.resetState();
            try {
                const res = await createBatch(payload);
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    this.batch = processed.data; // Guardar el lote creado para acceso inmediato
                    this.batches.push(processed.data);
                    cache.setItem('batches', this.batches);
                    cache.setItem('batch', this.batch);
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },

        async removeBatch(id) {
            this.resetState();
            try {
                const res = await deleteBatch(id);
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    this.batches = this.batches.filter((batch) => batch.id !== id);
                    cache.setItem('batches', this.batches);
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },

        async updateBatch(payload, id) {
            this.resetState();
            try {
                const res = await updateBatch(payload, id);
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    const index = this.batches.findIndex((batch) => batch.id === id);
                    if (index !== -1) {
                        this.batches[index] = processed.data;
                        cache.setItem('batches', this.batches);
                    }
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },

        async getAvailableBatchesForProduct(productId) {
            try {
                // Usar el nuevo endpoint con parámetros correctos
                const res = await getBatchesByProduct(productId, {
                    include_expired: 'false' // Excluir lotes vencidos
                });

                if (res && res.data && res.data.batches) {
                    return {
                        success: true,
                        data: {
                            batches: res.data.batches
                        }
                    };
                }

                return {
                    success: true,
                    data: {
                        batches: []
                    }
                };
            } catch (error) {
                console.error('Error al obtener lotes disponibles:', error);
                throw error;
            }
        },

        // Función adicional para buscar lotes con parámetros específicos
        async searchBatchesByProduct(productId, searchTerm = '') {
            try {
                const params = {
                    include_expired: 'false'
                };

                if (searchTerm) {
                    params.search = searchTerm;
                }

                const res = await getBatchesByProduct(productId, params);

                if (res && res.data && res.data.batches) {
                    return {
                        success: true,
                        data: {
                            product: res.data.product,
                            batches: res.data.batches
                        }
                    };
                }

                return {
                    success: true,
                    data: {
                        product: null,
                        batches: []
                    }
                };
            } catch (error) {
                console.error('Error al buscar lotes por producto:', error);
                throw error;
            }
        },

        formatBatchForDropdown(batch) {
            const expirationText = batch.expiration_date ? new Date(batch.expiration_date).toLocaleDateString('es-PE') : 'Sin vencimiento';

            const daysToExpire = batch.days_to_expire !== null && batch.days_to_expire !== undefined ? `${Math.floor(batch.days_to_expire)} días` : '';

            return {
                id: batch.id,
                code: batch.code, // El endpoint devuelve 'code', no 'lot_number'
                label: `${batch.code} - Vence: ${expirationText}${daysToExpire ? ` (${daysToExpire})` : ''}`,
                expirationDate: batch.expiration_date,
                isExpired: batch.is_expired || false,
                daysToExpire: batch.days_to_expire !== null && batch.days_to_expire !== undefined ? Math.floor(batch.days_to_expire) : null,
                totalStock: batch.total_stock || 0,
                stockSummary: batch.stock_summary || [],
                ...batch
            };
        },

        resetState() {
            this.isLoading = true;
            this.message = '';
            this.success = false;
            this.validationErrors = [];
        }
    }
});
