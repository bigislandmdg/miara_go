<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;
use CodeIgniter\Database\RawSql;

class CreateRatingsTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => [
                'type'           => 'SERIAL',
                'auto_increment' => true,
            ],
            'ride_id' => [
                'type'     => 'INT',
                'unsigned' => true,
            ],
            'reviewer_id' => [
                'type'     => 'INT',
                'unsigned' => true,
            ],
            'reviewed_id' => [
                'type'     => 'INT',
                'unsigned' => true,
            ],
            'average_score' => [
                'type'       => 'DECIMAL',
                'constraint' => '3,2',
                'default'    => 0.00,
            ],
            'comment' => [
                'type' => 'TEXT',
                'null' => true,
            ],
            'created_at' => [
                'type'    => 'TIMESTAMP',
                'default' => new RawSql('CURRENT_TIMESTAMP'),
            ],
        ]);

        // Clé primaire
        $this->forge->addKey('id', true);

        // Clés étrangères
        $this->forge->addForeignKey('ride_id', 'rides', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('reviewer_id', 'users', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('reviewed_id', 'users', 'id', 'CASCADE', 'CASCADE');

        // Création de la table
        $this->forge->createTable('ratings');
    }

    public function down()
    {
        $this->forge->dropTable('ratings');
    }
}
