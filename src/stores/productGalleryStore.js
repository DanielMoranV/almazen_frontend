import {
    deleteProductGalleryImage,
    getProductGallery,
    reorderProductGalleryImages,
    setProductGalleryPrimary,
    updateProductGalleryImage,
    uploadProductGalleryImages
} from '@/api/productGallery';
import { defineStore } from 'pinia';

export const useProductGalleryStore = defineStore('productGallery', {
    state: () => ({
        gallery: [],
        loading: false,
        error: null
    }),

    getters: {
        /**
         * Get the primary image from gallery
         */
        primaryImage: (state) => state.gallery.find((img) => img.is_primary),

        /**
         * Get gallery images sorted by order
         */
        sortedGallery: (state) => [...state.gallery].sort((a, b) => a.order - b.order)
    },

    actions: {
        /**
         * Fetch gallery images for a product
         */
        async fetchGallery(productId) {
            this.loading = true;
            this.error = null;
            try {
                const response = await getProductGallery(productId);
                this.gallery = response.data || [];
            } catch (error) {
                this.error = error.message || 'Error al cargar la galería';
                console.error('[productGalleryStore] Error fetching gallery:', error);
                throw error;
            } finally {
                this.loading = false;
            }
        },

        /**
         * Upload multiple images to gallery
         */
        async uploadImages(productId, files, altTexts = [], descriptions = []) {
            this.loading = true;
            this.error = null;
            try {
                const response = await uploadProductGalleryImages(productId, files, altTexts, descriptions);
                // Add new images to gallery
                if (response.data) {
                    this.gallery.push(...response.data);
                }
                return response;
            } catch (error) {
                this.error = error.message || 'Error al subir imágenes';
                console.error('[productGalleryStore] Error uploading images:', error);
                throw error;
            } finally {
                this.loading = false;
            }
        },

        /**
         * Update image metadata
         */
        async updateImage(productId, imageId, data) {
            this.loading = true;
            this.error = null;
            try {
                const response = await updateProductGalleryImage(productId, imageId, data);
                // Update local state
                const index = this.gallery.findIndex((img) => img.id === imageId);
                if (index !== -1 && response.data) {
                    this.gallery[index] = response.data;
                }
                return response;
            } catch (error) {
                this.error = error.message || 'Error al actualizar imagen';
                console.error('[productGalleryStore] Error updating image:', error);
                throw error;
            } finally {
                this.loading = false;
            }
        },

        /**
         * Set image as primary
         */
        async setPrimary(productId, imageId) {
            this.loading = true;
            this.error = null;
            try {
                await setProductGalleryPrimary(productId, imageId);
                // Update local state - set all to false, then set selected to true
                this.gallery.forEach((img) => {
                    img.is_primary = img.id === imageId;
                });
            } catch (error) {
                this.error = error.message || 'Error al establecer imagen principal';
                console.error('[productGalleryStore] Error setting primary:', error);
                throw error;
            } finally {
                this.loading = false;
            }
        },

        /**
         * Reorder gallery images
         */
        async reorderImages(productId, newOrder) {
            this.loading = true;
            this.error = null;
            try {
                await reorderProductGalleryImages(productId, newOrder);
                // Update local state
                newOrder.forEach(({ id, order }) => {
                    const image = this.gallery.find((img) => img.id === id);
                    if (image) {
                        image.order = order;
                    }
                });
            } catch (error) {
                this.error = error.message || 'Error al reordenar imágenes';
                console.error('[productGalleryStore] Error reordering images:', error);
                throw error;
            } finally {
                this.loading = false;
            }
        },

        /**
         * Delete gallery image
         */
        async deleteImage(productId, imageId) {
            this.loading = true;
            this.error = null;
            try {
                await deleteProductGalleryImage(productId, imageId);
                // Remove from local state
                this.gallery = this.gallery.filter((img) => img.id !== imageId);
            } catch (error) {
                this.error = error.message || 'Error al eliminar imagen';
                console.error('[productGalleryStore] Error deleting image:', error);
                throw error;
            } finally {
                this.loading = false;
            }
        },

        /**
         * Clear gallery state
         */
        clearGallery() {
            this.gallery = [];
            this.error = null;
        }
    }
});
