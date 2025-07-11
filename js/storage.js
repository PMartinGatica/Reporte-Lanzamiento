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
                    this.manualData = parsedState.manualData || parsedState; // Compatibilidad con versiones anteriores
                    
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
                if (!this.manualData[date]) {
                    this.manualData[date] = {};
                }
                this.manualData[date][field] = value;
                
                // Guardar estado completo
                const stateToSave = {
                    manualData: this.manualData,
                    selectedModel: this.getSelectedModel(),
                    selectedDate: this.getSelectedDate(),
                    selectedProcess: this.getSelectedProcess(),
                    testcodeFilter: this.getTestcodeFilter()
                };
                
                localStorage.setItem(MQS_CONFIG.STORAGE.KEYS.STATE, JSON.stringify(stateToSave));
                this.console.log('💾 [STORAGE] Datos manuales guardados:', date, field, value);
            } catch (error) {
                this.console.error('❌ [STORAGE] Error al guardar datos manuales:', error);
            }
        }

        /**
         * Obtiene datos manuales para una fecha específica
         */
        getManualData(date) {
            return this.manualData[date] || {};
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
    }

    // Crear instancia global
    window.MQS_STORAGE = new StorageManager();
    console.log('✅ [STORAGE] Módulo de almacenamiento cargado exitosamente');

})();
