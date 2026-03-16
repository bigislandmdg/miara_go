<?php

namespace App\Models;

use CodeIgniter\Model;

class CreditModel extends Model
{
    protected $table = 'credits';
    protected $primaryKey = 'id';
    protected $useAutoIncrement = true;

    protected $allowedFields = [
        'user_id',
        'transaction_id',
        'credit_amount',
        'status',
        'created_at'
    ];

    protected $returnType = 'array';
    protected $useTimestamps = false;

    public function createCredit(array $data)
    {
        // Sécurité : created_at toujours présent
        if (!isset($data['created_at'])) {
            $data['created_at'] = date('Y-m-d H:i:s');
        }

        $data['status'] = $data['status'] ?? 'pending';

        if (!$this->insert($data)) {
            log_message('error', '❌ Credit insert failed: ' . json_encode($data));
            return null;
        }

        return $this->find($this->getInsertID());
    }

    public function validateCredit($creditId)
    {
        return $this->update($creditId, [
            'status' => 'valid'
        ]);
    }

    public function getByTransaction(int $transactionId)
    {
        return $this->where('transaction_id', $transactionId)->first();
    }

    public function getByUser(int $userId)
    {
        return $this->where('user_id', $userId)
            ->orderBy('created_at', 'DESC')
            ->findAll();
    }
}
