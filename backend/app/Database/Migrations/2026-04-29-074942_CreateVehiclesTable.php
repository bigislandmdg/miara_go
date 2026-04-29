<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;
use CodeIgniter\Database\RawSql;

class CreateVehiclesTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            // PostgreSQL auto increment
            'id' => [
                'type' => 'SERIAL',
            ],
            'user_id' => [  // Ajout de la relation avec l'utilisateur conducteur
                'type'     => 'INTEGER',
                'unsigned' => true,
            ],
            'marque' => [
                'type'       => 'VARCHAR',
                'constraint' => 50,
            ],
            'modele' => [
                'type'       => 'VARCHAR',
                'constraint' => 50,
            ],
            'version' => [
                'type'       => 'VARCHAR',
                'constraint' => 100,
                'null'       => true,
            ],
            'annee_fabrication' => [
                'type' => 'INTEGER',  // PostgreSQL: INTEGER
            ],
            'immatriculation' => [
                'type'       => 'VARCHAR',
                'constraint' => 20,
                'unique'     => true,
            ],
            'couleur' => [
                'type'       => 'VARCHAR',
                'constraint' => 30,
                'null'       => true,
            ],
            'kilometrage_actuel' => [
                'type'    => 'INTEGER',
                'default' => 0,
            ],
            'type_vehicule' => [
                'type'       => 'VARCHAR',
                'constraint' => 20,
                'default'    => 'autre',
            ],
            'carburant' => [
                'type'       => 'VARCHAR',
                'constraint' => 20,
            ],
            'transmission' => [
                'type'       => 'VARCHAR',
                'constraint' => 20,
                'null'       => true,
            ],
            'puissance_ch' => [
                'type' => 'INTEGER',
                'null' => true,
            ],
            'nombre_portes' => [
                'type' => 'INTEGER',
                'null' => true,
            ],
            'nombre_places' => [
                'type' => 'INTEGER',
            ],
            'date_mise_circulation' => [
                'type' => 'DATE',
            ],
            'date_dernier_controle' => [
                'type' => 'DATE',
                'null' => true,
            ],
            'photos' => [
                'type' => 'JSONB',  // PostgreSQL: JSONB pour meilleures performances
                'null' => true,
            ],
            'statut' => [
                'type'       => 'VARCHAR',
                'constraint' => 20,
                'default'    => 'disponible',
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
        $this->forge->addKey('statut');
        $this->forge->addKey('type_vehicule');
        $this->forge->addKey('nombre_places');
        $this->forge->addKey('immatriculation');
        $this->forge->addKey('user_id');
        
        // Ajout de la clé étrangère vers users
        $this->forge->addForeignKey('user_id', 'users', 'id', 'CASCADE', 'CASCADE');

        $this->forge->createTable('vehicles');
        
        // Ajout d'index supplémentaires
        $this->db->query('CREATE INDEX idx_vehicles_marque_modele ON vehicles(marque, modele)');
        $this->db->query('CREATE INDEX idx_vehicles_statut_type ON vehicles(statut, type_vehicule)');
        $this->db->query('CREATE INDEX idx_vehicles_user_status ON vehicles(user_id, statut)');
    }

    public function down()
    {
        $this->forge->dropTable('vehicles');
    }
}