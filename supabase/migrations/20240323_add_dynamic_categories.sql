-- 1. Create announcement_categories table
CREATE TABLE IF NOT EXISTS public.announcement_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    icon TEXT, -- Can be a Lucide icon name or raw SVG
    color TEXT, -- Tailwind class or hex
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Insert default categories
INSERT INTO public.announcement_categories (name, icon, color)
VALUES 
    ('General', 'Megaphone', 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20'),
    ('HR', 'Users', 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'),
    ('IT', 'Monitor', 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20'),
    ('Finance', 'Landmark', 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'),
    ('Safety', 'ShieldAlert', 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20'),
    ('Events', 'CalendarDays', 'bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/20')
ON CONFLICT (name) DO NOTHING;

-- 3. Modify announcements table (category from enum to text)
-- First, make sure we don't have constraints that stop us
ALTER TABLE public.announcements 
ALTER COLUMN category TYPE TEXT;

-- 4. RLS Policies
ALTER TABLE public.announcement_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public categories are viewable by all active users" ON public.announcement_categories
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND status = 'Active'));

CREATE POLICY "Admins can manage categories" ON public.announcement_categories
    FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('Admin', 'Super Admin')));

-- 5. Trigger for updated_at
CREATE TRIGGER update_announcement_categories_updated_at 
BEFORE UPDATE ON public.announcement_categories 
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
