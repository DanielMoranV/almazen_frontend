import axios from 'axios';
import { useUnitsStore } from '@/stores/unitsStore';
import { useCategoriesStore } from '@/stores/categoriesStore';

/**
 * Genera información básica del producto
 * @param {Object} productData - Datos del producto de OpenFoodFacts
 * @returns {Promise<Object>} - Objeto con datos básicos generados
 */
const generateBasicProductInfo = async (productData) => {
    const unitsStore = useUnitsStore();
    const categoriesStore = useCategoriesStore();

    await Promise.all([unitsStore.fetchUnits(), categoriesStore.fetchCategories()]);

    const units = unitsStore.unitsList;
    const categories = categoriesStore.categoriesList;

    // SKU simple basado en nombre
    const skuBase = (productData.product_name || '').substring(0, 3).toUpperCase();
    const skuNumber = Math.floor(1000 + Math.random() * 9000);
    const sku = `${skuBase || 'PRD'}${skuNumber}`;

    // Descripción corta
    const description = productData.product_name ? `${productData.product_name}${productData.quantity ? ` - ${productData.quantity}` : ''}` : 'Producto alimenticio';

    // Seleccionamos el primer unit y categoría disponible (ajusta según tu lógica)
    const unit_id = units.length > 0 ? units[0].id : 1;
    const categoriesIds = categories.length > 0 ? [categories[0].id] : [1];

    return {
        sku,
        description,
        unit_id,
        categories: categoriesIds
    };
};

/**
 * Busca un producto por su código de barras en OpenFoodFacts y enriquece con datos básicos
 * @param {string} barcode - Código EAN/GTIN.
 * @returns {Promise<object|null>}
 */
export const fetchProductByBarcode = async (barcode) => {
    try {
        const response = await axios.get(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
        console.log(response.data);
        if (response.data.status === 1) {
            const product = response.data.product;

            // Generamos datos básicos sin IA
            const enrichedData = await generateBasicProductInfo(product);

            return {
                name: product.product_name || '',
                brand: product.brands || '',
                company_name: product.brands || '',
                barcode: barcode,
                sku: enrichedData.sku,
                description: enrichedData.description,
                image_url: product.image_url || product.image_front_url || product.image_small_url || '',
                presentation: product.quantity || '',
                unit_id: enrichedData.unit_id,
                categories: enrichedData.categories,
                suggested_categories: [] // no se generan sugerencias sin IA
            };
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error al consultar OpenFoodFacts:', error);
        return null;
    }
};

// Placeholder si en el futuro quieres implementar guardado de nuevas categorías
export const saveSuggestedCategories = async (suggestedCategories) => {
    console.log('No hay IA activa, no se procesan sugerencias:', suggestedCategories);
    return [];
};
