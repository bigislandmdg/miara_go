<?php

namespace App\Controllers;

use App\Models\MessageModel;
use App\Models\UserModel;
use App\Models\RideModel;
use CodeIgniter\RESTful\ResourceController;
use CodeIgniter\HTTP\ResponseInterface;

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
     * 🔹 GET /messages
     * Récupère les messages avec filtres optionnels
     */
    public function index()
    {
        $rideId = $this->request->getGet('ride_id');
        $userId = $this->request->getGet('user_id');
        $otherId = $this->request->getGet('other_id');
        $conversation = $this->request->getGet('conversation');
        $limit = $this->request->getGet('limit') ?? 50;
        $offset = $this->request->getGet('offset') ?? 0;

        try {
            // Récupérer une conversation spécifique entre deux utilisateurs
            if ($rideId && $userId && $otherId) {
                $messages = $this->messageModel->getConversationMessages(
                    (int)$rideId, 
                    (int)$userId, 
                    (int)$otherId, 
                    (int)$limit, 
                    (int)$offset
                );
                return $this->respond([
                    'status' => true,
                    'messages' => $messages,
                    'total' => count($messages)
                ]);
            }

            // Récupérer tous les messages d'un trajet
            if ($rideId) {
                $messages = $this->messageModel->getRideMessages((int)$rideId);
                return $this->respond([
                    'status' => true,
                    'messages' => $messages,
                    'total' => count($messages)
                ]);
            }

            // Récupérer par conversation_id
            if ($conversation) {
                $messages = $this->messageModel
                    ->where('conversation_id', $conversation)
                    ->where('is_deleted', 0)
                    ->orderBy('created_at', 'ASC')
                    ->limit((int)$limit, (int)$offset)
                    ->find();

                return $this->respond([
                    'status' => true,
                    'messages' => $messages,
                    'total' => count($messages)
                ]);
            }

            // Par défaut, retourner les messages récents
            $messages = $this->messageModel
                ->where('is_deleted', 0)
                ->orderBy('created_at', 'DESC')
                ->limit(50)
                ->find();

            return $this->respond([
                'status' => true,
                'messages' => $messages,
                'total' => count($messages)
            ]);

        } catch (\Exception $e) {
            return $this->failServerError('Erreur lors de la récupération des messages: ' . $e->getMessage());
        }
    }

    /**
     * 🔹 GET /messages/conversations/{userId}
     * Récupère toutes les conversations d'un utilisateur
     */
    public function conversations($userId = null)
    {
        if (!$userId) {
            return $this->fail('ID utilisateur requis', ResponseInterface::HTTP_BAD_REQUEST);
        }

        try {
            $user = $this->userModel->find($userId);
            if (!$user) {
                return $this->failNotFound('Utilisateur non trouvé');
            }

            $conversations = $this->messageModel->getUserConversations((int)$userId);

            return $this->respond([
                'status' => true,
                'conversations' => $conversations,
                'total' => count($conversations)
            ]);

        } catch (\Exception $e) {
            return $this->failServerError('Erreur lors de la récupération des conversations: ' . $e->getMessage());
        }
    }

    /**
     * 🔹 GET /messages/unread/{userId}
     * Récupère les messages non lus d'un utilisateur
     */
    public function unread($userId = null)
    {
        if (!$userId) {
            return $this->fail('ID utilisateur requis', ResponseInterface::HTTP_BAD_REQUEST);
        }

        try {
            $user = $this->userModel->find($userId);
            if (!$user) {
                return $this->failNotFound('Utilisateur non trouvé');
            }

            $unreadMessages = $this->messageModel->getUnreadMessages((int)$userId);
            $count = $this->messageModel->countUnreadMessages((int)$userId);

            return $this->respond([
                'status' => true,
                'unread_count' => $count,
                'messages' => $unreadMessages
            ]);

        } catch (\Exception $e) {
            return $this->failServerError('Erreur lors de la récupération des messages non lus: ' . $e->getMessage());
        }
    }

    /**
     * 🔹 GET /messages/search
     * Recherche dans les messages
     */
    public function search()
    {
        $query = $this->request->getGet('q');
        $userId = $this->request->getGet('user_id');

        if (!$query) {
            return $this->fail('Paramètre de recherche requis', ResponseInterface::HTTP_BAD_REQUEST);
        }

        if (!$userId) {
            return $this->fail('ID utilisateur requis', ResponseInterface::HTTP_BAD_REQUEST);
        }

        try {
            $results = $this->messageModel->searchMessages($query, (int)$userId);

            return $this->respond([
                'status' => true,
                'results' => $results,
                'total' => count($results)
            ]);

        } catch (\Exception $e) {
            return $this->failServerError('Erreur lors de la recherche: ' . $e->getMessage());
        }
    }

    /**
     * 🔹 GET /messages/stats/{userId}
     * Statistiques des messages d'un utilisateur
     */
    public function stats($userId = null)
    {
        if (!$userId) {
            return $this->fail('ID utilisateur requis', ResponseInterface::HTTP_BAD_REQUEST);
        }

        try {
            $user = $this->userModel->find($userId);
            if (!$user) {
                return $this->failNotFound('Utilisateur non trouvé');
            }

            $stats = $this->messageModel->getMessageStats((int)$userId);

            return $this->respond([
                'status' => true,
                'stats' => $stats
            ]);

        } catch (\Exception $e) {
            return $this->failServerError('Erreur lors de la récupération des statistiques: ' . $e->getMessage());
        }
    }

    /**
     * 🔹 POST /messages
     * Créer un nouveau message
     */
    public function create()
    {
        $data = $this->request->getJSON(true) ?? $this->request->getPost();

        // Validation des champs requis
        $required = ['ride_id', 'sender_id', 'receiver_id', 'content'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                return $this->fail("Le champ {$field} est obligatoire.", ResponseInterface::HTTP_BAD_REQUEST);
            }
        }

        try {
            // Vérifier que le trajet existe
            $ride = $this->rideModel->find($data['ride_id']);
            if (!$ride) {
                return $this->failNotFound('Le trajet spécifié n\'existe pas.');
            }

            // Vérifier que l'expéditeur existe
            $sender = $this->userModel->find($data['sender_id']);
            if (!$sender) {
                return $this->failNotFound('L\'expéditeur spécifié n\'existe pas.');
            }

            // Vérifier que le destinataire existe
            $receiver = $this->userModel->find($data['receiver_id']);
            if (!$receiver) {
                return $this->failNotFound('Le destinataire spécifié n\'existe pas.');
            }

            // Valeurs par défaut
            if (!isset($data['type'])) {
                $data['type'] = 'text';
            }
            if (!isset($data['status'])) {
                $data['status'] = 'sent';
            }
            if (!isset($data['read'])) {
                $data['read'] = 0;
            }
            if (!isset($data['is_deleted'])) {
                $data['is_deleted'] = 0;
            }

            // Insertion du message
            if (!$this->messageModel->insert($data)) {
                return $this->failValidationErrors($this->messageModel->errors());
            }

            $message = $this->messageModel->find($this->messageModel->getInsertID());

            // TODO: Déclencher un événement WebSocket pour notifier le destinataire
            // $this->triggerWebSocketNotification($message);

            return $this->respondCreated([
                'status' => true,
                'message' => 'Message envoyé avec succès.',
                'data' => $message
            ]);

        } catch (\Exception $e) {
            log_message('error', '[MessagesController::create] ' . $e->getMessage());
            return $this->failServerError('Erreur lors de l\'envoi du message: ' . $e->getMessage());
        }
    }

    /**
     * 🔹 POST /messages/with-metadata
     * Créer un message avec métadonnées (image, location)
     */
    public function createWithMetadata()
    {
        $data = $this->request->getJSON(true) ?? $this->request->getPost();

        $required = ['ride_id', 'sender_id', 'receiver_id', 'content', 'type'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                return $this->fail("Le champ {$field} est obligatoire.", ResponseInterface::HTTP_BAD_REQUEST);
            }
        }

        if (!in_array($data['type'], ['text', 'image', 'location'])) {
            return $this->fail('Le type doit être text, image ou location.', ResponseInterface::HTTP_BAD_REQUEST);
        }

        try {
            // Valeurs par défaut
            $data['status'] = $data['status'] ?? 'sent';
            $data['read'] = $data['read'] ?? 0;
            $data['is_deleted'] = $data['is_deleted'] ?? 0;
            $data['metadata'] = $data['metadata'] ?? null;

            if (!$this->messageModel->insert($data)) {
                return $this->failValidationErrors($this->messageModel->errors());
            }

            $message = $this->messageModel->find($this->messageModel->getInsertID());

            return $this->respondCreated([
                'status' => true,
                'message' => 'Message envoyé avec succès.',
                'data' => $message
            ]);

        } catch (\Exception $e) {
            log_message('error', '[MessagesController::createWithMetadata] ' . $e->getMessage());
            return $this->failServerError('Erreur lors de l\'envoi du message: ' . $e->getMessage());
        }
    }

    /**
     * 🔹 GET /messages/{id}
     * Afficher un message spécifique
     */
    public function show($id = null)
    {
        if (!$id) {
            return $this->fail('ID message requis', ResponseInterface::HTTP_BAD_REQUEST);
        }

        try {
            $message = $this->messageModel
                ->select('messages.*, 
                          sender.nom as sender_nom, 
                          sender.prenom as sender_prenom,
                          sender.role as sender_role,
                          receiver.nom as receiver_nom,
                          receiver.prenom as receiver_prenom,
                          receiver.role as receiver_role')
                ->join('users as sender', 'sender.id = messages.sender_id', 'left')
                ->join('users as receiver', 'receiver.id = messages.receiver_id', 'left')
                ->find($id);

            if (!$message || $message['is_deleted'] == 1) {
                return $this->failNotFound('Message non trouvé.');
            }

            return $this->respond([
                'status' => true,
                'message' => $message
            ]);

        } catch (\Exception $e) {
            return $this->failServerError('Erreur lors de la récupération du message: ' . $e->getMessage());
        }
    }

    /**
     * 🔹 PUT /messages/{id}
     * Mettre à jour un message
     */
    public function update($id = null)
    {
        if (!$id) {
            return $this->fail('ID message requis', ResponseInterface::HTTP_BAD_REQUEST);
        }

        try {
            $message = $this->messageModel->find($id);

            if (!$message || $message['is_deleted'] == 1) {
                return $this->failNotFound('Message non trouvé.');
            }

            $data = $this->request->getJSON(true) ?? $this->request->getRawInput();

            // Ne pas autoriser la modification de certains champs
            unset($data['id'], $data['ride_id'], $data['sender_id'], $data['receiver_id'], $data['created_at'], $data['conversation_id']);

            if (!$this->messageModel->update($id, $data)) {
                return $this->failValidationErrors($this->messageModel->errors());
            }

            $updatedMessage = $this->messageModel->find($id);

            return $this->respond([
                'status' => true,
                'message' => 'Message mis à jour avec succès.',
                'data' => $updatedMessage
            ]);

        } catch (\Exception $e) {
            return $this->failServerError('Erreur lors de la mise à jour: ' . $e->getMessage());
        }
    }

    /**
     * 🔹 PUT /messages/read
     * Marquer des messages comme lus
     */
    public function markAsRead()
    {
        $data = $this->request->getJSON(true) ?? $this->request->getRawInput();

        try {
            if (isset($data['ride_id']) && isset($data['user_id'])) {
                // Marquer tous les messages d'un trajet comme lus pour un utilisateur
                $affected = $this->messageModel->markConversationAsRead(
                    (int)$data['ride_id'],
                    (int)$data['user_id']
                );

                return $this->respond([
                    'status' => true,
                    'message' => 'Messages marqués comme lus.',
                    'affected' => $affected
                ]);
            }

            if (isset($data['message_id']) && isset($data['user_id'])) {
                // Marquer un message spécifique comme lu
                $affected = $this->messageModel->markMessageAsRead(
                    (int)$data['message_id'],
                    (int)$data['user_id']
                );

                if ($affected) {
                    return $this->respond([
                        'status' => true,
                        'message' => 'Message marqué comme lu.'
                    ]);
                }
            }

            return $this->fail('Paramètres invalides', ResponseInterface::HTTP_BAD_REQUEST);

        } catch (\Exception $e) {
            return $this->failServerError('Erreur lors du marquage des messages: ' . $e->getMessage());
        }
    }

    /**
     * 🔹 DELETE /messages/{id}
     * Supprimer un message (soft delete)
     */
    public function delete($id = null)
    {
        if (!$id) {
            return $this->fail('ID message requis', ResponseInterface::HTTP_BAD_REQUEST);
        }

        $userId = $this->request->getGet('user_id');

        if (!$userId) {
            return $this->fail('ID utilisateur requis', ResponseInterface::HTTP_BAD_REQUEST);
        }

        try {
            $message = $this->messageModel->find($id);

            if (!$message || $message['is_deleted'] == 1) {
                return $this->failNotFound('Message non trouvé.');
            }

            // Soft delete
            if ($this->messageModel->softDeleteMessage((int)$id, (int)$userId)) {
                return $this->respondDeleted([
                    'status' => true,
                    'message' => 'Message supprimé avec succès.'
                ]);
            }

            return $this->fail('Vous n\'êtes pas autorisé à supprimer ce message', ResponseInterface::HTTP_FORBIDDEN);

        } catch (\Exception $e) {
            return $this->failServerError('Erreur lors de la suppression: ' . $e->getMessage());
        }
    }

    /**
     * 🔹 DELETE /messages/conversation
     * Supprimer toute une conversation (soft delete)
     */
    public function deleteConversation()
    {
        $data = $this->request->getJSON(true) ?? $this->request->getRawInput();

        if (!isset($data['ride_id']) || !isset($data['user1_id']) || !isset($data['user2_id'])) {
            return $this->fail('Paramètres requis: ride_id, user1_id, user2_id', ResponseInterface::HTTP_BAD_REQUEST);
        }

        try {
            $affected = $this->messageModel->deleteConversation(
                (int)$data['ride_id'],
                (int)$data['user1_id'],
                (int)$data['user2_id']
            );

            return $this->respond([
                'status' => true,
                'message' => 'Conversation supprimée.',
                'affected' => $affected
            ]);

        } catch (\Exception $e) {
            return $this->failServerError('Erreur lors de la suppression de la conversation: ' . $e->getMessage());
        }
    }

    /**
     * 🔹 GET /messages/last/{rideId}/{user1Id}/{user2Id}
     * Récupérer le dernier message d'une conversation
     */
    public function lastMessage($rideId = null, $user1Id = null, $user2Id = null)
    {
        if (!$rideId || !$user1Id || !$user2Id) {
            return $this->fail('Paramètres requis: rideId, user1Id, user2Id', ResponseInterface::HTTP_BAD_REQUEST);
        }

        try {
            $message = $this->messageModel->getLastMessage(
                (int)$rideId,
                (int)$user1Id,
                (int)$user2Id
            );

            return $this->respond([
                'status' => true,
                'message' => $message
            ]);

        } catch (\Exception $e) {
            return $this->failServerError('Erreur lors de la récupération du dernier message: ' . $e->getMessage());
        }
    }

    /**
     * 🔹 POST /messages/cleanup
     * Nettoyer les anciens messages (admin only)
     */
    public function cleanup()
    {
        // TODO: Ajouter une vérification admin
        $days = $this->request->getPost('days') ?? 30;

        try {
            $affected = $this->messageModel->cleanupOldMessages((int)$days);

            return $this->respond([
                'status' => true,
                'message' => "{$affected} anciens messages nettoyés.",
                'affected' => $affected
            ]);

        } catch (\Exception $e) {
            return $this->failServerError('Erreur lors du nettoyage: ' . $e->getMessage());
        }
    }

    /**
     * 🔹 GET /messages/between/{userId1}/{userId2}/{rideId}
     * Récupérer les messages entre deux utilisateurs pour un trajet
     */
    public function between($userId1 = null, $userId2 = null, $rideId = null)
    {
        if (!$userId1 || !$userId2 || !$rideId) {
            return $this->fail('Paramètres requis: userId1, userId2, rideId', ResponseInterface::HTTP_BAD_REQUEST);
        }

        try {
            $messages = $this->messageModel->getConversationMessages(
                (int)$rideId,
                (int)$userId1,
                (int)$userId2
            );

            return $this->respond([
                'status' => true,
                'messages' => $messages,
                'total' => count($messages)
            ]);

        } catch (\Exception $e) {
            return $this->failServerError('Erreur lors de la récupération des messages: ' . $e->getMessage());
        }
    }

    /**
     * 🔹 GET /messages/recent/{userId}
     * Récupérer les messages récents d'un utilisateur
     */
    public function recent($userId = null)
    {
        if (!$userId) {
            return $this->fail('ID utilisateur requis', ResponseInterface::HTTP_BAD_REQUEST);
        }

        try {
            $limit = $this->request->getGet('limit') ?? 20;

            $messages = $this->messageModel
                ->where('sender_id', $userId)
                ->orWhere('receiver_id', $userId)
                ->where('is_deleted', 0)
                ->orderBy('created_at', 'DESC')
                ->limit((int)$limit)
                ->find();

            return $this->respond([
                'status' => true,
                'messages' => $messages,
                'total' => count($messages)
            ]);

        } catch (\Exception $e) {
            return $this->failServerError('Erreur lors de la récupération des messages récents: ' . $e->getMessage());
        }
    }
}

