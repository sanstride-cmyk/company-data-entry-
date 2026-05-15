import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Files, 
  UploadCloud, 
  ClipboardCheck, 
  GitMerge, 
  Building2, 
  DownloadCloud, 
  History 
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/documents", label: "Documents", icon: Files },
  { href: "/upload", label: "Upload", icon: UploadCloud },
  { href: "/review", label: "Review Queue", icon: ClipboardCheck },
  { href: "/workflows", label: "Workflows", icon: GitMerge },
  { href: "/vendors", label: "Vendors", icon: Building2 },
  { href: "/exports", label: "Exports", icon: DownloadCloud },
  { href: "/audit", label: "Audit Log", icon: History },
];

export function SidebarNav() {
  const [location] = useLocation();

  return (
    <nav className="flex-1 space-y-1 p-4">
      {navItems.map((item) => {
        const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
        return (
          <Link key={item.href} href={item.href} className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            isActive 
              ? "bg-primary text-primary-foreground" 
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}>
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
