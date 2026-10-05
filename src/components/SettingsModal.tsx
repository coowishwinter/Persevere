import React, { useRef, useState } from 'react';
import { X, Upload, User, Check, Sparkles, Image as ImageIcon, HardDrive } from 'lucide-react';
import { UserProfile } from '../utils/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSaveProfile: (profile: UserProfile) => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
}) => {
  const [userName, setUserName] = useState(profile.userName || '日砺者');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [motto, setMotto] = useState(profile.motto || '日砺一寸，终成千里');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert('图片大小请小于 3MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setAvatarUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile({
      userName: userName.trim() || '日砺者',
      avatarUrl,
      motto: motto.trim() || '日砺一寸，终成千里',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-neutral-200/80 w-full max-w-md overflow-hidden animate-scale-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-neutral-900 text-sm">个人设置与圆环头像</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Avatar Preview & Upload */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-emerald-500/20 shadow-md transition-transform group-hover:scale-105">
                <img
                  src={avatarUrl}
                  alt="Avatar Preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Upload className="w-6 h-6 text-white" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1 rounded-full font-medium transition-colors flex items-center gap-1"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                上传本地头像
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarFile}
                accept="image/*"
                className="hidden"
              />
            </div>

            {/* Presets */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] text-neutral-400">预设头像:</span>
              <div className="flex items-center gap-1.5">
                {PRESET_AVATARS.map((url) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setAvatarUrl(url)}
                    className={`w-6 h-6 rounded-full overflow-hidden border transition-all ${
                      avatarUrl === url ? 'ring-2 ring-emerald-600 scale-110' : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt="Preset" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Name & Motto */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                昵称 / 打卡尊称
              </label>
              <input
                type="text"
                required
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                个性座右铭
              </label>
              <input
                type="text"
                value={motto}
                onChange={(e) => setMotto(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Docker Persistence Info */}
          <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200/80 text-[11px] text-neutral-500 flex items-start gap-2">
            <HardDrive className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-neutral-700">Docker 持久化状态：</span>
              数据库已配置导出挂载 `/app/data/db.json`，在 Docker 部署中数据将安全永久保存。
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 rounded-xl hover:bg-neutral-100 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl shadow-xs transition-colors flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              保存更新
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
