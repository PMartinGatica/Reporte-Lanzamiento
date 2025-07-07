(function() {
    'use strict';
    
    console.log('⬆️ [SCROLL] Cargando módulo de scroll...');

    class ScrollManager {
        constructor() {
            this.console = window.console;
            this.scrollButton = null;
            this.isVisible = false;
            this.scrollThreshold = 300; // Píxeles desde arriba para mostrar el botón
            
            this.console.log('⬆️ [SCROLL] ScrollManager inicializado');
        }

        /**
         * Inicializa el gestor de scroll
         */
        initialize() {
            this.console.log('⬆️ [SCROLL] Inicializando gestor de scroll...');
            
            this.scrollButton = document.getElementById('scroll-to-top');
            
            if (!this.scrollButton) {
                this.console.warn('⚠️ [SCROLL] Botón scroll-to-top no encontrado');
                return;
            }

            this.setupEventListeners();
            this.checkScrollPosition(); // Verificar posición inicial
            
            this.console.log('✅ [SCROLL] Gestor de scroll inicializado');
        }

        /**
         * Configura los event listeners
         */
        setupEventListeners() {
            // Click en el botón
            if (this.scrollButton) {
                this.scrollButton.addEventListener('click', () => {
                    this.scrollToTop();
                });
            }

            // Scroll de la ventana
            window.addEventListener('scroll', () => {
                this.handleScroll();
            });

            // Throttle para optimizar performance
            let ticking = false;
            const handleScrollOptimized = () => {
                if (!ticking) {
                    requestAnimationFrame(() => {
                        this.checkScrollPosition();
                        ticking = false;
                    });
                    ticking = true;
                }
            };

            window.addEventListener('scroll', handleScrollOptimized, { passive: true });

            this.console.log('⬆️ [SCROLL] Event listeners configurados');
        }

        /**
         * Maneja el evento de scroll
         */
        handleScroll() {
            this.checkScrollPosition();
        }

        /**
         * Verifica la posición del scroll y muestra/oculta el botón
         */
        checkScrollPosition() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const shouldShow = scrollTop > this.scrollThreshold;

            if (shouldShow && !this.isVisible) {
                this.showButton();
            } else if (!shouldShow && this.isVisible) {
                this.hideButton();
            }
        }

        /**
         * Muestra el botón
         */
        showButton() {
            if (!this.scrollButton) return;

            this.scrollButton.classList.add('visible');
            this.isVisible = true;
            
            this.console.log('👁️ [SCROLL] Botón mostrado');
        }

        /**
         * Oculta el botón
         */
        hideButton() {
            if (!this.scrollButton) return;

            this.scrollButton.classList.remove('visible');
            this.isVisible = false;
            
            this.console.log('🙈 [SCROLL] Botón ocultado');
        }

        /**
         * Hace scroll suave hasta arriba
         */
        scrollToTop() {
            const heroSection = document.getElementById('hero');
            
            if (heroSection) {
                // Scroll suave hasta el hero
                heroSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            } else {
                // Fallback: scroll hasta arriba de la página
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            }

            // Feedback visual
            this.addClickFeedback();
            
            this.console.log('⬆️ [SCROLL] Scroll hacia arriba ejecutado');
        }

        /**
         * Agrega feedback visual al hacer click
         */
        addClickFeedback() {
            if (!this.scrollButton) return;

            // Agregar clase de feedback
            this.scrollButton.classList.add('clicked');
            
            // Remover después de la animación
            setTimeout(() => {
                if (this.scrollButton) {
                    this.scrollButton.classList.remove('clicked');
                }
            }, 200);

            // Vibración en dispositivos móviles (si está disponible)
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
        }

        /**
         * Actualiza el threshold para mostrar el botón
         */
        setScrollThreshold(newThreshold) {
            this.scrollThreshold = newThreshold;
            this.checkScrollPosition();
            this.console.log('⚙️ [SCROLL] Threshold actualizado:', newThreshold);
        }

        /**
         * Fuerza la verificación de la posición del scroll
         */
        forceCheck() {
            this.checkScrollPosition();
            this.console.log('🔄 [SCROLL] Verificación forzada de posición');
        }
    }

    // Crear instancia global
    window.MQS_SCROLL = new ScrollManager();

    // Auto-inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.MQS_SCROLL.initialize();
        });
    } else {
        window.MQS_SCROLL.initialize();
    }

    console.log('✅ [SCROLL] Módulo de scroll cargado exitosamente');

})();