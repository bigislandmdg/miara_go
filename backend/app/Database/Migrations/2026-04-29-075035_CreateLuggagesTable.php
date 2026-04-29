<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;
use CodeIgniter\Database\RawSql;

class CreateLuggagesTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => [
                'type' => 'SERIAL',  // PostgreSQL: SERIAL pour auto-incrémentation
            ],
            'name' => [
                'type'       => 'VARCHAR',
                'constraint' => 50,
            ],
            'description' => [
                'type' => 'TEXT',
                'null' => true,
            ],
            'is_active' => [  // Optionnel: pour activer/désactiver (par défaut true)
                'type'    => 'BOOLEAN',
                'default' => true,
            ],
            'created_at' => [
                'type'    => 'TIMESTAMP',
                'default' => new RawSql('CURRENT_TIMESTAMP'),
            ],
            'updated_at' => [
                'type' => 'TIMESTAMP',
                'null' => true,
            ],
        ]);

        $this->forge->addKey('id', true);
        $this->forge->createTable('luggages');
        
        // Index pour améliorer les performances
        $this->db->query('CREATE INDEX idx_luggages_name ON luggages(name)');
        $this->db->query('CREATE INDEX idx_luggages_is_active ON luggages(is_active)');
        
        // Insertion des données par défaut (correspond au PREDEFINED_LUGGAGE_TYPES)
        $this->db->query("
            INSERT INTO luggages (name, description, is_active) VALUES
            ('Valise cabine', 'Petite valise pour cabine d''avion', true),
            ('Valise moyenne', 'Valise standard 50-70cm', true),
            ('Valise grande', 'Grande valise pour longs séjours', true),
            ('Sac à dos', 'Sac à dos de voyage', true),
            ('Sac de sport', 'Sac de sport ou gym bag', true),
            ('Équipement sportif', 'Skis, golf, vélo...', true),
            ('Carton', 'Carton de déménagement', true),
            ('Autre', 'Autre type de bagage', true)
        ");
    }

    public function down()
    {
        $this->forge->dropTable('luggages');
    }
}