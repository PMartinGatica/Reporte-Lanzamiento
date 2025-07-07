// ==========================================
// MANEJO DE APIS Y DATOS EXTERNOS
// ==========================================

/**
 * Manejo de APIs y datos externos
 */
class APIManager {
    constructor() {
        this.console = window.console;
    }

    /**
     * Obtiene datos de una URL específica con fallback automático
     */
    async fetchData(url, description = 'datos') {
        this.console.log(`🔄 [API] Iniciando fetch de ${description}:`, url);
        
        // Detectar si es una ruta relativa para proxy local
        const isProxyRoute = url.startsWith('/gs/macros/s/');
        
        try {
            let response = await this.attemptFetch(url, description, 'proxy local');
            
            // Si la ruta proxy falla (404, 500, etc.), intentar con URL absoluta
            if (!response.ok && isProxyRoute && (response.status === 404 || response.status === 500)) {
                this.console.log(`⚠️ [API] Proxy local falló (${response.status}), intentando URL absoluta...`);
                
                // Convertir ruta relativa a URL absoluta
                const absoluteUrl = this.convertToAbsoluteUrl(url);
                this.console.log(`🔄 [API] Intentando con URL absoluta: ${absoluteUrl}`);
                
                response = await this.attemptFetch(absoluteUrl, description, 'URL absoluta (fallback)');
            }
            
            if (!response.ok) {
                throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
            }
            
            const rawText = await response.text();
            this.console.log(`📝 [API] Texto crudo recibido (primeros 200 chars):`, 
                rawText.substring(0, 200) + (rawText.length > 200 ? '...' : ''));
            
            let responseData;
            try {
                responseData = JSON.parse(rawText);
                this.console.log(`✅ [API] JSON parseado exitosamente`);
            } catch (parseError) {
                this.console.error(`❌ [API] Error al parsear JSON:`, parseError);
                this.console.log(`📄 [API] Contenido completo de la respuesta:`, rawText);
                throw new Error(`Error al parsear JSON: ${parseError.message}`);
            }
            
            this.console.log(`📦 [API] Estructura de respuesta:`, {
                tipo: typeof responseData,
                keys: typeof responseData === 'object' ? Object.keys(responseData) : 'N/A',
                success: responseData?.success,
                dataType: Array.isArray(responseData?.data) ? 'array' : typeof responseData?.data,
                dataLength: Array.isArray(responseData?.data) ? responseData.data.length : 'N/A'
            });
            
            // Validar estructura esperada
            if (responseData?.success && Array.isArray(responseData.data)) {
                this.console.log(`✅ [API] Datos válidos obtenidos:`, {
                    registros: responseData.data.length,
                    primerRegistro: responseData.data[0] || 'Sin datos',
                    camposDelPrimerRegistro: responseData.data[0] ? Object.keys(responseData.data[0]) : []
                });
                return responseData.data;
            } else {
                this.console.error(`❌ [API] Estructura de respuesta inesperada:`, responseData);
                throw new Error('La respuesta no tiene el formato esperado (success: true, data: array)');
            }
            
        } catch (error) {
            this.console.error(`💥 [API] Error al obtener ${description}:`, {
                mensaje: error.message,
                stack: error.stack,
                url: url
            });
            throw error;
        }
    }

    /**
     * Obtiene datos de producción
     */
    async getProductionData() {
        return await this.fetchData(MQS_CONFIG.API.PRODUCTION_URL, 'datos de producción');
    }

    /**
     * Obtiene datos de fallas
     */
    async getFailuresData() {
        return await this.fetchData(MQS_CONFIG.API.FAILURES_URL, 'datos de fallas');
    }

    /**
     * Prueba de conectividad
     */
    async testConnectivity() {
        this.console.log(`🔍 [API] Iniciando prueba de conectividad...`);
        this.console.log(`🌐 [API] Usando proxy local - saltando test de conectividad HEAD`);
        this.console.log(`📡 [API] URLs configuradas:`);
        this.console.log(`  - Producción: ${MQS_CONFIG.API.PRODUCTION_URL}`);
        this.console.log(`  - Fallas: ${MQS_CONFIG.API.FAILURES_URL}`);
        
        // Con proxy local, saltamos el test de conectividad HEAD
        // que puede causar problemas CORS
        this.console.log(`✅ [API] Test de conectividad saltado - usando proxy local`);
    }

    /**
     * Intenta hacer fetch con manejo de errores específicos
     */
    async attemptFetch(url, description, method) {
        try {
            this.console.log(`🌐 [API] Probando ${method}: ${url}`);
            
            const response = await fetch(url);
            
            this.console.log(`📡 [API] Respuesta de ${method}:`, {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok,
                url: response.url
            });
            
            return response;
            
        } catch (error) {
            this.console.log(`❌ [API] Error con ${method}:`, error.message);
            
            // Si es error CORS, mostrar mensaje específico
            if (error.message.includes('CORS') || error.message.includes('Cross-Origin')) {
                this.console.log(`🚫 [API] Error CORS detectado - necesitas configurar proxy local o servidor CORS`);
                this.showCorsMessage();
            }
            
            throw error;
        }
    }

    /**
     * Convierte ruta relativa de proxy a URL absoluta de Google Apps Script
     */
    convertToAbsoluteUrl(proxyPath) {
        // Extraer el ID del script de la ruta proxy
        // /gs/macros/s/{SCRIPT_ID}/exec -> https://script.google.com/macros/s/{SCRIPT_ID}/exec
        const match = proxyPath.match(/\/gs\/macros\/s\/([^\/]+)\/(.+)/);
        if (match) {
            const [, scriptId, endpoint] = match;
            return `https://script.google.com/macros/s/${scriptId}/${endpoint}`;
        }
        return proxyPath; // Si no coincide el patrón, devolver tal como está
    }

    /**
     * Muestra mensaje informativo sobre CORS
     */
    showCorsMessage() {
        if (typeof MQS_UI !== 'undefined' && MQS_UI.showNotification) {
            MQS_UI.showNotification(
                'Problema de conectividad: Para evitar errores CORS, configura un proxy local o usa un servidor web con CORS habilitado.',
                'warning'
            );
        } else {
            console.warn('💡 [API] Para evitar errores CORS, configura un proxy local que redirija /gs/macros/s/* a https://script.google.com/macros/s/*');
        }
    }
}

// Instancia global
window.MQS_API = new APIManager();
