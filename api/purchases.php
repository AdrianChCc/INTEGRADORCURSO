<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

require_once '../database-config.php';

$db = new DatabaseConfig();
$pdo = $db->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

switch ($method) {
    case 'GET':
        // Get purchases with filters
        $userId = $_GET['user_id'] ?? null;
        $dateFrom = $_GET['date_from'] ?? null;
        $dateTo = $_GET['date_to'] ?? null;
        
        $sql = "SELECT p.*, u.full_name as user_name, pr.name as product_name, pr.image_url 
                FROM purchases p 
                JOIN users u ON p.user_id = u.id 
                JOIN products pr ON p.product_id = pr.id 
                WHERE 1=1";
        $params = [];
        
        if ($userId) {
            $sql .= " AND p.user_id = ?";
            $params[] = $userId;
        }
        
        if ($dateFrom) {
            $sql .= " AND p.purchase_date >= ?";
            $params[] = $dateFrom;
        }
        
        if ($dateTo) {
            $sql .= " AND p.purchase_date <= ?";
            $params[] = $dateTo;
        }
        
        $sql .= " ORDER BY p.purchase_date DESC";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $purchases = $stmt->fetchAll();
        echo json_encode($purchases);
        break;
        
    case 'POST':
        // Create new purchase
        $required_fields = ['user_id', 'product_id', 'quantity', 'price'];
        foreach ($required_fields as $field) {
            if (!isset($input[$field])) {
                http_response_code(400);
                echo json_encode(['error' => "Field $field is required"]);
                exit;
            }
        }
        
        $total = $input['quantity'] * $input['price'];
        
        $stmt = $pdo->prepare("
            INSERT INTO purchases (user_id, product_id, quantity, price, total) 
            VALUES (?, ?, ?, ?, ?)
        ");
        
        $result = $stmt->execute([
            $input['user_id'],
            $input['product_id'],
            $input['quantity'],
            $input['price'],
            $total
        ]);
        
        if ($result) {
            $purchaseId = $pdo->lastInsertId();
            echo json_encode(['success' => true, 'purchase_id' => $purchaseId]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create purchase']);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}
?>

