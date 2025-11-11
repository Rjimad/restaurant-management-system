import { supabase } from './supabase.js';

export class AddonService {
    /**
     * Get all addon groups for a restaurant
     * @param {string} restaurantId 
     * @returns {Promise<Array>}
     */
    static async getAddonGroups(restaurantId) {
        try {
            const { data, error } = await supabase
                .from('addon_groups')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .order('created_at', { ascending: true });

            if (error) throw error;

            // Get item count for each group
            const groupsWithCount = await Promise.all(
                data.map(async (group) => {
                    const { count } = await supabase
                        .from('addons')
                        .select('*', { count: 'exact', head: true })
                        .eq('addon_group_id', group.id);

                    return {
                        ...group,
                        item_count: count || 0
                    };
                })
            );

            return groupsWithCount;
        } catch (error) {
            console.error('Error fetching addon groups:', error);
            throw error;
        }
    }

    /**
     * Get addons by group ID
     * @param {string} groupId 
     * @returns {Promise<Array>}
     */
    static async getAddonsByGroup(groupId) {
        try {
            const { data, error } = await supabase
                .from('addons')
                .select('*')
                .eq('addon_group_id', groupId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching addons:', error);
            throw error;
        }
    }

    /**
     * Create a new addon group
     * @param {Object} groupData 
     * @returns {Promise<Object>}
     */
    static async createAddonGroup(groupData) {
        try {
            const { data, error } = await supabase
                .from('addon_groups')
                .insert([groupData])
                .select()
                .single();

            if (error) throw error;
            return { ...data, item_count: 0 };
        } catch (error) {
            console.error('Error creating addon group:', error);
            throw error;
        }
    }

    /**
     * Update an addon group
     * @param {string} groupId 
     * @param {Object} groupData 
     * @returns {Promise<Object>}
     */
    static async updateAddonGroup(groupId, groupData) {
        try {
            const { data, error } = await supabase
                .from('addon_groups')
                .update(groupData)
                .eq('id', groupId)
                .select()
                .single();

            if (error) throw error;

            // Get updated item count
            const { count } = await supabase
                .from('addons')
                .select('*', { count: 'exact', head: true })
                .eq('addon_group_id', groupId);

            return { ...data, item_count: count || 0 };
        } catch (error) {
            console.error('Error updating addon group:', error);
            throw error;
        }
    }

    /**
     * Delete an addon group
     * @param {string} groupId 
     * @returns {Promise<void>}
     */
    static async deleteAddonGroup(groupId) {
        try {
            // First delete all addons in this group
            const { error: addonsError } = await supabase
                .from('addons')
                .delete()
                .eq('addon_group_id', groupId);

            if (addonsError) throw addonsError;

            // Then delete the group
            const { error } = await supabase
                .from('addon_groups')
                .delete()
                .eq('id', groupId);

            if (error) throw error;
        } catch (error) {
            console.error('Error deleting addon group:', error);
            throw error;
        }
    }

    /**
     * Create a new addon
     * @param {Object} addonData 
     * @returns {Promise<Object>}
     */
    static async createAddon(addonData) {
        try {
            const { data, error } = await supabase
                .from('addons')
                .insert([addonData])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error creating addon:', error);
            throw error;
        }
    }

    /**
     * Update an addon
     * @param {string} addonId 
     * @param {Object} addonData 
     * @returns {Promise<Object>}
     */
    static async updateAddon(addonId, addonData) {
        try {
            const { data, error } = await supabase
                .from('addons')
                .update(addonData)
                .eq('id', addonId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error updating addon:', error);
            throw error;
        }
    }

    /**
     * Delete an addon
     * @param {string} addonId 
     * @returns {Promise<void>}
     */
    static async deleteAddon(addonId) {
        try {
            const { error } = await supabase
                .from('addons')
                .delete()
                .eq('id', addonId);

            if (error) throw error;
        } catch (error) {
            console.error('Error deleting addon:', error);
            throw error;
        }
    }

    /**
     * Get a single addon by ID
     * @param {string} addonId 
     * @returns {Promise<Object>}
     */
    static async getAddon(addonId) {
        try {
            const { data, error } = await supabase
                .from('addons')
                .select('*')
                .eq('id', addonId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching addon:', error);
            throw error;
        }
    }
}