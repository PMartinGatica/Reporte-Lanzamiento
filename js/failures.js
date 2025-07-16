/**
 * Manejo de tabla de fallas Top 5
 */
(function() {
    'use strict';
    
    console.log('💥 [FAILURES] Cargando módulo de fallas...');

    class FailuresManager {
        constructor() {
            this.console = window.console;
            this.failureNotes = {};
            this.failureImages = {};
            
            this.console.log('💥 [FAILURES] FailuresManager inicializado');
        }

        /**
         * Inicializa el manejo de fallas
         */
        initialize() {
            this.console.log('💥 [FAILURES] Inicializando manejo de fallas...');
            this.loadFromStorage();
            this.setupEvents();
            
            // Crear modal de imagen si no existe
            if (!document.getElementById('image-modal')) {
                this.createImageModal();
            }
            
            this.console.log('✅ [FAILURES] Manejo de fallas inicializado con modal de imagen');
        }

        /**
         * Carga datos desde storage
         */
        loadFromStorage() {
            if (window.MQS_STORAGE) {
                // Cargar desde las propiedades del storage
                this.failureNotes = MQS_STORAGE.failureNotes || {};
                this.failureImages = MQS_STORAGE.failureImages || {};
                
                this.console.log('💥 [FAILURES] Datos cargados desde storage:', {
                    notas: Object.keys(this.failureNotes).length,
                    imagenes: Object.keys(this.failureImages).length
                });
                
                // Forzar recarga desde localStorage si están vacíos
                if (Object.keys(this.failureNotes).length === 0 || Object.keys(this.failureImages).length === 0) {
                    MQS_STORAGE.loadFromStorage();
                    this.failureNotes = MQS_STORAGE.failureNotes || {};
                    this.failureImages = MQS_STORAGE.failureImages || {};
                    this.console.log('💥 [FAILURES] Datos recargados desde localStorage');
                }
            } else {
                this.console.error('❌ [FAILURES] MQS_STORAGE no disponible');
            }
        }

        /**
         * Actualiza la tabla de fallas para un proceso
         */
        updateFailuresTable(processName, reportElement, failuresData) {
            this.console.log('💥 [FAILURES] Actualizando tabla de fallas para', processName);
            
            const container = reportElement.querySelector('.failures-table-container');
            if (!container) {
                this.console.error('❌ [FAILURES] Contenedor de tabla no encontrado');
                return;
            }

            // Si no hay datos de fallas reales, crear datos de ejemplo
            let processFailures = [];
            if (failuresData && failuresData.length > 0) {
                processFailures = failuresData.filter(f => f.process === processName);
            } else {
                // Crear datos de ejemplo para demostración
                processFailures = this.createSampleFailureData(processName);
            }

            // Obtener todos los testcodes únicos para el dropdown
            const allTestcodes = [...new Set(processFailures.map(f => f.testcode))].sort();

            // Aplicar filtro de testcode si existe
            const currentFilters = window.currentFilters || {};
            if (currentFilters.testcode) {
                processFailures = processFailures.filter(failure => {
                    return failure.testcode && failure.testcode.includes(currentFilters.testcode);
                });
                this.console.log('💥 [FAILURES] Filtro de testcode aplicado:', currentFilters.testcode, 'Resultados:', processFailures.length);
            }

            const top5Failures = processFailures
                .sort((a,b) => (parseInt(b.pfail) || 0) - (parseInt(a.pfail) || 0))
                .slice(0, 5);

            if (top5Failures.length === 0) {
                const noDataMessage = currentFilters.testcode 
                    ? `No se encontraron fallas con el testcode "${currentFilters.testcode}" para este proceso.`
                    : 'No se encontraron datos de fallas para este proceso en el período seleccionado.';
                container.innerHTML = `<p class="text-gray-400 mt-6">${noDataMessage}</p>`;
                return;
            }
            
            const rowsHTML = top5Failures.map(failure => {
                const key = `${processName}-${failure.testcode}`;
                const notes = this.failureNotes[key] || {};
                const imageSrc = this.failureImages[key];
                
                const imageCellHTML = imageSrc
                    ? `<div class="flex flex-col items-center">
                         <img src="${imageSrc}" class="preview-image mx-auto mb-1" data-action="show-image" style="max-width: 60px; max-height: 40px; border-radius: 4px; cursor: pointer; object-fit: cover;">
                         <button data-action="remove-image" class="text-red-500 text-xs hover:text-red-400">Quitar</button>
                       </div>`
                    : `<div class="flex flex-col items-center">
                         <label class="image-upload-label cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-xs font-medium" for="upload-${key}">Subir</label>
                         <input type="file" id="upload-${key}" class="hidden" accept="image/*" data-action="upload-image">
                       </div>`;

                return `
                    <tr class="border-b border-gray-600 hover:bg-gray-700" data-testcode="${failure.testcode}" data-process="${processName}">
                        <td class="px-4 py-3 text-center text-white">${failure.testcode}</td>
                        <td class="px-4 py-3 text-center text-white">${failure.pfail}</td>
                        <td class="px-4 py-3 text-center text-white">${failure.pfailph?.formatted || failure.pfailph || '0.00%'}</td>
                        <td class="px-4 py-3 text-center text-white">${failure.pntf || 0}</td>
                        <td class="px-4 py-3">
                            <textarea 
                                class="w-full bg-gray-700 text-white px-2 py-1 rounded resize-y min-h-[38px] border border-gray-600 focus:border-indigo-500 focus:outline-none" 
                                placeholder="Describe la causa..." 
                                data-action="save-note" 
                                data-type="causa"
                                style="overflow-y:hidden"
                            >${notes.causa || ''}</textarea>
                        </td>
                        <td class="px-4 py-3">
                            <textarea 
                                class="w-full bg-gray-700 text-white px-2 py-1 rounded resize-y min-h-[38px] border border-gray-600 focus:border-indigo-500 focus:outline-none" 
                                placeholder="Describe la acción..." 
                                data-action="save-note" 
                                data-type="accion"
                                style="overflow-y:hidden"
                            >${notes.accion || ''}</textarea>
                        </td>
                        <td class="px-4 py-3 text-center">${imageCellHTML}</td>
                    </tr>
                `;
            }).join('');

            // Crear opciones del dropdown
            const testcodeOptions = allTestcodes.map(testcode => 
                `<option value="${testcode}">${testcode}</option>`
            ).join('');

            container.innerHTML = `
                <div class="flex justify-between items-center mb-4">
                    <h4 class="text-lg font-semibold text-indigo-300">Top 5 Fallas</h4>
                    <div class="relative">
                        <button id="testcode-dropdown-btn-${processName}" 
                                class="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center space-x-2 min-w-[140px] justify-between">
                            <span class="flex items-center space-x-2">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
                                </svg>
                                <span id="testcode-dropdown-label-${processName}" class="text-sm">Todos</span>
                            </span>
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </button>
                        
                        <div id="testcode-dropdown-${processName}" 
                             class="hidden absolute right-0 mt-2 w-64 bg-gray-700 border border-gray-600 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                            <div class="p-3">
                                <div class="flex justify-between items-center mb-2">
                                    <span class="text-sm font-medium text-white">TestCodes:</span>
                                    <button id="testcode-select-all-${processName}" 
                                            class="text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer">Todos</button>
                                </div>
                                <div class="mb-3">
                                    <input id="testcode-search-${processName}" 
                                           type="text" 
                                           placeholder="Buscar testcode..." 
                                           class="w-full bg-gray-600 text-white px-2 py-1 rounded text-xs border border-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500">
                                </div>
                                <div id="testcode-checkboxes-${processName}" class="space-y-2">
                                    ${allTestcodes.map(testcode => `
                                        <div class="flex items-center space-x-2 testcode-option" data-testcode="${testcode}">
                                            <input type="checkbox" 
                                                   id="testcode-${processName}-${testcode}" 
                                                   value="${testcode}" 
                                                   class="testcode-checkbox w-4 h-4 text-indigo-600 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500 focus:ring-2" 
                                                   data-process-name="${processName}">
                                            <label for="testcode-${processName}-${testcode}" 
                                                   class="text-white text-xs cursor-pointer select-none truncate">${testcode}</label>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm text-left text-gray-200" id="failures-table-${processName}">
                        <thead class="text-xs uppercase bg-gray-700">
                            <tr>
                                <th class="px-4 py-3 text-center">Testcode</th>
                                <th class="px-4 py-3 text-center">Fallas</th>
                                <th class="px-4 py-3 text-center">Fail %</th>
                                <th class="px-4 py-3 text-center">NTF</th>
                                <th class="px-4 py-3 text-center">Causas</th>
                                <th class="px-4 py-3 text-center">Acciones</th>
                                <th class="px-4 py-3 text-center">Imagen</th>
                            </tr>
                        </thead>
                        <tbody>${rowsHTML}</tbody>
                    </table>
                </div>`;

            // Configurar eventos para el dropdown de testcodes
            this.setupTestcodeDropdown(processName, allTestcodes, processFailures);

            this.console.log('✅ [FAILURES] Tabla de fallas actualizada con', top5Failures.length, 'fallas y dropdown de', allTestcodes.length, 'testcodes');
        }

        /**
         * Configura el dropdown de testcodes para un proceso específico
         */
        setupTestcodeDropdown(processName, allTestcodes, allFailures) {
            const dropdownBtn = document.getElementById(`testcode-dropdown-btn-${processName}`);
            const dropdown = document.getElementById(`testcode-dropdown-${processName}`);
            const dropdownLabel = document.getElementById(`testcode-dropdown-label-${processName}`);
            const selectAllBtn = document.getElementById(`testcode-select-all-${processName}`);
            const searchInput = document.getElementById(`testcode-search-${processName}`);
            const table = document.getElementById(`failures-table-${processName}`);
            
            if (!dropdownBtn || !dropdown || !table) {
                this.console.error('❌ [FAILURES] Elementos del dropdown no encontrados para', processName);
                return;
            }

            // Toggle del dropdown
            dropdownBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isHidden = dropdown.classList.contains('hidden');
                dropdown.classList.toggle('hidden');
                
                this.console.log(`🔄 [FAILURES] Dropdown ${processName} ${isHidden ? 'abierto' : 'cerrado'}`);
                
                // Si se abre el dropdown, mostrar estado actual
                if (isHidden) {
                    const totalCheckboxes = dropdown.querySelectorAll('.testcode-checkbox').length;
                    const checkedBoxes = dropdown.querySelectorAll('.testcode-checkbox:checked').length;
                    this.console.log(`📊 [FAILURES] Estado actual del dropdown ${processName}:`, {
                        total: totalCheckboxes,
                        seleccionados: checkedBoxes,
                        checkboxes: Array.from(dropdown.querySelectorAll('.testcode-checkbox')).map(cb => ({
                            value: cb.value,
                            checked: cb.checked
                        }))
                    });
                }
            });

            // Prevenir cierre del dropdown al hacer click dentro
            dropdown.addEventListener('click', (e) => e.stopPropagation());

            // Cerrar dropdown al hacer click fuera
            document.addEventListener('click', () => {
                dropdown.classList.add('hidden');
            });

            // Botón "Todos/Ninguno"
            if (selectAllBtn) {
                selectAllBtn.addEventListener('click', () => {
                    const checkboxes = dropdown.querySelectorAll('.testcode-checkbox');
                    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
                    
                    if (allChecked) {
                        // Si todos están seleccionados, deseleccionar todos
                        checkboxes.forEach(cb => cb.checked = false);
                        selectAllBtn.textContent = 'Todos';
                    } else {
                        // Si no todos están seleccionados, seleccionar todos
                        checkboxes.forEach(cb => cb.checked = true);
                        selectAllBtn.textContent = 'Ninguno';
                    }
                    
                    this.applyTestcodeFilter(processName);
                    this.updateDropdownLabel(processName);
                    this.saveTestcodeFilters(processName);
                });
            }

            // Búsqueda de testcodes
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    const searchTerm = e.target.value.toLowerCase();
                    const options = dropdown.querySelectorAll('.testcode-option');
                    
                    options.forEach(option => {
                        const testcode = option.dataset.testcode.toLowerCase();
                        if (testcode.includes(searchTerm)) {
                            option.style.display = '';
                        } else {
                            option.style.display = 'none';
                        }
                    });
                });
            }

            // Eventos de cambio en checkboxes
            dropdown.addEventListener('change', (e) => {
                if (e.target.classList.contains('testcode-checkbox')) {
                    this.console.log(`📋 [FAILURES] Checkbox cambiado en ${processName}:`, {
                        testcode: e.target.value,
                        checked: e.target.checked,
                        totalChecked: dropdown.querySelectorAll('.testcode-checkbox:checked').length
                    });
                    
                    this.applyTestcodeFilter(processName);
                    this.updateDropdownLabel(processName);
                    this.saveTestcodeFilters(processName);
                }
            });

            // Restaurar filtros guardados
            this.restoreTestcodeFilters(processName);

            this.console.log(`✅ [FAILURES] Dropdown de testcodes configurado para ${processName}`);
        }

        /**
         * Aplica el filtro de testcodes seleccionados
         */
        applyTestcodeFilter(processName) {
            const dropdown = document.getElementById(`testcode-dropdown-${processName}`);
            const table = document.getElementById(`failures-table-${processName}`);
            
            if (!dropdown || !table) {
                this.console.error(`❌ [FAILURES] Elementos no encontrados para aplicar filtro: dropdown=${!!dropdown}, table=${!!table}`);
                return;
            }

            const selectedTestcodes = Array.from(dropdown.querySelectorAll('.testcode-checkbox:checked'))
                .map(cb => cb.value);

            this.console.log(`🔍 [FAILURES] Aplicando filtro en ${processName}:`, {
                totalCheckboxes: dropdown.querySelectorAll('.testcode-checkbox').length,
                selectedTestcodes: selectedTestcodes,
                dropdownVisible: !dropdown.classList.contains('hidden')
            });

            const rows = table.querySelectorAll('tbody tr');
            let visibleCount = 0;

            rows.forEach(row => {
                const testcode = row.dataset.testcode;
                // Cambiar lógica: solo mostrar si hay testcodes seleccionados Y el testcode está incluido
                const shouldShow = selectedTestcodes.length > 0 && selectedTestcodes.includes(testcode);
                
                if (shouldShow) {
                    row.style.display = '';
                    row.classList.remove('hidden');
                    visibleCount++;
                } else {
                    row.style.display = 'none';
                    row.classList.add('hidden');
                }
                
                // Log para debugging
                if (selectedTestcodes.length > 0) {
                    this.console.log(`  - Fila ${testcode}: mostrar=${shouldShow}`);
                }
            });

            // Mostrar mensaje si no hay resultados
            if (visibleCount === 0) {
                this.showNoTestcodeResults(processName);
            } else {
                this.hideNoTestcodeResults(processName);
            }

            this.console.log(`✅ [FAILURES] Filtro aplicado en ${processName}: ${selectedTestcodes.length} testcodes seleccionados, ${visibleCount} de ${rows.length} filas visibles`);
        }

        /**
         * Actualiza la etiqueta del dropdown
         */
        updateDropdownLabel(processName) {
            const dropdown = document.getElementById(`testcode-dropdown-${processName}`);
            const label = document.getElementById(`testcode-dropdown-label-${processName}`);
            
            if (!dropdown || !label) return;

            const checkboxes = dropdown.querySelectorAll('.testcode-checkbox');
            const checkedBoxes = dropdown.querySelectorAll('.testcode-checkbox:checked');
            
            if (checkedBoxes.length === 0) {
                label.textContent = 'Ninguno';
            } else if (checkedBoxes.length === checkboxes.length) {
                label.textContent = 'Todos';
            } else {
                label.textContent = `${checkedBoxes.length} de ${checkboxes.length}`;
            }
        }

        /**
         * Guarda los filtros de testcode seleccionados
         */
        saveTestcodeFilters(processName) {
            if (!window.MQS_STORAGE) return;

            const dropdown = document.getElementById(`testcode-dropdown-${processName}`);
            if (!dropdown) return;

            const selectedTestcodes = Array.from(dropdown.querySelectorAll('.testcode-checkbox:checked'))
                .map(cb => cb.value);

            MQS_STORAGE.saveProcessTestCodeFilters(processName, selectedTestcodes);
            this.console.log(`💾 [FAILURES] Filtros de testcode guardados para ${processName}:`, selectedTestcodes);
        }

        /**
         * Restaura los filtros de testcode guardados
         */
        restoreTestcodeFilters(processName) {
            if (!window.MQS_STORAGE) return;

            const savedFilters = MQS_STORAGE.getProcessTestCodeFilters(processName);
            
            // Si no hay filtros guardados, dejar todo deseleccionado (comportamiento por defecto)
            if (!savedFilters || savedFilters.length === 0) {
                this.console.log(`📂 [FAILURES] No hay filtros guardados para ${processName}, iniciando con ninguno seleccionado`);
                this.applyTestcodeFilter(processName);
                this.updateDropdownLabel(processName);
                return;
            }

            const dropdown = document.getElementById(`testcode-dropdown-${processName}`);
            if (!dropdown) return;

            // Deseleccionar todos primero
            const checkboxes = dropdown.querySelectorAll('.testcode-checkbox');
            checkboxes.forEach(cb => cb.checked = false);

            // Seleccionar los guardados
            savedFilters.forEach(testcode => {
                const checkbox = dropdown.querySelector(`input[value="${testcode}"]`);
                if (checkbox) checkbox.checked = true;
            });

            // Aplicar filtro y actualizar UI
            this.applyTestcodeFilter(processName);
            this.updateDropdownLabel(processName);
            
            this.console.log(`📂 [FAILURES] Filtros restaurados para ${processName}:`, savedFilters);
        }

        /**
         * Muestra mensaje cuando no hay testcodes seleccionados
         */
        showNoTestcodeResults(processName) {
            const table = document.getElementById(`failures-table-${processName}`);
            if (!table) return;

            this.hideNoTestcodeResults(processName);

            const messageRow = document.createElement('tr');
            messageRow.className = 'no-testcode-results';
            messageRow.innerHTML = `
                <td colspan="7" class="px-4 py-8 text-center text-gray-400">
                    <div class="flex flex-col items-center space-y-3">
                        <svg class="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
                        </svg>
                        <div>
                            <p class="font-medium">No hay testcodes seleccionados</p>
                            <p class="text-sm mt-1">Selecciona al menos un testcode para ver las fallas</p>
                        </div>
                        <button class="text-indigo-400 hover:text-indigo-300 text-sm font-medium px-3 py-1 rounded border border-indigo-400 hover:border-indigo-300 transition-colors" 
                                onclick="document.getElementById('testcode-select-all-${processName}').click()">
                            Seleccionar Todos
                        </button>
                    </div>
                </td>
            `;
            
            table.querySelector('tbody').appendChild(messageRow);
        }

        /**
         * Oculta el mensaje de no testcodes
         */
        hideNoTestcodeResults(processName) {
            const table = document.getElementById(`failures-table-${processName}`);
            if (!table) return;

            const messageRow = table.querySelector('.no-testcode-results');
            if (messageRow) {
                messageRow.remove();
            }
        }

        /**
         * Configura el filtro de testcode para una tabla específica (método anterior - mantener para compatibilidad)
         */
        setupTestcodeFilter(processName, allFailures) {
            // Este método ahora es manejado por setupTestcodeDropdown
            // Mantener vacío para compatibilidad con código
        }

        /**
         * Crea datos de ejemplo de fallas para demostración
         */
        createSampleFailureData(processName) {
            const sampleData = {
                'UCT': [
                    { testcode: 'UCT_FAIL_001', pfail: 15, pfailph: '2.45%', pntf: 3 },
                    { testcode: 'UCT_FAIL_002', pfail: 12, pfailph: '1.98%', pntf: 2 },
                    { testcode: 'UCT_FAIL_003', pfail: 8, pfailph: '1.32%', pntf: 1 },
                    { testcode: 'UCT_FAIL_004', pfail: 6, pfailph: '0.99%', pntf: 1 },
                    { testcode: 'UCT_FAIL_005', pfail: 4, pfailph: '0.66%', pntf: 0 }
                ],
                'FODTEST': [
                    { testcode: 'FOD_FAIL_001', pfail: 22, pfailph: '3.15%', pntf: 5 },
                    { testcode: 'FOD_FAIL_002', pfail: 18, pfailph: '2.58%', pntf: 4 },
                    { testcode: 'FOD_FAIL_003', pfail: 14, pfailph: '2.01%', pntf: 2 },
                    { testcode: 'FOD_FAIL_004', pfail: 10, pfailph: '1.43%', pntf: 2 },
                    { testcode: 'FOD_FAIL_005', pfail: 7, pfailph: '1.00%', pntf: 1 }
                ],
                'LCDCAL': [
                    { testcode: 'LCD_FAIL_001', pfail: 19, pfailph: '2.87%', pntf: 4 },
                    { testcode: 'LCD_FAIL_002', pfail: 16, pfailph: '2.42%', pntf: 3 },
                    { testcode: 'LCD_FAIL_003', pfail: 11, pfailph: '1.66%', pntf: 2 },
                    { testcode: 'LCD_FAIL_004', pfail: 9, pfailph: '1.36%', pntf: 1 },
                    { testcode: 'LCD_FAIL_005', pfail: 5, pfailph: '0.76%', pntf: 1 }
                ]
            };

            return sampleData[processName] || [];
        }

        /**
         * Configura eventos de la tabla de fallas
         */
        setupEvents() {
            const processReportsContainer = document.getElementById('process-reports-container');
            if (!processReportsContainer) {
                this.console.error('💥 [FAILURES] Contenedor de reportes no encontrado');
                return;
            }

            // Usar delegación de eventos para todos los tipos de interacción
            processReportsContainer.addEventListener('change', (e) => this.handleFailureInteraction(e));
            processReportsContainer.addEventListener('click', (e) => this.handleFailureInteraction(e));
            processReportsContainer.addEventListener('input', (e) => this.handleFailureInteraction(e));
            processReportsContainer.addEventListener('blur', (e) => this.handleFailureInteraction(e)); // Guardar al perder el foco

            this.console.log('💥 [FAILURES] Eventos configurados');
        }

        /**
         * Maneja interacciones con la tabla de fallas
         */
        handleFailureInteraction(e) {
            const action = e.target.dataset.action;
            
            // Manejar textarea con data-action="save-note"
            if (e.target.matches('textarea[data-action="save-note"]')) {
                const failureRow = e.target.closest('tr[data-testcode]');
                if (!failureRow) return;

                const processName = failureRow.dataset.process;
                const testcode = failureRow.dataset.testcode;
                const key = `${processName}-${testcode}`;
                const type = e.target.dataset.type;
                const value = e.target.value;

                this.console.log('💥 [FAILURES] Guardando nota:', key, type, value);
                this.saveNote(key, type, value);
                return;
            }

            if (!action) return;

            const failureRow = e.target.closest('tr[data-testcode]');
            if (!failureRow) return;

            const processName = failureRow.dataset.process;
            const testcode = failureRow.dataset.testcode;
            const key = `${processName}-${testcode}`;

            switch(action) {
                case 'upload-image':
                    this.handleImageUpload(e.target, key);
                    break;

                case 'show-image':
                    this.showImageModal(e.target.src);
                    break;
                
                case 'remove-image':
                    this.removeImage(key, failureRow);
                    break;
            }
        }

        /**
         * Guarda una nota
         */
        saveNote(key, type, value) {
            try {
                if (!this.failureNotes[key]) {
                    this.failureNotes[key] = {};
                }
                this.failureNotes[key][type] = value;
                
                // Guardar en MQS_STORAGE
                if (window.MQS_STORAGE) {
                    MQS_STORAGE.failureNotes = this.failureNotes;
                    MQS_STORAGE.saveFailureNote(key, this.failureNotes[key]);
                    this.console.log('✅ [FAILURES] Nota guardada en storage:', key, type, value.length, 'caracteres');
                } else {
                    this.console.error('❌ [FAILURES] MQS_STORAGE no disponible');
                }
                
                // Mostrar feedback visual temporal
                this.showSaveIndicator(key, type);
                
            } catch (error) {
                this.console.error('❌ [FAILURES] Error al guardar nota:', error);
                this.showNotification('Error al guardar la nota', 'error');
            }
        }

        /**
         * Muestra indicador visual de guardado
         */
        showSaveIndicator(key, type) {
            // Buscar el textarea correspondiente
            const textarea = document.querySelector(`tr[data-testcode] textarea[data-type="${type}"]`);
            if (textarea) {
                const originalBorder = textarea.style.borderColor;
                textarea.style.borderColor = '#22c55e'; // Verde
                textarea.style.boxShadow = '0 0 0 1px #22c55e';
                
                setTimeout(() => {
                    textarea.style.borderColor = originalBorder;
                    textarea.style.boxShadow = '';
                }, 1000);
            }
        }

        /**
         * Maneja upload de imagen
         */
        handleImageUpload(inputElement, key) {
            const file = inputElement.files[0];
            if (!file) {
                this.console.warn('⚠️ [FAILURES] No se seleccionó archivo');
                return;
            }

            // Validar tipo de archivo
            if (!file.type.startsWith('image/')) {
                this.showNotification('Por favor selecciona un archivo de imagen válido.', 'error');
                return;
            }

            // Validar tamaño (máximo 5MB)
            if (file.size > 5 * 1024 * 1024) {
                this.showNotification('La imagen es demasiado grande. Máximo 5MB.', 'error');
                return;
            }

            this.console.log('💥 [FAILURES] Procesando imagen:', file.name, file.size, 'bytes');

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const base64 = e.target.result;
                    
                    // Guardar imagen
                    this.failureImages[key] = base64;
                    
                    if (window.MQS_STORAGE) {
                        MQS_STORAGE.failureImages = this.failureImages;
                        MQS_STORAGE.saveFailureImage(key, base64);
                    }
                    
                    // Actualizar UI
                    this.updateImageCell(inputElement, base64, key);
                    
                    this.console.log('✅ [FAILURES] Imagen guardada:', key);
                    this.showNotification('Imagen subida correctamente.', 'success');
                    
                } catch (error) {
                    this.console.error('❌ [FAILURES] Error al procesar imagen:', error);
                    this.showNotification('Error al procesar la imagen.', 'error');
                }
            };
            
            reader.onerror = () => {
                this.console.error('❌ [FAILURES] Error al leer archivo');
                this.showNotification('Error al leer el archivo.', 'error');
            };
            
            reader.readAsDataURL(file);
        }

        /**
         * Actualiza la celda de imagen
         */
        updateImageCell(inputElement, imageSrc, key) {
            const cell = inputElement.closest('td');
            if (!cell) return;

            cell.innerHTML = `
                <div class="flex flex-col items-center">
                    <img src="${imageSrc}" class="preview-image mx-auto mb-1" data-action="show-image" style="max-width: 60px; max-height: 40px; border-radius: 4px; cursor: pointer; object-fit: cover;">
                    <button data-action="remove-image" class="text-red-500 text-xs hover:text-red-400">Quitar</button>
                </div>
            `;
        }

        /**
         * Remueve una imagen
         */
        removeImage(key, failureRow) {
            if (!confirm('¿Estás seguro de que quieres quitar esta imagen?')) {
                return;
            }

            // Eliminar de storage
            delete this.failureImages[key];
            
            if (window.MQS_STORAGE) {
                MQS_STORAGE.failureImages = this.failureImages;
                MQS_STORAGE.saveFailureImage(key, null);
            }

            // Actualizar UI
            const cell = failureRow.querySelector('td:last-child');
            if (cell) {
                cell.innerHTML = `
                    <div class="flex flex-col items-center">
                        <label class="image-upload-label cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-xs font-medium" for="upload-${key}">Subir</label>
                        <input type="file" id="upload-${key}" class="hidden" accept="image/*" data-action="upload-image">
                    </div>
                `;
            }

            this.console.log('💥 [FAILURES] Imagen eliminada:', key);
            this.showNotification('Imagen eliminada correctamente.', 'success');
        }

        /**
         * Muestra modal de imagen - USANDO UTILIDADES
         */
        showImageModal(imageSrc) {
            this.console.log('📸 [FAILURES] Abriendo modal de imagen:', imageSrc);
            
            // Crear modal si no existe
            let modal = document.getElementById('image-modal');
            if (!modal) {
                this.createImageModal();
                modal = document.getElementById('image-modal');
            }
            
            const modalImage = document.getElementById('modal-image');
            
            if (modal && modalImage) {
                modalImage.src = imageSrc;
                modal.style.display = 'block';
                modal.classList.add('show');
                
                // Deshabilitar scroll usando utilidad
                this.disableScroll();
                
                // Agregar evento para cerrar con Escape
                document.addEventListener('keydown', this.handleModalKeydown);
                
                this.console.log('✅ [FAILURES] Modal de imagen abierto en pantalla completa');
            } else {
                this.console.error('❌ [FAILURES] Elementos del modal no encontrados');
            }
        }

        /**
         * Cierra el modal de imagen - USANDO UTILIDADES
         */
        closeImageModal() {
            const modal = document.getElementById('image-modal');
            
            if (modal) {
                modal.classList.remove('show');
                
                // Habilitar scroll usando utilidad
                this.enableScroll();
                
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 300);
                
                // Remover event listener de teclado
                document.removeEventListener('keydown', this.handleModalKeydown);
                
                this.console.log('✅ [FAILURES] Modal de imagen cerrado y scroll restaurado');
            }
        }

        /**
         * Maneja eventos de teclado del modal
         */
        handleModalKeydown = (e) => {
            if (e.key === 'Escape') {
                this.closeImageModal();
            }
        }

        /**
         * Función de debug para probar filtros manualmente
         */
        debugTestcodeFilter(processName, testcodesToShow = []) {
            this.console.log(`🐛 [FAILURES] DEBUG: Aplicando filtro manual para ${processName}`, testcodesToShow);
            
            const dropdown = document.getElementById(`testcode-dropdown-${processName}`);
            if (!dropdown) {
                this.console.error(`❌ [FAILURES] DEBUG: Dropdown no encontrado para ${processName}`);
                return;
            }
            
            // Deseleccionar todos
            const checkboxes = dropdown.querySelectorAll('.testcode-checkbox');
            checkboxes.forEach(cb => cb.checked = false);
            
            // Seleccionar solo los especificados
            if (testcodesToShow.length > 0) {
                testcodesToShow.forEach(testcode => {
                    const checkbox = dropdown.querySelector(`input[value="${testcode}"]`);
                    if (checkbox) {
                        checkbox.checked = true;
                        this.console.log(`✅ [FAILURES] DEBUG: Checkbox ${testcode} seleccionado`);
                    } else {
                        this.console.warn(`⚠️ [FAILURES] DEBUG: Checkbox ${testcode} no encontrado`);
                    }
                });
            } else {
                // Si no se especifica nada, seleccionar todos
                checkboxes.forEach(cb => cb.checked = true);
            }
            
            // Aplicar filtro
            this.applyTestcodeFilter(processName);
            this.updateDropdownLabel(processName);
            this.saveTestcodeFilters(processName);
            
            this.console.log(`🐛 [FAILURES] DEBUG: Filtro aplicado para ${processName}`);
        }

    }

    // Crear instancia global
    window.MQS_FAILURES = new FailuresManager();
    console.log('✅ [FAILURES] Módulo de fallas cargado exitosamente');

})();
