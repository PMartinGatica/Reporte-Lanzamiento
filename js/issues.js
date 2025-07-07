// ==========================================
// MANEJO DE PROBLEMAS Y SU SEGUIMIENTO
// ==========================================

/**
 * Manejo de seguimiento de problemas
 */
(function() {
    'use strict';
    
    console.log('📋 [ISSUES] Cargando módulo de problemas...');

    class IssuesManager {
        constructor() {
            this.console = window.console;
            this.issues = [];
            
            this.console.log('📋 [ISSUES] IssuesManager inicializado');
        }

        /**
         * Inicializa el sistema de problemas
         */
        initialize() {
            this.console.log('📋 [ISSUES] Inicializando sistema de problemas...');
            
            // Usar datos iniciales del archivo original
            this.issues = [
                { id: 1, product: 'EXPLORER', description: 'CQA1 2000' },
                { id: 2, product: 'EXPLORER', description: 'RUNNING: 24hs, 2000' },
                { id: 3, product: 'EXPLORER', description: 'CQA2 2000' },
                { id: 4, product: 'EXPLORER', description: 'BO PACKING' },
                { id: 5, product: 'EXPLORER', description: 'PSO Videos' },
                { id: 6, product: 'EXPLORER', description: 'ORT: 3 unidades' },
                { id: 7, product: 'EXPLORER', description: 'Consumer screen protector: 100pcs.' },
                { id: 8, product: 'EXPLORER', description: '200 Gate: 100 Unidades no destructivo.' },
                { id: 9, product: 'EXPLORER', description: 'R&R' },
                { id: 10, product: 'EXPLORER', description: 'AMFE CFC' },
                { id: 11, product: 'EXPLORER', description: 'PSA activation check: 10pcs. Battery cover, camera deco y Battery PSA.' },
                { id: 12, product: 'EXPLORER', description: 'ISTA (packing). Prioridad.' },
                { id: 13, product: 'EXPLORER', description: 'ALT: 17 muestras (destructivo). Prioridad. Shower test - Tumbler test' },
                { id: 14, product: 'EXPLORER', description: 'BO SW' },
                { id: 15, product: 'EXPLORER', description: 'Droptest' },
                { id: 16, product: 'EXPLORER', description: 'Instructivo CQA1 y CQA2' },
                { id: 17, product: 'EXPLORER', description: 'IQC: Cosmético Funcional' }
            ];

            this.render();
            this.setupEvents();
            this.initializeStyles();
            this.applyStoredStates();
            
            this.console.log('✅ [ISSUES] Sistema de problemas inicializado con', this.issues.length, 'problemas');
        }

        /**
         * Renderiza la tabla de problemas
         */
        render() {
            const tableBody = document.getElementById('issues-table-body');
            if (!tableBody) {
                this.console.error('❌ [ISSUES] Elemento issues-table-body no encontrado');
                return;
            }

            tableBody.innerHTML = this.issues.map(issue => `
                <tr data-id="${issue.id}" class="border-b border-gray-700">
                    <td class="px-4 py-2 text-white">${issue.product}</td>
                    <td class="px-4 py-2 text-white">${issue.description}</td>
                    <td class="px-4 py-2">
                        <select class="status-select w-full p-2 rounded border-0 text-white font-bold" data-status-select>
                            <option value="Open" selected>Abierto</option>
                            <option value="On going">En Progreso</option>
                            <option value="Closed">Cerrado</option>
                        </select>
                    </td>
                </tr>
            `).join('');

            this.console.log('📋 [ISSUES] Tabla de problemas renderizada');
        }

        /**
         * Inicializa estilos de estado
         */
        initializeStyles() {
            if (!document.getElementById('issues-table-body')) return;
            
            document.querySelectorAll('[data-status-select]').forEach(select => {
                this.updateStatusStyle(select);
            });
        }

        /**
         * Aplica estados guardados
         */
        applyStoredStates() {
            if (!MQS_STORAGE.issuesState) return;
            
            Object.entries(MQS_STORAGE.issuesState).forEach(([issueId, data]) => {
                const select = document.querySelector(`tr[data-id="${issueId}"] select`);
                if (select && data.status) {
                    select.value = data.status;
                    this.updateStatusStyle(select);
                }
            });
        }

        /**
         * Actualiza el estilo visual del estado
         */
        updateStatusStyle(selectElement) {
            selectElement.classList.remove('status-open', 'status-ongoing', 'status-closed');
            const statusClass = {
                'Open': 'status-open',
                'On going': 'status-ongoing', 
                'Closed': 'status-closed'
            }[selectElement.value];
            if (statusClass) selectElement.classList.add(statusClass);
        }

        /**
         * Configura eventos
         */
        setupEvents() {
            const issuesTableBody = document.getElementById('issues-table-body');
            if (issuesTableBody) {
                issuesTableBody.addEventListener('change', (e) => {
                    if (e.target.matches('[data-status-select]')) {
                        const select = e.target;
                        const issueId = select.closest('tr').dataset.id;
                        const newStatus = select.value;
                        
                        // Actualizar estilo visual
                        this.updateStatusStyle(select);
                        
                        // Guardar estado
                        if (!MQS_STORAGE.issuesState) {
                            MQS_STORAGE.issuesState = {};
                        }
                        MQS_STORAGE.issuesState[issueId] = { status: newStatus };
                        MQS_STORAGE.saveIssuesState(MQS_STORAGE.issuesState);
                        
                        this.console.log('📋 [ISSUES] Estado actualizado:', issueId, newStatus);
                    }
                });
            }

            this.console.log('📋 [ISSUES] Eventos configurados');
        }

        /**
         * Actualiza el estado de un problema
         */
        updateIssueStatus(issueId, status) {
            const issue = this.issues.find(i => i.id === issueId);
            if (issue) {
                issue.status = status;
                this.saveState();
                this.console.log('📋 [ISSUES] Estado actualizado:', issueId, status);
            }
        }

        /**
         * Guarda el estado actual
         */
        saveState() {
            const state = {};
            this.issues.forEach(issue => {
                state[issue.id] = issue;
            });
            MQS_STORAGE.saveIssuesState(state);
        }

        /**
         * Obtiene estadísticas de problemas
         */
        getStats() {
            const stats = {
                total: this.issues.length,
                pending: this.issues.filter(i => i.status === 'pending').length,
                inProgress: this.issues.filter(i => i.status === 'in-progress').length,
                completed: this.issues.filter(i => i.status === 'completed').length
            };
            
            stats.completionRate = stats.total > 0 ? (stats.completed / stats.total * 100).toFixed(1) : 0;
            
            return stats;
        }
    }

    // Crear instancia global
    window.MQS_ISSUES = new IssuesManager();
    console.log('✅ [ISSUES] Módulo de problemas cargado exitosamente');

})();
