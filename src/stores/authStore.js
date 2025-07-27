import { fetchCategoriesCompany, login, logout, me, refresh, register, updateUser } from '@/api';
import { handleProcessError, handleProcessSuccess } from '@/utils/apiHelpers';
import cache from '@/utils/cache';
import { defineStore } from 'pinia';

export const useAuthStore = defineStore('authStore', {
    state: () => ({
        user: cache.getItem('currentUser'),
        companyConfig: cache.getItem('companyConfig'),
        token: cache.getItem('token'),
        refreshToken: cache.getItem('refreshToken'),
        expiresAt: cache.getItem('expiresAt'),
        message: '',
        success: !!cache.getItem('currentUser') && !!cache.getItem('token'),
        isLoading: false,
        refreshTimer: null,
        categories: [],
        validationErrors: []
    }),

    getters: {
        isAuthenticated: (state) => !!state.user && !!state.success,
        isActive: (state) => state.user?.is_active,
        currentUser: (state) => state.user,
        getCompanyConfig: (state) => state.companyConfig,
        loading: (state) => state.isLoading,
        getToken: (state) => state.token,
        getCategories: (state) => state.categories
    },

    actions: {
        async fetchCategoriesCompany() {
            this.resetState();
            try {
                const res = await fetchCategoriesCompany();
                const processed = handleProcessSuccess(res, this);
                this.categories = processed.data;
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },

        async login(payload) {
            this.resetState();
            try {
                const res = await login(payload);
                const processed = handleProcessSuccess(res, this);

                console.log('Processed login response:', processed);

                if (processed.success) {
                    this.setUser(processed.data.user);
                    this.setToken(processed.data.access_token);
                    this.setRefreshToken(processed.data.refresh_token);
                    this.setExpiration(processed.data.expires_in);
                    this.startRefreshInterval();
                    this.setCompanyConfig(processed.data.user.company_config);
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },

        async logout() {
            this.resetState();
            try {
                const res = await logout();
                const processed = handleProcessSuccess(res, this);
            } catch {
                console.warn('Fallo logout en backend, limpiando local...');
            } finally {
                this.isLoading = false;
                this.clearAuthData();
            }
        },

        async me() {
            this.resetState();
            try {
                const res = await me();
                const processed = handleProcessSuccess(res, this);

                if (processed.success) {
                    this.setUser(processed.data);
                    this.setCompanyConfig(processed.data.company_config);
                } else {
                    this.clearAuthData();
                }
            } catch (error) {
                console.log('me', error);
                handleProcessError(error, this);
                this.clearAuthData();
            } finally {
                this.isLoading = false;
            }
        },

        async refreshToken() {
            try {
                const { data } = await refresh({ refresh_token: this.refreshToken });
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
            this.resetState();
            try {
                const res = await register(payload);
                const processed = handleProcessSuccess(res, this);

                if (processed.success) {
                    this.setUser(processed.data.user);
                    this.setToken(processed.data.access_token);
                    this.setRefreshToken(processed.data.refresh_token);
                    this.setExpiration(processed.data.expires_in);
                    this.startRefreshInterval();
                    this.setCompanyConfig(processed.data.user.company_config);
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },

        async updateUser(user) {
            this.resetState();
            try {
                const res = await updateUser(user, user.id);
                const processed = handleProcessSuccess(res, this);

                if (processed.success) {
                    this.setUser(processed.data);
                }
            } catch (error) {
                handleProcessError(error, this);
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

                console.log('Token refresh check. Time left: ', timeLeft);

                if (timeLeft < 90_000) {
                    console.log('Intentando refrescar token como el tiempo restante es menor a 90 segundos.');
                    await this.refreshToken();
                }
            }, 60_000); // Verifica cada 60s
        },

        setUser(user) {
            if (this.user !== user) {
                this.user = user;
                cache.setItem('currentUser', user);
            }
        },

        setToken(token) {
            if (this.token !== token) {
                this.token = token;
                cache.setItem('token', token);
            }
        },

        setRefreshToken(refreshToken) {
            if (this.refreshToken !== refreshToken) {
                this.refreshToken = refreshToken;
                cache.setItem('refreshToken', refreshToken);
            }
        },

        setExpiration(expiresInSeconds) {
            const expirationTime = Date.now() + expiresInSeconds * 1000;
            if (this.expiresAt !== expirationTime) {
                this.expiresAt = expirationTime;
                cache.setItem('expiresAt', expirationTime);
            }
        },
        setCompanyConfig(companyConfig) {
            if (this.companyConfig !== companyConfig) {
                this.companyConfig = companyConfig;
                cache.setItem('companyConfig', companyConfig);
            }
        },

        clearAuthData() {
            this.user = null;
            this.token = null;
            this.refreshToken = null;
            this.expiresAt = null;
            this.success = false;
            this.message = '';
            this.validationErrors = [];

            cache.removeItem('currentUser');
            cache.removeItem('token');
            cache.removeItem('refreshToken');
            cache.removeItem('expiresAt');

            if (this.refreshTimer) {
                clearInterval(this.refreshTimer);
                this.refreshTimer = null;
            }
        },

        init() {
            this.user = cache.getItem('currentUser');
            this.token = cache.getItem('token');
            this.refreshToken = cache.getItem('refreshToken');
            this.expiresAt = cache.getItem('expiresAt');
            this.success = !!this.user && !!this.token;

            if (this.token && this.expiresAt) {
                this.startRefreshInterval();
            }
        },

        resetState() {
            this.isLoading = true;
            this.message = '';
            this.success = false;
            this.validationErrors = [];
        }
    }
});
