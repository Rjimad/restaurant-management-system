// supabase/config.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const supabaseUrl = 'https://kejvzaedewgpddvxaazw.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlanZ6YWVkZXdncGRkdnhhYXp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxMzUxNDEsImV4cCI6MjA3NzcxMTE0MX0.XBtIy53UGBBvIHYEhHXqpCLAgMLcv8TyAO-7UrglWUQ'

export const supabase = createClient(supabaseUrl, supabaseKey)