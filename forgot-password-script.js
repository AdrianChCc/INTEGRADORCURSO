/**
 * ============================================================================
 * FORGOT-PASSWORD-SCRIPT.JS - SOLICITUD DE RESTABLECIMIENTO DE CONTRASEÑA
 * ============================================================================
 * 
 * PROPÓSITO:
 * Este archivo maneja la solicitud de restablecimiento de contraseña
 * 
 * FUNCIONES PRINCIPALES:
 * 1. Validar que el usuario/email existe
 * 2. Generar token de restablecimiento
 * 3. Mostrar el token al usuario
 * 4. Permitir copiar el token al portapapeles
 * 
 * FLUJO:
 * Usuario ingresa username/email → Validar → Generar token → Mostrar token
 * 
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('forgotPasswordForm');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    const requestBtn = document.getElementById('requestBtn');
    const copyBtn = document.getElementById('copyBtn');
    const tokenDisplay = document.getElementById('tokenDisplay');

    // -------------------------------------------------------------------------
    // EVENTO: SUBMIT DEL FORMULARIO DE SOLICITUD
    // -------------------------------------------------------------------------
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const identifier = document.getElementById('identifier').value.trim();
        
        console.log('═══════════════════════════════════════');
        console.log('🔑 SOLICITUD DE RESTABLECIMIENTO DE CONTRASEÑA');
        console.log('═══════════════════════════════════════');
        console.log('Identificador:', identifier);
        
        // Ocultar mensajes previos
        hideError();
        hideSuccess();
        showLoading();
        
        try {
            let success = false;
            
            // Intentar con la base de datos MySQL
            if (window.dbAPI) {
                console.log('🔄 Solicitando token desde API...');
                
                try {
                    const response = await window.dbAPI.requestPasswordReset(identifier);
                    
                    console.log('📥 Respuesta:', response);
                    
                    if (response.success) {
                        console.log('✅ Token generado exitosamente');
                        console.log('Token recibido:', response.token);
                        
                        // Mostrar el token al usuario
                        tokenDisplay.textContent = response.token;
                        console.log('Token asignado a elemento:', tokenDisplay.textContent);
                        console.log('Elemento tokenDisplay:', tokenDisplay);
                        console.log('Elemento successMessage:', successMessage);
                        
                        showSuccess();
                        console.log('showSuccess() ejecutado');
                        console.log('successMessage display:', successMessage.style.display);
                        
                        // Ocultar el formulario
                        form.style.display = 'none';
                        success = true;
                        
                    } else if (response.error) {
                        console.log('❌ Error:', response.error);
                        showError(response.error);
                    }
                } catch (apiError) {
                    console.log('❌ Error en la API:', apiError);
                    console.log('⚠️ Intentando modo local...');
                }
            }
            
            // MODO LOCAL (si no hay BD disponible)
            if (!success && !window.dbAPI) {
                console.log('📍 Usando modo LOCAL (sin base de datos)');
                
                // Buscar en localStorage
                const existingUsers = JSON.parse(localStorage.getItem('tennisClubUsers')) || [];
                console.log('Usuarios en localStorage:', existingUsers.length);
                
                const localUser = existingUsers.find(u => 
                    u.username === identifier || u.email === identifier
                );
                
                if (localUser) {
                    console.log('✅ Usuario encontrado en localStorage:', localUser.username);
                    
                    // Generar token local
                    const token = generateLocalToken();
                    
                    // Guardar token en localStorage
                    const resetTokens = JSON.parse(localStorage.getItem('tennisClubResetTokens')) || [];
                    resetTokens.push({
                        token: token,
                        username: localUser.username,
                        expiresAt: Date.now() + (60 * 60 * 1000), // 1 hora
                        used: false
                    });
                    localStorage.setItem('tennisClubResetTokens', JSON.stringify(resetTokens));
                    
                    // Mostrar el token
                    tokenDisplay.textContent = token;
                    showSuccess();
                    form.style.display = 'none';
                    success = true;
                    
                } else {
                    console.log('❌ Usuario NO encontrado en localStorage');
                    showError('No se encontró ningún usuario con ese nombre de usuario o email');
                }
            }
            
            console.log('═══════════════════════════════════════');
            console.log('FIN DE LA SOLICITUD');
            console.log('═══════════════════════════════════════');
            
        } catch (error) {
            console.error('❌ ERROR CRÍTICO:', error);
            showError('Error al procesar la solicitud. Verifica que XAMPP esté ejecutándose.');
        } finally {
            hideLoading();
        }
    });

    // -------------------------------------------------------------------------
    // EVENTO: COPIAR TOKEN AL PORTAPAPELES
    // -------------------------------------------------------------------------
    copyBtn.addEventListener('click', function() {
        const token = tokenDisplay.textContent;
        
        // Copiar al portapapeles
        navigator.clipboard.writeText(token).then(function() {
            console.log('✅ Token copiado al portapapeles');
            
            // Cambiar el texto del botón temporalmente
            const originalHTML = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fas fa-check"></i> ¡Copiado!';
            copyBtn.classList.add('copied');
            
            setTimeout(function() {
                copyBtn.innerHTML = originalHTML;
                copyBtn.classList.remove('copied');
            }, 2000);
        }).catch(function(err) {
            console.error('❌ Error al copiar:', err);
            showError('No se pudo copiar el token');
        });
    });

    // -------------------------------------------------------------------------
    // FUNCIONES AUXILIARES
    // -------------------------------------------------------------------------

    function showError(message) {
        errorMessage.querySelector('span').textContent = message;
        errorMessage.style.display = 'flex';
        errorMessage.style.animation = 'shake 0.5s ease-in-out';
    }

    function hideError() {
        errorMessage.style.display = 'none';
    }

    function showSuccess() {
        successMessage.style.display = 'flex';
        successMessage.style.animation = 'slideInUp 0.5s ease-in-out';
    }

    function hideSuccess() {
        successMessage.style.display = 'none';
    }

    function showLoading() {
        requestBtn.classList.add('loading');
        requestBtn.disabled = true;
        
        const btnText = requestBtn.querySelector('.btn-text');
        const btnIcon = requestBtn.querySelector('i');
        
        btnText.textContent = 'Procesando...';
        btnIcon.classList.remove('fa-arrow-right');
        btnIcon.classList.add('fa-spinner', 'fa-spin');
    }

    function hideLoading() {
        requestBtn.classList.remove('loading');
        requestBtn.disabled = false;
        
        const btnText = requestBtn.querySelector('.btn-text');
        const btnIcon = requestBtn.querySelector('i');
        
        btnText.textContent = 'Solicitar Token';
        btnIcon.classList.remove('fa-spinner', 'fa-spin');
        btnIcon.classList.add('fa-arrow-right');
    }

    // Animación de partículas flotantes (igual que en login)
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

    // Añadir CSS para animación float
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

// Función para generar token local
function generateLocalToken() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 64; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
}

