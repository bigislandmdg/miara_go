<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;
use CodeIgniter\Database\RawSql;

class CreatePaymentsTable extends Migration
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
            'amount' => [
                'type'       => 'DECIMAL',
                'constraint' => '10,2',
                'default'    => 0,
            ],
            'method' => [
                'type'       => 'VARCHAR',
                'constraint' => 50,
                'default'    => 'MVola',
                'comment'    => 'MVola, AirtelMoney, OrangeMoney',
            ],
            'status' => [
                'type'       => 'VARCHAR',
                'constraint' => 20,
                'default'    => 'pending',
                'comment'    => 'pending, completed, failed',
            ],
            'transaction_reference' => [
                'type'       => 'VARCHAR',
                'constraint' => 100,
                'null'       => true,
                'unique'     => true,  // Ajout d'unicité pour éviter les doublons
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
        $this->forge->addKey('status');
        $this->forge->addKey('method');
        
        // Clé étrangère vers users.id
        $this->forge->addForeignKey('user_id', 'users', 'id', 'CASCADE', 'CASCADE');

        $this->forge->createTable('payments');
        
        // Index supplémentaire pour les recherches par référence
        $this->db->query('CREATE INDEX idx_payments_transaction_reference ON payments(transaction_reference)');
        $this->db->query('CREATE INDEX idx_payments_created_at ON payments(created_at)');
    }

    public function down()
    {
        $this->forge->dropTable('payments');
    }
}