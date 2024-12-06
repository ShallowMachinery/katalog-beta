<?php
require 'config.php';

$response = ['success' => false, 'message' => ''];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    $username = $conn->real_escape_string(trim($data['username'] ?? ''));
    $email = $conn->real_escape_string(trim($data['email'] ?? ''));
    $password = $data['password'] ?? '';
    $firstName = $conn->real_escape_string(trim($data['firstName'] ?? ''));
    $middleName = $conn->real_escape_string(trim($data['middleName'] ?? ''));
    $surname = $conn->real_escape_string(trim($data['surname'] ?? ''));
    $birthday = $conn->real_escape_string(trim($data['birthday'] ?? ''));

    if (empty($username) || empty($email) || empty($password) || empty($firstName) || empty($surname) || empty($birthday)) {
        $response['message'] = 'All fields except middle name are required.';
        echo json_encode($response);
        exit;
    }

    $hashedPassword = hash('sha256', $password);

    $stmt = $conn->prepare("SELECT COUNT(*) FROM `katalog1`.`Accounts` WHERE `user_name` = ? OR `user_email` = ?");
    $stmt->bind_param("ss", $username, $email);
    $stmt->execute();
    $stmt->bind_result($count);
    $stmt->fetch();
    $stmt->close();

    if ($count > 0) {
        $response['message'] = 'Username or email already exists.';
        echo json_encode($response);
        exit;
    }

    $userPictureLink = '';
    $userHierarchy = 3;
    $userTypeName = "Contributor";

    $stmt = $conn->prepare("INSERT INTO `katalog1`.`Accounts` (`last_name`, `first_name`, `middle_name`, `user_picture_link`, `user_hierarchy`, `user_type_name`, `user_email`, `user_password`, `user_name`, `birthday`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("ssssisssss", $surname, $firstName, $middleName, $userPictureLink, $userHierarchy, $userTypeName, $email, $hashedPassword, $username, $birthday);

    if ($stmt->execute()) {
        $userId = $conn->insert_id;

        $stmt = $conn->prepare("INSERT INTO `katalog1`.`User_Points` (`user_id`, `user_points`) VALUES (?, 0)");
        $stmt->bind_param("i", $userId);

        if (!$stmt->execute()) {
            $response['message'] = 'Failed to initialize user points.';
        }

        $response['success'] = true;
        $response['message'] = 'Registration successful!';
    } else {
        $response['message'] = 'Registration failed. Please try again later.';
    }

    $stmt->close();
} else {
    $response['message'] = 'Invalid request method.';
}

echo json_encode($response);

$conn->close();
?>
