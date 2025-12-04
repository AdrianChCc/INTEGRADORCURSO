<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

require_once '../database-config.php';

$db = new DatabaseConfig();
$pdo = $db->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $reportType = $_GET['type'] ?? 'inventory';
    
    // Debug endpoint
    if ($reportType === 'debug') {
        $sql = "SELECT 
                    pu.id,
                    pu.purchase_date,
                    DATE(pu.purchase_date) as purchase_date_only,
                    CURDATE() as current_date,
                    DATE_SUB(CURDATE(), INTERVAL 7 DAY) as seven_days_ago,
                    DATEDIFF(CURDATE(), DATE(pu.purchase_date)) as days_ago,
                    p.name as product_name,
                    pu.quantity,
                    pu.total
                FROM purchases pu
                JOIN products p ON pu.product_id = p.id
                ORDER BY pu.purchase_date DESC
                LIMIT 10";
        $stmt = $pdo->query($sql);
        $debug = $stmt->fetchAll();
        echo json_encode([
            'last_10_purchases' => $debug,
            'server_timezone' => date_default_timezone_get(),
            'server_time' => date('Y-m-d H:i:s')
        ], JSON_PRETTY_PRINT);
        exit;
    }
    
    switch ($reportType) {
        case 'inventory':
            // Reporte de inventario actual
            $period = $_GET['period'] ?? 'weekly'; // weekly or monthly
            $daysBack = $period === 'weekly' ? 7 : 30;
            
            // Obtener productos con información de ventas
            // Usar CURDATE() en lugar de NOW() para incluir todo el día actual
            $sql = "SELECT 
                        p.id,
                        p.name,
                        p.category,
                        p.stock,
                        p.price,
                        p.is_active,
                        COALESCE(SUM(pu.quantity), 0) as sold_units,
                        COALESCE(SUM(pu.total), 0) as total_revenue
                    FROM products p
                    LEFT JOIN purchases pu ON p.id = pu.product_id 
                        AND DATE(pu.purchase_date) >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
                    GROUP BY p.id
                    ORDER BY total_revenue DESC";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$daysBack]);
            $inventory = $stmt->fetchAll();
            
            // Calcular estadísticas generales
            $totalProducts = count($inventory);
            $totalStock = array_sum(array_column($inventory, 'stock'));
            $totalSold = array_sum(array_column($inventory, 'sold_units'));
            $totalRevenue = array_sum(array_column($inventory, 'total_revenue'));
            $lowStockProducts = count(array_filter($inventory, function($item) {
                return $item['stock'] < 10;
            }));
            $outOfStockProducts = count(array_filter($inventory, function($item) {
                return $item['stock'] == 0;
            }));
            
            // Productos más vendidos
            $topProducts = array_slice($inventory, 0, 5);
            
            // Productos con bajo stock
            $lowStock = array_filter($inventory, function($item) {
                return $item['stock'] > 0 && $item['stock'] < 10;
            });
            usort($lowStock, function($a, $b) {
                return $a['stock'] - $b['stock'];
            });
            $lowStock = array_slice($lowStock, 0, 5);
            
            // Ventas por categoría
            $categorySales = [];
            foreach ($inventory as $item) {
                $category = $item['category'];
                if (!isset($categorySales[$category])) {
                    $categorySales[$category] = [
                        'category' => $category,
                        'units_sold' => 0,
                        'revenue' => 0
                    ];
                }
                $categorySales[$category]['units_sold'] += $item['sold_units'];
                $categorySales[$category]['revenue'] += $item['total_revenue'];
            }
            $categorySales = array_values($categorySales);
            
            echo json_encode([
                'period' => $period,
                'days_back' => $daysBack,
                'summary' => [
                    'total_products' => $totalProducts,
                    'total_stock' => $totalStock,
                    'total_sold' => $totalSold,
                    'total_revenue' => $totalRevenue,
                    'low_stock_count' => $lowStockProducts,
                    'out_of_stock_count' => $outOfStockProducts
                ],
                'top_products' => $topProducts,
                'low_stock_products' => $lowStock,
                'category_sales' => $categorySales,
                'all_products' => $inventory
            ]);
            break;
            
        case 'sales':
            // Reporte de ventas por período
            $period = $_GET['period'] ?? 'weekly';
            $daysBack = $period === 'weekly' ? 7 : 30;
            
            $sql = "SELECT 
                        DATE(purchase_date) as date,
                        COUNT(*) as transaction_count,
                        SUM(quantity) as units_sold,
                        SUM(total) as revenue
                    FROM purchases
                    WHERE purchase_date >= DATE_SUB(NOW(), INTERVAL ? DAY)
                    GROUP BY DATE(purchase_date)
                    ORDER BY date DESC";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$daysBack]);
            $dailySales = $stmt->fetchAll();
            
            echo json_encode([
                'period' => $period,
                'daily_sales' => $dailySales
            ]);
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid report type']);
            break;
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?>

