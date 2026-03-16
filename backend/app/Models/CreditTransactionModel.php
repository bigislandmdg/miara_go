<?php

namespace App\Models;

use CodeIgniter\Model;

class CreditTransactionModel extends Model
{
    protected $table            = 'credit_transactions';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $allowedFields = [
        'user_id',
        'type',
        'amount',
        'description',
        'reference',
        'created_at',
    ];

    protected $useTimestamps = false;

    protected $validationRules = [
        'user_id' => 'required|integer',
        'type'    => 'required|string|max_length[50]',
        'amount'  => 'required|decimal',
    ];

    protected $skipValidation = false;

    // ✅ Créer une transaction
    public function createTransaction($data)
    {
        if ($this->insert($data)) {
            return $this->find($this->getInsertID());
        }
        return false;
    }
}
