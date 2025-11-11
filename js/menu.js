// js/menu.js
import { supabase } from './supabase.js';
import { AuthService } from './auth.js';

export class MenuService {
    // Get all categories for a restaurant
    static async getCategories(restaurantId) {
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .order('display_order');

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching categories:', error);
            throw error;
        }
    }

    // Create new category
    static async createCategory(categoryData) {
        try {
            const { data, error } = await supabase
                .from('categories')
                .insert([categoryData])
                .select();

            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Error creating category:', error);
            throw error;
        }
    }

    // Update category
    static async updateCategory(categoryId, updates) {
        try {
            const { data, error } = await supabase
                .from('categories')
                .update(updates)
                .eq('id', categoryId)
                .select();

            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Error updating category:', error);
            throw error;
        }
    }

    // Delete category
    static async deleteCategory(categoryId) {
        try {
            const { error } = await supabase
                .from('categories')
                .delete()
                .eq('id', categoryId);

            if (error) throw error;
        } catch (error) {
            console.error('Error deleting category:', error);
            throw error;
        }
    }

    // Get menu items by category (includes variants)
    // Get menu items by category (includes variants)
static async getMenuItems(categoryId) {
    try {
        const { data: menuItems, error } = await supabase
            .from('menu_items')
            .select('*')
            .eq('category_id', categoryId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Load variants for each menu item
        if (menuItems) {
            for (let item of menuItems) {
                const variants = await this.getMenuItemVariants(item.id);
                item.variants = variants;
                
                // Load addon groups for each variant if the method exists
                if (this.getVariantAddonGroups && variants) {
                    for (let variant of variants) {
                        try {
                            const variantAddonGroups = await this.getVariantAddonGroups(variant.id);
                            variant.addon_groups = variantAddonGroups.map(group => group.addon_group_id);
                        } catch (error) {
                            console.error(`Error loading addon groups for variant ${variant.id}:`, error);
                            variant.addon_groups = [];
                        }
                    }
                }
            }
        }

        return menuItems || [];
    } catch (error) {
        console.error('Error fetching menu items:', error);
        throw error;
    }
}

    // Get menu item by ID
    static async getMenuItem(itemId) {
        try {
            const { data, error } = await supabase
                .from('menu_items')
                .select('*')
                .eq('id', itemId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching menu item:', error);
            throw error;
        }
    }

    // Create menu item
    static async createMenuItem(itemData) {
        try {
            const { data, error } = await supabase
                .from('menu_items')
                .insert([itemData])
                .select();

            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Error creating menu item:', error);
            throw error;
        }
    }

    // Update menu item
    static async updateMenuItem(itemId, updates) {
        try {
            const { data, error } = await supabase
                .from('menu_items')
                .update(updates)
                .eq('id', itemId)
                .select();

            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Error updating menu item:', error);
            throw error;
        }
    }

    // Update menu item availability
    static async updateItemAvailability(itemId, isAvailable) {
        try {
            const { error } = await supabase
                .from('menu_items')
                .update({ is_available: isAvailable })
                .eq('id', itemId);

            if (error) throw error;
        } catch (error) {
            console.error('Error updating item availability:', error);
            throw error;
        }
    }

    // Delete menu item
    static async deleteMenuItem(itemId) {
        try {
            const { error } = await supabase
                .from('menu_items')
                .delete()
                .eq('id', itemId);

            if (error) throw error;
        } catch (error) {
            console.error('Error deleting menu item:', error);
            throw error;
        }
    }

    // Get addon groups linked to a menu item
    static async getMenuItemAddonGroups(menuItemId) {
        try {
            const { data, error } = await supabase
                .from('menu_item_addons')
                .select('addon_group_id')
                .eq('menu_item_id', menuItemId);

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching menu item addon groups:', error);
            throw error;
        }
    }

    // Update addon groups for a menu item
    static async updateMenuItemAddonGroups(menuItemId, addonGroupIds) {
        try {
            // First, remove all existing associations
            const { error: deleteError } = await supabase
                .from('menu_item_addons')
                .delete()
                .eq('menu_item_id', menuItemId);

            if (deleteError) throw deleteError;

            // Then, create new associations if any are selected
            if (addonGroupIds.length > 0) {
                const associations = addonGroupIds.map(groupId => ({
                    menu_item_id: menuItemId,
                    addon_group_id: groupId
                }));

                const { error: insertError } = await supabase
                    .from('menu_item_addons')
                    .insert(associations);

                if (insertError) throw insertError;
            }
        } catch (error) {
            console.error('Error updating menu item addon groups:', error);
            throw error;
        }
    }

    // Get variants for a menu item
static async getMenuItemVariants(menuItemId) {
    try {
        const { data, error } = await supabase
            .from('menu_item_variants')
            .select('*')
            .eq('menu_item_id', menuItemId)
            .order('display_order', { ascending: true });

        if (error) throw error;
        
        const variants = data || [];
        
        // Load addon groups for each variant if the method exists
        if (this.getVariantAddonGroups) {
            for (let variant of variants) {
                try {
                    const variantAddonGroups = await this.getVariantAddonGroups(variant.id);
                    variant.addon_groups = variantAddonGroups.map(group => group.addon_group_id);
                } catch (error) {
                    console.error(`Error loading addon groups for variant ${variant.id}:`, error);
                    variant.addon_groups = [];
                }
            }
        }
        
        return variants;
    } catch (error) {
        console.error('Error fetching menu item variants:', error);
        throw error;
    }
}
    // Save variants for a menu item
    static async saveMenuItemVariants(menuItemId, variants) {
        try {
            // Get current user for user_id
            const user = await AuthService.getCurrentUser();
            const userId = user?.id;

            // Delete existing variants
            const { error: deleteError } = await supabase
                .from('menu_item_variants')
                .delete()
                .eq('menu_item_id', menuItemId);

            if (deleteError) throw deleteError;

            // Insert new variants
            if (variants.length > 0) {
                const variantsToInsert = variants.map((variant, index) => ({
                    menu_item_id: menuItemId,
                    name: variant.name,
                    additional_price: variant.additional_price,
                    image_url: variant.image_url,
                    display_order: index,
                    user_id: userId
                }));

                const { error: insertError } = await supabase
                    .from('menu_item_variants')
                    .insert(variantsToInsert);

                if (insertError) throw insertError;
            }

            return true;
        } catch (error) {
            console.error('Error saving menu item variants:', error);
            throw error;
        }
    }

    // Alternative: Get addon groups from JSON column in variants table
static async getVariantAddonGroups(variantId) {
    try {
        const { data, error } = await supabase
            .from('menu_item_variants')
            .select('addon_groups')
            .eq('id', variantId)
            .single();

        if (error) throw error;
        
        // Return in the same format as the other method for compatibility
        return (data.addon_groups || []).map(groupId => ({
            addon_group_id: groupId
        }));
    } catch (error) {
        console.error('Error fetching variant addon groups:', error);
        throw error;
    }
}

// Alternative: Update addon groups in JSON column
static async updateVariantAddonGroups(variantId, addonGroupIds) {
    try {
        const { error } = await supabase
            .from('menu_item_variants')
            .update({ 
                addon_groups: addonGroupIds,
                updated_at: new Date().toISOString()
            })
            .eq('id', variantId);

        if (error) throw error;
    } catch (error) {
        console.error('Error updating variant addon groups:', error);
        throw error;
    }
}

    // Create a single menu item variant
    static async createMenuItemVariant(variantData) {
        try {
            const { data, error } = await supabase
                .from('menu_item_variants')
                .insert([variantData])
                .select();

            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Error creating menu item variant:', error);
            throw error;
        }
    }

    // Update a single menu item variant
    static async updateMenuItemVariant(variantId, updates) {
        try {
            const { data, error } = await supabase
                .from('menu_item_variants')
                .update(updates)
                .eq('id', variantId)
                .select();

            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Error updating menu item variant:', error);
            throw error;
        }
    }
}
