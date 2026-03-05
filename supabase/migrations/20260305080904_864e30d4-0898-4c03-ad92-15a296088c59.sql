
-- Push subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own push subs" ON push_subscriptions
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  new_matches boolean DEFAULT true,
  new_messages boolean DEFAULT true,
  virtual_gifts boolean DEFAULT true,
  super_likes boolean DEFAULT true,
  profile_activity boolean DEFAULT true,
  subscription_reminders boolean DEFAULT true,
  daily_reminders boolean DEFAULT true,
  dnd_enabled boolean DEFAULT false,
  dnd_start text DEFAULT '23:00',
  dnd_end text DEFAULT '08:00',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own notification prefs" ON notification_preferences
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Profile columns for notification management
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active_at timestamptz DEFAULT now();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notification_prompt_dismissed_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS inactivity_notifications_sent integer DEFAULT 0;
