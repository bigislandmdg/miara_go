<?php
// app/Database/Migrations/2024_01_01_000002_create_messages_table.php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;
use CodeIgniter\Database\RawSql;

class CreateMessagesTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => [
                'type'     => 'SERIAL',
                'unsigned' => true,
            ],
            'ride_id' => [
                'type'     => 'INTEGER',
                'unsigned' => true,
            ],
            'sender_id' => [
                'type'     => 'INTEGER',
                'unsigned' => true,
                'comment'  => 'ID de l\'expéditeur (peut être passager ou conducteur)',
            ],
            'receiver_id' => [
                'type'     => 'INTEGER',
                'unsigned' => true,
                'comment'  => 'ID du destinataire (peut être passager ou conducteur)',
            ],
            'content' => [
                'type' => 'TEXT',
            ],
            'read' => [
                'type'    => 'BOOLEAN',  // PostgreSQL: BOOLEAN au lieu de SMALLINT
                'default' => false,
            ],
            'read_at' => [
                'type' => 'TIMESTAMP',
                'null' => true,
            ],
            'conversation_id' => [
                'type'       => 'VARCHAR',
                'constraint' => 32,
                'null'       => true,
            ],
            'type' => [
                'type'       => 'VARCHAR',
                'constraint' => 20,
                'default'    => 'text',
            ],
            'metadata' => [
                'type' => 'JSONB',  // PostgreSQL: JSONB pour meilleures performances
                'null' => true,
            ],
            'status' => [
                'type'       => 'VARCHAR',
                'constraint' => 20,
                'default'    => 'sent',
            ],
            'is_deleted_by_sender' => [  // Plus précis : supprimé par l'expéditeur
                'type'    => 'BOOLEAN',
                'default' => false,
            ],
            'is_deleted_by_receiver' => [  // Supprimé par le destinataire
                'type'    => 'BOOLEAN',
                'default' => false,
            ],
            'created_at' => [
                'type'    => 'TIMESTAMP',
                'default' => new RawSql('CURRENT_TIMESTAMP'),
            ],
            'updated_at' => [  // Ajout de updated_at
                'type' => 'TIMESTAMP',
                'null' => true,
            ],
        ]);

        $this->forge->addKey('id', true);
        $this->forge->addKey('conversation_id');
        $this->forge->addKey('ride_id');
        $this->forge->addKey('sender_id');
        $this->forge->addKey('receiver_id');
        $this->forge->addKey('status');
        
        // Création de la table
        $this->forge->createTable('messages');
        
        // Index avec condition partielle pour les messages non lus
        $this->db->query('CREATE INDEX idx_messages_unread ON messages (receiver_id, read) WHERE read = false');
        
        // Index pour les conversations
        $this->db->query('CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at)');
        
        // Index pour les messages d'un trajet spécifique
        $this->db->query('CREATE INDEX idx_messages_ride_created ON messages(ride_id, created_at)');
        
        // Index pour les messages non supprimés
        $this->db->query('CREATE INDEX idx_messages_active ON messages(conversation_id, created_at) WHERE is_deleted_by_sender = false AND is_deleted_by_receiver = false');
        
        // Clés étrangères
        $this->forge->addForeignKey('ride_id', 'rides', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('sender_id', 'users', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('receiver_id', 'users', 'id', 'CASCADE', 'CASCADE');
        
        // Commentaires
        $this->db->query("COMMENT ON TABLE messages IS 'Messages entre passagers et conducteurs'");
        $this->db->query("COMMENT ON COLUMN messages.sender_id IS 'ID de l''expéditeur (référence users.id)'");
        $this->db->query("COMMENT ON COLUMN messages.receiver_id IS 'ID du destinataire (référence users.id)'");
        $this->db->query("COMMENT ON COLUMN messages.status IS 'sent, delivered, read, failed'");
    }

    public function down()
    {
        $this->forge->dropTable('messages');
    }
}