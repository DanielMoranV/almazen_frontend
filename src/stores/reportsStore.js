import { defineStore } from 'pinia';
import { exportReport } from '@/api';
import { handleProcessError } from '@/utils/apiHelpers';

export const useReportsStore = defineStore('reportsStore', {
    state: () => ({
        isLoading: false,
        error: null
    }),
    actions: {
        async download(type) {
            this.isLoading = true;
            this.error = null;
            try {
                const { data } = await exportReport(type);
                return data; // Blob
            } catch (e) {
                this.error = e;
                handleProcessError(e, this);
                throw e;
            } finally {
                this.isLoading = false;
            }
        }
    }
});
