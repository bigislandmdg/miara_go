<?php

namespace App\Models;

use CodeIgniter\Model;

class LuggageModel extends Model
{
    protected $table            = 'luggages';
    protected $primaryKey       = 'id';
   
    protected $useTimestamps = true;
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
    protected $allowedFields    = [
        'name',
        'description',
    ];
}
