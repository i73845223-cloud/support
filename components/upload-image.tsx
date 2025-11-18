"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { ImagePlus, Trash } from "lucide-react";
import Image from "next/image";
import { CldUploadWidget } from "next-cloudinary";

interface ImageUploadProps {
  disabled?: boolean;
  onChange: (value: string) => void;
  onRemove: () => void;
  value: { url: string };
}

const ImageUpload: React.FC<ImageUploadProps> = ({ disabled, onChange, onRemove, value }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSuccess = (result: any) => {
    if (result?.info?.secure_url) {
      onChange(result.info.secure_url);
    }
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div>
      {value.url ? (
        <div className="my-4 flex items-center justify-center">
          <div className="relative w-[300px] h-[300px] rounded-md overflow-hidden">
            <div className="z-10 absolute top-2 right-2">
              <Button
                type="button"
                onClick={onRemove}
                variant="destructive"
                size="sm"
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
            <Image
              fill
              className="object-cover"
              alt="Image"
              src={value.url}
            />
          </div>
        </div>
      ) : 
      <CldUploadWidget
        uploadPreset="s9xneoe8"
        onSuccess={handleSuccess}
      >
        {({ open }) => (
          <Button
            type="button"
            disabled={disabled}
            variant="secondary"
            onClick={() => open()}
            className="text-xl px-10 py-8"
          >
            <ImagePlus className="h-6 w-6 mr-3" />
            Upload an Image
          </Button>
        )}
      </CldUploadWidget>
      }
    </div>
  );
};

export default ImageUpload;