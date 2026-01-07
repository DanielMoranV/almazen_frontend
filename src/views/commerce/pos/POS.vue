<script setup>
import { createCustomer, searchCustomers } from '@/api';
import { useAuthStore } from '@/stores/authStore';
import { useCashSessionsStore } from '@/stores/cashSessionsStore';
import { useCreditsStore } from '@/stores/creditsStore';
import { usePaymentMethodsStore } from '@/stores/paymentMethodsStore';
import { useProductsStore } from '@/stores/productsStore';
import { useSalesStore } from '@/stores/salesStore';
import { useWarehousesStore } from '@/stores/warehousesStore';
import cache from '@/utils/cache.js';
import { storeToRefs } from 'pinia';

import { useDiscount } from '@/composables/useDiscount';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import BatchSelectDialog from './componentsPos/BatchSelectDialog.vue';
import CustomerDialogs from './componentsPos/CustomerDialogs.vue';
import PaymentDialog from './componentsPos/PaymentDialog.vue';
import PosHeader from './componentsPos/PosHeader.vue';
import ProductGrid from './componentsPos/ProductGrid.vue';
import ProductSearch from './componentsPos/ProductSearch.vue';
import ShoppingCart from './componentsPos/ShoppingCart.vue';

// Constants for cache
const CACHE_KEYS = {
    FAVORITE_WAREHOUSE: 'pos_favorite_warehouse',
    PAYMENT_METHOD: 'pos_payment_method',
    VOUCHER_TYPE: 'pos_voucher_type'
};

// Stores y router
const router = useRouter();
// Stores and composables
const toast = useToast();
const authStore = useAuthStore();
const productsStore = useProductsStore();
const warehousesStore = useWarehousesStore();
const salesStore = useSalesStore();
const paymentMethodsStore = usePaymentMethodsStore();
const cashSessionsStore = useCashSessionsStore();
const creditsStore = useCreditsStore();

// Loading states
const loading = ref(false);
const isInitializing = ref(true);

// Quick search for barcode scanner

// Session and warehouse management
// const activeSession = ref(null);
const selectedWarehouse = ref(null);

// Cart and payment
const cart = ref([]);
const selectedPaymentMethods = ref([]);
const paymentStatus = ref('PAGADO'); // PAGADO o PENDIENTE
// const showPaymentDialog = ref(false);
const showCartSummary = ref(false);
const showBatchDialog = ref(false);
const selectedProductForBatch = ref(null);

// Payment methods management
const availablePaymentMethods = ref([]);
const showMultiplePaymentDialog = ref(false);

// Store reactive data
const { warehousesList, isLoadingWarehouses } = storeToRefs(warehousesStore);
const { saleProductsList } = storeToRefs(productsStore);
const { paymentMethodsList } = storeToRefs(paymentMethodsStore);
const { hasActiveSession, currentSessionInfo } = storeToRefs(cashSessionsStore);

// Search and product data
const searchQuery = ref('');
const searchResults = ref([]);
const isSearching = ref(false);

// Customer search and selection
const selectedCustomer = ref(null);
const customerSearch = ref('');
const customerResults = ref([]);
const isSearchingCustomers = ref(false);
const showCustomerDialog = ref(false);
const showCreateCustomerDialog = ref(false);

// New customer form
const newCustomer = ref({
    name: '',
    email: '',
    phone: '',
    identity_document: '',
    identity_document_type: 'dni'
});

// Discount Composable
const {
    discountCode,
    discountType,
    discountPercentage,
    discountAmount,
    validating,
    error: discountError,
    hasDiscount,
    discountInfo,
    validateCode,
    applyManualDiscount,
    clearDiscount,
    calculateDiscount
} = useDiscount();

// Computed para productos con manejo de stock por almacén
const products = computed(() => {
    return searchResults.value.map((product) => {
        // Buscar stock para el almacén seleccionado o tomar el primero
        let stockInfo = product.available_stock?.find((stock) => !selectedWarehouse.value || stock.warehouse_id === selectedWarehouse.value) || product.available_stock?.[0];

        if (!stockInfo) {
            return {
                ...product,
                stock: 0,
                price: 0,
                warehouse_id: null
            };
        }

        // Para productos con lotes, usar el precio del primer lote
        let price = 0;
        if (product.requires_batches && stockInfo.batches?.length > 0) {
            price = stockInfo.batches[0].sale_price;
        } else if (stockInfo.sale_price) {
            price = stockInfo.sale_price;
        }

        return {
            ...product,
            stock: stockInfo.total_stock || stockInfo.available_quantity || 0,
            price: price,
            warehouse_id: stockInfo.warehouse_id,
            stock_info: stockInfo
        };
    });
});

// Vouchers configuration
const companyConfig = computed(() => authStore.getCompanyConfig || {});

const availableVoucherTypes = computed(() => {
    const cfg = companyConfig.value;
    if (!cfg?.send_sunat) {
        return [{ label: 'Ticket', value: 'ticket' }];
    }

    const types = [];
    if (cfg?.allow_ticket ?? true) types.push({ label: 'Ticket', value: 'ticket' });
    if (cfg?.allow_boleta ?? true) types.push({ label: 'Boleta', value: 'boleta' });
    if (cfg?.allow_factura ?? true) types.push({ label: 'Factura', value: 'factura' });

    return types.length ? types : [{ label: 'Ticket', value: 'ticket' }];
});

const voucherType = ref(availableVoucherTypes.value[0]?.value);

// Toast management system
const toastShown = ref({
    sessionWarning: false,
    stockWarning: new Set(),
    searchEmpty: false,
    stockError: new Set(),
    paymentError: false
});

// Toast configuration presets
const TOAST_PRESETS = {
    success: { severity: 'success', life: 3000 },
    info: { severity: 'info', life: 3000 },
    warn: { severity: 'warn', life: 4000 },
    error: { severity: 'error', life: 4000 }
};

// Centralized toast management
const showToast = (type, options = {}) => {
    const preset = TOAST_PRESETS[options.severity] || TOAST_PRESETS.info;
    const config = { ...preset, ...options };

    // Prevent duplicate toasts for specific types
    const preventDuplicates = ['sessionWarning', 'searchEmpty', 'paymentError'];
    if (preventDuplicates.includes(type) && toastShown.value[type]) return;

    // Special handling for stock errors (prevent per product)
    if (type === 'stockError' && options.productId) {
        if (toastShown.value.stockError.has(options.productId)) return;
        toastShown.value.stockError.add(options.productId);
        setTimeout(() => toastShown.value.stockError.delete(options.productId), 3000);
    }

    toast.add(config);

    // Track shown toasts with auto-reset
    if (preventDuplicates.includes(type)) {
        toastShown.value[type] = true;
        const resetTime = type === 'sessionWarning' ? 10000 : 5000;
        setTimeout(() => {
            toastShown.value[type] = false;
        }, resetTime);
    }
};

// Specific toast helpers
const showSessionWarning = (detail) => {
    showToast('sessionWarning', {
        severity: 'warn',
        summary: 'Sin Sesión de Caja',
        detail,
        life: 5000
    });
};

const showStockError = (productName, productId) => {
    showToast('stockError', {
        severity: 'error',
        summary: 'Sin Stock',
        detail: `${productName} no tiene stock disponible`,
        productId
    });
};

const showValidationError = (detail) => {
    showToast('validation', {
        severity: 'error',
        summary: 'Error de Validación',
        detail
    });
};

const showSuccessMessage = (summary, detail) => {
    showToast('success', {
        severity: 'success',
        summary,
        detail,
        life: 3000
    });
};
const requiresCashSession = computed(() => {
    // Si la configuración aún no está cargada, asumimos que SÍ requiere sesión
    return companyConfig.value?.requires_cash_session ?? true;
});

// Se puede operar si hay sesión activa o si la caja no es obligatoria
const canOperateWithoutSession = computed(() => hasActiveSession.value || !requiresCashSession.value);

// Load preferences from cache
selectedWarehouse.value = cache.getItem(CACHE_KEYS.FAVORITE_WAREHOUSE);
voucherType.value = cache.getItem(CACHE_KEYS.VOUCHER_TYPE) || availableVoucherTypes.value[0]?.value;

// Persist preferences to cache
watch(selectedWarehouse, (val) => {
    if (val !== null) {
        cache.setItem(CACHE_KEYS.FAVORITE_WAREHOUSE, val);
    }
});
watch(voucherType, (val) => cache.setItem(CACHE_KEYS.VOUCHER_TYPE, val));

// Función para buscar productos usando el endpoint search-sale
const searchProducts = async (query = '') => {
    if (!query.trim()) {
        searchResults.value = [];
        return;
    }

    isSearching.value = true;
    try {
        const params = { search: query };
        if (selectedWarehouse.value) {
            params.warehouse_id = selectedWarehouse.value;
        }

        await productsStore.searchProductsForSale(query, selectedWarehouse.value);
        searchResults.value = saleProductsList.value || [];
        if (searchResults.value.length === 0) {
            showToast('searchEmpty', {
                severity: 'info',
                summary: 'Sin resultados',
                detail: 'No se encontraron productos disponibles',
                life: 2000
            });
        }
    } catch (error) {
        showToast('error', {
            severity: 'error',
            summary: 'Error de búsqueda',
            detail: 'Error al buscar productos'
        });
        searchResults.value = [];
    } finally {
        isSearching.value = false;
    }
};

// Debounced search
let searchTimeout = null;
const debouncedSearch = (query) => {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        searchProducts(query);
    }, 300);
};

// Watch para búsqueda automática
watch(searchQuery, (newQuery) => {
    debouncedSearch(newQuery);
});

// Watch para cambio de almacén
watch(selectedWarehouse, () => {
    if (searchQuery.value) {
        searchProducts(searchQuery.value);
    }
});

const getCurrentSession = async () => {
    try {
        await cashSessionsStore.getCurrentSession();
        if (requiresCashSession.value && !cashSessionsStore.hasActiveSession) {
            showSessionWarning('Algunos métodos de pago requieren una sesión de caja activa');
        }
    } catch (error) {
        console.error('Error al obtener sesión actual:', error);
        // Si falla obtener la sesión, asumir que no hay sesión activa
    }
};

onMounted(async () => {
    isInitializing.value = true;

    try {
        // Cargar datos iniciales en paralelo
        await Promise.all([warehousesList.value.length === 0 ? warehousesStore.fetchWarehouses() : Promise.resolve(), paymentMethodsStore.fetchPaymentMethods({ active_only: true }), getCurrentSession()]);

        // Configurar métodos de pago disponibles
        availablePaymentMethods.value = paymentMethodsList.value.filter((pm) => pm.is_active);

        showSuccessMessage('Sistema Iniciado', 'Punto de venta listo para usar');

        // Validar sesión de caja si hay métodos que requieren caja
        const cashRequiredMethods = availablePaymentMethods.value.filter((pm) => pm.requires_cash_register);
        if (cashRequiredMethods.length > 0 && requiresCashSession.value && !hasActiveSession.value) {
            showSessionWarning('Algunos métodos de pago requieren una sesión de caja activa');
        }
    } catch (error) {
        showToast('error', {
            severity: 'error',
            summary: 'Error de inicialización',
            detail: 'Error al cargar datos iniciales'
        });
    } finally {
        isInitializing.value = false;
        // Si no hay sesión activa, advertir y redirigir
        if (requiresCashSession.value && !hasActiveSession.value) {
            showSessionWarning('Debes abrir tu sesión antes de vender');
            router.replace('/commerce/pos/sessions');
        }
    }
});

const filteredProducts = computed(() => {
    return products.value.filter((product) => {
        const matchSearch = searchQuery.value
            ? product.name.toLowerCase().includes(searchQuery.value.toLowerCase()) || product.sku.toLowerCase().includes(searchQuery.value.toLowerCase()) || product.barcode.toLowerCase().includes(searchQuery.value.toLowerCase())
            : true;
        const matchWarehouse = selectedWarehouse.value ? product.warehouse_id === selectedWarehouse.value : true;
        return matchSearch && matchWarehouse;
    });
});

const addToCart = (product) => {
    if (product.stock === 0) {
        showStockError(product.name, product.id);
        return;
    }

    // Si el producto requiere lotes, mostrar modal de selección
    if (product.requires_batches && product.stock_info?.batches?.length > 0) {
        selectedProductForBatch.value = product;
        showBatchDialog.value = true;
        return;
    }

    // Para productos sin lotes, agregar directamente (stock_id se obtiene automáticamente)
    addProductToCart(product, null, null);
};

const addProductToCart = (product, batchId = null, stockId = null) => {
    // Para productos sin lotes, necesitamos obtener el stock_id desde stock_info
    if (!batchId && !stockId && product.stock_info) {
        // Usar el primer stock disponible si no se especifica
        stockId = product.stock_info.stock_id || product.stock_info.id;
    }

    // Validar que tenemos stock_id - OBLIGATORIO para la API
    if (!stockId) {
        showValidationError('No se pudo obtener información de stock para este producto');
        return;
    }

    const cartItemKey = batchId ? `${product.id}-${batchId}` : `${product.id}-${stockId}`;
    const existingItem = cart.value.find((item) => item.cartKey === cartItemKey);

    if (existingItem) {
        const availableStock = batchId ? product.stock_info.batches.find((b) => b.batch_id === batchId)?.available_quantity || 0 : product.stock;

        if (existingItem.quantity < availableStock) {
            existingItem.quantity++;
            showSuccessMessage('Actualizado', `${product.name} cantidad: ${existingItem.quantity}`);
        } else {
            showToast('stockWarning', {
                severity: 'warn',
                summary: 'Stock Limitado',
                detail: `Solo quedan ${availableStock} unidades`
            });
        }
    } else {
        const batchInfo = batchId ? product.stock_info.batches.find((b) => b.batch_id === batchId) : null;
        const itemName = batchInfo ? `${product.name} (${batchInfo.batch_code})` : product.name;

        cart.value.push({
            cartKey: cartItemKey,
            id: product.id,
            name: itemName,
            price: product.price,
            quantity: 1,
            subtotal: product.price,
            batch_id: batchId,
            stock_id: stockId, // OBLIGATORIO - siempre debe tener valor
            requires_batches: product.requires_batches
        });
        showSuccessMessage('Agregado', `${itemName} añadido al carrito`);
    }

    updateCartTotals();
};

const selectBatch = (batch) => {
    if (selectedProductForBatch.value) {
        addProductToCart(selectedProductForBatch.value, batch.batch_id, batch.stock_id);
        showBatchDialog.value = false;
        selectedProductForBatch.value = null;
    }
};

const removeFromCart = (index) => {
    const item = cart.value[index];
    cart.value.splice(index, 1);
    updateCartTotals();
    showToast('info', {
        severity: 'info',
        summary: 'Eliminado',
        detail: `${item.name} removido del carrito`
    });
};

const updateQuantity = (item, newQuantity) => {
    const product = products.value.find((p) => p.id === item.id);

    if (newQuantity <= 0) {
        const index = cart.value.findIndex((i) => i.cartKey === item.cartKey);
        if (index !== -1) {
            cart.value.splice(index, 1);
        }
    } else {
        // Determinar stock disponible según si tiene lotes o no
        let availableStock = product.stock;
        if (item.batch_id && product.stock_info?.batches) {
            const batch = product.stock_info.batches.find((b) => b.batch_id === item.batch_id);
            availableStock = batch ? parseFloat(batch.available_quantity) : 0;
        }

        if (newQuantity <= availableStock) {
            item.quantity = newQuantity;
            item.subtotal = item.price * newQuantity;
        } else {
            showToast('stockWarning', {
                severity: 'warn',
                summary: 'Stock Insuficiente',
                detail: `Solo hay ${availableStock} unidades disponibles`
            });
        }
    }

    updateCartTotals();
};

const updateCartTotals = () => {
    cart.value.forEach((item) => {
        item.subtotal = item.price * item.quantity;
    });
};

const cartTotal = computed(() => {
    return cart.value.reduce((total, item) => total + item.subtotal, 0);
});

const finalTotal = computed(() => {
    return Math.max(0, cartTotal.value - discountAmount.value);
});

// Validar y recalcular descuentos al cambiar el total
watch(cartTotal, async (newSubtotal) => {
    if (hasDiscount.value) {
        // CASE 1: Coupon Code (Re-validate to check minimum limits etc)
        if (discountCode.value) {
            console.log('Re-validating coupon for new POS subtotal:', newSubtotal);
            const isValid = await validateCode(discountCode.value.code, newSubtotal, selectedCustomer.value?.id);
            if (!isValid) {
                 // validateCode handles clearing if invalid
            }
        } 
        // CASE 2: Manual Percentage Discount
        else if (discountType.value === 'percentage') {
             applyManualDiscount('percentage', discountPercentage.value, newSubtotal);
        }
        // CASE 3: Manual Fixed Discount
        else if (discountType.value === 'fixed') {
            const currentFixed = discountAmount.value; 
            if (currentFixed > newSubtotal) {
                applyManualDiscount('fixed', newSubtotal, newSubtotal); // Cap at subtotal
            }
        }
    }
});

const cartItemsCount = computed(() => {
    return cart.value.reduce((total, item) => total + item.quantity, 0);
});

const clearCart = () => {
    cart.value = [];
    showToast('info', {
        severity: 'info',
        summary: 'Carrito Limpio',
        detail: 'Todos los productos han sido removidos'
    });
};

const printVoucher = (url) => {
    window.open(url, '_blank');
};

const processPayment = async () => {
    // Bloquear venta si no existe sesión de caja
    if (requiresCashSession.value && !hasActiveSession.value) {
        showSessionWarning('Debes abrir tu sesión antes de registrar ventas');
        router.push('/commerce/pos/sessions');
        return;
    }

    if (cart.value.length === 0) {
        showValidationError('Agregue productos antes de procesar el pago');
        return;
    }

    // Validar que hay métodos de pago seleccionados
    if (selectedPaymentMethods.value.length === 0) {
        showValidationError('Debe seleccionar al menos un método de pago');
        return;
    }

    try {
        if ((voucherType.value === 'boleta' || voucherType.value === 'factura') && !companyConfig.value?.send_sunat) {
            throw new Error('Para usar boletas o facturas debe activar la configuración SUNAT');
        }
    } catch (err) {
        showToast('error', {
            severity: 'error',
            summary: 'Error de Configuración',
            detail: err.message
        });
        return;
    }

    loading.value = true;

    // Validate customer for voucher type
    const customerValidation = validateCustomerForVoucher();
    if (customerValidation !== true) {
        showValidationError(customerValidation);
        loading.value = false;
        return;
    }

    // Validar métodos de pago
    const paymentValidation = await validateSelectedPaymentMethods();
    if (!paymentValidation.valid) {
        showToast('paymentError', {
            severity: 'error',
            summary: 'Error en Métodos de Pago',
            detail: paymentValidation.message
        });
        loading.value = false;
        return;
    }

    // Calcular impuestos (18% en Perú)
    const calculateTax = (amount) => Math.round(amount * 0.18 * 100) / 100;
    const totalTax = calculateTax(finalTotal.value);

    const payload = {
        customer_id: selectedCustomer.value?.id || null,
        sale_date: new Date().toISOString().slice(0, 10),
        voucher_type: voucherType.value,
        total_amount: finalTotal.value,
        tax_amount: totalTax,
        discount_amount: 0,
        notes: null,
        status: paymentStatus.value,
        details: cart.value.map((item) => {
            const itemTax = calculateTax(item.subtotal);
            return {
                product_id: item.id,
                batch_id: item.batch_id || null,
                stock_id: item.stock_id,
                quantity: item.quantity,
                unit_price: item.price,
                total_amount: item.subtotal,
                tax_amount: itemTax,
                discount_amount: 0
            };
        }),
        payment_methods: selectedPaymentMethods.value.map((pm) => ({
            method_id: pm.method_id,
            amount: parseFloat(pm.amount),
            reference: pm.reference || null
        })),
        
        // Discount fields
        discount_amount: parseFloat(discountAmount.value) || 0,
        discount_type: discountAmount.value > 0 ? (discountType.value || 'none') : 'none',
        discount_percentage: discountType.value === 'percentage' ? (parseFloat(discountPercentage.value) || 0) : null,
        discount_code: discountCode.value?.code || null,
        discount_code_id: discountCode.value?.id || null
    };

    try {
        const response = await salesStore.createSale(payload);

        // Manejar diferentes estructuras de respuesta posibles
        let saleData, voucherLink;

        if (response.data) {
            saleData = response.data.sale || response.data;
            voucherLink = response.data.voucher_link;
        } else {
            saleData = response.sale || response;
            voucherLink = response.voucher_link;
        }

        // Construir mensaje de éxito
        let successMessage = 'Venta registrada exitosamente';

        if (saleData && saleData.document_type && saleData.document_number) {
            successMessage = `Venta registrada - ${saleData.document_type}: ${saleData.document_number}`;
        } else if (saleData && saleData.id) {
            successMessage = `Venta registrada - ID: ${saleData.id}`;
        }

        if (voucherLink) {
            successMessage += ' (Comprobante disponible)';
        }

        showToast('success', {
            severity: 'success',
            summary: 'Venta Exitosa',
            detail: successMessage,
            life: 5000
        });

        // Limpiar carrito, métodos de pago y datos de cliente, y preparar siguiente venta
        cart.value = [];
        clearDiscount(); // Limpiar descuento
        selectedPaymentMethods.value = [];
        selectedPaymentMethods.value = [];
        clearCustomer(); // Limpia datos de cliente y búsquedas
        showCustomerDialog.value = true; // Abre el modal para seleccionar nuevo cliente
        showMultiplePaymentDialog.value = false;

        // Refrescar sesión de caja si existe
        if (hasActiveSession.value) {
            await cashSessionsStore.refreshCurrentSession();
        }

        if (voucherLink) {
            printVoucher(voucherLink);
        }
    } catch (error) {
        let errorMessage = 'Error al procesar la venta';

        if (error.status === 400) {
            errorMessage = error.message || 'Error de stock - Verifique disponibilidad';
        } else if (error.status === 422) {
            errorMessage = error.validationErrors?.join(', ') || error.message || 'Error de validación';
        } else if (error.message) {
            errorMessage = error.message;
        }

        showToast('error', {
            severity: 'error',
            summary: 'Error de Venta',
            detail: errorMessage,
            life: 4500
        });
    } finally {
        loading.value = false;
    }
};

const handleApplyDiscount = async (code) => {
    if (!cartTotal.value) {
        return;
    }
    await validateCode(code, cartTotal.value, selectedCustomer.value?.id);
};

// Customer search functions
const searchCustomersDebounced = async (query) => {
    if (!query || query.length < 2) {
        customerResults.value = [];
        return;
    }

    isSearchingCustomers.value = true;
    try {
        const response = await searchCustomers(query);
        customerResults.value = response.data || [];
    } catch (error) {
        showToast('error', {
            severity: 'error',
            summary: 'Error de búsqueda',
            detail: 'Error al buscar clientes'
        });
        customerResults.value = [];
    } finally {
        isSearchingCustomers.value = false;
    }
};

const selectCustomer = (customer) => {
    selectedCustomer.value = customer;
    showCustomerDialog.value = false;
    showSuccessMessage('Cliente seleccionado', `Cliente: ${customer.name}`);
};

const clearCustomer = () => {
    selectedCustomer.value = null;
    customerSearch.value = '';
    customerResults.value = [];
};

const createQuickCustomer = async () => {
    // Basic validation
    if (!newCustomer.value.name.trim()) {
        showValidationError('El nombre del cliente es requerido');
        return;
    }

    try {
        const response = await createCustomer(newCustomer.value);
        selectedCustomer.value = response.data;
        showCreateCustomerDialog.value = false;

        // Reset form
        newCustomer.value = {
            name: '',
            email: '',
            phone: '',
            identity_document: '',
            identity_document_type: 'dni'
        };

        showSuccessMessage('Cliente creado', `Cliente ${response.data.name} creado y seleccionado`);
    } catch (error) {
        const msg = error.validationErrors?.join(', ') || error.message || 'Error al crear cliente';
        showToast('error', {
            severity: 'error',
            summary: 'Error al crear cliente',
            detail: msg
        });
    }
};

const validateCustomerForVoucher = () => {
    if (!selectedCustomer.value) {
        return 'Debe seleccionar un cliente antes de procesar la venta';
    }

    if (voucherType.value === 'boleta' && !selectedCustomer.value.identity_document) {
        return 'Para generar boletas el cliente debe tener número de documento';
    }

    if (voucherType.value === 'factura') {
        if (!selectedCustomer.value.identity_document) {
            return 'Para generar facturas el cliente debe tener RUC';
        }
        if (selectedCustomer.value.identity_document_type !== 'ruc') {
            return 'Para generar facturas el cliente debe tener un RUC válido';
        }
    }

    return true;
};

const getTotalPaymentAmount = () => {
    return selectedPaymentMethods.value.reduce((sum, pm) => sum + parseFloat(pm.amount || 0), 0);
};

const validateSelectedPaymentMethods = async () => {
    // Verificar sesión activa antes de cualquier otra validación
    if (requiresCashSession.value && !hasActiveSession.value) {
        return { valid: false, message: 'Debe tener una sesión de caja activa' };
    }

    if (selectedPaymentMethods.value.length === 0) {
        return { valid: false, message: 'Debe seleccionar al menos un método de pago' };
    }

    // Validar que todos los métodos tengan datos completos
    for (let i = 0; i < selectedPaymentMethods.value.length; i++) {
        const pm = selectedPaymentMethods.value[i];

        if (!pm.method_id) {
            return {
                valid: false,
                message: `Método de pago ${i + 1}: Debe seleccionar un método`
            };
        }

        if (!pm.amount || pm.amount <= 0) {
            return {
                valid: false,
                message: `Método de pago ${i + 1}: Monto debe ser mayor a cero`
            };
        }

        if (pm.requires_reference && !pm.reference) {
            return {
                valid: false,
                message: `Método de pago ${i + 1}: Requiere número de referencia`
            };
        }

        // Validar límites del método de pago
        const method = availablePaymentMethods.value.find((m) => m.id === pm.method_id);
        if (method) {
            const validation = paymentMethodsStore.validateMethod(pm.method_id, pm.amount, !!pm.reference);
            if (!validation.valid) {
                return {
                    valid: false,
                    message: `Método de pago ${i + 1}: ${validation.message}`
                };
            }

            // Validación específica para crédito de la casa
            if (method.type === 'CREDIT' || method.name.toLowerCase().includes('crédito')) {
                if (!selectedCustomer.value) {
                    return {
                        valid: false,
                        message: 'Debe seleccionar un cliente para ventas al crédito'
                    };
                }

                // Obtener información actualizada de crédito del cliente
                let customerCreditInfo = selectedCustomer.value;
                try {
                    // Intentar obtener información actualizada de crédito
                    const freshCreditInfo = await creditsStore.fetchCustomerCreditSummary(selectedCustomer.value.id);
                    if (freshCreditInfo) {
                        customerCreditInfo = { ...selectedCustomer.value, ...freshCreditInfo };
                    }
                    // Si freshCreditInfo es null, usar datos locales del cliente
                } catch (error) {
                    console.warn('No se pudo obtener información actualizada de crédito, usando datos del cliente');
                }

                if (!customerCreditInfo.credit_enabled) {
                    return {
                        valid: false,
                        message: 'El cliente no tiene crédito habilitado'
                    };
                }

                const availableCredit = (customerCreditInfo.credit_limit || 0) - (customerCreditInfo.total_debt || 0);
                if (pm.amount > availableCredit) {
                    return {
                        valid: false,
                        message: `Cliente excede límite de crédito. Disponible: S/ ${availableCredit.toFixed(2)} de S/ ${(customerCreditInfo.credit_limit || 0).toFixed(2)}`
                    };
                }

                if (customerCreditInfo.has_overdue_credits) {
                    return {
                        valid: false,
                        message: 'El cliente tiene deudas vencidas. No se puede otorgar más crédito.'
                    };
                }
            }
        }
    }

    // Validar suma total
    const totalPayments = getTotalPaymentAmount();
    const tolerance = 0.01;



    if (Math.abs(totalPayments - finalTotal.value) > tolerance) {
        return {
            valid: false,
            message: `La suma de pagos (${totalPayments.toFixed(2)}) debe coincidir con el total (${finalTotal.value.toFixed(2)})`
        };
    }

    // Validar solo un método en efectivo
    const cashMethods = selectedPaymentMethods.value.filter((pm) => {
        const method = availablePaymentMethods.value.find((m) => m.id === pm.method_id);
        return method && method.type === 'CASH';
    });

    if (cashMethods.length > 1) {
        return {
            valid: false,
            message: 'Solo se permite un método de pago en efectivo por venta'
        };
    }

    // Validar sesión de caja para métodos que la requieren
    const cashRegisterMethods = selectedPaymentMethods.value.filter((pm) => {
        const method = availablePaymentMethods.value.find((m) => m.id === pm.method_id);
        return method && method.requires_cash_register;
    });

    if (cashRegisterMethods.length > 0 && requiresCashSession.value && !hasActiveSession.value) {
        return {
            valid: false,
            message: 'Debe tener un turno de caja activo para procesar pagos en efectivo'
        };
    }

    return { valid: true, message: 'Métodos de pago válidos' };
};

const openMultiplePaymentDialog = () => {
    // Buscar método de pago por defecto (Efectivo)
    const cashMethod = availablePaymentMethods.value.find((pm) => pm.type === 'CASH') || availablePaymentMethods.value[0] || {};

    selectedPaymentMethods.value = [
        {
            method_id: cashMethod.id || null,
            method_name: cashMethod.name || '',
            amount: finalTotal.value,
            reference: '',
            requires_reference: cashMethod.requires_reference || false
        }
    ];

    showMultiplePaymentDialog.value = true;
};
</script>

<template>
    <Toast />
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <!-- Header -->
        <PosHeader
            :currentSessionInfo="currentSessionInfo"
            :selectedCustomer="selectedCustomer"
            :cartItemsCount="cartItemsCount"
            @show-customer-dialog="showCustomerDialog = true"
            @clear-customer="clearCustomer"
            @show-cart-summary="showCartSummary = true"
        />

        <div class="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
            <div class="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                <!-- Products Section -->
                <div class="lg:col-span-3 space-y-4 sm:space-y-6">
                    <!-- Search and Filters Panel -->
                    <ProductSearch
                        v-model:searchQuery="searchQuery"
                        v-model:selectedWarehouse="selectedWarehouse"
                        :isSearching="isSearching"
                        :warehousesList="warehousesList"
                        :isLoadingWarehouses="isLoadingWarehouses"
                        :filteredProducts="filteredProducts"
                        @search-products="searchProducts"
                    />

                    <!-- Products Grid -->
                    <ProductGrid :isSearching="isSearching" :filteredProducts="filteredProducts" :searchQuery="searchQuery" :searchResults="searchResults" @add-to-cart="addToCart" />
                </div>

                <!-- Cart Sidebar (Desktop) -->
                <ShoppingCart
                    :cart="cart"
                    :cartItemsCount="cartItemsCount"
                    :cartTotal="cartTotal"
                    :canOperateWithoutSession="canOperateWithoutSession"
                    :loading="loading"
                    v-model:showCartSummary="showCartSummary"
                    @remove-from-cart="removeFromCart"
                    @update-quantity="updateQuantity"
                    @clear-cart="clearCart"
                    @open-multiple-payment-dialog="openMultiplePaymentDialog"
                    
                    :hasDiscount="hasDiscount"
                    :discountInfo="discountInfo"
                    :validating="validating"
                    :discountError="discountError"
                    @apply-discount="handleApplyDiscount"
                    @remove-discount="clearDiscount"
                />
                <!-- Mobile Floating Action Button for Cart -->
                <div class="fixed right-4 bottom-4 lg:hidden z-50">
                    <Button
                        @click="showCartSummary = true"
                        icon="pi pi-shopping-cart"
                        class="p-4 w-16 h-16 rounded-full shadow-lg bg-gradient-to-r from-green-600 to-emerald-600"
                        badge-class="bg-white text-green-600 font-bold"
                        :badge="cartItemsCount > 0 ? cartItemsCount.toString() : null"
                    />
                </div>
            </div>
        </div>

        <!-- Multiple Payment Methods Dialog -->

        <PaymentDialog
            v-model:showMultiplePaymentDialog="showMultiplePaymentDialog"
            :cartTotal="finalTotal"
            v-model:selectedPaymentMethods="selectedPaymentMethods"
            :availablePaymentMethods="availablePaymentMethods"
            v-model:voucherType="voucherType"
            :availableVoucherTypes="availableVoucherTypes"
            v-model:paymentStatus="paymentStatus"
            :loading="loading"
            :selectedCustomer="selectedCustomer"
            :discountInfo="discountInfo"
            @process-payment="processPayment"
            :printVoucher="printVoucher"
        />

        <!-- Batch Select Dialog -->
        <BatchSelectDialog v-model:showBatchDialog="showBatchDialog" :selectedProductForBatch="selectedProductForBatch" @select-batch="selectBatch" />

        <!-- Customer Selection Dialog -->
        <CustomerDialogs
            v-model:showCustomerDialog="showCustomerDialog"
            v-model:showCreateCustomerDialog="showCreateCustomerDialog"
            v-model:customerSearch="customerSearch"
            :customerResults="customerResults"
            :isSearchingCustomers="isSearchingCustomers"
            v-model:newCustomer="newCustomer"
            :loading="loading"
            :voucherType="voucherType"
            :cartTotal="finalTotal"
            @search-customers="searchCustomersDebounced"
            @select-customer="selectCustomer"
            @create-quick-customer="createQuickCustomer"
        />

        <!-- Toast for notifications -->
        <Toast />
    </div>
</template>

<style scoped>
.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.touch-manipulation {
    touch-action: manipulation;
}

/* Gradients and animations */
@keyframes gradient-shift {
    0%,
    100% {
        background-position: 0% 50%;
    }

    50% {
        background-position: 100% 50%;
    }
}

.bg-gradient-animated {
    background-size: 200% 200%;
    animation: gradient-shift 3s ease infinite;
}

/* Enhanced hover effects */
.hover-lift {
    transition:
        transform 0.2s ease-in-out,
        box-shadow 0.2s ease-in-out;
}

.hover-lift:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

/* Larger touch targets for mobile */
@media (max-width: 768px) {
    .grid-cols-2 {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    /* Ensure buttons are at least 44px for touch */
    .touch-target {
        min-height: 44px;
        min-width: 44px;
    }
}

/* Custom backdrop blur */
.backdrop-blur-custom {
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
}
</style>
