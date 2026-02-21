-- 1. Create Announcement Attachments Table
CREATE TABLE IF NOT EXISTS public.announcement_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    announcement_id UUID REFERENCES public.announcements(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.announcement_attachments ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
CREATE POLICY "Users can view attachments on accessible announcements" ON public.announcement_attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.announcements a
            WHERE a.id = announcement_id
        )
    );

CREATE POLICY "Admins can manage attachments" ON public.announcement_attachments
    FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('Admin', 'Super Admin')));

-- 4. Storage Bucket (Attempt to create if possible)
INSERT INTO storage.buckets (id, name, public) 
SELECT 'announcements', 'announcements', true
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'announcements');

-- 5. Storage Policies
-- Allow anyone to read from 'announcements' bucket (since they are public announcements)
-- Or better, only authenticated users
CREATE POLICY "Authenticated users can view announcement files" ON storage.objects
    FOR SELECT TO authenticated USING (bucket_id = 'announcements');

CREATE POLICY "Admins can upload announcement files" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (
        bucket_id = 'announcements' AND 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('Admin', 'Super Admin'))
    );

CREATE POLICY "Admins can delete announcement files" ON storage.objects
    FOR DELETE TO authenticated USING (
        bucket_id = 'announcements' AND 
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('Admin', 'Super Admin'))
    );
