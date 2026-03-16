<?php

namespace App\Models;

use CodeIgniter\Model;

class UserModel extends Model
{
    protected $table = 'users';
    protected $primaryKey = 'id';
    protected $returnType = 'array';
    protected $useTimestamps = true;
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';

    protected $allowedFields = [
        'nom',
        'prenom',
        'phone',
        'role',
        'is_verified',
        'otp_code',
        'otp_expires_at',
        'otp_attempts',
        'verification_status',
        // 🔹 Biometric fields
        'biometric_enabled',
        'biometric_token',
        'biometric_device_id'
    ];

    // Validation rules
    protected $validationRules = [
        'nom' => 'required|min_length[2]|max_length[100]',
        'prenom' => 'required|min_length[2]|max_length[100]',
        'phone' => 'required|is_unique[users.phone]|max_length[20]',
        'role' => 'required|in_list[user,driver,admin]',
    ];

    protected $validationMessages = [
        'phone' => [
            'is_unique' => 'Ce numéro de téléphone est déjà utilisé.'
        ],
        'role' => [
            'in_list' => 'Le rôle doit être user, driver ou admin.'
        ]
    ];

    protected $skipValidation = false;

    /**
     * Chercher un utilisateur par téléphone
     */
    public function findByPhone(string $phone)
    {
        return $this->where('phone', $phone)->first();
    }

    /**
     * Créer ou mettre à jour OTP
     */
    public function setOtp(string $phone, string $otp, string $expiry)
    {
        $user = $this->findByPhone($phone);

        if ($user) {
            return $this->update($user['id'], [
                'otp_code' => $otp,
                'otp_expires_at' => $expiry,
                'otp_attempts' => 0,
                'verification_status' => 'pending'
            ]);
        }

        return $this->insert([
            'phone' => $phone,
            'nom' => '',
            'prenom' => '',
            'role' => 'user',
            'is_verified' => false,
            'otp_code' => $otp,
            'otp_expires_at' => $expiry,
            'otp_attempts' => 0,
            'verification_status' => 'pending',
            // 🔹 Biometric defaults
            'biometric_enabled' => 0,
            'biometric_token' => null,
            'biometric_device_id' => null
        ]);
    }

    /**
     * Vérifier un OTP et marquer l'utilisateur comme vérifié
     */
    public function verifyOtp(string $phone, string $otp)
    {
        $user = $this->findByPhone($phone);
        if (!$user) return false;

        if ($user['otp_code'] !== $otp) {
            $this->update($user['id'], ['otp_attempts' => $user['otp_attempts'] + 1]);
            return false;
        }

        if (strtotime($user['otp_expires_at']) < time()) return false;

        $this->update($user['id'], [
            'is_verified' => true,
            'verification_status' => 'verified',
            'otp_code' => null,
            'otp_expires_at' => null
        ]);

        return true;
    }

    // ================= Biometric =================
    /**
     * Activer la biométrie pour un utilisateur
     */
    public function enableBiometric(int $userId, string $token, string $deviceId)
    {
        return $this->update($userId, [
            'biometric_enabled' => 1,
            'biometric_token' => $token,
            'biometric_device_id' => $deviceId
        ]);
    }

     /**
     * Désactiver la biométrie pour un utilisateur
     */
    public function disableBiometric(int $userId)
    {
        return $this->update($userId, [
            'biometric_enabled' => 0,
            'biometric_token' => null,
            'biometric_device_id' => null
        ]);
    }

     /**
     * Authentifier un utilisateur via biométrie
     */
    public function findByBiometric(string $token, string $deviceId)
    {
        return $this->where('biometric_enabled', 1)
                    ->where('biometric_token', $token)
                    ->where('biometric_device_id', $deviceId)
                    ->first();
    }
}
