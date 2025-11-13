// js/auth.js
import { supabase } from './supabase.js';

export const AuthService = {
    async checkAuth() {
        try {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error) {
                console.error('Auth check error:', error);
                await this.clearStaleSession();
                window.location.href = 'login.html';
                return null;
            }
            return user;
        } catch (error) {
            console.error('Auth check exception:', error);
            await this.clearStaleSession();
            window.location.href = 'login.html';
            return null;
        }
    },

    async register({ restaurantName, ownerName, email, password }) {
        try {
            await this.clearStaleSession();

            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        restaurant_name: restaurantName,
                        owner_name: ownerName
                    },
                    emailRedirectTo: this.getRedirectUrl()
                }
            });

            if (authError) throw authError;

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
                error: this.getUserFriendlyError(error)
            };
        }
    },

    async login(email, password) {
        try {
            await this.clearStaleSession();
            
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            return { success: true, user: data.user };
        } catch (error) {
            console.error('Login service error:', error);
            await this.clearStaleSession();
            return { 
                success: false, 
                error: this.getUserFriendlyError(error)
            };
        }
    },

    async logout() {
        try {
            const { error } = await supabase.auth.signOut();
            await this.clearStaleSession();
            
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Logout exception:', error);
            await this.clearStaleSession();
            return { success: false, error: error.message };
        }
    },

    async getCurrentUser() {
        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError) {
                console.error('Session error:', sessionError);
                await this.clearStaleSession();
                return null;
            }

            if (!session) return null;

            // Verify session is still valid
            const now = Math.floor(Date.now() / 1000);
            if (session.expires_at && session.expires_at < now) {
                console.log('Session expired, clearing...');
                await this.clearStaleSession();
                return null;
            }

            const { data: { user }, error: userError } = await supabase.auth.getUser();
            
            if (userError) {
                console.error('Get user error:', userError);
                await this.clearStaleSession();
                return null;
            }

            return user;
            
        } catch (error) {
            console.error('Get current user exception:', error);
            await this.clearStaleSession();
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
            await this.clearStaleSession();
            
            const redirectUrl = this.getRedirectUrl();
            console.log('Sending reset password to:', email, 'with redirect:', redirectUrl);
            
            const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: redirectUrl,
            });

            if (error) {
                console.error('Password reset email error:', error);
                throw error;
            }
            
            console.log('Password reset email sent successfully');
            return { success: true };
        } catch (error) {
            console.error('Password reset error:', error);
            return { 
                success: false, 
                error: this.getUserFriendlyError(error)
            };
        }
    },

    async updatePassword(newPassword) {
        try {
            console.log('Updating password...');
            
            const { data, error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) {
                console.error('Update password error:', error);
                throw error;
            }

            console.log('Password updated successfully, signing out...');
            
            // Force sign out after password change
            await this.logout();
            
            return { success: true, user: data.user };
        } catch (error) {
            console.error('Update password service error:', error);
            return { 
                success: false, 
                error: this.getUserFriendlyError(error)
            };
        }
    },

    // Helper method to get the correct redirect URL for current environment
    getRedirectUrl() {
        const baseUrl = window.location.origin;
        return `${baseUrl}/admin/reset-password.html`;
    },

    // Clear stale sessions and tokens
    async clearStaleSession() {
        try {
            const storageKeys = [
                'supabase.auth.token',
                'sb-auth-token',
                'supabase.auth.refresh-token',
                'sb-refresh-token'
            ];

            storageKeys.forEach(key => {
                localStorage.removeItem(key);
                sessionStorage.removeItem(key);
            });

            // Clear any other auth-related keys
            const allKeys = [...Array(localStorage.length).keys()].map(i => localStorage.key(i));
            allKeys.forEach(key => {
                if (key && (key.includes('auth') || key.includes('token') || key.includes('supabase'))) {
                    localStorage.removeItem(key);
                }
            });

            console.log('Stale auth session cleared');
        } catch (error) {
            console.log('Session cleanup completed with warnings:', error);
        }
    },

    // User-friendly error messages
    getUserFriendlyError(error) {
        const message = error.message || 'An unknown error occurred';
        
        if (message.includes('Invalid login credentials')) {
            return 'Invalid email or password. Please try again.';
        } else if (message.includes('Email not confirmed')) {
            return 'Please confirm your email address before logging in.';
        } else if (message.includes('Refresh Token') || message.includes('AuthSessionMissingError')) {
            return 'Session expired. Please log in again.';
        } else if (message.includes('User already registered')) {
            return 'An account with this email already exists.';
        } else if (message.includes('Password should be at least')) {
            return 'Password is too weak. Please use a stronger password.';
        } else if (message.includes('Invalid email')) {
            return 'Please enter a valid email address.';
        } else if (message.includes('Network') || message.includes('fetch')) {
            return 'Network error. Please check your internet connection.';
        } else if (message.includes('rate limit')) {
            return 'Too many attempts. Please try again in a few minutes.';
        } else {
            return 'An error occurred. Please try again.';
        }
    }
};