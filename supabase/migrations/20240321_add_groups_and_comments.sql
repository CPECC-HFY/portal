-- 1. Groups Table
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Group Members Table
CREATE TABLE IF NOT EXISTS public.group_members (
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (group_id, user_id)
);

-- 3. Announcement Targeting
-- Adding target_type to announcements (All, Groups)
ALTER TABLE public.announcements 
ADD COLUMN IF NOT EXISTS target_type TEXT DEFAULT 'All' CHECK (target_type IN ('All', 'Groups'));

-- Table to link announcements to specific groups
CREATE TABLE IF NOT EXISTS public.announcement_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    announcement_id UUID REFERENCES public.announcements(id) ON DELETE CASCADE,
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Comments Table
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    announcement_id UUID REFERENCES public.announcements(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. RLS Policies

-- Groups visibility: All active users can see groups they belong to? 
-- Actually, let's allow all active users to see group names (for mentions/tagging) but keep membership private if needed.
-- For simplicity: All active users can view groups and group members.
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active users can view groups" ON public.groups
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND status = 'Active'));

CREATE POLICY "Admins can manage groups" ON public.groups
    FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('Admin', 'Super Admin')));

CREATE POLICY "Active users can view group members" ON public.group_members
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND status = 'Active'));

CREATE POLICY "Admins can manage group members" ON public.group_members
    FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('Admin', 'Super Admin')));

-- Announcement visibility based on targeting
-- We need to update existing announcement selection logic.
-- The policy for announcements needs to be more complex:
-- 1. All users can see 'All' targeted announcements.
-- 2. Users in a group can see announcements targeted to that group.
DROP POLICY IF EXISTS "Active users can view published announcements" ON public.announcements;
CREATE POLICY "View announcements based on targeting" ON public.announcements
    FOR SELECT USING (
        (status = 'Published' OR author_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('Admin', 'Super Admin')))
        AND (
            target_type = 'All'
            OR EXISTS (
                SELECT 1 FROM public.announcement_targets at
                JOIN public.group_members gm ON at.group_id = gm.group_id
                WHERE at.announcement_id = public.announcements.id AND gm.user_id = auth.uid()
            )
            OR author_id = auth.uid()
            OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('Admin', 'Super Admin'))
        )
    );

-- Comments Policies
CREATE POLICY "Active users can view comments on accessible announcements" ON public.comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.announcements a
            WHERE a.id = announcement_id
        )
    );

CREATE POLICY "Users can create comments" ON public.comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update/delete their own comments" ON public.comments
    FOR ALL USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('Admin', 'Super Admin')));

-- 6. Functions & Triggers
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON public.groups FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
