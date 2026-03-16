<?php

namespace App\Models;

use CodeIgniter\Model;

class MessageModel extends Model
{
    protected $table = 'messages';
    protected $primaryKey = 'id';
    protected $returnType = 'array';
    protected $useTimestamps = true;
    protected $createdField = 'created_at';
    protected $updatedField = ''; // pas de updated_at pour cette table

    protected $allowedFields = [
        'ride_id',
        'sender_id',
        'content',
        'read',
    ];

    protected $validationRules = [
        'ride_id'   => 'required|integer',
        'sender_id' => 'required|integer',
        'content'   => 'required|string',
        'read'      => 'permit_empty|in_list[true,false]',
    ];

    protected $validationMessages = [
        'ride_id' => [
            'required' => 'Le champ ride_id est obligatoire.',
            'integer'  => 'Le champ ride_id doit être un nombre entier.',
        ],
        'sender_id' => [
            'required' => 'Le champ sender_id est obligatoire.',
            'integer'  => 'Le champ sender_id doit être un nombre entier.',
        ],
        'content' => [
            'required' => 'Le contenu du message est obligatoire.',
        ],
        'read' => [
            'in_list' => 'Le champ read doit être true ou false.',
        ],
    ];

    protected $beforeInsert = ['convertBooleans'];
    protected $beforeUpdate = ['convertBooleans'];

    /**
     * Convertit les champs booléens pour PostgreSQL
     */
    protected function convertBooleans(array $data)
    {
        foreach (['read'] as $field) {
            if (isset($data['data'][$field])) {
                $data['data'][$field] = filter_var($data['data'][$field], FILTER_VALIDATE_BOOLEAN);
            }
        }
        return $data;
    }

    protected $skipValidation = false;
}
