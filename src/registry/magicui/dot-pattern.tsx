import { cn } from "@/lib/utils";

export const DotPattern = ({
  className,
  glow,
}: {
  className?: string;
  glow?: boolean;
}) => {
  return (
    <div
      className={cn(
        "absolute inset-0 flex items-center justify-center",
        className,
      )}
    >
      <div
        className={cn(
          "h-full w-full",
          glow &&
            "bg-[radial-gradient(#6b7280_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]",
          !glow &&
            "bg-[radial-gradient(#6b7280_1px,transparent_1px)] [background-size:16px_16px]",
        )}
      />
    </div>
  );
}; 