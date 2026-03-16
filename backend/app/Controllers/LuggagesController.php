<?php

namespace App\Controllers;

use App\Models\LuggageModel;
use CodeIgniter\RESTful\ResourceController;

class LuggagesController extends ResourceController
{
    protected $luggageModel;
    protected $format = 'json';

    public function __construct()
    {
        $this->luggageModel = new LuggageModel();
    }

    /**
     * 🟦 GET /luggages
     * Récupérer tous les bagages
     */
    public function index()
    {
        $luggages = $this->luggageModel
            ->orderBy('created_at', 'DESC')
            ->findAll() ?? [];

        // Toujours retourner un JSON valide même si vide
        return $this->respond([
            'status'   => true,
            'luggages' => array_map([$this, 'formatLuggage'], $luggages),
        ]);
    }

    /**
     * 🟦 GET /luggages/{id}
     */
    public function show($id = null)
    {
        $luggage = $this->luggageModel->find($id);

        if (!$luggage) {
            return $this->failNotFound("Bagage introuvable.");
        }

        return $this->respond([
            'status'  => true,
            'luggage' => $this->formatLuggage($luggage),
        ]);
    }

    /**
     * 🟩 POST /luggages
     */
    public function create()
    {
        $data = $this->request->getJSON(true);

        if (empty($data['name'])) {
            return $this->failValidationErrors('Le champ "name" est obligatoire.');
        }

        $insertId = $this->luggageModel->insert([
            'name'        => $data['name'],
            'description' => $data['description'] ?? null,
        ]);

        $luggage = $this->luggageModel->find($insertId);

        return $this->respondCreated([
            'status'  => true,
            'message' => 'Bagage créé avec succès.',
            'luggage' => $this->formatLuggage($luggage),
        ]);
    }

    /**
     * 🟧 PUT /luggages/{id}
     */
    public function update($id = null)
    {
        $luggage = $this->luggageModel->find($id);

        if (!$luggage) {
            return $this->failNotFound("Bagage introuvable.");
        }

        $data = $this->request->getJSON(true);

        $this->luggageModel->update($id, [
            'name'        => $data['name'] ?? $luggage['name'],
            'description' => $data['description'] ?? $luggage['description'],
        ]);

        $updatedLuggage = $this->luggageModel->find($id);

        return $this->respond([
            'status'  => true,
            'message' => 'Bagage mis à jour.',
            'luggage' => $this->formatLuggage($updatedLuggage),
        ]);
    }

    /**
     * 🟥 DELETE /luggages/{id}
     */
    public function delete($id = null)
    {
        $luggage = $this->luggageModel->find($id);

        if (!$luggage) {
            return $this->failNotFound("Bagage introuvable.");
        }

        $this->luggageModel->delete($id);

        return $this->respondDeleted([
            'status'  => true,
            'message' => 'Bagage supprimé.',
        ]);
    }

    /**
     * 🎛️ Format pour frontend
     */
    private function formatLuggage($luggage)
    {
        return [
            'id'          => (int) $luggage['id'], // garder int pour le frontend
            'name'        => $luggage['name'],
            'description' => $luggage['description'] ?? null,
            'created_at'  => $luggage['created_at'] ?? null,
            'updated_at'  => $luggage['updated_at'] ?? null,
        ];
    }
}
