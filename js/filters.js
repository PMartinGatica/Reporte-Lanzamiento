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

            // Usar Family en vez de Name para el filtro de modelos
            const uniqueModels = [...new Set(this.allData.map(item => item.Family).filter(Boolean))];
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
         * Popula el filtro de fechas - VERSIÓN DISCRETA
         */
        populateDateFilter() {
            this.console.log('📅 [FILTERS] Populando filtro de fechas discreto...');
            
            const dateFilterContainer = document.getElementById('date-filter-container');
            if (!dateFilterContainer) {
                this.console.error('❌ [FILTERS] Contenedor date-filter-container no encontrado');
                return;
            }

            // Obtener fechas únicas de los datos + fechas adicionales (normalizadas)
            const dataDates = [...new Set(this.allData.map(item => this.normalizeDateString(item.Date)).filter(Boolean))];
            const additionalDates = this.generateRecentDates(15);
            const allDates = [...new Set([...dataDates, ...additionalDates])]
                .sort((a, b) => new Date(b) - new Date(a));

            this.console.log('📅 [FILTERS] Fechas encontradas:', { dataDates: dataDates.length, additionalDates: additionalDates.length, total: allDates.length });

            // HTML discreto y simple
            const dateFilterHTML = `
                <div class="relative">
                    <button id="date-filter-btn" class="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center space-x-2 text-sm">
                        <span>📅</span>
                        <span id="date-filter-label">Fechas</span>
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                        </svg>
                    </button>
                    
                    <div id="date-filter-dropdown" class="hidden absolute left-0 mt-2 w-64 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50">
                        <div class="p-3">
                            <div class="flex justify-between items-center mb-2">
                                <span class="text-xs text-gray-400">Fechas:</span>
                                <div class="flex space-x-1">
                                    <button id="date-select-all" class="text-xs text-blue-400 hover:text-blue-300">Todas</button>
                                    <span class="text-gray-500">|</span>
                                    <button id="date-select-none" class="text-xs text-red-400 hover:text-red-300">Ninguna</button>
                                </div>
                            </div>
                            
                            <div id="date-checkboxes-container" class="max-h-40 overflow-y-auto space-y-1">
                                ${allDates.map(date => {
                                    const displayDate = this.formatDateSimple(date);
                                    return `
                                        <label class="flex items-center space-x-2 text-xs hover:bg-gray-700 p-1 rounded cursor-pointer">
                                            <input type="checkbox" 
                                                   value="${date}" 
                                                   class="date-checkbox w-3 h-3" 
                                                   checked>
                                            <span class="text-white">${displayDate}</span>
                                        </label>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            `;

            dateFilterContainer.innerHTML = dateFilterHTML;
            this.setupSimpleDateEvents();
            this.restoreDateFilters();
            this.updateDateFilterLabel();

            this.console.log('✅ [FILTERS] Filtro de fechas discreto configurado');
        }

        /**
         * Genera fechas recientes
         */
        generateRecentDates(days) {
            const dates = [];
            const today = new Date();
            for (let i = 0; i < days; i++) {
                const date = new Date(today);
                date.setDate(today.getDate() - i);
                // Formatear fecha para que coincida con el formato de los datos
                dates.push(date.toISOString().split('T')[0]);
            }
            return dates;
        }

        /**
         * Formato simple de fecha
         */
        formatDateSimple(dateString) {
            try {
                const date = new Date(dateString);
                return date.toLocaleDateString('es-ES');
            } catch (error) {
                return dateString;
            }
        }

        /**
         * Normaliza una cadena de fecha al formato YYYY-MM-DD
         */
        normalizeDateString(dateString) {
            if (!dateString) return null;
            try {
                const date = new Date(dateString);
                if (isNaN(date.getTime())) return null;
                return date.toISOString().split('T')[0];
            } catch (error) {
                return null;
            }
        }

        /**
         * Eventos simples para fechas - DISCRETO
         */
        setupSimpleDateEvents() {
            const filterBtn = document.getElementById('date-filter-btn');
            const dropdown = document.getElementById('date-filter-dropdown');
            const selectAllBtn = document.getElementById('date-select-all');
            const selectNoneBtn = document.getElementById('date-select-none');
            const container = document.getElementById('date-checkboxes-container');

            // Toggle dropdown
            if (filterBtn) {
                filterBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    dropdown.classList.toggle('hidden');
                });
            }

            // Cerrar dropdown al hacer click fuera
            document.addEventListener('click', () => {
                if (dropdown) dropdown.classList.add('hidden');
            });

            // Prevenir cierre al hacer click dentro del dropdown
            if (dropdown) {
                dropdown.addEventListener('click', (e) => e.stopPropagation());
            }

            if (selectAllBtn) {
                selectAllBtn.addEventListener('click', () => {
                    const checkboxes = container.querySelectorAll('.date-checkbox');
                    checkboxes.forEach(cb => cb.checked = true);
                    this.updateDateFilterLabel();
                    this.saveDateFilters();
                    this.applyFilters();
                });
            }

            if (selectNoneBtn) {
                selectNoneBtn.addEventListener('click', () => {
                    const checkboxes = container.querySelectorAll('.date-checkbox');
                    checkboxes.forEach(cb => cb.checked = false);
                    this.updateDateFilterLabel();
                    this.saveDateFilters();
                    this.applyFilters();
                });
            }

            if (container) {
                container.addEventListener('change', (e) => {
                    if (e.target.classList.contains('date-checkbox')) {
                        this.updateDateFilterLabel();
                        this.saveDateFilters();
                        this.applyFilters();
                    }
                });
            }
        }

        /**
         * Método faltante: populateProcessDropdown
         */
        populateProcessDropdown() {
            this.console.log('⚙️ [FILTERS] Populando dropdown de procesos...');
            
            const processDropdown = document.getElementById('process-checkboxes-container');
            if (!processDropdown) {
                this.console.warn('⚠️ [FILTERS] Contenedor de procesos no encontrado');
                return;
            }

            const uniqueProcesses = [...new Set(this.allData.map(item => item.Process).filter(Boolean))];
            
            processDropdown.innerHTML = uniqueProcesses.map(process => `
                <div class="flex items-center space-x-2">
                    <input type="checkbox" 
                           id="process-${process}" 
                           value="${process}" 
                           class="process-checkbox" 
                           checked>
                    <label for="process-${process}" class="text-white text-sm cursor-pointer">
                        ${process}
                    </label>
                </div>
            `).join('');

            // Actualizar etiqueta después de poblar
            this.updateProcessFilterLabel();

            this.console.log('✅ [FILTERS] Dropdown de procesos poblado con', uniqueProcesses.length, 'procesos');
        }

        /**
         * Método faltante: setupDropdownEvents
         */
        setupDropdownEvents() {
            this.console.log('🔧 [FILTERS] Configurando eventos de dropdown...');
            
            // Eventos para filtro de modelo
            const modelFilter = document.getElementById('model-filter');
            if (modelFilter) {
                modelFilter.addEventListener('change', () => {
                    this.applyFilters();
                });
            }

            // Eventos para dropdown de procesos (botón toggle)
            const processFilterBtn = document.getElementById('process-filter-btn');
            const processDropdown = document.getElementById('process-filter-dropdown');
            const processSelectAllBtn = document.getElementById('process-select-all');
            const processContainer = document.getElementById('process-checkboxes-container');
            
            if (processFilterBtn && processDropdown) {
                // Toggle dropdown de procesos
                processFilterBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    processDropdown.classList.toggle('hidden');
                    this.console.log('🔽 [FILTERS] Toggle dropdown de procesos');
                });

                // Prevenir cierre al hacer click dentro del dropdown
                processDropdown.addEventListener('click', (e) => e.stopPropagation());
            }

            // Botón "Todos" para procesos
            if (processSelectAllBtn && processContainer) {
                processSelectAllBtn.addEventListener('click', () => {
                    const checkboxes = processContainer.querySelectorAll('.process-checkbox');
                    checkboxes.forEach(cb => cb.checked = true);
                    this.updateProcessFilterLabel();
                    this.applyFilters();
                    this.console.log('✅ [FILTERS] Todos los procesos seleccionados');
                });
            }

            // Eventos para filtro de proceso (checkboxes)
            if (processContainer) {
                processContainer.addEventListener('change', () => {
                    this.updateProcessFilterLabel();
                    this.applyFilters();
                });
            }

            // Cerrar dropdowns al hacer click fuera (para procesos)
            document.addEventListener('click', () => {
                if (processDropdown) {
                    processDropdown.classList.add('hidden');
                }
            });

            this.console.log('✅ [FILTERS] Eventos de dropdown configurados');
        }

        /**
         * Método faltante: restoreSavedFilters
         */
        restoreSavedFilters() {
            this.console.log('🔄 [FILTERS] Restaurando filtros guardados...');
            
            if (!window.MQS_STORAGE) {
                this.console.warn('⚠️ [FILTERS] MQS_STORAGE no disponible');
                return;
            }

            try {
                const savedFilters = MQS_STORAGE.getSavedFilters();
                
                // Restaurar modelo
                const modelFilter = document.getElementById('model-filter');
                if (modelFilter && savedFilters.selectedModel) {
                    modelFilter.value = savedFilters.selectedModel;
                    // Actualizar título del héroe al restaurar
                    this.updateHeroTitle(savedFilters.selectedModel);
                }

                // Restaurar fechas (usando el nuevo sistema)
                this.restoreDateFilters();

                // Restaurar procesos y actualizar etiqueta
                this.updateProcessFilterLabel();

                this.console.log('✅ [FILTERS] Filtros restaurados');
            } catch (error) {
                this.console.error('❌ [FILTERS] Error restaurando filtros:', error);
            }
        }

        /**
         * Guarda fechas seleccionadas
         */
        saveDateFilters() {
            try {
                const checkboxes = document.querySelectorAll('.date-checkbox:checked');
                const selectedDates = Array.from(checkboxes).map(cb => cb.value);
                
                if (window.MQS_STORAGE) {
                    MQS_STORAGE.saveDateFilters(selectedDates);
                }

                // Actualizar filtros globales
                window.currentFilters = window.currentFilters || {};
                window.currentFilters.selectedDates = selectedDates;

                this.console.log('💾 [FILTERS] Fechas guardadas:', selectedDates.length);
            } catch (error) {
                this.console.error('❌ [FILTERS] Error guardando fechas:', error);
            }
        }

        /**
         * Restaura fechas seleccionadas
         */
        restoreDateFilters() {
            if (!window.MQS_STORAGE) return;

            try {
                const savedDates = MQS_STORAGE.getDateFilters();
                if (!savedDates || savedDates.length === 0) return;

                const checkboxes = document.querySelectorAll('.date-checkbox');
                checkboxes.forEach(cb => cb.checked = false);

                savedDates.forEach(date => {
                    const checkbox = document.querySelector(`input[value="${date}"]`);
                    if (checkbox) checkbox.checked = true;
                });

                this.console.log('🔄 [FILTERS] Fechas restauradas:', savedDates.length);
            } catch (error) {
                this.console.error('❌ [FILTERS] Error restaurando fechas:', error);
            }
        }

        /**
         * Actualiza la etiqueta del filtro de fechas
         */
        updateDateFilterLabel() {
            const label = document.getElementById('date-filter-label');
            const checkboxes = document.querySelectorAll('.date-checkbox');
            const checkedBoxes = document.querySelectorAll('.date-checkbox:checked');
            
            if (!label) return;

            if (checkedBoxes.length === 0) {
                label.textContent = 'Sin fechas';
            } else if (checkedBoxes.length === checkboxes.length) {
                label.textContent = 'Todas';
            } else if (checkedBoxes.length === 1) {
                const date = checkedBoxes[0].value;
                label.textContent = this.formatDateSimple(date);
            } else {
                label.textContent = `${checkedBoxes.length} fechas`;
            }
        }

        /**
         * Actualiza la etiqueta del filtro de procesos
         */
        updateProcessFilterLabel() {
            const btn = document.getElementById('process-filter-btn');
            const checkboxes = document.querySelectorAll('.process-checkbox');
            const checkedBoxes = document.querySelectorAll('.process-checkbox:checked');
            
            if (!btn) return;

            // Buscar el elemento span que contiene el texto "Procesos"
            const spanElement = btn.querySelector('span');
            if (!spanElement) return;

            if (checkedBoxes.length === 0) {
                spanElement.textContent = 'Sin procesos';
            } else if (checkedBoxes.length === checkboxes.length) {
                spanElement.textContent = 'Todos los procesos';
            } else if (checkedBoxes.length === 1) {
                spanElement.textContent = checkedBoxes[0].parentElement.textContent.trim();
            } else {
                spanElement.textContent = `${checkedBoxes.length} procesos`;
            }
        }

        /**
         * Método faltante: applyFilters
         */
        applyFilters() {
            this.console.log('🔍 [FILTERS] Aplicando filtros...');
            
            if (!this.allData) {
                this.console.warn('⚠️ [FILTERS] No hay datos para filtrar');
                return;
            }

            let filteredData = [...this.allData];
            
            // Filtro de modelo
            const modelFilter = document.getElementById('model-filter');
            if (modelFilter && modelFilter.value) {
                filteredData = filteredData.filter(item => item.Family === modelFilter.value);
                // Actualizar título del héroe
                this.updateHeroTitle(modelFilter.value);
            } else {
                // Si no hay modelo seleccionado, restaurar título por defecto
                this.updateHeroTitle('');
            }

            // Filtro de fechas (checkboxes)
            const selectedDates = Array.from(document.querySelectorAll('.date-checkbox:checked'))
                .map(cb => cb.value);
            
            this.console.log('🔍 [FILTERS] Fechas seleccionadas:', selectedDates);
            
            if (selectedDates.length > 0) {
                filteredData = filteredData.filter(item => {
                    const normalizedItemDate = this.normalizeDateString(item.Date);
                    const isIncluded = selectedDates.includes(normalizedItemDate);
                    return isIncluded;
                });
                this.console.log('🔍 [FILTERS] Después del filtro de fechas:', filteredData.length, 'registros');
            }

            // Filtro de procesos (checkboxes)
            const selectedProcesses = Array.from(document.querySelectorAll('.process-checkbox:checked'))
                .map(cb => cb.value);
            
            if (selectedProcesses.length > 0) {
                filteredData = filteredData.filter(item => selectedProcesses.includes(item.Process));
            }

            // Actualizar datos filtrados globalmente (ambas variables para compatibilidad)
            window.filteredData = filteredData;
            window.currentFilteredData = filteredData;
            
            // Forzar actualización del dashboard y gráficos
            this.updateDashboard(filteredData);

            this.console.log('✅ [FILTERS] Filtros aplicados:', {
                total: this.allData.length,
                filtrados: filteredData.length,
                modelo: modelFilter?.value || 'todos',
                fechas: selectedDates.length,
                procesos: selectedProcesses.length
            });
        }

        /**
         * Actualiza el título del héroe con el modelo seleccionado
         */
        updateHeroTitle(modelName) {
            const heroTitle = document.getElementById('hero-title');
            if (heroTitle) {
                if (modelName && modelName.trim() !== '') {
                    heroTitle.textContent = modelName;
                    this.console.log('🎯 [FILTERS] Título actualizado:', modelName);
                } else {
                    heroTitle.textContent = 'Explorer';
                    this.console.log('🎯 [FILTERS] Título restaurado a default');
                }
            }
        }

        /**
         * Actualiza el dashboard y gráficos con los datos filtrados
         */
        updateDashboard(filteredData) {
            this.console.log('📊 [FILTERS] Actualizando dashboard con', filteredData.length, 'registros');
            
            try {
                // Disparar eventos personalizados para notificar cambios
                const updateEvent = new CustomEvent('filtersApplied', {
                    detail: { 
                        filteredData: filteredData,
                        count: filteredData.length 
                    }
                });
                document.dispatchEvent(updateEvent);

                // Intentar actualizar directamente si MQS_UI está disponible
                if (window.MQS_UI) {
                    // Renderizar tarjetas del dashboard
                    if (typeof window.MQS_UI.updateDashboard === 'function') {
                        window.MQS_UI.updateDashboard();
                    }
                    
                    // Actualizar análisis de procesos
                    if (typeof window.MQS_UI.updateProcessAnalysis === 'function') {
                        window.MQS_UI.updateProcessAnalysis();
                    }
                }

                this.console.log('✅ [FILTERS] Dashboard actualizado correctamente');
                
            } catch (error) {
                this.console.error('❌ [FILTERS] Error actualizando dashboard:', error);
            }
        }
    }

    // Crear instancia global
    window.MQS_FILTERS = new FiltersManager();
    console.log('✅ [FILTERS] Módulo de filtros cargado exitosamente');

})();
