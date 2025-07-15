/**
 * Manejo de gráficos y visualizaciones
 */
(function() {
    'use strict';
    
    console.log('📊 [CHARTS] Cargando módulo de gráficos...');

    // Asegurar que ChartDataLabels esté registrado
    if (typeof Chart !== 'undefined' && typeof ChartDataLabels !== 'undefined') {
        Chart.register(ChartDataLabels);
        console.log('📊 [CHARTS] ChartDataLabels registrado exitosamente');
    } else {
        console.error('❌ [CHARTS] Chart.js o ChartDataLabels no están disponibles');
    }

    class ChartsManager {
        constructor() {
            this.console = window.console;
            this.charts = {};
            
            this.console.log('📊 [CHARTS] ChartsManager inicializado');
        }

        /**
         * Formatea una fecha
         */
        formatDate(dateString) {
            if (!dateString) return null;
            try {
                const date = new Date(dateString);
                if (isNaN(date.getTime())) return null;
                return date.toISOString().split('T')[0];
            } catch { return null; }
        }

        /**
         * Crea reportes de procesos con gráficos y tablas
         */
        createProcessReports(data) {
            this.console.log('📊 [CHARTS] Creando reportes de procesos');
            
            const container = document.getElementById('process-reports-container');
            if (!container) {
                this.console.error('❌ [CHARTS] Contenedor de reportes no encontrado');
                return;
            }

            container.innerHTML = '';

            // Orden específico de procesos solicitado
            const processOrder = ['IFLASH', 'UCT', 'FODTEST', 'XCVR_RT', 'XCVR_LT', 'LCDCAL', 'L2VISION', 'L2AR', 'CFC'];
            const availableProcesses = [...new Set(data.map(item => item.Process).filter(Boolean))];
            
            // Filtrar y ordenar procesos según el orden especificado
            const orderedProcesses = processOrder.filter(process => availableProcesses.includes(process));
            // Agregar procesos no especificados al final
            const remainingProcesses = availableProcesses.filter(process => !processOrder.includes(process));
            const processesWithData = [...orderedProcesses, ...remainingProcesses];
            
            processesWithData.forEach(processName => {
                const processDataForChart = data.filter(item => item.Process === processName);
                
                const reportElement = this.createProcessReportElement(processName);
                container.appendChild(reportElement);
                
                this.createProcessChart(processName, processDataForChart, reportElement);
                
                // Actualizar tablas de fallas si hay datos disponibles
                if (window.MQS_DATA && window.MQS_DATA.failures && window.MQS_FAILURES) {
                    MQS_FAILURES.updateFailuresTable(processName, reportElement, MQS_DATA.failures);
                }
            });
        }

        /**
         * Crea un elemento de reporte de proceso
         */
        createProcessReportElement(processName) {
            const reportElement = document.createElement('div');
            reportElement.className = 'bg-gray-800 p-6 rounded-lg shadow-lg mb-6';
            reportElement.dataset.process = processName;
            
            reportElement.innerHTML = `
                <h3 class="text-xl font-bold text-white mb-4">${processName}</h3>
                <div class="grid grid-cols-1 sm:grid-cols-1 gap-4 mb-6 text-center">
                    <div class="bg-gray-700 p-3 rounded-lg"><p class="text-sm text-gray-400">FTY%</p><p class="text-3xl font-bold text-green-400" data-metric-fty-total="true">0.00%</p></div>
                    <!-- TODO: Reactivar NTF% y DPHU% después
                    <div class="bg-gray-700 p-3 rounded-lg"><p class="text-sm text-gray-400">NTF%</p><p class="text-3xl font-bold text-yellow-400" data-metric-ntf-total="true">0.00%</p></div>
                    <div class="bg-gray-700 p-3 rounded-lg"><p class="text-sm text-gray-400">DPHU%</p><p class="text-3xl font-bold text-red-400" data-metric-dphu-total="true">0.00%</p></div>
                    -->
                </div>
                <div class="relative h-96"><canvas data-chart="${processName}"></canvas></div>
                <div class="failures-table-container mt-6"></div>
            `;
            return reportElement;
        }

        /**
         * Crea un gráfico de proceso
         */
        createProcessChart(processName, processData, reportElement) {
            const canvas = reportElement.querySelector(`[data-chart="${processName}"]`);
            if (!canvas) return;
            
            // Agrupar datos por fecha para cálculo correcto
            const groupedByDate = processData.reduce((acc, item) => {
                const date = this.formatDate(item.Date);
                if (!date) return acc;
                
                if (!acc[date]) {
                    acc[date] = { handle: 0, pass: 0, ntf: 0, defect: 0, fail: 0 };
                }
                
                acc[date].handle += parseInt(item['Prime Handle']) || 0;
                acc[date].pass += parseInt(item['Prime Pass']) || 0;
                acc[date].ntf += parseInt(item['Prime NTF Count']) || 0;
                acc[date].defect += parseInt(item['Prime Defect Count']) || 0;
                acc[date].fail += parseInt(item['Prime Fail']) || 0;
                
                return acc;
            }, {            });
            
            // Para las métricas principales, usar el valor de la ÚLTIMA FECHA (más reciente) del gráfico
            // no el promedio total, para que coincida con lo que ve el usuario en el gráfico
            const metricsDatesSorted = Object.keys(groupedByDate).sort();
            const latestDate = metricsDatesSorted[metricsDatesSorted.length - 1]; // Última fecha
            
            let latestFty = 0, latestNtfPercent = 0, latestDphuPercent = 0;
            if (latestDate && groupedByDate[latestDate]) {
                const latestData = groupedByDate[latestDate];
                latestFty = latestData.handle > 0 ? (latestData.pass * 100 / latestData.handle) : 0;
                latestNtfPercent = latestData.handle > 0 ? (latestData.ntf * 100 / latestData.handle) : 0;
                latestDphuPercent = latestData.handle > 0 ? (latestData.defect * 100 / latestData.handle) : 0;
            }
            
            this.console.log('📊 [CHARTS] Métricas de ÚLTIMA FECHA para', processName, ':', {
                fechas: Object.keys(groupedByDate),
                ultimaFecha: latestDate,
                datosUltimaFecha: groupedByDate[latestDate],
                FTY_ultimaFecha: latestFty.toFixed(2) + '%',
                NTF_ultimaFecha: latestNtfPercent.toFixed(2) + '%',
                DPHU_ultimaFecha: latestDphuPercent.toFixed(2) + '%'
            });
            
            // Actualizar elementos en la UI con los valores de la ÚLTIMA FECHA
            reportElement.querySelector('[data-metric-fty-total]').textContent = `${latestFty.toFixed(2)}%`;
            // TODO: Reactivar después
            // reportElement.querySelector('[data-metric-ntf-total]').textContent = `${latestNtfPercent.toFixed(2)}%`;
            // reportElement.querySelector('[data-metric-dphu-total]').textContent = `${latestDphuPercent.toFixed(2)}%`;

            // Para el gráfico, usar datos agrupados por fecha
            const sortedDates = Object.keys(groupedByDate).sort();
            
            const tooltipData = sortedDates.map(date => {
                const dayData = groupedByDate[date];
                return {
                    date: new Date(date + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'long' }),
                    handle: dayData.handle,
                    pass: dayData.pass,
                    fail: dayData.fail,
                    fty: dayData.handle > 0 ? (dayData.pass * 100 / dayData.handle) : 0,
                };
            });
            
            if (canvas.chart) canvas.chart.destroy();
            
            // Verificar que ChartDataLabels esté disponible antes de crear el gráfico
            if (typeof ChartDataLabels === 'undefined') {
                this.console.error('❌ [CHARTS] ChartDataLabels no está disponible para', processName);
            } else {
                this.console.log('✅ [CHARTS] ChartDataLabels disponible para', processName);
            }
            
            const FTY_TARGETS = {
                'UCT': 98.00, 'FODTEST': 98.00, 'XCVR_LT': 95.00, 'LCDCAL': 98.00,
                'L2VISION': 95.00, 'L2AR': 95.00, 'DEPTHCAL': 98.00, 'DEPTHVAL': 98.00,
                'TELECAL': 98.00, 'TELEVAL': 98.00, 'CFC': 98.00
            };
            
            canvas.chart = new Chart(canvas.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: tooltipData.map(d => d.date),
                    datasets: [{
                        type: 'bar', 
                        label: 'Prime Handle', 
                        data: tooltipData.map(d => d.handle),
                        backgroundColor: (context) => {
                            const {ctx, chartArea} = context.chart;
                            if (!chartArea) return null;
                            const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                            gradient.addColorStop(0, 'rgba(59, 130, 246, 0.2)');
                            gradient.addColorStop(1, 'rgba(59, 130, 246, 0.8)');
                            return gradient;
                        },
                        borderColor: 'rgba(59, 130, 246, 1)', 
                        borderWidth: 1.5, 
                        yAxisID: 'y',
                        datalabels: {
                            anchor: 'center',
                            align: 'center',
                            color: 'white',
                            font: { weight: 'bold', size: 12 },
                            formatter: (value) => value > 0 ? value.toString() : ''
                        }
                    }, {
                        type: 'line', 
                        label: 'FTY%', 
                        data: tooltipData.map(d => d.fty),
                        borderColor: '#f87171', 
                        backgroundColor: '#f87171', 
                        tension: 0.4,
                        pointRadius: 5, 
                        pointHoverRadius: 7, 
                        pointBackgroundColor: '#f87171', 
                        yAxisID: 'y1',
                        datalabels: {
                            anchor: 'end',
                            align: 'top',
                            offset: 10,
                            color: 'white',
                            font: { weight: 'bold', size: 11 },
                            formatter: (value) => value.toFixed(1) + '%',
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            borderRadius: 4,
                            padding: 4
                        }
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
                    scales: {
                        y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'Prime Handle', color: 'white'}, ticks: { color: 'white' }, grid: { color: 'rgba(255,255,255,0.1)'} },
                        y1: { type: 'linear', display: true, position: 'right', min: 0, max: 110, title: { display: true, text: 'FTY%', color: 'white' }, ticks: { color: 'white', callback: v => v + '%' }, grid: { drawOnChartArea: false } },
                        x: { ticks: { color: 'white' }, grid: { color: 'rgba(255,255,255,0.1)'}}
                    },
                    plugins: {
                        legend: { labels: { color: 'white' } },
                        tooltip: {
                            enabled: true, backgroundColor: 'rgba(0, 0, 0, 0.85)',
                            titleFont: { size: 14, weight: 'bold' }, bodyFont: { size: 12 }, padding: 10, boxPadding: 5,
                            callbacks: {
                                title: (ctx) => tooltipData[ctx[0].dataIndex].date,
                                label: (ctx) => {
                                    const day = tooltipData[ctx.dataIndex];
                                    return ctx.dataset.type === 'line' ? `FTY: ${day.fty.toFixed(2)}%` : [`Volumen: ${day.handle}`, `  - OK: ${day.pass}`, `  - Fallas: ${day.fail}`];
                                }
                            }
                        }
                    }
                },
                plugins: [{
                    id: 'targetLine',
                    afterDraw: (chart) => {
                        const targetValue = FTY_TARGETS[processName];
                        if (!targetValue) return;
                        const { ctx, chartArea: { left, right }, scales: { y1 } } = chart;
                        const y = y1.getPixelForValue(targetValue);
                        ctx.save();
                        ctx.strokeStyle = '#22c55e';
                        ctx.lineWidth = 2;
                        ctx.setLineDash([6, 6]);
                        ctx.beginPath();
                        ctx.moveTo(left, y);
                        ctx.lineTo(right, y);
                        ctx.stroke();
                        ctx.fillStyle = '#22c55e';
                        ctx.font = 'bold 12px Inter';
                        ctx.textAlign = 'right';
                        ctx.fillText(`Meta: ${targetValue}%`, right - 5, y - 5);
                        ctx.restore();
                    }
                }]
            });
        }

        /**
         * Actualiza la tabla de fallas para un proceso
         */
        updateFailuresTable(processName, reportElement) {
            const container = reportElement.querySelector('.failures-table-container');
            const failuresData = window.MQS_DATA?.failures || [];
            const processFailures = failuresData.filter(f => f.process === processName);
            const top5Failures = processFailures
                .sort((a,b) => (parseInt(b.pfail) || 0) - (parseInt(a.pfail) || 0))
                .slice(0, 5);

            if (top5Failures.length === 0) {
                container.innerHTML = '<p class="text-gray-400 mt-6">No se encontraron datos de fallas para este proceso en el período seleccionado.</p>';
                return;
            }
            
            const rowsHTML = top5Failures.map(failure => {
                const notes = {}; // Por ahora sin notas, se puede implementar después
                const imageCellHTML = `<label class="image-upload-label" for="upload-${processName}-${failure.testcode}">Subir</label><input type="file" id="upload-${processName}-${failure.testcode}" class="hidden" accept="image/*" data-action="upload-image">`;

                return `
                    <tr class="border-b border-gray-600 hover:bg-gray-700" data-testcode="${failure.testcode}">
                        <td class="px-4 py-3 text-center">${failure.testcode}</td>
                        <td class="px-4 py-3 text-center">${failure.pfail}</td>
                        <td class="px-4 py-3 text-center">${failure.pfailph?.formatted || '0.00%'}</td>
                        <td class="px-4 py-3 text-center">${failure.pntf || 0}</td>
                        <td class="px-4 py-3"><textarea class="w-full bg-gray-700 text-white px-2 py-1 rounded resize-y min-h-[38px]" placeholder="Causa..." data-action="save-note" data-type="causa" style="overflow-y:hidden">${notes.causa || ''}</textarea></td>
                        <td class="px-4 py-3"><textarea class="w-full bg-gray-700 text-white px-2 py-1 rounded resize-y min-h-[38px]" placeholder="Acción..." data-action="save-note" data-type="accion" style="overflow-y:hidden">${notes.accion || ''}</textarea></td>
                        <td class="px-4 py-3 text-center">${imageCellHTML}</td>
                    </tr>
                `;
            }).join('');

            container.innerHTML = `
                <h4 class="text-lg font-semibold mb-2">Top 5 Fallas</h4>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm text-left text-gray-200">
                        <thead class="text-xs uppercase bg-gray-700">
                            <tr>
                                <th class="px-4 py-3">Testcode</th><th class="px-4 py-3">Fallas</th><th class="px-4 py-3">Fail %</th>
                                <th class="px-4 py-3">NTF</th><th class="px-4 py-3">Causas</th><th class="px-4 py-3">Acciones</th><th class="px-4 py-3">Imagen</th>
                            </tr>
                        </thead>
                        <tbody>${rowsHTML}</tbody>
                    </table>
                </div>`;
        }

        /**
         * Actualiza las métricas de todos los procesos basadas en datos manuales
         */
        updateProcessMetrics() {
            if (!window.filteredData || window.filteredData.length === 0) {
                this.console.warn('⚠️ [CHARTS] No hay datos filtrados para actualizar métricas');
                return;
            }

            // Obtener todos los procesos únicos
            const processGroups = window.filteredData.reduce((groups, item) => {
                const process = item.Process;
                if (!groups[process]) groups[process] = [];
                groups[process].push(item);
                return groups;
            }, {});

            // Actualizar métricas para cada proceso
            Object.keys(processGroups).forEach(processName => {
                const reportElement = document.querySelector(`[data-process="${processName}"]`);
                if (!reportElement) return;

                const processData = processGroups[processName];
                
                // Agrupar datos por fecha para cálculo correcto
                const groupedByDate = processData.reduce((acc, item) => {
                    const date = this.formatDate(item.Date);
                    if (!date) return acc;
                    
                    if (!acc[date]) {
                        acc[date] = { handle: 0, pass: 0, ntf: 0, defect: 0 };
                    }
                    
                    acc[date].handle += parseInt(item['Prime Handle']) || 0;
                    acc[date].pass += parseInt(item['Prime Pass']) || 0;
                    acc[date].ntf += parseInt(item['Prime NTF Count']) || 0;
                    acc[date].defect += parseInt(item['Prime Defect Count']) || 0;
                    
                    return acc;
                }, {});
                
                // Calcular totales acumulados correctos
                let totalHandle = 0, totalPass = 0, totalNTF = 0, totalDefect = 0;
                Object.values(groupedByDate).forEach(dayData => {
                    totalHandle += dayData.handle;
                    totalPass += dayData.pass;
                    totalNTF += dayData.ntf;
                    totalDefect += dayData.defect;
                });
                
                // Para las métricas, usar el valor de la ÚLTIMA FECHA del gráfico para consistencia
                const updateDatesSorted = Object.keys(groupedByDate).sort();
                const updateLatestDate = updateDatesSorted[updateDatesSorted.length - 1];
                
                let updateLatestFty = 0, updateLatestNtfPercent = 0, updateLatestDphuPercent = 0;
                if (updateLatestDate && groupedByDate[updateLatestDate]) {
                    const updateLatestData = groupedByDate[updateLatestDate];
                    updateLatestFty = updateLatestData.handle > 0 ? (updateLatestData.pass * 100 / updateLatestData.handle) : 0;
                    updateLatestNtfPercent = updateLatestData.handle > 0 ? (updateLatestData.ntf * 100 / updateLatestData.handle) : 0;
                    updateLatestDphuPercent = updateLatestData.handle > 0 ? (updateLatestData.defect * 100 / updateLatestData.handle) : 0;
                }
                
                // Actualizar elementos en la UI con valores de ÚLTIMA FECHA
                const ftyElement = reportElement.querySelector('[data-metric-fty-total]');
                // TODO: Reactivar después
                // const ntfElement = reportElement.querySelector('[data-metric-ntf-total]');
                // const dphuElement = reportElement.querySelector('[data-metric-dphu-total]');
                
                if (ftyElement) ftyElement.textContent = `${updateLatestFty.toFixed(2)}%`;
                // TODO: Reactivar después
                // if (ntfElement) ntfElement.textContent = `${updateLatestNtfPercent.toFixed(2)}%`;
                // if (dphuElement) dphuElement.textContent = `${updateLatestDphuPercent.toFixed(2)}%`;
                
                this.console.log('📊 [CHARTS] Métricas actualizadas para', processName, ':', {
                    fechas: Object.keys(groupedByDate),
                    totalHandle: totalHandle,
                    totalPass: totalPass,
                    FTY: totalFty.toFixed(2) + '%',
                    NTF: totalNtfPercent.toFixed(2) + '%',
                    DPHU: totalDphuPercent.toFixed(2) + '%'
                });
            });
        }

        /**
         * Destruye un gráfico
         */
        destroyChart(chartId) {
            if (this.charts[chartId]) {
                this.charts[chartId].destroy();
                delete this.charts[chartId];
                this.console.log('📊 [CHARTS] Gráfico destruido:', chartId);
            }
        }

        /**
         * Destruye todos los gráficos
         */
        destroyAllCharts() {
            Object.keys(this.charts).forEach(chartId => {
                this.destroyChart(chartId);
            });
            this.console.log('📊 [CHARTS] Todos los gráficos destruidos');
        }
    }

    // Crear instancia global
    window.MQS_CHARTS = new ChartsManager();
    console.log('✅ [CHARTS] Módulo de gráficos cargado exitosamente');

})();
