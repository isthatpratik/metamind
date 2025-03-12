"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SquareCheck } from "lucide-react";

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PremiumModal = ({ isOpen, onClose }: PremiumModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal={true}>
      <DialogContent className="max-w-xl bg-white border-[#eaeaea] text-black">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
            <span className="text-black font-bold">MetaMind Premium</span>
          </DialogTitle>
          <DialogDescription className="text-center text-black">
            Unlock unlimited prompts and advanced features
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          <div className="bg-[#f5f5f5] p-4 border rounded-lg border-[#eaeaea]">
            <h3 className="font-medium mb-2">Free Plan</h3>
            <p className="text-2xl font-bold mb-4">$0</p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <SquareCheck className="w-5 h-5 text-black" />
                <span>5 prompts per month</span>
              </li>
              <li className="flex items-center gap-2">
                <SquareCheck className="w-5 h-5 text-black" />
                <span>Basic tool instructions</span>
              </li>
              <li className="flex items-center gap-2">
                <SquareCheck className="w-5 h-5 text-black" />
                <span>Standard response time</span>
              </li>
            </ul>
          </div>

          <div className="bg-[#f5f5f5] p-4 border rounded-lg border-[#eaeaea] relative overflow-hidden">
            <div className="absolute top-0 rounded-bl-lg right-0 bg-black text-white text-xs px-2 py-1">
              RECOMMENDED
            </div>
            <h3 className="font-medium mb-2">Premium</h3>
            <p className="text-2xl font-bold mb-4">
              $9.99<span className="text-sm font-normal">/month</span>
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <SquareCheck className="w-5 h-5 text-black" />
                <span>Unlimited prompts</span>
              </li>
              <li className="flex items-center gap-2">
                <SquareCheck className="w-5 h-5 text-black" />
                <span>Advanced tool instructions</span>
              </li>
              <li className="flex items-center gap-2">
                <SquareCheck className="w-5 h-5 text-black" />
                <span>Priority response time</span>
              </li>
              <li className="flex items-center gap-2">
                <SquareCheck className="w-5 h-5 text-black" />
                <span>Save & organize prompts</span>
              </li>
              <li className="flex items-center gap-2">
                <SquareCheck className="w-5 h-5 text-black" />
                <span>Export to markdown/PDF</span>
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter className="lg:justify-center">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto bg-white rounded-lg text-black hover:bg-[#f5f5f5] hover:text-black border border-[#eaeaea]"
          >
            Maybe Later
          </Button>
          <Button className="w-full sm:w-auto bg-black hover:bg-black/90 text-white rounded-lg">
            Upgrade Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PremiumModal;
