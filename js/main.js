// ==========================================
// ARCHIVO PRINCIPAL - INICIALIZACIÓN Y COORDINACIÓN
// ==========================================

/**
 * Archivo principal - Inicialización y coordinación
 */
class MQSApplication {
    constructor() {
        this.console = window.console;
        this.initialized = false;
        this.startTime = Date.now();
        
        this.console.log(`🚀 [MAIN] Iniciando MQS Application...`);
        
        // Verificación defensiva de MQS_CONFIG
        if (typeof window.MQS_CONFIG === 'undefined') {
            this.console.error(`❌ [MAIN] MQS_CONFIG no está definido. Verificando scripts cargados...`);
            this.console.error(`❌ [MAIN] Scripts disponibles:`, Object.keys(window).filter(key => key.startsWith('MQS_')));
            throw new Error('MQS_CONFIG no está definido. Verifica que config.js se carga correctamente.');
        }
        
        this.console.log(`📋 [MAIN] Configuración cargada:`, MQS_CONFIG);
    }

    /**
     * Inicialización principal de la aplicación
     */
    async initialize() {
        this.console.log(`⚡ [MAIN] Iniciando secuencia de inicialización...`);
        
        try {
            // 1. Verificar dependencias
            this.console.log(`🔍 [MAIN] Verificando dependencias...`);
            this.checkDependencies();
            
            // 2. Configurar UI inicial
            this.console.log(`🎨 [MAIN] Configurando UI inicial...`);
            MQS_UI.initializeUI();
            MQS_UI.showLoading(true, 'Inicializando sistema...');
            
            // 3. Cargar estado guardado
            this.console.log(`💾 [MAIN] Cargando estado guardado...`);
            MQS_STORAGE.loadFromStorage();
            
            // 4. Probar conectividad
            this.console.log(`🌐 [MAIN] Probando conectividad...`);
            await MQS_API.testConnectivity();
            
            // 5. Cargar datos
            this.console.log(`📡 [MAIN] Cargando datos de APIs...`);
            MQS_UI.showLoading(true, 'Cargando datos de producción...');
            
            const [productionData, failuresData] = await Promise.all([
                MQS_API.getProductionData().catch(error => {
                    this.console.error(`❌ [MAIN] Error en datos de producción:`, error);
                    return [];
                }),
                MQS_API.getFailuresData().catch(error => {
                    this.console.error(`❌ [MAIN] Error en datos de fallas:`, error);
                    return [];
                })
            ]);
            
            this.console.log(`📊 [MAIN] Datos cargados:`, {
                produccion: productionData.length,
                fallas: failuresData.length
            });
            
            // 6. Almacenar datos globalmente
            window.MQS_DATA = {
                production: productionData,
                failures: failuresData
            };
            
            // 7. Inicializar filtros
            this.console.log(`🔧 [MAIN] Inicializando filtros...`);
            MQS_FILTERS.initialize(productionData);
            
            // 8. Restaurar filtros guardados
            this.console.log(`🔍 [MAIN] Restaurando filtros guardados...`);
            this.restoreSavedFilters();
            
            // 9. Inicializar seguimiento de problemas
            this.console.log(`📋 [MAIN] Inicializando seguimiento de problemas...`);
            MQS_ISSUES.initialize();
            
            // 10. Inicializar manejo de fallas
            this.console.log(`💥 [MAIN] Inicializando manejo de fallas...`);
            if (window.MQS_FAILURES) {
                MQS_FAILURES.initialize();
            }
            
            // 11. Aplicar filtros iniciales
            this.console.log(`🎯 [MAIN] Aplicando configuración inicial...`);
            MQS_FILTERS.applyFilters();
            
            this.console.log(`✅ [MAIN] Inicialización completada en ${Date.now() - this.startTime}ms`);
            this.initialized = true;
            
        } catch (error) {
            this.console.error(`💥 [MAIN] Error durante la inicialización:`, error);
            MQS_UI.showError(`Error durante la inicialización: ${error.message}`);
        } finally {
            MQS_UI.showLoading(false);
        }
    }

    /**
     * Verifica que todas las dependencias estén disponibles
     */
    checkDependencies() {
        const dependencies = [
            { name: 'MQS_CONFIG', obj: window.MQS_CONFIG },
            { name: 'MQS_STORAGE', obj: window.MQS_STORAGE },
            { name: 'MQS_API', obj: window.MQS_API },
            { name: 'MQS_UI', obj: window.MQS_UI },
            { name: 'MQS_FILTERS', obj: window.MQS_FILTERS },
            { name: 'MQS_ISSUES', obj: window.MQS_ISSUES },
            { name: 'MQS_FAILURES', obj: window.MQS_FAILURES },
            { name: 'Chart.js', obj: window.Chart },
            { name: 'jsPDF', obj: window.jspdf }
        ];
        
        const missing = dependencies.filter(dep => !dep.obj);
        
        if (missing.length > 0) {
            const missingNames = missing.map(dep => dep.name).join(', ');
            throw new Error(`Dependencias faltantes: ${missingNames}`);
        }
        
        this.console.log(`✅ [MAIN] Todas las dependencias están disponibles`);
        
        // Registrar plugins de Chart.js
        if (window.ChartDataLabels) {
            Chart.register(ChartDataLabels);
            this.console.log(`✅ [MAIN] Plugin ChartDataLabels registrado`);
        }
    }

    /**
     * Restaura los filtros guardados (MEJORADO CON PERSISTENCIA)
     */
    restoreSavedFilters() {
        try {
            const modelFilter = document.getElementById('model-filter');
            const dateFilter = document.getElementById('date-filter');
            
            // Restaurar filtros usando localStorage mejorado
            const savedFilters = JSON.parse(localStorage.getItem('explorer_dashboard_filters') || '{}');
            this.console.log(`🔍 [MAIN] Restaurando filtros desde localStorage:`, savedFilters);
            
            if (modelFilter && savedFilters.model) {
                setTimeout(() => {
                    const option = Array.from(modelFilter.options).find(opt => opt.value === savedFilters.model);
                    if (option) {
                        modelFilter.value = savedFilters.model;
                        // Disparar evento para aplicar filtro
                        const event = new Event('change', { bubbles: true });
                        modelFilter.dispatchEvent(event);
                        this.console.log(`✅ [MAIN] Modelo restaurado: ${savedFilters.model}`);
                    }
                }, 500);
            }
            
            if (dateFilter && savedFilters.date) {
                setTimeout(() => {
                    const option = Array.from(dateFilter.options).find(opt => opt.value === savedFilters.date);
                    if (option) {
                        dateFilter.value = savedFilters.date;
                        // Disparar evento para aplicar filtro
                        const event = new Event('change', { bubbles: true });
                        dateFilter.dispatchEvent(event);
                        this.console.log(`✅ [MAIN] Fecha restaurada: ${savedFilters.date}`);
                    }
                }, 700);
            }

            // Restaurar filtros de procesos si existen
            if (savedFilters.processes && Array.isArray(savedFilters.processes)) {
                setTimeout(() => {
                    this.restoreProcessFilters(savedFilters.processes);
                }, 1000);
            }

            // Configurar listeners para persistencia automática
            this.setupFilterPersistence();
            
        } catch (error) {
            this.console.error(`❌ [MAIN] Error al restaurar filtros:`, error);
        }
    }

    /**
     * Configura persistencia automática de filtros
     */
    setupFilterPersistence() {
        const modelFilter = document.getElementById('model-filter');
        const dateFilter = document.getElementById('date-filter');

        if (modelFilter) {
            modelFilter.addEventListener('change', () => {
                this.saveFilterValue('model', modelFilter.value);
            });
        }

        if (dateFilter) {
            dateFilter.addEventListener('change', () => {
                this.saveFilterValue('date', dateFilter.value);
            });
        }

        // Configurar persistencia para filtros de procesos
        const processCheckboxes = document.querySelectorAll('#process-checkboxes-container input[type="checkbox"]');
        processCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.saveProcessFilters();
            });
        });
    }

    /**
     * Guarda un valor de filtro específico
     */
    saveFilterValue(filterKey, value) {
        try {
            const savedFilters = JSON.parse(localStorage.getItem('explorer_dashboard_filters') || '{}');
            savedFilters[filterKey] = value;
            savedFilters.timestamp = Date.now();
            localStorage.setItem('explorer_dashboard_filters', JSON.stringify(savedFilters));
            this.console.log(`💾 [MAIN] Guardado filtro ${filterKey}:`, value);
        } catch (error) {
            this.console.warn('⚠️ [MAIN] Error guardando filtro:', error);
        }
    }

    /**
     * Guarda filtros de procesos
     */
    saveProcessFilters() {
        const checkboxes = document.querySelectorAll('#process-checkboxes-container input[type="checkbox"]');
        const selectedProcesses = [];

        checkboxes.forEach(checkbox => {
            if (checkbox.checked) {
                selectedProcesses.push(checkbox.value || checkbox.dataset.process);
            }
        });

        this.saveFilterValue('processes', selectedProcesses);
    }

    /**
     * Restaura filtros de procesos
     */
    restoreProcessFilters(savedProcesses) {
        const checkboxes = document.querySelectorAll('#process-checkboxes-container input[type="checkbox"]');
        
        checkboxes.forEach(checkbox => {
            const processName = checkbox.value || checkbox.dataset.process;
            if (savedProcesses.includes(processName)) {
                checkbox.checked = true;
                // Disparar evento change
                const event = new Event('change', { bubbles: true });
                checkbox.dispatchEvent(event);
                this.console.log('✅ [MAIN] Proceso restaurado:', processName);
            }
        });
    }

    /**
     * Limpia todos los datos guardados incluyendo filtros
     */
    clearAllSavedData() {
        try {
            // Limpiar datos originales del storage
            if (window.MQS_STORAGE && typeof MQS_STORAGE.clearAllData === 'function') {
                MQS_STORAGE.clearAllData();
            }
            
            // Limpiar filtros guardados
            localStorage.removeItem('explorer_dashboard_filters');
            localStorage.removeItem('explorer_objectives_state');
            localStorage.removeItem('mqs_objectives');
            
            this.console.log('🗑️ [MAIN] Todos los datos y filtros limpiados');
            
            // Recargar página para aplicar cambios
            setTimeout(() => {
                location.reload();
            }, 500);
            
        } catch (error) {
            this.console.error('❌ [MAIN] Error limpiando datos:', error);
        }
    }

    /**
     * Exporta el dashboard como HTML completo
     */
    async exportDashboardHTML() {
        try {
            this.console.log('📄 [MAIN] Iniciando exportación HTML...');
            
            // Mostrar loading
            if (window.MQS_UI && typeof MQS_UI.showLoading === 'function') {
                MQS_UI.showLoading(true, 'Generando reporte HTML...');
            }

            // Capturar estilos CSS de la página
            const styles = Array.from(document.styleSheets)
                .map(sheet => {
                    try {
                        return Array.from(sheet.cssRules)
                            .map(rule => rule.cssText)
                            .join('\n');
                    } catch (e) {
                        return '';
                    }
                })
                .join('\n');

            // Clonar el contenido del body
            const bodyClone = document.body.cloneNode(true);
            
            // Limpiar elementos innecesarios
            const elementsToRemove = bodyClone.querySelectorAll('script, noscript, #pdf-loading, .scroll-to-top');
            elementsToRemove.forEach(el => el.remove());
            
            // Convertir inputs, selects y textareas a texto plano
            bodyClone.querySelectorAll('input, textarea, select').forEach(element => {
                const span = document.createElement('span');
                
                if (element.tagName === 'SELECT') {
                    const selectedOption = element.options[element.selectedIndex];
                    span.textContent = selectedOption ? selectedOption.text : element.value;
                } else if (element.tagName === 'TEXTAREA') {
                    span.textContent = element.value || element.placeholder || '';
                    span.style.whiteSpace = 'pre-wrap';
                } else {
                    span.textContent = element.value || element.placeholder || '';
                }
                
                // Mantener estilos similares
                span.className = element.className;
                span.style.cssText = element.style.cssText;
                span.style.display = 'inline-block';
                span.style.border = '1px solid #ccc';
                span.style.padding = '4px 8px';
                span.style.backgroundColor = '#f8f9fa';
                span.style.borderRadius = '4px';
                span.style.color = '#333';
                
                element.parentNode.replaceChild(span, element);
            });

            const currentURL = window.location.href;
            const timestamp = new Date().toLocaleDateString('es-ES') + ' a las ' + new Date().toLocaleTimeString('es-ES');
            
            // Crear HTML completo
            const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Explorer Dashboard - Reporte ${new Date().toLocaleDateString('es-ES')}</title>
    <style>
        /* Estilos originales */
        ${styles}
        
        /* Estilos para impresión */
        @media print {
            body { margin: 0; padding: 20px; }
            .no-print { display: none !important; }
        }
        
        /* Mejoras para el reporte */
        body {
            background: white !important;
            color: #333 !important;
        }
        
        .text-white, .text-gray-100, .text-gray-200 {
            color: #333 !important;
        }
        
        .bg-gray-900, .bg-gray-800, .bg-gray-700 {
            background-color: #f8f9fa !important;
            border: 1px solid #dee2e6 !important;
        }
        
        .report-header {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
            color: white !important;
            border-radius: 10px;
        }
        
        .report-metadata {
            background: #e9ecef;
            border: 1px solid #ced4da;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            font-size: 13px;
            color: #495057;
        }
    </style>
</head>
<body>
    <!-- Header del Reporte -->
    <div class="report-header">
        <h1 style="margin: 0; font-size: 2.5rem; font-weight: bold;">🚀 EXPLORER DASHBOARD</h1>
        <p style="margin: 10px 0 0 0; font-size: 1.2rem;">Reporte Completo - ${timestamp}</p>
    </div>

    <!-- Metadata del Reporte -->
    <div class="report-metadata">
        <strong>📊 Información del Reporte:</strong><br>
        • URL Original: ${currentURL}<br>
        • Fecha de generación: ${timestamp}<br>
        • Tipo: Dashboard Explorer - HTML Completo<br>
        • Contenido: Copia exacta de la página web
    </div>

    <!-- Contenido Original -->
    ${bodyClone.innerHTML}

    <!-- Footer del Reporte -->
    <div class="report-metadata" style="text-align: center; margin-top: 40px;">
        <p><strong>📄 Reporte generado automáticamente por Explorer Dashboard</strong></p>
        <p>Este archivo contiene una copia exacta de la página web original</p>
        <p><em>Tip: Usa Ctrl+P para imprimir o "Guardar como PDF" desde el navegador</em></p>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            console.log('📄 Reporte HTML cargado exitosamente');
            
            // Permitir impresión con Ctrl+P
            document.addEventListener('keydown', function(e) {
                if (e.ctrlKey && e.key === 'p') {
                    window.print();
                }
            });
        });
    </script>
</body>
</html>`;

            // Descargar archivo HTML
            const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Explorer_Dashboard_${new Date().toISOString().split('T')[0]}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.console.log('✅ [MAIN] Reporte HTML generado exitosamente');
            
            // Mostrar notificación de éxito
            this.showNotification('Reporte HTML descargado exitosamente. Se puede abrir en cualquier navegador.', 'success');

        } catch (error) {
            this.console.error('❌ [MAIN] Error generando HTML:', error);
            this.showNotification('Error al generar reporte HTML.', 'error');
        } finally {
            if (window.MQS_UI && typeof MQS_UI.showLoading === 'function') {
                MQS_UI.showLoading(false);
            }
        }
    }

    /**
     * Muestra notificaciones al usuario
     */
    showNotification(message, type = 'info') {
        const colors = {
            'success': '#10b981',
            'error': '#ef4444',
            'info': '#3b82f6',
            'warning': '#f59e0b'
        };

        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type] || colors.info};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-size: 14px;
            max-width: 350px;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Animar entrada
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remover después de 5 segundos
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 5000);
    }
}

/**
 * Herramientas de debug disponibles globalmente (AMPLIADAS)
 */
window.MQS_DEBUG = {
    /**
     * Información de diagnóstico del sistema
     */
    getDiagnostics() {
        return {
            initialized: window.MQS_APP?.initialized || false,
            dataLoaded: {
                production: window.MQS_DATA?.production?.length || 0,
                failures: window.MQS_DATA?.failures?.length || 0
            },
            storage: {
                hasManualData: Object.keys(MQS_STORAGE?.manualData || {}).length > 0,
                hasFailureNotes: Object.keys(MQS_STORAGE?.failureNotes || {}).length > 0,
                hasIssuesState: Object.keys(MQS_STORAGE?.issuesState || {}).length > 0,
                hasSavedFilters: localStorage.getItem('explorer_dashboard_filters') !== null,
                hasObjectivesState: localStorage.getItem('mqs_objectives') !== null
            },
            filters: JSON.parse(localStorage.getItem('explorer_dashboard_filters') || '{}'),
            config: MQS_CONFIG,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
        };
    },
    
    /**
     * Reinicia la aplicación
     */
    async restart() {
        console.log('🔄 [DEBUG] Reiniciando aplicación...');
        location.reload();
    },
    
    /**
     * Prueba manual de APIs
     */
    async testAPIs() {
        console.log('🧪 [DEBUG] Probando APIs manualmente...');
        
        try {
            const production = await MQS_API.getProductionData();
            console.log('✅ [DEBUG] Datos de producción:', production.length, 'registros');
        } catch (error) {
            console.error('❌ [DEBUG] Error en API de producción:', error);
        }
        
        try {
            const failures = await MQS_API.getFailuresData();
            console.log('✅ [DEBUG] Datos de fallas:', failures.length, 'registros');
        } catch (error) {
            console.error('❌ [DEBUG] Error en API de fallas:', error);
        }
    },
    
    /**
     * Exporta un backup de todos los datos
     */
    exportBackup() {
        const backup = {
            timestamp: new Date().toISOString(),
            diagnostics: this.getDiagnostics(),
            storage: MQS_STORAGE?.getAllData?.() || {},
            data: window.MQS_DATA,
            filters: JSON.parse(localStorage.getItem('explorer_dashboard_filters') || '{}'),
            objectives: JSON.parse(localStorage.getItem('mqs_objectives') || '[]')
        };
        
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mqs-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        console.log('💾 [DEBUG] Backup exportado');
    },

    /**
     * Exporta dashboard como HTML (NUEVA FUNCIONALIDAD)
     */
    async exportHTML() {
        if (window.MQS_APP && typeof window.MQS_APP.exportDashboardHTML === 'function') {
            await window.MQS_APP.exportDashboardHTML();
        } else {
            console.error('❌ [DEBUG] Función exportHTML no disponible');
        }
    },

    /**
     * Limpia todos los datos guardados (NUEVA FUNCIONALIDAD)
     */
    clearAllData() {
        if (window.MQS_APP && typeof window.MQS_APP.clearAllSavedData === 'function') {
            const confirmed = confirm('¿Estás seguro de que quieres limpiar todos los datos guardados? Esta acción no se puede deshacer.');
            if (confirmed) {
                window.MQS_APP.clearAllSavedData();
            }
        } else {
            console.error('❌ [DEBUG] Función clearAllData no disponible');
        }
    },

    /**
     * Muestra el estado actual de los filtros
     */
    showFiltersState() {
        const filters = JSON.parse(localStorage.getItem('explorer_dashboard_filters') || '{}');
        console.log('🔍 [DEBUG] Estado actual de filtros:', filters);
        return filters;
    },

    /**
     * Fuerza la restauración de filtros
     */
    restoreFilters() {
        if (window.MQS_APP && typeof window.MQS_APP.restoreSavedFilters === 'function') {
            window.MQS_APP.restoreSavedFilters();
            console.log('🔄 [DEBUG] Filtros restaurados manualmente');
        } else {
            console.error('❌ [DEBUG] Función restoreFilters no disponible');
        }
    }
};

/**
 * Inicialización cuando el DOM esté listo
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📄 [MAIN] DOM cargado, verificando dependencias...');
    
    // Lista de verificación de dependencias
    const requiredDependencies = [
        'MQS_CONFIG',
        'MQS_STORAGE', 
        'MQS_API',
        'MQS_UI',
        'MQS_FILTERS',
        'MQS_ISSUES'
    ];
    
    const missingDeps = requiredDependencies.filter(dep => typeof window[dep] === 'undefined');
    
    if (missingDeps.length > 0) {
        console.error('💥 [MAIN] Dependencias faltantes:', missingDeps);
        console.log('🔍 [MAIN] Scripts disponibles:', Object.keys(window).filter(key => key.startsWith('MQS_')));
        return;
    }
    
    try {
        window.MQS_APP = new MQSApplication();
        await window.MQS_APP.initialize();
        console.log('🎉 [MAIN] Aplicación lista para usar');
    } catch (error) {
        console.error('💥 [MAIN] Error fatal durante la inicialización:', error);
    }
});

// Manejo global de errores
window.addEventListener('error', (event) => {
    console.error('💥 [GLOBAL] Error no capturado:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('💥 [GLOBAL] Promise rechazada:', event.reason);
});
