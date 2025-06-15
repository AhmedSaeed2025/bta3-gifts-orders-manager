
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Facebook, Instagram, Twitter, Youtube, Linkedin } from 'lucide-react';

interface SocialMediaSettingsProps {
  formData: any;
  onInputChange: (field: string, value: string) => void;
}

const SocialMediaSettings = ({ formData, onInputChange }: SocialMediaSettingsProps) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Facebook className="h-5 w-5" />
            <CardTitle>روابط وسائل التواصل الاجتماعي</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            أضف روابط صفحاتك على وسائل التواصل الاجتماعي لتظهر في المتجر
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="facebook_url" className="flex items-center gap-2">
                <Facebook className="h-4 w-4 text-blue-600" />
                فيسبوك
              </Label>
              <Input
                id="facebook_url"
                value={formData.facebook_url || ''}
                onChange={(e) => onInputChange('facebook_url', e.target.value)}
                placeholder="https://facebook.com/yourpage"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagram_url" className="flex items-center gap-2">
                <Instagram className="h-4 w-4 text-pink-600" />
                انستجرام
              </Label>
              <Input
                id="instagram_url"
                value={formData.instagram_url || ''}
                onChange={(e) => onInputChange('instagram_url', e.target.value)}
                placeholder="https://instagram.com/yourpage"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="twitter_url" className="flex items-center gap-2">
                <Twitter className="h-4 w-4 text-blue-400" />
                تويتر / X
              </Label>
              <Input
                id="twitter_url"
                value={formData.twitter_url || ''}
                onChange={(e) => onInputChange('twitter_url', e.target.value)}
                placeholder="https://twitter.com/yourpage"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="youtube_url" className="flex items-center gap-2">
                <Youtube className="h-4 w-4 text-red-600" />
                يوتيوب
              </Label>
              <Input
                id="youtube_url"
                value={formData.youtube_url || ''}
                onChange={(e) => onInputChange('youtube_url', e.target.value)}
                placeholder="https://youtube.com/yourchannel"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedin_url" className="flex items-center gap-2">
                <Linkedin className="h-4 w-4 text-blue-700" />
                لينكد إن
              </Label>
              <Input
                id="linkedin_url"
                value={formData.linkedin_url || ''}
                onChange={(e) => onInputChange('linkedin_url', e.target.value)}
                placeholder="https://linkedin.com/company/yourcompany"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tiktok_url" className="flex items-center gap-2">
                <div className="h-4 w-4 bg-black rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">T</span>
                </div>
                تيك توك
              </Label>
              <Input
                id="tiktok_url"
                value={formData.tiktok_url || ''}
                onChange={(e) => onInputChange('tiktok_url', e.target.value)}
                placeholder="https://tiktok.com/@yourpage"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="snapchat_url" className="flex items-center gap-2">
                <div className="h-4 w-4 bg-yellow-400 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">S</span>
                </div>
                سناب شات
              </Label>
              <Input
                id="snapchat_url"
                value={formData.snapchat_url || ''}
                onChange={(e) => onInputChange('snapchat_url', e.target.value)}
                placeholder="https://snapchat.com/add/yourpage"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SocialMediaSettings;
