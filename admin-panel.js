// Admin Panel JavaScript
let currentSection = 'dashboard';
let editingUser = null;
let editingProduct = null;

// Initialize admin panel
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const isAuthenticated = sessionStorage.getItem('tennisClubAuth') === 'true';
    const userRole = sessionStorage.getItem('tennisClubUserRole');
    const username = sessionStorage.getItem('tennisClubUser');
    
    console.log('=== ADMIN PANEL DEBUG ===');
    console.log('Authenticated:', isAuthenticated);
    console.log('Username:', username);
    console.log('Role:', userRole);
    
    // Check if user is admin (either by role or username)
    const isAdmin = (userRole === 'admin' || username === 'admin');
    
    console.log('Is Admin:', isAdmin);
    console.log('========================');
    
    if (!isAuthenticated) {
        console.log('❌ Access denied - Not authenticated');
        alert('Debe iniciar sesión para acceder al panel de administración');
        window.location.href = 'login.html';
        return;
    }
    
    if (!isAdmin) {
        console.log('❌ Access denied - Not admin');
        showAccessDeniedMessage();
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 3000);
        return;
    }

    console.log('✓ Admin access granted, loading data...');

    // Wait for dbAPI to be available and load data
    function waitForAPIAndLoad() {
        if (window.dbAPI) {
            console.log('✅ dbAPI disponible, cargando datos...');
            loadDashboardData();
        } else {
            console.log('⏳ Esperando a que dbAPI se cargue...');
            setTimeout(waitForAPIAndLoad, 100);
        }
    }
    
    waitForAPIAndLoad();
    
    // Setup form handlers
    setupFormHandlers();
    
    // Setup navigation
    setupNavigation();
});

// Setup navigation
function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const section = this.getAttribute('onclick').match(/'([^']+)'/)[1];
            showSection(section);
        });
    });
}

// Show specific section
function showSection(section) {
    // Hide all sections
    const sections = document.querySelectorAll('.admin-section');
    sections.forEach(s => s.classList.add('hidden'));
    
    // Remove active class from nav buttons
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => btn.classList.remove('active'));
    
    // Show selected section
    const targetSection = document.getElementById(section + '-section');
    if (targetSection) {
        targetSection.classList.remove('hidden');
    }
    
    // Add active class to clicked button
    const activeButton = document.querySelector(`[onclick="showSection('${section}')"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
    
    currentSection = section;
    
    // Load section data
    switch(section) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'users':
            loadUsers();
            break;
        case 'products':
            loadProducts();
            break;
        case 'purchases':
            loadPurchases();
            break;
        case 'inquiries':
            loadInquiries();
            break;
        case 'reports':
            loadReport('weekly');
            break;
        case 'losses':
            loadLosses();
            loadLossStats();
            break;
    }
}

// Setup form handlers
function setupFormHandlers() {
    // User form
    const userForm = document.getElementById('userForm');
    if (userForm) {
        userForm.addEventListener('submit', handleUserSubmit);
    }
    
    // Product form
    const productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.addEventListener('submit', handleProductSubmit);
    }
    
    // Loss form
    const lossForm = document.getElementById('lossForm');
    if (lossForm) {
        lossForm.addEventListener('submit', handleLossSubmit);
    }
}

// Load dashboard data
async function loadDashboardData() {
    console.log('=== LOADING DASHBOARD STATS ===');
    
    // Check if dbAPI is available
    if (!window.dbAPI) {
        console.error('❌ Database API not loaded');
        setTimeout(loadDashboardData, 200); // Reintentar después de 200ms
        return;
    }

    try {
        console.log('✅ dbAPI disponible');
        console.log('🔄 Obteniendo estadísticas...');
        
        const stats = await window.dbAPI.getStats();
        
        console.log('📊 Estadísticas recibidas:', stats);
        
        if (stats && typeof stats === 'object') {
            document.getElementById('totalUsers').textContent = stats.totalUsers || 0;
            document.getElementById('totalProducts').textContent = stats.totalProducts || 0;
            document.getElementById('totalPurchases').textContent = stats.totalPurchases || 0;
        document.getElementById('totalRevenue').textContent = `$${(stats.totalRevenue || 0).toFixed(2)}`;
        
        // Cargar índice de pérdidas
        loadLossIndexForDashboard();
        
        console.log('✅ Dashboard actualizado exitosamente');
        console.log(`   Usuarios: ${stats.totalUsers}, Productos: ${stats.totalProducts}, Compras: ${stats.totalPurchases}`);
        } else {
            throw new Error('Respuesta inválida de la API');
        }
    } catch (error) {
        console.error('❌ Error loading dashboard data:', error);
        showNotification('❌ Error al cargar estadísticas: ' + error.message, 'error');
        
        // Set default values
        document.getElementById('totalUsers').textContent = '0';
        document.getElementById('totalProducts').textContent = '0';
        document.getElementById('totalPurchases').textContent = '0';
        document.getElementById('totalRevenue').textContent = '$0.00';
    }
}

// Load users
async function loadUsers() {
    try {
        const users = await window.dbAPI.getUsers();
        displayUsers(users);
    } catch (error) {
        console.error('Error loading users:', error);
        showNotification('Error al cargar usuarios', 'error');
    }
}

// Display users in table
function displayUsers(users) {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '';
    
    users.forEach(user => {
        const row = document.createElement('div');
        row.className = 'table-row';
        row.innerHTML = `
            <div>${user.id}</div>
            <div>${user.full_name}</div>
            <div>${user.email}</div>
            <div>${user.username}</div>
            <div>${user.role}</div>
            <div>
                <span class="status-badge ${user.is_active ? 'status-active' : 'status-inactive'}">
                    ${user.is_active ? 'Activo' : 'Inactivo'}
                </span>
            </div>
            <div class="action-buttons">
                <button class="action-btn edit-btn" onclick="editUser(${user.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" onclick="deleteUser(${user.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        tbody.appendChild(row);
    });
}

// Handle user form submission
async function handleUserSubmit(e) {
    e.preventDefault();
    
    const fullName = document.getElementById('userFullName').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    const phone = document.getElementById('userPhone').value.trim();
    const username = document.getElementById('userUsername').value.trim();
    const role = document.getElementById('userRole').value;
    const isActive = document.getElementById('userActive').value === 'true';

    // Validaciones básicas en frontend (mejora de "adición" y "validación")
    if (!fullName || !email || !phone || !username) {
        showNotification('Por favor complete todos los campos obligatorios', 'warning');
        return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showNotification('El correo electrónico no tiene un formato válido', 'warning');
        return;
    }

    const formData = {
        full_name: fullName,
        email,
        phone,
        username,
        role,
        is_active: isActive
    };
    
    // Add password if provided
    const password = document.getElementById('userPassword').value;
    if (password) {
        formData.password = password;
    }
    
    try {
        if (editingUser) {
            // Update existing user
            await window.dbAPI.updateUser(editingUser, formData);
            showNotification('Usuario actualizado exitosamente', 'success');
        } else {
            // Create new user
            await window.dbAPI.createUser(formData);
            showNotification('Usuario creado exitosamente', 'success');
        }
        
        clearUserForm();
        loadUsers();
        loadDashboardData();
    } catch (error) {
        console.error('Error saving user:', error);
        showNotification('Error al guardar usuario', 'error');
    }
}

// Edit user
async function editUser(userId) {
    try {
        const user = await window.dbAPI.getUser(userId);
        if (user) {
            document.getElementById('userId').value = user.id;
            document.getElementById('userFullName').value = user.full_name;
            document.getElementById('userEmail').value = user.email;
            document.getElementById('userPhone').value = user.phone;
            document.getElementById('userUsername').value = user.username;
            document.getElementById('userRole').value = user.role;
            document.getElementById('userActive').value = user.is_active ? 'true' : 'false';
            
            editingUser = user.id;
            
            // Scroll to form
            document.getElementById('userForm').scrollIntoView({ behavior: 'smooth' });
        }
    } catch (error) {
        console.error('Error loading user:', error);
        showNotification('Error al cargar usuario', 'error');
    }
}

// Delete (soft delete) user
async function deleteUser(userId) {
    if (confirm('¿Estás seguro de que quieres desactivar este usuario?')) {
        try {
            await window.dbAPI.deleteUser(userId);
            showNotification('Usuario desactivado exitosamente', 'success');
            loadUsers();
            loadDashboardData();
        } catch (error) {
            console.error('Error deleting user:', error);
            showNotification('Error al desactivar usuario', 'error');
        }
    }
}

// Clear user form
function clearUserForm() {
    document.getElementById('userForm').reset();
    document.getElementById('userId').value = '';
    editingUser = null;
}

// Load products
async function loadProducts() {
    try {
        console.log('📦 Cargando productos desde base de datos XAMPP...');
        const products = await window.dbAPI.getProducts();
        console.log(`✅ ${products.length} productos cargados desde la BD`);
        displayProducts(products);
    } catch (error) {
        console.error('❌ Error cargando productos desde BD:', error);
        showNotification('❌ Error al cargar productos desde la base de datos', 'error');
    }
}

// Display products in table
function displayProducts(products) {
    const tbody = document.getElementById('productsTableBody');
    tbody.innerHTML = '';
    
    products.forEach(product => {
        const row = document.createElement('div');
        row.className = 'table-row';
        row.innerHTML = `
            <div>${product.id}</div>
            <div>${product.name}</div>
            <div>$${parseFloat(product.price).toFixed(2)}</div>
            <div>${product.category}</div>
            <div>${product.stock}</div>
            <div>
                <span class="status-badge ${product.is_active ? 'status-active' : 'status-inactive'}">
                    ${product.is_active ? 'Activo' : 'Inactivo'}
                </span>
            </div>
            <div class="action-buttons">
                <button class="action-btn edit-btn" onclick="editProduct(${product.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" onclick="deleteProduct(${product.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        tbody.appendChild(row);
    });
}

// Handle product form submission
async function handleProductSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('productName').value.trim();
    const description = document.getElementById('productDescription').value.trim();
    const priceValue = document.getElementById('productPrice').value;
    const imageUrl = document.getElementById('productImage').value.trim();
    const category = document.getElementById('productCategory').value.trim();
    const stockValue = document.getElementById('productStock').value;
    const isActive = document.getElementById('productActive').value === 'true';

    // Validaciones de formulario de producto
    if (!name || !description || !priceValue) {
        showNotification('Nombre, descripción y precio son obligatorios', 'warning');
        return;
    }

    const price = parseFloat(priceValue);
    if (isNaN(price) || price <= 0) {
        showNotification('El precio debe ser un número mayor a 0', 'warning');
        return;
    }

    const stock = parseInt(stockValue || '0', 10);
    if (isNaN(stock) || stock < 0) {
        showNotification('El stock debe ser un número entero mayor o igual a 0', 'warning');
        return;
    }

    const formData = {
        name,
        description,
        price,
        image_url: imageUrl,
        category,
        stock,
        is_active: isActive
    };
    
    try {
        console.log('🔄 Guardando producto en base de datos XAMPP...');
        console.log('Datos del producto:', formData);
        
        if (editingProduct) {
            // Update existing product
            const response = await window.dbAPI.updateProduct(editingProduct, formData);
            console.log('✅ Producto actualizado en BD:', response);
            showNotification('✅ Producto actualizado en base de datos XAMPP', 'success');
        } else {
            // Create new product
            const response = await window.dbAPI.createProduct(formData);
            console.log('✅ Producto creado en BD con ID:', response.product_id);
            showNotification('✅ Producto agregado a la base de datos XAMPP', 'success');
        }
        
        clearProductForm();
        await loadProducts();
        await loadDashboardData();
        
        console.log('✅ Lista de productos actualizada desde la BD');
    } catch (error) {
        console.error('❌ Error guardando producto en BD:', error);
        showNotification('❌ Error al guardar producto en base de datos: ' + error.message, 'error');
    }
}

// Edit product
async function editProduct(productId) {
    try {
        const product = await window.dbAPI.getProduct(productId);
        if (product) {
            document.getElementById('productId').value = product.id;
            document.getElementById('productName').value = product.name;
            document.getElementById('productDescription').value = product.description;
            document.getElementById('productPrice').value = product.price;
            document.getElementById('productImage').value = product.image_url;
            document.getElementById('productCategory').value = product.category;
            document.getElementById('productStock').value = product.stock;
            document.getElementById('productActive').value = product.is_active ? 'true' : 'false';
            
            editingProduct = product.id;
            
            // Scroll to form
            document.getElementById('productForm').scrollIntoView({ behavior: 'smooth' });
        }
    } catch (error) {
        console.error('Error loading product:', error);
        showNotification('Error al cargar producto', 'error');
    }
}

// Delete (soft delete) product
async function deleteProduct(productId) {
    if (confirm('¿Estás seguro de que quieres desactivar este producto de la base de datos?')) {
        try {
            console.log('🗑️ Eliminando producto ID:', productId, 'de la base de datos XAMPP...');
            
            const response = await window.dbAPI.deleteProduct(productId);
            console.log('✅ Producto eliminado de BD:', response);
            
            showNotification('✅ Producto desactivado en la base de datos XAMPP', 'success');
            
            await loadProducts();
            await loadDashboardData();
            
            console.log('✅ Lista de productos actualizada desde la BD');
        } catch (error) {
            console.error('❌ Error eliminando producto de BD:', error);
            showNotification('❌ Error al eliminar producto de la base de datos: ' + error.message, 'error');
        }
    }
}

// Clear product form
function clearProductForm() {
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    editingProduct = null;
}

// Load purchases
async function loadPurchases() {
    try {
        const purchases = await window.dbAPI.getPurchases();
        displayPurchases(purchases);
    } catch (error) {
        console.error('Error loading purchases:', error);
        showNotification('Error al cargar compras', 'error');
    }
}

// Display purchases in table
function displayPurchases(purchases) {
    const tbody = document.getElementById('purchasesTableBody');
    tbody.innerHTML = '';
    
    purchases.forEach(purchase => {
        const row = document.createElement('div');
        row.className = 'table-row';
        row.innerHTML = `
            <div>${purchase.id}</div>
            <div>${purchase.user_name}</div>
            <div>${purchase.product_name}</div>
            <div>${purchase.quantity}</div>
            <div>$${parseFloat(purchase.price).toFixed(2)}</div>
            <div>$${parseFloat(purchase.total).toFixed(2)}</div>
            <div>${new Date(purchase.purchase_date).toLocaleDateString()}</div>
        `;
        tbody.appendChild(row);
    });
}

// Load inquiries
async function loadInquiries() {
    try {
        const inquiries = await window.dbAPI.getInquiries();
        displayInquiries(inquiries);
    } catch (error) {
        console.error('Error loading inquiries:', error);
        showNotification('Error al cargar consultas', 'error');
    }
}

// Display inquiries in table
function displayInquiries(inquiries) {
    const tbody = document.getElementById('inquiriesTableBody');
    tbody.innerHTML = '';
    
    inquiries.forEach(inquiry => {
        const row = document.createElement('div');
        row.className = 'table-row';
        row.innerHTML = `
            <div>${inquiry.id}</div>
            <div>${inquiry.user_name}</div>
            <div>${inquiry.service_type}</div>
            <div>${inquiry.message || 'Sin mensaje'}</div>
            <div>
                <span class="status-badge ${getStatusClass(inquiry.status)}">
                    ${getStatusText(inquiry.status)}
                </span>
            </div>
            <div>${new Date(inquiry.created_at).toLocaleDateString()}</div>
            <div class="action-buttons">
                <button class="action-btn edit-btn" onclick="updateInquiryStatus(${inquiry.id})">
                    <i class="fas fa-edit"></i>
                </button>
            </div>
        `;
        tbody.appendChild(row);
    });
}

// Get status class for styling
function getStatusClass(status) {
    switch(status) {
        case 'new': return 'status-active';
        case 'in_progress': return 'status-inactive';
        case 'completed': return 'status-active';
        case 'cancelled': return 'status-inactive';
        default: return 'status-inactive';
    }
}

// Get status text
function getStatusText(status) {
    switch(status) {
        case 'new': return 'Nueva';
        case 'in_progress': return 'En Proceso';
        case 'completed': return 'Completada';
        case 'cancelled': return 'Cancelada';
        default: return 'Desconocido';
    }
}

// Update inquiry status
async function updateInquiryStatus(inquiryId) {
    const newStatus = prompt('Nuevo estado (new, in_progress, completed, cancelled):');
    if (newStatus && ['new', 'in_progress', 'completed', 'cancelled'].includes(newStatus)) {
        try {
            await window.dbAPI.updateInquiry(inquiryId, { status: newStatus });
            showNotification('Estado actualizado exitosamente', 'success');
            loadInquiries();
        } catch (error) {
            console.error('Error updating inquiry:', error);
            showNotification('Error al actualizar consulta', 'error');
        }
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        max-width: 300px;
    `;
    
    const colors = {
        success: '#27ae60',
        error: '#e74c3c',
        warning: '#f39c12',
        info: '#3498db'
    };
    
    notification.style.background = colors[type] || colors.info;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
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

// Reports functionality
let currentReportData = null;
let currentReportPeriod = 'weekly';

// Load inventory report
async function loadReport(period) {
    try {
        currentReportPeriod = period;
        const periodText = period === 'weekly' ? 'Semanal (7 días)' : 'Mensual (30 días)';
        
        console.log(`\n=== CARGANDO REPORTE ${periodText.toUpperCase()} ===`);
        showNotification(`Cargando reporte ${periodText.toLowerCase()}...`, 'info');
        
        const url = `api/reports.php?type=inventory&period=${period}`;
        console.log(`📡 Solicitando: ${url}`);
        
        const response = await fetch(url);
        console.log(`📥 Respuesta HTTP: ${response.status} ${response.ok ? '✓' : '✗'}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`📊 Datos del reporte ${periodText}:`);
        console.log(`   Período: ${data.period} (${data.days_back} días atrás)`);
        console.log(`   Total productos: ${data.summary.total_products}`);
        console.log(`   Stock total: ${data.summary.total_stock}`);
        console.log(`   Unidades vendidas: ${data.summary.total_sold}`);
        console.log(`   Ingresos: $${data.summary.total_revenue}`);
        console.log(`   Productos bajo stock: ${data.summary.low_stock_count}`);
        console.log(`   Productos agotados: ${data.summary.out_of_stock_count}`);
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        currentReportData = data;
        displayReport(data);
        
        // Update button styles con más énfasis
        const weeklyBtn = document.getElementById('weeklyBtn');
        const monthlyBtn = document.getElementById('monthlyBtn');
        
        if (period === 'weekly') {
            weeklyBtn.className = 'btn btn-success';
            weeklyBtn.style.transform = 'scale(1.05)';
            weeklyBtn.style.boxShadow = '0 0 20px rgba(39, 174, 96, 0.6)';
            monthlyBtn.className = 'btn';
            monthlyBtn.style.background = '#3498db';
            monthlyBtn.style.transform = 'scale(1)';
            monthlyBtn.style.boxShadow = 'none';
        } else {
            monthlyBtn.className = 'btn btn-success';
            monthlyBtn.style.transform = 'scale(1.05)';
            monthlyBtn.style.boxShadow = '0 0 20px rgba(39, 174, 96, 0.6)';
            weeklyBtn.className = 'btn';
            weeklyBtn.style.transform = 'scale(1)';
            weeklyBtn.style.boxShadow = 'none';
        }
        
        // Update period indicator
        const indicator = document.getElementById('currentPeriodIndicator');
        if (indicator) {
            indicator.textContent = `📊 MOSTRANDO: ${periodText.toUpperCase()}`;
            indicator.style.color = '#27ae60';
            indicator.style.fontWeight = 'bold';
        }
        
        console.log(`✅ Reporte ${periodText} cargado exitosamente\n`);
        showNotification(`✅ Reporte ${periodText} cargado correctamente`, 'success');
    } catch (error) {
        console.error('❌ Error cargando reporte:', error);
        showNotification('Error al cargar reporte: ' + error.message, 'error');
    }
}

// Display report data
function displayReport(data) {
    // Update summary stats
    document.getElementById('reportTotalProducts').textContent = data.summary.total_products;
    document.getElementById('reportTotalStock').textContent = data.summary.total_stock;
    document.getElementById('reportTotalSold').textContent = data.summary.total_sold;
    document.getElementById('reportTotalRevenue').textContent = `$${parseFloat(data.summary.total_revenue).toFixed(2)}`;
    document.getElementById('reportLowStock').textContent = data.summary.low_stock_count;
    document.getElementById('reportOutOfStock').textContent = data.summary.out_of_stock_count;
    
    // Display top products
    displayTopProducts(data.top_products);
    
    // Display low stock products
    displayLowStock(data.low_stock_products);
    
    // Display category sales
    displayCategorySales(data.category_sales);
    
    // Display full inventory
    displayInventory(data.all_products);
}

// Display top products
function displayTopProducts(products) {
    const container = document.getElementById('topProductsTable');
    if (!products || products.length === 0) {
        container.innerHTML = '<div style="padding: 1rem; color: white; text-align: center;">No hay datos disponibles</div>';
        return;
    }
    
    container.innerHTML = products.map((product, index) => `
        <div class="table-row" style="display: grid; grid-template-columns: 50px 2fr 1fr 1fr;">
            <div style="font-size: 1.5rem;">${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : (index + 1)}</div>
            <div style="font-weight: 600;">${product.name}</div>
            <div>${product.sold_units} vendidas</div>
            <div style="color: #27ae60; font-weight: 600;">$${parseFloat(product.total_revenue).toFixed(2)}</div>
        </div>
    `).join('');
}

// Display low stock products
function displayLowStock(products) {
    const container = document.getElementById('lowStockTable');
    if (!products || products.length === 0) {
        container.innerHTML = '<div style="padding: 1rem; color: white; text-align: center;">✅ Todos los productos tienen stock suficiente</div>';
        return;
    }
    
    container.innerHTML = products.map(product => `
        <div class="table-row" style="display: grid; grid-template-columns: 2fr 1fr 1fr;">
            <div style="font-weight: 600;">${product.name}</div>
            <div style="color: ${product.stock < 5 ? '#e74c3c' : '#f39c12'}; font-weight: 600;">
                <i class="fas fa-exclamation-triangle"></i> ${product.stock} unidades
            </div>
            <div>${product.category}</div>
        </div>
    `).join('');
}

// Display category sales
function displayCategorySales(categories) {
    const container = document.getElementById('categorySalesTable');
    if (!categories || categories.length === 0) {
        container.innerHTML = '<div style="padding: 1rem; color: white; text-align: center;">No hay datos disponibles</div>';
        return;
    }
    
    // Sort by revenue
    categories.sort((a, b) => b.revenue - a.revenue);
    
    container.innerHTML = categories.map(cat => `
        <div class="table-row" style="display: grid; grid-template-columns: 1fr 1fr 1fr;">
            <div style="font-weight: 600; text-transform: capitalize;">
                <i class="fas fa-tag"></i> ${cat.category}
            </div>
            <div>${cat.units_sold} unidades</div>
            <div style="color: #27ae60; font-weight: 600;">$${parseFloat(cat.revenue).toFixed(2)}</div>
        </div>
    `).join('');
}

// Display full inventory
function displayInventory(products) {
    const container = document.getElementById('inventoryTable');
    if (!products || products.length === 0) {
        container.innerHTML = '<div style="padding: 1rem; color: white; text-align: center;">No hay productos en el inventario</div>';
        return;
    }
    
    container.innerHTML = products.map(product => {
        const stockColor = product.stock === 0 ? '#e74c3c' : product.stock < 10 ? '#f39c12' : '#27ae60';
        const statusBadge = product.is_active ? 
            '<span class="status-badge status-active">Activo</span>' : 
            '<span class="status-badge status-inactive">Inactivo</span>';
        
        return `
            <div class="table-row" style="grid-template-columns: 0.5fr 2fr 1fr 1fr 1fr 1fr 1fr;">
                <div>${product.id}</div>
                <div style="font-weight: 600;">${product.name} ${statusBadge}</div>
                <div style="text-transform: capitalize;">${product.category}</div>
                <div style="color: ${stockColor}; font-weight: 600;">${product.stock}</div>
                <div>$${parseFloat(product.price).toFixed(2)}</div>
                <div>${product.sold_units}</div>
                <div style="color: #27ae60; font-weight: 600;">$${parseFloat(product.total_revenue).toFixed(2)}</div>
            </div>
        `;
    }).join('');
}

// Download report as PDF (simplified version - prints the page)
function downloadReport() {
    console.log('📥 Intentando descargar reporte...');
    console.log('currentReportData:', currentReportData);
    
    if (!currentReportData) {
        console.error('❌ No hay datos de reporte cargados');
        alert('⚠️ Primero debes cargar un reporte (Semanal o Mensual) antes de descargarlo.\n\nHaz clic en "Semanal (7 días)" o "Mensual (30 días)" y luego intenta descargar.');
        showNotification('Primero carga un reporte (Semanal o Mensual)', 'warning');
        return;
    }
    
    console.log('✅ Datos disponibles, generando PDF...');
    showNotification('Preparando reporte para descarga...', 'info');
    
    // Create a printable version
    const reportWindow = window.open('', '_blank');
    const periodText = currentReportPeriod === 'weekly' ? 'Semanal (7 días)' : 'Mensual (30 días)';
    const currentDate = new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    reportWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Reporte de Inventario - ${periodText}</title>
            <style>
                @page {
                    margin: 2cm 1.5cm;
                }
                body { 
                    font-family: Arial, sans-serif; 
                    padding: 30px 40px; 
                    max-width: 1200px; 
                    margin: 0 auto;
                    box-sizing: border-box;
                }
                h1 { 
                    color: #667eea; 
                    border-bottom: 3px solid #667eea; 
                    padding-bottom: 15px;
                    margin-top: 0;
                    margin-bottom: 20px;
                    text-align: center;
                }
                h2 { 
                    color: #764ba2; 
                    margin-top: 40px;
                    margin-bottom: 20px;
                    page-break-after: avoid;
                    break-after: avoid;
                    padding-top: 10px;
                }
                .header-info { 
                    background: #f8f9fa; 
                    padding: 20px; 
                    border-radius: 8px; 
                    margin-bottom: 30px;
                    text-align: center;
                }
                .stats { 
                    display: grid; 
                    grid-template-columns: repeat(3, 1fr); 
                    gap: 20px; 
                    margin: 30px 0;
                    page-break-inside: avoid;
                    break-inside: avoid;
                }
                .stat-box { 
                    background: #667eea; 
                    color: white; 
                    padding: 20px; 
                    border-radius: 8px; 
                    text-align: center;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .stat-number { 
                    font-size: 2.2rem; 
                    font-weight: bold;
                    margin-bottom: 5px;
                }
                .stat-label { 
                    font-size: 0.95rem; 
                    opacity: 0.9; 
                }
                .section-container {
                    page-break-inside: avoid;
                    break-inside: avoid;
                    margin-bottom: 40px;
                }
                table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin: 20px 0;
                    page-break-inside: avoid;
                    break-inside: avoid;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                }
                th { 
                    background: #667eea; 
                    color: white; 
                    padding: 14px; 
                    text-align: left;
                    font-weight: 600;
                }
                td { 
                    padding: 12px; 
                    border-bottom: 1px solid #e0e0e0; 
                }
                tr:hover { 
                    background: #f8f9fa; 
                }
                tr:last-child td {
                    border-bottom: none;
                }
                .low-stock { 
                    color: #e74c3c; 
                    font-weight: bold; 
                }
                .medium-stock { 
                    color: #f39c12; 
                    font-weight: bold; 
                }
                .good-stock { 
                    color: #27ae60; 
                    font-weight: bold; 
                }
                @media print {
                    .no-print { display: none; }
                    body { 
                        padding: 0;
                        margin: 0;
                    }
                    h1 {
                        margin-top: 0;
                    }
                    .section-container {
                        margin-bottom: 30px;
                    }
                }
            </style>
        </head>
        <body>
            <div class="header-info">
                <h1>📊 Reporte de Inventario<br><span style="font-size: 0.7em; color: #764ba2;">Tennis Club</span></h1>
                <p style="margin: 5px 0;"><strong>Período:</strong> ${periodText}</p>
                <p style="margin: 5px 0;"><strong>Fecha de generación:</strong> ${currentDate}</p>
            </div>
            
            <h2>Resumen General</h2>
            <div class="stats">
                <div class="stat-box">
                    <div class="stat-number">${currentReportData.summary.total_products}</div>
                    <div class="stat-label">Total Productos</div>
                </div>
                <div class="stat-box">
                    <div class="stat-number">${currentReportData.summary.total_stock}</div>
                    <div class="stat-label">Stock Total</div>
                </div>
                <div class="stat-box">
                    <div class="stat-number">${currentReportData.summary.total_sold}</div>
                    <div class="stat-label">Unidades Vendidas</div>
                </div>
                <div class="stat-box">
                    <div class="stat-number">$${parseFloat(currentReportData.summary.total_revenue).toFixed(2)}</div>
                    <div class="stat-label">Ingresos Totales</div>
                </div>
                <div class="stat-box">
                    <div class="stat-number">${currentReportData.summary.low_stock_count}</div>
                    <div class="stat-label">Productos Bajo Stock</div>
                </div>
                <div class="stat-box">
                    <div class="stat-number">${currentReportData.summary.out_of_stock_count}</div>
                    <div class="stat-label">Sin Stock</div>
                </div>
            </div>
            
            <div class="section-container">
                <h2>🏆 Top 5 Productos Más Vendidos</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Posición</th>
                            <th>Producto</th>
                            <th>Categoría</th>
                            <th>Unidades Vendidas</th>
                            <th>Ingresos</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${currentReportData.top_products.map((p, i) => `
                            <tr>
                                <td>${i + 1}</td>
                                <td>${p.name}</td>
                                <td style="text-transform: capitalize;">${p.category}</td>
                                <td>${p.sold_units}</td>
                                <td>$${parseFloat(p.total_revenue).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            
            <div class="section-container">
                <h2>⚠️ Productos con Bajo Stock</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Categoría</th>
                            <th>Stock Actual</th>
                            <th>Precio</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${currentReportData.low_stock_products.length > 0 ? 
                            currentReportData.low_stock_products.map(p => `
                                <tr>
                                    <td>${p.name}</td>
                                    <td style="text-transform: capitalize;">${p.category}</td>
                                    <td class="${p.stock < 5 ? 'low-stock' : 'medium-stock'}">${p.stock}</td>
                                    <td>$${parseFloat(p.price).toFixed(2)}</td>
                                </tr>
                            `).join('') : 
                            '<tr><td colspan="4" style="text-align: center;">✅ Todos los productos tienen stock suficiente</td></tr>'
                        }
                    </tbody>
                </table>
            </div>
            
            <div class="section-container">
                <h2>📈 Ventas por Categoría</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Categoría</th>
                            <th>Unidades Vendidas</th>
                            <th>Ingresos</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${currentReportData.category_sales.map(c => `
                            <tr>
                                <td style="text-transform: capitalize;">${c.category}</td>
                                <td>${c.units_sold}</td>
                                <td>$${parseFloat(c.revenue).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            
            <div class="section-container" style="page-break-before: always;">
                <h2>📦 Inventario Completo</h2>
                <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Producto</th>
                        <th>Categoría</th>
                        <th>Stock</th>
                        <th>Precio</th>
                        <th>Vendidas</th>
                        <th>Ingresos</th>
                    </tr>
                </thead>
                <tbody>
                    ${currentReportData.all_products.map(p => `
                        <tr>
                            <td>${p.id}</td>
                            <td>${p.name}</td>
                            <td style="text-transform: capitalize;">${p.category}</td>
                            <td class="${p.stock === 0 ? 'low-stock' : p.stock < 10 ? 'medium-stock' : 'good-stock'}">${p.stock}</td>
                            <td>$${parseFloat(p.price).toFixed(2)}</td>
                            <td>${p.sold_units}</td>
                            <td>$${parseFloat(p.total_revenue).toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            </div>
            
            <div class="no-print" style="background: #fff3cd; border: 2px solid #ffc107; padding: 20px; border-radius: 10px; margin: 30px 0; text-align: center;">
                <h3 style="color: #856404; margin-top: 0;">
                    <i style="font-size: 2rem;">📥</i><br>
                    Cómo Guardar Este Reporte como PDF
                </h3>
                <ol style="text-align: left; max-width: 600px; margin: 20px auto; font-size: 1rem; line-height: 1.8;">
                    <li>Haz clic en el botón <strong>"🖨️ Imprimir"</strong> de abajo</li>
                    <li>En el diálogo que aparece, selecciona <strong>"Guardar como PDF"</strong> como destino/impresora</li>
                    <li>Haz clic en <strong>"Guardar"</strong> y elige dónde guardarlo</li>
                    <li>¡Listo! Tu reporte está guardado como PDF</li>
                </ol>
                <div style="margin-top: 20px;">
                    <button onclick="window.print()" style="background: #667eea; color: white; border: none; padding: 15px 40px; border-radius: 8px; cursor: pointer; font-size: 1.1rem; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        🖨️ Imprimir / Guardar como PDF
                    </button>
                    <button onclick="window.close()" style="background: #6c757d; color: white; border: none; padding: 15px 40px; border-radius: 8px; cursor: pointer; font-size: 1.1rem; margin-left: 10px;">
                        ❌ Cerrar
                    </button>
                </div>
            </div>
        </body>
        </html>
    `);
    
    reportWindow.document.close();
    
    // Auto-abrir el diálogo de impresión después de que la página cargue
    reportWindow.onload = function() {
        // Pequeño delay para asegurar que todo el contenido esté renderizado
        setTimeout(() => {
            reportWindow.print();
        }, 500);
    };
    
    showNotification('✅ Reporte abierto - Se abrirá el diálogo de impresión automáticamente', 'success');
}

// ============================================================================
// LOSSES FUNCTIONALITY (Índice de Pérdida de Inventario)
// ============================================================================

// Load loss index for dashboard
async function loadLossIndexForDashboard() {
    try {
        const response = await fetch('api/losses.php?stats=true');
        const data = await response.json();
        
        if (data.error) {
            document.getElementById('lossIndex').textContent = 'N/A';
            return;
        }
        
        document.getElementById('lossIndex').textContent = `${data.loss_index}%`;
        console.log(`   Índice de Pérdida: ${data.loss_index}%`);
    } catch (error) {
        console.error('Error loading loss index:', error);
        document.getElementById('lossIndex').textContent = 'Error';
    }
}

// Load loss statistics
async function loadLossStats() {
    try {
        console.log('📊 Cargando estadísticas de pérdidas...');
        const response = await fetch('api/losses.php?stats=true');
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        // Update main stats
        document.getElementById('lossIndexDetail').textContent = `${data.loss_index}%`;
        document.getElementById('totalIncidents').textContent = data.total_incidents;
        document.getElementById('totalQuantityLost').textContent = data.total_quantity_lost;
        document.getElementById('totalValueLost').textContent = `$${parseFloat(data.total_value_lost).toFixed(2)}`;
        
        // Display losses by type
        displayLossesByType(data.by_type);
        
        // Display top affected products
        displayTopAffectedProducts(data.top_affected_products);
        
        console.log('✅ Estadísticas de pérdidas cargadas');
    } catch (error) {
        console.error('Error loading loss stats:', error);
        showNotification('Error al cargar estadísticas de pérdidas', 'error');
    }
}

// Display losses by type
function displayLossesByType(types) {
    const container = document.getElementById('lossesByType');
    
    if (!types || types.length === 0) {
        container.innerHTML = '<div style="padding: 1rem; color: white; text-align: center;">✅ No hay pérdidas registradas</div>';
        return;
    }
    
    const typeNames = {
        'robo': '🚨 Robo',
        'deterioro': '📦 Deterioro/Daño',
        'error_registro': '❌ Error de Registro',
        'otro': '❓ Otro'
    };
    
    container.innerHTML = types.map(type => `
        <div class="table-row" style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr;">
            <div style="font-weight: 600;">${typeNames[type.loss_type] || type.loss_type}</div>
            <div>${type.incidents} incidentes</div>
            <div>${type.quantity} unidades</div>
            <div style="color: #e74c3c; font-weight: 600;">$${parseFloat(type.value_lost).toFixed(2)}</div>
        </div>
    `).join('');
}

// Display top affected products
function displayTopAffectedProducts(products) {
    const container = document.getElementById('topAffectedProducts');
    
    if (!products || products.length === 0) {
        container.innerHTML = '<div style="padding: 1rem; color: white; text-align: center;">✅ No hay productos afectados</div>';
        return;
    }
    
    container.innerHTML = products.map((product, index) => `
        <div class="table-row" style="display: grid; grid-template-columns: 50px 2fr 1fr 1fr 1fr;">
            <div style="font-size: 1.2rem;">${index + 1}</div>
            <div style="font-weight: 600;">${product.name}</div>
            <div style="text-transform: capitalize;">${product.category}</div>
            <div style="color: #f39c12;">${product.total_lost} perdidas</div>
            <div style="color: #e74c3c; font-weight: 600;">$${parseFloat(product.value_lost).toFixed(2)}</div>
        </div>
    `).join('');
}

// Load losses list
async function loadLosses() {
    try {
        console.log('📋 Cargando historial de pérdidas...');
        const response = await fetch('api/losses.php');
        const losses = await response.json();
        
        if (Array.isArray(losses)) {
            displayLosses(losses);
            await loadProductsForLossForm();
        } else {
            throw new Error('Formato de respuesta inválido');
        }
    } catch (error) {
        console.error('Error loading losses:', error);
        showNotification('Error al cargar pérdidas', 'error');
    }
}

// Load products for loss form dropdown
async function loadProductsForLossForm() {
    try {
        const response = await fetch('api/products.php');
        const products = await response.json();
        
        const select = document.getElementById('lossProduct');
        select.innerHTML = '<option value="">Seleccione un producto...</option>';
        
        products.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = `${product.name} (Stock: ${product.stock})`;
            option.dataset.price = product.price;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading products for form:', error);
    }
}

// Display losses in table
function displayLosses(losses) {
    const tbody = document.getElementById('lossesTableBody');
    
    if (losses.length === 0) {
        tbody.innerHTML = '<div style="padding: 2rem; color: white; text-align: center;"><i class="fas fa-check-circle" style="font-size: 3rem; color: #27ae60; display: block; margin-bottom: 1rem;"></i><p>✅ No hay pérdidas registradas</p></div>';
        return;
    }
    
    const typeNames = {
        'robo': '🚨 Robo',
        'deterioro': '📦 Deterioro',
        'error_registro': '❌ Error',
        'otro': '❓ Otro'
    };
    
    tbody.innerHTML = '';
    losses.forEach(loss => {
        const row = document.createElement('div');
        row.className = 'table-row';
        row.style.gridTemplateColumns = '0.5fr 2fr 1fr 1fr 1fr 2fr 1fr 1fr';
        row.innerHTML = `
            <div>${loss.id}</div>
            <div>${loss.product_name}</div>
            <div style="color: #e74c3c; font-weight: 600;">${loss.quantity}</div>
            <div>${typeNames[loss.loss_type] || loss.loss_type}</div>
            <div style="color: #e74c3c; font-weight: 600;">$${parseFloat(loss.loss_value).toFixed(2)}</div>
            <div style="font-size: 0.9rem;">${loss.reason || '-'}</div>
            <div>${new Date(loss.loss_date).toLocaleDateString()}</div>
            <div class="action-buttons">
                <button class="action-btn delete-btn" onclick="deleteLoss(${loss.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        tbody.appendChild(row);
    });
}

// Handle loss form submission
async function handleLossSubmit(e) {
    e.preventDefault();
    
    const productId = document.getElementById('lossProduct').value;
    const quantity = parseInt(document.getElementById('lossQuantity').value);
    const lossType = document.getElementById('lossType').value;
    const reason = document.getElementById('lossReason').value;
    const reduceStock = document.getElementById('reduceStock').checked;
    
    if (!productId) {
        showNotification('Selecciona un producto', 'warning');
        return;
    }
    
    try {
        console.log('📝 Registrando pérdida...');
        
        const response = await fetch('api/losses.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                product_id: productId,
                quantity: quantity,
                loss_type: lossType,
                reason: reason,
                reported_by: sessionStorage.getItem('tennisClubUser'),
                reduce_stock: reduceStock
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('✅ Pérdida registrada exitosamente', 'success');
            clearLossForm();
            loadLosses();
            loadLossStats();
            loadDashboardData();
        } else {
            throw new Error(data.error || 'Error al registrar pérdida');
        }
    } catch (error) {
        console.error('Error registering loss:', error);
        showNotification('Error al registrar pérdida: ' + error.message, 'error');
    }
}

// Delete loss
async function deleteLoss(lossId) {
    if (confirm('¿Estás seguro de que quieres eliminar este registro de pérdida?')) {
        try {
            console.log('🗑️ Eliminando pérdida ID:', lossId);
            
            const response = await fetch(`api/losses.php?id=${lossId}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (data.success) {
                showNotification('✅ Pérdida eliminada', 'success');
                loadLosses();
                loadLossStats();
                loadDashboardData();
            } else {
                throw new Error(data.error || 'Error al eliminar');
            }
        } catch (error) {
            console.error('Error deleting loss:', error);
            showNotification('Error al eliminar pérdida', 'error');
        }
    }
}

// Clear loss form
function clearLossForm() {
    document.getElementById('lossForm').reset();
    document.getElementById('lossProduct').value = '';
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

