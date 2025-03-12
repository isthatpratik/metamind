"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check } from "lucide-react";
import { signIn, signUp, getProfile } from "@/lib/supabase";
import { toast } from "sonner";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: { email: string; name: string; id: string; promptCount: number }) => void;
  activeTab?: "login" | "register";
  setActiveTab?: (tab: "login" | "register") => void;
}

const AuthModal = ({
  isOpen,
  onClose,
  onLogin,
  activeTab: propActiveTab,
  setActiveTab: propSetActiveTab,
}: AuthModalProps) => {
  const [localActiveTab, setLocalActiveTab] = useState<"login" | "register">("register");
  const activeTab = propActiveTab || localActiveTab;
  const setActiveTab = propSetActiveTab || setLocalActiveTab;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  // Update isSignUp whenever activeTab changes
  useEffect(() => {
    setIsSignUp(activeTab === "register");
  }, [activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (activeTab === "register") {
        if (password.length < 6) {
          toast.error("Password must be at least 6 characters long");
          setIsLoading(false);
          return;
        }

        const { data: signUpData, error: signUpError } = await signUp(email, password, name);
        
        if (signUpError) {
          if (signUpError.message.includes("already registered")) {
            toast.error("Email already registered", {
              description: "Please try logging in instead"
            });
          } else {
            toast.error("Registration failed", {
              description: signUpError.message
            });
          }
          setIsLoading(false);
          return;
        }

        toast.success("Registration successful", {
          description: "Please check your email to verify your account"
        });
        setPassword("");
        setActiveTab("login");
      } else {
        const { data: signInData, error: signInError } = await signIn(email, password);
        
        if (signInError) {
          if (signInError.message.includes("Invalid login credentials")) {
            toast.error("Invalid email or password", {
              description: "Please check your credentials and try again"
            });
          } else {
            toast.error("Login failed", {
              description: signInError.message
            });
          }
          setIsLoading(false);
          return;
        }

        if (!signInData?.user) {
          toast.error("Login failed", {
            description: "No user data received"
          });
          setIsLoading(false);
          return;
        }

        // Get user profile
        const { data: profile, error: profileError } = await getProfile(signInData.user.id);
        
        if (profileError) {
          toast.error("Error", {
            description: "Failed to load user profile"
          });
          setIsLoading(false);
          return;
        }

        toast.success("Welcome back!");
        onLogin({
          id: signInData.user.id,
          email: signInData.user.email || "",
          name: profile?.name || signInData.user.email?.split("@")[0] || "",
          promptCount: profile?.prompt_count || 0
        });
        onClose();
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      toast.error("An error occurred", {
        description: "Please try again later"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal={true}>
      <DialogContent className="sm:max-w-[425px] bg-white border-[#eaeaea] text-black">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-black">
            MetaMind
          </DialogTitle>
          <DialogDescription className="text-center text-black">
            Join the community of AI prompt engineers
          </DialogDescription>
        </DialogHeader>

        <Tabs
          defaultValue="register"
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "login" | "register")}
        >
          <TabsList className="grid w-full grid-cols-2 bg-[#f5f5f5]">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-black">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white border-[#eaeaea] text-black"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-black">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-white border-[#eaeaea] text-black"
                />
              </div>
              <div className="flex items-center space-x-2">
                <div
                  className={`w-5 h-5 border rounded-sm ${
                    rememberMe ? "bg-black" : "bg-white"
                  } border-[#eaeaea] flex items-center justify-center cursor-pointer`}
                  onClick={() => setRememberMe(!rememberMe)}
                >
                  {rememberMe && <Check className="h-4 w-4 text-white" />}
                </div>
                <Label
                  htmlFor="remember"
                  className="text-sm cursor-pointer"
                  onClick={() => setRememberMe(!rememberMe)}
                >
                  Remember me
                </Label>
              </div>
              <Button
                type="submit"
                className="w-full bg-black hover:bg-black/90 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                ) : (
                  "Login"
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register">
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-black">
                  Username
                </Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="bg-white border-[#eaeaea] text-black"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-black">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white border-[#eaeaea] text-black"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-black">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-white border-[#eaeaea] text-black"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-black hover:bg-black/90 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
