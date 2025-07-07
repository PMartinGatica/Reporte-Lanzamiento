(function() {
    'use strict';
    
    console.log('🎯 [OBJECTIVES] Cargando módulo de objetivos...');

    class ObjectivesManager {
        constructor() {
            this.console = window.console;
            this.objectives = [];
            this.nextId = 1;
            
            this.console.log('🎯 [OBJECTIVES] ObjectivesManager inicializado');
        }

        /**
         * Inicializa el gestor de objetivos
         */
        initialize() {
            this.console.log('🎯 [OBJECTIVES] Inicializando gestor de objetivos...');
            
            this.loadObjectives();
            this.setupEventListeners();
            this.syncWithModelFilter();
            this.renderObjectives();
            this.updateStatistics();
            
            this.console.log('✅ [OBJECTIVES] Gestor de objetivos inicializado');
        }

        /**
         * Configura los event listeners
         */
        setupEventListeners() {
            const addBtn = document.getElementById('add-objective-btn');
            const modal = document.getElementById('objective-modal');
            const form = document.getElementById('objective-form');
            const cancelBtn = document.getElementById('cancel-objective-btn');

            if (addBtn) {
                addBtn.addEventListener('click', () => this.showModal());
            }

            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => this.hideModal());
            }

            if (form) {
                form.addEventListener('submit', (e) => this.handleSubmit(e));
            }

            // Cerrar modal al hacer click fuera
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) this.hideModal();
                });
            }

            // Evento ESC para cerrar modal
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') this.hideModal();
            });

            this.console.log('🎯 [OBJECTIVES] Event listeners configurados');
        }

        /**
         * Muestra el modal para agregar/editar objetivo
         */
        showModal(objective = null) {
            const modal = document.getElementById('objective-modal');
            const modalTitle = document.getElementById('modal-title');
            const form = document.getElementById('objective-form');

            if (!modal || !modalTitle || !form) return;

            if (objective) {
                modalTitle.textContent = 'Editar Objetivo';
                this.populateForm(objective);
            } else {
                modalTitle.textContent = 'Agregar Nuevo Objetivo';
                form.reset();
                document.getElementById('objective-id').value = '';
            }

            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';

            this.console.log('🎯 [OBJECTIVES] Modal mostrado:', objective ? 'editar' : 'agregar');
        }

        /**
         * Oculta el modal
         */
        hideModal() {
            const modal = document.getElementById('objective-modal');
            if (modal) {
                modal.classList.add('hidden');
                document.body.style.overflow = '';
            }

            this.console.log('🎯 [OBJECTIVES] Modal ocultado');
        }

        /**
         * Pobla el formulario con datos del objetivo
         */
        populateForm(objective) {
            document.getElementById('objective-id').value = objective.id;
            document.getElementById('objective-product').value = objective.product;
            document.getElementById('objective-description').value = objective.description;
            document.getElementById('objective-status').value = objective.status;
            document.getElementById('objective-priority').value = objective.priority;
        }

        /**
         * Maneja el envío del formulario
         */
        handleSubmit(e) {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const objectiveData = {
                id: formData.get('id') || this.generateId(),
                product: formData.get('product').trim(),
                description: formData.get('description').trim(),
                status: formData.get('status'),
                priority: formData.get('priority'),
                createdAt: formData.get('id') ? 
                    this.objectives.find(obj => obj.id == formData.get('id'))?.createdAt : 
                    new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            if (formData.get('id')) {
                this.updateObjective(objectiveData);
            } else {
                this.addObjective(objectiveData);
            }

            this.hideModal();
        }

        /**
         * Agrega un nuevo objetivo
         */
        addObjective(objective) {
            this.objectives.push(objective);
            this.saveObjectives();
            this.renderObjectives();
            this.updateStatistics();
            
            this.console.log('✅ [OBJECTIVES] Objetivo agregado:', objective);
        }

        /**
         * Actualiza un objetivo existente
         */
        updateObjective(updatedObjective) {
            const index = this.objectives.findIndex(obj => obj.id == updatedObjective.id);
            if (index !== -1) {
                this.objectives[index] = updatedObjective;
                this.saveObjectives();
                this.renderObjectives();
                this.updateStatistics();
                
                this.console.log('✅ [OBJECTIVES] Objetivo actualizado:', updatedObjective);
            }
        }

        /**
         * Elimina un objetivo
         */
        deleteObjective(objectiveId) {
            if (!confirm('¿Estás seguro de que deseas eliminar este objetivo?')) return;

            this.objectives = this.objectives.filter(obj => obj.id != objectiveId);
            this.saveObjectives();
            this.renderObjectives();
            this.updateStatistics();
            
            this.console.log('🗑️ [OBJECTIVES] Objetivo eliminado:', objectiveId);
        }

        /**
         * Renderiza la tabla de objetivos
         */
        renderObjectives() {
            const tbody = document.getElementById('objectives-table-body');
            const noObjectivesMessage = document.getElementById('no-objectives-message');
            const objectivesCount = document.getElementById('objectives-count');

            if (!tbody) {
                this.console.warn('⚠️ [OBJECTIVES] Elemento tbody no encontrado');
                return;
            }

            if (this.objectives.length === 0) {
                tbody.innerHTML = '';
                if (noObjectivesMessage) noObjectivesMessage.classList.remove('hidden');
                if (objectivesCount) objectivesCount.textContent = '0';
                return;
            }

            if (noObjectivesMessage) noObjectivesMessage.classList.add('hidden');
            if (objectivesCount) objectivesCount.textContent = this.objectives.length;

            tbody.innerHTML = this.objectives.map(objective => this.createObjectiveRow(objective)).join('');

            this.console.log('🎯 [OBJECTIVES] Objetivos renderizados:', this.objectives.length);
        }

        /**
         * Crea una fila de objetivo
         */
        createObjectiveRow(objective) {
            return `
                <tr class="bg-gray-800 hover:bg-gray-750 transition-colors">
                    <td class="px-6 py-4">
                        <div class="flex items-center space-x-3">
                            <div class="bg-indigo-100 text-indigo-800 p-2 rounded-lg">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                                </svg>
                            </div>
                            <div>
                                <p class="text-white font-medium">${objective.product}</p>
                                <p class="text-gray-400 text-xs">${new Date(objective.createdAt).toLocaleDateString('es-ES')}</p>
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-4">
                        <p class="text-gray-300 leading-relaxed">${objective.description}</p>
                    </td>
                    <td class="px-6 py-4">
                        <select class="status-select bg-gray-700 text-white px-3 py-1 rounded-lg text-xs border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                                data-objective-id="${objective.id}" 
                                onchange="window.MQS_OBJECTIVES.updateStatus('${objective.id}', this.value)">
                            <option value="abierto" ${objective.status === 'abierto' ? 'selected' : ''}>📋 Abierto</option>
                            <option value="en-progreso" ${objective.status === 'en-progreso' ? 'selected' : ''}>🔄 En Progreso</option>
                            <option value="completado" ${objective.status === 'completado' ? 'selected' : ''}>✅ Completado</option>
                        </select>
                    </td>
                    <td class="px-6 py-4">
                        <select class="priority-select bg-gray-700 text-white px-3 py-1 rounded-lg text-xs border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                                data-objective-id="${objective.id}" 
                                onchange="window.MQS_OBJECTIVES.updatePriority('${objective.id}', this.value)">
                            <option value="baja" ${objective.priority === 'baja' ? 'selected' : ''}>🟢 Baja</option>
                            <option value="media" ${objective.priority === 'media' ? 'selected' : ''}>🟡 Media</option>
                            <option value="alta" ${objective.priority === 'alta' ? 'selected' : ''}>🟠 Alta</option>
                            <option value="critica" ${objective.priority === 'critica' ? 'selected' : ''}>🔴 Crítica</option>
                        </select>
                    </td>
                </tr>
            `;
        }

        /**
         * Actualiza el estado de un objetivo
         */
        updateStatus(objectiveId, newStatus) {
            const objective = this.objectives.find(obj => obj.id === objectiveId);
            if (objective) {
                objective.status = newStatus;
                objective.updatedAt = new Date().toISOString();
                this.saveObjectives(); // Esta línea ya guarda en localStorage
                this.updateStatistics();
                this.console.log('🔄 [OBJECTIVES] Estado actualizado:', objectiveId, 'Nuevo estado:', newStatus);
            }
        }

        /**
         * Actualiza la prioridad de un objetivo
         */
        updatePriority(objectiveId, newPriority) {
            const objective = this.objectives.find(obj => obj.id === objectiveId);
            if (objective) {
                objective.priority = newPriority;
                objective.updatedAt = new Date().toISOString();
                this.saveObjectives(); // Esta línea ya guarda en localStorage
                this.console.log('🔄 [OBJECTIVES] Prioridad actualizada:', objectiveId, 'Nueva prioridad:', newPriority);
            }
        }

        /**
         * Actualiza las estadísticas
         */
        updateStatistics() {
            const stats = {
                total: this.objectives.length,
                pending: this.objectives.filter(obj => obj.status === 'abierto').length,
                progress: this.objectives.filter(obj => obj.status === 'en-progreso').length,
                completed: this.objectives.filter(obj => obj.status === 'completado').length
            };

            const totalElement = document.getElementById('total-objectives');
            const pendingElement = document.getElementById('pending-objectives');
            const progressElement = document.getElementById('progress-objectives');
            const completedElement = document.getElementById('completed-objectives');

            if (totalElement) totalElement.textContent = stats.total;
            if (pendingElement) pendingElement.textContent = stats.pending;
            if (progressElement) progressElement.textContent = stats.progress;
            if (completedElement) completedElement.textContent = stats.completed;

            this.console.log('📊 [OBJECTIVES] Estadísticas actualizadas:', stats);
        }

        /**
         * Sincroniza objetivos cuando cambia el modelo seleccionado
         */
        syncWithModelFilter() {
            const modelFilter = document.getElementById('model-filter');
            if (modelFilter) {
                modelFilter.addEventListener('change', (e) => {
                    const selectedModel = e.target.value;
                    if (selectedModel) {
                        // Actualizar todos los objetivos existentes al nuevo modelo
                        this.objectives.forEach(objective => {
                            objective.product = selectedModel;
                            objective.updatedAt = new Date().toISOString();
                        });
                        
                        this.saveObjectives();
                        this.renderObjectives();
                        this.console.log('🔄 [OBJECTIVES] Objetivos sincronizados con modelo:', selectedModel);
                    }
                });
            }
        }

        /**
         * Genera un ID único
         */
        generateId() {
            return Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }

        /**
         * Guarda los objetivos en localStorage
         */
        saveObjectives() {
            try {
                localStorage.setItem('mqs_objectives', JSON.stringify(this.objectives));
                this.console.log('💾 [OBJECTIVES] Objetivos guardados en localStorage');
            } catch (error) {
                this.console.error('❌ [OBJECTIVES] Error al guardar objetivos:', error);
            }
        }

        /**
         * Carga los objetivos desde localStorage
         */
        loadObjectives() {
            try {
                const saved = localStorage.getItem('mqs_objectives');
                if (saved) {
                    this.objectives = JSON.parse(saved);
                    this.console.log('📂 [OBJECTIVES] Objetivos cargados:', this.objectives.length);
                } else {
                    this.createSampleObjectives();
                }
            } catch (error) {
                this.console.error('❌ [OBJECTIVES] Error al cargar objetivos:', error);
                this.createSampleObjectives();
            }
        }

        /**
         * Crea objetivos de ejemplo con los datos reales del proyecto
         */
        createSampleObjectives() {
            // Obtener el modelo seleccionado del filtro
            const modelFilter = document.getElementById('model-filter');
            const selectedModel = modelFilter ? modelFilter.value : 'Explorer';
            const modelToUse = selectedModel || 'Explorer';

            this.objectives = [
                {
                    id: this.generateId(),
                    product: modelToUse,
                    description: 'IQC. Cosmético/Funcional.',
                    status: 'en-progreso',
                    priority: 'alta',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    product: modelToUse,
                    description: 'CQA1 – 2K',
                    status: 'abierto',
                    priority: 'critica',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    product: modelToUse,
                    description: 'CQA2 – 2K',
                    status: 'abierto',
                    priority: 'critica',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    product: modelToUse,
                    description: 'ORT: 3 muestras con CFC.',
                    status: 'en-progreso',
                    priority: 'alta',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    product: modelToUse,
                    description: 'RUN IN: 24hs, 2K.',
                    status: 'abierto',
                    priority: 'alta',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    product: modelToUse,
                    description: 'BO SW',
                    status: 'completado',
                    priority: 'media',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    product: modelToUse,
                    description: 'BO PACKING',
                    status: 'en-progreso',
                    priority: 'media',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    product: modelToUse,
                    description: 'Instructivo CQA1 y CQA2.',
                    status: 'abierto',
                    priority: 'media',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    product: modelToUse,
                    description: 'PSO Videos',
                    status: 'abierto',
                    priority: 'baja',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    product: modelToUse,
                    description: 'AMFE BE',
                    status: 'en-progreso',
                    priority: 'alta',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    product: modelToUse,
                    description: 'AMFE CFC',
                    status: 'abierto',
                    priority: 'alta',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    product: modelToUse,
                    description: 'Reporte pisadas de prensas',
                    status: 'completado',
                    priority: 'media',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    product: modelToUse,
                    description: 'R&R',
                    status: 'en-progreso',
                    priority: 'media',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    product: modelToUse,
                    description: 'ALT: 17 muestras (destructivo). Prioridad.',
                    status: 'abierto',
                    priority: 'critica',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    product: modelToUse,
                    description: 'ISTA (packing). Prioridad.',
                    status: 'abierto',
                    priority: 'critica',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    product: modelToUse,
                    description: 'PSA activation check: 10 teléfonos. Battery cover, camera deco y Batería.',
                    status: 'abierto',
                    priority: 'alta',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    product: modelToUse,
                    description: '200G: 200 Unidades no destructivo.',
                    status: 'en-progreso',
                    priority: 'media',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    product: modelToUse,
                    description: 'CPK Assembly',
                    status: 'abierto',
                    priority: 'alta',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ];

            this.saveObjectives();
            this.console.log('📝 [OBJECTIVES] Objetivos reales creados para modelo:', modelToUse, 'Total:', this.objectives.length);
        }

        /**
         * Limpia todos los objetivos guardados
         */
        clearAllObjectives() {
            this.objectives = [];
            localStorage.removeItem('mqs_objectives');
            this.renderObjectives();
            this.updateStatistics();
            this.console.log('🗑️ [OBJECTIVES] Todos los objetivos eliminados');
        }

        /**
         * Forza la recreación de objetivos (para desarrollo/testing)
         */
        forceRecreateObjectives() {
            this.objectives = [];
            this.createSampleObjectives();
            this.renderObjectives();
            this.updateStatistics();
            this.console.log('🔄 [OBJECTIVES] Objetivos recreados forzadamente');
        }
    }

    // Crear instancia global
    window.MQS_OBJECTIVES = new ObjectivesManager();

    // Auto-inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // COMENTAR ESTA LÍNEA PARA NO BORRAR LOS DATOS
            // window.MQS_OBJECTIVES.clearAllObjectives();
            window.MQS_OBJECTIVES.initialize();
        });
    } else {
        // COMENTAR ESTA LÍNEA PARA NO BORRAR LOS DATOS
        // window.MQS_OBJECTIVES.clearAllObjectives();
        window.MQS_OBJECTIVES.initialize();
    }

    console.log('✅ [OBJECTIVES] Módulo de objetivos cargado exitosamente');

})();