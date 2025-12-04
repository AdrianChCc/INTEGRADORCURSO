<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
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
        // Get inquiries with filters
        $userId = $_GET['user_id'] ?? null;
        $status = $_GET['status'] ?? null;
        $serviceType = $_GET['service_type'] ?? null;
        
        $sql = "SELECT i.*, u.full_name as user_name, u.email as user_email 
                FROM inquiries i 
                JOIN users u ON i.user_id = u.id 
                WHERE 1=1";
        $params = [];
        
        if ($userId) {
            $sql .= " AND i.user_id = ?";
            $params[] = $userId;
        }
        
        if ($status) {
            $sql .= " AND i.status = ?";
            $params[] = $status;
        }
        
        if ($serviceType) {
            $sql .= " AND i.service_type = ?";
            $params[] = $serviceType;
        }
        
        $sql .= " ORDER BY i.created_at DESC";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $inquiries = $stmt->fetchAll();
        echo json_encode($inquiries);
        break;
        
    case 'POST':
        // Create new inquiry
        $required_fields = ['user_id', 'service_type'];
        foreach ($required_fields as $field) {
            if (!isset($input[$field]) || empty($input[$field])) {
                http_response_code(400);
                echo json_encode(['error' => "Field $field is required"]);
                exit;
            }
        }
        
        $stmt = $pdo->prepare("
            INSERT INTO inquiries (user_id, service_type, message, status) 
            VALUES (?, ?, ?, ?)
        ");
        
        $result = $stmt->execute([
            $input['user_id'],
            $input['service_type'],
            $input['message'] ?? '',
            $input['status'] ?? 'new'
        ]);
        
        if ($result) {
            $inquiryId = $pdo->lastInsertId();
            echo json_encode(['success' => true, 'inquiry_id' => $inquiryId]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create inquiry']);
        }
        break;
        
    case 'PUT':
        // Update inquiry status
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Inquiry ID is required']);
            exit;
        }
        
        $inquiryId = $_GET['id'];
        $status = $input['status'] ?? null;
        $message = $input['message'] ?? null;
        
        $updateFields = [];
        $values = [];
        
        if ($status) {
            $updateFields[] = "status = ?";
            $values[] = $status;
        }
        
        if ($message !== null) {
            $updateFields[] = "message = ?";
            $values[] = $message;
        }
        
        if (empty($updateFields)) {
            http_response_code(400);
            echo json_encode(['error' => 'No fields to update']);
            exit;
        }
        
        $values[] = $inquiryId;
        $sql = "UPDATE inquiries SET " . implode(', ', $updateFields) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        
        if ($stmt->execute($values)) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update inquiry']);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}
?>

