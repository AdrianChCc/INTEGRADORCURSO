<?php
/**
 * Actualizador de Productos para Tennis Club
 * Este archivo actualiza los productos existentes con el catálogo 2024
 */

// Mostrar errores para debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<html><head><title>Actualizar Productos</title>";
echo "<style>
    body {
        font-family: Arial, sans-serif;
        max-width: 900px;
        margin: 50px auto;
        padding: 20px;
        background: linear-gradient(135deg, #059669, #10b981, #34d399);
        min-height: 100vh;
    }
    .container {
        background: white;
        padding: 30px;
        border-radius: 15px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    }
    h1 { color: #059669; }
    .success { color: #27ae60; padding: 10px; background: #e8f8f5; border-radius: 5px; margin: 10px 0; }
    .error { color: #e74c3c; padding: 10px; background: #fadbd8; border-radius: 5px; margin: 10px 0; }
    .info { color: #3498db; padding: 10px; background: #d6eaf8; border-radius: 5px; margin: 10px 0; }
    .warning { color: #f39c12; padding: 10px; background: #fef5e7; border-radius: 5px; margin: 10px 0; }
    .step { margin: 15px 0; padding: 10px; border-left: 3px solid #059669; }
    .product-item { background: #f8f9fa; padding: 10px; margin: 5px 0; border-radius: 5px; }
    .btn {
        display: inline-block;
        padding: 10px 20px;
        background: #059669;
        color: white;
        text-decoration: none;
        border-radius: 5px;
        margin: 10px 5px;
    }
    .btn:hover { background: #047857; }
</style></head><body><div class='container'>";

echo "<h1>🔄 Actualizar Productos del Catálogo</h1>";

try {
    echo "<div class='step'><strong>Paso 1:</strong> Conectando a la base de datos...</div>";
    
    require_once 'database-config.php';
    $db = new DatabaseConfig();
    $pdo = $db->getConnection();
    
    echo "<div class='success'>✓ Conexión establecida correctamente</div>";
    
    // Productos del catálogo 2024
    $productos2024 = [
        [
            'name' => 'Polo Nike Court Dri-FIT Victory',
            'description' => 'Tejido ligero con tecnología anti-sudor. Diseño clásico con cuello y botones. Ideal para torneos.',
            'price' => 54.99,
            'image_url' => 'https://images.unsplash.com/photo-1622445275463-afa2ab738c34?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
            'category' => 'ropa',
            'stock' => 45
        ],
        [
            'name' => 'Top Adidas Club Tennis',
            'description' => 'Top deportivo con soporte interno. Material transpirable y secado rápido. Ajuste ergonómico.',
            'price' => 35.99,
            'image_url' => 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
            'category' => 'ropa',
            'stock' => 38
        ],
        [
            'name' => 'Shorts Nike Court Flex Ace',
            'description' => 'Shorts elásticos de 9" con bolsillos profundos para pelotas. Cinturilla elástica con cordón ajustable.',
            'price' => 46.99,
            'image_url' => 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
            'category' => 'ropa',
            'stock' => 40
        ],
        [
            'name' => 'Falda Wilson Team 12.5"',
            'description' => 'Falda plisada con shorts integrados anti-rozaduras. 2 bolsillos para pelotas. Corte atlético moderno.',
            'price' => 52.99,
            'image_url' => 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
            'category' => 'ropa',
            'stock' => 30
        ],
        [
            'name' => 'Sudadera Nike Heritage',
            'description' => 'Sudadera con capucha y bolsillos canguro. Perfecta para calentamiento. Interior de felpa suave.',
            'price' => 72.99,
            'image_url' => 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
            'category' => 'ropa',
            'stock' => 25
        ],
        [
            'name' => 'Pantalones Adidas Barricade',
            'description' => 'Pantalones técnicos con tecnología Climacool. Cremalleras en tobillos. Máxima libertad de movimiento.',
            'price' => 79.99,
            'image_url' => 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
            'category' => 'ropa',
            'stock' => 22
        ],
        [
            'name' => 'Zapatillas Nike Court Air Zoom Vapor',
            'description' => 'Zapatillas profesionales con amortiguación Air Zoom. Suela Herringbone para todas las superficies.',
            'price' => 134.99,
            'image_url' => 'https://images.unsplash.com/photo-1549298916-b41d501d3772?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
            'category' => 'calzado',
            'stock' => 18
        ],
        [
            'name' => 'Chaqueta Adidas Club Track',
            'description' => 'Chaqueta cortavientos con forro interior. Cierre completo con cremallera. Bolsillos laterales con cierre.',
            'price' => 89.99,
            'image_url' => 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
            'category' => 'ropa',
            'stock' => 20
        ],
        [
            'name' => 'Calcetines Nike Elite Crew',
            'description' => 'Pack de 3 pares con compresión media. Soporte de arco y amortiguación en talón y puntera.',
            'price' => 26.99,
            'image_url' => 'https://images.unsplash.com/photo-1556906781-9a412961c28c?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
            'category' => 'accesorios',
            'stock' => 85
        ],
        [
            'name' => 'Muñequeras Wilson Pro',
            'description' => 'Set de 2 muñequeras de algodón absorbente. Ajuste cómodo con tecnología anti-deslizante.',
            'price' => 14.99,
            'image_url' => 'https://images.unsplash.com/photo-1593476087123-36d1de271f08?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
            'category' => 'accesorios',
            'stock' => 120
        ],
        [
            'name' => 'Gorra Nike AeroBill',
            'description' => 'Gorra con protección UV 50+. Tejido perforado para ventilación. Cierre ajustable en la parte posterior.',
            'price' => 28.99,
            'image_url' => 'https://images.unsplash.com/photo-1521369909029-2afed882baee?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
            'category' => 'accesorios',
            'stock' => 55
        ],
        [
            'name' => 'Visera Adidas Aeroready',
            'description' => 'Visera ultraligera con banda absorbente. Material transpirable Aeroready. Diseño minimalista profesional.',
            'price' => 22.99,
            'image_url' => 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
            'category' => 'accesorios',
            'stock' => 60
        ]
    ];
    
    echo "<div class='step'><strong>Paso 2:</strong> Verificando productos existentes...</div>";
    
    // Verificar productos actuales
    $stmt = $pdo->query("SELECT COUNT(*) FROM products");
    $currentCount = $stmt->fetchColumn();
    
    echo "<div class='info'>→ Productos actuales en BD: <strong>$currentCount</strong></div>";
    echo "<div class='info'>→ Productos del catálogo web 2024: <strong>" . count($productos2024) . "</strong></div>";
    
    // Limpiar productos legacy si hay más de 12
    if ($currentCount > 12) {
        echo "<div class='warning'>⚠️ Se encontraron productos legacy. Limpiando base de datos...</div>";
        $pdo->exec("DELETE FROM products");
        $pdo->exec("ALTER TABLE products AUTO_INCREMENT = 1");
        echo "<div class='success'>✓ Base de datos limpiada</div>";
        $currentCount = 0;
    }
    
    echo "<div class='step'><strong>Paso 3:</strong> Sincronizando 12 productos del catálogo web...</div>";
    
    $insertados = 0;
    $actualizados = 0;
    
    foreach ($productos2024 as $producto) {
        // Verificar si el producto ya existe por nombre
        $stmt = $pdo->prepare("SELECT id, stock FROM products WHERE name = ?");
        $stmt->execute([$producto['name']]);
        $existente = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existente) {
            // Actualizar producto existente (mantener el stock actual)
            $stmt = $pdo->prepare("
                UPDATE products 
                SET description = ?, price = ?, image_url = ?, category = ? 
                WHERE name = ?
            ");
            $stmt->execute([
                $producto['description'],
                $producto['price'],
                $producto['image_url'],
                $producto['category'],
                $producto['name']
            ]);
            $actualizados++;
            echo "<div class='product-item'>🔄 Actualizado: <strong>{$producto['name']}</strong> - \${$producto['price']}</div>";
        } else {
            // Insertar nuevo producto
            $stmt = $pdo->prepare("
                INSERT INTO products (name, description, price, image_url, category, stock, is_active) 
                VALUES (?, ?, ?, ?, ?, ?, 1)
            ");
            $stmt->execute([
                $producto['name'],
                $producto['description'],
                $producto['price'],
                $producto['image_url'],
                $producto['category'],
                $producto['stock']
            ]);
            $insertados++;
            echo "<div class='product-item'>➕ Insertado: <strong>{$producto['name']}</strong> - \${$producto['price']}</div>";
        }
    }
    
    // Resumen
    echo "<hr>";
    echo "<h2>✅ ¡Actualización Completada!</h2>";
    
    $stmt = $pdo->query("SELECT COUNT(*) FROM products");
    $finalCount = $stmt->fetchColumn();
    
    echo "<div class='success'>";
    echo "<strong>📊 Resumen de la Sincronización:</strong><br>";
    echo "➕ Productos nuevos insertados: <strong>$insertados</strong><br>";
    echo "🔄 Productos actualizados: <strong>$actualizados</strong><br>";
    echo "📦 Total de productos en BD: <strong>$finalCount</strong><br>";
    echo "</div>";
    
    if ($finalCount == 12) {
        echo "<div class='success'>";
        echo "<strong>🎯 ¡PERFECTO! Sincronización completada:</strong><br>";
        echo "✓ Exactamente <strong>12 productos</strong> en la base de datos<br>";
        echo "✓ Coincide con el catálogo del sitio web<br>";
        echo "✓ Todas las imágenes actualizadas<br>";
        echo "✓ Precios y descripciones sincronizados<br>";
        echo "✓ Stock listo para actualizaciones automáticas<br>";
        echo "</div>";
    } else {
        echo "<div class='warning'>";
        echo "⚠️ Advertencia: Se esperaban 12 productos pero hay $finalCount<br>";
        echo "Ejecuta <a href='limpiar-productos.php'>limpiar-productos.php</a> para corregir<br>";
        echo "</div>";
    }
    
    echo "<div style='margin-top: 20px;'>";
    echo "<a href='http://localhost/phpmyadmin' class='btn' target='_blank'>📊 Ver en phpMyAdmin</a>";
    echo "<a href='admin-panel.html' class='btn'>🎛️ Panel Admin</a>";
    echo "<a href='index.html' class='btn'>🏠 Ir al Sitio</a>";
    echo "</div>";
    
} catch (PDOException $e) {
    echo "<div class='error'><strong>❌ ERROR:</strong> " . $e->getMessage() . "</div>";
    echo "<div class='info'><strong>Posibles soluciones:</strong><br>";
    echo "1. Verifica que XAMPP esté ejecutándose<br>";
    echo "2. Asegúrate de que la base de datos 'tennis_club_db' exista<br>";
    echo "3. Ejecuta primero 'init-database.php' si la BD no existe<br>";
    echo "</div>";
}

echo "</div></body></html>";
?>

