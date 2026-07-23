import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Eye, EyeOff, LogIn, Star } from 'lucide-react';

interface ChatBubbleData {
  user: string;
  rating?: number;
  text: string;
  top: string;
  left: string;
  rotate: number;
  delay: number;
}

const CHAT_BUBBLES: ChatBubbleData[] = [
  { user: 'S', rating: 5, text: 'Sentiment tracking-nya ngebantu banget!', top: '0%', left: '0%', rotate: -3, delay: 0 },
  { user: 'B', rating: 4, text: 'Ketauan lonjakan bug sebelum makin parah.', top: '48%', left: '30%', rotate: 2, delay: 1 },
  { user: 'M', text: 'Topic breakdown-nya juara.', top: '12%', left: '60%', rotate: -2, delay: 2 },
];

function ChatBubble({ data }: { data: ChatBubbleData }) {
  return (
    <div
      className="absolute w-fit"
      style={{
        top: data.top,
        left: data.left,
        '--r': `${data.rotate}deg`,
        animation: 'bubble-float 6s ease-in-out infinite',
        animationDelay: `${data.delay}s`,
      } as React.CSSProperties}
    >
      <div className="flex items-end gap-2">
        <div className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center text-[#C62828] text-xs font-bold flex-shrink-0 shadow-md">
          {data.user}
        </div>
        <div className="relative bg-white rounded-2xl rounded-bl-sm shadow-lg px-3.5 py-2.5 max-w-[190px]">
          {data.rating && (
            <div className="flex gap-0.5 mb-1">
              {[1, 2, 3, 4, 5].map(s => (
                <Star
                  key={s}
                  className={`w-3 h-3 ${s <= data.rating! ? 'text-[#FFC107]' : 'text-[#E0E0E0]'}`}
                  fill={s <= data.rating! ? '#FFC107' : 'none'}
                />
              ))}
            </div>
          )}
          <p className="text-[11px] text-[#2D1818] leading-snug">{data.text}</p>
          {/* Ekor bubble, bikin kesan chat */}
          <div className="absolute -bottom-1 left-3 w-2.5 h-2.5 bg-white rotate-45" />
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate login - replace with real auth API
    setTimeout(() => {
      // Store auth token
      localStorage.setItem('reviewpulse_auth', 'mock_token_' + Date.now());
      setIsLoading(false);
      navigate('/dashboard');
    }, 1000);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-[#FFF8F7] via-[#FFF3E0] to-[#FFF8F7] p-6">
      <style>{`
        @keyframes bubble-float {
          0%, 100% { transform: translateY(0) rotate(var(--r, 0deg)); }
          50% { transform: translateY(-10px) rotate(var(--r, 0deg)); }
        }
      `}</style>

      {/* Dekorasi background: blob lembut + garis lengkung tipis, di belakang kartu */}
      <div className="absolute w-[420px] h-[420px] bg-[#FFCDD2]/40 rounded-full blur-3xl -top-24 -left-24 pointer-events-none" />
      <div className="absolute w-[500px] h-[500px] bg-[#FFE0B2]/40 rounded-full blur-3xl -bottom-32 -right-24 pointer-events-none" />
      <svg className="absolute top-0 right-0 w-[380px] h-[380px] text-[#C62828]/10 pointer-events-none" viewBox="0 0 200 200" fill="none">
        <circle cx="140" cy="60" r="90" stroke="currentColor" strokeWidth="1.5" />
        <path d="M20,150 Q60,100 100,150 T180,150" stroke="currentColor" strokeWidth="1.5" fill="none" />
      </svg>
      <svg className="absolute bottom-0 left-0 w-[320px] h-[320px] text-[#FF6F00]/10 pointer-events-none" viewBox="0 0 200 200" fill="none">
        <circle cx="60" cy="140" r="70" stroke="currentColor" strokeWidth="1.5" />
      </svg>

      {/* Kartu utama, split 50/50 */}
      <div className="relative z-10 w-full max-w-5xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row">

        {/* KIRI: panel visual — teks di atas (dengan padding), gambar ilustrasi
            full-bleed nempel ke tepi bawah & samping panel (tanpa padding) */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[#C62828] to-[#FF6F00] flex-col justify-between min-h-[600px] overflow-hidden">
          <div className="relative z-10 p-10 pb-4">
            <h2 className="text-2xl xl:text-3xl font-bold text-white leading-tight mb-2">
              Turn Every Review<br />Into Insight
            </h2>
            <p className="text-white/80 text-sm max-w-xs mb-6">
              Lacak rating, sentimen, dan tren user di semua app kamu — semuanya dalam satu dashboard.
            </p>

            {/* Zona chat bubble — tingginya dedicated, murni di ATAS gambar */}
            <div className="relative h-[130px]">
              {CHAT_BUBBLES.map((b, i) => (
                <ChatBubble key={i} data={b} />
              ))}
            </div>
          </div>

          {/* Gambar ilustrasi custom kamu — full-bleed, nempel ke tepi bawah &
              samping panel (nggak ada padding di sekitarnya). Ganti src ini
              sesuai lokasi file kamu. onError bikin gambar otomatis
              nyembunyiin diri kalau file-nya nggak ketemu. */}
          <div className="relative z-10 flex-1">
            <img
              src="/src/image/GambarLogin Logo.png"
              alt=""
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
              className="absolute inset-0 w-full h-full object-contain object-bottom pointer-events-none select-none"
            />
          </div>
        </div>

        {/* KANAN: form login */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 lg:p-12">
          <div className="w-full max-w-[380px]">
            {/* Header simpel: icon user + judul "Login" */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-[#C62828] flex items-center justify-center mx-auto mb-4 shadow-lg">
                <User className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-[#2D1818]">Login</h1>
              <p className="text-sm text-[#6B5B5B] mt-1">Sign in to your account to continue</p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-[#FDECEA] border border-[#E53935]/20 text-sm text-[#E53935]">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#6B5B5B] mb-1.5 uppercase tracking-wider">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E8E0E0] text-sm text-[#2D1818] placeholder:text-[#9E8E8E] focus:outline-none focus:ring-2 focus:ring-[#C62828]/30 focus:border-[#C62828] transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#6B5B5B] mb-1.5 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-4 py-2.5 pr-10 rounded-xl border border-[#E8E0E0] text-sm text-[#2D1818] placeholder:text-[#9E8E8E] focus:outline-none focus:ring-2 focus:ring-[#C62828]/30 focus:border-[#C62828] transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9E8E8E] hover:text-[#6B5B5B] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-[#E8E0E0] text-[#C62828] focus:ring-[#C62828]/30"
                  />
                  <span className="text-xs text-[#6B5B5B]">Remember me</span>
                </label>
                <button type="button" className="text-xs text-[#C62828] hover:text-[#8E0000] font-medium">
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#C62828] text-white text-sm font-semibold hover:bg-[#8E0000] transition-colors disabled:opacity-60 shadow-lg shadow-[#C62828]/25"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-xs text-[#9E8E8E] mt-6">
              Protected by industry-standard security
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}