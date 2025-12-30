
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yhufsgcnhptfyovotxkr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlodWZzZ2NuaHB0Znlvdm90eGtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MDM2NjgsImV4cCI6MjA3NTQ3OTY2OH0.M-DPvJ-3Ttkods89Ios7MDQIxvcggi3v-4G05lwQRww';

export const supabase = createClient(supabaseUrl, supabaseKey);
