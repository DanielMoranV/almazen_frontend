import axios from './axios';

// Auth
export const login = (payload) => axios.post('/auth/login', payload);
export const register = (payload) => axios.post('/auth/register', payload);
export const logout = () => axios.post('/auth/logout');
export const refresh = () => axios.post('/auth/refresh');
export const me = () => axios.post('/auth/me');

// Users
export const updateProfile = (payload, id) => axios.put(`/users/${id}`, payload);
export const fetchUsers = () => axios.get('/users');
export const createUser = (payload) => axios.post('/users', payload);
export const deleteUser = (id) => axios.delete(`/users/${id}`);
export const updateUser = (payload, id) => axios.put(`/users/${id}`, payload);

// Companies
export const fetchCompanies = () => axios.get('/companies');
export const createCompany = (payload) => axios.post('/companies', payload);
export const deleteCompany = (id) => axios.delete(`/companies/${id}`);
export const updateCompany = (payload, id) => axios.put(`/companies/${id}`, payload);
// Company Configuration
export const getCompanyConfig = () => axios.get('/company-config');
export const previewWorkflowChange = (targetWorkflow) => axios.post('/company-config/preview-workflow-change', { target_workflow: targetWorkflow });
export const updateCompanyConfig = (config) => axios.patch('/company-config', config);

// Legacy endpoint (keep for backward compatibility)
export const updateCompanyConfigLegacy = (companyId, config) => axios.put(`/companies/${companyId}/config`, config);

// Products
export const fetchProducts = (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return axios.get(`/products${queryString ? `?${queryString}` : ''}`);
};
export const createProduct = (payload) => axios.post('/products', payload);
export const deleteProduct = (id) => axios.delete(`/products/${id}`);
export const updateProduct = (payload, id) => axios.put(`/products/${id}`, payload);
export const searchProductsForSale = (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return axios.get(`/products/search-sale${queryString ? `?${queryString}` : ''}`);
};

// Product Image Upload
export const uploadProductImage = (productId, imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    return axios.post(`/products/${productId}/upload-image`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
};

// Products Mass Import
export const downloadProductImportTemplate = () => {
    return axios.get('/products/import-template', {
        responseType: 'blob'
    });
};

export const importProductsFromExcel = (file) => {
    const formData = new FormData();
    formData.append('file', file);

    return axios.post('/products/import-excel', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        },
        timeout: 300000 // 5 minutes timeout for large files
    });
};

// Units
export const fetchUnits = () => axios.get('/units');
export const createUnit = (payload) => axios.post('/units', payload);
export const deleteUnit = (id) => axios.delete(`/units/${id}`);
export const updateUnit = (payload, id) => axios.put(`/units/${id}`, payload);

// Categories
export const fetchCategories = () => axios.get('/categories');
export const createCategory = (payload) => axios.post('/categories', payload);
export const deleteCategory = (id) => axios.delete(`/categories/${id}`);
export const updateCategory = (payload, id) => axios.put(`/categories/${id}`, payload);

// Warehouses
export const fetchWarehouses = () => axios.get('/warehouses');
export const createWarehouse = (payload) => axios.post('/warehouses', payload);
export const deleteWarehouse = (id) => axios.delete(`/warehouses/${id}`);
export const updateWarehouse = (payload, id) => axios.put(`/warehouses/${id}`, payload);

// Providers
export const fetchProviders = () => axios.get('/providers');
export const createProvider = (payload) => axios.post('/providers', payload);
export const deleteProvider = (id) => axios.delete(`/providers/${id}`);
export const updateProvider = (payload, id) => axios.put(`/providers/${id}`, payload);

// Categories Company
export const fetchCategoriesCompany = () => axios.get('/categories-company');
export const createCategoryCompany = (payload) => axios.post('/categories-company', payload);
export const deleteCategoryCompany = (id) => axios.delete(`/categories-company/${id}`);
export const updateCategoryCompany = (payload, id) => axios.put(`/categories-company/${id}`, payload);

// Purchase Orders
export const fetchPurchaseOrders = (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return axios.get(`/purchases${queryString ? `?${queryString}` : ''}`);
};
export const searchPurchaseOrdersAdvanced = (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return axios.get(`/purchases/search/advanced${queryString ? `?${queryString}` : ''}`);
};
export const searchPurchaseOrdersByNumber = (orderNumber) => axios.get(`/purchases?order_number=${orderNumber}`);
export const createPurchaseOrder = (payload) => axios.post('/purchases', payload);
export const deletePurchaseOrder = (id) => axios.delete(`/purchases/${id}`);
export const updatePurchaseOrder = (payload, id) => axios.put(`/purchases/${id}`, payload);
export const approvePurchaseOrder = (id) => axios.patch(`/purchases/${id}/approve`);
export const rejectPurchaseOrder = (id) => axios.patch(`/purchases/${id}/reject`);
export const receivePurchaseOrder = (id, batchData = null) => {
    // Si hay datos de lotes, enviarlos directamente (ya vienen en formato { details: [...] })
    // Si no hay datos, enviar petición vacía (recepción simple)
    return axios.patch(`/purchases/${id}/receive`, batchData || {});
};
export const cancelPurchaseOrder = (id) => axios.patch(`/purchases/${id}/cancel`);

// Batches
export const fetchBatches = (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return axios.get(`/batches${queryString ? `?${queryString}` : ''}`);
};
export const createBatch = (payload) => axios.post('/batches', payload);
export const deleteBatch = (id) => axios.delete(`/batches/${id}`);
export const updateBatch = (payload, id) => axios.put(`/batches/${id}`, payload);
export const getBatchesByProduct = (productId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return axios.get(`/products/${productId}/batches${queryString ? `?${queryString}` : ''}`);
};

// Bonificaciones
export const addPurchaseBonuses = (purchaseId, bonusData) => {
    return axios.post(`/purchases/${purchaseId}/bonuses`, bonusData);
};

export const getPurchaseBonuses = (purchaseId) => {
    return axios.get(`/purchases/${purchaseId}/bonuses`);
};

export const updatePurchaseBonus = (purchaseId, bonusId, bonusData) => {
    return axios.patch(`/purchases/${purchaseId}/bonuses/${bonusId}`, bonusData);
};

// 1️⃣ Vista Consolidada de Inventarios - URL ACTUALIZADA
export const fetchProductStocks = (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return axios.get(`/products/stock${queryString ? `?${queryString}` : ''}`);
};

// 2️⃣ Gestión Individual de Stocks
export const fetchStocks = (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return axios.get(`/stocks${queryString ? `?${queryString}` : ''}`);
};

export const getStock = (stockId) => axios.get(`/stocks/${stockId}`);

export const updateStock = (stockId, payload) => axios.put(`/stocks/${stockId}`, payload);

export const deleteStock = (stockId) => axios.delete(`/stocks/${stockId}`);

// 3️⃣ Gestión Masiva por Producto
export const getBulkPreview = (productId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return axios.get(`/products/${productId}/stocks/bulk-preview${queryString ? `?${queryString}` : ''}`);
};

export const bulkUpdateStocks = (productId, payload) => axios.put(`/products/${productId}/stocks/bulk-update`, payload);

// Customers
export const fetchCustomers = (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return axios.get(`/customers${queryString ? `?${queryString}` : ''}`);
};
export const getCustomer = (id) => axios.get(`/customers/${id}`);
export const createCustomer = (payload) => axios.post('/customers', payload);
export const updateCustomer = (payload, id) => axios.put(`/customers/${id}`, payload);
export const deleteCustomer = (id) => axios.delete(`/customers/${id}`);
export const searchCustomers = (q) => axios.get(`/customers/search?q=${encodeURIComponent(q)}`);

// Sales
export const fetchSales = (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return axios.get(`/sales${queryString ? `?${queryString}` : ''}`);
};
export const searchSales = (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return axios.get(`/sales/search${queryString ? `?${queryString}` : ''}`);
};
export const getSale = (id) => axios.get(`/sales/${id}`);
export const createSale = (payload) => axios.post('/sales', payload);
export const updateSale = (payload, id) => axios.put(`/sales/${id}`, payload);
export const deleteSale = (id) => axios.delete(`/sales/${id}`);

// Stock Movements
export const fetchStockMovements = (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return axios.get(`/stock-movements${queryString ? `?${queryString}` : ''}`);
};

export const fetchStockEntries = (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return axios.get(`/stock-movements/entries/list${queryString ? `?${queryString}` : ''}`);
};

export const fetchStockExits = (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return axios.get(`/stock-movements/exits/list${queryString ? `?${queryString}` : ''}`);
};

// Stock Adjustments
export const fetchStockAdjustments = (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return axios.get(`/stock-adjustments${queryString ? `?${queryString}` : ''}`);
};

export const getStockAdjustment = (id) => axios.get(`/stock-adjustments/${id}`);

export const getStockAdjustmentsSummary = (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return axios.get(`/stock-adjustments/summary${queryString ? `?${queryString}` : ''}`);
};

export const createStockAdjustment = (payload) => axios.post('/stock-adjustments', payload);

export const createBulkStockAdjustments = (payload) => axios.post('/stock-adjustments/bulk', payload);

// Stock Adjustments Excel - Mass Import/Export
export const downloadStockAdjustmentTemplate = (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return axios.get(`/stock-adjustments/template${queryString ? `?${queryString}` : ''}`, {
        responseType: 'blob'
    });
};

export const importStockAdjustmentsFromExcel = (formData) => {
    return axios.post('/stock-adjustments/import-excel', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
};

// Reports
export const exportReport = (type) => axios.get('/reports/export', { params: { type }, responseType: 'blob' });

// Dashboard
export const fetchDashboardMetrics = () => axios.get('/dashboard/metrics');
export const fetchLowStockProducts = () => axios.get('/dashboard/low-stock');
export const fetchExpiringProducts = () => axios.get('/dashboard/expiring-products');

// Payment Methods
export const fetchPaymentMethods = (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return axios.get(`/payment-methods${queryString ? `?${queryString}` : ''}`);
};
export const getPaymentMethod = (id) => axios.get(`/payment-methods/${id}`);
export const createPaymentMethod = (payload) => axios.post('/payment-methods', payload);
export const updatePaymentMethod = (payload, id) => axios.put(`/payment-methods/${id}`, payload);
export const deletePaymentMethod = (id) => axios.delete(`/payment-methods/${id}`);

// Cash Registers
export const fetchCashRegisters = (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return axios.get(`/cash-registers${queryString ? `?${queryString}` : ''}`);
};
export const getCashRegister = (id) => axios.get(`/cash-registers/${id}`);
export const createCashRegister = (payload) => axios.post('/cash-registers', payload);
export const updateCashRegister = (payload, id) => axios.put(`/cash-registers/${id}`, payload);
export const deleteCashRegister = (id) => axios.delete(`/cash-registers/${id}`);

// Cash Sessions
export const openCashSession = (payload) => axios.post('/cash-sessions/open', payload);
export const getCurrentCashSession = () => axios.get('/cash-sessions/current');
export const closeCashSession = (id, payload) => axios.put(`/cash-sessions/${id}/close`, payload);
export const getCashSessionReport = (id) => axios.get(`/cash-sessions/${id}/report`);
export const getCashSessionHistory = (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return axios.get(`/cash-sessions/history${queryString ? `?${queryString}` : ''}`);
};

// Cash Movements
export const fetchCashMovements = (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return axios.get(`/cash-movements${queryString ? `?${queryString}` : ''}`);
};
export const getCashMovement = (id) => axios.get(`/cash-movements/${id}`);

// Stock Transfers
export const fetchStockTransfers = (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return axios.get(`/stock-transfers${queryString ? `?${queryString}` : ''}`);
};
export const createStockTransfer = (payload) => axios.post('/stock-transfers', payload);
export const restoreStockTransfer = (id) => axios.post(`/stock-transfers/${id}/restore`);

// Stock Export/Import - Initial Stock Management
export const exportProductsWithoutStock = () => {
    return axios.get('/stock-export-import/export-products-without-stock', {
        responseType: 'blob'
    });
};

export const downloadStockTemplate = () => {
    return axios.get('/stock-export-import/download-template', {
        responseType: 'blob'
    });
};

export const importInitialStock = (file) => {
    const formData = new FormData();
    formData.append('file', file);

    return axios.post('/stock-export-import/import-initial-stock', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
};

// Public Store API - Sin autenticación
export const fetchPublicProducts = (warehouseId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return axios.get(`/public/warehouses/${warehouseId}/products${queryString ? `?${queryString}` : ''}`);
};

export const fetchPublicProduct = (warehouseId, productId) => {
    return axios.get(`/public/warehouses/${warehouseId}/products/${productId}`);
};
