<?php

namespace App\Controllers;

use App\Models\VehicleModel;
use CodeIgniter\RESTful\ResourceController;

class VehiclesController extends ResourceController
{
    protected $vehicleModel;
    protected $format = 'json';

    public function __construct()
    {
        $this->vehicleModel = new VehicleModel();
    }

    /**
     * 🟦 GET /vehicles
     */
    public function index()
    {
        $vehicles = $this->vehicleModel
            ->orderBy('created_at', 'DESC')
            ->findAll();

        return $this->respond([
            'status'   => true,
            'vehicles' => array_map([$this, 'formatVehicle'], $vehicles),
        ]);
    }

    /**
     * 🟦 GET /vehicles/{id}
     */
    public function show($id = null)
    {
        $vehicle = $this->vehicleModel->find($id);

        if (!$vehicle) {
            return $this->failNotFound("Véhicule introuvable.");
        }

        return $this->respond([
            'status'  => true,
            'vehicle' => $this->formatVehicle($vehicle),
        ]);
    }

    /**
     * 🟩 POST /vehicles
     * Création + upload multiple photos
     */
    public function create()
{
    // 🔥 Support JSON + multipart
    $data = $this->request->getPost();

    if (empty($data)) {
        $data = $this->request->getJSON(true);
    }

    if (empty($data)) {
        return $this->fail("Aucune donnée reçue.", 400);
    }

    $photos = [];

    // 📸 Upload multiple si multipart
    $files = $this->request->getFileMultiple('photos');

    if ($files) {
        foreach ($files as $file) {
            if ($file->isValid() && !$file->hasMoved()) {
                $newName = $file->getRandomName();
                $file->move(FCPATH . 'uploads/vehicles/', $newName);
                $photos[] = base_url('uploads/vehicles/' . $newName);
            }
        }
    }

    $data['photos'] = json_encode($photos);

    if (!$this->vehicleModel->insert($data)) {
        return $this->failValidationErrors($this->vehicleModel->errors());
    }

    $id = $this->vehicleModel->getInsertID();
    $vehicle = $this->vehicleModel->find($id);

    return $this->respondCreated([
        'status'  => true,
        'message' => 'Véhicule créé avec succès.',
        'vehicle' => $this->formatVehicle($vehicle),
    ]);
    }


    /**
     * 🟧 PUT /vehicles/{id}
     * Update + ajout nouvelles photos
     */
    public function update($id = null)
{
    $vehicle = $this->vehicleModel->find($id);

    if (!$vehicle) {
        return $this->failNotFound("Véhicule introuvable.");
    }

    // ✅ IMPORTANT multipart
    $data = $this->request->getPost();

    $existingPhotos = $vehicle['photos']
        ? json_decode($vehicle['photos'], true)
        : [];

    // 📸 nouvelles photos
    $files = $this->request->getFileMultiple('photos');

    if ($files) {
        foreach ($files as $file) {
            if ($file->isValid() && !$file->hasMoved()) {
                $newName = $file->getRandomName();
                $file->move(FCPATH . 'uploads/vehicles/', $newName);
                $existingPhotos[] = base_url('uploads/vehicles/' . $newName);
            }
        }
    }

    $data['photos'] = json_encode($existingPhotos);

    if (!$this->vehicleModel->update($id, $data)) {
        return $this->failValidationErrors($this->vehicleModel->errors());
    }

    $updatedVehicle = $this->vehicleModel->find($id);

    return $this->respond([
        'status'  => true,
        'message' => 'Véhicule mis à jour.',
        'vehicle' => $this->formatVehicle($updatedVehicle),
    ]);
   }

    /**
     * 🟥 DELETE /vehicles/{id}
     */
    public function delete($id = null)
    {
        $vehicle = $this->vehicleModel->find($id);

        if (!$vehicle) {
            return $this->failNotFound("Véhicule introuvable.");
        }

        // Supprimer fichiers physiques
        $photos = $vehicle['photos']
            ? json_decode($vehicle['photos'], true)
            : [];

        foreach ($photos as $photo) {
            $path = FCPATH . str_replace(base_url() . '/', '', $photo);
            if (file_exists($path)) {
                unlink($path);
            }
        }

        $this->vehicleModel->delete($id);

        return $this->respondDeleted([
            'status'  => true,
            'message' => 'Véhicule supprimé.',
        ]);
    }

    /**
     * 🗑 DELETE /vehicles/{id}/photos
     * Supprimer UNE photo spécifique
     */
    public function deletePhoto($id = null)
    {
        $vehicle = $this->vehicleModel->find($id);

        if (!$vehicle) {
            return $this->failNotFound("Véhicule introuvable.");
        }

        $data = $this->request->getJSON(true);

        if (empty($data['photo'])) {
            return $this->failValidationErrors("Photo URL requise.");
        }

        $photos = json_decode($vehicle['photos'], true) ?? [];

        $updatedPhotos = array_filter($photos, function ($p) use ($data) {
            return $p !== $data['photo'];
        });

        // Supprimer fichier physique
        $path = FCPATH . str_replace(base_url() . '/', '', $data['photo']);
        if (file_exists($path)) {
            unlink($path);
        }

        $this->vehicleModel->update($id, [
            'photos' => json_encode(array_values($updatedPhotos))
        ]);

        return $this->respond([
            'status'  => true,
            'message' => 'Photo supprimée.',
        ]);
    }

    /**
     * 🎛️ Format pour frontend
     */
    private function formatVehicle($vehicle)
    {
        return [
            'id' => (string) $vehicle['id'],
            'marque' => $vehicle['marque'],
            'modele' => $vehicle['modele'],
            'version' => $vehicle['version'],
            'annee_fabrication' => (int) $vehicle['annee_fabrication'],
            'immatriculation' => $vehicle['immatriculation'],
            'couleur' => $vehicle['couleur'],
            'kilometrage_actuel' => (int) $vehicle['kilometrage_actuel'],
            'type_vehicule' => $vehicle['type_vehicule'],
            'carburant' => $vehicle['carburant'],
            'transmission' => $vehicle['transmission'],
            'puissance_ch' => $vehicle['puissance_ch'],
            'nombre_portes' => $vehicle['nombre_portes'],
            'nombre_places' => $vehicle['nombre_places'],
            'date_mise_circulation' => $vehicle['date_mise_circulation'],
            'date_dernier_controle' => $vehicle['date_dernier_controle'],

            'photos' => $vehicle['photos']
                ? json_decode($vehicle['photos'], true)
                : [],

            'statut' => $vehicle['statut'],
            'created_at' => $vehicle['created_at'] ?? null,
            'updated_at' => $vehicle['updated_at'] ?? null,
        ];
    }
}
