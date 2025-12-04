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

// Handle GET requests (for username/email availability checks)
if ($method == 'GET') {
    $action = $_GET['action'] ?? '';
    
    switch ($action) {
        case 'check_username':
            if (!isset($_GET['username'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Username is required']);
                exit;
            }
            
            $username = $_GET['username'];
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE username = ?");
            $stmt->execute([$username]);
            $exists = $stmt->fetchColumn() > 0;
            
            echo json_encode(['exists' => $exists]);
            break;
            
        case 'check_email':
            if (!isset($_GET['email'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Email is required']);
                exit;
            }
            
            $email = $_GET['email'];
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE email = ?");
            $stmt->execute([$email]);
            $exists = $stmt->fetchColumn() > 0;
            
            echo json_encode(['exists' => $exists]);
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
            break;
    }
    exit;
}

// Handle POST requests (for login and registration)
if ($method == 'POST') {
    $action = $input['action'] ?? 'login';
    
    switch ($action) {
        case 'login':
            if (!isset($input['username']) || !isset($input['password'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Username and password are required']);
                exit;
            }
            
            $username = $input['username'];
            $password = $input['password'];
            
            // Check for admin user first
            if ($username === 'admin' && $password === '0000') {
                echo json_encode([
                    'success' => true,
                    'user' => [
                        'id' => 0,
                        'username' => 'admin',
                        'full_name' => 'Administrador',
                        'email' => 'admin@tennisclub.com',
                        'role' => 'admin'
                    ]
                ]);
                exit;
            }
            
            // Check regular users
            $stmt = $pdo->prepare("SELECT id, username, password, full_name, email, role, is_active FROM users WHERE username = ?");
            $stmt->execute([$username]);
            $user = $stmt->fetch();
            
            if ($user && password_verify($password, $user['password']) && $user['is_active']) {
                unset($user['password']);
                echo json_encode([
                    'success' => true,
                    'user' => $user
                ]);
            } else {
                http_response_code(401);
                echo json_encode(['error' => 'Invalid credentials']);
            }
            break;
            
        case 'register':
            // Validate required fields
            $required = ['full_name', 'email', 'phone', 'username', 'password'];
            foreach ($required as $field) {
                if (!isset($input[$field]) || empty(trim($input[$field]))) {
                    http_response_code(400);
                    echo json_encode(['error' => "El campo $field es obligatorio"]);
                    exit;
                }
            }
            
            $fullName = trim($input['full_name']);
            $email = trim($input['email']);
            $phone = trim($input['phone']);
            $username = trim($input['username']);
            $password = $input['password'];
            
            // Validate email format
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                http_response_code(400);
                echo json_encode(['error' => 'Formato de email inválido']);
                exit;
            }
            
            // Check if username already exists
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE username = ?");
            $stmt->execute([$username]);
            if ($stmt->fetchColumn() > 0) {
                http_response_code(409);
                echo json_encode(['error' => 'Este nombre de usuario ya está en uso']);
                exit;
            }
            
            // Check if email already exists
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE email = ?");
            $stmt->execute([$email]);
            if ($stmt->fetchColumn() > 0) {
                http_response_code(409);
                echo json_encode(['error' => 'Ya existe una cuenta con este correo electrónico']);
                exit;
            }
            
            // Hash password
            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
            
            // Insert new user
            try {
                $stmt = $pdo->prepare("
                    INSERT INTO users (full_name, email, phone, username, password, role, is_active) 
                    VALUES (?, ?, ?, ?, ?, 'user', 1)
                ");
                $result = $stmt->execute([$fullName, $email, $phone, $username, $hashedPassword]);
                
                if ($result) {
                    $userId = $pdo->lastInsertId();
                    echo json_encode([
                        'success' => true,
                        'message' => 'Usuario registrado exitosamente',
                        'user_id' => $userId
                    ]);
                } else {
                    http_response_code(500);
                    echo json_encode(['error' => 'Error al registrar el usuario']);
                }
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Error en la base de datos: ' . $e->getMessage()]);
            }
            break;
            
        case 'request_password_reset':
            if (!isset($input['identifier']) || empty(trim($input['identifier']))) {
                http_response_code(400);
                echo json_encode(['error' => 'Usuario o email es requerido']);
                exit;
            }
            
            $identifier = trim($input['identifier']);
            
            // Check if user exists by username or email
            $stmt = $pdo->prepare("SELECT id, username, email FROM users WHERE username = ? OR email = ?");
            $stmt->execute([$identifier, $identifier]);
            $user = $stmt->fetch();
            
            if (!$user) {
                http_response_code(404);
                echo json_encode(['error' => 'No se encontró ningún usuario con ese nombre de usuario o email']);
                exit;
            }
            
            // Generate a unique token
            $token = bin2hex(random_bytes(32));
            
            // Set expiration time (1 hour from now)
            $expiresAt = date('Y-m-d H:i:s', strtotime('+1 hour'));
            
            try {
                // Delete any existing unused tokens for this user
                $stmt = $pdo->prepare("DELETE FROM password_reset_tokens WHERE user_id = ? AND used = 0");
                $stmt->execute([$user['id']]);
                
                // Insert new token
                $stmt = $pdo->prepare("
                    INSERT INTO password_reset_tokens (user_id, token, expires_at) 
                    VALUES (?, ?, ?)
                ");
                $result = $stmt->execute([$user['id'], $token, $expiresAt]);
                
                if ($result) {
                    echo json_encode([
                        'success' => true,
                        'token' => $token,
                        'message' => 'Token de restablecimiento generado exitosamente'
                    ]);
                } else {
                    http_response_code(500);
                    echo json_encode(['error' => 'Error al generar el token']);
                }
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Error en la base de datos: ' . $e->getMessage()]);
            }
            break;
            
        case 'reset_password':
            if (!isset($input['token']) || empty(trim($input['token']))) {
                http_response_code(400);
                echo json_encode(['error' => 'Token es requerido']);
                exit;
            }
            
            if (!isset($input['new_password']) || empty($input['new_password'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Nueva contraseña es requerida']);
                exit;
            }
            
            $token = trim($input['token']);
            $newPassword = $input['new_password'];
            
            // Validate password strength (same as registration)
            if (strlen($newPassword) < 8) {
                http_response_code(400);
                echo json_encode(['error' => 'La contraseña debe tener al menos 8 caracteres']);
                exit;
            }
            
            if (!preg_match('/[0-9]/', $newPassword)) {
                http_response_code(400);
                echo json_encode(['error' => 'La contraseña debe contener al menos un dígito (0-9)']);
                exit;
            }
            
            if (!preg_match('/[A-Z]/', $newPassword)) {
                http_response_code(400);
                echo json_encode(['error' => 'La contraseña debe contener al menos una mayúscula (A-Z)']);
                exit;
            }
            
            if (!preg_match('/[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?]/', $newPassword)) {
                http_response_code(400);
                echo json_encode(['error' => 'La contraseña debe contener al menos un carácter especial']);
                exit;
            }
            
            try {
                // Find the token and check if it's valid
                $stmt = $pdo->prepare("
                    SELECT user_id, expires_at, used 
                    FROM password_reset_tokens 
                    WHERE token = ?
                ");
                $stmt->execute([$token]);
                $tokenData = $stmt->fetch();
                
                if (!$tokenData) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Token inválido']);
                    exit;
                }
                
                if ($tokenData['used']) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Este token ya ha sido utilizado']);
                    exit;
                }
                
                // Check if token has expired
                $now = date('Y-m-d H:i:s');
                if ($now > $tokenData['expires_at']) {
                    http_response_code(400);
                    echo json_encode(['error' => 'El token ha expirado. Por favor, solicita uno nuevo']);
                    exit;
                }
                
                // Hash the new password
                $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
                
                // Update the user's password
                $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE id = ?");
                $result = $stmt->execute([$hashedPassword, $tokenData['user_id']]);
                
                if (!$result) {
                    http_response_code(500);
                    echo json_encode(['error' => 'Error al actualizar la contraseña']);
                    exit;
                }
                
                // Mark token as used
                $stmt = $pdo->prepare("UPDATE password_reset_tokens SET used = 1 WHERE token = ?");
                $stmt->execute([$token]);
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Contraseña actualizada exitosamente'
                ]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Error en la base de datos: ' . $e->getMessage()]);
            }
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['error' => 'Acción inválida']);
            break;
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
}
?>

