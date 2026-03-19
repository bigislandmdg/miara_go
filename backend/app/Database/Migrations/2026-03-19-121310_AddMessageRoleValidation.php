<?php
// app/Database/Migrations/2024_01_01_000003_add_message_role_validation.php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddMessageRoleValidation extends Migration
{
    public function up()
    {
        // Pour PostgreSQL
        if ($this->db->DBDriver === 'Postgre') {
            $function = <<<SQL
            CREATE OR REPLACE FUNCTION validate_message_roles()
            RETURNS TRIGGER AS $$
            DECLARE
                sender_role VARCHAR(20);
                receiver_role VARCHAR(20);
            BEGIN
                SELECT role INTO sender_role FROM users WHERE id = NEW.sender_id;
                SELECT role INTO receiver_role FROM users WHERE id = NEW.receiver_id;
                
                IF sender_role != 'user' THEN
                    RAISE EXCEPTION 'Le sender_id doit être un utilisateur avec le rôle "user" (reçu: %)', sender_role;
                END IF;
                
                IF receiver_role != 'driver' THEN
                    RAISE EXCEPTION 'Le receiver_id doit être un conducteur avec le rôle "driver" (reçu: %)', receiver_role;
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
        if ($this->db->DBDriver === 'Postgre') {
            $this->db->query("DROP TRIGGER IF EXISTS trigger_validate_message_roles ON messages");
            $this->db->query("DROP FUNCTION IF EXISTS validate_message_roles()");
        }
    }
}