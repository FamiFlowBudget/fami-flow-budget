// Simplified chart component to avoid TypeScript issues with latest Recharts
// This is a minimal implementation to prevent build errors
import * as React from "react";

export interface ChartConfig {
  [key: string]: {
    label?: string;
    icon?: React.ComponentType;
  } & ({ color?: string } | { theme: Record<string, string> });
}

export interface ChartContainerProps
  extends React.ComponentProps<"div"> {
  config: ChartConfig;
  children: React.ComponentProps<typeof ResponsiveContainer>["children"];
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  ChartContainerProps
>(({ config, children, className, ...props }, ref) => {
  return (
    <div ref={ref} className={className} {...props}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
});
ChartContainer.displayName = "ChartContainer";

const ChartTooltip = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`rounded-lg border bg-background p-2 shadow-md ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});
ChartTooltip.displayName = "ChartTooltip";

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, children, ...props }, ref) => {
  return (
    <div ref={ref} className={`grid gap-2 ${className}`} {...props}>
      {children}
    </div>
  );
});
ChartTooltipContent.displayName = "ChartTooltipContent";

// Import ResponsiveContainer from recharts
import { ResponsiveContainer } from "recharts";

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
};