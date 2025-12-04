// Inicializar usuario administrador si no existe
function initializeAdminUser() {
    const existingUsers = JSON.parse(localStorage.getItem('tennisClubUsers')) || [];
    const adminExists = existingUsers.find(u => u.username === 'admin');
    
    if (!adminExists) {
        console.log('Creating default admin user...');
        const adminUser = {
            id: 0,
            fullName: 'Administrador',
            email: 'admin@tennisclub.com',
            phone: '000-000-0000',
            username: 'admin',
            password: hashPassword('0000'),
            role: 'admin',
            createdAt: new Date().toISOString(),
            isActive: true
        };
        existingUsers.push(adminUser);
        localStorage.setItem('tennisClubUsers', JSON.stringify(existingUsers));
        console.log('✓ Admin user created successfully');
    }
}

// Función simple de hash para contraseñas
function hashPassword(password) {
    let hash = 0;
    if (password.length === 0) return hash.toString();
    
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    
    const salt = 'tennis_club_2024';
    const saltedPassword = password + salt;
    let saltedHash = 0;
    
    for (let i = 0; i < saltedPassword.length; i++) {
        const char = saltedPassword.charCodeAt(i);
        saltedHash = ((saltedHash << 5) - saltedHash) + char;
        saltedHash = saltedHash & saltedHash;
    }
    
    return Math.abs(saltedHash).toString(16);
}

// Variable global del carrito (debe estar fuera de DOMContentLoaded)
let cart = JSON.parse(localStorage.getItem('tennisClubCart')) || [];

// Alternador de navegación móvil
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar usuario administrador al cargar la página
    initializeAdminUser();
    
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Alternar menú móvil
    navToggle.addEventListener('click', function() {
        navMenu.classList.toggle('active');
        
        // Animar menú hamburguesa
        const bars = navToggle.querySelectorAll('.bar');
        bars.forEach((bar, index) => {
            if (navMenu.classList.contains('active')) {
                if (index === 0) bar.style.transform = 'rotate(-45deg) translate(-5px, 6px)';
                if (index === 1) bar.style.opacity = '0';
                if (index === 2) bar.style.transform = 'rotate(45deg) translate(-5px, -6px)';
            } else {
                bar.style.transform = 'none';
                bar.style.opacity = '1';
            }
        });
    });

    // Cerrar menú móvil al hacer clic en un enlace
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            const bars = navToggle.querySelectorAll('.bar');
            bars.forEach(bar => {
                bar.style.transform = 'none';
                bar.style.opacity = '1';
            });
        });
    });

    // Efecto de desplazamiento del encabezado
    window.addEventListener('scroll', function() {
        const header = document.querySelector('.header');
        if (window.scrollY > 100) {
            header.style.background = 'rgba(255, 255, 255, 0.98)';
            header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        } else {
            header.style.background = 'rgba(255, 255, 255, 0.95)';
            header.style.boxShadow = 'none';
        }
    });

    // Desplazamiento suave para enlaces de navegación
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            
            // Omitir desplazamiento suave para páginas externas (como admin-panel.html)
            if (targetId && !targetId.startsWith('#')) {
                // Permitir navegación normal para páginas
                return;
            }
            
            e.preventDefault();
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = targetSection.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Envío de formulario
    const contactForm = document.querySelector('.form');
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Guardar referencia al formulario
        const form = this;
        
        // Obtener datos del formulario
        const formData = new FormData(this);
        const formInputs = this.querySelectorAll('.form-input');
        
        // Validación simple
        let isValid = true;
        formInputs.forEach(input => {
            if (input.hasAttribute('required') && !input.value.trim()) {
                isValid = false;
                input.style.borderColor = '#e74c3c';
                setTimeout(() => {
                    input.style.borderColor = '#e9ecef';
                }, 3000);
            }
        });

        if (isValid) {
            // Mostrar mensaje de éxito
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            submitBtn.textContent = 'Enviando...';
            submitBtn.disabled = true;
            
            // Registrar consulta en la base de datos
            const serviceType = document.getElementById('serviceType').value;
            const messageField = this.querySelector('textarea');
            
            // Función async para guardar en BD
            const saveInquiry = async () => {
                if (serviceType) {
                    const userId = sessionStorage.getItem('tennisClubUserId');
                    const userName = sessionStorage.getItem('tennisClubUser') || 'Anónimo';
                    
                    console.log('💾 Guardando consulta en base de datos...');
                    console.log('userId:', userId);
                    console.log('serviceType:', serviceType);
                    
                    try {
                        // Guardar en la base de datos MySQL
                        if (window.dbAPI && userId) {
                            await window.dbAPI.createInquiry({
                                user_id: userId,
                                service_type: serviceType,
                                message: messageField ? messageField.value : '',
                                status: 'new'
                            });
                            console.log('✅ Consulta guardada en BD MySQL');
                        } else {
                            console.warn('⚠️ No hay userId o dbAPI no disponible, guardando en localStorage');
                            // Fallback a localStorage
                            const inquiry = {
                                service: serviceType,
                                message: messageField ? messageField.value : '',
                                user: userName,
                                timestamp: new Date().toISOString(),
                                status: 'Nueva consulta'
                            };
                            
                            const existingInquiries = JSON.parse(localStorage.getItem('tennisClubInquiries')) || [];
                            existingInquiries.push(inquiry);
                            localStorage.setItem('tennisClubInquiries', JSON.stringify(existingInquiries));
                            console.log('✅ Consulta guardada en localStorage');
                        }
                    } catch (error) {
                        console.error('❌ Error guardando consulta:', error);
                        // Fallback a localStorage en caso de error
                        const inquiry = {
                            service: serviceType,
                            message: messageField ? messageField.value : '',
                            user: userName,
                            timestamp: new Date().toISOString(),
                            status: 'Nueva consulta'
                        };
                        
                        const existingInquiries = JSON.parse(localStorage.getItem('tennisClubInquiries')) || [];
                        existingInquiries.push(inquiry);
                        localStorage.setItem('tennisClubInquiries', JSON.stringify(existingInquiries));
                    }
                }
            };
            
            // Ejecutar guardado y luego mostrar éxito
            saveInquiry().then(() => {
                setTimeout(() => {
                    submitBtn.textContent = '¡Mensaje Enviado!';
                    submitBtn.style.background = '#27ae60';
                    
                    // Restablecer formulario
                    form.reset();
                    
                    setTimeout(() => {
                        submitBtn.textContent = originalText;
                        submitBtn.disabled = false;
                        submitBtn.style.background = '';
                    }, 3000);
                }, 1500);
            });
        }
    });

    // Intersection Observer avanzado para animaciones escalonadas
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Retraso de animación escalonada
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    entry.target.classList.add('animate-in');
                }, index * 100);
            }
        });
    }, observerOptions);

    // Observar elementos para animación
    const animateElements = document.querySelectorAll('.service-card, .coach-card, .facility-card');
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // Animación de contador para estadísticas del hero
    function animateCounter(element, target, duration = 2000) {
        let start = 0;
        const increment = target / (duration / 16);
        
        function updateCounter() {
            start += increment;
            if (start < target) {
                element.textContent = Math.floor(start) + (target >= 100 ? '+' : '');
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = target + (target >= 100 ? '+' : '');
            }
        }
        
        updateCounter();
    }

    // Animar contadores cuando la sección hero es visible
    const heroObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const statNumbers = document.querySelectorAll('.stat-number');
                statNumbers.forEach(stat => {
                    const target = parseInt(stat.textContent);
                    animateCounter(stat, target);
                });
                heroObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    const heroSection = document.querySelector('.hero');
    if (heroSection) {
        heroObserver.observe(heroSection);
    }

    // Funcionalidad de modal de video (para el botón "Ver Video")
    const videoBtn = document.querySelector('.btn-secondary');
    if (videoBtn) {
        videoBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Crear modal
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                opacity: 0;
                transition: opacity 0.3s ease;
            `;
            
            const videoContainer = document.createElement('div');
            videoContainer.style.cssText = `
                position: relative;
                width: 90%;
                max-width: 800px;
                aspect-ratio: 16/9;
                background: #000;
                border-radius: 10px;
                overflow: hidden;
            `;
            
            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '×';
            closeBtn.style.cssText = `
                position: absolute;
                top: -40px;
                right: 0;
                background: none;
                border: none;
                color: white;
                font-size: 2rem;
                cursor: pointer;
                z-index: 1;
            `;
            
            const video = document.createElement('iframe');
            video.src = 'https://www.youtube.com/embed/Ks_arL3n5wU';
            video.style.cssText = `
                width: 100%;
                height: 100%;
                border: none;
            `;
            video.setAttribute('allowfullscreen', '');
            
            videoContainer.appendChild(closeBtn);
            videoContainer.appendChild(video);
            modal.appendChild(videoContainer);
            document.body.appendChild(modal);
            
            // Mostrar modal
            setTimeout(() => {
                modal.style.opacity = '1';
            }, 10);
            
            // Cerrar modal
            function closeModal() {
                modal.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(modal);
                }, 300);
            }
            
            closeBtn.addEventListener('click', closeModal);
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    closeModal();
                }
            });
            
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    closeModal();
                }
            });
        });
    }

    // Efecto parallax para la sección hero
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const heroImage = document.querySelector('.hero-image');
        
        if (heroImage && scrolled < window.innerHeight) {
            heroImage.style.transform = `translateY(${scrolled * 0.5}px)`;
        }
    });

    // Efectos hover en tarjetas de servicio
    const serviceCards = document.querySelectorAll('.service-card');
    serviceCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Carga de página mejorada con precargador
    window.addEventListener('load', function() {
        // Crear precargador
        const preloader = document.createElement('div');
        preloader.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #059669, #10b981, #34d399);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            transition: opacity 0.5s ease;
        `;
        
        const spinner = document.createElement('div');
        spinner.innerHTML = `
            <div style="
                width: 60px;
                height: 60px;
                border: 4px solid rgba(255,255,255,0.3);
                border-top: 4px solid #6ee7b7;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            "></div>
            <p style="
                color: white;
                margin-top: 20px;
                font-family: Inter, sans-serif;
                font-weight: 500;
            ">Cargando Tennis Club...</p>
        `;
        
        preloader.appendChild(spinner);
        document.body.appendChild(preloader);
        
        // Eliminar precargador después de la animación
        setTimeout(() => {
            preloader.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(preloader);
            }, 500);
        }, 1500);
    });

    // Resaltar enlace de navegación activo
    window.addEventListener('scroll', function() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link');
        
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.clientHeight;
            
            if (window.pageYOffset >= sectionTop && window.pageYOffset < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });

    // Verificar rol de usuario y mostrar/ocultar características según permisos
    const userRole = sessionStorage.getItem('tennisClubUserRole');
    const username = sessionStorage.getItem('tennisClubUser');
    
    console.log('=== VERIFICANDO ACCESO ADMIN ===');
    console.log('Nombre de usuario:', username);
    console.log('Rol de usuario:', userRole);
    
    // Verificar si el usuario es admin (por rol o nombre de usuario)
    const isAdmin = (userRole === 'admin' || username === 'admin');
    
    console.log('Es Admin:', isAdmin);
    console.log('============================');
    
    if (isAdmin) {
        const adminLink = document.getElementById('adminLink');
        if (adminLink) {
            adminLink.style.display = 'block';
            console.log('✓ Enlace de admin mostrado');
        }
    } else {
        // Ocultar características de admin para usuarios regulares
        const adminLink = document.getElementById('adminLink');
        if (adminLink) {
            adminLink.style.display = 'none';
        }
        
        // Restringir acceso a características solo para admin
        restrictUserAccess();
    }

    // Funcionalidad del carrito de compras
    // La variable cart ahora es global (definida al inicio del archivo)
    let totalPurchases = JSON.parse(localStorage.getItem('tennisClubPurchases')) || [];
    
    // Actualizar contador del carrito al cargar
    updateCartCount();
    loadCartItems().catch(err => console.error('Error cargando carrito:', err));

    // Funcionalidad de agregar al carrito
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('add-to-cart') || e.target.parentElement.classList.contains('add-to-cart')) {
            const button = e.target.classList.contains('add-to-cart') ? e.target : e.target.parentElement;
            const productId = button.getAttribute('data-product-id');
            const product = button.getAttribute('data-product');
            const price = parseFloat(button.getAttribute('data-price'));
            const name = button.getAttribute('data-name');
            const image = button.getAttribute('data-image');
            const description = button.getAttribute('data-description');
            const stock = parseInt(button.getAttribute('data-stock'));
            
            console.log('🛒 Agregando producto:', {
                productId,
                name,
                price,
                image
            });
            
            // Agregar al carrito - USAR productId (ID de la BD) como identificador único
            const existingItem = cart.find(item => String(item.productId) === String(productId));
            if (existingItem) {
                console.log('✅ Producto ya existe en carrito, aumentando cantidad');
                existingItem.quantity += 1;
            } else {
                console.log('✅ Producto nuevo, agregando al carrito');
                cart.push({
                    productId: productId,
                    product: product,
                    name: name,
                    price: price,
                    image: image,
                    description: description,
                    stock: stock,
                    quantity: 1,
                    timestamp: new Date().toISOString()
                });
            }
            
            console.log('📦 Carrito actualizado:', cart.length, 'productos únicos');
            
            // Guardar en localStorage
            localStorage.setItem('tennisClubCart', JSON.stringify(cart));
            
            // Actualizar contador del carrito
            updateCartCount();
            
            // NO registrar como compra aquí - solo se registra al hacer checkout
            console.log('✓ Producto agregado al carrito (localStorage)');
            
            // Mostrar mensaje de éxito
            showCartNotification('Producto agregado al carrito');
            
            // Actualizar texto del botón temporalmente
            const originalText = button.innerHTML;
            button.innerHTML = '<i class="fas fa-check"></i> Agregado';
            button.style.background = 'linear-gradient(135deg, #27ae60, #2ecc71)';
            
            setTimeout(() => {
                button.innerHTML = originalText;
                button.style.background = '';
            }, 2000);
        }
    });
});

// Mostrar notificación del carrito (función global)
function showCartNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #059669, #10b981);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(5, 150, 105, 0.4);
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Eliminar después de 3 segundos
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Logout functionality
function logout() {
    if (confirm('¿Está seguro que desea cerrar sesión?')) {
        sessionStorage.removeItem('tennisClubAuth');
        sessionStorage.removeItem('tennisClubUser');
        window.location.href = 'login.html';
    }
}

// Add CSS for active nav link
const style = document.createElement('style');
style.textContent = `
    .nav-link.active {
        color: var(--primary-green) !important;
        text-shadow: 0 0 8px rgba(5, 150, 105, 0.4);
    }
    
    .nav-link.active::after {
        width: 100% !important;
        box-shadow: 0 2px 12px rgba(52, 211, 153, 0.6);
    }
`;
document.head.appendChild(style);

// Cart functionality
function toggleCart() {
    const cartModal = document.getElementById('cartModal');
    cartModal.classList.toggle('active');
    if (cartModal.classList.contains('active')) {
        loadCartItems().catch(err => console.error('Error cargando carrito:', err));
    }
}

function updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    
    if (totalItems > 0) {
        cartCount.style.display = 'flex';
    } else {
        cartCount.style.display = 'none';
    }
}

async function loadCartItems() {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <p>Tu carrito está vacío</p>
            </div>
        `;
        cartTotal.textContent = '0.00';
        return;
    }
    
    // Obtener productos de la BD para sincronizar imágenes
    let productsFromDB = [];
    if (window.dbAPI) {
        try {
            productsFromDB = await window.dbAPI.getProducts();
        } catch (error) {
            console.warn('No se pudieron cargar productos de la BD:', error);
        }
    }
    
    let total = 0;
    cartItems.innerHTML = cart.map((item, index) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        // Buscar el producto en la BD para obtener imagen actualizada
        let itemImage = item.image;
        let itemName = item.name || getProductName(item.product);
        let itemDescription = item.description || '';
        
        if (!itemImage && productsFromDB.length > 0) {
            // Intentar encontrar el producto en la BD
            const productInDB = productsFromDB.find(p => 
                p.id == item.productId || 
                p.name.toLowerCase().includes(item.product.replace(/-/g, ' '))
            );
            
            if (productInDB) {
                itemImage = productInDB.image_url;
                itemName = productInDB.name;
                itemDescription = productInDB.description || '';
                
                // Actualizar el item del carrito con los nuevos datos
                item.image = productInDB.image_url;
                item.name = productInDB.name;
                item.description = productInDB.description;
                item.productId = productInDB.id;
            }
        }
        
        // Fallback a función antigua si no hay imagen
        if (!itemImage) {
            itemImage = getProductImage(item.product);
        }
        
        return `
            <div class="cart-item">
                <div class="cart-item-image">
                    <img src="${itemImage}" 
                         alt="${itemName}"
                         onerror="this.src='https://via.placeholder.com/100x100?text=Producto'"
                         style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;">
                </div>
                <div class="cart-item-info">
                    <div class="cart-item-name">${itemName}</div>
                    ${itemDescription ? `<div style="font-size: 0.85em; color: #666; margin-top: 0.25rem;">${itemDescription}</div>` : ''}
                    <div class="cart-item-price">$${item.price.toFixed(2)}</div>
                </div>
                <div class="cart-item-controls">
                    <button class="quantity-btn" onclick="updateQuantity(${index}, -1)" ${item.quantity <= 1 ? 'disabled' : ''}>
                        <i class="fas fa-minus"></i>
                    </button>
                    <span class="cart-item-quantity">${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity(${index}, 1)">
                        <i class="fas fa-plus"></i>
                    </button>
                    <button class="remove-item" onclick="removeFromCart(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    // Guardar el carrito actualizado con las imágenes sincronizadas
    localStorage.setItem('tennisClubCart', JSON.stringify(cart));
    
    cartTotal.textContent = total.toFixed(2);
}

function getProductName(productId) {
    const productNames = {
        // Nuevos productos 2024
        'polo-nike': 'Polo Nike Court Dri-FIT Victory',
        'top-adidas': 'Top Adidas Club Tennis',
        'shorts-nike': 'Shorts Nike Court Flex Ace',
        'falda-wilson': 'Falda Wilson Team 12.5"',
        'sudadera-nike': 'Sudadera Nike Heritage',
        'pantalones-adidas': 'Pantalones Adidas Barricade',
        'zapatillas-nike': 'Zapatillas Nike Court Air Zoom Vapor',
        'chaqueta-adidas': 'Chaqueta Adidas Club Track',
        'calcetines-nike': 'Calcetines Nike Elite Crew',
        'munequeras-wilson': 'Muñequeras Wilson Pro',
        'gorra-nike': 'Gorra Nike AeroBill',
        'visera-adidas': 'Visera Adidas Aeroready',
        // Legacy products (por compatibilidad)
        'camiseta-nike': 'Camiseta Nike Dri-FIT',
        'shorts-adidas': 'Shorts Adidas Court',
        'vestido-wilson': 'Vestido Wilson Tennis',
        'zapatos-nike': 'Zapatos Nike Air Zoom',
        'gorra-ua': 'Gorra Under Armour',
        'raqueta-wilson': 'Raqueta Wilson Pro Staff',
        'pelotas-wilson': 'Pelotas Wilson Pro',
        'overgrip-wilson': 'Overgrip Wilson'
    };
    return productNames[productId] || productId;
}

function getProductImage(productId) {
    const productImages = {
        // Nuevos productos 2024
        'polo-nike': 'https://images.unsplash.com/photo-1622445275463-afa2ab738c34?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
        'top-adidas': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
        'shorts-nike': 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
        'falda-wilson': 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
        'sudadera-nike': 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
        'pantalones-adidas': 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
        'zapatillas-nike': 'https://images.unsplash.com/photo-1549298916-b41d501d3772?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
        'chaqueta-adidas': 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
        'calcetines-nike': 'https://images.unsplash.com/photo-1556906781-9a412961c28c?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
        'munequeras-wilson': 'https://images.unsplash.com/photo-1593476087123-36d1de271f08?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
        'gorra-nike': 'https://images.unsplash.com/photo-1521369909029-2afed882baee?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
        'visera-adidas': 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
        // Legacy products (por compatibilidad)
        'camiseta-nike': 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
        'shorts-adidas': 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
        'vestido-wilson': 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
        'zapatos-nike': 'https://images.unsplash.com/photo-1549298916-b41d501d3772?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
        'gorra-ua': 'https://images.unsplash.com/photo-1521369909029-2afed882baee?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
        'raqueta-wilson': 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
        'pelotas-wilson': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
        'overgrip-wilson': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80'
    };
    return productImages[productId] || 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80';
}

function updateQuantity(index, change) {
    cart[index].quantity += change;
    
    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }
    
    localStorage.setItem('tennisClubCart', JSON.stringify(cart));
    updateCartCount();
    loadCartItems().catch(err => console.error('Error cargando carrito:', err));
}

function removeFromCart(index) {
    cart.splice(index, 1);
    localStorage.setItem('tennisClubCart', JSON.stringify(cart));
    updateCartCount();
    loadCartItems().catch(err => console.error('Error cargando carrito:', err));
    
    showCartNotification('Producto eliminado del carrito');
}

function clearCart() {
    if (confirm('¿Está seguro que desea vaciar el carrito?')) {
        cart = [];
        localStorage.setItem('tennisClubCart', JSON.stringify(cart));
        updateCartCount();
        loadCartItems().catch(err => console.error('Error cargando carrito:', err));
        showCartNotification('Carrito vaciado');
    }
}

async function checkout() {
    if (cart.length === 0) {
        alert('El carrito está vacío');
        return;
    }
    
    const username = sessionStorage.getItem('tennisClubUser');
    const userId = sessionStorage.getItem('tennisClubUserId');
    
    if (!username) {
        alert('Debe iniciar sesión para realizar una compra');
        window.location.href = 'login.html';
        return;
    }
    
    if (!userId) {
        console.warn('⚠️ No se encontró userId en sessionStorage. Esto puede causar problemas al guardar la compra.');
        console.warn('⚠️ Recomendación: cierre sesión y vuelva a iniciar sesión.');
    }
    
    // Record all purchases to localStorage
    cart.forEach(item => {
        const purchase = {
            product: item.product,
            price: item.price,
            quantity: item.quantity,
            user: username,
            timestamp: new Date().toISOString()
        };
        
        const existingPurchases = JSON.parse(localStorage.getItem('tennisClubPurchases')) || [];
        existingPurchases.push(purchase);
        localStorage.setItem('tennisClubPurchases', JSON.stringify(existingPurchases));
    });
    
    // Save to database if available
    if (window.dbAPI) {
        try {
            console.log('💾 Guardando compra en base de datos XAMPP...');
            
            // Get current user from database
            const users = await window.dbAPI.getUsers();
            const currentUser = users.find(u => u.username === username);
            
            if (currentUser) {
                console.log(`👤 Usuario encontrado en BD: ${currentUser.username} (ID: ${currentUser.id})`);
                
                // Get products from database to match IDs
                const products = await window.dbAPI.getProducts();
                console.log(`📦 ${products.length} productos disponibles en BD`);
                
                // Save each purchase to database
                let savedCount = 0;
                for (const item of cart) {
                    // Usar el productId si está disponible, sino buscar por nombre
                    let product = null;
                    
                    if (item.productId) {
                        // El item tiene el ID de la BD
                        product = products.find(p => p.id == item.productId);
                    }
                    
                    // Fallback: buscar por nombre si no se encontró por ID
                    if (!product) {
                        product = products.find(p => 
                            p.name.toLowerCase().includes(item.product.replace(/-/g, ' '))
                        );
                    }
                    
                    if (product) {
                        const purchaseData = {
                            user_id: currentUser.id,
                            product_id: product.id,
                            quantity: item.quantity,
                            price: item.price
                        };
                        
                        await window.dbAPI.createPurchase(purchaseData);
                        console.log(`✅ Compra guardada en BD: ${product.name} (Cant: ${item.quantity})`);
                        savedCount++;
                        
                        // Update stock in database
                        if (product.stock >= item.quantity) {
                            await window.dbAPI.updateProduct(product.id, {
                                stock: product.stock - item.quantity
                            });
                            console.log(`📊 Stock actualizado en BD: ${product.name} (${product.stock} → ${product.stock - item.quantity})`);
                        }
                    } else {
                        console.warn(`⚠️ Producto no encontrado en BD: ${item.product} (ID: ${item.productId})`);
                    }
                }
                
                console.log(`✅ Total de ${savedCount} compras guardadas en base de datos XAMPP`);
            } else {
                console.warn('⚠️ Usuario no encontrado en base de datos');
            }
        } catch (error) {
            console.error('❌ Error guardando compras en BD:', error);
            // Continue with checkout even if database fails
        }
    } else {
        console.warn('⚠️ API de base de datos no disponible');
    }
    
    // Clear cart
    cart = [];
    localStorage.setItem('tennisClubCart', JSON.stringify(cart));
    updateCartCount();
    await loadCartItems();
    
    // Close cart modal
    document.getElementById('cartModal').classList.remove('active');
    
    // Show success message
    alert('¡Compra realizada exitosamente!\n\nGracias por su compra.');
}

// Close cart modal when clicking outside
document.addEventListener('click', function(e) {
    const cartModal = document.getElementById('cartModal');
    if (e.target === cartModal) {
        cartModal.classList.remove('active');
    }
});

// Restrict user access to admin-only features
function restrictUserAccess() {
    // Prevent access to admin URLs
    const currentPath = window.location.pathname;
    const adminPaths = ['/admin-dashboard.html', '/admin-panel.html'];
    
    if (adminPaths.some(path => currentPath.includes(path))) {
        showAccessDeniedMessage();
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 3000);
    }
    
    // Add access control to admin functions
    window.addEventListener('beforeunload', function(e) {
        if (window.location.pathname.includes('admin')) {
            const userRole = sessionStorage.getItem('tennisClubUserRole');
            if (userRole !== 'admin') {
                e.preventDefault();
                e.returnValue = 'No tienes permisos para acceder a esta sección';
            }
        }
    });
}

// Show access denied message
function showAccessDeniedMessage() {
    const message = document.createElement('div');
    message.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        color: white;
        font-family: Inter, sans-serif;
    `;
    message.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
            <i class="fas fa-ban" style="font-size: 4rem; color: #e74c3c; margin-bottom: 1rem;"></i>
            <h2 style="color: #e74c3c; margin-bottom: 1rem;">Acceso Denegado</h2>
            <p style="font-size: 1.2rem; margin-bottom: 2rem;">No tienes permisos para acceder a esta sección.</p>
            <p style="color: #ccc;">Redirigiendo al inicio...</p>
        </div>
    `;
    document.body.appendChild(message);
}
