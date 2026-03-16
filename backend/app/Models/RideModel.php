<?php

namespace App\Models;

use CodeIgniter\Model;

class RideModel extends Model
{
    protected $table = 'rides';
    protected $primaryKey = 'id';
    protected $returnType = 'array';
    protected $useTimestamps = true;
    protected $createdField = 'created_at';
    protected $updatedField = 'updated_at';

    protected $allowedFields = [
        'user_id',
        'vehicle_id',
        'luggage_id',
        'meeting_point_id',
        'departure',
        'destination',
        'departure_time',
        'available_seats',
        'price',
        'message',
        'is_public',
        'is_boosted',
        'status',
    ];

    protected $validationRules = [
        'user_id'        => 'required|integer',
        'vehicle_id'     => 'required|integer',
        'luggage_id'     => 'permit_empty|integer',
        'meeting_point_id' => 'permit_empty|integer',
        'departure'      => 'required|string|max_length[100]',
        'destination'    => 'required|string|max_length[100]',
        'departure_time' => 'required|valid_date[Y-m-d H:i:s]',
        'available_seats'=> 'required|integer|greater_than_equal_to[1]',
        'price'          => 'required|decimal',
        'message'        => 'permit_empty|string',
        'is_public'      => 'permit_empty',
        'is_boosted'     => 'permit_empty',
        'status'         => 'permit_empty|in_list[open,closed,cancelled,planned]',
    ];

    protected $beforeInsert = ['normalizeBooleans'];
    protected $beforeUpdate = ['normalizeBooleans'];

    /**
     * 🔄 Convert string/integer "1"/"0"/"true"/"false" → boolean réel
     */
    protected function normalizeBooleans(array $data)
    {
        foreach (['is_public', 'is_boosted'] as $field) {
            if (isset($data['data'][$field])) {
                $data['data'][$field] = filter_var(
                    $data['data'][$field],
                    FILTER_VALIDATE_BOOLEAN,
                    FILTER_NULL_ON_FAILURE
                );
            }
        }
        return $data;
    }

    /**
     * 📦 Convert JSON array en string JSON avant insertion
     */
    protected function encodeJsonFields(array $data)
    {
        if (isset($data['data']['meeting_points']) && is_array($data['data']['meeting_points'])) {
            $data['data']['meeting_points'] = json_encode($data['data']['meeting_points']);
        }
        return $data;
    }

    protected $skipValidation = false;
}
