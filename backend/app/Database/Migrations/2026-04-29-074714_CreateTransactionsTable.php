<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;
use CodeIgniter\Database\RawSql;

class CreateTransactionsTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => [
                'type' => 'SERIAL',  // PostgreSQL: SERIAL (auto-incrément)
            ],
            'user_id' => [
                'type'     => 'INTEGER',  // PostgreSQL: INTEGER
                'unsigned' => true,
            ],
            'type' => [
                'type'       => 'VARCHAR',
                'constraint' => 50,
                'comment'    => 'achat_credit, retrait, publication_trajet',
            ],
            'amount' => [
                'type'       => 'DECIMAL',
                'constraint' => '10,2',
            ],
            'payment_method' => [
                'type'       => 'VARCHAR',
                'constraint' => 50,
                'default'    => 'mobile_money',
            ],
            'status' => [
                'type'       => 'VARCHAR',
                'constraint' => 20,
                'default'    => 'pending',
            ],
            'reference' => [
                'type'       => 'VARCHAR',
                'constraint' => 100,
                'null'       => true,
            ],
            'created_at' => [
                'type'    => 'TIMESTAMP',
                'default' => new RawSql('CURRENT_TIMESTAMP'),
            ],
        ]);

        $this->forge->addKey('id', true);
        $this->forge->addForeignKey('user_id', 'users', 'id', 'CASCADE', 'CASCADE');
        $this->forge->createTable('transactions');
        
        // Ajouter un index pour améliorer les performances des requêtes
        $this->db->query('CREATE INDEX idx_transactions_user_id ON transactions(user_id)');
        $this->db->query('CREATE INDEX idx_transactions_status ON transactions(status)');
        $this->db->query('CREATE INDEX idx_transactions_created_at ON transactions(created_at)');
    }

    public function down()
    {
        $this->forge->dropTable('transactions');
    }
}