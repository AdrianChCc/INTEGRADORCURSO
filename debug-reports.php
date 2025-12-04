<?php
require_once 'database-config.php';

$db = new DatabaseConfig();
$pdo = $db->getConnection();

// Obtener información de depuración
$sql = "SELECT 
            pu.id,
            pu.purchase_date,
            DATE(pu.purchase_date) as purchase_date_only,
            CURDATE() as today_date,
            DATE_SUB(CURDATE(), INTERVAL 7 DAY) as seven_days_ago,
            DATEDIFF(CURDATE(), DATE(pu.purchase_date)) as days_ago,
            u.username,
            p.name as product_name,
            pu.quantity,
            pu.total
        FROM purchases pu
        JOIN products p ON pu.product_id = p.id
        JOIN users u ON pu.user_id = u.id
        ORDER BY pu.purchase_date DESC
        LIMIT 20";

$stmt = $pdo->query($sql);
$purchases = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Obtener estadísticas del reporte semanal
$statsSQL = "SELECT 
                COUNT(DISTINCT p.id) as products_with_sales,
                SUM(pu.quantity) as total_units_sold,
                SUM(pu.total) as total_revenue
            FROM purchases pu
            JOIN products p ON pu.product_id = p.id
            WHERE DATE(pu.purchase_date) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";

$statsStmt = $pdo->query($statsSQL);
$stats = $statsStmt->fetch(PDO::FETCH_ASSOC);
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Depuración de Reportes - Tennis Club</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        h1 {
            color: #667eea;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #666;
            margin-bottom: 30px;
        }
        .info-box {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            border-left: 4px solid #667eea;
        }
        .info-box h3 {
            color: #764ba2;
            margin-top: 0;
        }
        .info-box p {
            margin: 5px 0;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: #667eea;
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
        }
        .stat-number {
            font-size: 2rem;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .stat-label {
            font-size: 0.9rem;
            opacity: 0.9;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th {
            background: #667eea;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
        }
        td {
            padding: 12px;
            border-bottom: 1px solid #ddd;
        }
        tr:hover {
            background: #f8f9fa;
        }
        .in-range {
            color: #27ae60;
            font-weight: bold;
        }
        .out-range {
            color: #e74c3c;
            font-weight: bold;
        }
        .btn {
            display: inline-block;
            padding: 12px 24px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            margin-top: 20px;
            transition: all 0.3s;
        }
        .btn:hover {
            background: #764ba2;
            transform: translateY(-2px);
        }
        .alert {
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .alert-warning {
            background: #fff3cd;
            color: #856404;
            border-left: 4px solid #ffc107;
        }
        .alert-success {
            background: #d4edda;
            color: #155724;
            border-left: 4px solid #28a745;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1><i class="fas fa-bug"></i> Depuración de Reportes de Inventario</h1>
        <p class="subtitle">Información detallada sobre las compras y el funcionamiento de los reportes</p>

        <!-- Información del Servidor -->
        <div class="info-box">
            <h3><i class="fas fa-server"></i> Información del Servidor</h3>
            <p><strong>Zona Horaria PHP:</strong> <?php echo date_default_timezone_get(); ?></p>
            <p><strong>Fecha/Hora del Servidor:</strong> <?php echo date('Y-m-d H:i:s'); ?></p>
            <p><strong>Fecha Actual MySQL:</strong> <?php echo $pdo->query("SELECT NOW()")->fetchColumn(); ?></p>
            <p><strong>Rango Semanal (últimos 7 días):</strong> Desde <?php echo $pdo->query("SELECT DATE_SUB(CURDATE(), INTERVAL 7 DAY)")->fetchColumn(); ?> hasta hoy</p>
        </div>

        <!-- Estadísticas del Reporte Semanal -->
        <h3><i class="fas fa-chart-line"></i> Estadísticas del Reporte Semanal (últimos 7 días)</h3>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-number"><?php echo $stats['products_with_sales'] ?? 0; ?></div>
                <div class="stat-label">Productos con Ventas</div>
            </div>
            <div class="stat-card">
                <div class="stat-number"><?php echo $stats['total_units_sold'] ?? 0; ?></div>
                <div class="stat-label">Unidades Vendidas</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">$<?php echo number_format($stats['total_revenue'] ?? 0, 2); ?></div>
                <div class="stat-label">Ingresos Totales</div>
            </div>
        </div>

        <?php if (empty($purchases)): ?>
            <div class="alert alert-warning">
                <strong><i class="fas fa-exclamation-triangle"></i> ¡Atención!</strong><br>
                No hay compras registradas en la base de datos. Realiza una compra desde el catálogo para poder verla reflejada en los reportes.
            </div>
        <?php else: ?>
            <div class="alert alert-success">
                <strong><i class="fas fa-check-circle"></i> Compras Encontradas</strong><br>
                Se encontraron <?php echo count($purchases); ?> compras en la base de datos.
            </div>
        <?php endif; ?>

        <!-- Tabla de Compras -->
        <h3><i class="fas fa-shopping-cart"></i> Últimas 20 Compras Registradas</h3>
        <p style="color: #666; font-size: 0.9rem;">
            Las compras con <span class="in-range">días atrás ≤ 7</span> deberían aparecer en el reporte semanal.<br>
            Las compras con <span class="out-range">días atrás > 7</span> NO aparecen en el reporte semanal (pero sí en el mensual si días atrás ≤ 30).
        </p>

        <?php if (!empty($purchases)): ?>
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Usuario</th>
                    <th>Producto</th>
                    <th>Fecha de Compra</th>
                    <th>Días Atrás</th>
                    <th>Cantidad</th>
                    <th>Total</th>
                    <th>Estado</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($purchases as $purchase): ?>
                <tr>
                    <td><?php echo $purchase['id']; ?></td>
                    <td><?php echo htmlspecialchars($purchase['username']); ?></td>
                    <td><?php echo htmlspecialchars($purchase['product_name']); ?></td>
                    <td><?php echo $purchase['purchase_date']; ?></td>
                    <td class="<?php echo $purchase['days_ago'] <= 7 ? 'in-range' : 'out-range'; ?>">
                        <?php echo $purchase['days_ago']; ?> días
                    </td>
                    <td><?php echo $purchase['quantity']; ?></td>
                    <td>$<?php echo number_format($purchase['total'], 2); ?></td>
                    <td>
                        <?php if ($purchase['days_ago'] <= 7): ?>
                            <span class="in-range"><i class="fas fa-check-circle"></i> En reporte semanal</span>
                        <?php elseif ($purchase['days_ago'] <= 30): ?>
                            <span style="color: #f39c12;"><i class="fas fa-clock"></i> Solo en mensual</span>
                        <?php else: ?>
                            <span class="out-range"><i class="fas fa-times-circle"></i> Fuera de rango</span>
                        <?php endif; ?>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
        <?php else: ?>
        <p style="text-align: center; padding: 40px; color: #999;">
            <i class="fas fa-inbox" style="font-size: 3rem; display: block; margin-bottom: 10px;"></i>
            No hay compras registradas
        </p>
        <?php endif; ?>

        <div style="margin-top: 30px; text-align: center;">
            <a href="admin-panel.html" class="btn">
                <i class="fas fa-arrow-left"></i> Volver al Panel de Administración
            </a>
        </div>
    </div>
</body>
</html>

