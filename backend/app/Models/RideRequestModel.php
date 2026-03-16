<?php

namespace App\Models;

use CodeIgniter\Model;

class RideRequestModel extends Model
{
    protected $table         = 'ride_requests';
    protected $primaryKey    = 'id';
    protected $returnType    = 'array';
    protected $useTimestamps = true;
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';

    /**
     * ✅ Champs autorisés (SANS user_id)
     */
    protected $allowedFields = [
        'departure_location',
        'arrival_location',
        'desired_date',
        'desired_time',
        'seats_needed',
        'luggage_info',
        'message',
        'status',
        'is_notified',
    ];

    /**
     * ✅ Règles de validation
     */
    protected $validationRules = [
        'departure_location' => 'required|string|max_length[100]',
        'arrival_location'   => 'required|string|max_length[100]',
        'desired_date'       => 'required|valid_date[Y-m-d]',
        'desired_time'       => 'permit_empty|regex_match[/^\d{2}:\d{2}(:\d{2})?$/]',
        'seats_needed'       => 'required|integer|greater_than_equal_to[1]',
        'luggage_info'       => 'permit_empty|string|max_length[255]',
        'message'            => 'permit_empty|string',
        'status'             => 'permit_empty|in_list[active,matched,completed,cancelled]',
        'is_notified'        => 'permit_empty|in_list[0,1]',
    ];

    protected $beforeInsert = ['normalizeFields'];
    protected $beforeUpdate = ['normalizeFields'];

    /**
     * 🔧 Normalisation des champs
     */
    protected function normalizeFields(array $data)
    {
        // desired_date → Y-m-d
        if (!empty($data['data']['desired_date'])) {
            $data['data']['desired_date'] = date(
                'Y-m-d',
                strtotime($data['data']['desired_date'])
            );
        }

        // desired_time → HH:MM:SS
        if (!empty($data['data']['desired_time'])
            && preg_match('/^\d{2}:\d{2}$/', $data['data']['desired_time'])) {
            $data['data']['desired_time'] .= ':00';
        }

        // is_notified → BOOLEAN
        $data['data']['is_notified'] =
            isset($data['data']['is_notified'])
            ? (bool) $data['data']['is_notified']
            : false;

        // status par défaut
        if (empty($data['data']['status'])) {
            $data['data']['status'] = 'active';
        }

        return $data;
    }
}
