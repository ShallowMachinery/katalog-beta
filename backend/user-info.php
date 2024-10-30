<?php
require 'config.php';
require 'vendor/autoload.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\ExpiredException;

$response = array('success' => false, 'message' => '', 'userInfo' => null);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $headers = apache_request_headers();
    $accessToken = $headers['Authorization'] ?? '';
    $username = $_GET['username'] ?? null;

    try {
        if (strpos($accessToken, 'Bearer ') === 0) {
            $accessToken = substr($accessToken, 7);
        }
        $key = new Key($secretKey, 'HS256');
        $decoded = JWT::decode($accessToken, $key);

        if (isset($decoded->data) && isset($decoded->data->user_id)) {
            $stmt = $conn->prepare("
                SELECT u.`first_name`, u.`last_name`, u.`user_picture_link`, u.`user_name`, u.`user_type_name`, p.`user_points` FROM `katalog1`.`Accounts` u
                JOIN `katalog1`.`User_Points` p ON u.`user_id` = p.`user_id`
                WHERE `user_name` = ?");
            $stmt->bind_param('s', $username);
            $stmt->execute();
            $stmt->store_result();

            if ($stmt->num_rows > 0) {
                $stmt->bind_result($first_name, $last_name, $user_picture_link, $user_name, $user_type_name, $user_points);
                $stmt->fetch();

                $response['success'] = true;
                $response['userInfo'] = array(
                    'first_name' => $first_name,
                    'last_name' => $last_name,
                    'user_picture_url' => $user_picture_link,
                    'user_name' => $user_name,
                    'user_type_name' => $user_type_name,
                    'user_points' => $user_points
                );
            } else {
                $response['message'] = 'User not found.';
            }
            $stmt->close();
        } else {
            $response['message'] = 'Invalid token structure.';
        }
    } catch (ExpiredException $e) {
        $response['message'] = 'Access token has expired.';
    } catch (Exception $e) {
        $response['message'] = 'Invalid access token.';
    }
} else {
    $response['message'] = 'Invalid request method.';
}

echo json_encode($response);
