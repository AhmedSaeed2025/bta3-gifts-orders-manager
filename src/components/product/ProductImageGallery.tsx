
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProductImage {
  image_url: string;
  alt_text?: string;
  is_primary: boolean;
}

interface ProductImageGalleryProps {
  images: ProductImage[];
  videoUrl?: string;
  productName: string;
}

const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({
  images,
  videoUrl,
  productName
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Combine images and video into one array for navigation
  const mediaItems = [
    ...images.map(img => ({ type: 'image', url: img.image_url, alt: img.alt_text })),
    ...(videoUrl ? [{ type: 'video', url: videoUrl, alt: 'فيديو المنتج' }] : [])
  ];

  const currentMedia = mediaItems[currentIndex];

  const nextMedia = () => {
    setCurrentIndex((prev) => (prev + 1) % mediaItems.length);
  };

  const prevMedia = () => {
    setCurrentIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
  };

  const goToMedia = (index: number) => {
    setCurrentIndex(index);
  };

  if (mediaItems.length === 0) {
    return (
      <div className="space-y-4">
        <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
          <span className="text-muted-foreground">لا توجد صورة</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Media Display */}
      <div className="relative aspect-square bg-muted rounded-lg overflow-hidden group">
        {currentMedia?.type === 'video' ? (
          <video
            src={currentMedia.url}
            controls
            className="w-full h-full object-cover"
            poster=""
          >
            متصفحك لا يدعم تشغيل الفيديو
          </video>
        ) : (
          <img
            src={currentMedia?.url}
            alt={currentMedia?.alt || productName}
            className="w-full h-full object-cover"
          />
        )}
        
        {/* Navigation Arrows */}
        {mediaItems.length > 1 && (
          <>
            <Button
              variant="outline"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm"
              onClick={prevMedia}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm"
              onClick={nextMedia}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Media Type Indicator */}
        {currentMedia?.type === 'video' && (
          <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
            <Play className="h-3 w-3" />
            فيديو
          </div>
        )}
      </div>
      
      {/* Thumbnail Navigation */}
      {mediaItems.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {mediaItems.map((media, index) => (
            <button
              key={index}
              onClick={() => goToMedia(index)}
              className={`aspect-square bg-muted rounded-md overflow-hidden border-2 transition-colors ${
                index === currentIndex ? 'border-primary' : 'border-transparent'
              }`}
            >
              {media.type === 'video' ? (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center relative">
                  <Play className="h-4 w-4 text-gray-600" />
                  <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs py-1 text-center">
                    فيديو
                  </span>
                </div>
              ) : (
                <img
                  src={media.url}
                  alt={media.alt || `صورة ${index + 1}`}
                  className="w-full h-full object-cover cursor-pointer hover:opacity-80"
                />
              )}
            </button>
          ))}
        </div>
      )}
      
      {/* Media Counter */}
      {mediaItems.length > 1 && (
        <div className="text-center text-sm text-muted-foreground">
          {currentIndex + 1} من {mediaItems.length}
        </div>
      )}
    </div>
  );
};

export default ProductImageGallery;
