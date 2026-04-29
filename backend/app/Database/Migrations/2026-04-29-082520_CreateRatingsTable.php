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
                'type' => 'SERIAL',  // PostgreSQL: SERIAL
            ],
            'ride_id' => [
                'type'     => 'INTEGER',  // PostgreSQL: INTEGER
                'unsigned' => true,
            ],
            'reviewer_id' => [
                'type'     => 'INTEGER',
                'unsigned' => true,
            ],
            'reviewed_id' => [
                'type'     => 'INTEGER',
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
            'updated_at' => [  // Ajout de updated_at
                'type' => 'TIMESTAMP',
                'null' => true,
            ],
        ]);

        // Clé primaire
        $this->forge->addKey('id', true);
        
        // Index pour améliorer les performances
        $this->forge->addKey('ride_id');
        $this->forge->addKey('reviewer_id');
        $this->forge->addKey('reviewed_id');
        
        // Clés étrangères
        $this->forge->addForeignKey('ride_id', 'rides', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('reviewer_id', 'users', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('reviewed_id', 'users', 'id', 'CASCADE', 'CASCADE');

        // Création de la table
        $this->forge->createTable('ratings');
        
        // Index supplémentaires pour les recherches fréquentes
        $this->db->query('CREATE INDEX idx_ratings_reviewer_reviewed ON ratings(reviewer_id, reviewed_id)');
        $this->db->query('CREATE INDEX idx_ratings_average_score ON ratings(average_score)');
    }

    public function down()
    {
        $this->forge->dropTable('ratings');
    }
}
