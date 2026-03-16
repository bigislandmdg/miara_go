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
                'type'           => 'SERIAL',
                'auto_increment' => true,
            ],
            'rating_id' => [
                'type'     => 'INT',
                'unsigned' => true,
            ],
            'criterion' => [
                'type'       => 'VARCHAR',
                'constraint' => '100',
            ],
            'score' => [
                'type'       => 'INT',
                'constraint' => 5,
                'default'    => 0,
            ],
            'created_at' => [
                'type'    => 'TIMESTAMP',
                'default' => new RawSql('CURRENT_TIMESTAMP'),
            ],
        ]);

        // ✅ Clé primaire
        $this->forge->addKey('id', true);

        // ✅ Clé étrangère vers ratings.id
        $this->forge->addForeignKey('rating_id', 'ratings', 'id', 'CASCADE', 'CASCADE');

        // ✅ Création de la table
        $this->forge->createTable('rating_criteria');
    }

    public function down()
    {
        $this->forge->dropTable('rating_criteria');
    }
}
