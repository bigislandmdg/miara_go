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
                'type'           => 'INT',
                'constraint'     => 11,
                'unsigned'       => true,
                'auto_increment' => true,
            ],
            'ride_id' => [
                'type'     => 'INT',
                'constraint' => 11,
                'unsigned' => true,
            ],
            'sender_id' => [
                'type'     => 'INT',
                'constraint' => 11,
                'unsigned' => true,
                'comment'  => 'ID de l\'expéditeur (doit être un user - rôle "user")',
            ],
            'receiver_id' => [
                'type'     => 'INT',
                'constraint' => 11,
                'unsigned' => true,
                'comment'  => 'ID du destinataire (doit être un driver - rôle "driver")',
            ],
            'content' => [
                'type' => 'TEXT',
            ],
            'read' => [
                'type'    => 'TINYINT',
                'constraint' => 1,
                'default' => 0,
            ],
            'read_at' => [
                'type' => 'DATETIME',
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
                'type'    => 'TEXT',
                'null'    => true,
            ],
            'status' => [
                'type'       => 'VARCHAR',
                'constraint' => 20,
                'default'    => 'sent',
            ],
            'is_deleted' => [
                'type'    => 'TINYINT',
                'constraint' => 1,
                'default' => 0,
            ],
            'created_at' => [
                'type'    => 'TIMESTAMP',
                'default' => new RawSql('CURRENT_TIMESTAMP'),
            ],
        ]);

        $this->forge->addKey('id', true);
        $this->forge->addKey('conversation_id');
        $this->forge->addKey('ride_id');
        $this->forge->addKey('sender_id');
        $this->forge->addKey('receiver_id');
        $this->forge->addKey(['receiver_id', 'read'], false, false, 'idx_unread');

        $this->forge->addForeignKey('ride_id', 'rides', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('sender_id', 'users', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('receiver_id', 'users', 'id', 'CASCADE', 'CASCADE');

        $this->forge->createTable('messages');
    }

    public function down()
    {
        $this->forge->dropTable('messages');
    }
}
