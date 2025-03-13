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
import { Check, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { signIn, signUp, getProfile, resetPassword, updatePassword, checkExistingEmail } from "@/lib/supabase";
import { toast } from "sonner";
import RecoveryHandler from "./RecoveryHandler";

type TabType = "login" | "register" | "forgot-password" | "update-password";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: { email: string; name: string; id: string; promptCount: number }) => void;
  activeTab?: TabType;
  setActiveTab?: (tab: TabType) => void;
}

const AuthModal = ({
  isOpen,
  onClose,
  onLogin,
  activeTab: propActiveTab,
  setActiveTab: propSetActiveTab,
}: AuthModalProps) => {
  const [localActiveTab, setLocalActiveTab] = useState<TabType>("register");
  const activeTab = propActiveTab || localActiveTab;
  const setActiveTab = propSetActiveTab || setLocalActiveTab;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Update isSignUp whenever activeTab changes
  useEffect(() => {
    setIsSignUp(activeTab === "register");
  }, [activeTab]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await resetPassword(email);
      
      if (error) {
        toast.error("Failed to send reset email", {
          description: error.message,
          descriptionClassName: "text-gray-500"
        });
      } else {
        toast.success("Reset email sent", {
          description: "Please check your email for the password reset link",
          descriptionClassName: "text-gray-500"
        });
        setActiveTab("login");
      }
    } catch (error: any) {
      toast.error("An error occurred", {
        description: "Please try again later",
        descriptionClassName: "text-gray-500"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (activeTab === "register") {
        if (password.length < 8) {
          toast.error("Password too short", {
            description: "Password must be at least 8 characters long",
            descriptionClassName: "text-gray-500"
          });
          setIsLoading(false);
          return;
        }

        // Check if email already exists
        const { exists } = await checkExistingEmail(email);
        if (exists) {
          toast.error("Email already registered", {
            description: "Please try logging in instead",
            descriptionClassName: "text-gray-500"
          });
          setIsLoading(false);
          return;
        }

        const { data: signUpData, error: signUpError } = await signUp(email, password, name);
        
        if (signUpError) {
          toast.error("Registration failed", {
            description: signUpError.message,
            descriptionClassName: "text-gray-500"
          });
          setIsLoading(false);
          return;
        }

        toast.success("Registration successful", {
          description: "Please check your email to verify your account",
          descriptionClassName: "text-gray-500"
        });
        setPassword("");
        setActiveTab("login");
      } else if (activeTab === "update-password") {
        try {
          if (password.length < 8) {
            toast.error("Password too short", {
              description: "Password must be at least 8 characters long",
              descriptionClassName: "text-gray-500"
            });
            setIsLoading(false);
            return;
          }

          if (password !== confirmPassword) {
            toast.error("Passwords don't match", {
              description: "Please make sure both passwords are the same",
              descriptionClassName: "text-gray-500"
            });
            setIsLoading(false);
            return;
          }

          const { data, error } = await updatePassword(password);
          
          if (error) {
            console.error('Password update error:', error);
            let errorMessage = "Please try again later";
            
            if (error.message.includes("Token has expired") || error.message.includes("Invalid token")) {
              errorMessage = "This reset link has expired or already been used. Please request a new password reset link.";
              // Switch back to forgot-password tab if link is expired/used
              setActiveTab("forgot-password");
            }
            
            toast.error("Failed to update password", {
              description: errorMessage,
              descriptionClassName: "text-gray-500"
            });
            setIsLoading(false);
            return;
          }

          if (!data?.user) {
            toast.error("Failed to update password", {
              description: "No user data received",
              descriptionClassName: "text-gray-500"
            });
            setIsLoading(false);
            return;
          }

          toast.success("Password updated", {
            description: "You can now login with your new password",
            descriptionClassName: "text-gray-500"
          });
          
          // Reset form and switch to login tab
          setPassword("");
          setConfirmPassword("");
          setActiveTab("login");
        } catch (error: any) {
          console.error('Password update exception:', error);
          toast.error("An error occurred", {
            description: error.message || "Please try again later",
            descriptionClassName: "text-gray-500"
          });
          setIsLoading(false);
          return;
        }
      } else {
        const { data: signInData, error: signInError } = await signIn(email, password);
        
        if (signInError) {
          if (signInError.message.includes("Invalid login credentials")) {
            toast.error("Invalid email or password", {
              description: "Please check your credentials and try again",
              descriptionClassName: "text-gray-500"
            });
          } else {
            toast.error("Login failed", {
              description: signInError.message,
              descriptionClassName: "text-gray-500"
            });
          }
          setIsLoading(false);
          return;
        }

        if (!signInData?.user) {
          toast.error("Login failed", {
            description: "No user data received",
            descriptionClassName: "text-gray-500"
          });
          setIsLoading(false);
          return;
        }

        // Get user profile
        const { data: profile, error: profileError } = await getProfile(signInData.user.id);
        
        if (profileError) {
          toast.error("Error", {
            description: "Failed to load user profile",
            descriptionClassName: "text-gray-500"
          });
          setIsLoading(false);
          return;
        }

        toast.success("Welcome back!", {
          description: "Successfully logged in",
          descriptionClassName: "text-black/80"
        });
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
        description: "Please try again later",
        descriptionClassName: "text-gray-500"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal={true}>
      <DialogContent className="sm:max-w-[425px] bg-white border-[#eaeaea] text-black">
        <RecoveryHandler setActiveTab={setActiveTab} />
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-black">
            {activeTab === "update-password" ? "Update Password" : "MetaMind"}
          </DialogTitle>
          <DialogDescription className="text-center text-black">
            {activeTab === "update-password" 
              ? "Please enter your new password" 
              : "Join the community of AI prompt engineers"}
          </DialogDescription>
        </DialogHeader>

        <Tabs
          defaultValue="register"
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as TabType)}
        >
          {activeTab !== "update-password" && (
          <TabsList className="grid w-full grid-cols-2 bg-[#f5f5f5]">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          )}

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
                <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-black">
                  Password
                </Label>
                  <button
                    type="button"
                    onClick={() => setActiveTab("forgot-password")}
                    className="text-sm text-gray-500 hover:text-black transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                <Input
                  id="password"
                    type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                    className="bg-white border-[#eaeaea] text-black pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
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
                <div className="relative">
                <Input
                  id="password"
                    type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                    className="bg-white border-[#eaeaea] text-black pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
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

          <TabsContent value="forgot-password">
            <div className="flex items-center gap-2 mb-4">
              <button
                type="button"
                onClick={() => setActiveTab("login")}
                className="text-gray-500 hover:text-black transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <h3 className="text-lg font-semibold">Reset Password</h3>
            </div>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email" className="text-black">
                  Email
                </Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  "Send Reset Link"
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="update-password">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-lg font-semibold">Update Password</h3>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-black">
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-white border-[#eaeaea] text-black pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-black">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="bg-white border-[#eaeaea] text-black pr-10"
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-black hover:bg-black/90 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                ) : (
                  "Update Password"
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
