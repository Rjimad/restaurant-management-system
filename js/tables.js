// tables.js
import { supabase } from './supabase.js';

export class TablesService {
    static async getTables(restaurantId) {
        try {
            const { data, error } = await supabase
                .from('tables')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .order('table_number');

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching tables:', error);
            throw error;
        }
    }

    static async createTable(tableData) {
        try {
            // Only include fields that exist in the database
            const safeTableData = {
                restaurant_id: tableData.restaurant_id,
                table_number: tableData.table_number,
                capacity: tableData.capacity,
                status: tableData.status
                // Remove location and qr_code_url if they don't exist in your table
            };

            const { data, error } = await supabase
                .from('tables')
                .insert([safeTableData])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error creating table:', error);
            throw error;
        }
    }

    static async updateTable(tableId, updates) {
        try {
            // Only include fields that exist in the database
            const safeUpdates = {
                table_number: updates.table_number,
                capacity: updates.capacity,
                status: updates.status
                // Remove location if it doesn't exist in your table
            };

            const { data, error } = await supabase
                .from('tables')
                .update(safeUpdates)
                .eq('id', tableId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error updating table:', error);
            throw error;
        }
    }

    static async deleteTable(tableId) {
        try {
            const { error } = await supabase
                .from('tables')
                .delete()
                .eq('id', tableId);

            if (error) throw error;
        } catch (error) {
            console.error('Error deleting table:', error);
            throw error;
        }
    }

    static async generateQRCode(tableId) {
        try {
            // For now, just return a placeholder since we don't have qr_code_url column
            // In a real implementation, you would need to add this column to your table
            console.log('QR code generation would happen here for table:', tableId);
            return { qr_code_url: null };
        } catch (error) {
            console.error('Error generating QR code:', error);
            throw error;
        }
    }
}