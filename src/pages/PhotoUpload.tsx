import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PhotoManager from "@/components/PhotoManager";

const PhotoUpload = () => {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [photos, setPhotos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile?.photos && (profile.photos as string[]).length > 0) {
      setPhotos(profile.photos as string[]);
    }
  }, [profile]);

  const handleContinue = async () => {
    if (!user) return;
    if (photos.length < 2) {
      toast({ title: "Please upload at least 2 photos to continue", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ photos, avatar_url: photos[0] } as any)
      .eq("user_id", user.id);

    if (error) {
      toast({ title: "Failed to save photos", variant: "destructive" });
      setSaving(false);
      return;
    }

    await refreshProfile();
    setSaving(false);
    navigate("/verify-identity");
  };

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Camera className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-heading font-bold mb-2">Add Your Photos</h1>
          <p className="text-muted-foreground">
            Upload at least 2 photos of yourself. Your first photo will be your main profile photo shown across the platform.
          </p>
        </div>

        <div className="glass rounded-2xl p-6 mb-6">
          <PhotoManager
            userId={user.id}
            photos={photos}
            onPhotosChange={setPhotos}
            minPhotos={2}
            maxPhotos={6}
            showGuidelines={true}
          />
        </div>

        <Button
          variant="hero"
          className="w-full"
          onClick={handleContinue}
          disabled={saving || photos.length < 2}
        >
          {saving ? (
            <><Loader2 className="mr-2 w-4 h-4 animate-spin" /> Saving...</>
          ) : (
            <>Continue to Verification <ArrowRight className="ml-2 w-4 h-4" /></>
          )}
        </Button>

        {photos.length < 2 && (
          <p className="text-xs text-destructive text-center mt-3">
            You need at least 2 photos to proceed to identity verification.
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default PhotoUpload;
