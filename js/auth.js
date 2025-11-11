// js/auth.js
import { supabase } from './supabase.js';

export const AuthService = {
    async checkAuth() {
        try {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error) throw error;
            return user;
        } catch (error) {
            console.error('Auth check error:', error);
            window.location.href = 'login.html';
            return null;
        }
    },

    async register({ restaurantName, ownerName, email, password }) {
        try {
            // Step 1: Sign up the user with Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        restaurant_name: restaurantName,
                        owner_name: ownerName
                    }
                }
            });

            if (authError) throw authError;

            // Step 2: Create restaurant record linked to the user
            if (authData.user) {
                const { data: restaurantData, error: restaurantError } = await supabase
                    .from('restaurants')
                    .insert([
                        {
                            name: restaurantName,
                            owner_name: ownerName,
                            email: email,
                            user_id: authData.user.id
                        }
                    ])
                    .select()
                    .single();

                if (restaurantError) {
                    console.error('Restaurant creation error:', restaurantError);
                    throw restaurantError;
                }

                return { 
                    success: true, 
                    user: authData.user, 
                    restaurant: restaurantData 
                };
            }

            throw new Error('User creation failed');

        } catch (error) {
            console.error('Registration error:', error);
            return { 
                success: false, 
                error: error.message 
            };
        }
    },

    async login(email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            return { success: true, user: data.user };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message };
        }
    },

    async logout() {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            return { success: false, error: error.message };
        }
    },

    async getCurrentUser() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            return user;
        } catch (error) {
            console.error('Get current user error:', error);
            return null;
        }
    },

    async getRestaurant() {
        try {
            const user = await this.getCurrentUser();
            if (!user) return null;

            const { data, error } = await supabase
                .from('restaurants')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Get restaurant error:', error);
            return null;
        }
    },

    async resetPassword(email) {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email);
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Password reset error:', error);
            return { success: false, error: error.message };
        }
    }
};