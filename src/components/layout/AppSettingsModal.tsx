import { useState } from 'react';
import { X, Smartphone, Apple, Info, Sparkles } from 'lucide-react';

export interface NewAppData {
  name: string;
  platform: 'android' | 'ios' | 'both';
  androidPackageName: string;
  iosAppId: string;
  country: string;
}

interface AppSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (app: NewAppData) => void;
  onScrape?: (app: NewAppData) => void;
}

const countryOptions = [
  { code: 'id', label: 'Indonesia' },
  { code: 'us', label: 'United States' },
  { code: 'sg', label: 'Singapore' },
  { code: 'my', label: 'Malaysia' },
];

export default function AppSettingsModal({ isOpen, onClose, onSave, onScrape }: AppSettingsModalProps) {
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState<'android' | 'ios' | 'both'>('ios');
  const [androidPackageName, setAndroidPackageName] = useState('');
  const [iosAppId, setIosAppId] = useState('');
  const [country, setCountry] = useState('id');

  if (!isOpen) return null;

  const canSave =
    name.trim().length > 0 &&
    ((platform === 'android' && androidPackageName.trim().length > 0) ||
      (platform === 'ios' && iosAppId.trim().length > 0) ||
      (platform === 'both' && androidPackageName.trim().length > 0 && iosAppId.trim().length > 0));

  const handleSaveAndScrape = () => {
    if (!canSave) return;
    const data = { name, platform, androidPackageName, iosAppId, country };
    onSave?.(data);
    onScrape?.(data);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setName('');
    setPlatform('ios');
    setAndroidPackageName('');
    setIosAppId('');
    setCountry('id');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E0E0] flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-[#2D1818]">Tambah Aplikasi</h2>
            <p className="text-xs text-[#6B5B5B] mt-0.5">Masukkan identitas app untuk ditarik review-nya</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#F0E8E8] transition-colors text-[#6B5B5B]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <div className="px-6 py-4 overflow-y-auto flex-1 space-y-4">
          {/* Nama Aplikasi */}
          <div>
            <label className="text-xs font-medium text-[#2D1818] mb-1.5 block">Nama Aplikasi</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: My Awesome App"
              className="w-full px-3 py-2 rounded-lg border border-[#E8E0E0] text-sm text-[#2D1818] focus:outline-none focus:ring-2 focus:ring-[#C62828]/30 focus:border-[#C62828]"
            />
          </div>

          {/* Platform selector */}
          <div>
            <label className="text-xs font-medium text-[#2D1818] mb-1.5 block">Platform</label>
            <div className="grid grid-cols-3 gap-1.5">
              {/* Android - Coming Soon */}
              <button
                disabled
                className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium bg-[#F0E8E8] text-[#9E8E8E] cursor-not-allowed relative"
                title="Coming Soon"
              >
                {/* GANTI SRC DENGAN LOGO GOOGLE PLAY KAMU */}
                <img 
                  src="src/image/Google Logo.png" 
                  alt="Android"
                  className="w-8 h-8 object-contain opacity-50"
                />
                <span>Android</span>
                <span className="absolute -top-1.5 -right-1 bg-[#C62828] text-white text-[7px] px-1 py-0.5 rounded-full font-bold">
                  SOON
                </span>
              </button>

              {/* iOS - Aktif */}
               <button
                onClick={() => setPlatform('ios')}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                  platform === 'ios'
                    ? 'bg-[#C62828] text-white'
                    : 'bg-[#F0E8E8] text-[#6B5B5B] hover:bg-[#E8E0E0]'
                }`}
              >
                {/* GANTI SRC DENGAN LOGO APPLE KAMU */}
                <img 
                  src="src/image/Apple Logo.png" 
                  alt="iOS"
                  className="w-4 h-4 object-contain"
                  style={{ filter: platform === 'ios' ? 'brightness(0) invert(1)' : 'none' }}
                />
                iOS
              </button>

              {/* Keduanya - Coming Soon */}
              <button
                disabled
                className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium bg-[#F0E8E8] text-[#9E8E8E] cursor-not-allowed relative"
                title="Coming Soon"
              >
                <span>Keduanya</span>
                <span className="absolute -top-1 -right-1 bg-[#C62828] text-white text-[8px] px-1 py-0.5 rounded-full">
                  Soon
                </span>
              </button>
            </div>
          </div>

          {/* iOS field - SELALU TAMPIL */}
          <div>
            <label className="text-xs font-medium text-[#2D1818] mb-1.5 block">
              App Store ID
            </label>
            <input
              type="text"
              value={iosAppId}
              onChange={(e) => setIosAppId(e.target.value)}
              placeholder="310633997"
              className="w-full px-3 py-2 rounded-lg border border-[#E8E0E0] text-sm font-mono text-[#2D1818] focus:outline-none focus:ring-2 focus:ring-[#C62828]/30 focus:border-[#C62828]"
            />
            <p className="text-[10px] text-[#9E8E8E] mt-1">
              Lihat di URL App Store: apps.apple.com/id/app/nama-app/id<b>310633997</b>
            </p>
          </div>

          {/* Negara */}
          <div>
            <label className="text-xs font-medium text-[#2D1818] mb-1.5 block">Negara</label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#E8E0E0] text-sm text-[#2D1818] focus:outline-none focus:ring-2 focus:ring-[#C62828]/30 focus:border-[#C62828] bg-white"
            >
              {countryOptions.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Info note */}
          <div className="flex gap-2 bg-[#FFF8F7] border border-[#FFCDD2]/60 rounded-lg p-3">
            <Info className="w-4 h-4 text-[#C62828] flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-[#6B5B5B] leading-relaxed">
              Data ini hanya identitas publik aplikasi, dipakai untuk scraping review dari halaman
              publik store. Tidak perlu API key / kredensial developer.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-start gap-2 px-6 py-4 border-t border-[#E8E0E0] flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-[#6B5B5B] hover:bg-[#F0E8E8] transition-colors"
          >
            Batal
          </button>
          
          <button
            onClick={handleSaveAndScrape}
            disabled={!canSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-[#C62828] text-white hover:bg-[#8E0000] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Simpan & Load
          </button>
        </div>
      </div>
    </div>
  );
}