# Almazen Frontend

Almazen es un sistema de gestión integral (ERP) diseñado para optimizar las operaciones de inventario, ventas, compras y administración de tu negocio. Desarrollado con Vue.js y PrimeVue, ofrece una interfaz intuitiva y potente para una gestión eficiente.

## Sobre este proyecto

Es el cliente de la **segunda iteración arquitectónica de AlmaZen**: la versión desacoplada. Consume la API de **[almazen-api](https://github.com/DanielMoranV/almazen-api)** (Laravel), y los dos repositorios forman el sistema completo.

AlmaZen pasó por tres arquitecturas. Esta es la del medio, y la que decidí no explotar comercialmente — por eso es la que publico. El producto que sí está en producción es un monolito distinto, y su código no es público.

## Características Principales

*   **Panel Principal y Reportes:**
    *   **Dashboard:** Visualización de métricas clave en tiempo real (ventas, compras, valor de inventario, alertas de stock).
    *   **Reportes:** Generación y descarga de informes detallados para análisis y toma de decisiones.

*   **Módulo de Comercio:**
    *   **Punto de Venta (POS):** Interfaz intuitiva para ventas rápidas, gestión de carrito y procesamiento de pagos.
    *   **Gestión de Caja:** Control de cajas registradoras, métodos de pago y movimientos de efectivo (ingresos, egresos, depósitos).
    *   **Ventas y Compras:** Administración completa del ciclo de ventas (facturas, cotizaciones) y compras (órdenes, proveedores).
    *   **Socios Comerciales:** Gestión de clientes y proveedores con historial de transacciones.

*   **Módulo de Inventario:**
    *   **Productos:** Catálogo completo de productos con detalles, SKU, precios y gestión de lotes.
    *   **Control de Stock:** Consulta de stock actual por almacén, costos y precios de venta.
    *   **Movimientos de Stock:** Historial detallado de entradas, salidas, ajustes y transferencias de inventario.
    *   **Almacenes:** Configuración y gestión de múltiples almacenes para una organización eficiente.

*   **Módulo de Administración:**
    *   **Gestión de Empresa:** Configuración de datos de la empresa y flujos de trabajo (ej. proceso de compras estándar/simplificado).
    *   **Gestión de Usuarios:** Administración de usuarios, roles y permisos, incluyendo perfiles de usuario.
    *   **Configuración del Sistema:** Definición de parámetros globales como categorías de productos y unidades de medida.

## Tecnologías Utilizadas

*   **Frontend:** Vue.js
*   **UI Framework:** PrimeVue
*   **Build Tool:** Vite
*   **State Management:** Pinia
*   **Routing:** Vue Router
*   **Styling:** Tailwind CSS

## Instalación y Uso

1.  Clona el repositorio:
    ```bash
    git clone <URL_DEL_REPOSITORIO>
    ```
2.  Navega al directorio del proyecto:
    ```bash
    cd almazen_frontend
    ```
3.  Instala las dependencias:
    ```bash
    npm install
    ```
4.  Inicia el servidor de desarrollo:
    ```bash
    npm run dev
    ```
    Esto iniciará la aplicación en `http://localhost:5173` (o un puerto similar).

5.  Compila para producción:
    ```bash
    npm run build
    ```
    Esto generará los archivos de producción en el directorio `dist/`.

## Documentación

Puedes encontrar documentación detallada sobre módulos específicos en la carpeta `docs/`:

*   [Documentación de API de Control de Caja](docs/CASH_CONTROL_API_DOCUMENTATION.md)
*   [Implementación de Importación de Productos](docs/PRODUCT_IMPORT_IMPLEMENTATION.md)
*   [Documentación de Tienda Pública](docs/PUBLIC_STORE_DOCUMENTATION.md)
*   [Implementación de Exportación/Importación de Stock](docs/STOCK_EXPORT_IMPORT_FINAL_IMPLEMENTATION.md)
*   [Guía de Migración a URLs Amigables](docs/URLS_AMIGABLES_MIGRATION_GUIDE.md)
*   [Readme de Caja y Ventas](docs/cash_and_sales_readme.md)

## Contribución

Si deseas contribuir a este proyecto, por favor, sigue las mejores prácticas de desarrollo y envía tus pull requests.

## Licencia

[PolyForm Noncommercial License 1.0.0](LICENSE.md).

Uso libre y gratuito para cualquier fin **no comercial**: estudio, investigación, docencia, proyectos personales y organizaciones sin ánimo de lucro. Puedes leerlo, modificarlo y redistribuirlo manteniendo esta licencia y el aviso de copyright.

**El uso comercial requiere una licencia aparte.** Si te interesa, escríbeme.

## Autor

**Daniel Morán Vílchez** — [Djasoft](https://djasoft.net.pe)
GitHub: [@DanielMoranV](https://github.com/DanielMoranV)