<?php

namespace App\Models;

use CodeIgniter\Model;

class MessageModel extends Model
{
    protected $table = 'messages';
    protected $primaryKey = 'id';
    protected $returnType = 'array';
    protected $useSoftDeletes = false;
    protected $useTimestamps = true;
    protected $createdField = 'created_at';
    protected $updatedField = ''; // pas de updated_at pour cette table
    protected $deletedField = '';

    protected $allowedFields = [
        'ride_id',
        'sender_id',
        'receiver_id',
        'content',
        'read',
        'read_at',
        'conversation_id',
        'type',
        'metadata',
        'status',
        'is_deleted',
    ];

    protected $validationRules = [
        'ride_id'       => 'required|integer',
        'sender_id'     => 'required|integer',
        'receiver_id'   => 'required|integer',
        'content'       => 'required|string',
        'read'          => 'permit_empty|in_list[0,1]',
        'read_at'       => 'permit_empty|valid_date',
        'conversation_id' => 'permit_empty|string|max_length[32]',
        'type'          => 'permit_empty|in_list[text,image,location]',
        'metadata'      => 'permit_empty|string',
        'status'        => 'permit_empty|in_list[sent,delivered,read]',
        'is_deleted'    => 'permit_empty|in_list[0,1]',
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
        'receiver_id' => [
            'required' => 'Le champ receiver_id est obligatoire.',
            'integer'  => 'Le champ receiver_id doit être un nombre entier.',
        ],
        'content' => [
            'required' => 'Le contenu du message est obligatoire.',
        ],
        'type' => [
            'in_list' => 'Le type doit être text, image ou location.',
        ],
        'status' => [
            'in_list' => 'Le statut doit être sent, delivered ou read.',
        ],
    ];

    protected $beforeInsert = [
        'generateConversationId',
        'setInitialStatus',
        'convertBooleans',
        'validateRoles'
    ];
    
    protected $beforeUpdate = [
        'convertBooleans',
        'updateReadStatus'
    ];

    /**
     * 🔹 GÉNÈRE UN ID DE CONVERSATION UNIQUE
     */
    protected function generateConversationId(array $data)
    {
        if (!isset($data['data']['conversation_id']) && 
            isset($data['data']['ride_id'], $data['data']['sender_id'], $data['data']['receiver_id'])) {
            
            $participants = [
                $data['data']['sender_id'], 
                $data['data']['receiver_id']
            ];
            sort($participants);
            
            $data['data']['conversation_id'] = md5(
                $data['data']['ride_id'] . '_' . implode('_', $participants)
            );
        }
        return $data;
    }

    /**
     * 🔹 DÉFINIT LE STATUT INITIAL DU MESSAGE
     */
    protected function setInitialStatus(array $data)
    {
        if (!isset($data['data']['status'])) {
            $data['data']['status'] = 'sent';
        }
        return $data;
    }

    /**
     * 🔹 CONVERTIT LES CHAMPS BOOLÉENS (1/0)
     */
    protected function convertBooleans(array $data)
    {
        foreach (['read', 'is_deleted'] as $field) {
            if (isset($data['data'][$field])) {
                $data['data'][$field] = filter_var($data['data'][$field], FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
            }
        }
        return $data;
    }

    /**
     * 🔹 MET À JOUR LE STATUT DE LECTURE
     */
    protected function updateReadStatus(array $data)
    {
        if (isset($data['data']['read']) && $data['data']['read'] == 1) {
            $data['data']['read_at'] = date('Y-m-d H:i:s');
            $data['data']['status'] = 'read';
        }
        return $data;
    }

    /**
     * 🔹 VALIDE LES RÔLES DES UTILISATEURS
     * Permet les échanges dans les deux sens (user → driver ET driver → user)
     */
    protected function validateRoles(array $data)
    {
        $userModel = new \App\Models\UserModel();
        
        $sender = $userModel->find($data['data']['sender_id']);
        $receiver = $userModel->find($data['data']['receiver_id']);
        
        if (!$sender || !$receiver) {
            throw new \Exception('Utilisateur non trouvé');
        }
        
        // Vérifier que les rôles sont différents (user ↔ driver)
        // Cela permet les deux sens : user→driver ET driver→user
        if ($sender['role'] === $receiver['role']) {
            throw new \Exception('Les messages doivent être échangés entre un utilisateur (user) et un conducteur (driver)');
        }
        
        return $data;
    }

    // =========================================================
    // 🔹 MÉTHODES PERSONNALISÉES
    // =========================================================

    /**
     * 🔹 RÉCUPÈRE LES MESSAGES D'UNE CONVERSATION
     */
    public function getConversationMessages(int $rideId, int $user1Id, int $user2Id, int $limit = 50, int $offset = 0)
    {
        $participants = [$user1Id, $user2Id];
        sort($participants);
        $conversationId = md5($rideId . '_' . implode('_', $participants));
        
        return $this->select('messages.*, 
                              sender.nom as sender_nom, 
                              sender.prenom as sender_prenom,
                              sender.role as sender_role,
                              receiver.nom as receiver_nom,
                              receiver.prenom as receiver_prenom,
                              receiver.role as receiver_role')
                    ->join('users as sender', 'sender.id = messages.sender_id', 'left')
                    ->join('users as receiver', 'receiver.id = messages.receiver_id', 'left')
                    ->where('messages.conversation_id', $conversationId)
                    ->where('messages.is_deleted', 0)
                    ->orderBy('messages.created_at', 'ASC')
                    ->limit($limit, $offset)
                    ->find();
    }

    /**
     * 🔹 RÉCUPÈRE TOUS LES MESSAGES D'UN TRAJET
     */
    public function getRideMessages(int $rideId)
    {
        return $this->select('messages.*, 
                              sender.nom as sender_nom,
                              sender.prenom as sender_prenom,
                              sender.role as sender_role')
                    ->join('users as sender', 'sender.id = messages.sender_id', 'left')
                    ->where('messages.ride_id', $rideId)
                    ->where('messages.is_deleted', 0)
                    ->orderBy('messages.created_at', 'ASC')
                    ->find();
    }

    /**
     * 🔹 RÉCUPÈRE LES CONVERSATIONS D'UN UTILISATEUR
     */
    public function getUserConversations(int $userId)
    {
        $subquery = $this->db->table('messages')
            ->select('DISTINCT ON (conversation_id) *')
            ->where('sender_id', $userId)
            ->orWhere('receiver_id', $userId)
            ->where('is_deleted', 0)
            ->orderBy('conversation_id, created_at DESC')
            ->getCompiledSelect();

        return $this->db->table('messages')
            ->select("m.*, 
                      u1.nom as sender_nom, u1.prenom as sender_prenom, u1.role as sender_role,
                      u2.nom as receiver_nom, u2.prenom as receiver_prenom, u2.role as receiver_role,
                      r.departure, r.arrival, r.date as ride_date, r.time as ride_time")
            ->from("($subquery) as m")
            ->join('users as u1', 'u1.id = m.sender_id', 'left')
            ->join('users as u2', 'u2.id = m.receiver_id', 'left')
            ->join('rides as r', 'r.id = m.ride_id', 'left')
            ->orderBy('m.created_at', 'DESC')
            ->get()
            ->getResultArray();
    }

    /**
     * 🔹 RÉCUPÈRE LES MESSAGES NON LUS D'UN UTILISATEUR
     */
    public function getUnreadMessages(int $userId)
    {
        return $this->select('messages.*, 
                              sender.nom as sender_nom,
                              sender.prenom as sender_prenom,
                              sender.role as sender_role,
                              rides.departure,
                              rides.arrival')
                    ->join('users as sender', 'sender.id = messages.sender_id', 'left')
                    ->join('rides', 'rides.id = messages.ride_id', 'left')
                    ->where('messages.receiver_id', $userId)
                    ->where('messages.read', 0)
                    ->where('messages.is_deleted', 0)
                    ->orderBy('messages.created_at', 'DESC')
                    ->find();
    }

    /**
     * 🔹 COMPTE LES MESSAGES NON LUS D'UN UTILISATEUR
     */
    public function countUnreadMessages(int $userId): int
    {
        return $this->where('receiver_id', $userId)
                    ->where('read', 0)
                    ->where('is_deleted', 0)
                    ->countAllResults();
    }

    /**
     * 🔹 MARQUE LES MESSAGES COMME LUS DANS UNE CONVERSATION
     */
    public function markConversationAsRead(int $rideId, int $userId)
    {
        return $this->where('ride_id', $rideId)
                    ->where('receiver_id', $userId)
                    ->where('read', 0)
                    ->set([
                        'read' => 1, 
                        'read_at' => date('Y-m-d H:i:s'), 
                        'status' => 'read'
                    ])
                    ->update();
    }

    /**
     * 🔹 MARQUE UN MESSAGE SPÉCIFIQUE COMME LU
     */
    public function markMessageAsRead(int $messageId, int $userId)
    {
        return $this->where('id', $messageId)
                    ->where('receiver_id', $userId)
                    ->set(['read' => 1, 'read_at' => date('Y-m-d H:i:s'), 'status' => 'read'])
                    ->update();
    }

    /**
     * 🔹 RÉCUPÈRE LE DERNIER MESSAGE D'UNE CONVERSATION
     */
    public function getLastMessage(int $rideId, int $user1Id, int $user2Id)
    {
        $participants = [$user1Id, $user2Id];
        sort($participants);
        $conversationId = md5($rideId . '_' . implode('_', $participants));
        
        return $this->where('conversation_id', $conversationId)
                    ->where('is_deleted', 0)
                    ->orderBy('created_at', 'DESC')
                    ->first();
    }

    /**
     * 🔹 SUPPRESSION LOGIQUE D'UN MESSAGE
     */
    public function softDeleteMessage(int $messageId, int $userId)
    {
        $message = $this->find($messageId);
        if ($message && ($message['sender_id'] == $userId || $message['receiver_id'] == $userId)) {
            return $this->update($messageId, ['is_deleted' => 1]);
        }
        return false;
    }

    /**
     * 🔹 SUPPRIME TOUS LES MESSAGES D'UNE CONVERSATION
     */
    public function deleteConversation(int $rideId, int $user1Id, int $user2Id)
    {
        $participants = [$user1Id, $user2Id];
        sort($participants);
        $conversationId = md5($rideId . '_' . implode('_', $participants));
        
        return $this->where('conversation_id', $conversationId)
                    ->set(['is_deleted' => 1])
                    ->update();
    }

    /**
     * 🔹 RECHERCHE DE MESSAGES
     */
    public function searchMessages(string $query, int $userId, int $limit = 20)
    {
        return $this->select('messages.*, 
                              sender.nom as sender_nom,
                              sender.prenom as sender_prenom')
                    ->join('users as sender', 'sender.id = messages.sender_id', 'left')
                    ->groupStart()
                        ->like('content', $query)
                    ->groupEnd()
                    ->groupStart()
                        ->where('sender_id', $userId)
                        ->orWhere('receiver_id', $userId)
                    ->groupEnd()
                    ->where('is_deleted', 0)
                    ->orderBy('created_at', 'DESC')
                    ->limit($limit)
                    ->find();
    }

    /**
     * 🔹 STATISTIQUES DES MESSAGES
     */
    public function getMessageStats(int $userId)
    {
        $sent = $this->where('sender_id', $userId)
                     ->where('is_deleted', 0)
                     ->countAllResults();
        
        $received = $this->where('receiver_id', $userId)
                         ->where('is_deleted', 0)
                         ->countAllResults();
        
        $unread = $this->where('receiver_id', $userId)
                       ->where('read', 0)
                       ->where('is_deleted', 0)
                       ->countAllResults();
        
        return [
            'sent' => $sent,
            'received' => $received,
            'unread' => $unread,
            'total' => $sent + $received
        ];
    }

    /**
     * 🔹 NETTOIE LES ANCIENS MESSAGES (soft delete automatique)
     */
    public function cleanupOldMessages(int $days = 30)
    {
        $date = date('Y-m-d H:i:s', strtotime("-{$days} days"));
        
        return $this->where('created_at <', $date)
                    ->where('is_deleted', 0)
                    ->set(['is_deleted' => 1])
                    ->update();
    }

    protected $skipValidation = false;
}
