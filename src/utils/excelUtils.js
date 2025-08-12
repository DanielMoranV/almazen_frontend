import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export const exportToExcel = async (columns, data, sheetName = 'Sheet1', fileName = 'Data.xlsx') => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    // Definir columnas y encabezados
    worksheet.columns = columns;

    // Agregar datos y aplicar estilos a las celdas

    if (data === null || data?.length === 0) {
        return;
    }
    data.forEach((item) => {
        const row = worksheet.addRow(item);

        // Aplicar estilo a las celdas de la fila
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            // Obtener la configuración de la columna
            const columnConfig = columns[colNumber - 1];

            // Aplicar formato numérico si está definido
            if (columnConfig?.style?.numFmt) {
                cell.numFmt = columnConfig.style.numFmt;
            }

            cell.font = { color: { argb: '000000' } }; // Color del texto
            cell.alignment = { vertical: 'middle', horizontal: 'left' };
            cell.border = {
                top: { style: 'thin', color: { argb: 'CCCCCC' } },
                left: { style: 'thin', color: { argb: 'CCCCCC' } },
                bottom: { style: 'thin', color: { argb: 'CCCCCC' } },
                right: { style: 'thin', color: { argb: 'CCCCCC' } }
            };
        });
    });

    // Aplicar estilo a las celdas de encabezado
    worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFF' } };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '4F81BD' } // Color de fondo azul
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    // Generate unique file name with timestamp (YYYYMMDD_HHMMSSSSS)
    const timestamp = new Date()
        .toISOString()
        .replace(/[-T:.Z]/g, '')
        .slice(0, 17);
    fileName = `${fileName}_${timestamp}.xlsx`;

    // Guardar archivo
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), fileName);
};

// Función para cargar el archivo Excel
export const loadExcelFile = async (file) => {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file);
    return workbook.worksheets[0].getSheetValues();
};

// Función para validar los datos del archivo
export const validateData = (rows) => {
    if (rows.length < 3) {
        return false;
    }
    return true;
};

export const validateHeaders = (row, headers) => {
    // Comparar los encabezados con los valores de la fila
    const missingHeaders = headers.filter((header) => !row.includes(header));
    if (missingHeaders.length > 0) {
        return { success: false, missingHeaders: missingHeaders };
    }
    return { success: true };
};

export const processDataDatabaseDevolutions = (rows) => {
    const dataSetDevolutions = rows
        .slice(2)
        .filter((row) => row[11] != '')
        .map((row) => ({
            date_devolution: row[2] ? validateDate(row[2]) : null,
            period_devolution: row[3] ? row[3] : null,
            invoice_number: row[4] ? row[4] : null,
            insurer: row[6] ? row[6] : null,
            amount_devolution: row[7] ? row[7] : 0,
            patient: row[10] ? row[10] : null,
            admission_number: row[11] ? row[11] : null,
            type_attention: row[12] ? row[12] : null,
            biller: row[13] ? row[13] : null,
            reason_devolution: row[14] ? row[14] : null
        }));
    return dataSetDevolutions;
};

// Procesar Meta Liquidación
export const processDataDatabaseSettlements = (rows) => {
    const dataSetSettlements = rows
        .slice(2) // Omite las dos primeras filas
        .filter((row) => row[1] != '')
        .filter((row) => row[6])
        .filter((row) => row[7])
        .map((row) => ({
            admission_number: row[1],
            medical_record_number: row[2] ? parseInt(row[2], 10) : null,
            biller: row[10],
            period: row[11],
            start_date: row[12] ? validateDate(row[12]) : null,
            end_date: row[13] ? validateDate(row[13]) : null
        }));
    return dataSetSettlements;
};

// Procesar los datos de la tabla de envíos
export const processDataDatabaseShipments = (rows) => {
    const dataSetShipments = rows
        .slice(2)
        .filter((row) => row[1] !== '')
        .filter((row) => row[11] != '')
        .filter((row) => row[15])
        .filter((row) => row[16])
        .filter((row) => row[17])
        .filter((row) => row[18])
        .filter((row) => row[20])
        .filter((row) => row[21])
        .map((row) => ({
            admission_number: row[1],
            invoice_number: row[11],
            isNewShipment: row[15]?.toLowerCase() === 'no' ? true : row[15]?.toLowerCase() === 'si' ? false : null,
            trama_date: row[16] ? row[16] : null,
            courier_date: row[17] ? row[17] : null,
            email_verified_date: row[18] ? row[18] : null,
            url_sustenance: row[19] ? (typeof row[19] === 'object' ? row[19].text || row[19].hyperlink || null : row[19]) : null,
            remarks: row[20] ? row[20] : null,
            verified_shipment_date: row[21] ? validateDate(row[21]) : null
        }));
    return dataSetShipments;
};

export const processDataDatabaseShipmentsAll = (rows) => {
    const dataSetShipments = rows
        .slice(2)
        .filter((row) => row[1] !== '')
        .filter((row) => row[2] != '')
        .filter((row) => row[3])
        .filter((row) => row[4])
        .filter((row) => row[5])
        .filter((row) => row[6])

        .map((row) => ({
            admission_number: row[1],
            invoice_number: row[2],
            isNewShipment: row[3]?.toLowerCase() === 'no' ? true : row[3]?.toLowerCase() === 'si' ? false : null,
            trama_date: row[4] ? row[4] : null,
            courier_date: row[5] ? row[5] : null,
            email_verified_date: row[6] ? row[6] : null,
            url_sustenance: row[7] ? (typeof row[7] === 'object' ? row[7].text || row[7].hyperlink || null : row[7]) : null,
            remarks: row[8] ? row[8] : null,
            verified_shipment_date: row[9] ? validateDate(row[9]) : null
        }));
    return dataSetShipments;
};

// Función para procesar los datos
export const processDataDatabase = (rows) => {
    const dataSet = rows
        .slice(2)
        .filter((row) => row[4] != '')
        .filter((row) => row[5] !== 'No existe...')
        .filter((row) => row[8] != '')
        .map((row) => ({
            admission_number: row[1],
            attendance_date: row[2] ? validateDate(row[2]) : null,
            attendance_hour: row[24] ? validateTime(row[24]) : null,
            number_medical_record: row[4] ? row[4] : null,
            name_patient: row[5] ? row[5] : null,
            company: row[7] ? row[7] : null,
            name_insurer: row[8] ? row[8] : null,
            type_attention: row[9] ? row[9] : null,
            name_doctor: row[10] ? row[10] : null,
            amount_attention: row[14] ? row[14] : 0,
            number_invoice: row[15] ? row[15] : null,
            invoice_date: row[16] ? validateDate(row[16]) : null,
            number_payment: row[17] ? row[17] : null,
            payment_date: row[18] ? validateDate(row[18]) : null,
            biller: row[25] ? row[25] : null
        }));
    return dataSet;
};
export const validateDate = (excelDate) => {
    if (excelDate instanceof Date && !isNaN(excelDate.getTime())) {
        // Obtener los valores de año, mes y día en UTC
        const year = excelDate.getUTCFullYear();
        const month = String(excelDate.getUTCMonth() + 1).padStart(2, '0');
        const day = String(excelDate.getUTCDate()).padStart(2, '0');

        // Formatear la fecha sin hora
        const formattedDate = `${year}-${month}-${day}`;
        return formattedDate;
    }
    return null;
};

export const validateTime = (time) => {
    // Expresión regular para validar el formato HH:mm (24 horas)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;

    // Verificar si la hora cumple con el formato
    if (timeRegex.test(time)) {
        return time; // Es válida, devolver la hora
    }

    return null; // No es válida, devolver null
};

// Función específica para exportar inventario con múltiples pestañas
export const exportInventoryToExcel = async (summaryData, detailData, fileName = 'Inventario') => {
    const workbook = new ExcelJS.Workbook();

    // Pestaña 1: Resumen por productos
    const summarySheet = workbook.addWorksheet('Resumen por Productos');

    const summaryColumns = [
        { header: 'SKU', key: 'sku', width: 15 },
        { header: 'Producto', key: 'name', width: 30 },
        { header: 'Stock Total', key: 'total_stock', width: 15 },
        { header: 'Costo Promedio', key: 'avg_unit_cost', width: 15 },
        { header: 'Costo Total', key: 'total_cost_value', width: 15 },
        { header: 'Precio Promedio Venta', key: 'avg_sale_price', width: 15 },
        { header: 'Valor Total Venta', key: 'total_sale_value', width: 15 },
        { header: 'Requiere Lotes', key: 'requires_batches', width: 15 }
    ];

    summarySheet.columns = summaryColumns;

    // Agregar datos del resumen
    if (summaryData && summaryData.length > 0) {
        summaryData.forEach((item) => {
            const row = summarySheet.addRow({
                ...item,
                avg_unit_cost: item.avg_unit_cost ? `S/ ${item.avg_unit_cost.toFixed(2)}` : '-',
                total_cost_value: item.total_cost_value ? `S/ ${item.total_cost_value.toFixed(2)}` : '-',
                avg_sale_price: item.avg_sale_price ? `S/ ${item.avg_sale_price.toFixed(2)}` : '-',
                total_sale_value: item.total_sale_value ? `S/ ${item.total_sale_value.toFixed(2)}` : '-',
                requires_batches: item.requires_batches ? 'Sí' : 'No'
            });

            // Aplicar estilo a las celdas de la fila
            row.eachCell({ includeEmpty: true }, (cell) => {
                cell.font = { color: { argb: '000000' } };
                cell.alignment = { vertical: 'middle', horizontal: 'left' };
                cell.border = {
                    top: { style: 'thin', color: { argb: 'CCCCCC' } },
                    left: { style: 'thin', color: { argb: 'CCCCCC' } },
                    bottom: { style: 'thin', color: { argb: 'CCCCCC' } },
                    right: { style: 'thin', color: { argb: 'CCCCCC' } }
                };
            });
        });
    }

    // Pestaña 2: Detalle completo
    const detailSheet = workbook.addWorksheet('Detalle Completo');

    const detailColumns = [
        { header: 'SKU', key: 'sku', width: 15 },
        { header: 'Producto', key: 'product_name', width: 30 },
        { header: 'Almacén', key: 'warehouse_name', width: 20 },
        { header: 'Stock', key: 'stock', width: 10 },
        { header: 'Costo Unitario', key: 'unit_cost', width: 15 },
        { header: 'Costo Total', key: 'total_cost', width: 15 },
        { header: 'Precio Venta', key: 'sale_price', width: 15 },
        { header: 'Valor Total', key: 'total_value', width: 15 },
        { header: 'Stock Mínimo', key: 'min_stock', width: 12 },
        { header: 'Stock Máximo', key: 'max_stock', width: 12 },
        { header: 'Lote', key: 'batch_code', width: 15 },
        { header: 'Fecha Vencimiento', key: 'expiration_date', width: 18 },
        { header: 'Fecha Fabricación', key: 'manufacturing_date', width: 18 },
        { header: 'Estado', key: 'status', width: 12 }
    ];

    detailSheet.columns = detailColumns;

    // Agregar datos del detalle
    if (detailData && detailData.length > 0) {
        detailData.forEach((item) => {
            // Función auxiliar para formatear valores numéricos
            const formatCurrency = (value) => {
                if (value === null || value === undefined || value === '' || isNaN(value)) return '-';
                const numValue = parseFloat(value);
                return isNaN(numValue) ? '-' : `S/ ${numValue.toFixed(2)}`;
            };

            const formatDate = (dateValue) => {
                if (!dateValue) return '-';
                try {
                    const date = new Date(dateValue);
                    return isNaN(date.getTime()) ? '-' : date.toLocaleDateString('es-ES');
                } catch (error) {
                    return '-';
                }
            };

            const row = detailSheet.addRow({
                ...item,
                unit_cost: formatCurrency(item.unit_cost),
                total_cost: formatCurrency(item.total_cost),
                sale_price: formatCurrency(item.sale_price),
                total_value: formatCurrency(item.total_value),
                expiration_date: formatDate(item.expiration_date),
                manufacturing_date: formatDate(item.manufacturing_date)
            });

            // Aplicar estilo a las celdas de la fila
            row.eachCell({ includeEmpty: true }, (cell) => {
                cell.font = { color: { argb: '000000' } };
                cell.alignment = { vertical: 'middle', horizontal: 'left' };
                cell.border = {
                    top: { style: 'thin', color: { argb: 'CCCCCC' } },
                    left: { style: 'thin', color: { argb: 'CCCCCC' } },
                    bottom: { style: 'thin', color: { argb: 'CCCCCC' } },
                    right: { style: 'thin', color: { argb: 'CCCCCC' } }
                };
            });
        });
    }

    // Aplicar estilo a los encabezados de ambas pestañas
    [summarySheet, detailSheet].forEach((sheet) => {
        sheet.getRow(1).eachCell({ includeEmpty: true }, (cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFF' } };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: '059669' } // Color verde
            };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });
    });

    // Generar nombre de archivo único con timestamp
    const timestamp = new Date()
        .toISOString()
        .replace(/[-T:.Z]/g, '')
        .slice(0, 17);
    const finalFileName = `${fileName}_${timestamp}.xlsx`;

    // Guardar archivo
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), finalFileName);
};

// Función para descargar archivos blob (para endpoints de exportación)
export const downloadBlobAsFile = (blob, filename) => {
    saveAs(blob, filename);
};

// Función para procesar y validar datos de importación de stock inicial
export const processStockImportData = async (file) => {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file);

    // Leer los datos de la hoja 2 (índice 1)
    const worksheet = workbook.worksheets[1];
    const rows = [];
    
    // Verificar que existe la hoja 2
    if (!worksheet) {
        throw new Error('El archivo debe contener al menos 2 hojas. Los datos deben estar en la hoja 2.');
    }

    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
            // Omitir el header
            const rowValues = [];
            row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                rowValues[colNumber] = cell.value;
            });
            rows.push(rowValues);
        }
    });

    return rows;
};

// Función para validar estructura de archivo de importación de stock
export const validateStockImportStructure = (rows) => {
    const errors = [];

    if (rows.length === 0) {
        errors.push('El archivo está vacío');
        return { isValid: false, errors };
    }

    // Validar que cada fila tenga los campos requeridos
    rows.forEach((row, index) => {
        const rowNumber = index + 2; // +2 porque empezamos desde la fila 2 (después del header)

        // Validar campos requeridos
        if (!row[1]) {
            // Producto ID
            errors.push(`Fila ${rowNumber}: ID del producto es requerido`);
        }

        if (!row[8]) {
            // Almacén ID
            errors.push(`Fila ${rowNumber}: ID del almacén es requerido`);
        }

        if (!row[11] || row[11] <= 0) {
            // Cantidad
            errors.push(`Fila ${rowNumber}: Cantidad debe ser mayor a 0`);
        }

        if (!row[12] || row[12] <= 0) {
            // Precio de costo
            errors.push(`Fila ${rowNumber}: Precio de costo debe ser mayor a 0`);
        }

        if (!row[13] || row[13] <= 0) {
            // Precio de venta
            errors.push(`Fila ${rowNumber}: Precio de venta debe ser mayor a 0`);
        }
    });
    
    return {
        isValid: errors.length === 0,
        errors: errors,
        validRows: rows.length
    };
};
