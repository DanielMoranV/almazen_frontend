# 💰 Sistema de Control de Caja - Documentación API

## 📋 Índice
1. [Visión General](#visión-general)
2. [Autenticación](#autenticación)
3. [Métodos de Pago](#métodos-de-pago)
4. [Cajas Registradoras](#cajas-registradoras)
5. [Sesiones de Caja](#sesiones-de-caja)
6. [Movimientos de Caja](#movimientos-de-caja)
7. [Ventas con Pagos Múltiples](#ventas-con-pagos-múltiples)
8. [Códigos de Error](#códigos-de-error)
9. [Ejemplos de Flujo Completo](#ejemplos-de-flujo-completo)

---

## 🎯 Visión General

El sistema de control de caja permite:
- Gestionar múltiples métodos de pago por venta
- Controlar turnos de caja con apertura y cierre
- Registrar movimientos automáticos de efectivo
- Generar reportes detallados de sesiones
- Validar límites y referencias por método de pago

### Base URL
```
https://tu-dominio.com/api
```

### Headers Requeridos
```http
Authorization: Bearer {jwt_token}
Content-Type: application/json
Accept: application/json
```

---

## 🔐 Autenticación

Todos los endpoints requieren autenticación JWT. El token debe incluirse en el header `Authorization`.

**Middleware aplicado:**
- `jwt` - Validación de token JWT
- `check_token_version` - Verificación de versión de token
- `check.company` - Validación de empresa del usuario

---

## 💳 Métodos de Pago

### GET `/api/payment-methods`
Obtiene la lista de métodos de pago de la empresa.

#### Query Parameters
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `active_only` | boolean | No | Solo métodos activos |
| `type` | string | No | Filtrar por tipo: `CASH`, `CARD`, `TRANSFER`, `CREDIT` |
| `requires_cash_register` | boolean | No | Métodos que requieren caja |

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "company_id": "uuid",
      "name": "Efectivo",
      "code": "CASH",
      "type": "CASH",
      "requires_cash_register": true,
      "requires_reference": false,
      "max_amount": "10000.00",
      "min_amount": "0.01",
      "is_active": true,
      "created_at": "2025-01-23T10:00:00.000000Z",
      "updated_at": "2025-01-23T10:00:00.000000Z"
    },
    {
      "id": 2,
      "company_id": "uuid",
      "name": "Tarjeta de Débito",
      "code": "DEBIT_CARD",
      "type": "CARD",
      "requires_cash_register": false,
      "requires_reference": true,
      "max_amount": "50000.00",
      "min_amount": "1.00",
      "is_active": true,
      "created_at": "2025-01-23T10:00:00.000000Z",
      "updated_at": "2025-01-23T10:00:00.000000Z"
    }
  ]
}
```

### POST `/api/payment-methods`
Crea un nuevo método de pago.

#### Request Body
```json
{
  "name": "Yape",
  "code": "YAPE",
  "type": "TRANSFER",
  "requires_cash_register": false,
  "requires_reference": true,
  "max_amount": 500.00,
  "min_amount": 1.00
}
```

#### Validaciones
| Campo | Reglas |
|-------|--------|
| `name` | required, string, max:100 |
| `code` | required, string, max:20, regex:/^[A-Z0-9_]+$/, unique por empresa |
| `type` | required, in:CASH,CARD,TRANSFER,CREDIT |
| `requires_cash_register` | boolean |
| `requires_reference` | boolean |
| `max_amount` | nullable, numeric, min:0, max:999999.99 |
| `min_amount` | nullable, numeric, min:0, max:999999.99 |

#### Respuesta Exitosa (201)
```json
{
  "success": true,
  "message": "Método de pago creado exitosamente",
  "data": {
    "id": 8,
    "company_id": "uuid",
    "name": "Yape",
    "code": "YAPE",
    "type": "TRANSFER",
    "requires_cash_register": false,
    "requires_reference": true,
    "max_amount": "500.00",
    "min_amount": "1.00",
    "is_active": true,
    "created_at": "2025-01-23T10:00:00.000000Z",
    "updated_at": "2025-01-23T10:00:00.000000Z"
  }
}
```

### GET `/api/payment-methods/{id}`
Obtiene un método de pago específico con estadísticas de uso.

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "company_id": "uuid",
    "name": "Efectivo",
    "code": "CASH",
    "type": "CASH",
    "requires_cash_register": true,
    "requires_reference": false,
    "max_amount": "10000.00",
    "min_amount": "0.01",
    "is_active": true,
    "statistics": {
      "total_transactions": 150,
      "total_amount": "45230.50",
      "transactions_today": 12,
      "amount_today": "1250.00"
    },
    "created_at": "2025-01-23T10:00:00.000000Z",
    "updated_at": "2025-01-23T10:00:00.000000Z"
  }
}
```

### PUT `/api/payment-methods/{id}`
Actualiza un método de pago existente.

#### Request Body
```json
{
  "name": "Efectivo Actualizado",
  "max_amount": 15000.00,
  "is_active": true
}
```

#### Validaciones
| Campo | Reglas |
|-------|--------|
| `name` | string, max:100 |
| `requires_cash_register` | boolean |
| `requires_reference` | boolean |
| `max_amount` | nullable, numeric, min:0, max:999999.99 |
| `min_amount` | nullable, numeric, min:0, max:999999.99 |
| `is_active` | boolean |

### DELETE `/api/payment-methods/{id}`
Elimina un método de pago (solo si no tiene transacciones asociadas).

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "message": "Método de pago eliminado exitosamente"
}
```

#### Error (422)
```json
{
  "success": false,
  "message": "No se puede eliminar un método de pago con transacciones asociadas. Considere desactivarlo en su lugar."
}
```

---

## 🏪 Cajas Registradoras

### GET `/api/cash-registers`
Obtiene la lista de cajas registradoras de la empresa.

#### Query Parameters
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `active_only` | boolean | No | Solo cajas activas |

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "company_id": "uuid",
      "name": "Caja Principal",
      "code": "MAIN_REGISTER",
      "location": "Mostrador Principal",
      "max_cash_amount": "2000.00",
      "max_discrepancy": "5.00",
      "allow_concurrent_sessions": false,
      "is_active": true,
      "status": {
        "is_active": true,
        "has_active_sessions": false,
        "active_sessions_count": 0,
        "can_open_session": true
      },
      "active_sessions": [],
      "created_at": "2025-01-23T10:00:00.000000Z",
      "updated_at": "2025-01-23T10:00:00.000000Z"
    }
  ]
}
```

### POST `/api/cash-registers`
Crea una nueva caja registradora.

#### Request Body
```json
{
  "name": "Caja Secundaria",
  "code": "SECONDARY_REGISTER",
  "location": "Mostrador 2",
  "max_cash_amount": 1500.00,
  "max_discrepancy": 3.00,
  "allow_concurrent_sessions": false
}
```

#### Validaciones
| Campo | Reglas |
|-------|--------|
| `name` | required, string, max:100 |
| `code` | required, string, max:50, regex:/^[A-Z0-9_]+$/, unique por empresa |
| `location` | nullable, string, max:200 |
| `max_cash_amount` | nullable, numeric, min:0, max:999999.99 |
| `max_discrepancy` | nullable, numeric, min:0, max:999.99 |
| `allow_concurrent_sessions` | boolean |

### GET `/api/cash-registers/{id}`
Obtiene una caja registradora específica con estadísticas.

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "company_id": "uuid",
    "name": "Caja Principal",
    "code": "MAIN_REGISTER",
    "location": "Mostrador Principal",
    "max_cash_amount": "2000.00",
    "max_discrepancy": "5.00",
    "allow_concurrent_sessions": false,
    "is_active": true,
    "cash_sessions": [
      {
        "id": 1,
        "status": "CLOSED",
        "opened_at": "2025-01-23T08:00:00.000000Z",
        "closed_at": "2025-01-23T16:00:00.000000Z",
        "user": {
          "id": 1,
          "name": "Juan Pérez"
        }
      }
    ],
    "active_sessions": [],
    "statistics": {
      "total_sessions": 25,
      "active_sessions": 0,
      "sessions_today": 1,
      "total_sales_today": "1250.50"
    },
    "created_at": "2025-01-23T10:00:00.000000Z",
    "updated_at": "2025-01-23T10:00:00.000000Z"
  }
}
```

---

## 🕐 Sesiones de Caja

### POST `/api/cash-sessions/open`
Abre una nueva sesión de caja.

#### Request Body
```json
{
  "cash_register_id": 1,
  "opening_amount": 100.00,
  "notes": "Turno matutino"
}
```

#### Validaciones
| Campo | Reglas |
|-------|--------|
| `cash_register_id` | required, integer, exists:cash_registers,id |
| `opening_amount` | required, numeric, min:0, max:999999.99 |
| `notes` | nullable, string, max:1000 |

#### Validaciones de Negocio
- ✅ Usuario no debe tener otra sesión abierta
- ✅ Caja debe estar activa
- ✅ Caja debe permitir nueva sesión (si no permite concurrencia)
- ✅ Monto de apertura no debe exceder límite máximo de caja

#### Respuesta Exitosa (201)
```json
{
  "success": true,
  "message": "Sesión de caja abierta exitosamente",
  "data": {
    "session": {
      "id": 1,
      "company_id": "uuid",
      "cash_register_id": 1,
      "user_id": 1,
      "opening_amount": "100.00",
      "actual_amount": null,
      "status": "OPEN",
      "opened_at": "2025-01-23T08:00:00.000000Z",
      "closed_at": null,
      "notes": "Turno matutino",
      "cash_register": {
        "id": 1,
        "name": "Caja Principal",
        "code": "MAIN_REGISTER"
      },
      "user": {
        "id": 1,
        "name": "Juan Pérez"
      },
      "created_at": "2025-01-23T08:00:00.000000Z",
      "updated_at": "2025-01-23T08:00:00.000000Z"
    }
  }
}
```

#### Errores Comunes (422)
```json
{
  "success": false,
  "message": "Error de validación",
  "errors": {
    "user": ["Ya tiene una sesión de caja abierta"],
    "cash_register": ["Esta caja registradora ya tiene una sesión activa"],
    "opening_amount": ["El monto de apertura excede el límite máximo de la caja"]
  }
}
```

### GET `/api/cash-sessions/current`
Obtiene la sesión activa del usuario actual.

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": {
    "session": {
      "id": 1,
      "company_id": "uuid",
      "cash_register_id": 1,
      "user_id": 1,
      "opening_amount": "100.00",
      "actual_amount": null,
      "status": "OPEN",
      "opened_at": "2025-01-23T08:00:00.000000Z",
      "closed_at": null,
      "notes": "Turno matutino",
      "expected_amount": "545.30",
      "cash_register": {
        "id": 1,
        "name": "Caja Principal",
        "code": "MAIN_REGISTER"
      },
      "user": {
        "id": 1,
        "name": "Juan Pérez"
      }
    },
    "summary": {
      "expected_amount": "545.30",
      "total_sales": "445.30",
      "transaction_count": 15,
      "duration_minutes": 480
    }
  }
}
```

#### Sin Sesión Activa (404)
```json
{
  "success": false,
  "message": "No tiene una sesión de caja activa"
}
```

### PUT `/api/cash-sessions/{id}/close`
Cierra una sesión de caja.

#### Request Body
```json
{
  "actual_amount": 545.30,
  "notes": "Todo correcto, sin diferencias"
}
```

#### Validaciones
| Campo | Reglas |
|-------|--------|
| `actual_amount` | required, numeric, min:0, max:999999.99 |
| `notes` | nullable, string, max:1000 |

#### Validaciones de Negocio
- ✅ Sesión debe existir y estar abierta
- ✅ Usuario debe ser el propietario de la sesión (o supervisor)
- ✅ Monto actual debe ser válido

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "message": "Sesión de caja cerrada exitosamente",
  "data": {
    "session": {
      "id": 1,
      "company_id": "uuid",
      "cash_register_id": 1,
      "user_id": 1,
      "opening_amount": "100.00",
      "actual_amount": "545.30",
      "status": "CLOSED",
      "opened_at": "2025-01-23T08:00:00.000000Z",
      "closed_at": "2025-01-23T16:00:00.000000Z",
      "notes": "Turno matutino\n\n--- Cierre ---\nTodo correcto, sin diferencias",
      "expected_amount": "545.30",
      "difference_amount": "0.00",
      "cash_register": {
        "id": 1,
        "name": "Caja Principal"
      },
      "user": {
        "id": 1,
        "name": "Juan Pérez"
      },
      "cash_movements": [
        {
          "id": 1,
          "type": "SALE",
          "amount": "50.00",
          "description": "Venta #B001-00001",
          "created_at": "2025-01-23T09:00:00.000000Z"
        }
      ]
    },
    "summary": {
      "expected_amount": "545.30",
      "actual_amount": "545.30",
      "difference": "0.00",
      "total_sales": "445.30",
      "transaction_count": 15,
      "duration_minutes": 480
    }
  }
}
```

### GET `/api/cash-sessions/{id}/report`
Obtiene un reporte detallado de una sesión.

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": {
    "session": {
      "id": 1,
      "company_id": "uuid",
      "cash_register_id": 1,
      "user_id": 1,
      "opening_amount": "100.00",
      "actual_amount": "545.30",
      "status": "CLOSED",
      "opened_at": "2025-01-23T08:00:00.000000Z",
      "closed_at": "2025-01-23T16:00:00.000000Z",
      "expected_amount": "545.30",
      "difference_amount": "0.00",
      "cash_register": {
        "id": 1,
        "name": "Caja Principal",
        "code": "MAIN_REGISTER"
      },
      "user": {
        "id": 1,
        "name": "Juan Pérez"
      }
    },
    "summary": {
      "opening_amount": "100.00",
      "expected_amount": "545.30",
      "actual_amount": "545.30",
      "difference_amount": "0.00",
      "duration_minutes": 480,
      "is_closed": true,
      "has_discrepancy": false
    },
    "movements_summary": {
      "total_sales": "445.30",
      "sales_count": 15,
      "total_adjustments": "0.00",
      "total_expenses": "0.00",
      "total_deposits": "0.00",
      "total_withdrawals": "0.00"
    },
    "movements": [
      {
        "id": 1,
        "type": "SALE",
        "reference_type": "sale",
        "reference_id": 1,
        "amount": "50.00",
        "description": "Venta #B001-00001",
        "created_by": 1,
        "created_at": "2025-01-23T09:00:00.000000Z",
        "creator": {
          "id": 1,
          "name": "Juan Pérez"
        },
        "sale": {
          "id": 1,
          "document_number": "B001-00001",
          "total_amount": "50.00"
        }
      }
    ],
    "payment_methods_breakdown": [
      {
        "method_id": 1,
        "method_name": "Efectivo",
        "method_type": "CASH",
        "total_amount": "445.30",
        "transaction_count": 15
      }
    ]
  }
}
```

### GET `/api/cash-sessions/history`
Obtiene el historial de sesiones.

#### Query Parameters
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `page` | integer | No | Página (default: 1) |
| `per_page` | integer | No | Items por página (default: 15, max: 100) |
| `status` | string | No | Filtrar por estado: `OPEN`, `CLOSED`, `SUSPENDED` |
| `date_from` | date | No | Fecha desde (YYYY-MM-DD) |
| `date_to` | date | No | Fecha hasta (YYYY-MM-DD) |
| `cash_register_id` | integer | No | Filtrar por caja específica |

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": {
    "current_page": 1,
    "data": [
      {
        "id": 1,
        "cash_register_id": 1,
        "user_id": 1,
        "opening_amount": "100.00",
        "actual_amount": "545.30",
        "status": "CLOSED",
        "opened_at": "2025-01-23T08:00:00.000000Z",
        "closed_at": "2025-01-23T16:00:00.000000Z",
        "expected_amount": "545.30",
        "difference_amount": "0.00",
        "cash_register": {
          "id": 1,
          "name": "Caja Principal"
        },
        "user": {
          "id": 1,
          "name": "Juan Pérez"
        }
      }
    ],
    "first_page_url": "http://localhost/api/cash-sessions/history?page=1",
    "from": 1,
    "last_page": 1,
    "last_page_url": "http://localhost/api/cash-sessions/history?page=1",
    "next_page_url": null,
    "path": "http://localhost/api/cash-sessions/history",
    "per_page": 15,
    "prev_page_url": null,
    "to": 1,
    "total": 1
  }
}
```

---

## 📊 Movimientos de Caja

### GET `/api/cash-movements`
Obtiene la lista de movimientos de caja.

#### Query Parameters
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `page` | integer | No | Página (default: 1) |
| `per_page` | integer | No | Items por página (default: 15, max: 100) |
| `cash_session_id` | integer | No | Filtrar por sesión específica |
| `type` | string | No | Filtrar por tipo: `SALE`, `EXPENSE`, `WITHDRAWAL`, `DEPOSIT`, `ADJUSTMENT` |
| `date_from` | date | No | Fecha desde (YYYY-MM-DD) |
| `date_to` | date | No | Fecha hasta (YYYY-MM-DD) |

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": {
    "current_page": 1,
    "data": [
      {
        "id": 1,
        "company_id": "uuid",
        "cash_session_id": 1,
        "type": "SALE",
        "reference_type": "sale",
        "reference_id": 1,
        "amount": "50.00",
        "description": "Venta #B001-00001",
        "created_by": 1,
        "created_at": "2025-01-23T09:00:00.000000Z",
        "updated_at": "2025-01-23T09:00:00.000000Z",
        "cash_session": {
          "id": 1,
          "status": "CLOSED",
          "cash_register": {
            "id": 1,
            "name": "Caja Principal"
          }
        },
        "creator": {
          "id": 1,
          "name": "Juan Pérez"
        },
        "sale": {
          "id": 1,
          "document_number": "B001-00001",
          "total_amount": "50.00"
        }
      }
    ],
    "first_page_url": "http://localhost/api/cash-movements?page=1",
    "from": 1,
    "last_page": 1,
    "last_page_url": "http://localhost/api/cash-movements?page=1",
    "next_page_url": null,
    "path": "http://localhost/api/cash-movements",
    "per_page": 15,
    "prev_page_url": null,
    "to": 1,
    "total": 1
  },
  "summary": {
    "total_amount": "50.00",
    "sales_amount": "50.00",
    "adjustments_amount": "0.00",
    "expenses_amount": "0.00",
    "deposits_amount": "0.00",
    "withdrawals_amount": "0.00"
  }
}
```

### GET `/api/cash-movements/{id}`
Obtiene un movimiento específico con detalles completos.

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "company_id": "uuid",
    "cash_session_id": 1,
    "type": "SALE",
    "reference_type": "sale",
    "reference_id": 1,
    "amount": "50.00",
    "description": "Venta #B001-00001",
    "created_by": 1,
    "created_at": "2025-01-23T09:00:00.000000Z",
    "updated_at": "2025-01-23T09:00:00.000000Z",
    "cash_session": {
      "id": 1,
      "status": "CLOSED",
      "opened_at": "2025-01-23T08:00:00.000000Z",
      "closed_at": "2025-01-23T16:00:00.000000Z",
      "cash_register": {
        "id": 1,
        "name": "Caja Principal",
        "code": "MAIN_REGISTER"
      },
      "user": {
        "id": 1,
        "name": "Juan Pérez"
      }
    },
    "creator": {
      "id": 1,
      "name": "Juan Pérez"
    },
    "sale": {
      "id": 1,
      "document_number": "B001-00001",
      "total_amount": "50.00",
      "customer": {
        "id": 1,
        "name": "Cliente Genérico"
      },
      "details": [
        {
          "id": 1,
          "quantity": "2.00",
          "unit_price": "25.00",
          "total_amount": "50.00",
          "product": {
            "id": 1,
            "name": "Producto Ejemplo",
            "sku": "PROD001"
          }
        }
      ]
    }
  }
}
```

---

## 🛒 Ventas con Pagos Múltiples

### POST `/api/sales`
Crea una nueva venta con múltiples métodos de pago.

#### Request Body
```json
{
  "customer_id": 1,
  "sale_date": "2025-01-23",
  "voucher_type": "boleta",
  "status": "PAGADO",
  "total_amount": 150.00,
  "tax_amount": 22.03,
  "discount_amount": 0.00,
  "notes": "Venta con pagos múltiples",
  "details": [
    {
      "product_id": 1,
      "stock_id": 1,
      "batch_id": null,
      "quantity": 2,
      "unit_price": 75.00,
      "total_amount": 150.00,
      "tax_amount": 22.03,
      "discount_amount": 0.00
    }
  ],
  "payment_methods": [
    {
      "method_id": 1,
      "amount": 100.00,
      "reference": null
    },
    {
      "method_id": 2,
      "amount": 50.00,
      "reference": "VISA ****1234"
    }
  ]
}
```

#### Validaciones Principales
| Campo | Reglas |
|-------|--------|
| `customer_id` | required, integer, exists:customers,id |
| `sale_date` | required, date |
| `voucher_type` | required, in:ticket,boleta,factura |
| `status` | required, in:PENDIENTE,PAGADO,ANULADO |
| `total_amount` | required, numeric, min:0.01, max:999999.99 |
| `details` | required, array, min:1, max:50 |
| `payment_methods` | required_if:status,PAGADO, array, min:1, max:10 |

#### Validaciones de Métodos de Pago
| Campo | Reglas |
|-------|--------|
| `payment_methods.*.method_id` | required, integer, exists:payment_methods,id |
| `payment_methods.*.amount` | required, numeric, min:0.01, max:999999.99, regex:/^\d+(\.\d{1,2})?$/ |
| `payment_methods.*.reference` | nullable, string, max:100, regex:/^[a-zA-Z0-9\s\-_#]*$/ |

#### Validaciones de Negocio
- ✅ Suma de pagos debe coincidir con total de venta (tolerancia 1 centavo)
- ✅ Solo un método de pago en efectivo por venta
- ✅ Métodos de pago deben pertenecer a la empresa y estar activos
- ✅ Montos deben estar dentro de límites del método de pago
- ✅ Métodos que requieren referencia deben tenerla
- ✅ Pagos en efectivo requieren sesión de caja activa

#### Respuesta Exitosa (201)
```json
{
  "success": true,
  "message": "Venta registrada exitosamente",
  "data": {
    "sale": {
      "id": 1,
      "company_id": "uuid",
      "customer_id": 1,
      "user_id": 1,
      "sale_date": "2025-01-23",
      "document_type": "BOLETA",
      "document_number": "B001-00001",
      "total_amount": "150.00",
      "tax_amount": "22.03",
      "discount_amount": "0.00",
      "status": "PAGADO",
      "status_display": "Pagado",
      "notes": "Venta con pagos múltiples",
      "customer": {
        "id": 1,
        "name": "Cliente Ejemplo",
        "email": "cliente@ejemplo.com",
        "phone": "123456789",
        "identity_document": "12345678"
      },
      "user": {
        "id": 1,
        "name": "Juan Pérez"
      },
      "details": [
        {
          "id": 1,
          "product_id": 1,
          "batch_id": null,
          "quantity": "2.00",
          "unit_price": "75.00",
          "total_amount": "150.00",
          "tax_amount": "22.03",
          "discount_amount": "0.00",
          "product": {
            "id": 1,
            "name": "Producto Ejemplo",
            "sku": "PROD001",
            "barcode": "1234567890123"
          },
          "batch": null
        }
      ],
      "payments": [
        {
          "id": 1,
          "payment_method_id": 1,
          "payment_method": {
            "id": 1,
            "name": "Efectivo",
            "type": "CASH",
            "code": "CASH"
          },
          "amount": "100.00",
          "reference_number": null,
          "cash_session_id": 1,
          "created_at": "2025-01-23T10:00:00.000000Z"
        },
        {
          "id": 2,
          "payment_method_id": 2,
          "payment_method": {
            "id": 2,
            "name": "Tarjeta de Débito",
            "type": "CARD",
            "code": "DEBIT_CARD"
          },
          "amount": "50.00",
          "reference_number": "VISA ****1234",
          "cash_session_id": null,
          "created_at": "2025-01-23T10:00:00.000000Z"
        }
      ],
      "summary": {
        "items_count": 1,
        "total_quantity": "2.00",
        "subtotal": "127.97"
      },
      "status_info": {
        "status": "PAGADO",
        "status_display": "Pagado",
        "is_paid": true,
        "is_pending": false,
        "is_cancelled": false,
        "can_edit": true,
        "can_delete": false
      },
      "formatted_dates": {
        "sale_date": "23/01/2025",
        "sale_datetime": "23/01/2025 10:00",
        "created_date": "23/01/2025 10:00"
      },
      "created_at": "2025-01-23T10:00:00.000000Z",
      "updated_at": "2025-01-23T10:00:00.000000Z"
    },
    "voucher_link": "https://tu-dominio.com/api/voucher/1?signature=..."
  }
}
```

#### Errores de Validación (422)
```json
{
  "success": false,
  "message": "Error de validación",
  "errors": {
    "payment_methods": [
      "La suma de los pagos debe coincidir con el total de la venta"
    ],
    "payment_methods.0.amount": [
      "El monto mínimo para Efectivo es 0.01"
    ],
    "payment_methods.1.reference": [
      "El método de pago Tarjeta de Débito requiere número de referencia"
    ]
  }
}
```

#### Error de Sesión de Caja (422)
```json
{
  "success": false,
  "message": "Error de validación",
  "errors": {
    "payment_methods": [
      "Debe tener un turno de caja activo para procesar pagos en efectivo"
    ]
  }
}
```

---

## ⚠️ Códigos de Error

### Códigos HTTP
| Código | Descripción |
|--------|-------------|
| `200` | Operación exitosa |
| `201` | Recurso creado exitosamente |
| `400` | Solicitud incorrecta |
| `401` | No autenticado |
| `403` | Sin permisos |
| `404` | Recurso no encontrado |
| `422` | Error de validación |
| `500` | Error interno del servidor |

### Errores Comunes

#### Error de Autenticación (401)
```json
{
  "success": false,
  "message": "Token no válido o expirado"
}
```

#### Error de Permisos (403)
```json
{
  "success": false,
  "message": "No tiene permisos para realizar esta acción"
}
```

#### Error de Validación (422)
```json
{
  "success": false,
  "message": "Error de validación",
  "errors": {
    "campo": ["Mensaje de error específico"]
  }
}
```

#### Error de Negocio (422)
```json
{
  "success": false,
  "message": "Ya tiene una sesión de caja abierta"
}
```

---

## 🔄 Ejemplos de Flujo Completo

### Flujo 1: Apertura de Turno y Venta Simple

#### 1. Obtener métodos de pago disponibles
```http
GET /api/payment-methods?active_only=true
Authorization: Bearer {token}
```

#### 2. Obtener cajas disponibles
```http
GET /api/cash-registers?active_only=true
Authorization: Bearer {token}
```

#### 3. Abrir sesión de caja
```http
POST /api/cash-sessions/open
Authorization: Bearer {token}
Content-Type: application/json

{
  "cash_register_id": 1,
  "opening_amount": 100.00,
  "notes": "Turno matutino"
}
```

#### 4. Realizar venta con efectivo
```http
POST /api/sales
Authorization: Bearer {token}
Content-Type: application/json

{
  "customer_id": 1,
  "sale_date": "2025-01-23",
  "voucher_type": "boleta",
  "status": "PAGADO",
  "total_amount": 50.00,
  "tax_amount": 7.34,
  "discount_amount": 0.00,
  "details": [
    {
      "product_id": 1,
      "stock_id": 1,
      "quantity": 1,
      "unit_price": 50.00,
      "total_amount": 50.00,
      "tax_amount": 7.34
    }
  ],
  "payment_methods": [
    {
      "method_id": 1,
      "amount": 50.00
    }
  ]
}
```

#### 5. Consultar estado actual de la sesión
```http
GET /api/cash-sessions/current
Authorization: Bearer {token}
```

#### 6. Cerrar sesión de caja
```http
PUT /api/cash-sessions/1/close
Authorization: Bearer {token}
Content-Type: application/json

{
  "actual_amount": 150.00,
  "notes": "Cierre sin diferencias"
}
```

### Flujo 2: Venta con Múltiples Métodos de Pago

#### 1. Realizar venta mixta (efectivo + tarjeta)
```http
POST /api/sales
Authorization: Bearer {token}
Content-Type: application/json

{
  "customer_id": 1,
  "sale_date": "2025-01-23",
  "voucher_type": "boleta",
  "status": "PAGADO",
  "total_amount": 200.00,
  "tax_amount": 29.37,
  "discount_amount": 0.00,
  "details": [
    {
      "product_id": 1,
      "stock_id": 1,
      "quantity": 4,
      "unit_price": 50.00,
      "total_amount": 200.00,
      "tax_amount": 29.37
    }
  ],
  "payment_methods": [
    {
      "method_id": 1,
      "amount": 120.00
    },
    {
      "method_id": 2,
      "amount": 80.00,
      "reference": "VISA ****1234"
    }
  ]
}
```

### Flujo 3: Consulta de Reportes

#### 1. Ver movimientos de la sesión actual
```http
GET /api/cash-movements?cash_session_id=1
Authorization: Bearer {token}
```

#### 2. Obtener reporte detallado de sesión
```http
GET /api/cash-sessions/1/report
Authorization: Bearer {token}
```

#### 3. Ver historial de sesiones
```http
GET /api/cash-sessions/history?date_from=2025-01-01&date_to=2025-01-31
Authorization: Bearer {token}
```

---

## 📝 Notas Importantes

### Consideraciones de Seguridad
- ✅ Todos los endpoints requieren autenticación JWT
- ✅ Validación de empresa (multi-tenancy)
- ✅ Solo el usuario propietario puede cerrar su sesión
- ✅ Límites de rate limiting aplicados

### Consideraciones de Rendimiento
- ✅ Paginación en listados largos
- ✅ Índices optimizados en base de datos
- ✅ Carga lazy de relaciones
- ✅ Compresión de respuestas

### Consideraciones de Negocio
- ✅ Solo una sesión activa por usuario
- ✅ Validación de límites por método de pago
- ✅ Registro automático de movimientos de caja
- ✅ Alertas por diferencias significativas
- ✅ Trazabilidad completa de transacciones

### Estados de Sesión
- `OPEN`: Sesión activa, puede recibir transacciones
- `CLOSED`: Sesión cerrada, no puede recibir transacciones
- `SUSPENDED`: Sesión suspendida (funcionalidad futura)

### Tipos de Movimiento
- `SALE`: Venta en efectivo
- `EXPENSE`: Gasto pagado desde caja
- `WITHDRAWAL`: Retiro de efectivo
- `DEPOSIT`: Depósito de efectivo
- `ADJUSTMENT`: Ajuste por diferencia en cierre

---

**Fecha de Creación**: 23 de Enero 2025  
**Versión**: 1.0  
**Estado**: ✅ Documentación Completa