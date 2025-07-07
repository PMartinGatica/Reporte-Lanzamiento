// ==========================================
// GENERACIÓN DE REPORTES PDF COMPLETOS
// ==========================================

/**
 * Generación de PDFs con Web Scraping completo
 */
(function() {
    'use strict';
    
    console.log('📄 [PDF] Cargando módulo de generación PDF...');

    class PDFGenerator {
        constructor() {
            this.console = window.console;
            this.console.log('📄 [PDF] PDFGenerator inicializado');
        }

        /**
         * Inicializa el generador de PDF
         */
        initialize() {
            this.console.log('📄 [PDF] Inicializando generador de PDF...');
            this.console.log('✅ [PDF] Generador inicializado');
            return true;
        }

        /**
         * MÉTODO PRINCIPAL DE COMPATIBILIDAD
         */
        async generatePDF() {
            const { jsPDF } = window.jspdf;
            if (!jsPDF || !window.html2canvas) {
                this.showNotification('Error: Librerías PDF no cargadas.', 'error');
                return;
            }

            this.showPDFLoading(true);
            const pdf = new jsPDF('p', 'mm', 'a4');
            let yPos = 0;

            try {
                this.console.log('📄 [PDF] Iniciando generación de reporte...');

                // --- PÁGINA 1: PORTADA ---
                await this.addCoverPageToPDF(pdf);

                // --- PÁGINA 2: INFORMACIÓN DEL DASHBOARD ---
                pdf.addPage();
                yPos = 20;
                pdf.setFontSize(18);
                pdf.setTextColor(52, 73, 94);
                pdf.text('Dashboard Explorer - Información General', 105, yPos, { align: 'center' });
                yPos += 20;

                // Información básica
                pdf.setFontSize(12);
                pdf.setTextColor(85, 85, 85);
                const basicInfo = [
                    `• Fecha de generación: ${this.getFormattedDateTime()}`,
                    `• Modelo: Explorer Dashboard`,
                    `• Tipo de reporte: Producción y Objetivos`
                ];

                basicInfo.forEach(info => {
                    pdf.text(info, 20, yPos);
                    yPos += 8;
                });

                yPos += 15;

                // --- PÁGINA 3: TABLA DE OBJETIVOS ---
                const objectivesTable = document.querySelector('table');
                if (objectivesTable) {
                    if (yPos > 200) {
                        pdf.addPage();
                        yPos = 20;
                    }
                    
                    pdf.setFontSize(16);
                    pdf.setTextColor(52, 73, 94);
                    pdf.text('Lista de Objetivos y Tareas', 20, yPos);
                    yPos += 15;

                    try {
                        const canvas = await window.html2canvas(objectivesTable, { 
                            backgroundColor: '#ffffff', 
                            useCORS: true,
                            scale: 1.5,
                            onclone: (doc) => {
                                // Convertir selects a texto
                                doc.querySelectorAll('select').forEach(sel => {
                                    const text = sel.options[sel.selectedIndex]?.text || sel.value;
                                    const span = doc.createElement('span');
                                    span.textContent = text;
                                    span.style.color = '#333';
                                    span.style.padding = '4px';
                                    span.style.backgroundColor = '#f8f9fa';
                                    span.style.border = '1px solid #dee2e6';
                                    span.style.borderRadius = '4px';
                                    sel.parentNode.replaceChild(span, sel);
                                });
                            }
                        });
                        
                        const imgData = canvas.toDataURL('image/png', 1.0);
                        const imgWidth = 170;
                        const imgHeight = (canvas.height * imgWidth) / canvas.width;
                        
                        if (yPos + imgHeight > 270) {
                            pdf.addPage();
                            yPos = 20;
                        }
                        
                        pdf.addImage(imgData, 'PNG', 20, yPos, imgWidth, imgHeight);
                        yPos += imgHeight + 15;
                        
                        this.console.log('✅ [PDF] Tabla de objetivos agregada');
                    } catch (error) {
                        this.console.warn('⚠️ [PDF] Error capturando tabla de objetivos:', error);
                        pdf.setFontSize(11);
                        pdf.setTextColor(231, 76, 60);
                        pdf.text('• Error al capturar tabla de objetivos', 25, yPos);
                        yPos += 15;
                    }
                }

                // --- PÁGINA 4: TOP 5 FALLAS (TESTCODES) ---
                const testCodeSection = this.findTestCodeSection();
                if (testCodeSection) {
                    if (yPos > 200) {
                        pdf.addPage();
                        yPos = 20;
                    }
                    
                    pdf.setFontSize(16);
                    pdf.setTextColor(231, 76, 60);
                    pdf.text('Top 5 Fallas - TestCodes', 20, yPos);
                    yPos += 15;

                    try {
                        const canvas = await window.html2canvas(testCodeSection, { 
                            backgroundColor: '#ffffff', 
                            useCORS: true,
                            scale: 1.5,
                            onclone: (doc) => {
                                // Convertir inputs y selects a texto visible
                                doc.querySelectorAll('input, textarea, select').forEach(input => {
                                    const value = input.tagName === 'SELECT' ? 
                                        (input.options[input.selectedIndex]?.text || input.value) : 
                                        (input.value || input.placeholder || '');
                                    
                                    const span = doc.createElement('span');
                                    span.textContent = value;
                                    span.style.color = '#333';
                                    span.style.padding = '2px 4px';
                                    span.style.backgroundColor = '#fff';
                                    span.style.border = '1px solid #ccc';
                                    span.style.fontSize = '12px';
                                    input.parentNode.replaceChild(span, input);
                                });
                            }
                        });
                        
                        const imgData = canvas.toDataURL('image/png', 1.0);
                        const imgWidth = 170;
                        const imgHeight = (canvas.height * imgWidth) / canvas.width;
                        
                        if (yPos + imgHeight > 270) {
                            pdf.addPage();
                            yPos = 20;
                        }
                        
                        pdf.addImage(imgData, 'PNG', 20, yPos, imgWidth, imgHeight);
                        yPos += imgHeight + 15;
                        
                        this.console.log('✅ [PDF] Sección TestCodes agregada');
                    } catch (error) {
                        this.console.warn('⚠️ [PDF] Error capturando TestCodes:', error);
                        pdf.setFontSize(11);
                        pdf.setTextColor(231, 76, 60);
                        pdf.text('• Error al capturar sección de TestCodes', 25, yPos);
                        yPos += 15;
                    }
                }

                // --- PÁGINAS DE GRÁFICOS ---
                const charts = document.querySelectorAll('canvas, .chart-container, .graph-container, [class*="chart"]');
                if (charts.length > 0) {
                    pdf.addPage();
                    yPos = 20;
                    pdf.setFontSize(16);
                    pdf.setTextColor(52, 73, 94);
                    pdf.text('Gráficos y Visualizaciones', 20, yPos);
                    yPos += 20;

                    for (const chart of charts) {
                        try {
                            // Determinar contexto del gráfico
                            const context = this.getChartContext(chart);
                            
                            if (yPos > 200) {
                                pdf.addPage();
                                yPos = 20;
                            }

                            // Título del gráfico
                            pdf.setFontSize(12);
                            pdf.setTextColor(52, 73, 94);
                            pdf.text(`${context.title} - ${context.process}`, 20, yPos);
                            yPos += 10;

                            const canvas = await this.captureChart(chart);
                            if (canvas) {
                                const imgData = canvas.toDataURL('image/png', 1.0);
                                const imgWidth = 170;
                                const imgHeight = Math.min((canvas.height * imgWidth) / canvas.width, 100);
                                
                                pdf.addImage(imgData, 'PNG', 20, yPos, imgWidth, imgHeight);
                                yPos += imgHeight + 15;
                                
                                this.console.log(`✅ [PDF] Gráfico agregado: ${context.title}`);
                            }
                        } catch (error) {
                            this.console.warn('⚠️ [PDF] Error capturando gráfico:', error);
                        }
                    }
                }

                // --- PÁGINA FINAL: RESUMEN ---
                pdf.addPage();
                yPos = 20;
                pdf.setFontSize(16);
                pdf.setTextColor(52, 73, 94);
                pdf.text('Resumen del Reporte', 20, yPos);
                yPos += 20;

                const summary = this.generateSummary();
                pdf.setFontSize(11);
                pdf.setTextColor(85, 85, 85);
                
                summary.forEach(line => {
                    if (yPos > 270) {
                        pdf.addPage();
                        yPos = 20;
                    }
                    pdf.text(line, 25, yPos);
                    yPos += 7;
                });

                // Guardar PDF
                const filename = `Reporte_Explorer_Dashboard_${new Date().toISOString().split('T')[0]}.pdf`;
                pdf.save(filename);
                
                this.console.log('✅ [PDF] Reporte generado exitosamente');
                this.showNotification('PDF generado exitosamente.', 'success');

            } catch (error) {
                this.console.error("❌ [PDF] Error al generar PDF:", error);
                this.showNotification('Error al generar el PDF.', 'error');
            } finally {
                this.showPDFLoading(false);
            }
        }

        /**
         * Exporta como HTML completo - MEJOR OPCIÓN
         */
        async generateHTMLReport() {
            this.console.log('📄 [HTML] Generando reporte HTML completo...');
            this.showPDFLoading(true, 'Generando reporte HTML...');

            try {
                // Crear documento HTML completo
                const htmlContent = await this.createCompleteHTML();
                
                // Descargar como archivo HTML
                const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Reporte_Explorer_Dashboard_${this.getFormattedDateFile()}.html`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                this.console.log('✅ [HTML] Reporte HTML generado exitosamente');
                this.showNotification('Reporte HTML descargado exitosamente. Se abrirá en cualquier navegador.', 'success');

            } catch (error) {
                this.console.error('❌ [HTML] Error:', error);
                this.showNotification('Error al generar reporte HTML.', 'error');
            } finally {
                this.showPDFLoading(false);
            }
        }

        /**
         * Crea HTML completo con estilos incluidos - COPIA EXACTA
         */
        async createCompleteHTML() {
            const currentURL = window.location.href;
            const timestamp = this.getFormattedDateTime();
            
            // Capturar todos los estilos CSS de la página
            const styles = Array.from(document.styleSheets)
                .map(sheet => {
                    try {
                        return Array.from(sheet.cssRules)
                            .map(rule => rule.cssText)
                            .join('\n');
                    } catch (e) {
                        return '';
                    }
                })
                .join('\n');

            // Capturar EXACTAMENTE lo que está visible en el HTML
            const bodyClone = document.body.cloneNode(true);
            
            // Limpiar elementos que no queremos en el reporte
            const elementsToRemove = bodyClone.querySelectorAll('script, noscript, #pdf-loading, .scroll-to-top, #scroll-to-top');
            elementsToRemove.forEach(el => el.remove());
            
            // Convertir inputs, textareas y selects a texto plano para que se vean en el HTML
            bodyClone.querySelectorAll('input, textarea, select').forEach(element => {
                const span = document.createElement('span');
                
                if (element.tagName === 'SELECT') {
                    const selectedOption = element.options[element.selectedIndex];
                    span.textContent = selectedOption ? selectedOption.text : element.value;
                } else if (element.tagName === 'TEXTAREA') {
                    span.textContent = element.value || element.placeholder || '';
                    span.style.whiteSpace = 'pre-wrap';
                } else {
                    span.textContent = element.value || element.placeholder || '';
                }
                
                // Mantener estilos similares
                span.className = element.className;
                span.style.cssText = element.style.cssText;
                span.style.display = 'inline-block';
                span.style.border = '1px solid #ccc';
                span.style.padding = '4px 8px';
                span.style.backgroundColor = '#f8f9fa';
                span.style.borderRadius = '4px';
                span.style.color = '#333';
                
                element.parentNode.replaceChild(span, element);
            });

            // Capturar el HTML completo del body
            const bodyHTML = bodyClone.innerHTML;

            return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Explorer Dashboard - Reporte ${this.getFormattedDate()}</title>
    <style>
        /* Estilos originales de la página */
        ${styles}
        
        /* Estilos adicionales solo para impresión/PDF */
        @media print {
            body { margin: 0; padding: 20px; }
            .no-print { display: none !important; }
            .page-break { page-break-before: always; }
        }
        
        /* Mejoras visuales para el reporte */
        body {
            background: white !important;
            color: #333 !important;
        }
        
        /* Asegurar que el texto sea legible */
        .text-white, .text-gray-100, .text-gray-200 {
            color: #333 !important;
        }
        
        .bg-gray-900, .bg-gray-800, .bg-gray-700 {
            background-color: #f8f9fa !important;
            border: 1px solid #dee2e6 !important;
        }
        
        /* Header del reporte */
        .report-header {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
            color: white !important;
            border-radius: 10px;
            page-break-inside: avoid;
        }
        
        /* Metadata del reporte */
        .report-metadata {
            background: #e9ecef;
            border: 1px solid #ced4da;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            font-size: 13px;
            color: #495057;
            page-break-inside: avoid;
        }
    </style>
</head>
<body>
    <!-- Header del Reporte -->
    <div class="report-header">
        <h1 style="margin: 0; font-size: 2.5rem; font-weight: bold;">🚀 EXPLORER DASHBOARD</h1>
        <p style="margin: 10px 0 0 0; font-size: 1.2rem;">Reporte Completo - ${timestamp}</p>
    </div>

    <!-- Metadata del Reporte -->
    <div class="report-metadata">
        <strong>📊 Información del Reporte:</strong><br>
        • URL Original: ${currentURL}<br>
        • Fecha de generación: ${timestamp}<br>
        • Tipo: Dashboard Explorer - HTML Completo<br>
        • Contenido: Copia exacta de la página web
    </div>

    <!-- Contenido Exacto del HTML Original -->
    ${bodyHTML}

    <!-- Footer del Reporte -->
    <div class="report-metadata" style="text-align: center; margin-top: 40px;">
        <p><strong>📄 Reporte generado automáticamente por Explorer Dashboard</strong></p>
        <p>Este archivo contiene una copia exacta de la página web original</p>
        <p><em>Tip: Usa Ctrl+P para imprimir o "Guardar como PDF" desde el navegador</em></p>
    </div>

    <script>
        // Funcionalidad básica para el reporte
        document.addEventListener('DOMContentLoaded', function() {
            console.log('📄 Reporte HTML cargado exitosamente');
            console.log('💡 Tip: Presiona Ctrl+P para imprimir');
            
            // Permitir impresión con Ctrl+P
            document.addEventListener('keydown', function(e) {
                if (e.ctrlKey && e.key === 'p') {
                    window.print();
                }
            });
        });
    </script>
</body>
</html>`;
        }

        /**
         * Genera resumen SOLO basado en lo que está visible
         */
        generateSummary() {
            const summary = [];
            
            // Contar elementos visibles
            const objectives = document.querySelectorAll('#objectives-table-body tr').length;
            if (objectives > 0) {
                summary.push(`• Objetivos registrados: ${objectives}`);
            }

            // Contar tablas de fallas
            const failureTables = document.querySelectorAll('[class*="failures-table"]').length;
            if (failureTables > 0) {
                summary.push(`• Tablas de fallas: ${failureTables}`);
            }

            // Contar gráficos
            const charts = document.querySelectorAll('canvas').length;
            if (charts > 0) {
                summary.push(`• Gráficos incluidos: ${charts}`);
            }

            // Información básica
            summary.push(`• Reporte generado: ${this.getFormattedDateTime()}`);
            summary.push('• Contenido: Copia exacta del dashboard web');

            return summary;
        }

        /**
         * Método auxiliar para fechas de archivo
         */
        getFormattedDateFile() {
            return new Date().toISOString().split('T')[0];
        }

        /**
         * Exporta HTML con nombre descriptivo
         */
        async generateHTMLReport() {
            this.console.log('📄 [HTML] Generando copia exacta del HTML...');
            this.showPDFLoading(true, 'Generando reporte HTML...');

            try {
                // Crear documento HTML que es copia exacta
                const htmlContent = await this.createCompleteHTML();
                
                // Descargar como archivo HTML
                const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Explorer_Dashboard_${this.getFormattedDateFile()}.html`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                this.console.log('✅ [HTML] Copia exacta generada exitosamente');
                this.showNotification('Reporte HTML descargado. Contiene exactamente lo mismo que ves en pantalla.', 'success');

            } catch (error) {
                this.console.error('❌ [HTML] Error:', error);
                this.showNotification('Error al generar la copia HTML.', 'error');
            } finally {
                this.showPDFLoading(false);
            }
        }
        /**
         * Métodos de compatibilidad
         */
        generate() {
            return this.generatePDF();
        }

        downloadPDF() {
            return this.generatePDF();
        }

        createPDF() {
            return this.generatePDF();
        }

        /**
         * Encuentra la sección de TestCodes
         */
        findTestCodeSection() {
            // Buscar por texto "Top 5 Fallas"
            const sections = document.querySelectorAll('div, section');
            for (const section of sections) {
                if (section.textContent.includes('Top 5 Fallas') || 
                    section.textContent.includes('TestCode') ||
                    section.textContent.includes('TESTCODE')) {
                    return section;
                }
            }

            // Buscar tabla con TestCodes
            const tables = document.querySelectorAll('table');
            for (const table of tables) {
                const headers = table.querySelectorAll('th');
                for (const header of headers) {
                    if (header.textContent.includes('TESTCODE') || 
                        header.textContent.includes('FALLAS')) {
                        return table.closest('div') || table;
                    }
                }
            }

            return null;
        }

        /**
         * Obtiene contexto de un gráfico
         */
        getChartContext(element) {
            const context = {
                title: 'Gráfico',
                process: 'Dashboard'
            };

            const parent = element.closest('.widget, .card, .section') || element.parentElement;
            if (parent) {
                const title = parent.querySelector('h1, h2, h3, h4, h5, h6, .title');
                if (title) {
                    context.title = title.textContent.trim();
                }

                const text = parent.textContent.toLowerCase();
                if (text.includes('producción')) context.process = 'Producción';
                else if (text.includes('falla')) context.process = 'Control de Fallas';
                else if (text.includes('objetivo')) context.process = 'Objetivos';
                else if (text.includes('calidad')) context.process = 'Calidad';
            }

            return context;
        }

        /**
         * Captura un gráfico como imagen
         */
        async captureChart(element) {
            try {
                if (element.tagName === 'CANVAS') {
                    return element;
                }
                
                return await window.html2canvas(element, {
                    backgroundColor: '#ffffff',
                    useCORS: true,
                    scale: 1.5
                });
            } catch (error) {
                this.console.warn('⚠️ [PDF] Error capturando gráfico:', error);
                return null;
            }
        }

        /**
         * Genera resumen del reporte
         */
        generateSummary() {
            const summary = [];
            let completados = 0, pendientes = 0; // MOVER ESTAS VARIABLES AQUÍ
            
            // Contar objetivos
            const objectivesTable = document.querySelector('table');
            if (objectivesTable) {
                const rows = objectivesTable.querySelectorAll('tbody tr, tr:not(:first-child)');
                summary.push(`• Total de objetivos registrados: ${rows.length}`);
                
                // Contar estados
                rows.forEach(row => {
                    const cells = row.querySelectorAll('td, th');
                    cells.forEach(cell => {
                        const text = cell.textContent.toLowerCase();
                        if (text.includes('completado')) completados++;
                        else if (text.includes('abierto') || text.includes('pendiente')) pendientes++;
                    });
                });
                
                if (completados > 0) summary.push(`• Objetivos completados: ${completados}`);
                if (pendientes > 0) summary.push(`• Objetivos pendientes: ${pendientes}`);
            }

            // Información de TestCodes
            const testCodeSection = this.findTestCodeSection();
            if (testCodeSection) {
                const inputs = testCodeSection.querySelectorAll('input, textarea');
                let filledInputs = 0;
                inputs.forEach(input => {
                    if (input.value && input.value.trim()) filledInputs++;
                });
                summary.push(`• TestCodes con información: ${filledInputs}`);
            }

            // Gráficos
            const charts = document.querySelectorAll('canvas, .chart-container, [class*="chart"]');
            summary.push(`• Gráficos incluidos: ${charts.length}`);

            summary.push('');
            summary.push('ANÁLISIS:');
            
            // CALCULAR COMPLETION RATE CORRECTAMENTE
            let completionRate = 0;
            const totalObjectives = completados + pendientes;
            if (totalObjectives > 0) {
                completionRate = Math.round((completados / totalObjectives) * 100);
            }
            
            if (completionRate >= 75) {
                summary.push('• Estado del proyecto: BUENO - La mayoría de objetivos están completados');
            } else if (completionRate >= 50) {
                summary.push('• Estado del proyecto: REGULAR - Revisar objetivos pendientes');
            } else {
                summary.push('• Estado del proyecto: CRÍTICO - Muchos objetivos pendientes');
            }

            summary.push('• Recomendación: Continuar monitoreando el progreso regularmente');
            summary.push(`• Reporte generado: ${this.getFormattedDateTime()}`);

            return summary;
        }

        /**
         * Agrega portada al PDF
         */
        async addCoverPageToPDF(pdf) {
            // Título principal
            pdf.setFontSize(32);
            pdf.setTextColor(41, 128, 185);
            pdf.text('EXPLORER', 105, 80, { align: 'center' });

            pdf.setFontSize(24);
            pdf.setTextColor(52, 73, 94);
            pdf.text('Dashboard de Producción', 105, 105, { align: 'center' });

            pdf.setFontSize(18);
            pdf.setTextColor(85, 85, 85);
            pdf.text('Reporte Completo', 105, 125, { align: 'center' });

            // Información del reporte
            pdf.setFontSize(12);
            pdf.setTextColor(85, 85, 85);
            const reportInfo = [
                `Fecha: ${this.getFormattedDate()}`,
                `Hora: ${this.getFormattedTime()}`,
                'Tipo: Dashboard Explorer',
                'Versión: 3.0'
            ];

            let yPos = 160;
            reportInfo.forEach(info => {
                pdf.text(info, 105, yPos, { align: 'center' });
                yPos += 10;
            });
        }

        /**
         * Métodos auxiliares
         */
        getFormattedDate() {
            return new Date().toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }

        getFormattedTime() {
            return new Date().toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        getFormattedDateTime() {
            return `${this.getFormattedDate()} a las ${this.getFormattedTime()}`;
        }

        showPDFLoading(show) {
            if (show) {
                if (!document.getElementById('pdf-loading')) {
                    const overlay = document.createElement('div');
                    overlay.id = 'pdf-loading';
                    overlay.innerHTML = `
                        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;">
                            <div style="background: white; padding: 30px; border-radius: 10px; text-align: center;">
                                <div style="border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 2s linear infinite; margin: 0 auto 20px;"></div>
                                <h3>Generando PDF...</h3>
                                <p>Por favor espere mientras se procesa el reporte</p>
                            </div>
                        </div>
                        <style>
                            @keyframes spin {
                                0% { transform: rotate(0deg); }
                                100% { transform: rotate(360deg); }
                            }
                        </style>
                    `;
                    document.body.appendChild(overlay);
                }
            } else {
                const loading = document.getElementById('pdf-loading');
                if (loading) {
                    loading.remove();
                }
            }
        }

        showNotification(message, type = 'info') {
            const colors = {
                'success': '#10b981',
                'error': '#ef4444',
                'info': '#3b82f6'
            };

            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${colors[type] || colors.info};
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                font-size: 14px;
                max-width: 300px;
            `;
            notification.textContent = message;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 5000);
        }
    }

    // Crear instancia global
    window.MQS_PDF = new PDFGenerator();

    // Auto-inicializar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.MQS_PDF.initialize();
        });
    } else {
        window.MQS_PDF.initialize();
    }

    console.log('✅ [PDF] Módulo PDF simplificado cargado');

})();
