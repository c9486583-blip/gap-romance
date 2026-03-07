import { useState, useRef, useCallback } from "react";
import { motion, Reorder } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Camera, X, AlertCircle, GripVertical, Loader2, ImagePlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/heic", "image/heif"];

const UPLOAD_TIMEOUT_MS = 30000;

const withTimeout = async <T,>(promiseLike: PromiseLike<T>, timeoutMs = UPLOAD_TIMEOUT_MS): Promise<T> => {
  return await Promise.race([
    Promise.resolve(promiseLike),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Upload timed out. Please try a smaller file or better connection.")), timeoutMs)
    ),
  ]);
};

const validateImage = (file: File): Promise<{ valid: boolean; error?: string }> => {
  return new Promise((resolve) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      resolve({ valid: false, error: "Only JPG, PNG, and HEIC formats are accepted." });
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      resolve({ valid: false, error: "Photo must be under 10MB." });
      return;
    }
    // HEIC can't be validated for dimensions in browser easily
    if (file.type === "image/heic" || file.type === "image/heif") {
      resolve({ valid: true });
      return;
    }
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      if (img.width < MIN_DIMENSION || img.height < MIN_DIMENSION) {
        resolve({ valid: false, error: `Photo must be at least ${MIN_DIMENSION}x${MIN_DIMENSION} pixels. This photo is ${img.width}x${img.height}.` });
      } else {
        resolve({ valid: true });
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      resolve({ valid: false, error: "Could not read this image file." });
    };
    img.src = URL.createObjectURL(file);
  });
};

const detectFace = async (file: File): Promise<boolean> => {
  // Use browser FaceDetector API if available (Chrome)
  if ("FaceDetector" in window) {
    try {
      const bitmap = await createImageBitmap(file);
      const detector = new (window as any).FaceDetector();
      const faces = await detector.detect(bitmap);
      bitmap.close();
      return faces.length > 0;
    } catch {
      // Fallback: assume face is present
      return true;
    }
  }
  // Fallback: skip face detection
  return true;
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
  const [error, setError] = useState<string | null>(null);

  const photosRef = useRef(photos);
  photosRef.current = photos;

  const uploadPhoto = useCallback(async (file: File) => {
    setError(null);
    setUploading(true);

    try {
      // Validate
      const validation = await validateImage(file);
      if (!validation.valid) {
        setError(validation.error!);
        setUploading(false);
        return;
      }

      // Face detection (skip on failure to avoid blocking upload)
      try {
        const hasFace = await detectFace(file);
        if (!hasFace) {
          setError("We could not detect a face in this photo — please upload a clear photo of yourself.");
          setUploading(false);
          return;
        }
      } catch {
        // Skip face detection if it errors
        console.warn("Face detection skipped due to error");
      }

      // Upload to storage
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

      console.log("Starting photo upload:", fileName, "size:", file.size, "type:", file.type);

      const { error: uploadError, data: uploadData } = await withTimeout(
        supabase.storage
          .from("profile-photos")
          .upload(fileName, file, { contentType: file.type, upsert: false }),
        45000
      );

      if (uploadError) {
        console.error("Upload error:", uploadError);
        const msg = uploadError.message?.includes("Payload too large")
          ? "Photo is too large. Please use a photo under 10MB."
          : uploadError.message?.includes("mime")
          ? "Unsupported file format. Please use JPG, PNG, or HEIC."
          : uploadError.message?.includes("row-level security")
          ? "Permission denied. Please log out and log back in, then try again."
          : uploadError.message || "Failed to upload photo. Please try again.";
        setError(msg);
        setUploading(false);
        return;
      }

      console.log("Upload successful:", uploadData);

      const { data: urlData } = supabase.storage
        .from("profile-photos")
        .getPublicUrl(fileName);

      if (!urlData?.publicUrl) {
        setError("Upload succeeded but could not get photo URL. Please try again.");
        setUploading(false);
        return;
      }

      const newPhotos = [...photosRef.current, urlData.publicUrl];
      onPhotosChange(newPhotos);
      toast({ title: "Photo uploaded!" });
    } catch (err: any) {
      console.error("Photo upload exception:", err);
      const msg = err?.message?.includes("timed out")
        ? "Upload timed out. Please check your internet connection and try a smaller photo."
        : err?.message || "Failed to upload photo. Please try again.";
      setError(msg);
    } finally {
      setUploading(false);
    }
  }, [userId, onPhotosChange, toast]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remaining = maxPhotos - photos.length;
    const toUpload = Array.from(files).slice(0, remaining);

    for (const file of toUpload) {
      await uploadPhoto(file);
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePhoto = async (index: number) => {
    if (photos.length <= minPhotos) {
      toast({ title: `You must keep at least ${minPhotos} photos`, variant: "destructive" });
      return;
    }
    const url = photos[index];
    // Extract path from URL
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
          <div key={`empty-${i}`} className="aspect-[4/5] rounded-xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}>
            {uploading && i === 0 ? (
              <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
            ) : (
              <ImagePlus className="w-6 h-6 text-muted-foreground" />
            )}
          </div>
        ))}
      </Reorder.Group>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/heic,image/heif"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {photos.length}/{maxPhotos} photos · Drag to reorder · First photo is your main photo
        </p>
        {photos.length < maxPhotos && (
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            <Camera className="w-3 h-3 mr-1" /> Add Photo
          </Button>
        )}
      </div>

      {photos.length < 4 && photos.length >= minPhotos && (
        <p className="text-xs text-primary font-medium">
          💡 Profiles with 4 or more photos get 5x more matches.
        </p>
      )}
    </div>
  );
};

export default PhotoManager;
