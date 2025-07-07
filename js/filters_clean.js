/**
 * Manejo de filtros y búsquedas
 */
(function() {
    'use strict';
    
    console.log('🔍 [FILTERS] Cargando módulo de filtros...');

    class FiltersManager {
        constructor() {
            this.console = window.console;
            this.allData = [];
            this.filteredData = [];
            
            this.console.log('🔍 [FILTERS] FiltersManager inicializado');
        }

        /**
         * Inicializa los filtros con datos
         */
        initialize(data) {
            this.console.log('🔍 [FILTERS] Inicializando con datos:', data.length, 'registros');
            this.allData = data || [];
            this.populateModelFilter();
            this.populateDateFilter();
            this.populateProcessDropdown();
            this.setupDropdownEvents();
            this.restoreSavedFilters();
            this.setupFilterEvents();
        }

        /**
         * Popula el filtro de modelos
         */
        populateModelFilter() {
            this.console.log('🔍 [FILTERS] Populando filtro de modelos...');
            
            const modelFilter = document.getElementById('model-filter');
            if (!modelFilter) {
                this.console.error('❌ [FILTERS] Elemento model-filter no encontrado');
                return;
            }

            const uniqueModels = [...new Set(this.allData.map(item => item.Name).filter(Boolean))];
            this.console.log('🔍 [FILTERS] Modelos únicos encontrados:', uniqueModels);

            modelFilter.innerHTML = '<option value="">Seleccione un modelo</option>';
            uniqueModels.forEach(model => {
                const option = document.createElement('option');
                option.value = model;
                option.textContent = model;
                modelFilter.appendChild(option);
            });

            this.console.log('✅ [FILTERS] Filtro de modelos poblado con', uniqueModels.length, 'modelos');
        }

        /**
         * Popula el filtro de fechas
         */
        populateDateFilter() {
            this.console.log('🔍 [FILTERS] Populando filtro de fechas...');
            
            const dateFilter = document.getElementById('date-filter');
            if (!dateFilter) {
                this.console.error('❌ [FILTERS] Elemento date-filter no encontrado');
                return;
            }

            const uniqueDates = [...new Set(this.allData.map(item => item.Date).filter(Boolean))].sort();
            
            dateFilter.innerHTML = '<option value="">Todas las fechas</option>';
            uniqueDates.forEach(date => {
                const option = document.createElement('option');
                option.value = date;
                option.textContent = date;
                dateFilter.appendChild(option);
            });

            this.console.log('✅ [FILTERS] Filtro de fechas poblado con', uniqueDates.length, 'fechas');
        }

        /**
         * Popula el dropdown de procesos
         */
        populateProcessDropdown() {
            this.console.log('🔍 [FILTERS] Populando dropdown de procesos...');
            
            const container = document.getElementById('process-checkboxes-container');
            if (!container) {
                this.console.error('❌ [FILTERS] Contenedor process-checkboxes-container no encontrado');
                return;
            }

            const uniqueProcesses = [...new Set(this.allData.map(item => item.Process).filter(Boolean))].sort();
            this.console.log('🔍 [FILTERS] Procesos únicos encontrados:', uniqueProcesses);

            container.innerHTML = '';
            uniqueProcesses.forEach(process => {
                const checkboxDiv = document.createElement('div');
                checkboxDiv.className = 'flex items-center space-x-2';
                
                checkboxDiv.innerHTML = `
                    <input type="checkbox" id="process-${process}" value="${process}" 
                           class="process-checkbox w-4 h-4 text-indigo-600 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500 focus:ring-2" 
                           checked>
                    <label for="process-${process}" class="text-white text-sm cursor-pointer">${process}</label>
                `;
                
                container.appendChild(checkboxDiv);
            });

            this.console.log('✅ [FILTERS] Dropdown de procesos poblado con', uniqueProcesses.length, 'procesos');
        }

        /**
         * Configura eventos de los dropdowns
         */
        setupDropdownEvents() {
            // Dropdown de procesos
            const processBtn = document.getElementById('process-filter-btn');
            const processDropdown = document.getElementById('process-filter-dropdown');
            const processSelectAll = document.getElementById('process-select-all');

            if (processBtn && processDropdown) {
                processBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    processDropdown.classList.toggle('hidden');
                });
                
                // Prevenir cierre al hacer click dentro del dropdown
                processDropdown.addEventListener('click', (e) => e.stopPropagation());
            }

            if (processSelectAll) {
                processSelectAll.addEventListener('click', () => {
                    const checkboxes = document.querySelectorAll('.process-checkbox');
                    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
                    checkboxes.forEach(cb => cb.checked = !allChecked);
                    processSelectAll.textContent = allChecked ? 'Todos' : 'Ninguno';
                    this.applyFilters();
                    this.saveCurrentFilters();
                });
            }

            // Eventos de cambio en checkboxes de procesos
            document.addEventListener('change', (e) => {
                if (e.target.classList.contains('process-checkbox')) {
                    this.applyFilters();
                    this.saveCurrentFilters();
                }
            });

            // Cerrar dropdowns al hacer click fuera
            document.addEventListener('click', () => {
                if (processDropdown) processDropdown.classList.add('hidden');
            });

            this.console.log('🔍 [FILTERS] Eventos de dropdowns configurados');
        }

        /**
         * Configura eventos de filtros principales
         */
        setupFilterEvents() {
            const modelFilter = document.getElementById('model-filter');
            const dateFilter = document.getElementById('date-filter');
            const clearBtn = document.getElementById('clear-data-btn');

            if (modelFilter) {
                modelFilter.addEventListener('change', () => {
                    this.applyFilters();
                    this.saveCurrentFilters();
                });
            }

            if (dateFilter) {
                dateFilter.addEventListener('change', () => {
                    this.applyFilters();
                    this.saveCurrentFilters();
                });
            }

            if (clearBtn) {
                clearBtn.addEventListener('click', () => {
                    if (confirm('¿Estás seguro de que quieres limpiar todos los datos guardados?')) {
                        if (window.MQS_STORAGE) {
                            MQS_STORAGE.clearAllData();
                        }
                        location.reload();
                    }
                });
            }

            this.console.log('🔍 [FILTERS] Eventos de filtros configurados');
        }

        /**
         * Aplica todos los filtros activos
         */
        applyFilters() {
            this.console.log('🔍 [FILTERS] Aplicando filtros...');
            
            const modelFilter = document.getElementById('model-filter');
            const dateFilter = document.getElementById('date-filter');
            
            let filteredData = [...this.allData];

            // Filtro de modelo
            if (modelFilter && modelFilter.value) {
                filteredData = filteredData.filter(item => item.Name === modelFilter.value);
                this.console.log('🔍 [FILTERS] Filtro de modelo aplicado:', modelFilter.value);
            }

            // Filtro de fecha
            if (dateFilter && dateFilter.value) {
                filteredData = filteredData.filter(item => new Date(item.Date) >= new Date(dateFilter.value));
                this.console.log('🔍 [FILTERS] Filtro de fecha aplicado:', dateFilter.value);
            }

            // Filtro de procesos
            const selectedProcesses = this.getSelectedProcesses();
            if (selectedProcesses.length > 0) {
                filteredData = filteredData.filter(item => selectedProcesses.includes(item.Process));
                this.console.log('🔍 [FILTERS] Filtro de procesos aplicado:', selectedProcesses);
            }

            this.filteredData = filteredData;
            
            // Almacenar datos filtrados globalmente
            window.currentFilteredData = filteredData;
            
            // Actualizar UI
            if (window.MQS_UI) {
                MQS_UI.renderCards(filteredData);
                MQS_UI.renderProcessReports(filteredData);
            }
            
            // Actualizar visibilidad de procesos en la UI
            this.updateProcessVisibility();

            this.console.log('✅ [FILTERS] Filtros aplicados. Registros resultantes:', filteredData.length);
        }

        /**
         * Obtiene procesos seleccionados
         */
        getSelectedProcesses() {
            const checkboxes = document.querySelectorAll('.process-checkbox:checked');
            return Array.from(checkboxes).map(cb => cb.value);
        }

        /**
         * Actualiza la visibilidad de procesos en la UI
         */
        updateProcessVisibility() {
            const selectedProcesses = this.getSelectedProcesses();
            const processReports = document.querySelectorAll('[data-process]');
            
            processReports.forEach(report => {
                const processName = report.dataset.process;
                if (selectedProcesses.length === 0 || selectedProcesses.includes(processName)) {
                    report.style.display = '';
                } else {
                    report.style.display = 'none';
                }
            });

            this.console.log('🔍 [FILTERS] Visibilidad de procesos actualizada');
        }

        /**
         * Guarda filtros actuales
         */
        saveCurrentFilters() {
            if (!window.MQS_STORAGE) return;

            const modelFilter = document.getElementById('model-filter');
            const dateFilter = document.getElementById('date-filter');
            const selectedProcesses = this.getSelectedProcesses();

            MQS_STORAGE.saveFilters(
                modelFilter ? modelFilter.value : '',
                dateFilter ? dateFilter.value : '',
                selectedProcesses,
                [] // testcodes ya no se usan globalmente
            );

            this.console.log('🔍 [FILTERS] Filtros guardados');
        }

        /**
         * Restaura los filtros guardados desde storage
         */
        restoreSavedFilters() {
            if (!window.MQS_STORAGE) {
                this.console.warn('⚠️ [FILTERS] MQS_STORAGE no disponible para restaurar filtros');
                return;
            }

            const savedFilters = MQS_STORAGE.getSavedFilters();
            const modelFilter = document.getElementById('model-filter');
            const dateFilter = document.getElementById('date-filter');
            const heroTitle = document.getElementById('hero-title');

            if (savedFilters.model && modelFilter) {
                // Verificar que la opción existe
                const option = modelFilter.querySelector(`option[value="${savedFilters.model}"]`);
                if (option) {
                    modelFilter.value = savedFilters.model;
                    
                    // Actualizar el título del hero
                    if (heroTitle) {
                        heroTitle.textContent = savedFilters.model;
                        this.console.log('🎯 [FILTERS] Título del hero restaurado:', savedFilters.model);
                    }
                    
                    this.console.log('🔄 [FILTERS] Modelo restaurado:', savedFilters.model);
                } else {
                    this.console.warn('⚠️ [FILTERS] Modelo guardado no encontrado en opciones:', savedFilters.model);
                }
            }

            if (savedFilters.date && dateFilter) {
                // Verificar que la opción existe
                const option = dateFilter.querySelector(`option[value="${savedFilters.date}"]`);
                if (option) {
                    dateFilter.value = savedFilters.date;
                    this.console.log('🔄 [FILTERS] Fecha restaurada:', savedFilters.date);
                } else {
                    this.console.warn('⚠️ [FILTERS] Fecha guardada no encontrada en opciones:', savedFilters.date);
                }
            }

            // Aplicar filtros después de restaurar
            this.applyFilters();
            
            this.console.log('✅ [FILTERS] Filtros restaurados exitosamente');
        }
    }

    // Crear instancia global
    window.MQS_FILTERS = new FiltersManager();
    console.log('✅ [FILTERS] Módulo de filtros cargado exitosamente');

})();
