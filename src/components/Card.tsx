import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export default function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-[#11151C]/70 p-5 shadow-[0_18px_60px_-30px_rgba(0,0,0,0.9)] sm:p-6 ${className}`.trim()}>
      {children}
    </div>
  );
}
