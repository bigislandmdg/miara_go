<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class UpdateMessageRoleValidation extends Migration
{
    public function up()
    {
        //
        // Pour PostgreSQL
        if ($this->db->DBDriver === 'Postgre') {
            // Supprimer l'ancien trigger et fonction s'ils existent
            $this->db->query("DROP TRIGGER IF EXISTS trigger_validate_message_roles ON messages");
            $this->db->query("DROP FUNCTION IF EXISTS validate_message_roles()");
            
            // Créer la nouvelle fonction qui permet les deux sens
            $function = <<<SQL
            CREATE OR REPLACE FUNCTION validate_message_roles()
            RETURNS TRIGGER AS $$
            DECLARE
                sender_role VARCHAR(20);
                receiver_role VARCHAR(20);
            BEGIN
                SELECT role INTO sender_role FROM users WHERE id = NEW.sender_id;
                SELECT role INTO receiver_role FROM users WHERE id = NEW.receiver_id;
                
                -- Vérifier que les rôles sont différents (user ↔ driver)
                -- Cela permet les deux sens : user→driver ET driver→user
                IF sender_role = receiver_role THEN
                    RAISE EXCEPTION 'Les messages doivent être échangés entre un utilisateur (user) et un conducteur (driver)';
                END IF;
                
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
            SQL;

            $trigger = <<<SQL
            CREATE TRIGGER trigger_validate_message_roles
            BEFORE INSERT ON messages
            FOR EACH ROW
            EXECUTE FUNCTION validate_message_roles();
            SQL;

            $this->db->query($function);
            $this->db->query($trigger);
        }
    }

    public function down()
    {
        //
         if ($this->db->DBDriver === 'Postgre') {
            $this->db->query("DROP TRIGGER IF EXISTS trigger_validate_message_roles ON messages");
            $this->db->query("DROP FUNCTION IF EXISTS validate_message_roles()");
        }
    }
}
