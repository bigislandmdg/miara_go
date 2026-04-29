<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;
use CodeIgniter\Database\RawSql;

class CreateRatingCriteriasTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => [
                'type' => 'SERIAL',  // PostgreSQL: SERIAL
            ],
            'rating_id' => [
                'type'     => 'INTEGER',  // PostgreSQL: INTEGER
                'unsigned' => true,
            ],
            'criterion' => [
                'type'       => 'VARCHAR',
                'constraint' => 100,
            ],
            'score' => [
                'type'       => 'INTEGER',  // PostgreSQL: INTEGER
                'default'    => 0,
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
        $this->forge->addKey('rating_id');
        $this->forge->addKey('criterion');

        // Clé étrangère vers ratings.id
        $this->forge->addForeignKey('rating_id', 'ratings', 'id', 'CASCADE', 'CASCADE');

        // Création de la table
        $this->forge->createTable('rating_criteria');
        
        // Index composite pour les recherches
        $this->db->query('CREATE INDEX idx_rating_criteria_rating_criterion ON rating_criteria(rating_id, criterion)');
    }

    public function down()
    {
        $this->forge->dropTable('rating_criteria');
    }
}