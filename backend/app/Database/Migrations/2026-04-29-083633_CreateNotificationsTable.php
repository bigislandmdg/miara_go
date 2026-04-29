<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;
use CodeIgniter\Database\RawSql;

class CreateNotificationsTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => [
                'type' => 'SERIAL',
            ],
            'driver_id' => [
                'type'     => 'INTEGER',
                'unsigned' => true,
                'comment'  => 'Référence vers users.id avec rôle driver',
            ],
            'ride_request_id' => [
                'type'     => 'INTEGER',
                'unsigned' => true,
                'null'     => true,
            ],
            'title' => [
                'type'       => 'VARCHAR',
                'constraint' => 255,
            ],
            'message' => [
                'type' => 'TEXT',
            ],
            'type' => [
                'type'       => 'VARCHAR',
                'constraint' => 100,
                'null'       => true,
            ],
            'read' => [
                'type'    => 'BOOLEAN',
                'default' => false,
            ],
            'read_at' => [
                'type' => 'TIMESTAMP',
                'null' => true,
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
        $this->forge->addKey('driver_id');
        $this->forge->addKey('type');
        $this->forge->addKey('read');
        
        // Création de la table
        $this->forge->createTable('notifications');
        
        // Ajout de la clé étrangère vers users
        $this->db->query('ALTER TABLE notifications ADD CONSTRAINT notifications_driver_id_foreign FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE');
        
        if ($this->db->tableExists('ride_requests')) {
            $this->db->query('ALTER TABLE notifications ADD CONSTRAINT notifications_ride_request_id_foreign FOREIGN KEY (ride_request_id) REFERENCES ride_requests(id) ON DELETE CASCADE');
        }
        
        // Index supplémentaires
        $this->db->query('CREATE INDEX idx_notifications_driver_read ON notifications(driver_id, read)');
        $this->db->query('CREATE INDEX idx_notifications_driver_created ON notifications(driver_id, created_at)');
        $this->db->query('CREATE INDEX idx_notifications_type_created ON notifications(type, created_at)');
        $this->db->query('CREATE INDEX idx_notifications_unread_only ON notifications(driver_id, created_at) WHERE read = false');
        
        // Commentaires
        $this->db->query("COMMENT ON TABLE notifications IS 'Notifications pour les conducteurs (users avec rôle driver)'");
        $this->db->query("COMMENT ON COLUMN notifications.driver_id IS 'Doit correspondre à un user avec le rôle driver'");
    }

    public function down()
    {
        $this->forge->dropTable('notifications');
    }
}