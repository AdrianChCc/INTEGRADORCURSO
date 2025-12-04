<?php
/**
 * ============================================================================
 * API PRODUCTS - MANTENIMIENTO DE PRODUCTOS (CRUD COMPLETO)
 * ============================================================================
 * Esta API implementa el mantenimiento de la entidad "products":
 * - GET    → Consulta de productos (lectura, con filtros)
 * - POST   → Adición de productos (creación)
 * - PUT    → Actualización de productos (modificación)
 * - DELETE → Eliminación LÓGICA de productos (soft delete usando is_active)
 *
 * PATRONES APLICADOS:
 * - Separación de capas: esta API solo contiene lógica de negocio y acceso a
 *   datos; la vista se maneja en `admin-panel.html` + `admin-panel.js`.
 * - Patrón DAO/simple Repository: el acceso a MySQL se centraliza en
 *   `DatabaseConfig` y aquí solo se definen las operaciones CRUD.
 * - Eliminación lógica: en lugar de borrar filas físicamente, marcamos
 *   `is_active = 0` para mantener el historial de inventario.
 * ============================================================================
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

require_once '../database-config.php';

$db = new DatabaseConfig();
$pdo = $db->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true) ?? [];

switch ($method) {
    case 'GET':
        // Get all products or specific product
        if (isset($_GET['id'])) {
            $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            $product = $stmt->fetch();
            echo json_encode($product ?: ['error' => 'Product not found']);
        } else {
            $category = $_GET['category'] ?? null;
            $active = $_GET['active'] ?? null;
            $includeInactive = isset($_GET['include_inactive']) ? (bool)$_GET['include_inactive'] : false;
            
            $sql = "SELECT * FROM products WHERE 1=1";
            $params = [];
            
            if ($category) {
                $sql .= " AND category = ?";
                $params[] = $category;
            }
            
            if ($active !== null) {
                $sql .= " AND is_active = ?";
                $params[] = $active ? 1 : 0;
            } elseif (!$includeInactive) {
                // Por defecto, solo mostrar productos activos al público
                $sql .= " AND is_active = 1";
            }
            
            $sql .= " ORDER BY created_at DESC";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $products = $stmt->fetchAll();
            echo json_encode($products);
        }
        break;
        
    case 'POST':
        // Create new product (Adición con validación robusta)
        $required_fields = ['name', 'description', 'price'];
        foreach ($required_fields as $field) {
            if (!isset($input[$field]) || trim($input[$field]) === '') {
                http_response_code(400);
                echo json_encode(['error' => "Field $field is required"]);
                exit;
            }
        }

        // Validaciones de tipo y rango
        if (!is_numeric($input['price']) || $input['price'] <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Price must be a positive number']);
            exit;
        }

        $stock = $input['stock'] ?? 0;
        if (!is_numeric($stock) || (int)$stock < 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Stock must be a non-negative integer']);
            exit;
        }

        $category = $input['category'] ?? 'general';
        if (strlen($category) > 100) {
            http_response_code(400);
            echo json_encode(['error' => 'Category is too long']);
            exit;
        }
        
        $stmt = $pdo->prepare("
            INSERT INTO products (name, description, price, image_url, category, stock, is_active) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        
        $result = $stmt->execute([
            trim($input['name']),
            trim($input['description']),
            $input['price'],
            $input['image_url'] ?? '',
            $category,
            (int)$stock,
            isset($input['is_active']) ? ($input['is_active'] ? 1 : 0) : 1
        ]);
        
        if ($result) {
            $productId = $pdo->lastInsertId();
            echo json_encode(['success' => true, 'product_id' => $productId]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create product']);
        }
        break;
        
    case 'PUT':
        // Update product
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Product ID is required']);
            exit;
        }
        
        $productId = (int)$_GET['id'];
        $updateFields = [];
        $values = [];
        
        if (isset($input['name'])) {
            $updateFields[] = "name = ?";
            $values[] = $input['name'];
        }
        if (isset($input['description'])) {
            $updateFields[] = "description = ?";
            $values[] = $input['description'];
        }
        if (isset($input['price'])) {
            if (!is_numeric($input['price']) || $input['price'] <= 0) {
                http_response_code(400);
                echo json_encode(['error' => 'Price must be a positive number']);
                exit;
            }
            $updateFields[] = "price = ?";
            $values[] = $input['price'];
        }
        if (isset($input['image_url'])) {
            $updateFields[] = "image_url = ?";
            $values[] = $input['image_url'];
        }
        if (isset($input['category'])) {
            $updateFields[] = "category = ?";
            $values[] = $input['category'];
        }
        if (isset($input['stock'])) {
            if (!is_numeric($input['stock']) || (int)$input['stock'] < 0) {
                http_response_code(400);
                echo json_encode(['error' => 'Stock must be a non-negative integer']);
                exit;
            }
            $updateFields[] = "stock = ?";
            $values[] = (int)$input['stock'];
        }
        if (isset($input['is_active'])) {
            $updateFields[] = "is_active = ?";
            $values[] = $input['is_active'] ? 1 : 0;
        }
        
        if (empty($updateFields)) {
            http_response_code(400);
            echo json_encode(['error' => 'No fields to update']);
            exit;
        }
        
        $values[] = $productId;
        $sql = "UPDATE products SET " . implode(', ', $updateFields) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        
        if ($stmt->execute($values)) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update product']);
        }
        break;
        
    case 'DELETE':
        // Logical delete (soft delete) product
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Product ID is required']);
            exit;
        }
        
        $productId = (int)$_GET['id'];

        // Marcar como inactivo en lugar de borrar físicamente
        $stmt = $pdo->prepare("UPDATE products SET is_active = 0 WHERE id = ?");
        if ($stmt->execute([$productId])) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete product']);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}
?>

