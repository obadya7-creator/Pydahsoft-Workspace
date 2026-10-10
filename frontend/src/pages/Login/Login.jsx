import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';

export default function Login({ onLoginSuccess }) {
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  useEffect(() => {
    document.title = 'PydahSoft | Login';
    const root = document.documentElement;
    const body = document.body;
    const previousRootOverflow = root.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    const previousRootOverflowX = root.style.overflowX;
    const previousBodyOverflowX = body.style.overflowX;

    root.classList.add('login-page-open');
    body.classList.add('login-page-open');
    root.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    root.style.overflowX = 'hidden';
    body.style.overflowX = 'hidden';

    // Preload dashboard overview module in background for zero-delay login transition
    try {
      import('../Dashboard/DashboardOverview');
    } catch {
      /* ignore preload errors */
    }

    return () => {
      root.classList.remove('login-page-open');
      body.classList.remove('login-page-open');
      root.style.overflow = previousRootOverflow;
      body.style.overflow = previousBodyOverflow;
      root.style.overflowX = previousRootOverflowX;
      body.style.overflowX = previousBodyOverflowX;
    };
  }, []);

  // Canvas Flow Field Background Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H;
    let animId;

    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
      ctx.fillStyle = '#f2fbf6';
      ctx.fillRect(0, 0, W, H);
    };
    resize();
    window.addEventListener('resize', resize);

    const fade = () => {
      ctx.fillStyle = 'rgba(242, 251, 246, 0.06)';
      ctx.fillRect(0, 0, W, H);
    };
    ctx.fillStyle = '#f2fbf6';
    ctx.fillRect(0, 0, W, H);

    const hash = (x, y) => {
      const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
      return s - Math.floor(s);
    };

    const noise2 = (x, y) => {
      const xi = Math.floor(x), yi = Math.floor(y);
      const xf = x - xi, yf = y - yi;
      const a = hash(xi, yi), b = hash(xi + 1, yi);
      const c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
      const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    };

    let mouseX = W / 2, mouseY = H / 2, mouseActive = false;
    const handleMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      mouseActive = true;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const PARTICLE_COUNT = 700;
    const particles = [];
    const colors = ['#0f9d63', '#3fb884', '#7ecda5', '#bfe6d3'];

    const resetParticle = (p) => {
      p.x = Math.random() * W;
      p.y = Math.random() * H;
      p.life = 0;
      p.maxLife = 120 + Math.random() * 200;
      p.color = colors[Math.floor(Math.random() * colors.length)];
      p.width = Math.random() < 0.15 ? 1.6 : 0.7;
    };

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = {};
      resetParticle(p);
      p.life = Math.random() * p.maxLife;
      particles.push(p);
    }

    const SCALE = 0.0028;
    let t = 0;

    const animate = () => {
      fade();
      t += 0.0025;

      particles.forEach((p) => {
        const angle = noise2(p.x * SCALE, p.y * SCALE + t) * Math.PI * 4;
        let vx = Math.cos(angle) * 1.15;
        let vy = Math.sin(angle) * 1.15;

        if (mouseActive) {
          const dx = p.x - mouseX, dy = p.y - mouseY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 160) {
            const force = (1 - dist / 160) * 1.6;
            vx += (dx / (dist + 0.01)) * force;
            vy += (dy / (dist + 0.01)) * force;
          }
        }

        const px = p.x, py = p.y;
        p.x += vx;
        p.y += vy;
        p.life++;

        const fadeIn = Math.min(p.life / 20, 1);
        const fadeOut = Math.min((p.maxLife - p.life) / 30, 1);
        const alpha = Math.max(0, Math.min(fadeIn, fadeOut)) * 0.55;

        ctx.strokeStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = p.width;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        ctx.globalAlpha = 1;

        if (p.life > p.maxLife || p.x < -20 || p.x > W + 20 || p.y < -20 || p.y > H + 20) {
          resetParticle(p);
        }
      });

      animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (data.data.token) {
          sessionStorage.setItem('pydahsoft_token', data.data.token);
          sessionStorage.setItem('pydahsoft_user', JSON.stringify(data.data));
          localStorage.setItem('pydahsoft_token', data.data.token);
          localStorage.setItem('pydahsoft_user', JSON.stringify(data.data));
        }
        const pendingMeetingId = localStorage.getItem('pydahsoft_pending_meeting_id');
        if (pendingMeetingId) {
          localStorage.removeItem('pydahsoft_pending_meeting_id');
          if (onLoginSuccess) onLoginSuccess(data.data);
          // Use window.location for hash-router-compatible redirect to the meeting
          window.location.replace(`/#/meetings/${pendingMeetingId}`);
        } else {
          localStorage.setItem('pydahsoft_active_tab', 'overview');
          if (onLoginSuccess) onLoginSuccess(data.data);
          navigate('/dashboard', { replace: true });
        }
      } else {
        const errorMsg = data.error?.message || data.message || 'Invalid username or password';
        setError(errorMsg);
        setLoading(false);
      }
    } catch {
      setError('Unable to connect to backend server. Please verify backend service is running.');
      setLoading(false);
    }
  };

  return (
    <div className="login-page fixed inset-0 sm:static sm:min-h-screen text-[#09233d] flex flex-col justify-between items-center pt-20 sm:pt-24 pb-3 px-3 sm:px-6 overflow-hidden font-sans touch-none select-none">
      {/* Top Header - Consistent header with brand logo only (no quick links) */}
      <header className="landing-header-sticky fixed top-0 left-0 right-0 z-50 flex w-full items-center justify-between px-6 py-3.5 sm:py-4 lg:px-10 xl:px-14 bg-white/95 backdrop-blur-xl border-b border-[#dfeee6] shadow-sm transition-all duration-200">
        <Link to="/" className="flex items-center gap-2.5" aria-label="PydahSoft home">
          <img
            src="/pydahsoft_logo.png"
            alt="PydahSoft - Innovations that matters"
            className="h-9 sm:h-11 md:h-12 w-auto object-contain transition-transform duration-200 hover:scale-105"
          />
        </Link>
      </header>

      {/* Flow Field Canvas Background */}
      <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none z-0" />

      <main className="login-stage relative z-10 w-full flex items-center justify-center my-auto py-2">
        <div className="login-scene w-full flex justify-center px-4">
          {/* Glassmorphic Card Container with Clean High-Definition Template Background */}
          <div className="login-card relative rounded-[34px] sm:rounded-[40px] shadow-[0_22px_55px_rgba(12,65,42,0.14)] w-full max-w-[460px] sm:max-w-[490px] overflow-hidden p-8 sm:p-11">
            {/* Direct High-Resolution Card Background Image */}
            <img
              src="/login-card-template.png"
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none z-0 rounded-[34px] sm:rounded-[40px]"
            />

            {/* Back to Landing Page Arrow Button */}
            <button
              type="button"
              onClick={() => navigate('/')}
              className="absolute top-5 left-5 sm:top-6 sm:left-6 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/80 hover:bg-white border border-[#bce6d2] flex items-center justify-center text-[#103828] hover:text-[#008f58] shadow-[0_2px_6px_rgba(10,56,40,0.06)] hover:shadow-md transition-all cursor-pointer backdrop-blur-md group"
              title="Back to Landing Page"
              aria-label="Back to Landing Page"
            >
              <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#008f58] transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </button>

            {/* Card Header Content */}
            <div className="relative z-10 flex flex-col items-center text-center pt-1 sm:pt-2">
              {/* Company Title & Tagline */}
              <h2 className="text-2xl sm:text-[28px] font-bold tracking-tight text-[#103828]">
                PydahSoft
              </h2>
              <p className="mt-1 text-[9.5px] sm:text-[10.5px] font-bold uppercase tracking-[0.24em] text-[#4b7260]">
                INNOVATIONS THAT MATTERS
              </p>
            </div>

            {error && (
              <div className="relative z-10 mt-3.5 rounded-2xl bg-red-50/90 border border-red-200 p-2.5 text-center text-xs font-semibold text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="relative z-10 mt-6 space-y-4">
              {/* Username Input Pill */}
              <div className="relative flex items-center h-[54px] sm:h-[58px] rounded-full border border-[#bce6d2] bg-[#f2faf5]/95 p-1.5 pl-2 pr-5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] transition-all focus-within:border-[#00a86b] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#00a86b]/20">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#d0f0df] flex items-center justify-center text-[#0b6b45] shrink-0 mr-3.5">
                  <svg className="w-5 h-5 sm:w-5.5 sm:h-5.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full bg-transparent text-sm sm:text-[15px] font-medium text-[#103828] placeholder-[#6b9380] outline-none border-none"
                />
              </div>

              {/* Password Input Pill */}
              <div className="relative flex items-center h-[54px] sm:h-[58px] rounded-full border border-[#bce6d2] bg-[#f2faf5]/95 p-1.5 pl-2 pr-4 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] transition-all focus-within:border-[#00a86b] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#00a86b]/20">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#d0f0df] flex items-center justify-center text-[#0b6b45] shrink-0 mr-3.5">
                  <svg className="w-5 h-5 sm:w-5.5 sm:h-5.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full bg-transparent text-sm sm:text-[15px] font-medium text-[#103828] placeholder-[#6b9380] outline-none border-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[#557b6a] hover:text-[#0b6b45] transition-colors p-1.5 shrink-0 focus:outline-none cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.044 10.044 0 013.682-.863c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m-6.13-6.13a3 3 0 11-4.243-4.243m4.243 4.243L3 3l18 18" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Submit Button Pill */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-[#008f58] hover:bg-[#007f4e] active:bg-[#006e43] py-4 text-base sm:text-[17px] font-bold text-white shadow-[0_10px_25px_rgba(0,143,88,0.32)] transition-all hover:shadow-[0_12px_28px_rgba(0,143,88,0.4)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer mt-5"
              >
                {loading ? 'Authenticating...' : (
                  <>
                    <span>Sign In to Workspace</span>
                    <svg className="w-5 h-5 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Footer Supported Roles */}
            <div className="relative z-10 mt-8 text-center">
              <p className="text-xs sm:text-[13px] text-[#4b7260] font-medium">
                Supported Roles: <span className="font-bold text-[#103828]">SuperAdmin</span>, <span className="font-bold text-[#103828]">Superior</span>, <span className="font-bold text-[#103828]">Team Lead</span>, <span className="font-bold text-[#103828]">Employee</span>
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 py-2 text-center text-[10px] sm:text-xs font-medium text-[#4e7766]/80 shrink-0">
        PydahSoft &copy; 2026. All rights reserved.
      </footer>
    </div>
  );
}
