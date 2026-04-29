<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;
use CodeIgniter\Database\RawSql;

class CreateCreditTransactionsTable extends Migration
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
            'type' => [
                'type'       => 'VARCHAR',
                'constraint' => 50,
                'comment'    => 'purchase | spend | earn',
            ],
            'amount' => [
                'type'       => 'DECIMAL',
                'constraint' => '10,2',
            ],
            'description' => [
                'type'       => 'VARCHAR',
                'constraint' => 255,
                'null'       => true,
            ],
            'reference' => [
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

        // Clé primaire
        $this->forge->addKey('id', true);
        
        // Index pour améliorer les performances
        $this->forge->addKey('user_id');
        $this->forge->addKey('type');
        $this->forge->addKey('created_at');

        // Clé étrangère vers users
        $this->forge->addForeignKey('user_id', 'users', 'id', 'CASCADE', 'CASCADE');

        // Création de la table
        $this->forge->createTable('credit_transactions');
        
        // Index supplémentaire pour les recherches fréquentes
        $this->db->query('CREATE INDEX idx_credit_transactions_user_type ON credit_transactions(user_id, type)');
        $this->db->query('CREATE INDEX idx_credit_transactions_reference ON credit_transactions(reference)');
    }

    public function down()
    {
        $this->forge->dropTable('credit_transactions');
    }
}