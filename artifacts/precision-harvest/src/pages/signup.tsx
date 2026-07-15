import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../hooks/use-auth";
import { apiPost } from "../lib/api-client";
const schema = z.object({
  name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  farmLocation: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

interface AuthResponse {
  token: string;
  user: { id: string; name: string; email: string; farmLocation?: string | null };
}

export default function SignUp() {
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
      const res = await apiPost<AuthResponse>("/auth/signup", data);
      signIn(res.token, res.user);
      navigate("/");
    } catch (err: unknown) {
      const e = err as { message?: string; status?: number };
      if (e?.status === 409) {
        setServerError("An account with this email already exists. Sign in instead.");
      } else {
        setServerError(e?.message ?? "Something went wrong. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#e5e2e1] flex flex-col items-center justify-center px-4 py-10"
      style={{ backgroundImage: "radial-gradient(at 0% 0%,rgba(16,185,129,0.05) 0,transparent 50%),radial-gradient(at 100% 100%,rgba(16,185,129,0.05) 0,transparent 50%)" }}>

      <main className="w-full max-w-lg z-10">
        <div className="text-center mb-10">
          <div className="mx-auto w-20 h-20 mb-4 rounded-2xl bg-[#10B981]/10 border border-[#10B981]/30 flex items-center justify-center" style={{boxShadow:"0 0 30px rgba(16,185,129,0.2)"}}>
              <svg className="w-10 h-10 text-[#10B981]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3C7 3 3 7.5 3 12c0 3 1.5 5.5 4 7m5-16c5 0 9 4.5 9 9 0 3-1.5 5.5-4 7M8 12c0-2 1.5-4 4-4s4 2 4 4-1.5 4-4 4-4-2-4-4z"/></svg>
            </div>
          <h2 className="text-3xl font-semibold tracking-tight text-[#e5e2e1]">Join the Future of Farming</h2>
          <p className="text-[#bbcabf] mt-2 text-base">Empower your land with precision AI stewardship.</p>
        </div>

        <div className="rounded-xl p-10 flex flex-col gap-6"
          style={{ background: "linear-gradient(135deg,#1A1A1A 0%,#131313 100%)", border: "1px solid #1E293B", boxShadow: "0 20px 40px rgba(0,0,0,0.4)", position: "relative" }}>
          <div className="space-y-1">
            <h1 className="text-xl font-semibold text-[#10B981]">Create Your Account</h1>
            <div className="h-1 w-12 bg-[#10B981] rounded-full" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            {serverError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400">
                {serverError}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#bbcabf] ml-1">Full Name</label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#86948a] group-focus-within:text-[#10B981] transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </span>
                <input {...register("name")} type="text" placeholder="John Doe"
                  className="w-full bg-[#0e0e0e] border border-[#3c4a42] rounded-lg py-3.5 pl-12 pr-4 text-[#e5e2e1] placeholder:text-[#86948a]/50 focus:border-[#10B981] focus:ring-0 outline-none transition-all text-base" />
              </div>
              {errors.name && <p className="text-red-400 text-xs ml-1">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#bbcabf] ml-1">Email Address</label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#86948a] group-focus-within:text-[#10B981] transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </span>
                <input {...register("email")} type="email" placeholder="steward@farm.ai"
                  className="w-full bg-[#0e0e0e] border border-[#3c4a42] rounded-lg py-3.5 pl-12 pr-4 text-[#e5e2e1] placeholder:text-[#86948a]/50 focus:border-[#10B981] focus:ring-0 outline-none transition-all text-base" />
              </div>
              {errors.email && <p className="text-red-400 text-xs ml-1">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#bbcabf] ml-1">Security Password</label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#86948a] group-focus-within:text-[#10B981] transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </span>
                <input {...register("password")} type={showPassword ? "text" : "password"} placeholder="••••••••"
                  className="w-full bg-[#0e0e0e] border border-[#3c4a42] rounded-lg py-3.5 pl-12 pr-12 text-[#e5e2e1] placeholder:text-[#86948a]/50 focus:border-[#10B981] focus:ring-0 outline-none transition-all text-base" />
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

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#bbcabf] ml-1">Farm Location</label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#86948a] group-focus-within:text-[#10B981] transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </span>
                <input {...register("farmLocation")} type="text" placeholder="e.g. Sonoma Valley, CA"
                  className="w-full bg-[#0e0e0e] border border-[#3c4a42] rounded-lg py-3.5 pl-12 pr-4 text-[#e5e2e1] placeholder:text-[#86948a]/50 focus:border-[#10B981] focus:ring-0 outline-none transition-all text-base" />
              </div>
            </div>

            <button type="submit" disabled={isSubmitting}
              className="mt-2 w-full bg-[#10B981] text-[#003824] font-bold py-4 rounded-lg uppercase tracking-widest hover:bg-[#0ea471] active:scale-[0.98] transition-all disabled:opacity-60"
              style={{ boxShadow: "0 0 20px rgba(16,185,129,0.3)" }}>
              {isSubmitting ? "Creating Account…" : "Create Account"}
            </button>
          </form>


        </div>

        <footer className="mt-8 text-center">
          <p className="text-base text-[#bbcabf]">
            Already have an account?{" "}
            <Link href="/signin" className="text-[#10B981] font-bold hover:underline transition-all">Sign In</Link>
          </p>
          <div className="mt-4 flex justify-center gap-6 text-xs text-[#86948a]/60">
            <span className="hover:text-[#bbcabf] cursor-pointer transition-colors">Terms of Service</span>
            <span className="hover:text-[#bbcabf] cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-[#bbcabf] cursor-pointer transition-colors">Security</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
