/**
 * ============================================================================
 * LOGIN-SCRIPT.JS - MANEJO DE INICIO DE SESIÓN
 * ============================================================================
 * 
 * PROPÓSITO:
 * Este archivo maneja todo el proceso de autenticación (inicio de sesión)
 * 
 * FUNCIONES PRINCIPALES:
 * 1. Validar credenciales contra la base de datos MySQL
 * 2. Crear sesión del usuario en sessionStorage
 * 3. Redirigir según el rol (admin o usuario regular)
 * 4. Manejo de errores y feedback visual
 * 
 * FLUJO:
 * Usuario ingresa credenciales → Validar en BD → Guardar sesión → Redirigir
 * 
 * ============================================================================
 */

// ============================================================================
// FUNCIÓN: INICIALIZAR USUARIO ADMIN (FALLBACK A localStorage)
// ============================================================================
// Esta función crea un usuario admin en localStorage como respaldo
// Solo se usa si la base de datos no está disponible
function initializeAdminUser() {
    // Obtener usuarios existentes de localStorage
    const existingUsers = JSON.parse(localStorage.getItem('tennisClubUsers')) || [];
    
    // Verificar si ya existe el admin
    const adminExists = existingUsers.find(u => u.username === 'admin');
    
    if (!adminExists) {
        console.log('Creating default admin user...');
        
        // Crear objeto de usuario admin con todos sus datos
        const adminUser = {
            id: 0,                                      // ID especial para admin
            fullName: 'Administrador',                  // Nombre completo
            email: 'admin@tennisclub.com',              // Email
            phone: '000-000-0000',                      // Teléfono
            username: 'admin',                          // Usuario: admin
            password: hashPassword('0000'),             // Contraseña encriptada: 0000
            role: 'admin',                              // Rol de administrador
            createdAt: new Date().toISOString(),        // Fecha de creación
            isActive: true                              // Cuenta activa
        };
        
        // Agregar a la lista de usuarios
        existingUsers.push(adminUser);
        
        // Guardar en localStorage
        localStorage.setItem('tennisClubUsers', JSON.stringify(existingUsers));
        console.log('✓ Admin user created successfully');
    }
}

// ============================================================================
// EVENTO PRINCIPAL: CUANDO EL DOM ESTÁ LISTO
// ============================================================================
// DOMContentLoaded se ejecuta cuando la página HTML termina de cargar
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar usuario admin en localStorage (fallback)
    initializeAdminUser();
    
    // Obtener referencias a los elementos HTML
    const loginForm = document.getElementById('loginForm');        // Formulario de login
    const errorMessage = document.getElementById('errorMessage'); // Mensaje de error
    const loginBtn = document.querySelector('.login-btn');         // Botón de login

    // -------------------------------------------------------------------------
    // VERIFICAR SI EL USUARIO YA ESTÁ LOGUEADO
    // -------------------------------------------------------------------------
    // Si el usuario ya tiene una sesión activa, redirigir directamente
    if (sessionStorage.getItem('tennisClubAuth') === 'true') {
        redirectToMain();
    }

    // -------------------------------------------------------------------------
    // EVENTO: SUBMIT DEL FORMULARIO DE LOGIN
    // -------------------------------------------------------------------------
    // Este evento se dispara cuando el usuario hace clic en "Iniciar Sesión"
    loginForm.addEventListener('submit', async function(e) {
        // Prevenir que el formulario recargue la página
        e.preventDefault();
        
        // Obtener y limpiar los valores ingresados por el usuario
        const username = document.getElementById('username').value.trim();  // Remover espacios
        const password = document.getElementById('password').value;
        
        console.log('═══════════════════════════════════════');
        console.log('🚀 INICIO DEL PROCESO DE LOGIN');
        console.log('═══════════════════════════════════════');
        console.log('👤 Usuario:', username);
        console.log('🔒 Contraseña:', password);
        console.log('');
        
        // Hide previous error messages
        hideError();
        showLoading();
        
        try {
            // =========================================================================
            // PROCESO DE AUTENTICACIÓN
            // =========================================================================
            // Este proceso intenta autenticar al usuario en dos pasos:
            // 1. PRIMERO: Intentar autenticar contra la base de datos MySQL
            // 2. FALLBACK: Si falla, intentar con localStorage (modo offline)
            
            // Variables para almacenar el resultado de la autenticación
            let user = null;              // Objeto con datos del usuario autenticado
            let isAdmin = false;          // Si el usuario es administrador
            let authSuccess = false;      // Si la autenticación fue exitosa
            
            console.log('📍 PASO 1: Verificar window.dbAPI');
            console.log('window.dbAPI existe:', !!window.dbAPI);
            
            // -------------------------------------------------------------------------
            // PASO 1: AUTENTICACIÓN CON BASE DE DATOS MYSQL
            // -------------------------------------------------------------------------
            if (window.dbAPI) {
                try {
                    console.log('');
                    console.log('📍 PASO 2: Llamar a API');
                    console.log('🔄 Verificando en base de datos MySQL...');
                    
                    // Llamar a la API de autenticación (api/auth.php)
                    // Esta API verifica username y password contra la tabla users
                    const response = await window.dbAPI.login(username, password);
                    
                    console.log('');
                    console.log('📍 PASO 3: Respuesta de la API');
                    console.log('📥 Respuesta completa:', response);
                    console.log('response.success:', response.success);
                    console.log('response.error:', response.error);
                    console.log('response.user:', response.user);
                    
                    if (response.success) {
                        console.log('');
                        console.log('✅ response.success === true');
                        user = response.user;
                        isAdmin = user.role === 'admin';
                        authSuccess = true;
                        console.log('user asignado:', user);
                        console.log('isAdmin:', isAdmin);
                        console.log('authSuccess:', authSuccess);
                    } else if (response.error) {
                        console.log('');
                        console.log('❌ response.error encontrado');
                        console.log('Error:', response.error);
                        authSuccess = false;
                        console.log('authSuccess:', authSuccess);
                    } else {
                        console.log('');
                        console.log('⚠️ Respuesta sin success ni error');
                        authSuccess = false;
                    }
                } catch (dbError) {
                    console.log('');
                    console.log('❌ Error en petición a BD');
                    console.log('⚠️ Error:', dbError);
                    console.log('Intentando localStorage como fallback...');
                }
            } else {
                console.log('❌ window.dbAPI NO está disponible');
            }
            
            // Fallback a localStorage si no funcionó la BD
            console.log('');
            console.log('📍 PASO 4: Verificar localStorage (fallback)');
            console.log('authSuccess actual:', authSuccess);
            
            if (!authSuccess) {
                console.log('🔄 Verificando en localStorage...');
                const existingUsers = JSON.parse(localStorage.getItem('tennisClubUsers')) || [];
                console.log('Usuarios en localStorage:', existingUsers.length);
                const localUser = existingUsers.find(u => u.username === username && u.password === hashPassword(password));
                
                if (localUser) {
                    console.log('✅ Usuario encontrado en localStorage');
                    user = localUser;
                    isAdmin = (username === 'admin' && password === '0000') || (localUser.role === 'admin');
                    authSuccess = true;
                    console.log('authSuccess actualizado:', authSuccess);
                } else {
                    console.log('❌ Usuario NO encontrado en localStorage');
                }
            } else {
                console.log('✅ authSuccess = true, saltando localStorage');
            }
            
            console.log('');
            console.log('📍 PASO 5: Evaluación final');
            console.log('authSuccess:', authSuccess);
            console.log('user:', user);
            console.log('Condición (authSuccess && user):', (authSuccess && user));
            
            if (authSuccess && user) {
                console.log('');
                console.log('✅✅✅ AUTENTICACIÓN EXITOSA ✅✅✅');
                console.log('');
                console.log('📍 PASO 6: Guardar en sessionStorage');
                
                // Store authentication state
                sessionStorage.setItem('tennisClubAuth', 'true');
                sessionStorage.setItem('tennisClubUser', username);
                sessionStorage.setItem('tennisClubUserId', user.id); // ✅ Guardar ID del usuario
                sessionStorage.setItem('tennisClubUserRole', isAdmin ? 'admin' : 'user');
                
                console.log('✅ sessionStorage guardado');
                console.log('tennisClubAuth:', sessionStorage.getItem('tennisClubAuth'));
                console.log('tennisClubUser:', sessionStorage.getItem('tennisClubUser'));
                console.log('tennisClubUserId:', sessionStorage.getItem('tennisClubUserId'));
                console.log('tennisClubUserRole:', sessionStorage.getItem('tennisClubUserRole'));
                
                // Show success animation
                console.log('');
                console.log('📍 PASO 7: Mostrar animación de éxito');
                showSuccess();
                
                console.log('✅ Login exitoso - Rol:', isAdmin ? 'admin' : 'user');
                
                // Redirect after success animation
                console.log('');
                console.log('📍 PASO 8: Redirección programada');
                console.log('Redirigiendo a index.html en 1.5 segundos...');
                setTimeout(() => {
                    console.log('🚀 Ejecutando redirección...');
                    redirectToMain();
                }, 1500);
            } else {
                console.log('');
                console.log('❌❌❌ AUTENTICACIÓN FALLIDA ❌❌❌');
                console.log('');
                console.log('Razón del fallo:');
                console.log('- authSuccess:', authSuccess);
                console.log('- user:', user);
                
                // Show error message
                console.log('Mostrando mensaje de error al usuario...');
                loginBtn.classList.remove('loading');
                loginBtn.disabled = false;
                const btnText = loginBtn.querySelector('.btn-text');
                const btnIcon = loginBtn.querySelector('i');
                btnText.textContent = 'Iniciar Sesión';
                btnIcon.classList.remove('fa-spinner');
                btnIcon.classList.add('fa-arrow-right');
                
                showError('Usuario o contraseña incorrectos');
                
                // Clear password field
                document.getElementById('password').value = '';
                
                // Shake animation for the card
                const loginCard = document.querySelector('.login-card');
                loginCard.style.animation = 'shake 0.5s ease-in-out';
                setTimeout(() => {
                    loginCard.style.animation = '';
                }, 500);
            }
            
            console.log('═══════════════════════════════════════');
            console.log('FIN DEL PROCESO DE LOGIN');
            console.log('═══════════════════════════════════════');
            
        } catch (error) {
            console.error('');
            console.error('❌❌❌ ERROR CRÍTICO EN EL PROCESO ❌❌❌');
            console.error('Error:', error);
            console.error('Stack:', error.stack);
            loginBtn.classList.remove('loading');
            loginBtn.disabled = false;
            showError('Error al intentar iniciar sesión. Verifica que XAMPP esté ejecutándose.');
        }
    });

    // Toggle password visibility
    window.togglePassword = function() {
        const passwordInput = document.getElementById('password');
        const toggleBtn = document.querySelector('.toggle-password i');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleBtn.classList.remove('fa-eye');
            toggleBtn.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            toggleBtn.classList.remove('fa-eye-slash');
            toggleBtn.classList.add('fa-eye');
        }
    };

    // Show error message
    function showError(message) {
        errorMessage.querySelector('span').textContent = message;
        errorMessage.style.display = 'flex';
        errorMessage.style.animation = 'shake 0.5s ease-in-out';
    }

    // Hide error message
    function hideError() {
        errorMessage.style.display = 'none';
    }

    // Show loading state
    function showLoading() {
        loginBtn.classList.add('loading');
        loginBtn.disabled = true;
        
        const btnText = loginBtn.querySelector('.btn-text');
        const btnIcon = loginBtn.querySelector('i');
        
        btnText.textContent = 'Verificando...';
        btnIcon.classList.remove('fa-arrow-right');
        btnIcon.classList.add('fa-spinner');
    }

    // Show success state
    function showSuccess() {
        loginBtn.classList.remove('loading');
        loginBtn.style.background = 'linear-gradient(135deg, #27ae60, #2ecc71)';
        
        const btnText = loginBtn.querySelector('.btn-text');
        const btnIcon = loginBtn.querySelector('i');
        
        btnText.textContent = '¡Acceso Concedido!';
        btnIcon.classList.remove('fa-spinner');
        btnIcon.classList.add('fa-check');
        
        // Add success checkmark animation
        const loginCard = document.querySelector('.login-card');
        const checkmark = document.createElement('div');
        checkmark.innerHTML = `
            <svg class="success-checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                <circle class="success-checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
                <path class="success-checkmark__check" fill="none" d="m14.1 27.2l7.1 7.2 16.7-16.8"/>
            </svg>
        `;
        checkmark.style.position = 'absolute';
        checkmark.style.top = '50%';
        checkmark.style.left = '50%';
        checkmark.style.transform = 'translate(-50%, -50%)';
        checkmark.style.zIndex = '1000';
        
        loginCard.style.position = 'relative';
        loginCard.appendChild(checkmark);
    }

    // Redirect to main page
    function redirectToMain() {
        window.location.href = 'index.html';
    }

    // Input animations
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.style.transform = 'scale(1.02)';
            this.parentElement.style.transition = 'transform 0.2s ease';
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.style.transform = 'scale(1)';
        });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Enter key to submit
        if (e.key === 'Enter' && !loginBtn.disabled) {
            loginForm.dispatchEvent(new Event('submit'));
        }
        
        // Escape key to clear form
        if (e.key === 'Escape') {
            document.getElementById('username').value = '';
            document.getElementById('password').value = '';
            hideError();
        }
    });

    // DESHABILITADO TEMPORALMENTE PARA DEBUGGING
    // Prevent right-click context menu for security
    // document.addEventListener('contextmenu', function(e) {
    //     e.preventDefault();
    // });

    // Prevent F12 and other dev tools shortcuts
    // document.addEventListener('keydown', function(e) {
    //     if (e.key === 'F12' || 
    //         (e.ctrlKey && e.shiftKey && e.key === 'I') ||
    //         (e.ctrlKey && e.shiftKey && e.key === 'C') ||
    //         (e.ctrlKey && e.key === 'U')) {
    //         e.preventDefault();
    //     }
    // });

    // Add floating particles animation
    createFloatingParticles();

    function createFloatingParticles() {
        const particlesContainer = document.createElement('div');
        particlesContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 2;
        `;
        
        document.querySelector('.login-background').appendChild(particlesContainer);
        
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: absolute;
                width: 4px;
                height: 4px;
                background: rgba(255, 255, 255, 0.6);
                border-radius: 50%;
                animation: float ${3 + Math.random() * 4}s ease-in-out infinite;
                animation-delay: ${Math.random() * 2}s;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
            `;
            particlesContainer.appendChild(particle);
        }
    }

    // Add CSS for floating animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes float {
            0%, 100% {
                transform: translateY(0px) rotate(0deg);
                opacity: 0.6;
            }
            50% {
                transform: translateY(-20px) rotate(180deg);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
});

// Simple password hashing function (in production, use a proper library like bcrypt)
function hashPassword(password) {
    let hash = 0;
    if (password.length === 0) return hash.toString();
    
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Add salt and additional security
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

