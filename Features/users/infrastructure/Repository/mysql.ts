import bcrypt from 'bcryptjs';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import db from '../../../../Core/db.js';
import { HttpErrors } from '../../../../Core/dberrors.js';
import type { User } from "../../Domain/Data/user.js";
import { UserRepository } from "../../Domain/Repository/userRepository.js";

export class MySQL extends UserRepository {
    private readonly pool: any;

    constructor() {
        super();
        this.pool = db.pool;
    }

    async getUsersByRole(rolId: number): Promise<User[]> {
        const query = 'SELECT * FROM `usuarios` WHERE rol_id = ?';  
        try {
            const rows = await db.executePreparedQuery(query, [rolId]);
            return rows as User[];
        } catch (err) {
            if (err instanceof Error) {
                throw new Error('Error fetching users by role: ' + err.message);
            }
            throw new Error('Error fetching users by role: ' + String(err));
        }
    }

    async getUsers(): Promise<User[]> {
        const query = 'SELECT * FROM `usuarios`';
        try {
            const rows = await db.fetchRows(query);
            return rows as User[];
        } catch (err) {
            if (err instanceof Error) {
                throw new Error('Error fetching rows: ' + err.message);
            }
            throw new Error('Error fetching rows: ' + String(err));
        }
    }

    async putUsers(id: number, userData: User & { password?: string }): Promise<any> {
        const fields: string[] = [];
        const values: any[] = [];

        if (userData.username !== undefined) {
            fields.push('username = ?');
            values.push(userData.username);
        }
        if (userData.password !== undefined) {
            fields.push('password_hash = ?');
            values.push(await bcrypt.hash(userData.password, 10));
        }
        if (userData.nombre_completo !== undefined) {
            fields.push('nombre_completo = ?');
            values.push(userData.nombre_completo);
        }
        if (userData.telefono !== undefined) {
            fields.push('telefono = ?');
            values.push(userData.telefono);
        }
        if (userData.comision_porcentaje !== undefined) {
            fields.push('comision_porcentaje = ?');
            values.push(Number(userData.comision_porcentaje));
        }
        if (userData.activo !== undefined) {
            fields.push('activo = ?');
            values.push(userData.activo);
        }

        if (fields.length === 0) {
            throw new Error('No fields provided to update');
        }

        const query = `UPDATE \`usuarios\` SET ${fields.join(', ')} WHERE id = ?`;
        try {
            const rows = await db.fetchRows(query, [...values, id]);
            return rows;
        } catch (err) {
            if (err instanceof Error) {
                throw new Error('Error updating user: ' + err.message);
            }
            throw new Error('Error updating user: ' + String(err));
        }
    }

    async deleteUsers(id: number): Promise<any> {
        const query = 'DELETE FROM `usuarios` WHERE id = ?';
        try {
            const rows = await db.fetchRows(query, [id]);
            return rows;
        } catch (err: any) {
            if (err?.code === 'ER_ROW_IS_REFERENCED_2' || err?.errno === 1451) {
                throw HttpErrors.conflict('No se puede eliminar: este usuario tiene boletos vendidos asociados. Desactívalo en su lugar.');
            }
            if (err instanceof Error) {
                throw new Error('Error deleting user: ' + err.message);
            }
            throw new Error('Error deleting user: ' + String(err));
        }
    }

    async getUsersById(id: number): Promise<User | null> {
        const query = 'SELECT * FROM `usuarios` WHERE id = ?';
        try {
            const rows = await db.executePreparedQuery(query, [id]) as RowDataPacket[];
            return (rows[0] as User) || null;
        } catch (err) {
            if (err instanceof Error) {
                throw new Error('Error fetching user by ID: ' + err.message);
            }
            throw new Error('Error fetching user by ID: ' + String(err));
        }
    }

    async loginUser(username: string, password: string): Promise<User | null> {
        const query = 'SELECT * FROM `usuarios` WHERE username = ?';
        try {
            const rows = await db.executePreparedQuery(query, [username]) as RowDataPacket[];
            const user = rows[0] as User | undefined;
            if (!user) return null;
            
            const hashed = user.password_hash;
            const match = await bcrypt.compare(password, hashed);
            return match ? user : null;
        } catch (err) {
            if (err instanceof Error) {
                throw new Error('Error during login: ' + err.message);
            }
            throw new Error('Error during login: ' + String(err));
        }
    }

    async getUserByUsername(username: string): Promise<User | null> {
        const query = 'SELECT * FROM `usuarios` WHERE username = ?';
        try {
            const rows = await db.executePreparedQuery(query, [username]) as RowDataPacket[];
            return (rows[0] as User) || null;
        } catch (err) {
            if (err instanceof Error) {
                throw new Error('Error fetching user by username: ' + err.message);
            }
            throw new Error('Error fetching user by username: ' + String(err));
        }
    }

    async registerUser(user: User): Promise<any> {
        const query = 'INSERT INTO `usuarios` (nombre_completo, telefono, username, password_hash, rol_id, comision_porcentaje, activo) VALUES (?, ?, ?, ?, ?, ?, ?)';
        try {
            const saltRounds = 10;
            const hashed = await bcrypt.hash(user.password_hash, saltRounds);
            const result = await db.executePreparedQuery(query, [
                user.nombre_completo,
                user.telefono,
                user.username,
                hashed,
                user.rol_id,
                Number(user.comision_porcentaje ?? 10),
                user.activo
            ]) as ResultSetHeader;
            
            const insertId = result.insertId;
            if (insertId) {
                return { 
                    id: insertId, 
                    nombre_completo: user.nombre_completo, 
                    telefono: user.telefono,
                    username: user.username,
                    rol_id: user.rol_id,
                    comision_porcentaje: Number(user.comision_porcentaje ?? 10)
                };
            }
            return result;
        } catch (err) {
            if (err instanceof Error) {
                throw new Error('Error registering user: ' + err.message);
            }
            throw new Error('Error registering user: ' + String(err));
        }
    }
}
