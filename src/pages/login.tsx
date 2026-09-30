import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useLogin } from '@/features/auth/hooks/use-login';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { getAccessToken, checkTokenValidity, removeAccessToken } from '@/lib/auth/token';
import { clearStoredCompanyId, clearStoredPermissions } from '@/lib/session/storage';
import { LoadingState } from '@/components/ui/loading-state';

export default function LoginPage() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const { login, isLoading, error } = useLogin();

  useEffect(() => {
    async function checkAuth() {
      const token = getAccessToken();
      if (!token) {
        setIsCheckingAuth(false);
        return;
      }

      try {
        const status = await checkTokenValidity();
        if (status === 'valid') {
          router.back();
        } else {
          removeAccessToken();
          clearStoredCompanyId();
          clearStoredPermissions();
          setIsCheckingAuth(false);
        }
      } catch (err) {
        setIsCheckingAuth(false);
      }
    }

    checkAuth();
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    try {
      const response = await login({ login: userId, email: userId, password });
      if (response?.status) {
        // Successfully logged in
        window.location.href = '/select-company';
      }
    } catch (err) {
      // Error is handled by useLogin and accessible via `error` state
    }
  }

  if (isCheckingAuth) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white">
        <LoadingState variant="page" text="Memeriksa sesi..." />
      </div>
    );
  }

  return (
    <>
      <title>WAJIRA DASH: Masuk ke akun Pengguna</title>
      {/* Initialization Overlay */}
      {isCheckingAuth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-70">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-[#B0160D] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-medium text-slate-500">Memeriksa sesi Anda...</p>
          </div>
        </div>
      )}

      <div className={`flex min-h-screen font-sans ${isCheckingAuth ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}`}>
        {/* Left Side - Login Form */}
        <div className="flex w-full lg:w-1/2 items-center justify-center bg-white">
          <div className="flex flex-col items-start bg-white rounded-md border border-[#E5E5E5] shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] p-6 gap-6" style={{ width: '400px' }}>
            {/* Header */}
            <div className="flex flex-col gap-2 w-full">
              <h1 className="text-[16px] font-semibold leading-6 text-[#0A0A0A]">Masuk ke akun Pengguna</h1>
              <p className="text-[14px] font-normal leading-5 text-[#737373]">Masukkan User ID/Email dan Kata sandi di bawah ini untuk masuk ke akun Anda</p>
            </div>

            <form onSubmit={handleLogin} className="flex flex-col gap-4 w-full">
              {/* Error Message Display */}
              {error && (
                <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* User ID Field */}
              <div className="flex flex-col gap-[6px] w-full">
                <label htmlFor="userId" className="text-[14px] font-medium leading-5 text-[#0A0A0A]">
                  User ID / Email
                </label>
                <Input
                  id="userId"
                  type="text"
                  placeholder="Masukkan User ID / Email"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full h-[36px] px-3 py-[7.5px] border border-[#E5E5E5] rounded-md shadow-[0px_1px_2px_rgba(0,0,0,0.05)] text-[14px]"
                  required
                />
              </div>

              {/* Password Field */}
              <div className="flex flex-col gap-[6px] w-full">
                <div className="flex items-center justify-between w-full">
                  <label htmlFor="password" className="text-[14px] font-medium leading-5 text-[#0A0A0A]">
                    Kata Sandi
                  </label>
                  <Link href="/forgot-password" className="text-[14px] font-normal leading-5 text-[#0A0A0A] text-right">
                    Lupa Kata Sandi
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-[36px] px-3 py-[7.5px] pr-10 border border-[#E5E5E5] rounded-md shadow-[0px_1px_2px_rgba(0,0,0,0.05)] text-[14px]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-[#737373] hover:text-[#0A0A0A]"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <div className="flex flex-col gap-3 w-full mt-2">
                <Button type="submit" disabled={isLoading} variant="default">
                  {isLoading ? 'Memuat...' : 'Masuk'}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Side - Aurora Gradient & Logo */}
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center relative overflow-hidden bg-[#F5F6F8]">
          {/* Aurora Gradient Background */}
          <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(circle_at_85%_10%,#f64c0e_0%,#f47233_20%,#f08d5c_35%,#a85f71_55%,transparent_70%),radial-gradient(circle_at_80%_90%,#64a5db_0%,#7993c4_25%,#5a6d9f_45%,#4c6697_65%,transparent_75%)]" />

          {/* Centered Logo */}
          <div className="relative z-10 w-[400px] h-[400px] animate-fade-in">
            <Image src="/wajira-logo.png" alt="Wajira Logo" fill className="object-contain drop-shadow-lg" priority />
          </div>
        </div>
      </div>
    </>
  );
}
