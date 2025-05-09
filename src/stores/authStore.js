import { login, logout, me, refresh, register } from '@/api';
import cache from '@/utils/cache';
import { defineStore } from 'pinia';

export const useAuthStore = defineStore('authStore', {
    state: () => ({
        user: cache.getItem('currentUser'),
        token: cache.getItem('token'),
        expiresAt: cache.getItem('expiresAt'),
        message: '',
        success: !!cache.getItem('currentUser') && !!cache.getItem('token'),
        isLoading: false,
        refreshTimer: null
    }),

    getters: {
        isAuthenticated: (state) => !!state.user && !!state.success,
        isActive: (state) => state.user?.is_active,
        currentUser: (state) => state.user
    },

    actions: {
        async login(payload) {
            this.isLoading = true;
            try {
                const { data, message } = await login(payload);
                this.setUser(data.user);
                this.setToken(data.access_token);
                this.setExpiration(data.expires_in);

                this.message = message;
                this.success = true;

                this.startRefreshInterval();
            } catch (error) {
                this.message = error.message || 'Error de autenticación';
                this.success = false;
            } finally {
                this.isLoading = false;
            }
        },

        async logout() {
            try {
                await logout();
            } catch (error) {
                console.warn('Fallo logout en backend, limpiando local...');
            } finally {
                this.clearAuthData();
            }
        },

        async me() {
            this.isLoading = true;
            try {
                const { data, message } = await me();
                this.setUser(data.user);
                this.message = message;
                this.success = true;
            } catch (error) {
                this.message = error.message || 'No se pudo obtener el usuario';
                this.success = false;
                this.clearAuthData();
            } finally {
                this.isLoading = false;
            }
        },

        async refreshToken() {
            try {
                const { data } = await refresh();
                this.setToken(data.access_token);
                this.setExpiration(data.expires_in);
                this.success = true;
                console.log('[Auth] Token actualizado automáticamente');
            } catch (error) {
                console.warn('[Auth] Error al refrescar token:', error);
                this.clearAuthData();
            }
        },

        async register(payload) {
            this.isLoading = true;
            try {
                const { data, message } = await register(payload);
                this.setUser(data.user);
                this.setToken(data.access_token);
                this.setExpiration(data.expires_in);

                this.message = message;
                this.success = true;

                this.startRefreshInterval();
            } catch (error) {
                this.message = error.message || 'Error de registro';
                this.success = false;
            } finally {
                this.isLoading = false;
            }
        },

        startRefreshInterval() {
            if (this.refreshTimer) clearInterval(this.refreshTimer);

            this.refreshTimer = setInterval(async () => {
                if (!this.token || !this.expiresAt) return;

                const now = Date.now();
                const timeLeft = this.expiresAt - now;

                if (timeLeft < 60_000) {
                    await this.refreshToken();
                }
            }, 40_000); // Verifica cada 30s
        },

        setUser(user) {
            this.user = user;
            cache.setItem('currentUser', user);
        },

        setToken(token) {
            this.token = token;
            cache.setItem('token', token);
        },

        setExpiration(expiresInSeconds) {
            const expirationTime = Date.now() + expiresInSeconds * 1000;
            this.expiresAt = expirationTime;
            cache.setItem('expiresAt', expirationTime);
        },

        clearAuthData() {
            this.user = null;
            this.token = null;
            this.expiresAt = null;
            this.success = false;
            this.message = '';

            cache.removeItem('currentUser');
            cache.removeItem('token');
            cache.removeItem('expiresAt');

            if (this.refreshTimer) {
                clearInterval(this.refreshTimer);
                this.refreshTimer = null;
            }
        },

        init() {
            this.user = cache.getItem('currentUser');
            this.token = cache.getItem('token');
            this.expiresAt = cache.getItem('expiresAt');
            this.success = !!this.user && !!this.token;

            if (this.token && this.expiresAt) {
                this.startRefreshInterval();
            }
        }
    }
});
