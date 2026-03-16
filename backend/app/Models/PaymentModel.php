<?php

namespace App\Models;

use CodeIgniter\Model;

class PaymentModel extends Model
{
    protected $table = 'payments';
    protected $primaryKey = 'id';
    protected $returnType = 'array';
    protected $useTimestamps = false;

    protected $allowedFields = [
        'user_id',
        'amount',
        'method',
        'status',
        'transaction_reference',
        'created_at',
    ];

    protected $validationRules = [
        'user_id'              => 'required|integer',
        'amount'               => 'required|decimal|greater_than_equal_to[0]',
        'method'               => 'required|in_list[MVola,AirtelMoney,OrangeMoney]',
        'status'               => 'permit_empty|in_list[pending,completed,failed]',
        'transaction_reference'=> 'permit_empty|string|max_length[100]',
    ];

    protected $validationMessages = [
        'user_id' => [
            'required' => 'L’utilisateur est obligatoire.',
        ],
        'amount' => [
            'required' => 'Le montant est obligatoire.',
            'decimal'  => 'Le montant doit être un nombre décimal.',
        ],
        'method' => [
            'required' => 'Le mode de paiement est obligatoire.',
            'in_list'  => 'Le mode de paiement doit être MVola, AirtelMoney ou OrangeMoney.',
        ],
    ];

    protected $skipValidation = false;
}
