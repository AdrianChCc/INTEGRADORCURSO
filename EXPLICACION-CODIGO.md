# 📚 EXPLICACIÓN COMPLETA DEL CÓDIGO - TENNIS CLUB

## 📖 ÍNDICE

1. [Archivos PHP Backend](#archivos-php-backend)
2. [Archivos JavaScript Frontend](#archivos-javascript-frontend)
3. [Archivos HTML](#archivos-html)
4. [Archivos CSS](#archivos-css)
5. [APIs REST](#apis-rest)

---

## 🔧 ARCHIVOS PHP BACKEND

### 📄 `init-database.php`

**PROPÓSITO:** Inicializar la base de datos la primera vez

**QUÉ HACE:**
1. **Se conecta a MySQL** usando PDO (PHP Data Objects)
2. **Crea la base de datos** `tennis_club_db`
3. **Crea 4 tablas:**
   - `users`: Usuarios del sistema (admin y regulares)
   - `products`: Productos del catálogo
   - `purchases`: Registro de compras
   - `inquiries`: Consultas del formulario de contacto
4. **Inserta el usuario admin** por defecto (usuario: `admin`, contraseña: `0000`)
5. **Inserta 12 productos** del catálogo

**CUÁNDO USARLO:** Solo la primera vez o para reiniciar la BD

**CÓDIGO CLAVE:**
```php
// Conectar a MySQL
$pdo = new PDO("mysql:host=localhost;charset=utf8mb4", 'root', '');

// Crear base de datos
$pdo->exec("CREATE DATABASE IF NOT EXISTS tennis_club_db");

// Crear tabla users con campos:
CREATE TABLE users (
    id,              // ID único auto-incremental
    full_name,       // Nombre completo
    email,           // Email único
    username,        // Nombre de usuario único
    password,        // Contraseña encriptada con hash
    role,            // 'admin' o 'user'
    created_at       // Fecha de registro
)
```

---

### 📄 `database-config.php`

**PROPÓSITO:** Configuración de conexión a la base de datos

**QUÉ HACE:**
- Establece la conexión PDO reutilizable
- Configura el modo de errores
- Define la codificación de caracteres

**CÓDIGO CLAVE:**
```php
// Crear conexión global a la BD
$pdo = new PDO(
    "mysql:host=localhost;dbname=tennis_club_db;charset=utf8mb4",
    'root',  // Usuario
    ''       // Contraseña
);

// Activar excepciones en caso de error
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
```

**NOTA:** Este archivo es incluido por todos los archivos de la API

---

### 📄 `update-products.php`

**PROPÓSITO:** Actualizar o sincronizar los 12 productos del catálogo

**QUÉ HACE:**
1. Verifica si hay más de 12 productos (productos legacy)
2. Si encuentra productos legacy, limpia la tabla
3. Sincroniza los 12 productos del catálogo 2024
4. Actualiza nombres, precios, descripciones, imágenes, stock

**CUÁNDO USARLO:**
- Cuando quieres actualizar los productos
- Para sincronizar el catálogo con la BD

**CÓDIGO CLAVE:**
```php
// Verificar si el producto existe por nombre
$stmt = $pdo->prepare("SELECT id FROM products WHERE name = ?");
$stmt->execute([$productName]);

if ($stmt->fetchColumn()) {
    // Actualizar producto existente
    UPDATE products SET price = ?, stock = ? WHERE name = ?
} else {
    // Insertar nuevo producto
    INSERT INTO products (name, price, description, image_url, category, stock)
    VALUES (?, ?, ?, ?, ?, ?)
}
```

---

## ⚡ ARCHIVOS JAVASCRIPT FRONTEND

### 📄 `js/database.js`

**PROPÓSITO:** Clase JavaScript para comunicarse con las APIs PHP

**QUÉ HACE:**
- Define la clase `DatabaseAPI`
- Proporciona métodos para hacer peticiones HTTP (fetch) a las APIs
- Maneja errores de red y respuestas del servidor

**FUNCIONES PRINCIPALES:**

```javascript
class DatabaseAPI {
    constructor() {
        this.baseURL = 'api/';  // Ruta base de las APIs
    }

    // AUTENTICACIÓN
    async login(username, password) {
        // Envía credenciales al servidor
        // Retorna datos del usuario si es correcto
    }

    // USUARIOS
    async getUsers() {
        // Obtiene todos los usuarios de la BD
    }
    
    async createUser(userData) {
        // Crea un nuevo usuario
    }
    
    async updateUser(id, userData) {
        // Actualiza datos de un usuario
    }

    // PRODUCTOS
    async getProducts() {
        // Obtiene todos los productos
    }
    
    async createProduct(productData) {
        // Crea un nuevo producto
    }
    
    async updateProduct(id, productData) {
        // Actualiza un producto
    }
    
    async deleteProduct(id) {
        // Elimina un producto
    }

    // COMPRAS
    async getPurchases(userId) {
        // Obtiene las compras de un usuario
    }
    
    async createPurchase(purchaseData) {
        // Registra una nueva compra
    }

    // CONSULTAS
    async getInquiries(userId) {
        // Obtiene las consultas de un usuario
    }
    
    async createInquiry(inquiryData) {
        // Crea una nueva consulta
    }
}

// Crear instancia global
window.dbAPI = new DatabaseAPI();
```

**CÓMO FUNCIONA:**
1. Hace peticiones `fetch()` a las APIs PHP
2. Convierte las respuestas de JSON a objetos JavaScript
3. Maneja errores y los reporta a la consola

---

### 📄 `script.js`

**PROPÓSITO:** Lógica principal del sitio web (index.html)

**QUÉ HACE:**

#### **1. CARRITO DE COMPRAS**
```javascript
let cart = [];  // Array para almacenar productos del carrito

// Agregar producto al carrito
function addToCart(productId, name, price, image) {
    // Buscar si el producto ya está en el carrito
    const existingItem = cart.find(item => item.productId === productId);
    
    if (existingItem) {
        // Si existe, aumentar cantidad
        existingItem.quantity += 1;
    } else {
        // Si no existe, agregarlo
        cart.push({
            productId: productId,
            name: name,
            price: price,
            image: image,
            quantity: 1
        });
    }
    
    // Guardar en localStorage
    localStorage.setItem('tennisClubCart', JSON.stringify(cart));
    
    // Actualizar la interfaz
    updateCartCount();
    loadCartItems();
}
```

#### **2. CHECKOUT (FINALIZAR COMPRA)**
```javascript
async function checkout() {
    // 1. Verificar que el usuario esté logueado
    const username = sessionStorage.getItem('tennisClubUser');
    const userId = sessionStorage.getItem('tennisClubUserId');
    
    if (!username) {
        alert('Debe iniciar sesión');
        return;
    }
    
    // 2. Guardar cada producto en la BD
    for (const item of cart) {
        await window.dbAPI.createPurchase({
            user_id: userId,
            product_id: item.productId,
            quantity: item.quantity,
            price: item.price
        });
        
        // 3. Actualizar el stock
        await window.dbAPI.updateProduct(item.productId, {
            stock: item.stock - item.quantity
        });
    }
    
    // 4. Vaciar el carrito
    cart = [];
    localStorage.setItem('tennisClubCart', JSON.stringify(cart));
    
    alert('¡Compra realizada exitosamente!');
}
```

#### **3. FORMULARIO DE CONTACTO**
```javascript
// Guardar consulta en la base de datos
async function saveInquiry(serviceType, message) {
    const userId = sessionStorage.getItem('tennisClubUserId');
    
    if (window.dbAPI && userId) {
        await window.dbAPI.createInquiry({
            user_id: userId,
            service_type: serviceType,
            message: message,
            status: 'new'
        });
    }
}
```

#### **4. ANIMACIONES Y EFECTOS**
```javascript
// Intersection Observer para animaciones cuando elementos entran en vista
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
        }
    });
});
```

---

### 📄 `login-script.js`

**PROPÓSITO:** Maneja el proceso de inicio de sesión

**FLUJO DEL LOGIN:**

```javascript
// 1. CAPTURAR CREDENCIALES
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();  // Evitar que se recargue la página
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // 2. INTENTAR LOGIN EN LA BASE DE DATOS
    const response = await window.dbAPI.login(username, password);
    
    if (response.success) {
        // 3. GUARDAR SESIÓN
        sessionStorage.setItem('tennisClubAuth', 'true');
        sessionStorage.setItem('tennisClubUser', username);
        sessionStorage.setItem('tennisClubUserId', response.user.id);
        sessionStorage.setItem('tennisClubUserRole', response.user.role);
        
        // 4. REDIRIGIR
        window.location.href = 'index.html';
    } else {
        // 5. MOSTRAR ERROR
        showError('Usuario o contraseña incorrectos');
    }
});
```

**CONCEPTOS CLAVE:**
- `sessionStorage`: Almacena datos temporales mientras la pestaña está abierta
- `password_hash`: Las contraseñas nunca se guardan en texto plano

---

### 📄 `register-script-database.js`

**PROPÓSITO:** Maneja el registro de nuevos usuarios

**FLUJO DEL REGISTRO:**

```javascript
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // 1. OBTENER DATOS DEL FORMULARIO
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // 2. ENVIAR A LA API
    const response = await fetch('api/auth.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    
    if (data.success) {
        // 3. AUTO-LOGIN DESPUÉS DEL REGISTRO
        sessionStorage.setItem('tennisClubAuth', 'true');
        sessionStorage.setItem('tennisClubUser', username);
        sessionStorage.setItem('tennisClubUserId', data.user_id);
        sessionStorage.setItem('tennisClubUserRole', 'user');
        
        // 4. REDIRIGIR AL SITIO
        window.location.href = 'index.html';
    } else {
        showError(data.error);
    }
});
```

---

### 📄 `profile-script.js`

**PROPÓSITO:** Maneja el perfil del usuario

**FUNCIONES PRINCIPALES:**

```javascript
// 1. CARGAR DATOS DEL USUARIO
async function loadUserDataFromDatabase() {
    const userName = sessionStorage.getItem('tennisClubUser');
    
    // Obtener usuario de la BD
    const users = await window.dbAPI.getUsers();
    const user = users.find(u => u.username === userName);
    
    // Mostrar en la interfaz
    document.getElementById('userName').textContent = user.full_name;
    document.getElementById('userEmail').textContent = user.email;
}

// 2. CARGAR COMPRAS DEL USUARIO
async function loadUserPurchasesFromDatabase() {
    const userId = sessionStorage.getItem('tennisClubUserId');
    
    // Obtener compras de la BD
    const purchases = await window.dbAPI.getPurchases(userId);
    
    // Mostrar en la interfaz
    purchases.forEach(purchase => {
        // Renderizar cada compra
    });
}

// 3. CARGAR CONSULTAS DEL USUARIO
async function loadUserInquiriesFromDatabase() {
    const userId = sessionStorage.getItem('tennisClubUserId');
    
    // Obtener consultas de la BD
    const inquiries = await window.dbAPI.getInquiries(userId);
    
    // Mostrar en la interfaz
    inquiries.forEach(inquiry => {
        // Renderizar cada consulta
    });
}

// 4. EDITAR PERFIL
async function editProfile() {
    // Mostrar modal con formulario
    // Guardar cambios en la BD
    await window.dbAPI.updateUser(userId, {
        full_name: newName,
        email: newEmail,
        phone: newPhone
    });
}
```

---

### 📄 `admin-panel.js`

**PROPÓSITO:** Gestión del panel de administración

**FUNCIONES PRINCIPALES:**

```javascript
// 1. CARGAR USUARIOS
async function loadUsers() {
    const users = await window.dbAPI.getUsers();
    
    // Mostrar en tabla
    users.forEach(user => {
        // Renderizar fila con usuario
        // Botones: Editar, Eliminar
    });
}

// 2. CARGAR PRODUCTOS
async function loadProducts() {
    const products = await window.dbAPI.getProducts();
    
    // Mostrar en tabla
    products.forEach(product => {
        // Renderizar fila con producto
        // Botones: Editar, Eliminar
    });
}

// 3. CREAR/EDITAR PRODUCTO
async function handleProductSubmit(e) {
    e.preventDefault();
    
    const productData = {
        name: document.getElementById('productName').value,
        description: document.getElementById('productDescription').value,
        price: document.getElementById('productPrice').value,
        stock: document.getElementById('productStock').value
    };
    
    if (editingProduct) {
        // Actualizar
        await window.dbAPI.updateProduct(editingProduct, productData);
    } else {
        // Crear nuevo
        await window.dbAPI.createProduct(productData);
    }
    
    loadProducts();  // Recargar tabla
}

// 4. ELIMINAR PRODUCTO
async function deleteProduct(productId) {
    if (confirm('¿Está seguro?')) {
        await window.dbAPI.deleteProduct(productId);
        loadProducts();  // Recargar tabla
    }
}

// 5. CARGAR ESTADÍSTICAS
async function loadDashboardData() {
    const users = await window.dbAPI.getUsers();
    const products = await window.dbAPI.getProducts();
    const purchases = await window.dbAPI.getPurchases();
    const inquiries = await window.dbAPI.getInquiries();
    
    // Mostrar números en dashboard
    document.getElementById('totalUsers').textContent = users.length;
    document.getElementById('totalProducts').textContent = products.length;
    document.getElementById('totalPurchases').textContent = purchases.length;
    document.getElementById('totalInquiries').textContent = inquiries.length;
}
```

---

## 📡 APIS REST (PHP)

### 📄 `api/auth.php`

**PROPÓSITO:** Autenticación (login y registro)

**ENDPOINTS:**

#### **LOGIN**
```php
// REQUEST
POST api/auth.php
{
    "action": "login",
    "username": "usuario",
    "password": "contraseña"
}

// PROCESO
1. Buscar usuario en BD por username
2. Verificar contraseña con password_verify()
3. Retornar datos del usuario

// RESPONSE (ÉXITO)
{
    "success": true,
    "user": {
        "id": 1,
        "username": "usuario",
        "full_name": "Nombre Completo",
        "email": "email@example.com",
        "role": "user"
    }
}

// RESPONSE (ERROR)
{
    "error": "Usuario o contraseña incorrectos"
}
```

#### **REGISTRO**
```php
// REQUEST
POST api/auth.php
{
    "action": "register",
    "full_name": "Nombre",
    "email": "email@example.com",
    "phone": "555-1234",
    "username": "usuario",
    "password": "contraseña"
}

// PROCESO
1. Validar que no exista el username o email
2. Encriptar contraseña con password_hash()
3. Insertar en BD
4. Retornar ID del nuevo usuario

// RESPONSE (ÉXITO)
{
    "success": true,
    "message": "Usuario registrado",
    "user_id": 5
}
```

---

### 📄 `api/users.php`

**PROPÓSITO:** CRUD de usuarios

**ENDPOINTS:**

```php
// OBTENER TODOS LOS USUARIOS
GET api/users.php
Response: Array de usuarios

// OBTENER UN USUARIO
GET api/users.php?id=5
Response: Datos del usuario 5

// CREAR USUARIO
POST api/users.php
Body: { full_name, email, phone, username, password, role }

// ACTUALIZAR USUARIO
PUT api/users.php?id=5
Body: { full_name, email, phone }

// ELIMINAR USUARIO
DELETE api/users.php?id=5
```

---

### 📄 `api/products.php`

**PROPÓSITO:** CRUD de productos

**ENDPOINTS:**

```php
// OBTENER TODOS LOS PRODUCTOS
GET api/products.php
Response: Array de productos con: id, name, description, price, image_url, stock

// OBTENER UN PRODUCTO
GET api/products.php?id=3
Response: Datos del producto 3

// CREAR PRODUCTO
POST api/products.php
Body: { name, description, price, image_url, category, stock }

// ACTUALIZAR PRODUCTO
PUT api/products.php?id=3
Body: { name, price, stock, ... }

// ELIMINAR PRODUCTO
DELETE api/products.php?id=3
```

---

### 📄 `api/purchases.php`

**PROPÓSITO:** Registro de compras

**ENDPOINTS:**

```php
// OBTENER COMPRAS
GET api/purchases.php
Response: Array de todas las compras

// OBTENER COMPRAS DE UN USUARIO
GET api/purchases.php?user_id=5
Response: Compras del usuario 5

// CREAR COMPRA
POST api/purchases.php
Body: {
    user_id: 5,
    product_id: 3,
    quantity: 2,
    price: 54.99
}

// Calcula automáticamente: total = quantity * price
```

---

### 📄 `api/inquiries.php`

**PROPÓSITO:** Gestión de consultas/contacto

**ENDPOINTS:**

```php
// OBTENER TODAS LAS CONSULTAS
GET api/inquiries.php
Response: Array de consultas

// OBTENER CONSULTAS DE UN USUARIO
GET api/inquiries.php?user_id=5
Response: Consultas del usuario 5

// CREAR CONSULTA
POST api/inquiries.php
Body: {
    user_id: 5,
    service_type: "clases-grupales",
    message: "Quiero información",
    status: "new"
}

// ACTUALIZAR ESTADO DE CONSULTA
PUT api/inquiries.php?id=10
Body: {
    status: "completed"
}
```

---

## 🎨 ARCHIVOS HTML

### 📄 `index.html`

**ESTRUCTURA:**

```html
<!DOCTYPE html>
<html>
<head>
    <!-- Estilos, fuentes, meta tags -->
</head>
<body>
    <!-- 1. HEADER (Navegación) -->
    <header>
        <nav>Links a: Inicio, Servicios, Catálogo, Contacto</nav>
        <div>Botones: Login, Carrito</div>
    </header>
    
    <!-- 2. HERO (Sección principal) -->
    <section id="hero">
        <h1>Título principal</h1>
        <p>Descripción</p>
        <button>Call to action</button>
    </section>
    
    <!-- 3. SERVICIOS -->
    <section id="services">
        <!-- Cards con los servicios ofrecidos -->
    </section>
    
    <!-- 4. CATÁLOGO DE PRODUCTOS -->
    <section id="catalog">
        <div id="productsContainer">
            <!-- Los productos se cargan dinámicamente con JS -->
        </div>
    </section>
    
    <!-- 5. FORMULARIO DE CONTACTO -->
    <section id="contact">
        <form class="form">
            <input id="serviceType">  <!-- Tipo de servicio -->
            <textarea>                <!-- Mensaje -->
            <button>Enviar</button>
        </form>
    </section>
    
    <!-- 6. MODAL DEL CARRITO -->
    <div id="cartModal">
        <div id="cartItems"><!-- Items del carrito --></div>
        <div id="cartTotal"><!-- Total --></div>
        <button onclick="checkout()">Finalizar Compra</button>
    </div>
    
    <!-- 7. SCRIPTS -->
    <script src="js/database.js"></script>  <!-- API -->
    <script src="script.js"></script>       <!-- Lógica -->
    
    <!-- 8. SCRIPT PARA CARGAR PRODUCTOS DINÁMICAMENTE -->
    <script>
        async function cargarProductosDinamicos() {
            // 1. Obtener productos de la BD
            const products = await window.dbAPI.getProducts();
            
            // 2. Generar HTML para cada producto
            const html = products.map(producto => `
                <div class="product-card">
                    <img src="${producto.image_url}">
                    <h3>${producto.name}</h3>
                    <p>${producto.description}</p>
                    <p>$${producto.price}</p>
                    <p>Stock: ${producto.stock}</p>
                    <button class="add-to-cart" 
                            data-product-id="${producto.id}"
                            data-name="${producto.name}"
                            data-price="${producto.price}">
                        Agregar al Carrito
                    </button>
                </div>
            `).join('');
            
            // 3. Insertar en el DOM
            document.getElementById('productsContainer').innerHTML = html;
        }
        
        // Cargar productos al iniciar
        cargarProductosDinamicos();
    </script>
</body>
</html>
```

---

### 📄 `login.html`

**ESTRUCTURA:**

```html
<body>
    <div class="login-card">
        <h2>Iniciar Sesión</h2>
        
        <form id="loginForm">
            <input type="text" id="username" placeholder="Usuario">
            <input type="password" id="password" placeholder="Contraseña">
            <button type="submit">Iniciar Sesión</button>
        </form>
        
        <p>¿No tienes cuenta? <a href="register.html">Regístrate</a></p>
    </div>
    
    <script src="js/database.js"></script>
    <script src="login-script.js"></script>
</body>
```

---

### 📄 `register.html`

**ESTRUCTURA:**

```html
<body>
    <div class="register-card">
        <h2>Crear Cuenta</h2>
        
        <form id="registerForm">
            <input id="fullName" placeholder="Nombre completo">
            <input id="email" placeholder="Email">
            <input id="phone" placeholder="Teléfono">
            <input id="username" placeholder="Usuario">
            <input id="password" type="password" placeholder="Contraseña">
            <button type="submit">Registrarse</button>
        </form>
        
        <p>¿Ya tienes cuenta? <a href="login.html">Inicia sesión</a></p>
    </div>
    
    <script src="js/database.js"></script>
    <script src="register-script-database.js"></script>
</body>
```

---

### 📄 `user-profile.html`

**ESTRUCTURA:**

```html
<body>
    <div class="profile-container">
        <!-- INFORMACIÓN DEL USUARIO -->
        <section class="user-info">
            <h2 id="userName">Nombre</h2>
            <p id="userEmail">Email</p>
            <button onclick="editProfile()">Editar Perfil</button>
        </section>
        
        <!-- ESTADÍSTICAS -->
        <div class="stats">
            <div>Compras: <span id="totalPurchases">0</span></div>
            <div>Consultas: <span id="totalInquiries">0</span></div>
        </div>
        
        <!-- MIS COMPRAS -->
        <section class="purchases">
            <h3>Mis Compras</h3>
            <div id="purchasesList">
                <!-- Se cargan dinámicamente -->
            </div>
        </section>
        
        <!-- MIS CONSULTAS -->
        <section class="inquiries">
            <h3>Mis Consultas</h3>
            <div id="inquiriesList">
                <!-- Se cargan dinámicamente -->
            </div>
        </section>
    </div>
    
    <script src="js/database.js"></script>
    <script src="profile-script.js"></script>
</body>
```

---

### 📄 `admin-panel.html`

**ESTRUCTURA:**

```html
<body>
    <div class="admin-container">
        <!-- NAVEGACIÓN -->
        <nav class="admin-nav">
            <button onclick="showSection('dashboard')">Dashboard</button>
            <button onclick="showSection('users')">Usuarios</button>
            <button onclick="showSection('products')">Productos</button>
            <button onclick="showSection('purchases')">Compras</button>
            <button onclick="showSection('inquiries')">Consultas</button>
        </nav>
        
        <!-- DASHBOARD -->
        <section id="dashboard">
            <div class="stat-card">
                <h3 id="totalUsers">0</h3>
                <p>Usuarios</p>
            </div>
            <div class="stat-card">
                <h3 id="totalProducts">0</h3>
                <p>Productos</p>
            </div>
            <!-- ... más estadísticas ... -->
        </section>
        
        <!-- USUARIOS -->
        <section id="users">
            <button onclick="showUserForm()">Nuevo Usuario</button>
            <table id="usersTable">
                <!-- Tabla con usuarios -->
            </table>
        </section>
        
        <!-- PRODUCTOS -->
        <section id="products">
            <button onclick="showProductForm()">Nuevo Producto</button>
            <table id="productsTable">
                <!-- Tabla con productos -->
            </table>
        </section>
        
        <!-- ... más secciones ... -->
    </div>
    
    <script src="js/database.js"></script>
    <script src="admin-panel.js"></script>
</body>
```

---

## 🎨 ARCHIVOS CSS

### 📄 `styles.css`

**ESTRUCTURA:**

```css
/* 1. VARIABLES GLOBALES */
:root {
    --primary-color: #00a8e8;
    --secondary-color: #007ea7;
    --text-color: #333;
    --background: #f5f5f5;
}

/* 2. ESTILOS GENERALES */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Poppins', sans-serif;
    color: var(--text-color);
}

/* 3. HEADER Y NAVEGACIÓN */
header {
    position: fixed;
    width: 100%;
    background: white;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

nav {
    display: flex;
    justify-content: space-between;
    padding: 1rem 2rem;
}

/* 4. HERO SECTION */
#hero {
    height: 100vh;
    display: flex;
    align-items: center;
    background: linear-gradient(135deg, #00a8e8, #007ea7);
    color: white;
}

/* 5. PRODUCT CARDS */
.product-card {
    background: white;
    border-radius: 15px;
    padding: 1.5rem;
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    transition: transform 0.3s;
}

.product-card:hover {
    transform: translateY(-10px);
}

/* 6. BOTONES */
.btn {
    padding: 0.75rem 2rem;
    border: none;
    border-radius: 25px;
    background: var(--primary-color);
    color: white;
    cursor: pointer;
    transition: all 0.3s;
}

.btn:hover {
    background: var(--secondary-color);
    transform: scale(1.05);
}

/* 7. MODAL DEL CARRITO */
#cartModal {
    position: fixed;
    right: -400px;
    top: 0;
    width: 400px;
    height: 100vh;
    background: white;
    box-shadow: -5px 0 15px rgba(0,0,0,0.2);
    transition: right 0.3s;
}

#cartModal.active {
    right: 0;
}

/* 8. RESPONSIVE */
@media (max-width: 768px) {
    nav {
        flex-direction: column;
    }
    
    .product-card {
        width: 100%;
    }
}
```

---

### 📄 `login-styles.css`

**ESTRUCTURA:**

```css
/* 1. FONDO ANIMADO */
body {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* 2. CARD DEL LOGIN */
.login-card {
    background: white;
    padding: 3rem;
    border-radius: 20px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    width: 100%;
    max-width: 400px;
}

/* 3. INPUTS */
input {
    width: 100%;
    padding: 1rem;
    margin: 0.5rem 0;
    border: 2px solid #e9ecef;
    border-radius: 10px;
    font-size: 1rem;
}

input:focus {
    outline: none;
    border-color: #667eea;
}

/* 4. BOTÓN DE SUBMIT */
button[type="submit"] {
    width: 100%;
    padding: 1rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    transition: transform 0.2s;
}

button[type="submit"]:hover {
    transform: translateY(-2px);
}

/* 5. MENSAJES DE ERROR */
.error-message {
    background: #ffebee;
    color: #c62828;
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
}

/* 6. ANIMACIONES */
@keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-10px); }
    75% { transform: translateX(10px); }
}

.shake {
    animation: shake 0.5s;
}
```

---

## 🔄 FLUJO COMPLETO DEL SISTEMA

### **FLUJO DE REGISTRO:**

```
1. Usuario va a register.html
2. Llena el formulario
3. register-script-database.js captura el submit
4. Hace POST a api/auth.php con action=register
5. auth.php verifica que no exista username/email
6. auth.php encripta la contraseña
7. auth.php inserta en tabla users
8. Retorna user_id
9. register-script-database.js guarda sesión en sessionStorage
10. Redirige a index.html
```

### **FLUJO DE LOGIN:**

```
1. Usuario va a login.html
2. Ingresa username y password
3. login-script.js captura el submit
4. Hace POST a api/auth.php con action=login
5. auth.php busca usuario en BD
6. auth.php verifica contraseña con password_verify()
7. Retorna datos del usuario
8. login-script.js guarda sesión en sessionStorage:
   - tennisClubAuth = 'true'
   - tennisClubUser = username
   - tennisClubUserId = user.id
   - tennisClubUserRole = 'admin' o 'user'
9. Redirige a index.html
```

### **FLUJO DE COMPRA:**

```
1. Usuario navega index.html
2. Ve el catálogo (cargado dinámicamente desde BD)
3. Hace clic en "Agregar al Carrito"
4. script.js agrega producto al array cart[]
5. script.js guarda cart en localStorage
6. Usuario hace clic en "Finalizar Compra"
7. script.js verifica que esté logueado
8. script.js hace POST a api/purchases.php por cada item
9. purchases.php inserta en tabla purchases
10. script.js hace PUT a api/products.php para actualizar stock
11. products.php reduce el stock
12. script.js vacía el carrito
13. Muestra mensaje de éxito
```

### **FLUJO DE CONSULTA:**

```
1. Usuario logueado va a formulario de contacto
2. Selecciona tipo de servicio
3. Escribe mensaje
4. Hace clic en "Enviar"
5. script.js captura el submit
6. script.js hace POST a api/inquiries.php
7. inquiries.php inserta en tabla inquiries con:
   - user_id (del sessionStorage)
   - service_type
   - message
   - status = 'new'
8. Retorna ID de la consulta
9. script.js muestra mensaje de éxito
```

### **FLUJO DEL ADMIN:**

```
1. Admin inicia sesión (admin / 0000)
2. Va a admin-panel.html
3. admin-panel.js verifica rol en sessionStorage
4. Si role === 'admin', permite acceso
5. admin-panel.js carga:
   - Usuarios de api/users.php
   - Productos de api/products.php
   - Compras de api/purchases.php
   - Consultas de api/inquiries.php
6. Muestra tablas con datos
7. Admin puede:
   - Crear/Editar/Eliminar productos
   - Ver/Editar/Eliminar usuarios
   - Ver compras
   - Ver/Actualizar estado de consultas
8. Cada acción hace petición a su API correspondiente
```

---

## 🔐 SEGURIDAD

### **ALMACENAMIENTO DE CONTRASEÑAS:**

```php
// NUNCA guardar contraseñas en texto plano
// INCORRECTO:
INSERT INTO users (password) VALUES ('12345')

// CORRECTO:
$hashedPassword = password_hash('12345', PASSWORD_DEFAULT);
// Resultado: $2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
INSERT INTO users (password) VALUES ('$2y$10$92IXUNpkjO0rOQ5...')

// VERIFICAR:
$isValid = password_verify('12345', $hashedPassword);  // true
```

### **PROTECCIÓN CONTRA SQL INJECTION:**

```php
// INCORRECTO (vulnerable):
$sql = "SELECT * FROM users WHERE username = '$username'";
// Si username = "'; DROP TABLE users; --" = ¡Desastre!

// CORRECTO (seguro):
$stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
$stmt->execute([$username]);
// PDO escapa automáticamente los caracteres peligrosos
```

### **VALIDACIÓN EN CLIENTE Y SERVIDOR:**

```javascript
// CLIENTE (JavaScript)
if (email.includes('@')) {
    // Enviar al servidor
}

// SERVIDOR (PHP)
if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
    // Insertar en BD
}

// NUNCA confiar solo en validación del cliente
// El usuario puede modificar el JavaScript
```

---

## 💾 ALMACENAMIENTO DE DATOS

### **sessionStorage vs localStorage:**

```javascript
// sessionStorage: Datos mientras la pestaña está abierta
sessionStorage.setItem('user', 'juan');
// Si cierras la pestaña, se borra

// localStorage: Datos permanentes
localStorage.setItem('cart', JSON.stringify(cart));
// Permanece incluso si cierras el navegador
```

### **Base de Datos vs Almacenamiento Local:**

```
localStorage/sessionStorage:
✅ Rápido (no requiere servidor)
✅ No requiere internet
❌ Solo del lado del cliente
❌ Máximo 5-10 MB
❌ No compartido entre dispositivos
❌ Fácil de manipular por el usuario

Base de Datos MySQL:
✅ Almacenamiento ilimitado
✅ Compartido entre dispositivos
✅ Seguro y confiable
✅ Datos consistentes
❌ Requiere servidor
❌ Requiere internet
```

---

## 🎯 CONCEPTOS CLAVE

### **1. PDO (PHP Data Objects)**
Forma moderna y segura de conectarse a bases de datos en PHP.

### **2. Prepared Statements**
Previene SQL Injection al separar código SQL de los datos.

### **3. password_hash / password_verify**
Funciones de PHP para encriptar y verificar contraseñas de forma segura.

### **4. fetch API**
Forma moderna de hacer peticiones HTTP en JavaScript (reemplaza XMLHttpRequest).

### **5. async/await**
Sintaxis moderna para manejar operaciones asíncronas (como peticiones a APIs).

### **6. sessionStorage**
Almacenamiento temporal del navegador (se borra al cerrar la pestaña).

### **7. localStorage**
Almacenamiento permanente del navegador.

### **8. JSON (JavaScript Object Notation)**
Formato de intercambio de datos entre JavaScript y PHP.

### **9. CRUD**
Create (Crear), Read (Leer), Update (Actualizar), Delete (Eliminar).

### **10. REST API**
Arquitectura para crear APIs web usando métodos HTTP (GET, POST, PUT, DELETE).

---

## 📚 GLOSARIO DE TÉRMINOS

- **Frontend:** Parte visible del sitio web (HTML, CSS, JavaScript)
- **Backend:** Parte del servidor (PHP, Base de Datos)
- **API:** Interfaz para comunicar frontend con backend
- **Endpoint:** URL específica de una API (ej: api/users.php)
- **Hash:** Encriptación de una sola vía (no se puede desencriptar)
- **Token:** Clave temporal para autenticación
- **Session:** Datos temporales del usuario logueado
- **Query:** Consulta a la base de datos
- **Index:** Índice para búsquedas rápidas en BD
- **Foreign Key:** Relación entre tablas
- **CASCADE:** Si se borra el padre, se borran los hijos
- **Promise:** Operación asíncrona en JavaScript
- **DOM:** Document Object Model (estructura HTML en JavaScript)
- **Event Listener:** Función que se ejecuta cuando ocurre un evento

---

## ✅ CHECKLIST DE FUNCIONAMIENTO

Para verificar que todo funciona correctamente:

- [ ] XAMPP iniciado (Apache y MySQL en verde)
- [ ] BD creada (ejecutar init-database.php)
- [ ] 12 productos en catálogo
- [ ] Usuario admin existe (admin / 0000)
- [ ] Login funciona
- [ ] Registro funciona
- [ ] Productos se muestran en index.html
- [ ] Carrito funciona
- [ ] Checkout guarda en BD
- [ ] Perfil muestra compras
- [ ] Formulario de contacto guarda consultas
- [ ] Admin panel accesible
- [ ] Admin puede crear/editar/eliminar productos

---

**FIN DE LA EXPLICACIÓN COMPLETA**

Para más ayuda, consulta los comentarios en el código de cada archivo.

