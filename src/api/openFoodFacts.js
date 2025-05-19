// src/api/openFoodFacts.js
import axios from 'axios';

/**
 * Busca un producto por su código de barras en OpenFoodFacts.
 * @param {string} barcode - Código EAN/GTIN.
 * @returns {Promise<object|null>} - Datos del producto o null si no se encuentra.
 */
export const fetchProductByBarcode = async (barcode) => {
    try {
        const response = await axios.get(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
        if (response.data.status === 1) {
            const product = response.data.product;

            return {
                name: product.product_name || '',
                brand: product.brands || '',
                description: product.ingredients_text || '',
                quantity: product.quantity || '',
                image_url: product.image_url || ''
            };
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error al consultar OpenFoodFacts:', error);
        return null;
    }
};
