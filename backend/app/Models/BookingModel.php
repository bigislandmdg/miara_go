<?php

namespace App\Models;

use CodeIgniter\Model;

class BookingModel extends Model
{
    protected $table = 'bookings';
    protected $primaryKey = 'id';
    protected $returnType = 'array';
    protected $useTimestamps = true;
    protected $createdField = 'created_at';
    protected $updatedField = 'updated_at';

    protected $allowedFields = [
        'ride_id',
        'offer_id',
        'seats_reserved',
        'total_price',
        'status',
        'baby_on_board',
        'pets_on_board',
        'luggage_on_board',
    ];

    protected $validationRules = [
        'ride_id'        => 'required|integer',
        'offer_id'       => 'permit_empty|integer',
        'seats_reserved' => 'required|integer|greater_than_equal_to[1]',
        'total_price'    => 'required|decimal|greater_than_equal_to[0]',
        'status'         => 'permit_empty|in_list[pending,confirmed,cancelled,completed]',
        'baby_on_board'  => 'integer|in_list[0,1]',
        'pets_on_board'  => 'integer|in_list[0,1]',
        'luggage_on_board' => 'integer|in_list[0,1]',
    ];

    protected $validationMessages = [
        'ride_id' => [
            'required' => 'Le champ ride_id est obligatoire.',
            'integer'  => 'Le champ ride_id doit être un entier.',
        ],
        'offer_id' => [
            'integer' => 'Le champ offer_id doit être un entier.',
        ],
        'seats_reserved' => [
            'required' => 'Le nombre de sièges réservés est obligatoire.',
            'integer'  => 'Le nombre de sièges réservés doit être un entier.',
            'greater_than_equal_to' => 'Le nombre de sièges réservés doit être au moins 1.',
        ],
        'total_price' => [
            'required' => 'Le prix total est obligatoire.',
            'decimal'  => 'Le prix total doit être un nombre décimal.',
            'greater_than_equal_to' => 'Le prix total doit être au moins 0.',
        ],
        'status' => [
            'in_list' => 'Le statut doit être : pending, confirmed, cancelled ou completed.',
        ],
        'baby_on_board' => [
            'integer' => 'Le champ baby_on_board doit être 0 ou 1.',
            'in_list' => 'Le champ baby_on_board doit être 0 ou 1.',
        ],
        'pets_on_board' => [
            'integer' => 'Le champ pets_on_board doit être 0 ou 1.',
            'in_list' => 'Le champ pets_on_board doit être 0 ou 1.',
        ],
        'luggage_on_board' => [
            'integer' => 'Le champ luggage_on_board doit être 0 ou 1.',
            'in_list' => 'Le champ luggage_on_board doit être 0 ou 1.',
        ],
    ];
}
