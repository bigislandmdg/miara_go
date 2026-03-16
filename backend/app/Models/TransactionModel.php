<?php

namespace App\Models;

use CodeIgniter\Model;

class TransactionModel extends Model
{
    protected $table            = 'transactions';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;

    protected $allowedFields = [
        'user_id',
        'type',
        'amount',
        'payment_method',
        'status',
        'reference',
        'created_at'
    ];

    protected $returnType    = 'array';
    protected $useTimestamps = false;
    protected $skipValidation = false;

    // 🔹 Créer une transaction (pending par défaut)
    public function createTransaction(array $data)
    {
        $data['status'] = $data['status'] ?? 'pending';

        if ($this->insert($data)) {
            return $this->find($this->getInsertID());
        }

        return null;
    }

    // 🔹 Mettre à jour le statut d'une transaction
    public function setStatus(int $transactionId, string $status)
    {
        return $this->update($transactionId, [
            'status' => $status
        ]);
    }

    // ✅ MÉTHODE MANQUANTE (CAUSE DU 500)
    // 🔹 Trouver une transaction par référence
    public function findByReference(string $reference)
    {
        return $this->where('reference', $reference)->first();
    }

    // 🔹 Historique utilisateur
    public function getByUser(int $userId)
    {
        return $this->where('user_id', $userId)
                    ->orderBy('created_at', 'DESC')
                    ->findAll();
    }
}
