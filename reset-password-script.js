/**
 * ============================================================================
 * RESET-PASSWORD-SCRIPT.JS - RESTABLECIMIENTO DE CONTRASEÑA
 * ============================================================================
 * 
 * PROPÓSITO:
 * Este archivo maneja el restablecimiento de contraseña con token
 * 
 * FUNCIONES PRINCIPALES:
 * 1. Validar el token de restablecimiento
 * 2. Validar la nueva contraseña
 * 3. Actualizar la contraseña en la base de datos
 * 4. Mostrar confirmación de éxito
 * 
 * FLUJO:
 * Usuario ingresa token + nueva contraseña → Validar → Actualizar BD → Confirmar
 * 
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('resetPasswordForm');
    const errorMessage = document.getElementById('errorMessage');
    const resetBtn = document.getElementById('resetBtn');
    const formContainer = document.getElementById('formContainer');
    const successContainer = document.getElementById('successContainer');
    
    const tokenInput = document.getElementById('token');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');

    // -------------------------------------------------------------------------
    // VALIDACIÓN DE CONTRASEÑA EN TIEMPO REAL
    // -------------------------------------------------------------------------
    newPasswordInput.addEventListener('input', function() {
        validatePasswordStrength(this.value);
    });

    function validatePasswordStrength(password) {
        const requirements = {
            length: password.length >= 8,
            digit: /[0-9]/.test(password),
            uppercase: /[A-Z]/.test(password),
            special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
        };

        updateRequirement('req-length', requirements.length);
        updateRequirement('req-digit', requirements.digit);
        updateRequirement('req-uppercase', requirements.uppercase);
        updateRequirement('req-special', requirements.special);

        return requirements.length && requirements.digit && requirements.uppercase && requirements.special;
    }

    function updateRequirement(id, isValid) {
        const element = document.getElementById(id);
        if (isValid) {
            element.classList.add('valid');
            element.classList.remove('invalid');
            element.querySelector('i').classList.remove('fa-circle');
            element.querySelector('i').classList.add('fa-check-circle');
        } else {
            element.classList.remove('valid');
            element.classList.add('invalid');
            element.querySelector('i').classList.remove('fa-check-circle');
            element.querySelector('i').classList.add('fa-circle');
        }
    }

    // -------------------------------------------------------------------------
    // EVENTO: SUBMIT DEL FORMULARIO DE RESTABLECIMIENTO
    // -------------------------------------------------------------------------
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const token = tokenInput.value.trim();
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        console.log('═══════════════════════════════════════');
        console.log('🔒 RESTABLECIMIENTO DE CONTRASEÑA');
        console.log('═══════════════════════════════════════');
        console.log('Token:', token);
        
        // Validaciones del lado del cliente
        if (!validatePasswordStrength(newPassword)) {
            showError('La contraseña no cumple con los requisitos mínimos de seguridad');
            return;
        }
        
        // Validación detallada
        if (newPassword.length < 8) {
            showError('La contraseña debe tener al menos 8 caracteres');
            return;
        }
        
        if (!/[0-9]/.test(newPassword)) {
            showError('La contraseña debe contener al menos un dígito (0-9)');
            return;
        }
        
        if (!/[A-Z]/.test(newPassword)) {
            showError('La contraseña debe contener al menos una mayúscula (A-Z)');
            return;
        }
        
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
            showError('La contraseña debe contener al menos un carácter especial');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            showError('Las contraseñas no coinciden');
            return;
        }
        
        // Ocultar mensajes previos
        hideError();
        showLoading();
        
        try {
            let success = false;
            
            // Intentar con la base de datos MySQL
            if (window.dbAPI) {
                console.log('🔄 Restableciendo contraseña desde API...');
                
                try {
                    const response = await window.dbAPI.resetPassword(token, newPassword);
                    
                    console.log('📥 Respuesta:', response);
                    
                    if (response.success) {
                        console.log('✅ Contraseña restablecida exitosamente');
                        
                        // Ocultar formulario y mostrar mensaje de éxito
                        formContainer.style.display = 'none';
                        successContainer.style.display = 'block';
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
                
                // Buscar token en localStorage
                const resetTokens = JSON.parse(localStorage.getItem('tennisClubResetTokens')) || [];
                console.log('Tokens en localStorage:', resetTokens.length);
                
                const tokenData = resetTokens.find(t => t.token === token);
                
                if (!tokenData) {
                    showError('Token inválido');
                    return;
                }
                
                if (tokenData.used) {
                    showError('Este token ya ha sido utilizado');
                    return;
                }
                
                if (Date.now() > tokenData.expiresAt) {
                    showError('El token ha expirado. Por favor, solicita uno nuevo');
                    return;
                }
                
                // Actualizar contraseña del usuario
                const existingUsers = JSON.parse(localStorage.getItem('tennisClubUsers')) || [];
                const userIndex = existingUsers.findIndex(u => u.username === tokenData.username);
                
                if (userIndex === -1) {
                    showError('Usuario no encontrado');
                    return;
                }
                
                // Función de hash del login-script.js
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
                
                // Actualizar contraseña
                existingUsers[userIndex].password = hashPassword(newPassword);
                localStorage.setItem('tennisClubUsers', JSON.stringify(existingUsers));
                
                // Marcar token como usado
                tokenData.used = true;
                localStorage.setItem('tennisClubResetTokens', JSON.stringify(resetTokens));
                
                console.log('✅ Contraseña actualizada en localStorage');
                
                // Mostrar éxito
                formContainer.style.display = 'none';
                successContainer.style.display = 'block';
                success = true;
            }
            
            console.log('═══════════════════════════════════════');
            console.log('FIN DEL RESTABLECIMIENTO');
            console.log('═══════════════════════════════════════');
            
        } catch (error) {
            console.error('❌ ERROR CRÍTICO:', error);
            showError('Error al procesar el restablecimiento. Verifica que XAMPP esté ejecutándose.');
        } finally {
            hideLoading();
        }
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

    function showLoading() {
        resetBtn.classList.add('loading');
        resetBtn.disabled = true;
        
        const btnText = resetBtn.querySelector('.btn-text');
        const btnIcon = resetBtn.querySelector('i');
        
        btnText.textContent = 'Procesando...';
        btnIcon.classList.remove('fa-arrow-right');
        btnIcon.classList.add('fa-spinner', 'fa-spin');
    }

    function hideLoading() {
        resetBtn.classList.remove('loading');
        resetBtn.disabled = false;
        
        const btnText = resetBtn.querySelector('.btn-text');
        const btnIcon = resetBtn.querySelector('i');
        
        btnText.textContent = 'Restablecer Contraseña';
        btnIcon.classList.remove('fa-spinner', 'fa-spin');
        btnIcon.classList.add('fa-arrow-right');
    }

    // Toggle password visibility
    window.togglePassword = function(inputId) {
        const passwordInput = document.getElementById(inputId);
        const toggleBtn = passwordInput.parentElement.querySelector('.toggle-password i');
        
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

    // Auto-llenar token desde URL si existe
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    if (urlToken) {
        tokenInput.value = urlToken;
    }

    // Animación de partículas flotantes
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

