# Ventas, Caja y Configuración de Empresa

Esta guía describe cómo interactuar con los módulos de **Ventas** y **Gestión de Caja** del API, así como la configuración de empresa que afecta su comportamiento.

> Todas las rutas requieren autenticación JWT (`Authorization: Bearer {token}`). Los ejemplos usan la URL base `/api`.

---

## 1. Configuración de Empresa

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/company-config` | `GET`  | Obtiene la configuración actual de la empresa del usuario logueado. |
| `/company-config` | `PUT`  | Actualiza la configuración. Solo administradores. |

### Campos principales

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `purchase_workflow` | `standard` \| `simplified` | Flujo de aprobación de compras. |
| `requires_cash_session` | `boolean` | `true` obliga a abrir **Sesión de Caja** para registrar ventas en efectivo. |
| `send_sunat` | `boolean` | `true` habilita boletas/facturas electrónicas. |

Ver detalles de validación en `UpdateCompanyConfigRequest`.

---

## 2. Gestión de Caja

### 2.1. Cajas Registradoras (`cash-registers`)

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/cash-registers` | `GET` | Lista de cajas de la empresa. |
| `/cash-registers` | `POST` | Crea una nueva caja. |
| `/cash-registers/{id}` | `PATCH` | Actualiza una caja. |

### 2.2. Sesiones de Caja (`cash-sessions`)

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/cash-sessions/open` | `POST` | Abre sesión en la caja especificada. |
| `/cash-sessions/{id}/close` | `POST` | Cierra la sesión indicada. |
| `/cash-sessions/{id}` | `GET` | Detalle de la sesión. |
| `/cash-sessions/{id}/report` | `GET` | Reporte completo (totales, movimientos, desglose por método de pago). |
| `/cash-sessions/history` | `GET` | Historial paginado de sesiones del usuario. |

**Nota:** Si `requires_cash_session = false`, los pagos en efectivo pueden registrarse sin sesión. En ese caso:
* `CashMovement` no se crea.
* `SalePayment.cash_session_id` será `NULL`.
* El pago no aparecerá en reportes de caja.

### 2.3. Movimientos de Caja (`cash-movements`)

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/cash-movements` | `GET` | Lista paginada (filtros por tipo, fecha, caja). |
| `/cash-movements` | `POST` | Registra un movimiento manual (egreso/ingreso, ajuste, depósito). |

---

## 3. Ventas

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/sales` | `GET` | Listado y filtros. |
| `/sales` | `POST` | Crea una venta (con detalles, métodos de pago). |
| `/sales/{id}` | `GET` | Detalle de venta. |

### 3.1. Procesamiento de Pagos en la Venta

```json
{
  "payment_methods": [
    { "method_id": 8, "amount": 40.00, "reference": null },
    { "method_id": 10, "amount": 20.00, "reference": "YAPE-123" }
  ]
}
```

Reglas internas (ver `RegisterProductStockOutputAction`):
* Si existe una **Sesión de Caja abierta**, todos los pagos se asocian a ella (`cash_session_id`).
* Si el método de pago es `CASH` ➜ además se crea un `CashMovement` con `type = SALE`.
* Si **no** hay sesión y `requires_cash_session = true` **→** la venta se rechaza (422) si hay efectivo.

---

## 4. Reportes clave

### 4.1. Reporte de Sesión de Caja

`GET /cash-sessions/{id}/report`

Respuesta resumida:
```json
{
  "session": {...},
  "summary": {
    "opening_amount": 100.00,
    "expected_amount": 226.70,
    "actual_amount": 226.70,
    "difference_amount": 0
  },
  "movements_summary": {
    "total_sales": 126.70,
    "sales_count": 1,
    "total_expenses": 0
  },
  "payment_methods_breakdown": [
    { "method_name": "Efectivo", "total_amount": 126.70 },
    { "method_name": "Yape",     "total_amount": 50.00 }
  ]
}
```

### 4.2. Ventas fuera de Caja

Para empresas con caja opcional (`requires_cash_session = false`) puede ser útil saber qué ventas no pasaron por caja:
```sql
SELECT * FROM sale_payments WHERE cash_session_id IS NULL;
```
Un endpoint adicional podría exponer esta información según necesidad.

---

## 5. Flujo típico

1. **(Opcional)** Administrador ajusta `requires_cash_session` y `send_sunat` en `/company-config`.
2. Cajero abre sesión (`/cash-sessions/open`).
3. Registra ventas (`/sales`), incluyendo varios métodos de pago.
4. Durante la venta: 
   * Efectivo → crea `CashMovement` e impacta en caja.
   * Digital → sólo `SalePayment` (pero ligado a la sesión).
5. Cajero cierra sesión (`/cash-sessions/{id}/close`) y revisa reporte.

---

## 6. Códigos de error comunes

| Código | Motivo | Solución |
|--------|--------|----------|
| `422` | "Debe tener un turno de caja activo para procesar pagos en efectivo" | Abrir sesión o desactivar `requires_cash_session`. |
| `403` | Usuario no es administrador | Usar una cuenta con rol Admin o ajustar lógica de roles. |

---

## 7. Referencias rápidas

* Modelo `CompanyConfig` – cast & fillable de las opciones.  
* `RegisterProductStockOutputAction` – lógica de validación de sesión & creación de pagos.
* `CashSessionController` – cálculo de reportes.

---

© 2025 Backend Almazen
