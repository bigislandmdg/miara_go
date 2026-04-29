<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;
use CodeIgniter\Database\RawSql;

class CreateCreditsTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => [
                'type' => 'SERIAL',  // PostgreSQL: SERIAL
            ],
            'user_id' => [
                'type'     => 'INTEGER',  // PostgreSQL: INTEGER
                'unsigned' => true,
            ],
            'transaction_id' => [
                'type'     => 'INTEGER',
                'unsigned' => true,
            ],
            'credit_amount' => [
                'type'       => 'DECIMAL',
                'constraint' => '10,2',
            ],
            'status' => [
                'type'       => 'VARCHAR',
                'constraint' => 20,
                'default'    => 'pending',
            ],
            'expires_at' => [  // Ajout d'une date d'expiration pour les crédits
                'type' => 'TIMESTAMP',
                'null' => true,
            ],
            'used_at' => [  // Date d'utilisation des crédits
                'type' => 'TIMESTAMP',
                'null' => true,
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
        
        // Index pour améliorer les performances
        $this->forge->addKey('user_id');
        $this->forge->addKey('transaction_id');
        $this->forge->addKey('status');
        
        // Clés étrangères
        $this->forge->addForeignKey('user_id', 'users', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('transaction_id', 'transactions', 'id', 'CASCADE', 'CASCADE');

        $this->forge->createTable('credits');
        
        // Index supplémentaires
        $this->db->query('CREATE INDEX idx_credits_user_status ON credits(user_id, status)');
        $this->db->query('CREATE INDEX idx_credits_expires_at ON credits(expires_at) WHERE expires_at IS NOT NULL');
    }

    public function down()
    {
        $this->forge->dropTable('credits');
    }
}