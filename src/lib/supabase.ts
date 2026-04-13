import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://besbtasjpqmfqjkudmgu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlc2J0YXNqcHFtZnFqa3VkbWd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2OTA1MTAsImV4cCI6MjA4OTI2NjUxMH0.0AJitLQfphKvlV-xveWkZAhd-CBslFgxt9-38QX8GT8'
);
