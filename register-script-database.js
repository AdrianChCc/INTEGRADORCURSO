// Registration functionality with DATABASE support
document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    const registerBtn = document.querySelector('.login-btn');

    // Form submission
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const fullName = document.getElementById('fullName').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Hide previous error messages
        hideError();
        
        // Validation
        if (!fullName || !email || !phone || !username || !password || !confirmPassword) {
            showError('Todos los campos son obligatorios');
            return;
        }
        
        if (password !== confirmPassword) {
            showError('Las contraseñas no coinciden');
            return;
        }
        
        // Enhanced password validation
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            showError(passwordValidation.message);
            return;
        }
        
        if (!isValidEmail(email)) {
            showError('Ingrese un correo electrónico válido');
            return;
        }
        
        // Show loading state
        showLoading();
        
        try {
            // Try to register in database first
            const response = await fetch('api/auth.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'register',
                    full_name: fullName,
                    email: email,
                    phone: phone,
                    username: username,
                    password: password
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Registration successful in database
                console.log('✓ Usuario registrado en base de datos');
                console.log('✓ User ID:', data.user_id);
                
                // Show success animation
                showSuccess();
                
                // Auto-login the new user
                setTimeout(() => {
                    sessionStorage.setItem('tennisClubAuth', 'true');
                    sessionStorage.setItem('tennisClubUser', username);
                    sessionStorage.setItem('tennisClubUserId', data.user_id); // ✅ Guardar ID del usuario
                    sessionStorage.setItem('tennisClubUserRole', 'user');
                    console.log('✅ Usuario auto-logueado con ID:', data.user_id);
                    window.location.href = 'index.html';
                }, 1500);
            } else {
                // Show error from server
                hideLoading();
                showError(data.error || 'Error al registrar usuario');
            }
        } catch (error) {
            console.error('Error en registro de base de datos:', error);
            console.log('Usando localStorage como respaldo...');
            
            // Fallback to localStorage if database fails
            registerWithLocalStorage(fullName, email, phone, username, password);
        }
    });

    // Fallback registration using localStorage
    function registerWithLocalStorage(fullName, email, phone, username, password) {
        // Check if user already exists
        const existingUsers = JSON.parse(localStorage.getItem('tennisClubUsers')) || [];
        
        if (existingUsers.find(user => user.email === email)) {
            hideLoading();
            showError('Ya existe una cuenta con este correo electrónico');
            return;
        }
        
        if (existingUsers.find(user => user.username === username)) {
            hideLoading();
            showError('Este nombre de usuario ya está en uso');
            return;
        }
        
        // Create new user
        const newUser = {
            id: Date.now(),
            fullName: fullName,
            email: email,
            phone: phone,
            username: username,
            password: hashPassword(password),
            role: 'user',
            createdAt: new Date().toISOString(),
            isActive: true
        };
        
        // Add to users array
        existingUsers.push(newUser);
        localStorage.setItem('tennisClubUsers', JSON.stringify(existingUsers));
        
        console.log('✓ Usuario registrado en localStorage (respaldo)');
        console.log('✓ User ID (temporal):', newUser.id);
        
        // Show success animation
        showSuccess();
        
        // Auto-login the new user
        setTimeout(() => {
            sessionStorage.setItem('tennisClubAuth', 'true');
            sessionStorage.setItem('tennisClubUser', username);
            sessionStorage.setItem('tennisClubUserId', newUser.id); // ✅ Guardar ID temporal
            sessionStorage.setItem('tennisClubUserRole', 'user');
            console.log('✅ Usuario auto-logueado con ID temporal:', newUser.id);
            window.location.href = 'index.html';
        }, 1500);
    }

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

    // Toggle confirm password visibility
    window.toggleConfirmPassword = function() {
        const confirmPasswordInput = document.getElementById('confirmPassword');
        const toggleBtn = document.querySelectorAll('.toggle-password')[1].querySelector('i');
        
        if (confirmPasswordInput.type === 'password') {
            confirmPasswordInput.type = 'text';
            toggleBtn.classList.remove('fa-eye');
            toggleBtn.classList.add('fa-eye-slash');
        } else {
            confirmPasswordInput.type = 'password';
            toggleBtn.classList.remove('fa-eye-slash');
            toggleBtn.classList.add('fa-eye');
        }
    };

    // Email validation
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Show error message
    function showError(message) {
        errorText.textContent = message;
        errorMessage.style.display = 'flex';
        errorMessage.style.animation = 'shake 0.5s ease-in-out';
    }

    // Hide error message
    function hideError() {
        errorMessage.style.display = 'none';
    }

    // Show loading state
    function showLoading() {
        registerBtn.classList.add('loading');
        registerBtn.disabled = true;
        
        const btnText = registerBtn.querySelector('.btn-text');
        const btnIcon = registerBtn.querySelector('i');
        
        btnText.textContent = 'Creando cuenta...';
        btnIcon.classList.remove('fa-user-plus');
        btnIcon.classList.add('fa-spinner');
    }

    // Hide loading state
    function hideLoading() {
        registerBtn.classList.remove('loading');
        registerBtn.disabled = false;
        
        const btnText = registerBtn.querySelector('.btn-text');
        const btnIcon = registerBtn.querySelector('i');
        
        btnText.textContent = 'Crear Cuenta';
        btnIcon.classList.remove('fa-spinner');
        btnIcon.classList.add('fa-user-plus');
    }

    // Show success state
    function showSuccess() {
        registerBtn.classList.remove('loading');
        registerBtn.style.background = 'linear-gradient(135deg, #27ae60, #2ecc71)';
        
        const btnText = registerBtn.querySelector('.btn-text');
        const btnIcon = registerBtn.querySelector('i');
        
        btnText.textContent = '¡Cuenta Creada!';
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

    // Real-time password validation
    document.getElementById('password').addEventListener('input', function() {
        const password = this.value;
        updatePasswordRequirements(password);
    });
    
    document.getElementById('confirmPassword').addEventListener('input', function() {
        const password = document.getElementById('password').value;
        const confirmPassword = this.value;
        
        if (confirmPassword && password !== confirmPassword) {
            this.style.borderColor = '#e74c3c';
        } else {
            this.style.borderColor = '#e9ecef';
        }
    });

    // Username availability check (async with database)
    let usernameCheckTimeout;
    document.getElementById('username').addEventListener('input', function() {
        const username = this.value.trim();
        clearTimeout(usernameCheckTimeout);
        
        if (username.length >= 3) {
            usernameCheckTimeout = setTimeout(async () => {
                try {
                    const response = await fetch(`api/auth.php?action=check_username&username=${encodeURIComponent(username)}`);
                    const data = await response.json();
                    
                    if (data.exists) {
                        this.style.borderColor = '#e74c3c';
                        showError('Este nombre de usuario ya está en uso');
                    } else {
                        this.style.borderColor = '#27ae60';
                        hideError();
                    }
                } catch (error) {
                    // Fallback to localStorage check
                    const existingUsers = JSON.parse(localStorage.getItem('tennisClubUsers')) || [];
                    if (existingUsers.find(user => user.username === username)) {
                        this.style.borderColor = '#e74c3c';
                        showError('Este nombre de usuario ya está en uso');
                    } else {
                        this.style.borderColor = '#27ae60';
                        hideError();
                    }
                }
            }, 500);
        }
    });

    // Email availability check (async with database)
    let emailCheckTimeout;
    document.getElementById('email').addEventListener('input', function() {
        const email = this.value.trim();
        clearTimeout(emailCheckTimeout);
        
        if (email && isValidEmail(email)) {
            emailCheckTimeout = setTimeout(async () => {
                try {
                    const response = await fetch(`api/auth.php?action=check_email&email=${encodeURIComponent(email)}`);
                    const data = await response.json();
                    
                    if (data.exists) {
                        this.style.borderColor = '#e74c3c';
                        showError('Ya existe una cuenta con este correo electrónico');
                    } else {
                        this.style.borderColor = '#27ae60';
                        hideError();
                    }
                } catch (error) {
                    // Fallback to localStorage check
                    const existingUsers = JSON.parse(localStorage.getItem('tennisClubUsers')) || [];
                    if (existingUsers.find(user => user.email === email)) {
                        this.style.borderColor = '#e74c3c';
                        showError('Ya existe una cuenta con este correo electrónico');
                    } else {
                        this.style.borderColor = '#27ae60';
                        hideError();
                    }
                }
            }, 500);
        }
    });

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

// Simple password hashing function
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

// Enhanced password validation function
function validatePassword(password) {
    const minLength = 8;
    const hasDigit = /\d/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    if (password.length < minLength) {
        return {
            isValid: false,
            message: `La contraseña debe tener al menos ${minLength} caracteres`
        };
    }
    
    if (!hasDigit) {
        return {
            isValid: false,
            message: 'La contraseña debe contener al menos un dígito (0-9)'
        };
    }
    
    if (!hasUppercase) {
        return {
            isValid: false,
            message: 'La contraseña debe contener al menos una letra mayúscula (A-Z)'
        };
    }
    
    if (!hasSpecialChar) {
        return {
            isValid: false,
            message: 'La contraseña debe contener al menos un carácter especial (!@#$%^&*()_+-=[]{}|;:,.<>?)'
        };
    }
    
    return {
        isValid: true,
        message: 'Contraseña válida'
    };
}

// Update password requirements in real-time
function updatePasswordRequirements(password) {
    const requirements = {
        length: password.length >= 8,
        digit: /\d/.test(password),
        uppercase: /[A-Z]/.test(password),
        special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };
    
    // Update length requirement
    const lengthReq = document.getElementById('req-length');
    if (lengthReq) {
        if (requirements.length) {
            lengthReq.classList.remove('invalid');
            lengthReq.classList.add('valid');
            lengthReq.querySelector('i').className = 'fas fa-check';
        } else {
            lengthReq.classList.remove('valid');
            lengthReq.classList.add('invalid');
            lengthReq.querySelector('i').className = 'fas fa-times';
        }
    }
    
    // Update digit requirement
    const digitReq = document.getElementById('req-digit');
    if (digitReq) {
        if (requirements.digit) {
            digitReq.classList.remove('invalid');
            digitReq.classList.add('valid');
            digitReq.querySelector('i').className = 'fas fa-check';
        } else {
            digitReq.classList.remove('valid');
            digitReq.classList.add('invalid');
            digitReq.querySelector('i').className = 'fas fa-times';
        }
    }
    
    // Update uppercase requirement
    const uppercaseReq = document.getElementById('req-uppercase');
    if (uppercaseReq) {
        if (requirements.uppercase) {
            uppercaseReq.classList.remove('invalid');
            uppercaseReq.classList.add('valid');
            uppercaseReq.querySelector('i').className = 'fas fa-check';
        } else {
            uppercaseReq.classList.remove('valid');
            uppercaseReq.classList.add('invalid');
            uppercaseReq.querySelector('i').className = 'fas fa-times';
        }
    }
    
    // Update special character requirement
    const specialReq = document.getElementById('req-special');
    if (specialReq) {
        if (requirements.special) {
            specialReq.classList.remove('invalid');
            specialReq.classList.add('valid');
            specialReq.querySelector('i').className = 'fas fa-check';
        } else {
            specialReq.classList.remove('valid');
            specialReq.classList.add('invalid');
            specialReq.querySelector('i').className = 'fas fa-times';
        }
    }
}

