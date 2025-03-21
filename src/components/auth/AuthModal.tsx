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
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

type TabType = "login" | "register" | "forgot-password" | "update-password";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: { email: string; name: string; id: string; promptCount: number }) => void;
  activeTab?: TabType;
  setActiveTab?: (tab: TabType) => void;
}

// Validation schemas
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const updatePasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters long"),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters long"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;
type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>;

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
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form hooks
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: "onBlur",
  });

  const forgotPasswordForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onBlur",
  });

  const updatePasswordForm = useForm<UpdatePasswordFormData>({
    resolver: zodResolver(updatePasswordSchema),
    mode: "onBlur",
  });

  // Update isSignUp whenever activeTab changes
  useEffect(() => {
    setIsSignUp(activeTab === "register");
  }, [activeTab]);

  const handleForgotPassword = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);

    try {
      const { error } = await resetPassword(data.email);
      
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

  const handleSubmit = async (data: LoginFormData | RegisterFormData | UpdatePasswordFormData) => {
    setIsLoading(true);

    try {
      if (activeTab === "register") {
        const registerData = data as RegisterFormData;
        
        // Check if email already exists
        const { exists } = await checkExistingEmail(registerData.email);
        if (exists) {
          toast.error("Email already registered", {
            description: "Please try logging in instead",
            descriptionClassName: "text-gray-500"
          });
          setIsLoading(false);
          return;
        }

        const { data: signUpData, error: signUpError } = await signUp(
          registerData.email,
          registerData.password,
          registerData.name
        );
        
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
        setActiveTab("login");
      } else if (activeTab === "update-password") {
        const updateData = data as UpdatePasswordFormData;
        
        const { data: updateResult, error } = await updatePassword(updateData.password);
        
        if (error) {
          console.error('Password update error:', error);
          let errorMessage = "Please try again later";
          
          if (error.message.includes("Token has expired") || error.message.includes("Invalid token")) {
            errorMessage = "This reset link has expired or already been used. Please request a new password reset link.";
            setActiveTab("forgot-password");
          }
          
          toast.error("Failed to update password", {
            description: errorMessage,
            descriptionClassName: "text-gray-500"
          });
          setIsLoading(false);
          return;
        }

        if (!updateResult?.user) {
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
        
        setActiveTab("login");
      } else {
        const loginData = data as LoginFormData;
        const { data: signInData, error: signInError } = await signIn(
          loginData.email,
          loginData.password
        );
        
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
          descriptionClassName: "text-gray-500"
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
      <DialogContent className="sm:max-w-[425px] bg-white text-black">
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
          {activeTab !== 'update-password' && activeTab !== 'forgot-password' && (
            <TabsList className="grid w-full grid-cols-2 bg-[#f5f5f5]">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
          )}

          <TabsContent value="login">
            <form onSubmit={loginForm.handleSubmit(handleSubmit)} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-black">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  {...loginForm.register("email")}
                  className="bg-white border-[#eaeaea] text-black"
                />
                {loginForm.formState.errors.email && (
                  <p className="text-sm text-red-500">{loginForm.formState.errors.email.message}</p>
                )}
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
                    {...loginForm.register("password")}
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
                {loginForm.formState.errors.password && (
                  <p className="text-sm text-red-500">{loginForm.formState.errors.password.message}</p>
                )}
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
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="h-5 w-5 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
                ) : (
                  "Login"
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register">
            <form onSubmit={registerForm.handleSubmit(handleSubmit)} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-black">
                  Username
                </Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  {...registerForm.register("name")}
                  className="bg-white border-[#eaeaea] text-black"
                />
                {registerForm.formState.errors.name && (
                  <p className="text-sm text-red-500">{registerForm.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-black">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  {...registerForm.register("email")}
                  className="bg-white border-[#eaeaea] text-black"
                />
                {registerForm.formState.errors.email && (
                  <p className="text-sm text-red-500">{registerForm.formState.errors.email.message}</p>
                )}
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
                    {...registerForm.register("password")}
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
                {registerForm.formState.errors.password && (
                  <p className="text-sm text-red-500">{registerForm.formState.errors.password.message}</p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="h-5 w-5 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
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
            <form onSubmit={forgotPasswordForm.handleSubmit(handleForgotPassword)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email" className="text-black">
                  Email
                </Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="you@example.com"
                  {...forgotPasswordForm.register("email")}
                  className="bg-white border-[#eaeaea] text-black"
                />
                {forgotPasswordForm.formState.errors.email && (
                  <p className="text-sm text-red-500">{forgotPasswordForm.formState.errors.email.message}</p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="h-5 w-5 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
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
            <form onSubmit={updatePasswordForm.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-black">
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    {...updatePasswordForm.register("password")}
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
                {updatePasswordForm.formState.errors.password && (
                  <p className="text-sm text-red-500">{updatePasswordForm.formState.errors.password.message}</p>
                )}
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
                    {...updatePasswordForm.register("confirmPassword")}
                    className="bg-white border-[#eaeaea] text-black pr-10"
                  />
                </div>
                {updatePasswordForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-red-500">{updatePasswordForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full bg-white/70 dark:bg-white/70 text-black hover:bg-white/80"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="h-5 w-5 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
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