// User Profile functionality
document.addEventListener('DOMContentLoaded', async function() {
    // Cargar datos del usuario desde la base de datos
    await loadUserDataFromDatabase();
    await loadUserPurchasesFromDatabase();
    await loadUserInquiriesFromDatabase();
});

async function loadUserDataFromDatabase() {
    try {
        const userName = sessionStorage.getItem('tennisClubUser') || 'Usuario';
        console.log('🔄 Cargando perfil de usuario:', userName);
        
        // Obtener usuarios de la BD
        const users = await window.dbAPI.getUsers();
        const user = users.find(u => u.username === userName);
        
        if (user) {
            console.log('✅ Usuario encontrado en BD:', user);
            document.getElementById('userName').textContent = user.full_name;
            document.getElementById('userEmail').textContent = user.email;
            
            // Guardar en sessionStorage para referencia
            sessionStorage.setItem('tennisClubUserId', user.id);
            sessionStorage.setItem('tennisClubUserEmail', user.email);
        } else {
            console.warn('⚠️ Usuario no encontrado en BD, usando localStorage');
            // Fallback a localStorage
            const localUsers = JSON.parse(localStorage.getItem('tennisClubUsers')) || [];
            const localUser = localUsers.find(u => u.username === userName);
            
            if (localUser) {
                document.getElementById('userName').textContent = localUser.fullName;
                document.getElementById('userEmail').textContent = localUser.email;
            }
        }
    } catch (error) {
        console.error('❌ Error cargando usuario desde BD:', error);
        // Fallback a localStorage
        const userName = sessionStorage.getItem('tennisClubUser') || 'Usuario';
        const users = JSON.parse(localStorage.getItem('tennisClubUsers')) || [];
        const user = users.find(u => u.username === userName);
        
        if (user) {
            document.getElementById('userName').textContent = user.fullName;
            document.getElementById('userEmail').textContent = user.email;
        }
    }
}

async function loadUserPurchasesFromDatabase() {
    try {
        const userName = sessionStorage.getItem('tennisClubUser');
        const userId = sessionStorage.getItem('tennisClubUserId');
        
        console.log('🔄 Cargando compras del usuario desde BD...');
        
        // Obtener compras de la BD
        const allPurchases = await window.dbAPI.getPurchases();
        const userPurchases = userId ? 
            allPurchases.filter(p => p.user_id == userId) : 
            [];
        
        console.log(`✅ ${userPurchases.length} compras encontradas en BD`);
        
        // Actualizar estadísticas
        document.getElementById('totalPurchases').textContent = userPurchases.length;
        
        // Calcular total gastado
        const totalSpent = userPurchases.reduce((sum, purchase) => sum + parseFloat(purchase.total || 0), 0);
        document.getElementById('totalSpent').textContent = `$${totalSpent.toFixed(2)}`;
        
        // Mostrar compras
        const purchasesList = document.getElementById('purchasesList');
        
        if (userPurchases.length === 0) {
            purchasesList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-shopping-cart"></i>
                    <p>No has realizado compras aún</p>
                </div>
            `;
            return;
        }
        
        // Ordenar por fecha (más reciente primero)
        userPurchases.sort((a, b) => new Date(b.purchase_date) - new Date(a.purchase_date));
        
        purchasesList.innerHTML = userPurchases.map(purchase => `
            <div class="purchase-item">
                <div class="purchase-info">
                    <div class="purchase-product">${purchase.product_name || 'Producto'}</div>
                    <div class="purchase-date">
                        ${new Date(purchase.purchase_date).toLocaleDateString()} 
                        - Cantidad: ${purchase.quantity}
                    </div>
                </div>
                <div class="purchase-price">$${parseFloat(purchase.total).toFixed(2)}</div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('❌ Error cargando compras desde BD:', error);
        document.getElementById('purchasesList').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error al cargar compras</p>
            </div>
        `;
    }
}

async function loadUserInquiriesFromDatabase() {
    try {
        const userName = sessionStorage.getItem('tennisClubUser');
        const userId = sessionStorage.getItem('tennisClubUserId');
        
        console.log('🔄 Cargando consultas del usuario desde BD...');
        
        // Obtener consultas de la BD
        const allInquiries = await window.dbAPI.getInquiries();
        const userInquiries = userId ? 
            allInquiries.filter(i => i.user_id == userId) : 
            [];
        
        console.log(`✅ ${userInquiries.length} consultas encontradas en BD`);
        
        // Actualizar estadísticas
        document.getElementById('totalInquiries').textContent = userInquiries.length;
        
        // Mostrar consultas
        const inquiriesList = document.getElementById('inquiriesList');
        
        if (userInquiries.length === 0) {
            inquiriesList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-question-circle"></i>
                    <p>No has realizado consultas aún</p>
                </div>
            `;
            return;
        }
        
        // Ordenar por fecha (más reciente primero)
        userInquiries.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        inquiriesList.innerHTML = userInquiries.map(inquiry => `
            <div class="inquiry-item">
                <div class="inquiry-info">
                    <div class="inquiry-service">${inquiry.service_type || 'Consulta'}</div>
                    ${inquiry.message ? `<div class="inquiry-message">"${inquiry.message}"</div>` : ''}
                    <div class="inquiry-date">${new Date(inquiry.created_at).toLocaleDateString()}</div>
                </div>
                <div class="inquiry-status" style="padding: 0.5rem; border-radius: 8px; background: ${getStatusColor(inquiry.status)}; color: white; font-size: 0.85rem;">
                    ${getStatusText(inquiry.status)}
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('❌ Error cargando consultas desde BD:', error);
        document.getElementById('inquiriesList').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error al cargar consultas</p>
            </div>
        `;
    }
}

function getStatusColor(status) {
    switch(status) {
        case 'new': return '#3498db';
        case 'in_progress': return '#f39c12';
        case 'completed': return '#27ae60';
        case 'cancelled': return '#e74c3c';
        default: return '#95a5a6';
    }
}

function getStatusText(status) {
    switch(status) {
        case 'new': return 'Nueva';
        case 'in_progress': return 'En Proceso';
        case 'completed': return 'Completada';
        case 'cancelled': return 'Cancelada';
        default: return status;
    }
}

function getProductName(productId) {
    const productNames = {
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

function getServiceName(serviceId) {
    const serviceNames = {
        'individual': 'Clases Individuales',
        'grupal': 'Clases Grupales',
        'juvenil': 'Academia Juvenil',
        'competitivo': 'Entrenamiento Competitivo'
    };
    return serviceNames[serviceId] || serviceId;
}

async function editProfile() {
    const userName = sessionStorage.getItem('tennisClubUser');
    const userId = sessionStorage.getItem('tennisClubUserId');
    
    console.log('🔄 Cargando datos del usuario para editar...');
    
    let user;
    
    try {
        // Obtener usuario de la BD
        const users = await window.dbAPI.getUsers();
        user = users.find(u => u.username === userName);
        
        if (!user) {
            showNotification('Usuario no encontrado en la base de datos', 'error');
            return;
        }
        
        console.log('✅ Usuario cargado:', user);
    } catch (error) {
        console.error('❌ Error cargando usuario:', error);
        showNotification('Error al cargar datos del usuario', 'error');
        return;
    }
    
    // Create edit modal
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
        backdrop-filter: blur(10px);
    `;
    
    modal.innerHTML = `
        <div style="
            background: white;
            border-radius: 16px;
            width: 90%;
            max-width: 500px;
            padding: 2rem;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
        ">
            <h3 style="margin-bottom: 1.5rem; color: var(--text-primary);">Editar Perfil</h3>
            <form id="editProfileForm">
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Nombre Completo</label>
                    <input type="text" id="editFullName" value="${user.full_name}" style="
                        width: 100%;
                        padding: 0.75rem;
                        border: 2px solid #e9ecef;
                        border-radius: 8px;
                        font-size: 1rem;
                    " required>
                </div>
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Email</label>
                    <input type="email" id="editEmail" value="${user.email}" style="
                        width: 100%;
                        padding: 0.75rem;
                        border: 2px solid #e9ecef;
                        border-radius: 8px;
                        font-size: 1rem;
                    " required>
                </div>
                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Teléfono</label>
                    <input type="tel" id="editPhone" value="${user.phone}" style="
                        width: 100%;
                        padding: 0.75rem;
                        border: 2px solid #e9ecef;
                        border-radius: 8px;
                        font-size: 1rem;
                    " required>
                </div>
                <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                    <button type="button" onclick="closeEditModal()" style="
                        background: #6c757d;
                        color: white;
                        border: none;
                        padding: 0.75rem 1.5rem;
                        border-radius: 8px;
                        cursor: pointer;
                    ">Cancelar</button>
                    <button type="submit" style="
                        background: var(--gradient-primary);
                        color: white;
                        border: none;
                        padding: 0.75rem 1.5rem;
                        border-radius: 8px;
                        cursor: pointer;
                    ">Guardar</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Handle form submission
    document.getElementById('editProfileForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const fullName = document.getElementById('editFullName').value;
        const email = document.getElementById('editEmail').value;
        const phone = document.getElementById('editPhone').value;
        
        try {
            console.log('💾 Actualizando perfil en la base de datos...');
            
            // Actualizar en la base de datos
            await window.dbAPI.updateUser(user.id, {
                full_name: fullName,
                email: email,
                phone: phone
            });
            
            console.log('✅ Perfil actualizado en BD');
            
            // También actualizar en localStorage para compatibilidad
            const localUsers = JSON.parse(localStorage.getItem('tennisClubUsers')) || [];
            const userIndex = localUsers.findIndex(u => u.username === user.username);
            if (userIndex !== -1) {
                localUsers[userIndex].fullName = fullName;
                localUsers[userIndex].email = email;
                localUsers[userIndex].phone = phone;
                localStorage.setItem('tennisClubUsers', JSON.stringify(localUsers));
            }
            
            // Actualizar la visualización
            document.getElementById('userName').textContent = fullName;
            document.getElementById('userEmail').textContent = email;
            
            // Cerrar modal
            document.body.removeChild(modal);
            
            showNotification('✅ Perfil actualizado en la base de datos', 'success');
            
        } catch (error) {
            console.error('❌ Error actualizando perfil:', error);
            showNotification('❌ Error al actualizar perfil: ' + error.message, 'error');
        }
    });
}

function closeEditModal() {
    const modal = document.querySelector('div[style*="position: fixed"]');
    if (modal) {
        document.body.removeChild(modal);
    }
}

function logout() {
    if (confirm('¿Está seguro que desea cerrar sesión?')) {
        sessionStorage.removeItem('tennisClubAuth');
        sessionStorage.removeItem('tennisClubUser');
        sessionStorage.removeItem('tennisClubUserRole');
        window.location.href = 'login.html';
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? 'linear-gradient(135deg, #27ae60, #2ecc71)' : 
                     type === 'error' ? 'linear-gradient(135deg, #e74c3c, #c0392b)' : 
                     'linear-gradient(135deg, #3498db, #2980b9)'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

