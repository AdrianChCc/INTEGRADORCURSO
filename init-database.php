<?php
/**
 * ============================================================================
 * INICIALIZADOR DE BASE DE DATOS - TENNIS CLUB
 * ============================================================================
 * 
 * PROPÓSITO:
 * Este archivo se ejecuta UNA SOLA VEZ para crear la base de datos MySQL
 * y todas las tablas necesarias para el sistema.
 * 
 * QUÉ HACE:
 * 1. Se conecta a MySQL
 * 2. Crea la base de datos 'tennis_club_db'
 * 3. Crea 4 tablas: users, products, purchases, inquiries
 * 4. Inserta el usuario admin por defecto
 * 5. Inserta 12 productos del catálogo
 * 
 * CUÁNDO EJECUTARLO:
 * - La primera vez que instalas el proyecto
 * - Si quieres reiniciar la base de datos desde cero
 * 
 * CÓMO EJECUTARLO:
 * http://localhost/tennis-club/init-database.php
 * ============================================================================
 */

// ============================================================================
// CONFIGURACIÓN DE ERRORES
// ============================================================================
// Activar reporte de errores para ver cualquier problema durante la instalación
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<html><head><title>Inicializar Base de Datos</title>";
echo "<style>
    body {
        font-family: Arial, sans-serif;
        max-width: 800px;
        margin: 50px auto;
        padding: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        min-height: 100vh;
    }
    .container {
        background: white;
        padding: 30px;
        border-radius: 15px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    }
    h1 { color: #667eea; }
    .success { color: #27ae60; padding: 10px; background: #e8f8f5; border-radius: 5px; margin: 10px 0; }
    .error { color: #e74c3c; padding: 10px; background: #fadbd8; border-radius: 5px; margin: 10px 0; }
    .info { color: #3498db; padding: 10px; background: #d6eaf8; border-radius: 5px; margin: 10px 0; }
    .step { margin: 15px 0; padding: 10px; border-left: 3px solid #667eea; }
    .btn {
        display: inline-block;
        padding: 10px 20px;
        background: #667eea;
        color: white;
        text-decoration: none;
        border-radius: 5px;
        margin: 10px 5px;
    }
    .btn:hover { background: #764ba2; }
</style></head><body><div class='container'>";

echo "<h1>🎾 Inicialización de Base de Datos - Tennis Club</h1>";

// ============================================================================
// INICIO DEL PROCESO DE INSTALACIÓN
// ============================================================================
try {
    // ------------------------------------------------------------------------
    // PASO 1: CONECTAR A MYSQL
    // ------------------------------------------------------------------------
    // PDO (PHP Data Objects) es la forma moderna de conectarse a bases de datos
    // Conectamos sin especificar una BD porque aún no existe
    echo "<div class='step'><strong>Paso 1:</strong> Conectando a MySQL...</div>";
    
    $pdo = new PDO(
        "mysql:host=localhost;charset=utf8mb4",  // Servidor local, codificación UTF-8
        'root',                                   // Usuario de MySQL (por defecto en XAMPP)
        ''                                        // Sin contraseña (por defecto en XAMPP)
    );
    
    // Configurar para que lance excepciones en caso de error
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<div class='success'>✓ Conexión a MySQL establecida correctamente</div>";
    
    // ------------------------------------------------------------------------
    // PASO 2: CREAR LA BASE DE DATOS
    // ------------------------------------------------------------------------
    // IF NOT EXISTS: Solo crea la BD si no existe ya
    // CHARACTER SET utf8mb4: Soporte para emojis y caracteres especiales
    echo "<div class='step'><strong>Paso 2:</strong> Creando base de datos 'tennis_club_db'...</div>";
    $pdo->exec("CREATE DATABASE IF NOT EXISTS tennis_club_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    echo "<div class='success'>✓ Base de datos 'tennis_club_db' creada correctamente</div>";
    
    // Seleccionar la base de datos recién creada para trabajar con ella
    $pdo->exec("USE tennis_club_db");
    
    // ------------------------------------------------------------------------
    // PASO 3: CREAR TABLA USERS (USUARIOS)
    // ------------------------------------------------------------------------
    // Esta tabla almacena todos los usuarios del sistema (admin y usuarios regulares)
    echo "<div class='step'><strong>Paso 3:</strong> Creando tabla 'users'...</div>";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,              -- ID único auto-incremental
            full_name VARCHAR(255) NOT NULL,                -- Nombre completo del usuario
            email VARCHAR(255) UNIQUE NOT NULL,             -- Email (debe ser único)
            phone VARCHAR(20) NOT NULL,                     -- Teléfono
            username VARCHAR(50) UNIQUE NOT NULL,           -- Nombre de usuario (debe ser único)
            password VARCHAR(255) NOT NULL,                 -- Contraseña encriptada con hash
            role ENUM('admin', 'user') DEFAULT 'user',      -- Rol: admin o usuario regular
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Fecha de registro
            is_active BOOLEAN DEFAULT TRUE,                 -- Si la cuenta está activa
            INDEX idx_username (username),                  -- Índice para búsquedas rápidas por username
            INDEX idx_email (email),                        -- Índice para búsquedas por email
            INDEX idx_role (role)                           -- Índice para filtrar por rol
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "<div class='success'>✓ Tabla 'users' creada correctamente</div>";
    
    // ------------------------------------------------------------------------
    // PASO 4: CREAR TABLA PRODUCTS (PRODUCTOS)
    // ------------------------------------------------------------------------
    // Esta tabla almacena todos los productos del catálogo
    echo "<div class='step'><strong>Paso 4:</strong> Creando tabla 'products'...</div>";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS products (
            id INT AUTO_INCREMENT PRIMARY KEY,                                          -- ID único del producto
            name VARCHAR(255) NOT NULL,                                                 -- Nombre del producto
            description TEXT,                                                           -- Descripción detallada
            price DECIMAL(10,2) NOT NULL,                                               -- Precio (hasta 99999999.99)
            image_url VARCHAR(500),                                                     -- URL de la imagen
            category VARCHAR(100),                                                      -- Categoría (ropa, calzado, accesorios)
            stock INT DEFAULT 0,                                                        -- Cantidad disponible en inventario
            is_active BOOLEAN DEFAULT TRUE,                                             -- Si el producto está activo (visible)
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,                             -- Fecha de creación
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Se actualiza automáticamente
            INDEX idx_category (category),                                              -- Índice para filtrar por categoría
            INDEX idx_active (is_active)                                                -- Índice para productos activos
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "<div class='success'>✓ Tabla 'products' creada correctamente</div>";
    
    // ------------------------------------------------------------------------
    // PASO 5: CREAR TABLA PURCHASES (COMPRAS)
    // ------------------------------------------------------------------------
    // Esta tabla registra todas las compras realizadas por los usuarios
    echo "<div class='step'><strong>Paso 5:</strong> Creando tabla 'purchases'...</div>";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS purchases (
            id INT AUTO_INCREMENT PRIMARY KEY,                           -- ID único de la compra
            user_id INT NOT NULL,                                        -- ID del usuario que compró
            product_id INT NOT NULL,                                     -- ID del producto comprado
            quantity INT NOT NULL,                                       -- Cantidad comprada
            price DECIMAL(10,2) NOT NULL,                                -- Precio unitario al momento de compra
            total DECIMAL(10,2) NOT NULL,                                -- Total (quantity * price)
            purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,           -- Fecha de la compra
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,    -- Si se borra el usuario, se borran sus compras
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE, -- Si se borra el producto, se borran sus compras
            INDEX idx_user_id (user_id),                                 -- Índice para buscar compras por usuario
            INDEX idx_product_id (product_id),                           -- Índice para buscar compras por producto
            INDEX idx_purchase_date (purchase_date)                      -- Índice para ordenar por fecha
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "<div class='success'>✓ Tabla 'purchases' creada correctamente</div>";
    
    // ------------------------------------------------------------------------
    // PASO 6: CREAR TABLA INQUIRIES (CONSULTAS/CONTACTO)
    // ------------------------------------------------------------------------
    // Esta tabla almacena las consultas enviadas desde el formulario de contacto
    echo "<div class='step'><strong>Paso 6:</strong> Creando tabla 'inquiries'...</div>";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS inquiries (
            id INT AUTO_INCREMENT PRIMARY KEY,                                          -- ID único de la consulta
            user_id INT NOT NULL,                                                       -- ID del usuario que consultó
            service_type VARCHAR(100) NOT NULL,                                         -- Tipo de servicio consultado
            message TEXT,                                                               -- Mensaje del usuario
            status ENUM('new', 'in_progress', 'completed', 'cancelled') DEFAULT 'new',  -- Estado de la consulta
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,                             -- Fecha de creación
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Se actualiza automáticamente
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,               -- Si se borra el usuario, se borran sus consultas
            INDEX idx_user_id (user_id),                                                -- Índice para buscar consultas por usuario
            INDEX idx_status (status),                                                  -- Índice para filtrar por estado
            INDEX idx_created_at (created_at)                                           -- Índice para ordenar por fecha
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "<div class='success'>✓ Tabla 'inquiries' creada correctamente</div>";
    
    // Verificar si el admin existe
    echo "<div class='step'><strong>Paso 7:</strong> Verificando usuario admin...</div>";
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE username = 'admin'");
    $stmt->execute();
    $adminExists = $stmt->fetchColumn() > 0;
    
    if (!$adminExists) {
        echo "<div class='info'>→ Creando usuario admin...</div>";
        $hashedPassword = password_hash('0000', PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("
            INSERT INTO users (full_name, email, phone, username, password, role) 
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            'Administrador',
            'admin@tennisclub.com',
            '000-000-0000',
            'admin',
            $hashedPassword,
            'admin'
        ]);
        echo "<div class='success'>✓ Usuario admin creado (admin / 0000)</div>";
    } else {
        echo "<div class='success'>✓ Usuario admin ya existe</div>";
    }
    
    // Verificar productos
    echo "<div class='step'><strong>Paso 8:</strong> Verificando productos...</div>";
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM products");
    $stmt->execute();
    $productCount = $stmt->fetchColumn();
    
    if ($productCount == 0) {
        echo "<div class='info'>→ Insertando productos de ejemplo...</div>";
        $products = [
            // Productos 2024 - Coinciden con el catálogo del sitio web
            ['Polo Nike Court Dri-FIT Victory', 'Tejido ligero con tecnología anti-sudor. Diseño clásico con cuello y botones. Ideal para torneos.', 54.99, 'https://images.unsplash.com/photo-1622445275463-afa2ab738c34?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 'ropa', 45],
            ['Top Adidas Club Tennis', 'Top deportivo con soporte interno. Material transpirable y secado rápido. Ajuste ergonómico.', 35.99, 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 'ropa', 38],
            ['Shorts Nike Court Flex Ace', 'Shorts elásticos de 9" con bolsillos profundos para pelotas. Cinturilla elástica con cordón ajustable.', 46.99, 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 'ropa', 40],
            ['Falda Wilson Team 12.5"', 'Falda plisada con shorts integrados anti-rozaduras. 2 bolsillos para pelotas. Corte atlético moderno.', 52.99, 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 'ropa', 30],
            ['Sudadera Nike Heritage', 'Sudadera con capucha y bolsillos canguro. Perfecta para calentamiento. Interior de felpa suave.', 72.99, 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 'ropa', 25],
            ['Pantalones Adidas Barricade', 'Pantalones técnicos con tecnología Climacool. Cremalleras en tobillos. Máxima libertad de movimiento.', 79.99, 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 'ropa', 22],
            ['Zapatillas Nike Court Air Zoom Vapor', 'Zapatillas profesionales con amortiguación Air Zoom. Suela Herringbone para todas las superficies.', 134.99, 'https://images.unsplash.com/photo-1549298916-b41d501d3772?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 'calzado', 18],
            ['Chaqueta Adidas Club Track', 'Chaqueta cortavientos con forro interior. Cierre completo con cremallera. Bolsillos laterales con cierre.', 89.99, 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 'ropa', 20],
            ['Calcetines Nike Elite Crew', 'Pack de 3 pares con compresión media. Soporte de arco y amortiguación en talón y puntera.', 26.99, 'https://images.unsplash.com/photo-1556906781-9a412961c28c?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 'accesorios', 85],
            ['Muñequeras Wilson Pro', 'Set de 2 muñequeras de algodón absorbente. Ajuste cómodo con tecnología anti-deslizante.', 14.99, 'https://images.unsplash.com/photo-1593476087123-36d1de271f08?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 'accesorios', 120],
            ['Gorra Nike AeroBill', 'Gorra con protección UV 50+. Tejido perforado para ventilación. Cierre ajustable en la parte posterior.', 28.99, 'https://images.unsplash.com/photo-1521369909029-2afed882baee?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 'accesorios', 55],
            ['Visera Adidas Aeroready', 'Visera ultraligera con banda absorbente. Material transpirable Aeroready. Diseño minimalista profesional.', 22.99, 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 'accesorios', 60]
        ];
        
        $stmt = $pdo->prepare("
            INSERT INTO products (name, description, price, image_url, category, stock) 
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        
        foreach ($products as $product) {
            $stmt->execute($product);
        }
        echo "<div class='success'>✓ 12 productos insertados correctamente (catálogo 2024)</div>";
    } else {
        echo "<div class='success'>✓ Ya existen $productCount productos en la base de datos</div>";
    }
    
    // Resumen final
    echo "<hr>";
    echo "<h2>✅ ¡Base de Datos Inicializada Correctamente!</h2>";
    
    echo "<div class='info'><strong>Resumen:</strong><br>";
    echo "→ Base de datos: <strong>tennis_club_db</strong><br>";
    echo "→ Tablas creadas: <strong>users, products, purchases, inquiries</strong><br>";
    echo "→ Usuario admin: <strong>admin / 0000</strong><br>";
    echo "→ Productos del catálogo: <strong>12 productos (2024)</strong><br>";
    echo "</div>";
    
    // Estadísticas
    $userCount = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
    $productCount = $pdo->query("SELECT COUNT(*) FROM products")->fetchColumn();
    
    echo "<div class='success'>";
    echo "<strong>Estadísticas Actuales:</strong><br>";
    echo "👥 Usuarios: $userCount<br>";
    echo "📦 Productos: $productCount<br>";
    echo "</div>";
    
    echo "<h3>🎯 Próximos Pasos:</h3>";
    echo "<ol>";
    echo "<li>Ve a <a href='http://localhost/phpmyadmin' target='_blank'>phpMyAdmin</a> para ver la base de datos</li>";
    echo "<li>Haz login en el sistema: <a href='login.html'>Login</a> (admin / 0000)</li>";
    echo "<li>Accede al panel de administración: <a href='admin-panel.html'>Panel Admin</a></li>";
    echo "<li>Verifica los usuarios: <a href='verify-users.html'>Ver Usuarios</a></li>";
    echo "</ol>";
    
    echo "<div style='margin-top: 20px;'>";
    echo "<a href='http://localhost/phpmyadmin' class='btn' target='_blank'>📊 Abrir phpMyAdmin</a>";
    echo "<a href='login.html' class='btn'>🔐 Ir al Login</a>";
    echo "<a href='verify-users.html' class='btn'>👥 Ver Usuarios</a>";
    echo "<a href='diagnostico.html' class='btn'>🔍 Diagnóstico</a>";
    echo "</div>";
    
} catch (PDOException $e) {
    echo "<div class='error'><strong>❌ ERROR:</strong> " . $e->getMessage() . "</div>";
    echo "<div class='info'><strong>Posibles soluciones:</strong><br>";
    echo "1. Verifica que XAMPP esté ejecutándose (Apache y MySQL en verde)<br>";
    echo "2. Asegúrate de que MySQL esté iniciado en el Panel de Control de XAMPP<br>";
    echo "3. Verifica que el puerto 3306 esté libre<br>";
    echo "4. Intenta reiniciar MySQL desde XAMPP<br>";
    echo "</div>";
}

echo "</div></body></html>";
?>
