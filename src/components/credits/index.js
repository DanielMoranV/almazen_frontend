// Componentes reutilizables para el sistema de gestión de créditos

// Componente de badge de estado de crédito
export { default as CreditStatusBadge } from './CreditStatusBadge.vue';

// Componente de indicador de límite de crédito
export { default as CreditLimitIndicator } from './CreditLimitIndicator.vue';

// Componente de tarjeta resumen de crédito del cliente
export { default as CreditSummaryCard } from './CreditSummaryCard.vue';

// Componente de widget de métricas para dashboard
export { default as CreditMetricsWidget } from './CreditMetricsWidget.vue';

// Componente de alerta para créditos vencidos
export { default as OverdueCreditAlert } from './OverdueCreditAlert.vue';

// Composables y utilidades para créditos
export const creditUtils = {
    /**
     * Formatea moneda en formato peruano
     * @param {number} amount - Monto a formatear
     * @returns {string} - Monto formateado
     */
    formatCurrency: (amount) => {
        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: 'PEN'
        }).format(amount || 0);
    },

    /**
     * Calcula crédito disponible
     * @param {number} creditLimit - Límite de crédito
     * @param {number} totalDebt - Deuda total
     * @returns {number} - Crédito disponible
     */
    calculateAvailableCredit: (creditLimit, totalDebt) => {
        return Math.max((creditLimit || 0) - (totalDebt || 0), 0);
    },

    /**
     * Calcula días de mora
     * @param {string|Date} dueDate - Fecha de vencimiento
     * @returns {number} - Días de mora (0 si no está vencido)
     */
    calculateOverdueDays: (dueDate) => {
        if (!dueDate) return 0;
        const due = new Date(dueDate);
        const today = new Date();
        const diffTime = today - due;
        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.max(days, 0);
    },

    /**
     * Obtiene severidad del badge según el estado de crédito
     * @param {string} status - Estado del crédito
     * @returns {string} - Severidad para PrimeVue
     */
    getStatusSeverity: (status) => {
        const severityMap = {
            PENDIENTE: 'info',
            PAGADO: 'success',
            VENCIDO: 'danger',
            ANULADO: 'secondary'
        };
        return severityMap[status] || 'info';
    },

    /**
     * Valida si un cliente puede usar crédito
     * @param {Object} customer - Datos del cliente
     * @returns {Object} - Resultado de validación
     */
    validateCustomerCredit: (customer) => {
        if (!customer) {
            return { valid: false, message: 'Cliente no encontrado' };
        }

        if (!customer.credit_enabled) {
            return { valid: false, message: 'Cliente no tiene crédito habilitado' };
        }

        if (customer.has_overdue_credits) {
            return { valid: false, message: 'Cliente tiene deudas vencidas' };
        }

        const availableCredit = creditUtils.calculateAvailableCredit(customer.credit_limit, customer.total_debt);

        if (availableCredit <= 0) {
            return { valid: false, message: 'Cliente ha agotado su límite de crédito' };
        }

        return {
            valid: true,
            availableCredit,
            message: `Crédito disponible: ${creditUtils.formatCurrency(availableCredit)}`
        };
    },

    /**
     * Calcula porcentaje de uso del límite de crédito
     * @param {number} creditLimit - Límite de crédito
     * @param {number} totalDebt - Deuda total
     * @returns {number} - Porcentaje usado (0-100)
     */
    calculateUsagePercentage: (creditLimit, totalDebt) => {
        if (creditLimit === 0) return 0;
        return Math.min((totalDebt / creditLimit) * 100, 100);
    },

    /**
     * Formatea fecha en formato peruano
     * @param {string|Date} date - Fecha a formatear
     * @returns {string} - Fecha formateada
     */
    formatDate: (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('es-PE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    },

    /**
     * Formatea fecha y hora en formato peruano
     * @param {string|Date} date - Fecha a formatear
     * @returns {string} - Fecha y hora formateadas
     */
    formatDateTime: (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('es-PE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
};

// Constantes para el sistema de créditos
export const creditConstants = {
    // Estados de crédito
    CREDIT_STATUS: {
        PENDING: 'PENDIENTE',
        PAID: 'PAGADO',
        OVERDUE: 'VENCIDO',
        CANCELLED: 'ANULADO'
    },

    // Configuraciones por defecto
    DEFAULT_CREDIT_DAYS: 30,
    DEFAULT_CREDIT_LIMIT: 0,

    // Límites del sistema
    MAX_CREDIT_LIMIT: 999999.99,
    MAX_CREDIT_DAYS: 365,

    // Colores para componentes
    STATUS_COLORS: {
        PENDIENTE: 'blue',
        PAGADO: 'green',
        VENCIDO: 'red',
        ANULADO: 'gray'
    }
};
