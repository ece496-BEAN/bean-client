"use client";

import React, { FormEvent, useContext, useState } from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { JwtContext } from "@/app/lib/jwt-provider";
import { fetchApiSingle, jwtObtainPairEndpoint } from "@/app/lib/api";
import { useRouter } from "next/navigation";

export function LoginPage() {
  const router = useRouter();

  const context = useContext(JwtContext);
  if (!context) {
    throw new Error("JwtContext must be used within a JwtProvider");
  }
  const [jwt, setAndStoreJwt] = context;

  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      const response = await fetchApiSingle(jwtObtainPairEndpoint, "POST", {
        email,
        password,
      });
      const data = await response.json();
      if (response.ok) {
        setAndStoreJwt(data);
        router.push("/");
      } else {
        setError(data.detail);
      }
    } catch (err) {
      setError("An unexpected error occurred: " + err);
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="bg-black text-white p-4">
        <h1 className="text-2xl font-bold">Login</h1>
      </header>

      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <form
            onSubmit={handleLogin}
            className="bg-white shadow-md rounded-lg p-8 space-y-6"
          >
            {error && (
              <p className="text-red-500 text-xs font-bold mb-4">{error}</p>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full">
              Log In
            </Button>
          </form>
          <div className="text-center space-y-2">
            <a href="#" className="text-sm text-primary hover:underline">
              Forgot password?
            </a>
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <a href="#" className="text-primary hover:underline">
                Sign up
              </a>
            </p>
          </div>
        </div>
      </main>

      <footer className="bg-white p-4 text-center text-sm text-gray-600">
        © 2025 Budget App. All rights reserved.
      </footer>
    </div>
  );
}
