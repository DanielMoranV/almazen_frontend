<script setup>
import { createCustomer, searchCustomers } from '@/api';
import { useAuthStore } from '@/stores/authStore';
import { useCashSessionsStore } from '@/stores/cashSessionsStore';
import { usePaymentMethodsStore } from '@/stores/paymentMethodsStore';
import { useProductsStore } from '@/stores/productsStore';
import { useSalesStore } from '@/stores/salesStore';
import { useWarehousesStore } from '@/stores/warehousesStore';
import cache from '@/utils/cache.js';
import { storeToRefs } from 'pinia';

import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

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

// Loading states
const loading = ref(false);
const isInitializing = ref(true);

// Quick search for barcode scanner


// Session and warehouse management
const activeSession = ref(null);
const selectedWarehouse = ref(null);

// Cart and payment
const cart = ref([]);
const selectedPaymentMethods = ref([]);
const paymentStatus = ref('PAGADO'); // PAGADO o PENDIENTE
const showPaymentDialog = ref(false);
const showCartSummary = ref(false);
const showBatchDialog = ref(false);
const selectedProductForBatch = ref(null);

// Payment methods management
const availablePaymentMethods = ref([]);
const showMultiplePaymentDialog = ref(false);

// Store reactive data
const { warehousesList, isLoadingWarehouses } = storeToRefs(warehousesStore);
const { saleProductsList, isLoadingSaleProducts } = storeToRefs(productsStore);
const { paymentMethodsList } = storeToRefs(paymentMethodsStore);
const { currentSession, hasActiveSession, currentSessionInfo } = storeToRefs(cashSessionsStore);

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

// Image error tracking
const imageErrors = ref({});

// Computed para productos con manejo de stock por almacén
const products = computed(() => {
    return searchResults.value.map(product => {
        // Buscar stock para el almacén seleccionado o tomar el primero
        let stockInfo = product.available_stock?.find(stock =>
            !selectedWarehouse.value || stock.warehouse_id === selectedWarehouse.value
        ) || product.available_stock?.[0];

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

// Load preferences from cache
selectedWarehouse.value = cache.getItem(CACHE_KEYS.FAVORITE_WAREHOUSE);
voucherType.value = cache.getItem(CACHE_KEYS.VOUCHER_TYPE) || availableVoucherTypes.value[0]?.value;

// Persist preferences to cache
watch(selectedWarehouse, val => {
    if (val !== null) {
        cache.setItem(CACHE_KEYS.FAVORITE_WAREHOUSE, val);
    }
});
watch(voucherType, val => cache.setItem(CACHE_KEYS.VOUCHER_TYPE, val));

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
        console.log(searchResults.value);

        if (searchResults.value.length === 0) {
            toast.add({
                severity: 'info',
                summary: 'Sin resultados',
                detail: 'No se encontraron productos disponibles',
                life: 2000
            });
        }
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error de búsqueda',
            detail: 'Error al buscar productos',
            life: 3000
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
        if (!cashSessionsStore.hasActiveSession) {
            toast.add({
                severity: 'warn',
                summary: 'Sin Sesión de Caja',
                detail: 'Algunos métodos de pago requieren una sesión de caja activa',
                life: 5000
            });
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
        await Promise.all([
            warehousesList.value.length === 0 ? warehousesStore.fetchWarehouses() : Promise.resolve(),
            paymentMethodsStore.fetchPaymentMethods({ active_only: true }),
            getCurrentSession()
        ]);

        // Configurar métodos de pago disponibles
        availablePaymentMethods.value = paymentMethodsList.value.filter(pm => pm.is_active);

        toast.add({
            severity: 'success',
            summary: 'Sistema Iniciado',
            detail: 'Punto de venta listo para usar',
            life: 3000
        });

        // Validar sesión de caja si hay métodos que requieren caja
        const cashRequiredMethods = availablePaymentMethods.value.filter(pm => pm.requires_cash_register);
        if (cashRequiredMethods.length > 0 && !hasActiveSession.value) {
            toast.add({
                severity: 'warn',
                summary: 'Sin Sesión de Caja',
                detail: 'Algunos métodos de pago requieren una sesión de caja activa',
                life: 5000
            });
        }
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error de inicialización',
            detail: 'Error al cargar datos iniciales',
            life: 4000
        });
    } finally {
        isInitializing.value = false;
        // Si no hay sesión activa, advertir y redirigir
        if (!hasActiveSession.value) {
            toast.add({
                severity: 'warn',
                summary: 'Sin Sesión de Caja',
                detail: 'Debes abrir tu sesión antes de vender',
                life: 5000
            });
            router.replace('/commerce/pos/sessions');
        }
    }
});

const checkActiveSession = () => {
    setTimeout(() => {
        activeSession.value = {
            id: 1,
            cashier: authStore.currentUser?.name || 'Usuario',
            openedAt: new Date().toLocaleString(),
            initialAmount: 1000
        };
    }, 500);
};

const filteredProducts = computed(() => {
    return products.value.filter(product => {
        const matchSearch = searchQuery.value
            ? (
                product.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                product.sku.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                product.barcode.toLowerCase().includes(searchQuery.value.toLowerCase())
            )
            : true;
        const matchWarehouse = selectedWarehouse.value
            ? product.warehouse_id === selectedWarehouse.value
            : true;
        return matchSearch && matchWarehouse;
    });
});

const addToCart = (product) => {
    if (product.stock === 0) {
        toast.add({
            severity: 'error',
            summary: 'Sin Stock',
            detail: 'Este producto no tiene stock disponible',
            life: 3000
        });
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
        toast.add({
            severity: 'error',
            summary: 'Error de Stock',
            detail: 'No se pudo obtener información de stock para este producto',
            life: 3000
        });
        return;
    }

    const cartItemKey = batchId ? `${product.id}-${batchId}` : `${product.id}-${stockId}`;
    const existingItem = cart.value.find(item => item.cartKey === cartItemKey);

    if (existingItem) {
        const availableStock = batchId
            ? product.stock_info.batches.find(b => b.batch_id === batchId)?.available_quantity || 0
            : product.stock;

        if (existingItem.quantity < availableStock) {
            existingItem.quantity++;
            toast.add({
                severity: 'success',
                summary: 'Actualizado',
                detail: `${product.name} cantidad: ${existingItem.quantity}`,
                life: 2000
            });
        } else {
            toast.add({
                severity: 'warn',
                summary: 'Stock Limitado',
                detail: `Solo quedan ${availableStock} unidades`,
                life: 3000
            });
        }
    } else {
        const batchInfo = batchId ? product.stock_info.batches.find(b => b.batch_id === batchId) : null;
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
        toast.add({
            severity: 'success',
            summary: 'Agregado',
            detail: `${itemName} añadido al carrito`,
            life: 2000
        });
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
    toast.add({
        severity: 'info',
        summary: 'Eliminado',
        detail: `${item.name} removido del carrito`,
        life: 2000
    });
};

const updateQuantity = (item, newQuantity) => {
    const product = products.value.find(p => p.id === item.id);

    if (newQuantity <= 0) {
        const index = cart.value.findIndex(i => i.cartKey === item.cartKey);
        if (index !== -1) {
            cart.value.splice(index, 1);
        }
    } else {
        // Determinar stock disponible según si tiene lotes o no
        let availableStock = product.stock;
        if (item.batch_id && product.stock_info?.batches) {
            const batch = product.stock_info.batches.find(b => b.batch_id === item.batch_id);
            availableStock = batch ? parseFloat(batch.available_quantity) : 0;
        }

        if (newQuantity <= availableStock) {
            item.quantity = newQuantity;
            item.subtotal = item.price * newQuantity;
        } else {
            toast.add({
                severity: 'warn',
                summary: 'Stock Insuficiente',
                detail: `Solo hay ${availableStock} unidades disponibles`,
                life: 3000
            });
        }
    }

    updateCartTotals();
};

const updateCartTotals = () => {
    cart.value.forEach(item => {
        item.subtotal = item.price * item.quantity;
    });
};

const cartTotal = computed(() => {
    return cart.value.reduce((total, item) => total + item.subtotal, 0);
});

const cartItemsCount = computed(() => {
    return cart.value.reduce((total, item) => total + item.quantity, 0);
});

const clearCart = () => {
    cart.value = [];
    toast.add({
        severity: 'info',
        summary: 'Carrito Limpio',
        detail: 'Todos los productos han sido removidos',
        life: 2000
    });
};

const processPayment = async () => {
    // Bloquear venta si no existe sesión de caja
    if (!hasActiveSession.value) {
        toast.add({
            severity: 'warn',
            summary: 'Sesión de caja requerida',
            detail: 'Debes abrir tu sesión antes de registrar ventas',
            life: 4000
        });
        router.push('/commerce/pos/sessions');
        return;
    }

    if (cart.value.length === 0) {
        toast.add({
            severity: 'warn',
            summary: 'Carrito Vacío',
            detail: 'Agregue productos antes de procesar el pago',
            life: 3000
        });
        return;
    }

    // Validar que hay métodos de pago seleccionados
    if (selectedPaymentMethods.value.length === 0) {
        toast.add({
            severity: 'warn',
            summary: 'Sin Métodos de Pago',
            detail: 'Debe seleccionar al menos un método de pago',
            life: 3000
        });
        return;
    }

    try {
        if ((voucherType.value === 'boleta' || voucherType.value === 'factura') && !companyConfig.value?.send_sunat) {
            throw new Error('Para usar boletas o facturas debe activar la configuración SUNAT');
        }
    } catch (err) {
        toast.add({
            severity: 'error',
            summary: 'Error de Configuración',
            detail: err.message,
            life: 4000
        });
        return;
    }

    loading.value = true;

    // Validate customer for voucher type
    const customerValidation = validateCustomerForVoucher();
    if (customerValidation !== true) {
        toast.add({
            severity: 'error',
            summary: 'Error de validación',
            detail: customerValidation,
            life: 4000
        });
        loading.value = false;
        return;
    }

    // Validar métodos de pago
    const paymentValidation = validateSelectedPaymentMethods();
    if (!paymentValidation.valid) {
        toast.add({
            severity: 'error',
            summary: 'Error en Métodos de Pago',
            detail: paymentValidation.message,
            life: 4000
        });
        loading.value = false;
        return;
    }

    // Calcular impuestos (18% en Perú)
    const calculateTax = (amount) => Math.round(amount * 0.18 * 100) / 100;
    const totalTax = calculateTax(cartTotal.value);

    const payload = {
        customer_id: selectedCustomer.value?.id || null,
        sale_date: new Date().toISOString().slice(0, 10),
        voucher_type: voucherType.value,
        total_amount: cartTotal.value,
        tax_amount: totalTax,
        discount_amount: 0,
        notes: null,
        status: paymentStatus.value,
        details: cart.value.map(item => {
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
        payment_methods: selectedPaymentMethods.value.map(pm => ({
            method_id: pm.method_id,
            amount: parseFloat(pm.amount),
            reference: pm.reference || null
        }))
    };

    try {
        console.log('Payload enviado:', payload);
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

        toast.add({
            severity: 'success',
            summary: 'Venta Exitosa',
            detail: successMessage,
            life: 5000
        });

        // Limpiar carrito, métodos de pago y cerrar modal
        cart.value = [];
        selectedPaymentMethods.value = [];
        showPaymentDialog.value = false;

        // Refrescar sesión de caja si existe
        if (hasActiveSession.value) {
            await cashSessionsStore.refreshCurrentSession();
        }

        if (voucherLink) {
            console.log('Voucher link disponible:', voucherLink);
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

        toast.add({
            severity: 'error',
            summary: 'Error de Venta',
            detail: errorMessage,
            life: 4500
        });
    } finally {
        loading.value = false;
    }
};

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: 'PEN'
    }).format(amount);
};

const formatDateTime = (dateTime) => {
    return dateTime ? new Date(dateTime).toLocaleString('es-PE') : '--';
};

// Functions for image handling
const handleImageError = (event) => {
    const productElement = event.target.closest('[data-product-id]');
    if (productElement) {
        const productId = productElement.getAttribute('data-product-id');
        imageErrors.value[productId] = true;
    }
};

const handleImageLoad = (event) => {
    const productElement = event.target.closest('[data-product-id]');
    if (productElement) {
        const productId = productElement.getAttribute('data-product-id');
        imageErrors.value[productId] = false;
    }
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
        toast.add({
            severity: 'error',
            summary: 'Error de búsqueda',
            detail: 'Error al buscar clientes',
            life: 3000
        });
        customerResults.value = [];
    } finally {
        isSearchingCustomers.value = false;
    }
};

const selectCustomer = (customer) => {
    selectedCustomer.value = customer;
    showCustomerDialog.value = false;
    toast.add({
        severity: 'success',
        summary: 'Cliente seleccionado',
        detail: `Cliente: ${customer.name}`,
        life: 2000
    });
};

const clearCustomer = () => {
    selectedCustomer.value = null;
    customerSearch.value = '';
    customerResults.value = [];
};

const createQuickCustomer = async () => {
    // Basic validation
    if (!newCustomer.value.name.trim()) {
        toast.add({
            severity: 'error',
            summary: 'Error de validación',
            detail: 'El nombre del cliente es requerido',
            life: 3000
        });
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

        toast.add({
            severity: 'success',
            summary: 'Cliente creado',
            detail: `Cliente ${response.data.name} creado y seleccionado`,
            life: 3000
        });
    } catch (error) {
        const msg = error.validationErrors?.join(', ') || error.message || 'Error al crear cliente';
        toast.add({
            severity: 'error',
            summary: 'Error al crear cliente',
            detail: msg,
            life: 4000
        });
    }
};

const validateCustomerForVoucher = () => {
    if (voucherType.value === 'ticket') {
        return true; // Ticket no requiere cliente
    }

    if (!selectedCustomer.value) {
        return 'Para generar boletas o facturas debe seleccionar un cliente';
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

// Funciones para gestionar múltiples métodos de pago
const addPaymentMethod = () => {
    const remainingAmount = getRemainingAmount();
    if (remainingAmount <= 0) {
        toast.add({
            severity: 'warn',
            summary: 'Pago Completo',
            detail: 'El monto total ya está cubierto',
            life: 3000
        });
        return;
    }

    selectedPaymentMethods.value.push({
        method_id: null,
        method_name: '',
        amount: remainingAmount,
        reference: '',
        requires_reference: false
    });
};

const removePaymentMethod = (index) => {
    selectedPaymentMethods.value.splice(index, 1);
};

const updatePaymentMethod = (index, field, value) => {
    const paymentMethod = selectedPaymentMethods.value[index];

    if (field === 'method_id') {
        const method = availablePaymentMethods.value.find(pm => pm.id === value);
        if (method) {
            paymentMethod.method_id = method.id;
            paymentMethod.method_name = method.name;
            paymentMethod.requires_reference = method.requires_reference;

            // Limpiar referencia si ya no es requerida
            if (!method.requires_reference) {
                paymentMethod.reference = '';
            }
        }
    } else {
        paymentMethod[field] = value;
    }
};

const getRemainingAmount = () => {
    const totalPaid = selectedPaymentMethods.value.reduce((sum, pm) => sum + parseFloat(pm.amount || 0), 0);
    return Math.max(0, cartTotal.value - totalPaid);
};

const getTotalPaymentAmount = () => {
    return selectedPaymentMethods.value.reduce((sum, pm) => sum + parseFloat(pm.amount || 0), 0);
};

const validateSelectedPaymentMethods = () => {
    // Verificar sesión activa antes de cualquier otra validación
    if (!hasActiveSession.value) {
        return { valid: false, message: 'Debe tener una sesión de caja activa' };
    }

    if (selectedPaymentMethods.value.length === 0) {
        return { valid: false, message: 'Debe seleccionar al menos un método de pago' };
    }

    // Validar que todos los métodos tengan datos completos
    for (let i = 0; i < selectedPaymentMethods.value.length; i++) {
        const pm = selectedPaymentMethods.value[i];

        if (!pm.method_id) {
            return { valid: false, message: `Método de pago ${i + 1}: Debe seleccionar un método` };
        }

        if (!pm.amount || pm.amount <= 0) {
            return { valid: false, message: `Método de pago ${i + 1}: Monto debe ser mayor a cero` };
        }

        if (pm.requires_reference && !pm.reference) {
            return { valid: false, message: `Método de pago ${i + 1}: Requiere número de referencia` };
        }

        // Validar límites del método de pago
        const method = availablePaymentMethods.value.find(m => m.id === pm.method_id);
        if (method) {
            const validation = paymentMethodsStore.validateMethod(pm.method_id, pm.amount, !!pm.reference);
            if (!validation.valid) {
                return { valid: false, message: `Método de pago ${i + 1}: ${validation.message}` };
            }
        }
    }

    // Validar suma total
    const totalPayments = getTotalPaymentAmount();
    const tolerance = 0.01;

    if (Math.abs(totalPayments - cartTotal.value) > tolerance) {
        return {
            valid: false,
            message: `La suma de pagos (${totalPayments.toFixed(2)}) debe coincidir con el total (${cartTotal.value.toFixed(2)})`
        };
    }

    // Validar solo un método en efectivo
    const cashMethods = selectedPaymentMethods.value.filter(pm => {
        const method = availablePaymentMethods.value.find(m => m.id === pm.method_id);
        return method && method.type === 'CASH';
    });

    if (cashMethods.length > 1) {
        return { valid: false, message: 'Solo se permite un método de pago en efectivo por venta' };
    }

    // Validar sesión de caja para métodos que la requieren
    const cashRegisterMethods = selectedPaymentMethods.value.filter(pm => {
        const method = availablePaymentMethods.value.find(m => m.id === pm.method_id);
        return method && method.requires_cash_register;
    });

    if (cashRegisterMethods.length > 0 && !hasActiveSession.value) {
        return { valid: false, message: 'Debe tener un turno de caja activo para procesar pagos en efectivo' };
    }

    return { valid: true, message: 'Métodos de pago válidos' };
};

const openMultiplePaymentDialog = () => {
    // Inicializar con un método de pago por defecto
    selectedPaymentMethods.value = [{
        method_id: null,
        method_name: '',
        amount: cartTotal.value,
        reference: '',
        requires_reference: false
    }];

    showMultiplePaymentDialog.value = true;
};

const getPaymentMethodIcon = (methodId) => {
    const method = availablePaymentMethods.value.find(pm => pm.id === methodId);
    if (!method) return 'pi-circle';

    const iconMap = {
        'CASH': 'pi-money-bill',
        'CARD': 'pi-credit-card',
        'TRANSFER': 'pi-send',
        'CREDIT': 'pi-clock'
    };

    return iconMap[method.type] || 'pi-circle';
};

const getPaymentMethodColor = (methodId) => {
    const method = availablePaymentMethods.value.find(pm => pm.id === methodId);
    if (!method) return 'secondary';

    const colorMap = {
        'CASH': 'success',
        'CARD': 'info',
        'TRANSFER': 'warning',
        'CREDIT': 'secondary'
    };

    return colorMap[method.type] || 'secondary';
};
</script>

<template>
    <Toast />
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <!-- Header -->
        <div class="bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-200">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex items-center justify-between h-20">
                    <!-- Session Info -->
                    <div class="flex items-center space-x-6">
                        <div class="flex items-center space-x-3">
                            <div
                                class="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                                <i class="pi pi-user text-white text-xl"></i>
                            </div>
                            <div>
                                <span class="font-bold text-gray-900 text-lg">
                                    {{ currentSessionInfo?.cashier || 'Sin sesión' }}
                                </span>
                                <div class="text-sm text-gray-500">Cajero</div>
                            </div>
                        </div>
                        <div class="hidden sm:flex items-center space-x-3 bg-gray-100 px-4 py-2 rounded-full">
                            <i class="pi pi-clock text-blue-600"></i>
                            <span class="text-sm font-medium text-gray-700">{{ currentSessionInfo ? formatDateTime(currentSessionInfo.openedAt) : '--' }}</span>
                        </div>
                    </div>

                    <!-- Customer and Cart Section -->
                    <div class="flex items-center space-x-4">
                        <!-- Customer Selection -->
                        <div class="flex items-center space-x-3">
                            <Button @click="showCustomerDialog = true"
                                :severity="selectedCustomer ? 'success' : 'secondary'" :outlined="!selectedCustomer"
                                class="h-14 px-4" size="large">
                                <i class="pi pi-user mr-2 text-lg"></i>
                                <span class="font-semibold">
                                    {{ selectedCustomer ? selectedCustomer.name.substring(0, 15) +
                                        (selectedCustomer.name.length > 15 ? '...' : '') : 'Cliente' }}
                                </span>
                            </Button>

                            <Button v-if="selectedCustomer" @click="clearCustomer" icon="pi pi-times" severity="danger"
                                text rounded size="small" class="w-8 h-8" v-tooltip="'Quitar cliente'" />
                        </div>

                        <!-- Cart Summary -->
                        <Button @click="showCartSummary = true" class="relative h-14 px-6" severity="info" outlined
                            size="large">
                            <i class="pi pi-shopping-cart mr-3 text-xl"></i>
                            <span class="font-semibold">Carrito</span>
                            <Badge v-if="cartItemsCount > 0" :value="cartItemsCount" severity="danger"
                                class="absolute -top-2 -right-2 text-xs" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>

        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <!-- Products Section -->
                <div class="lg:col-span-3 space-y-6">
                    <!-- Search and Filters Panel -->
                    <Panel header="Buscar Productos" class="shadow-xl border-0 bg-white/90 backdrop-blur-sm" :pt="{
                        header: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg',
                        content: 'p-6'
                    }">
                        <template #icons>
                            <i class="pi pi-search text-white"></i>
                        </template>

                        <div class="space-y-6">
                            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <!-- Enhanced Search -->
                                <div class="lg:col-span-2">
                                    <label class="block text-sm font-bold text-gray-700 mb-3">
                                        <i class="pi pi-search mr-2 text-blue-600"></i>
                                        Búsqueda de productos
                                    </label>
                                    <div class="relative">
                                        <InputText v-model="searchQuery"
                                            placeholder="Escribe el nombre del producto, código o SKU..." class="w-full text-lg py-4 pl-14 pr-12 border-2 border-gray-200 
                                                   focus:border-blue-500 focus:ring-4 focus:ring-blue-200/50 
                                                   rounded-xl transition-all duration-300 shadow-sm
                                                   hover:border-blue-300 hover:shadow-md
                                                   bg-white/80 backdrop-blur-sm" />
                                        <div v-if="isSearching"
                                            class="absolute right-4 top-1/2 transform -translate-y-1/2">
                                            <ProgressSpinner class="w-6 h-6" stroke-width="4" />
                                        </div>
                                    </div>
                                    <div class="flex items-center mt-2 text-xs text-gray-600">
                                        <i class="pi pi-info-circle mr-1 text-blue-500"></i>
                                        Búsqueda en tiempo real - mínimo 3 caracteres
                                    </div>
                                </div>

                                <!-- Enhanced Warehouse Filter -->
                                <div>
                                    <label class="block text-sm font-bold text-gray-700 mb-3">
                                        <i class="pi pi-building mr-2 text-blue-600"></i>
                                        Almacén preferido
                                    </label>
                                    <Select v-model="selectedWarehouse" :options="warehousesList" option-label="name"
                                        option-value="id" placeholder="Todos los almacenes..." class="w-full"
                                        :loading="isLoadingWarehouses" checkmark highlight-on-select :pt="{
                                            root: 'border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 rounded-xl shadow-sm transition-all duration-300 bg-white/80 backdrop-blur-sm',
                                            input: 'py-3 px-4 text-base font-medium',
                                            dropdown: 'p-3'
                                        }" />
                                    <div class="flex items-center mt-2 text-xs text-gray-600">
                                        <i class="pi pi-bookmark mr-1 text-blue-500"></i>
                                        Se guarda tu preferencia automáticamente
                                    </div>
                                </div>
                            </div>

                            <!-- Search Stats -->
                            <div v-if="searchQuery"
                                class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 px-6 py-4 rounded-xl">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center space-x-3">
                                        <div
                                            class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                            <i class="pi pi-chart-bar text-blue-600"></i>
                                        </div>
                                        <div>
                                            <div class="font-bold text-blue-900">
                                                {{ filteredProducts.length }} productos encontrados
                                            </div>
                                            <div v-if="selectedWarehouse" class="text-sm text-blue-700">
                                                en <span class="font-semibold">{{warehousesList.find(w => w.id ===
                                                    selectedWarehouse)?.name
                                                }}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Button @click="searchQuery = ''; searchResults = []" icon="pi pi-times"
                                        size="small" text rounded severity="secondary"
                                        class="hover:bg-blue-100 transition-colors duration-200"
                                        v-tooltip="'Limpiar búsqueda'" />
                                </div>
                            </div>
                        </div>
                    </Panel>

                    <!-- Products Grid -->
                    <div v-if="isSearching" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        <Card v-for="i in 10" :key="i" class="shadow-sm">
                            <template #content>
                                <div class="space-y-3">
                                    <Skeleton width="100%" height="8rem" />
                                    <Skeleton width="80%" height="1rem" />
                                    <Skeleton width="60%" height="1rem" />
                                    <Skeleton width="40%" height="1rem" />
                                </div>
                            </template>
                        </Card>
                    </div>

                    <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        <Card v-for="product in filteredProducts" :key="product.id" @click="addToCart(product)"
                            :data-product-id="product.id" class="cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl
                                   active:scale-95 touch-manipulation shadow-lg border-0 bg-white/90 backdrop-blur-sm
                                   hover:bg-white/95 group" :class="{
                                    'opacity-60 cursor-not-allowed': product.stock === 0,
                                    'ring-2 ring-red-200': product.stock === 0
                                }">
                            <template #content>
                                <div class="p-2">
                                    <!-- Product Image -->
                                    <div
                                        class="relative aspect-square mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden">
                                        <img :src="product.image" :alt="product.name"
                                            class="w-full h-full object-cover transition-all duration-300 group-hover:scale-110"
                                            @error="handleImageError($event)" @load="handleImageLoad($event)"
                                            v-if="product.image && !imageErrors[product.id]" />
                                        <!-- Fallback -->
                                        <div v-if="!product.image || imageErrors[product.id]"
                                            class="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                                            <div class="text-center">
                                                <i class="pi pi-shopping-bag text-4xl text-blue-400 mb-2"></i>
                                                <div class="text-xs text-blue-600 font-medium px-2 leading-tight">
                                                    {{ product.name.length > 15 ? product.name.substring(0, 15) + '...'
                                                        : product.name }}
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Stock overlay for out of stock -->
                                        <div v-if="product.stock === 0"
                                            class="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl">
                                            <Chip label="SIN STOCK" severity="danger" class="font-bold" />
                                        </div>
                                    </div>

                                    <!-- Product Info -->
                                    <div class="text-center space-y-2">
                                        <h3
                                            class="font-bold text-gray-900 text-sm leading-tight line-clamp-2 min-h-[2.5rem]">
                                            {{ product.name }}
                                        </h3>
                                        <div class="text-xl font-black text-blue-600">
                                            {{ formatCurrency(product.price) }}
                                        </div>

                                        <!-- Stock Badge -->
                                        <Tag :value="`Stock: ${product.stock}`"
                                            :severity="product.stock > 10 ? 'success' : product.stock > 0 ? 'warning' : 'danger'"
                                            class="text-xs font-bold" />
                                    </div>
                                </div>
                            </template>
                        </Card>
                    </div>

                    <!-- No Products Message -->
                    <div v-if="!isSearching && filteredProducts.length === 0 && searchQuery" class="text-center py-16">
                        <div class="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <i class="pi pi-search text-4xl text-gray-400"></i>
                        </div>
                        <h3 class="text-xl font-bold text-gray-600 mb-2">No se encontraron productos</h3>
                        <p class="text-gray-500">Intenta con otros términos de búsqueda</p>
                    </div>

                    <!-- Initial state message -->
                    <div v-if="!searchQuery && searchResults.length === 0" class="text-center py-16">
                        <div class="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <i class="pi pi-search text-4xl text-blue-500"></i>
                        </div>
                        <h3 class="text-xl font-bold text-gray-700 mb-2">Comienza buscando productos</h3>
                        <p class="text-gray-500">Escribe en el campo de búsqueda para encontrar productos</p>
                    </div>
                </div>

                <!-- Cart Sidebar (Desktop) -->
                <div class="hidden lg:block">
                    <Card class="sticky top-6 shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                        <template #header>
                            <div class="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-t-lg">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center space-x-3">
                                        <i class="pi pi-shopping-cart text-2xl"></i>
                                        <span class="text-xl font-bold">Carrito de Compras</span>
                                    </div>
                                    <Badge :value="cartItemsCount" severity="contrast" v-if="cartItemsCount > 0"
                                        class="text-lg px-3 py-1" />
                                </div>
                            </div>
                        </template>

                        <template #content>
                            <!-- Empty Cart -->
                            <div v-if="cart.length === 0" class="text-center py-12">
                                <div
                                    class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <i class="pi pi-shopping-cart text-4xl text-gray-400"></i>
                                </div>
                                <h4 class="font-bold text-gray-600 mb-2">El carrito está vacío</h4>
                                <p class="text-gray-500 text-sm">Añade productos para comenzar</p>
                            </div>

                            <!-- Cart Items -->
                            <div v-else class="space-y-4">
                                <div v-for="(item, index) in cart" :key="index"
                                    class="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200">
                                    <div class="flex items-start justify-between mb-3">
                                        <div class="flex-1 min-w-0">
                                            <h5 class="font-bold text-gray-900 truncate text-sm">{{ item.name }}</h5>
                                            <p class="text-blue-600 font-semibold text-sm">{{ formatCurrency(item.price)
                                            }}</p>
                                        </div>
                                        <Button @click="removeFromCart(index)" icon="pi pi-trash" size="small"
                                            severity="danger" text rounded class="ml-2 hover:bg-red-100" />
                                    </div>

                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center space-x-2 bg-white rounded-lg p-1 border">
                                            <Button @click="updateQuantity(item, item.quantity - 1)" icon="pi pi-minus"
                                                size="small" text rounded class="w-8 h-8 hover:bg-gray-100" />
                                            <span class="w-8 text-center font-bold text-lg">{{ item.quantity }}</span>
                                            <Button @click="updateQuantity(item, item.quantity + 1)" icon="pi pi-plus"
                                                size="small" text rounded class="w-8 h-8 hover:bg-gray-100" />
                                        </div>
                                        <div class="text-right">
                                            <div class="text-lg font-black text-green-600">
                                                {{ formatCurrency(item.subtotal) }}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Divider class="my-6" />

                                <!-- Total -->
                                <div
                                    class="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-200">
                                    <div class="flex justify-between items-center">
                                        <span class="text-xl font-bold text-gray-800">Total:</span>
                                        <span class="text-3xl font-black text-blue-600">{{ formatCurrency(cartTotal)
                                        }}</span>
                                    </div>
                                </div>

                                <!-- Actions -->
                                <div class="space-y-3 pt-4">
                                    <Button @click="openMultiplePaymentDialog" label="Procesar Pago" :disabled="!hasActiveSession"
                                        icon="pi pi-credit-card" class="w-full h-14 text-lg font-bold" size="large"
                                        severity="success" :loading="loading" />
                                    <Button @click="clearCart" label="Limpiar Carrito" icon="pi pi-trash"
                                        severity="secondary" outlined class="w-full h-12" />
                                </div>
                            </div>
                        </template>
                    </Card>
                </div>
            </div>
        </div>

        <!-- Mobile Cart Dialog -->
        <Dialog v-model:visible="showCartSummary" header="Carrito de Compras" :modal="true" class="lg:hidden"
            :style="{ width: '95vw', maxWidth: '500px' }" :pt="{
                header: 'bg-gradient-to-r from-green-600 to-emerald-600 text-white',
                content: 'p-6'
            }">
            <template #header>
                <div class="flex items-center space-x-3">
                    <i class="pi pi-shopping-cart text-xl"></i>
                    <span class="text-xl font-bold">Mi Carrito</span>
                    <Badge :value="cartItemsCount" severity="contrast" v-if="cartItemsCount > 0" />
                </div>
            </template>

            <!-- Mobile Cart Content -->
            <div v-if="cart.length === 0" class="text-center py-12">
                <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="pi pi-shopping-cart text-4xl text-gray-400"></i>
                </div>
                <h4 class="font-bold text-gray-600 mb-2">El carrito está vacío</h4>
                <p class="text-gray-500 text-sm">Añade productos para comenzar</p>
            </div>

            <div v-else class="space-y-4">
                <div v-for="(item, index) in cart" :key="index"
                    class="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
                    <div class="flex items-start justify-between mb-3">
                        <div class="flex-1 min-w-0">
                            <h5 class="font-bold text-gray-900 truncate">{{ item.name }}</h5>
                            <p class="text-blue-600 font-semibold">{{ formatCurrency(item.price) }}</p>
                        </div>
                        <Button @click="removeFromCart(index)" icon="pi pi-trash" size="small" severity="danger" text
                            rounded class="ml-2" />
                    </div>

                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-2 bg-white rounded-lg p-1 border">
                            <Button @click="updateQuantity(item, item.quantity - 1)" icon="pi pi-minus" size="small"
                                text rounded class="w-10 h-10" />
                            <span class="w-8 text-center font-bold text-lg">{{ item.quantity }}</span>
                            <Button @click="updateQuantity(item, item.quantity + 1)" icon="pi pi-plus" size="small" text
                                rounded class="w-10 h-10" />
                        </div>
                        <div class="text-right">
                            <div class="text-lg font-black text-green-600">
                                {{ formatCurrency(item.subtotal) }}
                            </div>
                        </div>
                    </div>
                </div>

                <Divider class="my-6" />

                <div class="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-200">
                    <div class="flex justify-between items-center">
                        <span class="text-xl font-bold text-gray-800">Total:</span>
                        <span class="text-3xl font-black text-blue-600">{{ formatCurrency(cartTotal) }}</span>
                    </div>
                </div>

                <div class="space-y-3 pt-4">
                    <Button @click="openMultiplePaymentDialog(); showCartSummary = false" label="Procesar Pago" :disabled="!hasActiveSession"
                        icon="pi pi-credit-card" class="w-full h-14 text-lg font-bold" size="large" severity="success"
                        :loading="loading" />
                    <Button @click="clearCart" label="Limpiar Carrito" icon="pi pi-trash" severity="secondary" outlined
                        class="w-full h-12" />
                </div>
            </div>
        </Dialog>

        <!-- Multiple Payment Methods Dialog -->
        <Dialog v-model:visible="showMultiplePaymentDialog" header="Métodos de Pago" :modal="true"
            :style="{ width: '95vw', maxWidth: '900px' }" :pt="{
                header: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white',
                content: 'p-6'
            }">
            <template #header>
                <div class="flex items-center space-x-3">
                    <i class="pi pi-credit-card text-xl"></i>
                    <span class="text-xl font-bold">Configurar Métodos de Pago</span>
                </div>
            </template>

            <div class="space-y-6 mt-2">
                <!-- Order Summary -->
                <div class="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border-2 border-blue-200">
                    <div class="flex justify-between items-center">
                        <span class="text-lg font-bold text-gray-800">TOTAL A PAGAR:</span>
                        <span class="text-2xl font-black text-blue-600">{{ formatCurrency(cartTotal) }}</span>
                    </div>
                </div>

                <!-- Payment Methods Configuration -->
                <div class="space-y-4">
                    <div class="flex justify-between items-center">
                        <h3 class="text-lg font-bold text-gray-800">
                            <i class="pi pi-wallet mr-2 text-purple-600"></i>
                            Métodos de Pago
                        </h3>
                        <Button @click="addPaymentMethod" label="Agregar Método" icon="pi pi-plus" size="small"
                            severity="success" outlined :disabled="selectedPaymentMethods.length >= 10" />
                    </div>

                    <!-- Payment Methods List -->
                    <div class="space-y-3" v-if="selectedPaymentMethods.length > 0">
                        <Card v-for="(payment, index) in selectedPaymentMethods" :key="index"
                            class="shadow-sm border border-gray-200">
                            <template #content>
                                <div class="space-y-4">
                                    <div class="flex justify-between items-start">
                                        <h4 class="font-semibold text-gray-800">Método de Pago {{ index + 1 }}</h4>
                                        <Button @click="removePaymentMethod(index)" icon="pi pi-trash" size="small"
                                            severity="danger" text rounded v-if="selectedPaymentMethods.length > 1" />
                                    </div>

                                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <!-- Method Selection -->
                                        <div>
                                            <label class="block text-sm font-bold text-gray-700 mb-2">Método</label>
                                            <Select v-model="payment.method_id"
                                                @change="updatePaymentMethod(index, 'method_id', $event.value)"
                                                :options="availablePaymentMethods" option-label="name" option-value="id"
                                                placeholder="Seleccionar método..." class="w-full" :pt="{
                                                    root: 'border-2 border-gray-200 hover:border-purple-300 focus:border-purple-500 rounded-lg',
                                                    input: 'py-2 px-3 text-sm'
                                                }">
                                                <template #option="{ option }">
                                                    <div class="flex items-center space-x-2">
                                                        <i :class="getPaymentMethodIcon(option.id)" :style="{
                                                            color: getPaymentMethodColor(option.id) === 'success' ? '#10b981' :
                                                                getPaymentMethodColor(option.id) === 'info' ? '#3b82f6' :
                                                                    getPaymentMethodColor(option.id) === 'warning' ? '#f59e0b' : '#6b7280'
                                                        }"></i>
                                                        <span>{{ option.name }}</span>
                                                        <Tag :value="option.type" size="small"
                                                            :severity="getPaymentMethodColor(option.id)" />
                                                    </div>
                                                </template>
                                            </Select>
                                        </div>

                                        <!-- Amount -->
                                        <div>
                                            <label class="block text-sm font-bold text-gray-700 mb-2">Monto</label>
                                            <div class="p-inputgroup">
                                                <span class="p-inputgroup-addon">S/</span>
                                                <InputNumber v-model="payment.amount"
                                                    @input="updatePaymentMethod(index, 'amount', $event)" :min="0"
                                                    :max="cartTotal" mode="decimal" :minFractionDigits="2"
                                                    :maxFractionDigits="2" class="flex-1" :pt="{
                                                        input: 'py-2 px-3 text-sm border-l-0'
                                                    }" />
                                            </div>
                                        </div>

                                        <!-- Reference -->
                                        <div>
                                            <label class="block text-sm font-bold text-gray-700 mb-2">
                                                Referencia
                                                <span v-if="payment.requires_reference" class="text-red-500">*</span>
                                            </label>
                                            <InputText v-model="payment.reference"
                                                @input="updatePaymentMethod(index, 'reference', $event.target.value)"
                                                :placeholder="payment.requires_reference ? 'Número de referencia' : 'Opcional'"
                                                :disabled="!payment.method_id" class="w-full" :pt="{
                                                    root: 'border-2 border-gray-200 hover:border-purple-300 focus:border-purple-500 rounded-lg',
                                                    input: 'py-2 px-3 text-sm'
                                                }" />
                                        </div>
                                    </div>

                                    <!-- Method Info -->
                                    <div v-if="payment.method_id" class="bg-gray-50 p-3 rounded-lg">
                                        <div class="flex items-center justify-between text-sm">
                                            <div class="flex items-center space-x-2">
                                                <i :class="getPaymentMethodIcon(payment.method_id)"
                                                    class="text-gray-600"></i>
                                                <span class="font-medium">{{ payment.method_name }}</span>
                                            </div>
                                            <div class="flex items-center space-x-4 text-xs text-gray-600">
                                                <span v-if="payment.requires_reference">
                                                    <i class="pi pi-info-circle mr-1"></i>
                                                    Requiere referencia
                                                </span>
                                                <span>
                                                    <i class="pi pi-calculator mr-1"></i>
                                                    {{ formatCurrency(payment.amount || 0) }}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </template>
                        </Card>
                    </div>

                    <!-- Payment Summary -->
                    <div class="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border-2 border-green-200">
                        <div class="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <div class="text-sm text-gray-600">Total a Pagar</div>
                                <div class="text-lg font-bold text-gray-800">{{ formatCurrency(cartTotal) }}</div>
                            </div>
                            <div>
                                <div class="text-sm text-gray-600">Total Pagos</div>
                                <div class="text-lg font-bold"
                                    :class="getTotalPaymentAmount() === cartTotal ? 'text-green-600' : 'text-orange-600'">
                                    {{ formatCurrency(getTotalPaymentAmount()) }}
                                </div>
                            </div>
                            <div>
                                <div class="text-sm text-gray-600">Restante</div>
                                <div class="text-lg font-bold"
                                    :class="getRemainingAmount() === 0 ? 'text-green-600' : 'text-red-600'">
                                    {{ formatCurrency(getRemainingAmount()) }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Voucher Type and Payment Status -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-3">
                            <i class="pi pi-file-text mr-2 text-purple-600"></i>
                            Tipo de Comprobante
                        </label>
                        <Select v-model="voucherType" :options="availableVoucherTypes" option-label="label"
                            option-value="value" class="w-full" :pt="{
                                root: 'border-2 border-gray-200 hover:border-purple-300 focus:border-purple-500 rounded-xl shadow-sm transition-all duration-300',
                                input: 'py-3 px-4 text-base font-medium',
                                dropdown: 'p-3'
                            }" />
                    </div>

                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-3">
                            <i class="pi pi-check-circle mr-2 text-purple-600"></i>
                            Estado del Pago
                        </label>
                        <div class="flex gap-3">
                            <Button @click="paymentStatus = 'PAGADO'" :label="'Pagado'" :icon="'pi pi-check'"
                                :outlined="paymentStatus !== 'PAGADO'"
                                :severity="paymentStatus === 'PAGADO' ? 'success' : 'secondary'"
                                class="flex-1 h-12 font-semibold" />
                            <Button @click="paymentStatus = 'PENDIENTE'" :label="'Pendiente'" :icon="'pi pi-clock'"
                                :outlined="paymentStatus !== 'PENDIENTE'"
                                :severity="paymentStatus === 'PENDIENTE' ? 'warning' : 'secondary'"
                                class="flex-1 h-12 font-semibold" />
                        </div>
                    </div>
                </div>

                <!-- Actions -->
                <div class="flex space-x-4 pt-6 border-t border-gray-200">
                    <Button @click="showMultiplePaymentDialog = false" label="Cancelar" icon="pi pi-times"
                        severity="secondary" outlined class="flex-1 h-14 text-lg font-semibold" />
                    <Button @click="processPayment" label="Confirmar Pago" icon="pi pi-check" severity="success"
                        class="flex-1 h-14 text-lg font-bold" :loading="loading"
                        :disabled="getRemainingAmount() !== 0 || selectedPaymentMethods.length === 0" />
                </div>
            </div>
        </Dialog>

        <!-- Batch Selection Dialog -->
        <Dialog v-model:visible="showBatchDialog" header="Seleccionar Lote" :modal="true"
            :style="{ width: '95vw', maxWidth: '800px' }" :pt="{
                header: 'bg-gradient-to-r from-orange-600 to-red-600 text-white',
                content: 'p-6'
            }">
            <template #header>
                <div class="flex items-center space-x-3">
                    <i class="pi pi-tag text-xl"></i>
                    <span class="text-xl font-bold">Seleccionar Lote - {{ selectedProductForBatch?.name }}</span>
                </div>
            </template>

            <div v-if="selectedProductForBatch" class="space-y-4 mt-2">
                <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div class="flex items-center space-x-2 mb-2">
                        <i class="pi pi-info-circle text-blue-600"></i>
                        <span class="font-semibold text-blue-800">Información del Producto</span>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div><strong>SKU:</strong> {{ selectedProductForBatch.sku }}</div>
                        <div><strong>Código de Barras:</strong> {{ selectedProductForBatch.barcode }}</div>
                        <div><strong>Stock Total:</strong> {{ selectedProductForBatch.stock }} unidades</div>
                    </div>
                </div>

                <div class="grid grid-cols-1 gap-4">
                    <Card v-for="batch in selectedProductForBatch.stock_info?.batches" :key="batch.batch_id"
                        @click="selectBatch(batch)"
                        class="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-102 border-2 border-gray-200 hover:border-orange-300">
                        <template #content>
                            <div class="space-y-3">
                                <!-- Batch Header -->
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center space-x-2">
                                        <i class="pi pi-tag text-orange-600"></i>
                                        <span class="font-bold text-lg text-gray-800">{{ batch.batch_code }}</span>
                                    </div>
                                    <Tag :value="`${parseFloat(batch.available_quantity).toFixed(2)} unidades`"
                                        :severity="batch.available_quantity > 10 ? 'success' : batch.available_quantity > 0 ? 'warning' : 'danger'"
                                        class="font-bold" />
                                </div>

                                <!-- Batch Details -->
                                <div class="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                                    <div class="bg-green-50 p-3 rounded-lg">
                                        <div class="text-green-600 font-semibold mb-1">Precio de Venta</div>
                                        <div class="text-xl font-bold text-green-700">{{
                                            formatCurrency(parseFloat(batch.sale_price)) }}</div>
                                    </div>

                                    <div class="bg-blue-50 p-3 rounded-lg">
                                        <div class="text-blue-600 font-semibold mb-1">Stock Disponible</div>
                                        <div class="text-xl font-bold text-blue-700">{{
                                            parseFloat(batch.available_quantity).toFixed(2) }}
                                        </div>
                                    </div>

                                    <div class="bg-purple-50 p-3 rounded-lg">
                                        <div class="text-purple-600 font-semibold mb-1">Fecha de Vencimiento</div>
                                        <div class="font-bold text-purple-700">{{ new
                                            Date(batch.expiration_date).toLocaleDateString('es-PE') }}</div>
                                    </div>

                                    <div class="bg-yellow-50 p-3 rounded-lg">
                                        <div class="text-yellow-600 font-semibold mb-1">Días para Vencer</div>
                                        <div class="font-bold" :class="{
                                            'text-red-700': batch.days_to_expire <= 7,
                                            'text-yellow-700': batch.days_to_expire > 7 && batch.days_to_expire <= 30,
                                            'text-green-700': batch.days_to_expire > 30
                                        }">
                                            {{ Math.ceil(batch.days_to_expire) }} días
                                        </div>
                                    </div>
                                </div>

                                <!-- Warning for near expiration -->
                                <div v-if="batch.days_to_expire <= 30"
                                    class="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                                    <div class="flex items-center space-x-2">
                                        <i class="pi pi-exclamation-triangle text-yellow-600"></i>
                                        <span class="text-yellow-800 font-medium">
                                            <span v-if="batch.days_to_expire <= 7">¡Producto próximo a vencer!</span>
                                            <span v-else>Producto se vence pronto</span>
                                        </span>
                                    </div>
                                </div>

                                <!-- Action Hint -->
                                <div class="text-center pt-2">
                                    <Button icon="pi pi-plus" label="Seleccionar este lote" severity="success" outlined
                                        class="hover:bg-green-50 transition-colors duration-200" />
                                </div>
                            </div>
                        </template>
                    </Card>
                </div>

                <!-- Cancel Action -->
                <div class="flex justify-end pt-4 border-t border-gray-200">
                    <Button @click="showBatchDialog = false; selectedProductForBatch = null" label="Cancelar"
                        icon="pi pi-times" severity="secondary" outlined />
                </div>
            </div>
        </Dialog>

        <!-- Customer Selection Dialog -->
        <Dialog v-model:visible="showCustomerDialog" header="Seleccionar Cliente" :modal="true"
            :style="{ width: '95vw', maxWidth: '600px' }" :pt="{
                header: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white',
                content: 'p-6'
            }">
            <template #header>
                <div class="flex items-center space-x-3">
                    <i class="pi pi-users text-xl"></i>
                    <span class="text-xl font-bold">Buscar y Seleccionar Cliente</span>
                </div>
            </template>

            <div class="space-y-6 mt-2">
                <!-- Customer Search -->
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-3">
                        <i class="pi pi-search mr-2 text-purple-600"></i>
                        Buscar cliente por nombre o documento
                    </label>
                    <AutoComplete v-model="customerSearch" :suggestions="customerResults"
                        @complete="searchCustomersDebounced($event.query)" option-label="name"
                        placeholder="Escriba el nombre o documento del cliente..." :loading="isSearchingCustomers"
                        :min-length="2" class="w-full" :pt="{
                            root: 'w-full',
                            input: 'w-full py-3 px-4 text-base border-2 border-gray-200 hover:border-purple-300 focus:border-purple-500 rounded-xl',
                            panel: 'bg-white border border-gray-300 rounded-lg shadow-lg mt-1',
                            list: 'max-h-60 overflow-auto p-2',
                            item: 'p-3 hover:bg-purple-50 rounded-lg cursor-pointer border-b border-gray-100'
                        }">
                        <template #option="{ option }">
                            <div @click="selectCustomer(option)" class="w-full">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <div class="font-semibold text-gray-800">{{ option.name }}</div>
                                        <div class="text-sm text-gray-600">
                                            {{ option.identity_document_type?.toUpperCase() }}: {{
                                                option.identity_document || 'Sin documento' }}
                                        </div>
                                    </div>
                                    <div class="text-xs text-gray-500">
                                        {{ option.email || 'Sin email' }}
                                    </div>
                                </div>
                            </div>
                        </template>
                    </AutoComplete>
                    <div class="flex items-center mt-2 text-xs text-gray-600">
                        <i class="pi pi-info-circle mr-1 text-purple-500"></i>
                        Escriba al menos 2 caracteres para buscar
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="border-t border-gray-200 pt-6">
                    <div class="flex justify-between items-center">
                        <Button @click="showCreateCustomerDialog = true; showCustomerDialog = false"
                            label="Crear Nuevo Cliente" icon="pi pi-plus" severity="success" outlined
                            class="font-semibold" />

                        <Button @click="showCustomerDialog = false" label="Cancelar" icon="pi pi-times"
                            severity="secondary" outlined />
                    </div>
                </div>
            </div>
        </Dialog>

        <!-- Create Customer Dialog -->
        <Dialog v-model:visible="showCreateCustomerDialog" header="Crear Nuevo Cliente" :modal="true"
            :style="{ width: '95vw', maxWidth: '500px' }" :pt="{
                header: 'bg-gradient-to-r from-green-600 to-emerald-600 text-white',
                content: 'p-6'
            }">
            <template #header>
                <div class="flex items-center space-x-3">
                    <i class="pi pi-user-plus text-xl"></i>
                    <span class="text-xl font-bold">Nuevo Cliente</span>
                </div>
            </template>

            <div class="space-y-4 mt-2">
                <!-- Name -->
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2">
                        Nombre completo <span class="text-red-500">*</span>
                    </label>
                    <InputText v-model="newCustomer.name" placeholder="Nombre completo del cliente"
                        class="w-full py-3 px-4 border-2 border-gray-200 focus:border-green-500 rounded-xl" />
                </div>

                <!-- Identity Document -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-2">Tipo</label>
                        <Select v-model="newCustomer.identity_document_type" :options="[
                            { label: 'DNI', value: 'dni' },
                            { label: 'RUC', value: 'ruc' },
                            { label: 'Pasaporte', value: 'passport' },
                            { label: 'Otro', value: 'other' }
                        ]" option-label="label" option-value="value" class="w-full" />
                    </div>
                    <div class="md:col-span-2">
                        <label class="block text-sm font-bold text-gray-700 mb-2">Número de documento</label>
                        <InputText v-model="newCustomer.identity_document" placeholder="Número de documento"
                            class="w-full py-3 px-4 border-2 border-gray-200 focus:border-green-500 rounded-xl" />
                    </div>
                </div>

                <!-- Email -->
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2">Email</label>
                    <InputText v-model="newCustomer.email" type="email" placeholder="email@ejemplo.com"
                        class="w-full py-3 px-4 border-2 border-gray-200 focus:border-green-500 rounded-xl" />
                </div>

                <!-- Phone -->
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2">Teléfono</label>
                    <InputText v-model="newCustomer.phone" placeholder="987654321"
                        class="w-full py-3 px-4 border-2 border-gray-200 focus:border-green-500 rounded-xl" />
                </div>

                <!-- Actions -->
                <div class="flex space-x-3 pt-4 border-t border-gray-200">
                    <Button @click="showCreateCustomerDialog = false; showCustomerDialog = true" label="Cancelar"
                        icon="pi pi-times" severity="secondary" outlined class="flex-1" />
                    <Button @click="createQuickCustomer" label="Crear Cliente" icon="pi pi-check" severity="success"
                        class="flex-1 font-semibold" :loading="loading" />
                </div>
            </div>
        </Dialog>

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
    transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
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