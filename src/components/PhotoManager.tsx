import { useState, useRef, useCallback } from "react";
import { motion, Reorder } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Camera, X, AlertCircle, GripVertical, ImagePlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { compressImage } from "@/lib/image-compress";

interface PhotoManagerProps {
  userId: string;
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  minPhotos?: number;
  maxPhotos?: number;
  showGuidelines?: boolean;
}

const PHOTO_GUIDELINES = [
  "Use clear, recent photos of yourself",
  "Make sure your face is clearly visible in your first photo",
  "No sunglasses or hats covering your face in your main photo",
  "No group photos as your main photo",
  "No explicit or nude photos on your public profile",
  "Photos must be of you and only you",
];

const MIN_DIMENSION = 400;
const MAX_RAW_SIZE = 25 * 1024 * 1024; // 25MB raw limit before compression
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/heic", "image/heif", "image/webp"];

const validateImage = (file: File): Promise<{ valid: boolean; error?: string }> => {
  return new Promise((resolve) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      resolve({ valid: false, error: "Unsupported format. Please use JPG, PNG, WEBP, or HEIC." });
      return;
    }
    if (file.size > MAX_RAW_SIZE) {
      resolve({ valid: false, error: "Photo must be under 25MB before compression." });
      return;
    }
    if (file.type === "image/heic" || file.type === "image/heif") {
      resolve({ valid: true });
      return;
    }
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      if (img.width < MIN_DIMENSION || img.height < MIN_DIMENSION) {
        resolve({ valid: false, error: `Photo must be at least ${MIN_DIMENSION}×${MIN_DIMENSION}px. Yours is ${img.width}×${img.height}px.` });
      } else {
        resolve({ valid: true });
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      resolve({ valid: false, error: "Could not read this image file. It may be corrupted." });
    };
    img.src = URL.createObjectURL(file);
  });
};

const detectFace = async (file: File): Promise<boolean> => {
  if ("FaceDetector" in window) {
    try {
      const bitmap = await createImageBitmap(file);
      const detector = new (window as any).FaceDetector();
      const faces = await detector.detect(bitmap);
      bitmap.close();
      return faces.length > 0;
    } catch {
      return true;
    }
  }
  return true;
};

type UploadStage = "idle" | "validating" | "compressing" | "uploading" | "done";

const STAGE_LABELS: Record<UploadStage, string> = {
  idle: "",
  validating: "Checking photo…",
  compressing: "Compressing…",
  uploading: "Uploading…",
  done: "Done!",
};

const STAGE_PROGRESS: Record<UploadStage, number> = {
  idle: 0,
  validating: 15,
  compressing: 40,
  uploading: 70,
  done: 100,
};

const PhotoManager = ({
  userId,
  photos,
  onPhotosChange,
  minPhotos = 2,
  maxPhotos = 6,
  showGuidelines = false,
}: PhotoManagerProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [stage, setStage] = useState<UploadStage>("idle");
  const [error, setError] = useState<string | null>(null);

  const photosRef = useRef(photos);
  photosRef.current = photos;

  const uploadPhoto = useCallback(async (file: File) => {
    setError(null);
    setUploading(true);
    setStage("validating");

    try {
      // 1. Validate
      const validation = await validateImage(file);
      if (!validation.valid) {
        setError(validation.error!);
        setUploading(false);
        setStage("idle");
        return;
      }

      // 2. Face detection (non-blocking)
      try {
        const hasFace = await detectFace(file);
        if (!hasFace) {
          setError("We couldn't detect a face in this photo — please upload a clear photo of yourself.");
          setUploading(false);
          setStage("idle");
          return;
        }
      } catch {
        console.warn("Face detection skipped");
      }

      // 3. Compress & resize
      setStage("compressing");
      let processedFile: File;
      try {
        processedFile = await compressImage(file);
        console.log(`Compressed: ${(file.size / 1024).toFixed(0)}KB → ${(processedFile.size / 1024).toFixed(0)}KB`);
      } catch (compErr) {
        console.warn("Compression failed, using original:", compErr);
        processedFile = file;
      }

      // 4. Upload
      setStage("uploading");
      const ext = processedFile.type === "image/jpeg" ? "jpg" : processedFile.name.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

      console.log("Uploading:", fileName, "size:", processedFile.size, "type:", processedFile.type);

      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(fileName, processedFile, { contentType: processedFile.type, upsert: false });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        let msg: string;
        const m = uploadError.message || "";
        if (m.includes("Payload too large")) {
          msg = "Photo is still too large after compression. Try a different photo.";
        } else if (m.includes("mime") || m.includes("not allowed")) {
          msg = "This file type isn't supported. Please use JPG, PNG, WEBP, or HEIC.";
        } else if (m.includes("row-level security") || m.includes("policy")) {
          msg = "Permission denied. Please log out and log back in, then try again.";
        } else if (m.includes("duplicate") || m.includes("already exists")) {
          msg = "A file with this name already exists. Please try again.";
        } else {
          msg = `Upload failed: ${m || "Unknown error"}. Check your internet connection and try again.`;
        }
        setError(msg);
        setUploading(false);
        setStage("idle");
        return;
      }

      // 5. Get URL
      setStage("done");
      const { data: urlData } = supabase.storage
        .from("profile-photos")
        .getPublicUrl(fileName);

      if (!urlData?.publicUrl) {
        setError("Upload succeeded but couldn't get the photo URL. Please try again.");
        setUploading(false);
        setStage("idle");
        return;
      }

      const newPhotos = [...photosRef.current, urlData.publicUrl];
      onPhotosChange(newPhotos);
      toast({ title: "Photo uploaded!" });

      // Brief delay so user sees "Done!" before resetting
      await new Promise((r) => setTimeout(r, 400));
    } catch (err: any) {
      console.error("Photo upload exception:", err);
      const msg = err?.message?.includes("timed out")
        ? "Upload timed out — your connection may be slow. Try a smaller photo or better Wi-Fi."
        : err?.message || "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setUploading(false);
      setStage("idle");
    }
  }, [userId, onPhotosChange, toast]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remaining = maxPhotos - photosRef.current.length;
    const toUpload = Array.from(files).slice(0, remaining);

    for (const file of toUpload) {
      await uploadPhoto(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePhoto = async (index: number) => {
    if (photos.length <= minPhotos) {
      toast({ title: `You must keep at least ${minPhotos} photos`, variant: "destructive" });
      return;
    }
    const url = photos[index];
    const path = url.split("/profile-photos/")[1];
    if (path) {
      await supabase.storage.from("profile-photos").remove([path]);
    }
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
    toast({ title: "Photo removed" });
  };

  return (
    <div className="space-y-4">
      {showGuidelines && (
        <div className="glass rounded-xl p-4 border border-border/30">
          <h4 className="text-sm font-bold mb-2 flex items-center gap-2">
            <Camera className="w-4 h-4 text-primary" /> Photo Guidelines
          </h4>
          <ul className="space-y-1.5">
            {PHOTO_GUIDELINES.map((g, i) => (
              <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span> {g}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Upload progress bar */}
      {uploading && stage !== "idle" && (
        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-primary">{STAGE_LABELS[stage]}</p>
            <p className="text-xs text-muted-foreground">{STAGE_PROGRESS[stage]}%</p>
          </div>
          <Progress value={STAGE_PROGRESS[stage]} className="h-2" />
        </motion.div>
      )}

      {error && (
        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
          <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-xs text-destructive">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-3 h-3 text-destructive" /></button>
        </motion.div>
      )}

      {/* Photo grid with reorder */}
      <Reorder.Group
        axis="x"
        values={photos}
        onReorder={onPhotosChange}
        className="grid grid-cols-3 gap-2"
      >
        {photos.map((photo, i) => (
          <Reorder.Item key={photo} value={photo} className="relative">
            <div className={`relative aspect-[4/5] rounded-xl overflow-hidden border-2 ${i === 0 ? "border-primary" : "border-border/30"} cursor-grab active:cursor-grabbing`}>
              <img src={photo} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
              <div className="absolute top-1 left-1">
                <GripVertical className="w-4 h-4 text-white drop-shadow-lg" />
              </div>
              {i === 0 && (
                <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[9px] font-bold">
                  MAIN
                </div>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); removePhoto(i); }}
                className="absolute bottom-1 right-1 p-1 rounded-full bg-background/80 hover:bg-destructive/80 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </Reorder.Item>
        ))}

        {/* Add photo slots */}
        {Array.from({ length: maxPhotos - photos.length }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-[4/5] rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => !uploading && fileInputRef.current?.click()}>
            <ImagePlus className="w-6 h-6 text-muted-foreground" />
            {i === 0 && !uploading && (
              <span className="text-[10px] text-muted-foreground">Tap to add</span>
            )}
          </div>
        ))}
      </Reorder.Group>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/heic,image/heif,image/webp"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {photos.length}/{maxPhotos} photos · Drag to reorder · First = main photo
        </p>
        {photos.length < maxPhotos && (
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            <Camera className="w-3 h-3 mr-1" /> Add Photo
          </Button>
        )}
      </div>

      {photos.length < 4 && photos.length >= minPhotos && (
        <p className="text-xs text-primary font-medium">
          💡 Profiles with 4+ photos get 5× more matches.
        </p>
      )}
    </div>
  );
};

export default PhotoManager;
