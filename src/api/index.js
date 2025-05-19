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
