/**
 * Manejo de localStorage y persistencia de datos
 */
(function() {
    'use strict';
    
    console.log('💾 [STORAGE] Cargando módulo de almacenamiento...');

    class StorageManager {
        constructor() {
            this.console = window.console;
            this.manualData = {};
            this.failureNotes = {};
            this.failureImages = {};
            this.issuesState = {};
            
            this.console.log('💾 [STORAGE] StorageManager inicializado');
        }

        /**
         * Carga todos los datos desde localStorage
         */
        loadFromStorage() {
            try {
                // Verificar que MQS_CONFIG existe
                if (typeof window.MQS_CONFIG === 'undefined') {
                    throw new Error('MQS_CONFIG no está definido');
                }
                
                this.console.log('💾 [STORAGE] Cargando datos desde localStorage...');
                
                const savedState = localStorage.getItem(MQS_CONFIG.STORAGE.KEYS.STATE);
                const savedNotes = localStorage.getItem(MQS_CONFIG.STORAGE.KEYS.FAILURE_NOTES);
                const savedImages = localStorage.getItem(MQS_CONFIG.STORAGE.KEYS.FAILURE_IMAGES);
                const savedIssues = localStorage.getItem(MQS_CONFIG.STORAGE.KEYS.ISSUES);

                // Cargar datos manuales con estructura por fecha
                if (savedState) {
                    const parsedState = JSON.parse(savedState);
                    
                    // Migrar datos del formato anterior si es necesario
                    if (parsedState.manualData) {
                        // Verificar si los datos están en el formato anterior (fecha -> campos)
                        // o en el nuevo formato (modelo -> fecha -> campos)
                        const firstKey = Object.keys(parsedState.manualData)[0];
                        if (firstKey && typeof parsedState.manualData[firstKey] === 'object') {
                            const firstSubKey = Object.keys(parsedState.manualData[firstKey])[0];
                            // Si el primer subobjeto tiene campos como INPUT, Output, etc., es formato anterior
                            if (firstSubKey && ['INPUT', 'Output', 'Defectos', 'CQA1', 'RUNNING', 'CQA2'].includes(firstSubKey)) {
                                // Formato anterior: fecha -> campos
                                // Migrar a formato nuevo: modelo -> fecha -> campos
                                this.console.log('🔄 [STORAGE] Migrando datos del formato anterior...');
                                const oldData = parsedState.manualData;
                                this.manualData = {};
                                
                                // Si hay un modelo guardado, usar ese; sino, crear entrada genérica
                                const savedModel = parsedState.selectedModel || 'MIGRATED_DATA';
                                this.manualData[savedModel] = oldData;
                                
                                this.console.log('✅ [STORAGE] Datos migrados para modelo:', savedModel);
                            } else {
                                // Formato nuevo: modelo -> fecha -> campos
                                this.manualData = parsedState.manualData;
                            }
                        } else {
                            this.manualData = parsedState.manualData;
                        }
                    } else {
                        // Compatibilidad con versiones muy anteriores
                        this.manualData = parsedState;
                    }
                    
                    // Restaurar filtros guardados
                    this.savedFilters = {
                        selectedModel: parsedState.selectedModel || '',
                        selectedDate: parsedState.selectedDate || '',
                        selectedProcesses: parsedState.selectedProcesses || parsedState.selectedProcess ? [parsedState.selectedProcess] : [],
                        selectedTestCodes: parsedState.selectedTestCodes || []
                    };
                    
                    // Restaurar filtros de testcode por proceso
                    this.processTestCodeFilters = parsedState.processTestCodeFilters || {};
                } else {
                    this.manualData = {};
                    this.savedFilters = { selectedModel: '', selectedDate: '', selectedProcesses: [], selectedTestCodes: [] };
                    this.processTestCodeFilters = {};
                }

                this.failureNotes = savedNotes ? JSON.parse(savedNotes) : {};
                this.failureImages = savedImages ? JSON.parse(savedImages) : {};
                this.issuesState = savedIssues ? JSON.parse(savedIssues) : {};

                this.console.log('💾 [STORAGE] Datos cargados:', {
                    manualData: Object.keys(this.manualData).length,
                    failureNotes: Object.keys(this.failureNotes).length,
                    failureImages: Object.keys(this.failureImages).length,
                    issuesState: Object.keys(this.issuesState).length,
                    savedFilters: this.savedFilters
                });

            } catch (error) {
                this.console.error('❌ [STORAGE] Error al cargar desde localStorage:', error);
                this.initializeDefaults();
            }
        }

        /**
         * Inicializa valores por defecto
         */
        initializeDefaults() {
            this.manualData = {};
            this.failureNotes = {};
            this.failureImages = {};
            this.issuesState = {};
            this.savedFilters = { selectedModel: '', selectedDate: '', selectedProcesses: [], selectedTestCodes: [] };
            this.processTestCodeFilters = {};
            this.console.log('💾 [STORAGE] Valores por defecto inicializados');
        }

        /**
         * Guarda datos manuales (método legacy)
         */
        saveManualDataLegacy(data) {
            try {
                this.manualData = { ...this.manualData, ...data };
                localStorage.setItem(MQS_CONFIG.STORAGE.KEYS.STATE, JSON.stringify(this.manualData));
                this.console.log('💾 [STORAGE] Datos manuales guardados (legacy)');
            } catch (error) {
                this.console.error('❌ [STORAGE] Error al guardar dados manuales:', error);
            }
        }

        /**
         * Guarda un campo de datos manuales para una fecha específica
         */
        saveManualData(date, field, value) {
            try {
                this.console.log('🔍 [STORAGE] Iniciando guardado de datos manuales:', { date, field, value });
                
                const model = this.getSelectedModel();
                this.console.log('🔍 [STORAGE] Modelo seleccionado:', model);
                
                if (!model) {
                    this.console.warn('⚠️ [STORAGE] No hay modelo seleccionado para guardar datos manuales');
                    return;
                }

                // Estructura: modelo -> fecha -> campos
                if (!this.manualData[model]) {
                    this.manualData[model] = {};
                    this.console.log('🔍 [STORAGE] Creado contenedor para modelo:', model);
                }
                if (!this.manualData[model][date]) {
                    this.manualData[model][date] = {};
                    this.console.log('🔍 [STORAGE] Creado contenedor para fecha:', date);
                }
                
                this.manualData[model][date][field] = value;
                this.console.log('🔍 [STORAGE] Datos antes de guardar:', JSON.stringify(this.manualData[model][date]));
                
                // Guardar estado completo
                const stateToSave = {
                    manualData: this.manualData,
                    selectedModel: this.getSelectedModel(),
                    selectedDate: this.getSelectedDate(),
                    selectedProcess: this.getSelectedProcess(),
                    testcodeFilter: this.getTestcodeFilter()
                };
                
                localStorage.setItem(MQS_CONFIG.STORAGE.KEYS.STATE, JSON.stringify(stateToSave));
                this.console.log('💾 [STORAGE] Datos manuales guardados exitosamente:', model, date, field, value);
                
                // Verificar que se guardó correctamente
                const verification = localStorage.getItem(MQS_CONFIG.STORAGE.KEYS.STATE);
                if (verification) {
                    const parsed = JSON.parse(verification);
                    if (parsed.manualData && parsed.manualData[model] && parsed.manualData[model][date] && parsed.manualData[model][date][field] === value) {
                        this.console.log('✅ [STORAGE] Verificación exitosa: datos guardados correctamente');
                    } else {
                        this.console.error('❌ [STORAGE] Error en verificación: los datos no se guardaron correctamente');
                    }
                } else {
                    this.console.error('❌ [STORAGE] Error en verificación: no se pudo leer de localStorage');
                }
                
            } catch (error) {
                this.console.error('❌ [STORAGE] Error al guardar datos manuales:', error);
                this.console.error('❌ [STORAGE] Stack trace:', error.stack);
            }
        }

        /**
         * Obtiene datos manuales para una fecha específica
         */
        getManualData(date) {
            const model = this.getSelectedModel();
            this.console.log('🔍 [STORAGE] Obteniendo datos manuales para:', { model, date });
            
            if (!model) {
                this.console.warn('⚠️ [STORAGE] No hay modelo seleccionado para obtener datos manuales');
                return {};
            }
            
            const data = (this.manualData[model] && this.manualData[model][date]) ? this.manualData[model][date] : {};
            this.console.log('🔍 [STORAGE] Datos encontrados:', JSON.stringify(data));
            
            // Mostrar estructura completa de manualData para debug
            this.console.log('🔍 [STORAGE] Estructura completa manualData:', Object.keys(this.manualData));
            if (this.manualData[model]) {
                this.console.log('🔍 [STORAGE] Fechas disponibles para modelo', model, ':', Object.keys(this.manualData[model]));
            }
            
            return data;
        }

        /**
         * Obtiene todos los datos manuales de un modelo específico
         */
        getAllManualDataForModel(model = null) {
            const targetModel = model || this.getSelectedModel();
            if (!targetModel) {
                return {};
            }
            return this.manualData[targetModel] || {};
        }

        /**
         * Obtiene el modelo seleccionado actualmente
         */
        getSelectedModel() {
            const modelFilter = document.getElementById('model-filter');
            return modelFilter ? modelFilter.value : '';
        }

        /**
         * Obtiene la fecha seleccionada actualmente
         */
        getSelectedDate() {
            const dateFilter = document.getElementById('date-filter');
            return dateFilter ? dateFilter.value : '';
        }

        /**
         * Obtiene el proceso seleccionado actualmente (método legacy)
         */
        getSelectedProcess() {
            return '';
        }

        /**
         * Obtiene los procesos seleccionados actualmente
         */
        getSelectedProcesses() {
            try {
                const checkboxes = document.querySelectorAll('.process-checkbox:checked');
                return Array.from(checkboxes).map(cb => cb.value);
            } catch (error) {
                this.console.error('❌ [STORAGE] Error obteniendo procesos seleccionados:', error);
                return [];
            }
        }

        /**
         * Obtiene el filtro de testcode actual
         */
        getTestcodeFilter() {
            return '';
        }

        /**
         * Guarda notas de fallas
         */
        saveFailureNote(key, note) {
            try {
                this.failureNotes[key] = note;
                localStorage.setItem(MQS_CONFIG.STORAGE.KEYS.FAILURE_NOTES, JSON.stringify(this.failureNotes));
                this.console.log('💾 [STORAGE] Nota de falla guardada:', key);
            } catch (error) {
                this.console.error('❌ [STORAGE] Error al guardar nota de falla:', error);
            }
        }

        /**
         * Guarda imagen de falla
         */
        saveFailureImage(key, imageData) {
            try {
                if (imageData === null || imageData === undefined) {
                    // Eliminar imagen
                    delete this.failureImages[key];
                } else {
                    this.failureImages[key] = imageData;
                }
                localStorage.setItem(MQS_CONFIG.STORAGE.KEYS.FAILURE_IMAGES, JSON.stringify(this.failureImages));
                this.console.log('💾 [STORAGE] Imagen de falla guardada:', key, imageData ? 'añadida' : 'eliminada');
            } catch (error) {
                this.console.error('❌ [STORAGE] Error al guardar imagen de falla:', error);
            }
        }

        /**
         * Guarda estado de problemas
         */
        saveIssuesState(state) {
            try {
                this.issuesState = state;
                localStorage.setItem(MQS_CONFIG.STORAGE.KEYS.ISSUES, JSON.stringify(this.issuesState));
                this.console.log('💾 [STORAGE] Estado de problemas guardado');
            } catch (error) {
                this.console.error('❌ [STORAGE] Error al guardar estado de problemas:', error);
            }
        }

        /**
         * Obtiene los filtros guardados
         */
        getSavedFilters() {
            return this.savedFilters || { selectedModel: '', selectedDate: '', selectedProcesses: [], selectedTestCodes: [] };
        }

        /**
         * Guarda estado de filtros
         */
        /**
         * Guarda filtros de testcode específicos para un proceso
         */
        saveProcessTestCodeFilters(processName, selectedTestCodes) {
            try {
                if (!this.processTestCodeFilters) {
                    this.processTestCodeFilters = {};
                }
                
                this.processTestCodeFilters[processName] = selectedTestCodes || [];
                
                // Actualizar el estado completo
                const stateToSave = {
                    manualData: this.manualData,
                    selectedModel: this.getSelectedModel(),
                    selectedDate: this.getSelectedDate(),
                    selectedProcesses: this.getSelectedProcesses(),
                    processTestCodeFilters: this.processTestCodeFilters,
                    // Mantener compatibilidad con versiones anteriores
                    selectedTestCodes: this.savedFilters.selectedTestCodes || []
                };
                
                localStorage.setItem(MQS_CONFIG.STORAGE.KEYS.STATE, JSON.stringify(stateToSave));
                this.console.log('💾 [STORAGE] Filtros de testcode guardados para', processName, ':', selectedTestCodes);
            } catch (error) {
                this.console.error('❌ [STORAGE] Error al guardar filtros de testcode por proceso:', error);
            }
        }

        /**
         * Obtiene filtros de testcode para un proceso específico
         */
        getProcessTestCodeFilters(processName) {
            return this.processTestCodeFilters ? (this.processTestCodeFilters[processName] || []) : [];
        }

        /**
         * Obtiene todos los filtros de testcode por proceso
         */
        getAllProcessTestCodeFilters() {
            return this.processTestCodeFilters || {};
        }

        /**
         * Guarda filtros actuales
         */
        saveFilters(selectedModel, selectedDate, selectedProcesses, selectedTestCodes) {
            try {
                this.savedFilters = { selectedModel, selectedDate, selectedProcesses, selectedTestCodes };
                
                // Actualizar el estado completo
                const stateToSave = {
                    manualData: this.manualData,
                    selectedModel: selectedModel,
                    selectedDate: selectedDate,
                    selectedProcesses: selectedProcesses || [],
                    selectedTestCodes: selectedTestCodes || [],
                    processTestCodeFilters: this.processTestCodeFilters || {}
                };
                
                localStorage.setItem(MQS_CONFIG.STORAGE.KEYS.STATE, JSON.stringify(stateToSave));
                this.console.log('💾 [STORAGE] Filtros guardados:', { selectedModel, selectedDate, selectedProcesses, selectedTestCodes });
            } catch (error) {
                this.console.error('❌ [STORAGE] Error al guardar filtros:', error);
            }
        }

        /**
         * Guarda filtros de fechas seleccionadas
         */
        saveDateFilters(selectedDates) {
            try {
                localStorage.setItem('mqs_date_filters', JSON.stringify(selectedDates));
                this.console.log('💾 [STORAGE] Filtros de fecha guardados:', selectedDates.length);
            } catch (error) {
                this.console.error('❌ [STORAGE] Error guardando filtros de fecha:', error);
            }
        }

        /**
         * Obtiene filtros de fechas guardados
         */
        getDateFilters() {
            try {
                const saved = localStorage.getItem('mqs_date_filters');
                return saved ? JSON.parse(saved) : [];
            } catch (error) {
                this.console.error('❌ [STORAGE] Error obteniendo filtros de fecha:', error);
                return [];
            }
        }

        /**
         * Obtiene todos los datos
         */
        getAllData() {
            return {
                manualData: this.manualData,
                failureNotes: this.failureNotes,
                failureImages: this.failureImages,
                issuesState: this.issuesState
            };
        }

        /**
         * Limpia todos los datos
         */
        clearAllData() {
            try {
                localStorage.removeItem(MQS_CONFIG.STORAGE.KEYS.STATE);
                localStorage.removeItem(MQS_CONFIG.STORAGE.KEYS.FAILURE_NOTES);
                localStorage.removeItem(MQS_CONFIG.STORAGE.KEYS.FAILURE_IMAGES);
                localStorage.removeItem(MQS_CONFIG.STORAGE.KEYS.ISSUES);
                
                this.initializeDefaults();
                this.console.log('💾 [STORAGE] Todos los datos limpiados');
            } catch (error) {
                this.console.error('❌ [STORAGE] Error al limpiar datos:', error);
            }
        }

        /**
         * Método de debug para mostrar el estado completo del localStorage
         */
        debugShowStorageState() {
            try {
                this.console.log('🐛 [DEBUG] === ESTADO COMPLETO DEL STORAGE ===');
                this.console.log('🐛 [DEBUG] Modelo actual:', this.getSelectedModel());
                this.console.log('🐛 [DEBUG] manualData estructura completa:', JSON.stringify(this.manualData, null, 2));
                
                const rawState = localStorage.getItem(MQS_CONFIG.STORAGE.KEYS.STATE);
                if (rawState) {
                    const parsed = JSON.parse(rawState);
                    this.console.log('🐛 [DEBUG] localStorage raw:', JSON.stringify(parsed, null, 2));
                } else {
                    this.console.log('🐛 [DEBUG] localStorage está vacío');
                }
                
                // Mostrar datos por modelo
                for (const model in this.manualData) {
                    this.console.log(`🐛 [DEBUG] Modelo ${model}:`, Object.keys(this.manualData[model]));
                    for (const date in this.manualData[model]) {
                        this.console.log(`🐛 [DEBUG] - Fecha ${date}:`, this.manualData[model][date]);
                    }
                }
                this.console.log('🐛 [DEBUG] === FIN ESTADO STORAGE ===');
            } catch (error) {
                this.console.error('❌ [DEBUG] Error mostrando estado del storage:', error);
            }
        }
    }

    // Crear instancia global
    window.MQS_STORAGE = new StorageManager();
    
    // Agregar funciones de debug globales
    window.debugStorage = function() {
        if (window.MQS_STORAGE) {
            window.MQS_STORAGE.debugShowStorageState();
        } else {
            console.error('MQS_STORAGE no disponible');
        }
    };
    
    window.debugManualData = function(model = null, date = null) {
        if (!window.MQS_STORAGE) {
            console.error('MQS_STORAGE no disponible');
            return;
        }
        
        const targetModel = model || window.MQS_STORAGE.getSelectedModel();
        if (!targetModel) {
            console.log('🐛 [DEBUG] No hay modelo seleccionado');
            return;
        }
        
        if (date) {
            const data = window.MQS_STORAGE.getManualData(date);
            console.log(`🐛 [DEBUG] Datos para ${targetModel} - ${date}:`, data);
        } else {
            const allData = window.MQS_STORAGE.getAllManualDataForModel(targetModel);
            console.log(`🐛 [DEBUG] Todos los datos para ${targetModel}:`, allData);
        }
    };
    
    console.log('✅ [STORAGE] Módulo de almacenamiento cargado exitosamente');
    console.log('💡 [DEBUG] Funciones disponibles: debugStorage(), debugManualData(modelo, fecha)');

})();
