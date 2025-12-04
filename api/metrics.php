<?php
header("Content-Type: application/json");

// 1. Tiempo de ejecución (latencia simulada real)
$latency = rand(80, 200); // ms simulados

// 2. Memoria real del script PHP
$memoryUsed = memory_get_usage(true);  
$memoryPeak = memory_get_peak_usage(true);

// 3. Errores del log (simulación simple)
$errors = rand(0, 5);

// 4. Requests por minuto (simulación)
$requests = rand(20, 120);

// 5. Carga de base de datos (tiempo simulado)
$dbLoad = rand(30, 120); // ms

$response = [
    "latency" => $latency,
    "memory_used" => $memoryUsed,
    "memory_peak" => $memoryPeak,
    "errors" => $errors,
    "requests" => $requests,
    "db_load" => $dbLoad,
    "timestamp" => date("H:i:s")
];

echo json_encode($response);
?>
