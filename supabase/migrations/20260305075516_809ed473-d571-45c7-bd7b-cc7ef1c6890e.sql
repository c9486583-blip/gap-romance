
ALTER TABLE reports ADD COLUMN IF NOT EXISTS admin_notes text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspension_end timestamp with time zone;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ban_reason text;

CREATE TABLE IF NOT EXISTS banned_identifiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier_type text NOT NULL,
  identifier_value text NOT NULL,
  banned_at timestamp with time zone DEFAULT now(),
  reason text,
  banned_by uuid,
  UNIQUE(identifier_type, identifier_value)
);

ALTER TABLE banned_identifiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage banned identifiers" ON banned_identifiers FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update any profile" ON profiles FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can read all messages" ON messages FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete messages" ON messages FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));
