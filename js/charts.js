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

            const processesWithData = [...new Set(data.map(item => item.Process).filter(Boolean))];
            
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
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 text-center">
                    <div class="bg-gray-700 p-3 rounded-lg"><p class="text-sm text-gray-400">FTY%</p><p class="text-3xl font-bold text-green-400" data-metric-fty-total="true">0.00%</p></div>
                    <div class="bg-gray-700 p-3 rounded-lg"><p class="text-sm text-gray-400">NTF%</p><p class="text-3xl font-bold text-yellow-400" data-metric-ntf-total="true">0.00%</p></div>
                    <div class="bg-gray-700 p-3 rounded-lg"><p class="text-sm text-gray-400">DPHU%</p><p class="text-3xl font-bold text-red-400" data-metric-dphu-total="true">0.00%</p></div>
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
            
            let totalHandle = 0, totalPass = 0, totalNTF = 0, totalDefect = 0;
            processData.forEach(item => {
                totalHandle += parseInt(item['Prime Handle']) || 0;
                totalPass += parseInt(item['Prime Pass']) || 0;
                totalNTF += parseInt(item['Prime NTF Count']) || 0;
                totalDefect += parseInt(item['Prime Defect Count']) || 0;
            });
            
            const totalFty = totalHandle > 0 ? (totalPass * 100 / totalHandle) : 0;
            const totalNtfPercent = totalHandle > 0 ? (totalNTF * 100 / totalHandle) : 0;
            const totalDphuPercent = totalHandle > 0 ? (totalDefect * 100 / totalHandle) : 0;
            
            reportElement.querySelector('[data-metric-fty-total]').textContent = `${totalFty.toFixed(2)}%`;
            reportElement.querySelector('[data-metric-ntf-total]').textContent = `${totalNtfPercent.toFixed(2)}%`;
            reportElement.querySelector('[data-metric-dphu-total]').textContent = `${totalDphuPercent.toFixed(2)}%`;

            const groupedData = processData.reduce((acc, item) => {
                const date = this.formatDate(item.Date);
                if (!date) return acc;
                acc[date] = acc[date] || { primeHandle: 0, primePass: 0, primeFail: 0 };
                acc[date].primeHandle += parseInt(item['Prime Handle']) || 0;
                acc[date].primePass += parseInt(item['Prime Pass']) || 0;
                acc[date].primeFail += parseInt(item['Prime Fail']) || 0;
                return acc;
            }, {});
            
            const sortedDates = Object.keys(groupedData).sort();
            
            const tooltipData = sortedDates.map(date => {
                const dayData = groupedData[date];
                return {
                    date: new Date(date + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'long' }),
                    handle: dayData.primeHandle,
                    pass: dayData.primePass,
                    fail: dayData.primeFail,
                    fty: dayData.primeHandle > 0 ? (dayData.primePass * 100 / dayData.primeHandle) : 0,
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
