import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

import Aura from '@primevue/themes/aura';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import KeyFilter from 'primevue/keyfilter';
import StyleClass from 'primevue/styleclass';
import ToastService from 'primevue/toastservice';
import registerPrimeVueComponents from './plugins/primevue-components';
import Chart from 'primevue/chart';
import 'chart.js/auto';

import '@/assets/styles.scss';
import '@/assets/tailwind.css';

// Inicializa IndexedDB antes de montar la aplicación
(async () => {
    const pinia = createPinia();
    const app = createApp(App);

    app.use(router);
    app.use(pinia);

    app.directive('keyfilter', KeyFilter);
    app.directive('styleclass', StyleClass);
    app.use(PrimeVue, {
        theme: {
            preset: {
                ...Aura,
                semantic: {
                    ...Aura.semantic,
                    semantic: {
                        primary: {
                            50: '{green.50}',
                            100: '{green.100}',
                            200: '{green.200}',
                            300: '{green.300}',
                            400: '{green.400}',
                            500: '{green.500}', // Este es el color principal
                            600: '{green.600}',
                            700: '{green.700}',
                            800: '{green.800}',
                            900: '{green.900}',
                            950: '{green.950}'
                        }
                    }
                }
            },
            options: {
                darkModeSelector: '.app-dark'
            }
        },
        locale: {
            accept: 'Aceptar',
            reject: 'Rechazar',
            invalidFileSize: 'El archivo "{0}" tiene un tamaño inválido. Debe ser menor a {1} KB.',
            startsWith: 'Comienza con',
            contains: 'Contiene',
            notContains: 'No contiene',
            endsWith: 'Termina con',
            equals: 'Igual',
            notEquals: 'No igual',
            noFilter: 'Sin filtro',
            lt: 'Menor que',
            lte: 'Menor o igual que',
            gt: 'Mayor que',
            gte: 'Mayor o igual que',
            dateIs: 'Fecha es',
            dateIsNot: 'Fecha no es',
            dateBefore: 'Fecha antes de',
            dateAfter: 'Fecha después de',
            clear: 'Limpiar',
            apply: 'Aplicar',
            matchAll: 'Coincidir todos',
            matchAny: 'Coincidir alguno',
            addRule: 'Agregar regla',
            removeRule: 'Eliminar regla',
            choose: 'Seleccionar',
            upload: 'Cargar',
            cancel: 'Cancelar',
            completed: 'Completado',
            pending: 'Pendiente',
            dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
            dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
            dayNamesMin: ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'],
            monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
            monthNamesShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
            chooseYear: 'Elegir Año',
            chooseMonth: 'Elegir Mes',
            chooseDate: 'Elegir Fecha',
            prevDecade: 'Década anterior',
            nextDecade: 'Década siguiente',
            prevYear: 'Año anterior',
            nextYear: 'Año siguiente',
            prevMonth: 'Mes anterior',
            nextMonth: 'Mes siguiente',
            prevHour: 'Hora anterior',
            nextHour: 'Hora siguiente',
            prevMinute: 'Minuto anterior',
            nextMinute: 'Minuto siguiente',
            prevSecond: 'Segundo anterior',
            nextSecond: 'Segundo siguiente',
            am: 'am',
            pm: 'pm',
            today: 'Hoy',
            weekHeader: 'Sem',
            firstDayOfWeek: 0,
            dateFormat: 'dd/mm/yy',
            weak: 'Débil',
            medium: 'Medio',
            strong: 'Fuerte',
            passwordPrompt: 'Ingrese una contraseña',
            emptyFilterMessage: 'No se encontraron resultados', // @deprecated Use 'emptySearchMessage' option instea
            searchMessage: '{0} resultados disponibles',
            selectionMessage: '{0} elementos seleccionados',
            emptySelectionMessage: 'Ningún elemento seleccionado',
            emptySearchMessage: 'No se encontraron resultados',
            emptyMessage: 'No hay opciones disponibles',
            aria: {
                trueLabel: 'Verdadero',
                falseLabel: 'Falso',
                nullLabel: 'No seleccionado',
                star: '1 estrella',
                stars: '{star} estrellas',
                selectAll: 'Seleccionar todo',
                unselectAll: 'Deseleccionar todo',
                close: 'Cerrar',
                previous: 'Anterior',
                next: 'Siguiente',
                navigation: 'Navegación',
                scrollTop: 'Desplazarse hacia arriba',
                moveTop: 'Mover al principio',
                moveUp: 'Mover hacia arriba',
                moveDown: 'Mover hacia abajo',
                moveBottom: 'Mover al final',
                moveToTarget: 'Mover al objetivo',
                moveToSource: 'Mover a la fuente',
                moveAllToTarget: 'Mover todo al objetivo',
                moveAllToSource: 'Mover todo a la fuente',
                pageLabel: 'Página {page}',
                firstPageLabel: 'Primera página',
                lastPageLabel: 'Última página',
                nextPageLabel: 'Siguiente página',
                prevPageLabel: 'Página anterior',
                rowsPerPageLabel: 'Filas por página',
                jumpToPageDropdownLabel: 'Saltar a la página',
                jumpToPageInputLabel: 'Escriba un número de página',
                selectRow: 'Fila seleccionada',
                unselectRow: 'Fila no seleccionada',
                expandRow: 'Expandir fila',
                collapseRow: 'Contraer fila',
                showFilterMenu: 'Mostrar menú de filtro',
                hideFilterMenu: 'Ocultar menú de filtro',
                filterOperator: 'Operador de filtro',
                filterConstraint: 'Restricción de filtro',
                editRow: 'Editar fila',
                saveEdit: 'Guardar edición',
                cancelEdit: 'Cancelar edición',
                listView: 'Vista de lista',
                gridView: 'Vista de cuadrícula',
                slide: 'Deslizar',
                slideNumber: '{slideNumber}',
                zoomImage: 'Ampliar imagen',
                zoomIn: 'Acercar',
                zoomOut: 'Alejar',
                rotateRight: 'Rotar a la derecha',
                rotateLeft: 'Rotar a la izquierda'
            }
        }
    });
    app.use(ToastService);
    app.use(ConfirmationService);
    registerPrimeVueComponents(app);
    // Registrar componente Chart globalmente
    app.component('Chart', Chart);

    app.mount('#app');
})();
