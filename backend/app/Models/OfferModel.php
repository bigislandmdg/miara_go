<?php

namespace App\Models;

use CodeIgniter\Model;

class OfferModel extends Model
{
    protected $table = 'offers';
    protected $primaryKey = 'id';
    protected $returnType = 'array';
    protected $useTimestamps = true;
    protected $createdField = 'created_at';
    protected $updatedField = 'updated_at';

    protected $allowedFields = [
        'ride_request_id',
        'driver_id',
        'price_per_seat',
        'seats_offered',
        'message',
        'car_info',
        'status',
    ];

    protected $validationRules = [
        'ride_request_id' => 'required|integer',
        'driver_id'       => 'required|integer',
        'price_per_seat'  => 'required|decimal',
        'seats_offered'   => 'required|integer|greater_than_equal_to[1]',
        'status'          => 'permit_empty|in_list[pending,accepted,rejected,expired]',
    ];

    protected $validationMessages = [
        'ride_request_id' => [
            'required' => 'Le ride_request_id est obligatoire.',
            'integer'  => 'Le ride_request_id doit être un entier.',
        ],
        'driver_id' => [
            'required' => 'Le driver_id est obligatoire.',
            'integer'  => 'Le driver_id doit être un entier.',
        ],
        'price_per_seat' => [
            'required' => 'Le prix par siège est obligatoire.',
            'decimal'  => 'Le prix doit être un nombre décimal.',
        ],
        'seats_offered' => [
            'required' => 'Le nombre de sièges offerts est obligatoire.',
            'integer'  => 'Le nombre de sièges doit être un entier.',
        ],
        'status' => [
            'in_list' => 'Le status doit être pending, accepted, rejected ou expired.',
        ],
    ];

    protected $skipValidation = false;
}
