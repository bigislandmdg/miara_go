<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;
use CodeIgniter\Database\RawSql;

class CreateRatingBadgesTable extends Migration
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
            'badge_name' => [
                'type'       => 'VARCHAR',
                'constraint' => 100,
            ],
            'badge_icon' => [  // Ajout d'une icône pour le badge
                'type'       => 'VARCHAR',
                'constraint' => 255,
                'null'       => true,
            ],
            'badge_description' => [  // Description du badge
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
        $this->forge->addKey('rating_id');
        $this->forge->addKey('badge_name');

        // Clé étrangère vers ratings.id
        $this->forge->addForeignKey('rating_id', 'ratings', 'id', 'CASCADE', 'CASCADE');

        // Création de la table
        $this->forge->createTable('rating_badges');
        
        // Index composite pour les recherches
        $this->db->query('CREATE INDEX idx_rating_badges_rating_name ON rating_badges(rating_id, badge_name)');
    }

    public function down()
    {
        $this->forge->dropTable('rating_badges');
    }
}
