// orders.js
import { supabase } from './supabase.js';

export class OrdersService {
    static async getOrders(restaurantId) {
        try {
            console.log('🔍 Fetching orders for restaurant:', restaurantId);
            
            // Simple query first to test
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    tables ( table_number ),
                    order_items (
                        *,
                        menu_items ( name, price ),
                        order_item_addons ( addon_name, addon_price, quantity )
                    )
                `)
                .eq('restaurant_id', restaurantId)
                .order('created_at', { ascending: false });
    
            if (error) {
                console.error('❌ Error fetching orders:', error);
                throw error;
            }
    
            console.log('✅ Orders fetched successfully. Count:', data?.length || 0);
            console.log('Sample order:', data && data[0] ? {
                id: data[0].id,
                order_number: data[0].order_number,
                restaurant_id: data[0].restaurant_id,
                table_id: data[0].table_id
            } : 'No orders');
            
            return data || [];
        } catch (error) {
            console.error('❌ Error in getOrders:', error);
            throw error;
        }
    }

    static async getTables(restaurantId) {
        try {
            const { data, error } = await supabase
                .from('tables')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .order('table_number');

            if (error) {
                console.error('Error fetching tables:', error);
                throw error;
            }
            return data || [];
        } catch (error) {
            console.error('Error in getTables:', error);
            throw error;
        }
    }

    static async getCategories(restaurantId) {
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .order('display_order');

            if (error) {
                console.error('Error fetching categories:', error);
                throw error;
            }
            return data || [];
        } catch (error) {
            console.error('Error in getCategories:', error);
            throw error;
        }
    }

    static async getMenuItemsByCategory(categoryId) {
        try {
            const { data, error } = await supabase
                .from('menu_items')
                .select('*')
                .eq('category_id', categoryId)
                .order('name');

            if (error) {
                console.error('Error fetching menu items:', error);
                throw error;
            }
            return data || [];
        } catch (error) {
            console.error('Error in getMenuItemsByCategory:', error);
            throw error;
        }
    }

    static async createOrder(orderData) {
        try {
            console.log('Creating order with data:', orderData);

            // Generate order number (you might want to use a better sequence)
            const orderNumber = 'ORD' + Date.now().toString().slice(-6);

            // First create the order
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert([{
                    restaurant_id: orderData.restaurant_id,
                    table_id: orderData.table_id,
                    order_type: orderData.order_type,
                    customer_notes: orderData.customer_notes,
                    status: orderData.status,
                    total_amount: orderData.total_amount,
                    order_number: orderNumber
                }])
                .select()
                .single();

            if (orderError) {
                console.error('Error creating order:', orderError);
                throw orderError;
            }

            console.log('Order created:', order);

            // Then create order items
            if (orderData.order_items && orderData.order_items.length > 0) {
                const orderItems = orderData.order_items.map(item => ({
                    order_id: order.id,
                    menu_item_id: item.menu_item_id,
                    quantity: item.quantity,
                    item_price: item.item_price,
                    special_instructions: item.special_instructions
                }));

                const { error: itemsError } = await supabase
                    .from('order_items')
                    .insert(orderItems);

                if (itemsError) {
                    console.error('Error creating order items:', itemsError);
                    throw itemsError;
                }

                console.log('Order items created successfully');
            }

            return order;
        } catch (error) {
            console.error('Error in createOrder:', error);
            throw error;
        }
    }

    static async updateOrderStatus(orderId, status) {
        try {
            const { data, error } = await supabase
                .from('orders')
                .update({ status })
                .eq('id', orderId)
                .select()
                .single();

            if (error) {
                console.error('Error updating order status:', error);
                throw error;
            }
            return data;
        } catch (error) {
            console.error('Error in updateOrderStatus:', error);
            throw error;
        }
    }

    static async deleteOrder(orderId) {
        try {
            console.log('🗑️ Deleting order:', orderId);

            // First, check if the order exists and get its details for logging
            const { data: order, error: fetchError } = await supabase
                .from('orders')
                .select('*')
                .eq('id', orderId)
                .single();

            if (fetchError) {
                console.error('Error fetching order for deletion:', fetchError);
                throw fetchError;
            }

            if (!order) {
                throw new Error('Order not found');
            }

            console.log('Order to delete:', {
                id: order.id,
                order_number: order.order_number,
                status: order.status
            });

            // Delete order items and their addons first (due to foreign key constraints)
            // First, get all order item IDs for this order
            const { data: orderItems, error: itemsFetchError } = await supabase
                .from('order_items')
                .select('id')
                .eq('order_id', orderId);

            if (itemsFetchError) {
                console.error('Error fetching order items for deletion:', itemsFetchError);
                throw itemsFetchError;
            }

            // If there are order items, delete their addons first
            if (orderItems && orderItems.length > 0) {
                const orderItemIds = orderItems.map(item => item.id);
                
                // Delete order item addons
                const { error: addonsDeleteError } = await supabase
                    .from('order_item_addons')
                    .delete()
                    .in('order_item_id', orderItemIds);

                if (addonsDeleteError) {
                    console.error('Error deleting order item addons:', addonsDeleteError);
                    throw addonsDeleteError;
                }

                console.log(`Deleted addons for ${orderItemIds.length} order items`);

                // Delete order items
                const { error: itemsDeleteError } = await supabase
                    .from('order_items')
                    .delete()
                    .eq('order_id', orderId);

                if (itemsDeleteError) {
                    console.error('Error deleting order items:', itemsDeleteError);
                    throw itemsDeleteError;
                }

                console.log(`Deleted ${orderItems.length} order items`);
            }

            // Finally, delete the order
            const { error: orderDeleteError } = await supabase
                .from('orders')
                .delete()
                .eq('id', orderId);

            if (orderDeleteError) {
                console.error('Error deleting order:', orderDeleteError);
                throw orderDeleteError;
            }

            console.log('✅ Order deleted successfully:', orderId);
            return { success: true, deletedOrder: order };
        } catch (error) {
            console.error('❌ Error in deleteOrder:', error);
            throw error;
        }
    }

    static subscribeToOrders(restaurantId, callback) {
        try {
            const subscription = supabase
                .channel('orders-channel')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'orders',
                        filter: `restaurant_id=eq.${restaurantId}`
                    },
                    callback
                )
                .subscribe();

            console.log('Subscribed to orders changes');
            return subscription;
        } catch (error) {
            console.error('Error subscribing to orders:', error);
            throw error;
        }
    }

    // Helper method to check table structure
    static async checkTableStructure(tableName) {
        try {
            const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .limit(1);

            if (error) {
                console.error(`Error checking ${tableName} structure:`, error);
                return null;
            }

            console.log(`${tableName} structure:`, data && data[0] ? Object.keys(data[0]) : 'No data');
            return data && data[0] ? Object.keys(data[0]) : [];
        } catch (error) {
            console.error(`Error in checkTableStructure for ${tableName}:`, error);
            return null;
        }
    }
}