<?php

namespace App\Controllers;

use App\Models\MeetingPointModel;
use CodeIgniter\RESTful\ResourceController;

class MeetingPointsController extends ResourceController
{
    protected $meetingPointModel;
    protected $format = 'json';

    public function __construct()
    {
        $this->meetingPointModel = new MeetingPointModel();
    }

    /**
     * 🟦 GET /meeting-points
     */
    public function index()
    {
        $points = $this->meetingPointModel
            ->orderBy('created_at', 'DESC')
            ->findAll();

        return $this->respond([
            'status' => true,
            'meeting_points' => array_map([$this, 'formatMeetingPoint'], $points),
        ]);
    }

    /**
     * 🟦 GET /meeting-points/{id}
     */
    public function show($id = null)
    {
        $point = $this->meetingPointModel->find($id);

        if (!$point) {
            return $this->failNotFound("Meeting point introuvable.");
        }

        return $this->respond([
            'status' => true,
            'meeting_point' => $this->formatMeetingPoint($point),
        ]);
    }

    /**
     * 🟩 POST /meeting-points
     */
    public function create()
    {
        $data = $this->request->getJSON(true);

        if (empty($data)) {
            return $this->fail("Aucune donnée reçue.", 400);
        }

        if (!$this->meetingPointModel->insert($data)) {
            return $this->failValidationErrors($this->meetingPointModel->errors());
        }

        $id = $this->meetingPointModel->getInsertID();
        $point = $this->meetingPointModel->find($id);

        return $this->respondCreated([
            'status' => true,
            'message' => 'Meeting point créé avec succès.',
            'meeting_point' => $this->formatMeetingPoint($point),
        ]);
    }

    /**
     * 🟧 PUT /meeting-points/{id}
     */
    public function update($id = null)
    {
        $point = $this->meetingPointModel->find($id);

        if (!$point) {
            return $this->failNotFound("Meeting point introuvable.");
        }

        $data = $this->request->getJSON(true);

        if (!$this->meetingPointModel->update($id, $data)) {
            return $this->failValidationErrors($this->meetingPointModel->errors());
        }

        $updatedPoint = $this->meetingPointModel->find($id);

        return $this->respond([
            'status' => true,
            'message' => 'Meeting point mis à jour.',
            'meeting_point' => $this->formatMeetingPoint($updatedPoint),
        ]);
    }

    /**
     * 🟥 DELETE /meeting-points/{id}
     */
    public function delete($id = null)
    {
        $point = $this->meetingPointModel->find($id);

        if (!$point) {
            return $this->failNotFound("Meeting point introuvable.");
        }

        $this->meetingPointModel->delete($id);

        return $this->respondDeleted([
            'status' => true,
            'message' => 'Meeting point supprimé.',
        ]);
    }

    /**
     * 🎛️ Format pour frontend
     */
    private function formatMeetingPoint($point)
    {
        return [
            'id' => (string) $point['id'],
            'name' => $point['name'],
            'city' => $point['city'],
            'latitude' => (float) $point['latitude'],
            'longitude' => (float) $point['longitude'],
            'address' => $point['address'],
            'place_type' => $point['place_type'],
            'is_active' => (bool) $point['is_active'],
            'created_at' => $point['created_at'] ?? null,
            'updated_at' => $point['updated_at'] ?? null,
        ];
    }
}