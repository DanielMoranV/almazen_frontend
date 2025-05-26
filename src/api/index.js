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

// Products
export const fetchProducts = () => axios.get('/products');
export const createProduct = (payload) => axios.post('/products', payload);
export const deleteProduct = (id) => axios.delete(`/products/${id}`);
export const updateProduct = (payload, id) => axios.put(`/products/${id}`, payload);

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
