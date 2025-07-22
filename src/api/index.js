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

// Dashboard
export const fetchDashboardMetrics = () => axios.get('/dashboard/metrics');
export const fetchLowStockProducts = () => axios.get('/dashboard/low-stock');
export const fetchExpiringProducts = () => axios.get('/dashboard/expiring-products');
