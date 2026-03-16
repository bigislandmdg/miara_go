<?php

namespace App\Controllers;

use App\Models\MessageModel;
use App\Models\UserModel;
use App\Models\RideModel;
use CodeIgniter\RESTful\ResourceController;

class MessagesController extends ResourceController
{
    protected $format = 'json';
    protected $messageModel;
    protected $userModel;
    protected $rideModel;

    public function __construct()
    {
        $this->messageModel = new MessageModel();
        $this->userModel = new UserModel();
        $this->rideModel = new RideModel();
    }

    /**
     * 🔹 Lister tous les messages
     */
    public function index()
    {
        $messages = $this->messageModel->findAll();

        return $this->respond([
            'status' => true,
            'messages' => $messages
        ]);
    }

    /**
     * 🔹 Créer un message
     */
    public function create()
    {
        $data = $this->request->getJSON(true) ?? $this->request->getPost();

        // Vérifier ride_id
        if (empty($data['ride_id'])) {
            return $this->failValidationErrors('Le champ ride_id est obligatoire.');
        }

        $ride = $this->rideModel->find($data['ride_id']);
        if (!$ride) {
            return $this->failNotFound('Le ride_id fourni n’existe pas.');
        }

        // Vérifier sender_id
        if (empty($data['sender_id'])) {
            return $this->failValidationErrors('Le champ sender_id est obligatoire.');
        }

        $sender = $this->userModel->find($data['sender_id']);
        if (!$sender) {
            return $this->failNotFound('L’utilisateur (sender_id) fourni n’existe pas.');
        }

        // Champ read par défaut false
        if (!isset($data['read'])) {
            $data['read'] = false;
        } else {
            $data['read'] = filter_var($data['read'], FILTER_VALIDATE_BOOLEAN);
        }

        if (!$this->messageModel->insert($data)) {
            return $this->failValidationErrors($this->messageModel->errors());
        }

        $message = $this->messageModel->find($this->messageModel->getInsertID());

        return $this->respondCreated([
            'status' => true,
            'message' => 'Message créé avec succès.',
            'data' => $message
        ]);
    }

    /**
     * 🔹 Afficher un message
     */
    public function show($id = null)
    {
        $message = $this->messageModel->find($id);

        if (!$message) {
            return $this->failNotFound('Message non trouvé.');
        }

        return $this->respond([
            'status' => true,
            'message' => $message
        ]);
    }

    /**
     * 🔹 Mettre à jour un message
     */
    public function update($id = null)
    {
        $message = $this->messageModel->find($id);

        if (!$message) {
            return $this->failNotFound('Message non trouvé.');
        }

        $data = $this->request->getJSON(true) ?? $this->request->getRawInput();

        if (isset($data['read'])) {
            $data['read'] = filter_var($data['read'], FILTER_VALIDATE_BOOLEAN);
        }

        if (!$this->messageModel->update($id, $data)) {
            return $this->failValidationErrors($this->messageModel->errors());
        }

        $updatedMessage = $this->messageModel->find($id);

        return $this->respond([
            'status' => true,
            'message' => 'Message mis à jour avec succès.',
            'data' => $updatedMessage
        ]);
    }

    /**
     * 🔹 Supprimer un message
     */
    public function delete($id = null)
    {
        $message = $this->messageModel->find($id);

        if (!$message) {
            return $this->failNotFound('Message non trouvé.');
        }

        $this->messageModel->delete($id);

        return $this->respondDeleted([
            'status' => true,
            'message' => 'Message supprimé avec succès.'
        ]);
    }

    /**
     * 🔹 Filtrer les messages par ride_id ou sender_id
     */
    public function filter()
    {
        $rideId = $this->request->getVar('ride_id');
        $senderId = $this->request->getVar('sender_id');

        $builder = $this->messageModel;

        if ($rideId) {
            $builder = $builder->where('ride_id', (int)$rideId);
        }
        if ($senderId) {
            $builder = $builder->where('sender_id', (int)$senderId);
        }

        $messages = $builder->findAll();

        return $this->respond([
            'status' => true,
            'messages' => $messages
        ]);
    }
}
