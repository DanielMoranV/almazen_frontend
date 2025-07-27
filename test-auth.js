#!/usr/bin/env node

/**
 * Script de prueba para verificar autenticación y auto-refresh
 * Ejecutar con: node test-auth.js
 */

import axios from 'axios';

const API_URL = process.env.VITE_API_URL || 'http://localhost:8000/api';

// Configurar axios igual que en la app
const api = axios.create({
    baseURL: API_URL,
    timeout: 90000000,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
    }
});

// Simular el interceptor de la app
let currentToken = null;

api.interceptors.request.use((config) => {
    if (currentToken) {
        config.headers.Authorization = `Bearer ${currentToken}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response.data,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/')) {
            originalRequest._retry = true;

            try {
                console.log('🔄 Intentando refresh automático...');
                const refreshResponse = await api.post('/auth/refresh');
                currentToken = refreshResponse.data.access_token;

                originalRequest.headers['Authorization'] = `Bearer ${currentToken}`;
                console.log('✅ Token refreshed automáticamente');
                return api(originalRequest);
            } catch (refreshError) {
                console.log('❌ Refresh automático falló');
                currentToken = null;
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

async function testAuth() {
    console.log('🧪 Iniciando pruebas de autenticación...\n');

    try {
        // Test 1: Login
        console.log('1️⃣ Probando login...');
        const loginData = {
            dni: '12345678', // Cambiar por credenciales válidas
            password: 'password123'
        };

        const loginResponse = await api.post('/auth/login', loginData);
        currentToken = loginResponse.data.access_token;
        console.log('✅ Login exitoso');
        console.log(`   Token: ${currentToken.substring(0, 50)}...`);
        console.log(`   Expira en: ${loginResponse.data.expires_in} segundos\n`);

        // Test 2: Me endpoint
        console.log('2️⃣ Probando endpoint /me...');
        const meResponse = await api.post('/auth/me');
        console.log('✅ Endpoint /me exitoso');
        console.log(`   Usuario: ${meResponse.data.name} (${meResponse.data.email})\n`);

        // Test 3: Refresh manual
        console.log('3️⃣ Probando refresh manual...');
        const refreshResponse = await api.post('/auth/refresh');
        const oldToken = currentToken;
        currentToken = refreshResponse.data.access_token;
        console.log('✅ Refresh manual exitoso');
        console.log(`   Token anterior: ${oldToken.substring(0, 30)}...`);
        console.log(`   Token nuevo: ${currentToken.substring(0, 30)}...\n`);

        // Test 4: Endpoint protegido después de refresh
        console.log('4️⃣ Probando endpoint protegido con token nuevo...');
        const meResponse2 = await api.post('/auth/me');
        console.log('✅ Endpoint protegido funciona con token refreshed\n');

        // Test 5: Logout
        console.log('5️⃣ Probando logout...');
        await api.post('/auth/logout');
        currentToken = null;
        console.log('✅ Logout exitoso\n');

        console.log('🎉 Todas las pruebas pasaron exitosamente!');
    } catch (error) {
        console.error('❌ Error en las pruebas:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', error.response.data);
        }
    }
}

// Ejecutar pruebas
testAuth().catch(console.error);
