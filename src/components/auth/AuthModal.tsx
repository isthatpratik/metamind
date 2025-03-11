"use client";

import { useState } from "react";
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
import { useToast } from "@/components/ui/use-toast";
import { Check } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: { email: string; name: string }) => void;
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
  const [localActiveTab, setLocalActiveTab] = useState<"login" | "register">(
    "register",
  );

  const activeTab = propActiveTab || localActiveTab;
  const setActiveTab = propSetActiveTab || setLocalActiveTab;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simulate authentication delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // For demo purposes, just simulate successful auth
      if (
        email &&
        (activeTab === "login" || (activeTab === "register" && name))
      ) {
        toast({
          title:
            activeTab === "login"
              ? "Logged in successfully"
              : "Registered successfully",
          description: "Welcome to MetaMind Prompt Generator!",
          duration: 3000,
        });

        onLogin({ email, name: name || email.split("@")[0] });
        onClose();
      } else {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch (error) {
      toast({
        title: "Authentication failed",
        description: "Please try again later",
        variant: "destructive",
        duration: 3000,
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
                  className={`w-5 h-5 border rounded-sm ${rememberMe ? "bg-black" : "bg-white"} border-[#eaeaea] flex items-center justify-center cursor-pointer`}
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
