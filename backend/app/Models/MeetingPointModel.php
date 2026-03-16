<?php

namespace App\Models;

use CodeIgniter\Model;

class MeetingPointModel extends Model
{
    protected $table = 'meeting_points';
    protected $primaryKey = 'id';

    protected $useAutoIncrement = true;
    protected $returnType = 'array';

    protected $useTimestamps = true;
    protected $createdField = 'created_at';
    protected $updatedField = 'updated_at';

    protected $allowedFields = [
        'name',
        'city',
        'latitude',
        'longitude',
        'address',
        'place_type',
        'is_active'
    ];

    /**
     * Retourner seulement les meeting points actifs
     */
    public function getActiveMeetingPoints()
    {
        return $this->where('is_active', true)
                    ->findAll();
    }

    /**
     * Filtrer par ville
     */
    public function getByCity($city)
    {
        return $this->where('city', $city)
                    ->where('is_active', true)
                    ->findAll();
    }

    /**
     * Filtrer par type de lieu
     */
    public function getByPlaceType($type)
    {
        return $this->where('place_type', $type)
                    ->where('is_active', true)
                    ->findAll();
    }

    /**
     * Trouver le meeting point le plus proche (simple)
     */
    public function getNearby($lat, $lng)
    {
        return $this->select("
                *,
                (6371 * acos(
                    cos(radians($lat)) *
                    cos(radians(latitude)) *
                    cos(radians(longitude) - radians($lng)) +
                    sin(radians($lat)) *
                    sin(radians(latitude))
                )) AS distance
            ")
            ->where('is_active', true)
            ->orderBy('distance', 'ASC')
            ->findAll();
    }
}