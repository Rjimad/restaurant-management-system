// js/storage.js
import { supabase } from './supabase.js';

export class StorageService {
    static BUCKET_NAME = 'menu-items';

    // Initialize the storage bucket (run this once)
    static async initializeBucket() {
        try {
            const { data: buckets, error } = await supabase.storage.listBuckets();
            if (error) throw error;

            const bucketExists = buckets.some(bucket => bucket.name === this.BUCKET_NAME);
            
            if (!bucketExists) {
                const { error: createError } = await supabase.storage.createBucket(this.BUCKET_NAME, {
                    public: true,
                    fileSizeLimit: 5242880, // 5MB
                });
                if (createError) throw createError;
                console.log('Storage bucket created');
            }
        } catch (error) {
            console.error('Error initializing storage:', error);
        }
    }

    // Upload image to storage
    static async uploadImage(file, fileName) {
        try {
            // Generate unique file name
            const fileExt = file.name.split('.').pop();
            const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${fileName}/${uniqueFileName}`;

            const { data, error } = await supabase.storage
                .from(this.BUCKET_NAME)
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) throw error;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from(this.BUCKET_NAME)
                .getPublicUrl(data.path);

            return publicUrl;
        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        }
    }

    // Delete image from storage
    static async deleteImage(imageUrl) {
        try {
            // Extract file path from URL
            const urlParts = imageUrl.split('/');
            const filePath = urlParts.slice(urlParts.indexOf(this.BUCKET_NAME) + 1).join('/');
            
            const { error } = await supabase.storage
                .from(this.BUCKET_NAME)
                .remove([filePath]);

            if (error) throw error;
        } catch (error) {
            console.error('Error deleting image:', error);
            throw error;
        }
    }

    // Validate file
    static validateFile(file) {
        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

        if (file.size > maxSize) {
            throw new Error('File size must be less than 5MB');
        }

        if (!allowedTypes.includes(file.type)) {
            throw new Error('Only JPEG, PNG, and WEBP images are allowed');
        }

        return true;
    }
}