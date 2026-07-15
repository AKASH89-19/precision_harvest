import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../hooks/use-auth";
import { apiPost } from "../lib/api-client";
const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
type FormData = z.infer<typeof schema>;

interface AuthResponse {
  token: string;
  user: { id: string; name: string; email: string; farmLocation?: string | null };
}

export default function SignIn() {
  const [, navigate] = useLocation();
  const { signIn } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    try {
      const res = await apiPost<AuthResponse>("/auth/signin", data);
      signIn(res.token, res.user);
      navigate("/");
    } catch (err: unknown) {
      const e = err as { message?: string };
      setServerError(e?.message ?? "Invalid email or password");
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#e5e2e1] flex flex-col items-center justify-center relative overflow-hidden">
      <canvas id="bg-canvas" className="fixed inset-0 w-full h-full pointer-events-none opacity-30" ref={(canvas) => {
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const particles = Array.from({ length: 50 }, () => ({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 1,
          speedY: Math.random() * 0.3 + 0.1,
          opacity: Math.random() * 0.5 + 0.1,
        }));
        let running = true;
        const animate = () => {
          if (!running) return;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          particles.forEach((p) => {
            ctx.fillStyle = `rgba(16,185,129,${p.opacity})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            p.y -= p.speedY;
            if (p.y < -10) p.y = canvas.height + 10;
          });
          requestAnimationFrame(animate);
        };
        animate();
        return () => { running = false; };
      }} />

      <main className="w-full max-w-md px-4 z-10">
        <div className="rounded-xl p-10 flex flex-col items-center"
          style={{ background: "linear-gradient(135deg,#1A1A1A 0%,#0F0F0F 100%)", border: "1px solid #1E293B", boxShadow: "0 20px 40px rgba(0,0,0,0.6)" }}>

          <div className="mb-6">
            <div className="w-16 h-16 rounded-2xl bg-[#10B981]/10 border border-[#10B981]/30 flex items-center justify-center mx-auto" style={{boxShadow:"0 0 24px rgba(16,185,129,0.2)"}}>
              <svg className="w-8 h-8 text-[#10B981]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3C7 3 3 7.5 3 12c0 3 1.5 5.5 4 7m5-16c5 0 9 4.5 9 9 0 3-1.5 5.5-4 7M8 12c0-2 1.5-4 4-4s4 2 4 4-1.5 4-4 4-4-2-4-4z"/></svg>
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-semibold tracking-tight text-[#e5e2e1] mb-2">Welcome Back</h1>
            <p className="text-[#bbcabf] text-base">Precision stewardship starts here.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-5">
            {serverError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400">
                {serverError}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#bbcabf] ml-1">Email Address</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#86948a]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </span>
                <input {...register("email")} type="email" placeholder="steward@agriai.com"
                  className="w-full bg-black border border-[#3c4a42] rounded-lg py-4 pl-12 pr-4 text-[#e5e2e1] placeholder:text-[#86948a]/60 focus:border-[#10B981] focus:ring-0 outline-none transition-all text-base" />
              </div>
              {errors.email && <p className="text-red-400 text-xs ml-1">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-medium text-[#bbcabf]">Password</label>
                <span className="text-sm text-[#10B981] cursor-pointer hover:opacity-80 transition-opacity">Forgot Password?</span>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#86948a]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </span>
                <input {...register("password")} type={showPassword ? "text" : "password"} placeholder="••••••••"
                  className="w-full bg-black border border-[#3c4a42] rounded-lg py-4 pl-12 pr-12 text-[#e5e2e1] placeholder:text-[#86948a]/60 focus:border-[#10B981] focus:ring-0 outline-none transition-all text-base" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#86948a] hover:text-[#e5e2e1] transition-colors">
                  {showPassword
                    ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" /></svg>
                    : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  }
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs ml-1">{errors.password.message}</p>}
            </div>

            <div className="pt-2">
              <button type="submit" disabled={isSubmitting}
                className="w-full bg-[#10B981] text-[#003824] font-semibold text-lg py-4 rounded-lg hover:bg-[#0ea471] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ boxShadow: "0 0 15px rgba(16,185,129,0.3)" }}>
                {isSubmitting ? "Signing in…" : <>Sign In <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg></>}
              </button>
            </div>
          </form>


        </div>

        <footer className="mt-8 text-center">
          <p className="text-base text-[#bbcabf]">
            Don't have an account?{" "}
            <Link href="/signup" className="text-[#10B981] font-bold hover:underline transition-all">Sign Up</Link>
          </p>
          <div className="mt-4 flex justify-center gap-6 text-xs text-[#86948a]/60">
            <span className="hover:text-[#bbcabf] cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-[#bbcabf] cursor-pointer transition-colors">Terms of Service</span>
            <span className="hover:text-[#bbcabf] cursor-pointer transition-colors">Support</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
