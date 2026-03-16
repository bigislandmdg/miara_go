<?php

namespace App\Models;

use CodeIgniter\Model;
use CodeIgniter\I18n\Time;

class OtpVerificationModel extends Model
{
    protected $table = 'otp_verifications';
    protected $primaryKey = 'id';
    protected $returnType = 'array';
    protected $useTimestamps = true;
    protected $createdField  = 'created_at';
    protected $updatedField  = '';

    protected $allowedFields = [
        'phone',
        'otp_code',
        'expires_at',
        'is_used'
    ];

    /**
     * Crée un OTP pour un numéro de téléphone
     *
     * @param string $phone
     * @param string $otpCode
     * @param int $validity Duration in minutes (default 5 minutes)
     * @return int|null ID de l'OTP créé
     */
    public function createOtp(string $phone, string $otpCode, int $validity = 5)
    {
        $expiresAt = Time::now()->addMinutes($validity)->toDateTimeString();

        return $this->insert([
            'phone'      => $phone,
            'otp_code'   => $otpCode,
            'expires_at' => $expiresAt,
            'is_used'    => false,
        ]);
    }

    /**
     * Vérifie si un OTP est valide
     *
     * @param string $phone
     * @param string $otpCode
     * @return bool
     */
    public function verifyOtp(string $phone, string $otpCode): bool
    {
        $otpRecord = $this->where('phone', $phone)
                          ->where('otp_code', $otpCode)
                          ->where('is_used', false)
                          ->first();

        if (!$otpRecord) {
            return false;
        }

        $expiresAt = strtotime($otpRecord['expires_at']);
        if ($expiresAt < time()) {
            return false; // OTP expiré
        }

        // Marquer l'OTP comme utilisé
        $this->update($otpRecord['id'], ['is_used' => true]);

        return true;
    }

    /**
     * Supprime les OTP expirés (optionnel pour nettoyage)
     */
    public function cleanupExpiredOtps()
    {
        $this->where('expires_at <', date('Y-m-d H:i:s'))
             ->delete();
    }

    /**
     * Récupérer le dernier OTP envoyé pour un téléphone
     */
    public function getLastOtp(string $phone)
    {
        return $this->where('phone', $phone)
                    ->orderBy('created_at', 'DESC')
                    ->first();
    }
}
