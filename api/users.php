<?php
/**
 * API USERS - Mantenimiento completo de usuarios (CRUD)
 * GET    → consulta (lista/detalle)
 * POST   → adición
 * PUT    → actualización
 * DELETE → eliminación lógica (soft delete con is_active = 0)
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
        // Get all users or specific user
        if (isset($_GET['id'])) {
            $stmt = $pdo->prepare("SELECT id, full_name, email, phone, username, role, created_at, is_active FROM users WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            $user = $stmt->fetch();
            echo json_encode($user ?: ['error' => 'User not found']);
        } else {
            // Permitir filtrar solo activos: ?only_active=1
            $onlyActive = isset($_GET['only_active']) ? (bool)$_GET['only_active'] : false;
            $sql = "SELECT id, full_name, email, phone, username, role, created_at, is_active FROM users";
            if ($onlyActive) {
                $sql .= " WHERE is_active = 1";
            }
            $sql .= " ORDER BY created_at DESC";

            $stmt = $pdo->prepare($sql);
            $stmt->execute();
            $users = $stmt->fetchAll();
            echo json_encode($users);
        }
        break;
        
    case 'POST':
        // Create new user (adición con validación reforzada)
        if (!isset($input['full_name']) || trim($input['full_name']) === '') {
            http_response_code(400);
            echo json_encode(['error' => 'Field full_name is required']);
            exit;
        }
        if (!isset($input['email']) || trim($input['email']) === '') {
            http_response_code(400);
            echo json_encode(['error' => 'Field email is required']);
            exit;
        }
        if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['error' => 'Email format is invalid']);
            exit;
        }
        if (!isset($input['phone']) || trim($input['phone']) === '') {
            http_response_code(400);
            echo json_encode(['error' => 'Field phone is required']);
            exit;
        }
        if (!isset($input['username']) || trim($input['username']) === '') {
            http_response_code(400);
            echo json_encode(['error' => 'Field username is required']);
            exit;
        }
        if (!isset($input['password']) || trim($input['password']) === '') {
            http_response_code(400);
            echo json_encode(['error' => 'Field password is required']);
            exit;
        }
        if (strlen($input['password']) < 4) {
            http_response_code(400);
            echo json_encode(['error' => 'Password must be at least 4 characters']);
            exit;
        }
        
        // Check if username or email already exists
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE username = ? OR email = ?");
        $stmt->execute([$input['username'], $input['email']]);
        if ($stmt->fetchColumn() > 0) {
            http_response_code(409);
            echo json_encode(['error' => 'Username or email already exists']);
            exit;
        }
        
        $hashedPassword = password_hash($input['password'], PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("
            INSERT INTO users (full_name, email, phone, username, password, role) 
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        
        $role = $input['role'] ?? 'user';
        $result = $stmt->execute([
            $input['full_name'],
            $input['email'],
            $input['phone'],
            $input['username'],
            $hashedPassword,
            $role
        ]);
        
        if ($result) {
            $userId = $pdo->lastInsertId();
            echo json_encode(['success' => true, 'user_id' => $userId]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create user']);
        }
        break;
        
    case 'PUT':
        // Update user
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'User ID is required']);
            exit;
        }
        
        $userId = (int)$_GET['id'];
        $updateFields = [];
        $values = [];
        
        if (isset($input['full_name'])) {
            $updateFields[] = "full_name = ?";
            $values[] = $input['full_name'];
        }
        if (isset($input['email'])) {
            if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
                http_response_code(400);
                echo json_encode(['error' => 'Email format is invalid']);
                exit;
            }
            $updateFields[] = "email = ?";
            $values[] = $input['email'];
        }
        if (isset($input['phone'])) {
            $updateFields[] = "phone = ?";
            $values[] = $input['phone'];
        }
        if (isset($input['password'])) {
            $updateFields[] = "password = ?";
            $values[] = password_hash($input['password'], PASSWORD_DEFAULT);
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
        
        $values[] = $userId;
        $sql = "UPDATE users SET " . implode(', ', $updateFields) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        
        if ($stmt->execute($values)) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update user']);
        }
        break;
        
    case 'DELETE':
        // Logical delete (soft delete)
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'User ID is required']);
            exit;
        }
        
        $userId = (int)$_GET['id'];
        $stmt = $pdo->prepare("UPDATE users SET is_active = 0 WHERE id = ?");
        if ($stmt->execute([$userId])) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete user']);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}
?>

