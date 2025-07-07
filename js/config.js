// ==========================================
// CONFIGURACIÓN Y CONSTANTES DEL SISTEMA
// ==========================================

/**
 * Configuración global de la aplicación MQS
 */
(function() {
    'use strict';
    
    console.log('🔧 [CONFIG] Cargando configuración...');
    
    // Configuración principal
    window.MQS_CONFIG = {
        API: {
            // URLs usando proxy local para evitar CORS
            // IMPORTANTE: Para evitar errores CORS, configura tu servidor local
            // para que redirija las rutas /gs/macros/s/* a https://script.google.com/macros/s/*
            //
            // CONFIGURACIONES DE PROXY SOPORTADAS:
            //
            // 1. Live Server (VS Code):
            //    En settings.json o .vscode/settings.json:
            //    {
            //      "liveServer.settings.proxy": [
            //        ["/gs/macros/s/", "https://script.google.com/macros/s/"]
            //      ]
            //    }
            //
            // 2. Nginx:
            //    location /gs/macros/s/ {
            //        proxy_pass https://script.google.com/macros/s/;
            //        proxy_set_header Host script.google.com;
            //    }
            //
            // 3. Apache (.htaccess):
            //    RewriteEngine On
            //    RewriteRule ^gs/macros/s/(.*)$ https://script.google.com/macros/s/$1 [P,L]
            //
            // 4. Express.js:
            //    const { createProxyMiddleware } = require('http-proxy-middleware');
            //    app.use('/gs/macros/s/', createProxyMiddleware({
            //        target: 'https://script.google.com',
            //        changeOrigin: true
            //    }));
            //
            // Si no tienes proxy configurado, el sistema usará automáticamente las URLs absolutas
            // pero puede haber problemas de CORS si Google Apps Script no permite el origen
            
            PRODUCTION_URL: '/gs/macros/s/AKfycbx5JakaAEwidZ3b9PzTIVV4VeefbRIyA6TaG8OJdNH5ZIgND8FL5ePhV1OughnE3E6Q/exec',
            FAILURES_URL: '/gs/macros/s/AKfycbzWtySKBpu3w7GwZIB3fOHYPO93WkEyqMHuYf_lcZe2gN3B7lp-63tRsvpsX8qd50gVRA/exec'
        },
        
        STORAGE: {
            KEYS: {
                STATE: 'explorerAppState',
                FAILURE_NOTES: 'explorerAppFailureNotes',
                FAILURE_IMAGES: 'explorerAppFailureImages',
                ISSUES: 'explorerAppIssues'
            }
        },
        
        FTY_TARGETS: {
            'UCT': 98.00,
            'FODTEST': 98.00,
            'XCVR_LT': 95.00,
            'LCDCAL': 98.00,
            'L2VISION': 95.00,
            'L2AR': 95.00,
            'DEPTHCAL': 98.00,
            'DEPTHVAL': 98.00,
            'TELECAL': 98.00,
            'TELEVAL': 98.00,
            'CFC': 98.00
        },
        
        PROCESSES: {
            ALL: ['IFLASH', 'UCT', 'FODTEST', 'XCVR_LT', 'LCDCAL', 'L2VISION', 'L2AR', 'DEPTHCAL', 'DEPTHVAL', 'TELECAL', 'TELEVAL', 'CFC'],
            MANUAL_FIELDS: ['CQA1', 'RUNNING', 'CQA2', 'CQA1 Def.', 'CQA2 Def.']
        },
        
        ISSUES: {
            INITIAL_DATA: [
                { id: 1, product: 'EXPLORER', description: 'CQA1 2000' },
                { id: 2, product: 'EXPLORER', description: 'RUNNING: 24hs, 2000' },
                { id: 3, product: 'EXPLORER', description: 'CQA2 2000' },
                { id: 4, product: 'EXPLORER', description: 'BO PACKING' },
                { id: 5, product: 'EXPLORER', description: 'PSO Videos' },
                { id: 6, product: 'EXPLORER', description: 'ORT: 3 unidades' },
                { id: 7, product: 'EXPLORER', description: 'Consumer screen protector: 100pcs.' },
                { id: 8, product: 'EXPLORER', description: '200 Gate: 100 Unidades no destructivo.' },
                { id: 9, product: 'EXPLORER', description: 'R&R' },
                { id: 10, product: 'EXPLORER', description: 'AMFE CFC' },
                { id: 11, product: 'EXPLORER', description: 'PSA activation check: 10pcs. Battery cover, camera deco y Battery PSA.' },
                { id: 12, product: 'EXPLORER', description: 'ISTA (packing). Prioridad.' },
                { id: 13, product: 'EXPLORER', description: 'ALT: 17 muestras (destructivo). Prioridad. Shower test - Tumbler test' },
                { id: 14, product: 'EXPLORER', description: 'BO SW' },
                { id: 15, product: 'EXPLORER', description: 'Droptest' },
                { id: 16, product: 'EXPLORER', description: 'Instructivo CQA1 y CQA2' },
                { id: 17, product: 'EXPLORER', description: 'IQC: Cosmético Funcional' }
            ]
        },
        
        UI: {
            LOADING_MESSAGES: {
                INIT: 'Inicializando sistema...',
                LOADING_DATA: 'Cargando datos de producción...',
                PROCESSING: 'Procesando información...',
                GENERATING_PDF: 'Generando PDF...'
            }
        }
    };
    
    console.log('✅ [CONFIG] Configuración cargada exitosamente:', window.MQS_CONFIG);
    console.log('🌐 [CONFIG] URLs configuradas para proxy local:');
    console.log('  - Producción:', window.MQS_CONFIG.API.PRODUCTION_URL);
    console.log('  - Fallas:', window.MQS_CONFIG.API.FAILURES_URL);
    
    // Validar que las URLs están definidas
    if (!window.MQS_CONFIG.API.PRODUCTION_URL || !window.MQS_CONFIG.API.FAILURES_URL) {
        console.error('❌ [CONFIG] URLs de API no están definidas correctamente');
    }
    
})();
