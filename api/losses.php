<?php
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

// Crear tabla de pérdidas si no existe
try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS inventory_losses (
            id INT AUTO_INCREMENT PRIMARY KEY,
            product_id INT NOT NULL,
            quantity INT NOT NULL,
            loss_type ENUM('robo', 'deterioro', 'error_registro', 'otro') NOT NULL,
            reason TEXT,
            reported_by VARCHAR(100),
            loss_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
            INDEX idx_product_id (product_id),
            INDEX idx_loss_date (loss_date),
            INDEX idx_loss_type (loss_type)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
} catch (PDOException $e) {
    error_log("Error creating losses table: " . $e->getMessage());
}

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

switch ($method) {
    case 'GET':
        if (isset($_GET['stats'])) {
            // Obtener estadísticas de pérdidas
            try {
                // Total de pérdidas
                $stmt = $pdo->query("
                    SELECT 
                        COUNT(*) as total_incidents,
                        SUM(quantity) as total_quantity_lost,
                        SUM(quantity * p.price) as total_value_lost
                    FROM inventory_losses il
                    JOIN products p ON il.product_id = p.id
                ");
                $stats = $stmt->fetch();
                
                // Inventario total actual
                $stmt = $pdo->query("SELECT SUM(stock) as total_stock FROM products");
                $inventory = $stmt->fetch();
                
                // Calcular índice de pérdida
                $totalStock = $inventory['total_stock'] ?? 0;
                $totalLost = $stats['total_quantity_lost'] ?? 0;
                $lossIndex = $totalStock > 0 ? ($totalLost / ($totalStock + $totalLost)) * 100 : 0;
                
                // Pérdidas por tipo
                $stmt = $pdo->query("
                    SELECT 
                        loss_type,
                        COUNT(*) as incidents,
                        SUM(quantity) as quantity,
                        SUM(quantity * p.price) as value_lost
                    FROM inventory_losses il
                    JOIN products p ON il.product_id = p.id
                    GROUP BY loss_type
                ");
                $byType = $stmt->fetchAll();
                
                // Productos más afectados
                $stmt = $pdo->query("
                    SELECT 
                        p.id,
                        p.name,
                        p.category,
                        SUM(il.quantity) as total_lost,
                        SUM(il.quantity * p.price) as value_lost,
                        COUNT(*) as incidents
                    FROM inventory_losses il
                    JOIN products p ON il.product_id = p.id
                    GROUP BY p.id
                    ORDER BY total_lost DESC
                    LIMIT 10
                ");
                $topAffected = $stmt->fetchAll();
                
                echo json_encode([
                    'loss_index' => round($lossIndex, 2),
                    'total_incidents' => $stats['total_incidents'] ?? 0,
                    'total_quantity_lost' => $totalLost,
                    'total_value_lost' => $stats['total_value_lost'] ?? 0,
                    'current_inventory' => $totalStock,
                    'by_type' => $byType,
                    'top_affected_products' => $topAffected
                ]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => $e->getMessage()]);
            }
        } else {
            // Obtener todas las pérdidas con filtros
            $dateFrom = $_GET['date_from'] ?? null;
            $dateTo = $_GET['date_to'] ?? null;
            $lossType = $_GET['loss_type'] ?? null;
            
            $sql = "SELECT 
                        il.*,
                        p.name as product_name,
                        p.category,
                        p.price,
                        (il.quantity * p.price) as loss_value
                    FROM inventory_losses il
                    JOIN products p ON il.product_id = p.id
                    WHERE 1=1";
            $params = [];
            
            if ($dateFrom) {
                $sql .= " AND il.loss_date >= ?";
                $params[] = $dateFrom;
            }
            
            if ($dateTo) {
                $sql .= " AND il.loss_date <= ?";
                $params[] = $dateTo;
            }
            
            if ($lossType) {
                $sql .= " AND il.loss_type = ?";
                $params[] = $lossType;
            }
            
            $sql .= " ORDER BY il.loss_date DESC";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $losses = $stmt->fetchAll();
            echo json_encode($losses);
        }
        break;
        
    case 'POST':
        // Registrar nueva pérdida
        $required_fields = ['product_id', 'quantity', 'loss_type'];
        foreach ($required_fields as $field) {
            if (!isset($input[$field])) {
                http_response_code(400);
                echo json_encode(['error' => "Campo $field es requerido"]);
                exit;
            }
        }
        
        try {
            $stmt = $pdo->prepare("
                INSERT INTO inventory_losses (product_id, quantity, loss_type, reason, reported_by) 
                VALUES (?, ?, ?, ?, ?)
            ");
            
            $result = $stmt->execute([
                $input['product_id'],
                $input['quantity'],
                $input['loss_type'],
                $input['reason'] ?? '',
                $input['reported_by'] ?? 'admin'
            ]);
            
            if ($result) {
                // Opcional: Reducir stock del producto
                if (isset($input['reduce_stock']) && $input['reduce_stock']) {
                    $stmt = $pdo->prepare("UPDATE products SET stock = stock - ? WHERE id = ?");
                    $stmt->execute([$input['quantity'], $input['product_id']]);
                }
                
                $lossId = $pdo->lastInsertId();
                echo json_encode(['success' => true, 'loss_id' => $lossId]);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Error al registrar pérdida']);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;
        
    case 'DELETE':
        // Eliminar pérdida
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'ID de pérdida requerido']);
            exit;
        }
        
        try {
            $stmt = $pdo->prepare("DELETE FROM inventory_losses WHERE id = ?");
            if ($stmt->execute([$_GET['id']])) {
                echo json_encode(['success' => true]);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Error al eliminar pérdida']);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Método no permitido']);
        break;
}
?>


