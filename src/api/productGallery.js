import axios from './axios';

/**
 * Product Gallery API Service
 * Manages multiple images per product
 */

/**
 * Get gallery images for a product
 * @param {number} productId - Product ID
 * @returns {Promise} Gallery images array
 */
export const getProductGallery = (productId) => {
    return axios.get(`/products/${productId}/gallery`);
};

/**
 * Upload multiple images to product gallery
 * @param {number} productId - Product ID
 * @param {File[]} files - Array of image files
 * @param {string[]} altTexts - Array of alt texts (optional)
 * @param {string[]} descriptions - Array of descriptions (optional)
 * @returns {Promise} Uploaded images data
 */
export const uploadProductGalleryImages = (productId, files, altTexts = [], descriptions = []) => {
    const formData = new FormData();
    
    files.forEach((file, index) => {
        formData.append('images[]', file);
        if (altTexts[index]) {
            formData.append(`alt_texts[${index}]`, altTexts[index]);
        }
        if (descriptions[index]) {
            formData.append(`descriptions[${index}]`, descriptions[index]);
        }
    });

    return axios.post(`/products/${productId}/gallery`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
};

/**
 * Update image metadata
 * @param {number} productId - Product ID
 * @param {number} imageId - Image ID
 * @param {Object} data - Update data (alt_text, description, order)
 * @returns {Promise} Updated image data
 */
export const updateProductGalleryImage = (productId, imageId, data) => {
    return axios.put(`/products/${productId}/gallery/${imageId}`, data);
};

/**
 * Set image as primary
 * @param {number} productId - Product ID
 * @param {number} imageId - Image ID
 * @returns {Promise} Updated image data
 */
export const setProductGalleryPrimary = (productId, imageId) => {
    return axios.post(`/products/${productId}/gallery/${imageId}/set-primary`);
};

/**
 * Reorder gallery images
 * @param {number} productId - Product ID
 * @param {Array} images - Array of {id, order} objects
 * @returns {Promise} Success response
 */
export const reorderProductGalleryImages = (productId, images) => {
    return axios.post(`/products/${productId}/gallery/reorder`, { images });
};

/**
 * Delete gallery image
 * @param {number} productId - Product ID
 * @param {number} imageId - Image ID
 * @returns {Promise} Success response
 */
export const deleteProductGalleryImage = (productId, imageId) => {
    return axios.delete(`/products/${productId}/gallery/${imageId}`);
};
