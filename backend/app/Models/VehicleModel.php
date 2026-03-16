<?php

namespace App\Models;

use CodeIgniter\Model;

class VehicleModel extends Model
{
    protected $table      = 'vehicles';
    protected $primaryKey = 'id';

    protected $useTimestamps = true;
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';

    protected $allowedFields = [
        'marque',
        'modele',
        'version',
        'annee_fabrication',
        'immatriculation',
        'couleur',
        'kilometrage_actuel',
        'type_vehicule',
        'carburant',
        'transmission',
        'puissance_ch',
        'nombre_portes',
        'nombre_places',
        'date_mise_circulation',
        'date_dernier_controle',
        'photos',
        'statut',
    ];

    /**
     * Retourne le JSON des photos comme array PHP
     */
    public function getPhotosArray($vehicle)
    {
        if (is_array($vehicle)) {
            $vehicle['photos'] = json_decode($vehicle['photos'], true) ?? [];
        } else {
            $vehicle->photos = json_decode($vehicle->photos, true) ?? [];
        }
        return $vehicle;
    }

    /**
     * Ajouter de nouvelles photos à un véhicule existant
     * $newPhotos : array de chemins
     */
    public function addPhotos(int $vehicleId, array $newPhotos)
    {
        $vehicle = $this->find($vehicleId);
        $photos = json_decode($vehicle['photos'], true) ?? [];
        $photos = array_merge($photos, $newPhotos);
        $this->update($vehicleId, ['photos' => json_encode($photos)]);
        return $photos;
    }

    /**
     * Supprimer une photo spécifique
     */
    public function removePhoto(int $vehicleId, string $photoPath)
    {
        $vehicle = $this->find($vehicleId);
        $photos = json_decode($vehicle['photos'], true) ?? [];
        $key = array_search($photoPath, $photos);

        if ($key !== false) {
            unset($photos[$key]);
            $photos = array_values($photos);
            $this->update($vehicleId, ['photos' => json_encode($photos)]);
        }

        return $photos;
    }
}
