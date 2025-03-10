"use client";

import React, { useState, useContext, FormEvent } from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useJwt } from "@/app/lib/jwt-provider";
import { fetchApiSingle, jwtObtainPairEndpoint } from "@/app/lib/api";
import { useRouter } from "next/navigation";

export function LoginPage() {
  const router = useRouter();

  const [setAndStoreJwt] = useJwt();

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
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white p-4">
        <h1 className="text-2xl font-bold">Login</h1>
      </header>

      <main className="flex-grow p-4 flex items-center justify-center">
        <Card className="w-full max-w-md bg-white shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold text-center">
              Welcome to BEAN
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
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
                <div className="flex justify-between items-center">
                  <Label htmlFor="password">Password</Label>
                  <a
                    href="#"
                    className="text-sm text-indigo-600 hover:underline"
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
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
              <div className="flex items-center space-x-2">
                <Checkbox id="remember" />
                <Label htmlFor="remember" className="text-sm font-normal">
                  Remember me
                </Label>
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                Log In
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <button
                onClick={() => router.push("/signup")}
                className="text-indigo-600 hover:underline"
              >
                Sign up
              </button>
            </p>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
