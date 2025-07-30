import axios from './axios';

export const fetchStockTransfers = (params = {}) => {
    return axios.get('/api/stock-transfers', { params });
};

export const createStockTransfer = (payload) => {
    return axios.post('/api/stock-transfers', payload);
};

export const restoreStockTransfer = (id) => {
    return axios.post(`/api/stock-transfers/${id}/restore`);
};
