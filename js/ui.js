/**
 * Manejo de interfaz de usuario y DOM
 */
(function() {
    'use strict';
    
    console.log('🎨 [UI] Cargando módulo de interfaz...');

    class UIManager {
        constructor() {
            this.console = window.console;
            this.elements = {};
            
            this.console.log('🎨 [UI] UIManager inicializado');
        }

        /**
         * Inicializa la interfaz de usuario
         */
        initializeUI() {
            this.console.log('🎨 [UI] Inicializando interfaz de usuario...');
            
            this.getDOMElements();
            this.setupEventListeners();
            this.displayCurrentDate();
            
            this.console.log('✅ [UI] Interfaz inicializada');
        }

        /**
         * Obtiene referencias a elementos del DOM
         */
        getDOMElements() {
            this.elements = {
                heroTitle: document.getElementById('hero-title'),
                currentDate: document.getElementById('current-date'),
                modelFilter: document.getElementById('model-filter'),
                dateFilter: document.getElementById('date-filter'),
                clearDataBtn: document.getElementById('clear-data-btn'),
                loadingIndicator: document.getElementById('loading-indicator'),
                cardsContainer: document.getElementById('cards-container'),
                processReportsContainer: document.getElementById('process-reports-container'),
                issuesTableBody: document.getElementById('issues-table-body'),
                downloadPdfBtn: document.getElementById('download-pdf-btn'),
                imageModal: document.getElementById('image-modal'),
                closeModalBtn: document.getElementById('close-modal'),
                modalImage: document.getElementById('modal-image')
            };

            this.console.log('🎨 [UI] Elementos DOM obtenidos');
        }

        /**
         * Configura todos los event listeners
         */
        setupEventListeners() {
            const { cardsContainer, processReportsContainer, imageModal, closeModalBtn, clearDataBtn, downloadPdfBtn } = this.elements;

            if (clearDataBtn) {
                clearDataBtn.addEventListener('click', () => this.handleClearData());
            }

            if (downloadPdfBtn) {
                downloadPdfBtn.addEventListener('click', () => this.handleDownloadPDF());
            }

            if (cardsContainer) {
                cardsContainer.addEventListener('click', (e) => this.handleCardClick(e));
                cardsContainer.addEventListener('input', (e) => this.handleCardInput(e));
            }

            if (processReportsContainer) {
                processReportsContainer.addEventListener('change', (e) => this.handleProcessReportInteraction(e));
                processReportsContainer.addEventListener('click', (e) => this.handleProcessReportInteraction(e));
            }

            if (imageModal) {
                imageModal.addEventListener('click', () => this.hideImageModal());
            }

            if (closeModalBtn) {
                closeModalBtn.addEventListener('click', (e) => this.handleCloseModal(e));
            }

            this.console.log('🎯 [UI] Event listeners configurados');
        }

        /**
         * Muestra la fecha actual
         */
        displayCurrentDate() {
            if (this.elements.currentDate) {
                const today = new Date();
                const options = { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                };
                this.elements.currentDate.textContent = today.toLocaleDateString('es-ES', options);
            }
        }

        /**
         * Muestra/oculta indicador de carga
         */
        showLoading(show, message = 'Cargando...') {
            this.console.log(`⏳ [UI] Loading: ${show ? 'ON' : 'OFF'} - ${message}`);
            
            const indicator = this.elements.loadingIndicator;
            if (!indicator) {
                this.console.warn(`⚠️ [UI] Elemento loading-indicator no encontrado`);
                return;
            }
            
            if (show) {
                const messageElement = indicator.querySelector('span');
                if (messageElement) {
                    messageElement.textContent = message;
                }
                indicator.classList.remove('hidden');
            } else {
                indicator.classList.add('hidden');
            }
        }

        /**
         * Muestra mensaje de error en la interfaz
         */
        showError(message) {
            this.console.error(`❌ [UI] Mostrando error:`, message);
            
            const container = this.elements.cardsContainer;
            if (container) {
                container.innerHTML = `
                    <div class="bg-red-900/50 border border-red-500 text-red-300 p-6 rounded-lg">
                        <div class="flex items-center space-x-3">
                            <span class="text-2xl">⚠️</span>
                            <div>
                                <h3 class="font-bold text-lg">Error al cargar datos</h3>
                                <p class="text-sm mt-1">${message}</p>
                                <p class="text-xs text-red-400 mt-2">
                                    Revisa la consola (F12) para más detalles técnicos.
                                </p>
                            </div>
                        </div>
                    </div>
                `;
            }
        }

        /**
         * Renderiza las tarjetas principales
         */
        renderCards(data) {
            this.console.log('🎨 [UI] Renderizando tarjetas con', data.length, 'registros');
            
            const container = this.elements.cardsContainer;
            if (!container) {
                this.console.error('❌ [UI] Contenedor de tarjetas no encontrado');
                return;
            }

            if (data.length === 0) {
                container.innerHTML = `
                    <div class="bg-yellow-900/50 border border-yellow-500 text-yellow-300 p-6 rounded-lg text-center">
                        <span class="text-2xl">📭</span>
                        <h3 class="font-bold text-lg mt-2">No hay datos disponibles</h3>
                        <p class="text-sm mt-1">Selecciona un modelo para ver los datos</p>
                    </div>
                `;
                return;
            }

            // Generar tarjetas usando la lógica del código original
            this.updateLineStatusSection(data);
        }

        /**
         * Actualiza la sección de estado de línea con tarjetas
         */
        updateLineStatusSection(data) {
            this.console.log('🎨 [UI] Actualizando sección de estado de línea');
            
            const container = this.elements.cardsContainer;
            if (!container) return;

            // Agrupar datos por fecha
            const dateGroups = data.reduce((acc, item) => {
                const date = this.formatDate(item.Date);
                if (!date) return acc;
                if (!acc[date]) {
                    acc[date] = { auto: {}, manual: {} };
                }
                const process = item.Process || 'SinProceso';
                const primeHandle = parseInt(item['Prime Handle']) || 0;
                acc[date].auto[process] = (acc[date].auto[process] || 0) + primeHandle;
                return acc;
            }, {});

            const sortedDates = Object.keys(dateGroups).sort((a,b) => b.localeCompare(a));
            
            const totals = this.calculateTotals(dateGroups, data);
            const totalCardHTML = this.createTotalSummaryCardHTML(totals);
            const dailyCardsHTML = sortedDates.map(date => this.createDailyCardHTML(date, dateGroups[date], data)).join('');

            container.innerHTML = totalCardHTML + dailyCardsHTML;
            
            // Configurar eventos para las tarjetas
            this.setupCardEvents();
        }

        /**
         * Calcula los totales para el resumen
         */
        calculateTotals(dateGroups, data) {
            const ALL_PROCESSES = ['IFLASH', 'UCT', 'FODTEST', 'XCVR_RT', 'XCVR_LT', 'LCDCAL', 'L2VISION', 'L2AR', 'CFC'];
            const ALL_MANUAL_FIELDS = ['CQA1', 'RUNNING', 'CQA2', 'CQA1 Def.', 'CQA2 Def.'];
            
            const totals = { 
                input: 0, output: 0, defects: 0, days: Object.keys(dateGroups).length,
                processes: {}, manual: {} 
            };

            ALL_PROCESSES.forEach(p => totals.processes[p] = 0);
            ALL_MANUAL_FIELDS.forEach(f => totals.manual[f] = 0);

            for(const date in dateGroups) {
                const dailyApiData = this.getDailyApiTotals(date, data);
                const manualData = window.MQS_STORAGE ? MQS_STORAGE.getManualData(date) : {};
                
                const input = manualData.INPUT !== undefined && manualData.INPUT !== '' ? parseInt(manualData.INPUT) : dailyApiData.input;
                const output = manualData.Output !== undefined && manualData.Output !== '' ? parseInt(manualData.Output) : dailyApiData.output;
                const defects = manualData.Defectos !== undefined && manualData.Defectos !== '' ? parseInt(manualData.Defectos) : dailyApiData.defects;
                
                totals.input += isNaN(input) ? 0 : input;
                totals.output += isNaN(output) ? 0 : output;
                totals.defects += isNaN(defects) ? 0 : defects;
                
                for(const process in dateGroups[date].auto) {
                    if(totals.processes.hasOwnProperty(process)) {
                        totals.processes[process] += dateGroups[date].auto[process];
                    }
                }

                for(const field in manualData) {
                    if(totals.manual.hasOwnProperty(field)) {
                        totals.manual[field] += parseInt(manualData[field]) || 0;
                    }
                }
            }

            totals.dphu = totals.defects === 0 ? 0 : (totals.input > 0 ? (totals.defects * 100 / totals.input) : 0);
            return totals;
        }

        /**
         * Obtiene totales diarios de API
         */
        getDailyApiTotals(date, data) {
            const dayData = data.filter(item => this.formatDate(item.Date) === date);
            const totals = { input: 0, output: 0, defects: 0 };
            dayData.forEach(item => {
                totals.input += parseInt(item['Prime Handle']) || 0;
                totals.output += parseInt(item['Prime Pass']) || 0;
                totals.defects += parseInt(item['Prime Fail']) || 0;
            });
            return totals;
        }

        /**
         * Crea el HTML de la tarjeta de resumen total
         */
        createTotalSummaryCardHTML(totals) {
            let dphuColorClass = 'good';
            if (totals.dphu > 7) dphuColorClass = 'bad';
            else if (totals.dphu >= 5) dphuColorClass = 'warn';

            const ALL_PROCESSES = ['IFLASH', 'UCT', 'FODTEST', 'XCVR_RT', 'XCVR_LT', 'LCDCAL', 'L2VISION', 'L2AR', 'CFC'];
            const ALL_MANUAL_FIELDS = ['CQA1', 'RUNNING', 'CQA2', 'CQA1 Def.', 'CQA2 Def.'];

            return `
            <div id="total-summary-card" class="rounded-lg overflow-hidden shadow-lg mb-6">
                <div class="p-4 flex flex-col sm:flex-row justify-between items-center cursor-pointer" data-action="toggle-details">
                    <h3 class="text-xl font-bold text-indigo-300 mb-2 sm:mb-0">Resumen del Período (${totals.days} días)</h3>
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center w-full sm:w-auto">
                        <div><span class="text-xs text-gray-400 uppercase">Input Total</span><p class="text-2xl font-bold text-blue-400" data-total="input">${totals.input}</p></div>
                        <div><span class="text-xs text-gray-400 uppercase">Salida Total</span><p class="text-2xl font-bold text-green-400" data-total="output">${totals.output}</p></div>
                        <div><span class="text-xs text-gray-400 uppercase">Defectos Totales</span><p class="text-2xl font-bold text-red-400" data-total="defects">${totals.defects}</p></div>
                        <div class="kpi-card ${dphuColorClass} rounded-md p-2" data-total="dphu-card"><span class="text-xs text-gray-400 uppercase">DPHU General</span><p class="text-2xl font-bold" data-total="dphu">${totals.dphu.toFixed(2)}%</p></div>
                    </div>
                     <button class="mt-4 sm:mt-0 text-gray-400 hover:text-white"><svg class="details-arrow w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg></button>
                </div>
                 <div class="card-details bg-gray-900">
                    <div class="p-4 border-t border-gray-700">
                        <h4 class="font-bold mb-2 text-indigo-300">Process Test</h4>
                        <div class="grid grid-cols-3 md:grid-cols-6 gap-4 text-center">
                            ${ALL_PROCESSES.map(p => `<div class="bg-gray-800 p-2 rounded-lg"><p class="text-xs text-gray-400">${p}</p><p class="text-xl font-semibold">${totals.processes[p] || 0}</p></div>`).join('')}
                        </div>
                         <h4 class="font-bold mt-6 mb-2 text-indigo-300">Procesos Manuales</h4>
                        <div class="grid grid-cols-3 md:grid-cols-5 gap-4 text-center">
                            ${ALL_MANUAL_FIELDS.map(f => `<div class="bg-gray-800 p-2 rounded-lg"><p class="text-xs text-gray-400">${f.replace(' Def.', ' Defectos')}</p><p class="text-xl font-semibold">${totals.manual[f] || 0}</p></div>`).join('')}
                        </div>
                    </div>
                </div>
            </div>`;
        }

        /**
         * Crea el HTML de una tarjeta diaria
         */
        createDailyCardHTML(date, dateData, allData) {
            const dailyApiTotals = this.getDailyApiTotals(date, allData);
            
            // Obtener datos manuales guardados
            const manualData = window.MQS_STORAGE ? MQS_STORAGE.getManualData(date) : {};
            
            const input = manualData.INPUT !== undefined && manualData.INPUT !== '' ? parseInt(manualData.INPUT) : dailyApiTotals.input;
            const output = manualData.Output !== undefined && manualData.Output !== '' ? parseInt(manualData.Output) : dailyApiTotals.output;
            const defects = manualData.Defectos !== undefined && manualData.Defectos !== '' ? parseInt(manualData.Defectos) : dailyApiTotals.defects;
            const dphu = (defects || 0) === 0 ? 0 : ((input || 0) > 0 ? ((defects || 0) * 100 / (input || 0)) : 0);
            
            let dphuColorClass = 'good';
            if (dphu > 7) dphuColorClass = 'bad';
            else if (dphu >= 5) dphuColorClass = 'warn';

            const ALL_PROCESSES = ['IFLASH', 'UCT', 'FODTEST', 'XCVR_RT', 'XCVR_LT', 'LCDCAL', 'L2VISION', 'L2AR', 'CFC'];
            const ALL_MANUAL_FIELDS = ['CQA1', 'RUNNING', 'CQA2', 'CQA1 Def.', 'CQA2 Def.'];
            
            // Formatear fecha para mostrar
            const displayDate = new Date(date + 'T00:00:00').toLocaleDateString('es-ES', {
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric'
            });
            
            return `
            <div class="daily-card bg-gray-800 rounded-lg overflow-hidden shadow-lg" data-date="${date}">
                <div class="p-4 flex flex-col sm:flex-row justify-between items-center cursor-pointer" data-action="toggle-details">
                    <h3 class="text-xl font-bold text-white mb-2 sm:mb-0">${displayDate}</h3>
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                        <div><span class="text-xs text-gray-400 uppercase">Input</span><p class="text-2xl font-bold text-blue-400" data-kpi="input">${input || 0}</p></div>
                        <div><span class="text-xs text-gray-400 uppercase">Salida</span><p class="text-2xl font-bold text-green-400" data-kpi="output">${output || 0}</p></div>
                        <div><span class="text-xs text-gray-400 uppercase">Defectos</span><p class="text-2xl font-bold text-red-400" data-kpi="defects">${defects || 0}</p></div>
                        <div class="kpi-card ${dphuColorClass} rounded-md p-2" data-kpi="dphu-card"><span class="text-xs text-gray-400 uppercase">DPHU</span><p class="text-2xl font-bold" data-kpi="dphu">${dphu.toFixed(2)}%</p></div>
                    </div>
                    <button class="mt-4 sm:mt-0 text-gray-400 hover:text-white"><svg class="details-arrow w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg></button>
                </div>
                <div class="card-details bg-gray-900">
                    <div class="p-4 border-t border-gray-700">
                        <h4 class="font-bold mb-2 text-indigo-300">Process Check</h4>
                        <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
                            ${['INPUT', 'Output', 'Defectos', ...ALL_MANUAL_FIELDS].map(header => `
                            <div class="bg-gray-800 p-2 rounded-lg">
                                <label class="text-xs text-gray-400">${header.replace(' Def.', ' Defectos')}</label>
                                <input type="number" class="manual-input bg-gray-700 text-white w-full text-lg p-1 rounded" 
                                       data-field="${header}" 
                                       value="${manualData[header] !== undefined && manualData[header] !== '' ? manualData[header] : 0}" 
                                       placeholder="${(header === 'INPUT' ? dailyApiTotals.input : header === 'Output' ? dailyApiTotals.output : header === 'Defectos' ? dailyApiTotals.defects : 0) || 0}">
                            </div>`).join('')}
                        </div>
                        <h4 class="font-bold mt-6 mb-2 text-indigo-300">Process Test</h4>
                        <div class="grid grid-cols-3 md:grid-cols-6 gap-4 text-center">
                            ${ALL_PROCESSES.map(p => `<div class="bg-gray-800 p-2 rounded-lg"><p class="text-xs text-gray-400">${p}</p><p class="text-xl font-semibold">${dateData.auto[p] || 0}</p></div>`).join('')}
                        </div>
                    </div>
                </div>
            </div>`;
        }

        /**
         * Configura eventos para las tarjetas
         */
        setupCardEvents() {
            this.console.log('🎨 [UI] Configurando eventos de tarjetas');
            
            // Eventos para expandir/contraer detalles
            document.querySelectorAll('[data-action="toggle-details"]').forEach(element => {
                element.addEventListener('click', (e) => {
                    const card = e.currentTarget.closest('.daily-card, #total-summary-card');
                    const details = card.querySelector('.card-details');
                    const arrow = card.querySelector('.details-arrow');
                    
                    if (details && arrow) {
                        details.classList.toggle('expanded');
                        arrow.classList.toggle('expanded');
                    }
                });
            });
        }

        /**
         * Formatea una fecha para mostrar
         */
        formatDate(dateString) {
            if (!dateString) return null;
            try {
                const date = new Date(dateString);
                if (isNaN(date.getTime())) return null;
                return date.toISOString().split('T')[0];
            } catch (error) {
                this.console.warn('⚠️ [UI] Error al formatear fecha:', dateString, error);
                return null;
            }
        }

        /**
         * Renderiza los reportes de proceso
         */
        renderProcessReports(data) {
            this.console.log('🎨 [UI] Renderizando reportes de proceso');
            
            const container = this.elements.processReportsContainer;
            if (!container) {
                this.console.error('❌ [UI] Contenedor de reportes no encontrado');
                return;
            }

            if (data.length === 0) {
                container.innerHTML = `
                    <div class="bg-blue-900/50 border border-blue-500 text-blue-300 p-6 rounded-lg text-center">
                        <span class="text-2xl">📊</span>
                        <h3 class="font-bold text-lg mt-2">Reportes de Proceso</h3>
                        <p class="text-sm mt-1">Selecciona un modelo para ver reportes detallados</p>
                    </div>
                `;
                return;
            }

            // Usar el módulo de gráficos para crear reportes completos
            if (window.MQS_CHARTS) {
                MQS_CHARTS.createProcessReports(data);
            } else {
                this.console.error('❌ [UI] Módulo de gráficos no disponible');
            }
        }

        /**
         * Crea reportes detallados por proceso
         */
        createProcessReports(data) {
            this.console.log('🎨 [UI] Creando reportes de procesos');
            
            const container = this.elements.processReportsContainer;
            const ALL_PROCESSES = ['UCT', 'FODTEST', 'XCVR_LT', 'LCDCAL', 'L2VISION'];
            
            let reportsHTML = '';
            
            ALL_PROCESSES.forEach(processName => {
                const processData = data.filter(item => item.Process === processName);
                
                if (processData.length > 0) {
                    const totals = this.calculateProcessTotals(processData);
                    const ftyTarget = MQS_CONFIG.FTY_TARGETS[processName] || 95;
                    const currentFTY = totals.handle > 0 ? (totals.pass / totals.handle * 100) : 0;
                    const ftyStatus = currentFTY >= ftyTarget ? 'good' : 'bad';
                    
                    reportsHTML += `
                    <div class="process-report bg-gray-800 rounded-lg p-6 shadow-lg">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-2xl font-bold text-white">${processName}</h3>
                            <div class="text-right">
                                <div class="text-sm text-gray-400">FTY Target: ${ftyTarget}%</div>
                                <div class="text-lg font-bold ${ftyStatus === 'good' ? 'text-green-400' : 'text-red-400'}">
                                    Actual: ${currentFTY.toFixed(2)}%
                                </div>
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div class="bg-gray-700 p-4 rounded-lg text-center">
                                <div class="text-2xl font-bold text-blue-400">${totals.handle}</div>
                                <div class="text-sm text-gray-400">Total Handle</div>
                            </div>
                            <div class="bg-gray-700 p-4 rounded-lg text-center">
                                <div class="text-2xl font-bold text-green-400">${totals.pass}</div>
                                <div class="text-sm text-gray-400">Pass</div>
                            </div>
                            <div class="bg-gray-700 p-4 rounded-lg text-center">
                                <div class="text-2xl font-bold text-red-400">${totals.fail}</div>
                                <div class="text-sm text-gray-400">Fail</div>
                            </div>
                        </div>
                        
                        <div class="chart-container">
                            <canvas id="chart-${processName}" class="chart-canvas"></canvas>
                        </div>
                    </div>
                    `;
                }
            });
            
            if (reportsHTML === '') {
                container.innerHTML = `
                    <div class="bg-gray-800 p-6 rounded-lg text-center text-gray-400">
                        <span class="text-2xl">📈</span>
                        <h3 class="font-bold text-lg mt-2">Sin datos de procesos</h3>
                        <p class="text-sm mt-1">No hay datos disponibles para generar reportes</p>
                    </div>
                `;
            } else {
                container.innerHTML = reportsHTML;
                
                // Crear gráficos después de insertar el HTML
                setTimeout(() => {
                    this.createProcessCharts(data);
                }, 100);
            }
        }

        /**
         * Calcula totales para un proceso específico
         */
        calculateProcessTotals(processData) {
            return processData.reduce((totals, item) => {
                totals.handle += parseInt(item['Prime Handle']) || 0;
                totals.pass += parseInt(item['Prime Pass']) || 0;
                totals.fail += parseInt(item['Prime Fail']) || 0;
                return totals;
            }, { handle: 0, pass: 0, fail: 0 });
        }

        /**
         * Crea gráficos para los reportes de proceso
         */
        createProcessCharts(data) {
            this.console.log('📊 [UI] Creando gráficos de procesos');
            
            if (typeof MQS_CHARTS !== 'undefined' && MQS_CHARTS.createProcessCharts) {
                MQS_CHARTS.createProcessCharts(data);
            } else {
                this.console.warn('⚠️ [UI] Módulo de gráficos no disponible');
            }
        }

        /**
         * Maneja clics en tarjetas
         */
        handleCardClick(e) {
            this.console.log('🎨 [UI] Click en tarjeta:', e.target);
        }

        /**
         * Maneja inputs en tarjetas
         */
        handleCardInput(e) {
            if (e.target.matches('.manual-input')) {
                const card = e.target.closest('.daily-card');
                if (!card) return;

                const date = card.dataset.date;
                const field = e.target.dataset.field;
                
                // Si el valor está vacío, tratarlo como 0
                const value = e.target.value === '' ? '0' : e.target.value;
                e.target.value = value;
                
                // Guardar en storage
                if (window.MQS_STORAGE) {
                    MQS_STORAGE.saveManualData(date, field, value);
                }
                
                // Actualizar KPIs de la tarjeta
                this.updateDailyCardKPIs(card, date);
                
                // Actualizar tarjeta de resumen total
                this.updateTotalSummaryCard();
                
                this.console.log('🎨 [UI] Datos manuales actualizados:', date, field, value);
            }
        }

        /**
         * Actualiza los KPIs de una tarjeta diaria
         */
        updateDailyCardKPIs(card, date) {
            const dailyApiTotals = this.getDailyApiTotals(date, window.currentFilteredData || []);
            const manualData = window.MQS_STORAGE ? MQS_STORAGE.getManualData(date) : {};
            
            const input = manualData.INPUT !== undefined && manualData.INPUT !== '' ? parseInt(manualData.INPUT) : dailyApiTotals.input;
            const output = manualData.Output !== undefined && manualData.Output !== '' ? parseInt(manualData.Output) : dailyApiTotals.output;
            const defects = manualData.Defectos !== undefined && manualData.Defectos !== '' ? parseInt(manualData.Defectos) : dailyApiTotals.defects;
            const dphu = (defects || 0) === 0 ? 0 : ((input || 0) > 0 ? ((defects || 0) * 100 / (input || 0)) : 0);
            
            // Actualizar valores en la UI
            const inputEl = card.querySelector('[data-kpi="input"]');
            const outputEl = card.querySelector('[data-kpi="output"]');
            const defectsEl = card.querySelector('[data-kpi="defects"]');
            const dphuEl = card.querySelector('[data-kpi="dphu"]');
            const kpiCard = card.querySelector('[data-kpi="dphu-card"]');
            
            if (inputEl) inputEl.textContent = input || 0;
            if (outputEl) outputEl.textContent = output || 0;
            if (defectsEl) defectsEl.textContent = defects || 0;
            if (dphuEl) dphuEl.textContent = dphu.toFixed(2) + '%';
            
            // Actualizar color del KPI
            if (kpiCard) {
                kpiCard.className = 'kpi-card rounded-md p-2 ';
                let dphuColorClass = 'good';
                if (dphu > 7) dphuColorClass = 'bad';
                else if (dphu >= 5) dphuColorClass = 'warn';
                kpiCard.classList.add(dphuColorClass);
            }
        }

        /**
         * Actualiza la tarjeta de resumen total
         */
        updateTotalSummaryCard() {
            const totalCard = document.getElementById('total-summary-card');
            if (!totalCard || !window.currentFilteredData) return;

            // Recalcular totales con datos actualizados
            const dateGroups = window.currentFilteredData.reduce((acc, item) => {
                const date = this.formatDate(item.Date);
                if (!date) return acc;
                if (!acc[date]) {
                    acc[date] = { auto: {}, manual: {} };
                }
                const process = item.Process || 'SinProceso';
                const primeHandle = parseInt(item['Prime Handle']) || 0;
                acc[date].auto[process] = (acc[date].auto[process] || 0) + primeHandle;
                return acc;
            }, {});

            const totals = this.calculateTotalsWithManualData(dateGroups, window.currentFilteredData);
            
            // Actualizar elementos en la UI
            const inputEl = totalCard.querySelector('[data-total="input"]');
            const outputEl = totalCard.querySelector('[data-total="output"]');
            const defectsEl = totalCard.querySelector('[data-total="defects"]');
            const dphuEl = totalCard.querySelector('[data-total="dphu"]');
            const dphuCard = totalCard.querySelector('[data-total="dphu-card"]');
            
            if (inputEl) inputEl.textContent = totals.input;
            if (outputEl) outputEl.textContent = totals.output;
            if (defectsEl) defectsEl.textContent = totals.defects;
            if (dphuEl) dphuEl.textContent = totals.dphu.toFixed(2) + '%';
            
            if (dphuCard) {
                dphuCard.className = 'kpi-card rounded-md p-2 ';
                let dphuColorClass = 'good';
                if (totals.dphu > 7) dphuColorClass = 'bad';
                else if (totals.dphu >= 5) dphuColorClass = 'warn';
                dphuCard.classList.add(dphuColorClass);
            }
        }

        /**
         * Calcula totales incluyendo datos manuales
         */
        calculateTotalsWithManualData(dateGroups, data) {
            const ALL_PROCESSES = ['IFLASH', 'UCT', 'FODTEST', 'XCVR_RT', 'XCVR_LT', 'LCDCAL', 'L2VISION', 'L2AR', 'CFC'];
            const ALL_MANUAL_FIELDS = ['CQA1', 'RUNNING', 'CQA2', 'CQA1 Def.', 'CQA2 Def.'];
            
            const totals = { 
                input: 0, output: 0, defects: 0, days: Object.keys(dateGroups).length,
                processes: {}, manual: {} 
            };

            ALL_PROCESSES.forEach(p => totals.processes[p] = 0);
            ALL_MANUAL_FIELDS.forEach(f => totals.manual[f] = 0);

            for(const date in dateGroups) {
                const dailyApiData = this.getDailyApiTotals(date, data);
                const manualData = window.MQS_STORAGE ? MQS_STORAGE.getManualData(date) : {};
                
                const input = manualData.INPUT !== undefined && manualData.INPUT !== '' ? parseInt(manualData.INPUT) : dailyApiData.input;
                const output = manualData.Output !== undefined && manualData.Output !== '' ? parseInt(manualData.Output) : dailyApiData.output;
                const defects = manualData.Defectos !== undefined && manualData.Defectos !== '' ? parseInt(manualData.Defectos) : dailyApiData.defects;
                
                totals.input += isNaN(input) ? 0 : input;
                totals.output += isNaN(output) ? 0 : output;
                totals.defects += isNaN(defects) ? 0 : defects;
                
                for(const process in dateGroups[date].auto) {
                    if(totals.processes.hasOwnProperty(process)) {
                        totals.processes[process] += dateGroups[date].auto[process];
                    }
                }

                for(const field in manualData) {
                    if(totals.manual.hasOwnProperty(field)) {
                        totals.manual[field] += parseInt(manualData[field]) || 0;
                    }
                }
            }

            totals.dphu = totals.defects === 0 ? 0 : (totals.input > 0 ? (totals.defects * 100 / totals.input) : 0);
            return totals;
        }

        /**
         * Maneja interacciones en reportes de proceso
         */
        handleProcessReportInteraction(e) {
            this.console.log('🎨 [UI] Interacción en reporte:', e.target);
        }

        /**
         * Maneja limpieza de datos
         */
        handleClearData() {
            this.console.log('🎨 [UI] Limpiando datos...');
            
            if (confirm('¿Estás seguro de que quieres eliminar todos los datos guardados? Esta acción no se puede deshacer.')) {
                if (window.MQS_STORAGE) {
                    MQS_STORAGE.clearAllData();
                }
                
                // Limpiar filtros
                const modelFilter = document.getElementById('model-filter');
                const dateFilter = document.getElementById('date-filter');
                if (modelFilter) modelFilter.value = '';
                if (dateFilter) dateFilter.value = '';
                
                // Recargar página para resetear completamente
                location.reload();
                
                this.showNotification('Datos eliminados correctamente.', 'success');
            }
        }

        /**
         * Maneja descarga de PDF
         */
        handleDownloadPDF() {
            this.console.log('🎨 [UI] Descargando PDF...');
            if (window.MQS_PDF) {
                MQS_PDF.generatePDF();
            }
        }

        /**
         * Muestra modal de imagen
         */
        showImageModal(imageSrc) {
            const { imageModal, modalImage } = this.elements;
            if (imageModal && modalImage) {
                modalImage.src = imageSrc;
                imageModal.style.display = 'block';
            }
        }

        /**
         * Oculta modal de imagen
         */
        hideImageModal() {
            const { imageModal } = this.elements;
            if (imageModal) {
                imageModal.style.display = 'none';
            }
        }

        /**
         * Maneja cierre de modal
         */
        handleCloseModal(e) {
            e.stopPropagation();
            this.hideImageModal();
        }

        /**
         * Muestra una notificación al usuario
         */
        showNotification(message, type = 'info') {
            this.console.log(`💬 [UI] Mostrando notificación (${type}): ${message}`);
            
            // Crear notificación visual
            this.createNotificationElement(message, type);
        }

        /**
         * Crea un elemento de notificación
         */
        createNotificationElement(message, type) {
            // Remover notificaciones anteriores
            const existingNotifications = document.querySelectorAll('.mqs-notification');
            existingNotifications.forEach(notif => notif.remove());
            
            const notificationEl = document.createElement('div');
            notificationEl.className = `mqs-notification mqs-notification--${type}`;
            
            const bgColor = type === 'error' ? 'rgba(239, 68, 68, 0.9)' : 
                            type === 'warning' ? 'rgba(245, 158, 11, 0.9)' : 
                            type === 'success' ? 'rgba(34, 197, 94, 0.9)' : 
                            'rgba(59, 130, 246, 0.9)';
                            
            notificationEl.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                max-width: 400px;
                background: ${bgColor};
                color: white;
                border-radius: 8px;
                padding: 15px 20px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.3);
                z-index: 9999;
                animation: slideInRight 0.3s ease-out;
                font-family: 'Inter', sans-serif;
            `;
            
            notificationEl.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 18px;">${type === 'error' ? '❌' : type === 'warning' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️'}</span>
                        <span style="font-weight: 500;">${message}</span>
                    </div>
                    <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: white; font-size: 20px; cursor: pointer; opacity: 0.7; margin-left: 10px;">×</button>
                </div>
            `;
            
            // Agregar estilos de animación si no existen
            if (!document.getElementById('notification-styles')) {
                const styleSheet = document.createElement('style');
                styleSheet.id = 'notification-styles';
                styleSheet.textContent = `
                    @keyframes slideInRight {
                        from { transform: translateX(100%); opacity: 0; }
                        to { transform: translateX(0); opacity: 1; }
                    }
                `;
                document.head.appendChild(styleSheet);
            }
            
            document.body.appendChild(notificationEl);
            
            // Auto-remover después de 5 segundos
            setTimeout(() => {
                if (notificationEl.parentNode) {
                    notificationEl.style.animation = 'slideInRight 0.3s ease-out reverse';
                    setTimeout(() => notificationEl.remove(), 300);
                }
            }, 5000);
        }
    }

    // Crear instancia global
    window.MQS_UI = new UIManager();
    
    // Agregar funciones globales para compatibilidad con el código original
    window.showNotification = function(message, type = 'info') {
        if (window.MQS_UI) {
            MQS_UI.showNotification(message, type);
        } else {
            console.log('Notificación:', message, type);
        }
    };
    
    window.showPDFLoading = function(show) {
        if (window.MQS_UI) {
            MQS_UI.showLoading(show, show ? 'Generando PDF...' : '');
        } else {
            console.log('PDF Loading:', show);
        }
    };
    
    console.log('✅ [UI] Módulo de interfaz cargado exitosamente');

})();
