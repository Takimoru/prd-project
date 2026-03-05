import * as React from "react"
import { cn } from "../../lib/utils"

export interface TooltipProps {
  children: React.ReactNode
  content: React.ReactNode
  className?: string
}

const TooltipProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>

const Tooltip = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="relative inline-block group">
      {children}
    </div>
  )
}

const TooltipTrigger = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

const TooltipContent = ({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string 
}) => {
  return (
    <div 
      className={cn(
        "absolute z-50 overflow-hidden rounded-md border bg-white px-3 py-1.5 text-sm shadow-md",
        "bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none",
        className
      )}
    >
      {children}
    </div>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
