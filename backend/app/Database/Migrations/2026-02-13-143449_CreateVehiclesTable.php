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
                'type'           => 'SERIAL',
            ],

            // Informations générales
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
                'type' => 'INT',
            ],

            // Identification
            'immatriculation' => [
                'type'       => 'VARCHAR',
                'constraint' => 20,
                'unique'     => true,
            ],

            // Caractéristiques
            'couleur' => [
                'type'       => 'VARCHAR',
                'constraint' => 30,
                'null'       => true,
            ],

            'kilometrage_actuel' => [
                'type'    => 'INT',
                'default' => 0,
            ],

            // Remplacement ENUM → VARCHAR
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
                'type' => 'INT',
                'null' => true,
            ],

            'nombre_portes' => [
                'type' => 'INT',
                'null' => true,
            ],

            'nombre_places' => [
                'type' => 'INT',
            ],

            'date_mise_circulation' => [
                'type' => 'DATE',
            ],

            'date_dernier_controle' => [
                'type' => 'DATE',
                'null' => true,
            ],

            // PostgreSQL préfère JSONB
            'photos' => [
                'type' => 'JSONB',
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

        $this->forge->createTable('vehicles');
    }

    public function down()
    {
        $this->forge->dropTable('vehicles');
    }
}
