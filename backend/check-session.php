<?php
require 'config.php';
require 'vendor/autoload.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\ExpiredException;

$response = array('success' => false, 'message' => '');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $headers = apache_request_headers();
    $accessToken = $headers['authorization'] ?? '';
    
    try {
        if (strpos($accessToken, 'Bearer ') === 0) {
            $accessToken = substr($accessToken, 7);
        }
        $key = new Key($secretKey, 'HS256');
        $decoded = JWT::decode($accessToken, $key);
        $response['success'] = true;
        $response['message'] = 'Access token is valid.';
    } catch (ExpiredException $e) {
        $response['message'] = 'Access token has expired.';
    } catch (Exception $e) {
        $response['message'] = 'Invalid access token.';
    }
} else {
    $response['message'] = 'Invalid request method.';
}

echo json_encode($response);
?>
