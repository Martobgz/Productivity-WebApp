import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { useWorkspaces } from "../context/WorkspacesContext";
import { getInvitations } from "../api/workspaces";
import {
    User, Search, Home, Calendar, Inbox, Settings, Trash2, LogOut, ChevronLeft, ChevronRight,
    FileText, Users, Star
} from "lucide-react";
import LogoMark from "./LogoMark";

const navItems = [
    { icon: Home, label: "Homepage", path: "/dashboard" },
    { icon: Search, label: "Search", path: "/dashboard/search" },
    { icon: Calendar, label: "Calendar", path: "/dashboard/calendar" },
    { icon: Inbox, label: "Inbox", path: "/dashboard/inbox" },
    { icon: Settings, label: "Settings", path: "/dashboard/settings" },
    { icon: Trash2, label: "Trash", path: "/dashboard/trash" },
];

const AppSidebar = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [inviteCount, setInviteCount] = useState(0);
    const { user, logout } = useAuth();
    const { workspaces } = useWorkspaces();
    const navigate = useNavigate();
    const location = useLocation();

    // Poll for invitation count
    useEffect(() => {
        const fetchCount = async () => {
            try {
                const { data } = await getInvitations();
                setInviteCount(data.length);
            } catch { /* ignore */ }
        };
        fetchCount();
        const interval = setInterval(fetchCount, 15000);
        return () => clearInterval(interval);
    }, []);

    return (
        <aside
            className={`flex flex-col h-full border-r border-border bg-sidebar transition-all duration-200 ${collapsed ? "w-16" : "w-60"
                }`}
        >
            {/* Logo + collapse */}
            <div className="flex items-center justify-between p-3 border-b border-border">
                {!collapsed && (
                    <div className="flex items-center gap-2">
                        <LogoMark size={28} />
                        <span className="text-sm font-semibold text-foreground">TaskFlow</span>
                    </div>
                )}
                <button
                    onClick={() => setCollapsed((v) => !v)}
                    className="p-1.5 rounded-md hover:bg-accent text-muted-foreground transition-colors"
                >
                    {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>
            </div>

            {/* Profile */}
            <div
                onClick={() => navigate("/dashboard/profile")}
                className={`flex items-center gap-3 p-3 border-b border-border cursor-pointer hover:bg-accent/50 transition-colors ${collapsed ? "justify-center" : ""}`}
            >
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
                    <User size={16} />
                </div>
                {!collapsed && (
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{user?.displayName || "User"}</p>
                        <p className="text-[10px] text-muted-foreground truncate uppercase font-semibold">View Profile</p>
                    </div>
                )}
            </div>

            {/* Nav */}
            <nav className="flex-1 p-2 space-y-6 overflow-y-auto">
                <div className="space-y-1">
                    {navItems.map((item) => {
                        const active = location.pathname === item.path;
                        const showBadge = item.label === "Inbox" && inviteCount > 0;
                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${active
                                    ? "bg-primary/15 text-primary font-medium"
                                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                    } ${collapsed ? "justify-center" : ""}`}
                            >
                                <div className="relative">
                                    <item.icon size={18} />
                                    {showBadge && collapsed && (
                                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-destructive text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                                            {inviteCount}
                                        </span>
                                    )}
                                </div>
                                {!collapsed && (
                                    <span className="flex-1 text-left">{item.label}</span>
                                )}
                                {!collapsed && showBadge && (
                                    <span className="bg-destructive text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                        {inviteCount}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Favorites Section */}
                {workspaces.some(ws => ws.is_favorite) && (
                    <div className="space-y-1">
                        {!collapsed && (
                            <div className="flex items-center gap-2 px-3 mb-2">
                                <Star size={10} className="text-primary fill-primary" />
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                    Favorites
                                </p>
                            </div>
                        )}
                        {workspaces.filter(ws => ws.is_favorite).map((ws) => {
                            const active = location.pathname === `/dashboard/workspace/${ws.id}`;
                            return (
                                <button
                                    key={`fav-${ws.id}`}
                                    onClick={() => navigate(`/dashboard/workspace/${ws.id}`)}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${active
                                        ? "bg-primary/10 text-primary font-medium"
                                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                        } ${collapsed ? "justify-center" : ""}`}
                                >
                                    <Star size={18} className={ws.is_favorite ? "text-primary fill-primary" : ""} />
                                    {!collapsed && <span className="truncate">{ws.name || "Untitled"}</span>}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Workspaces Section */}
                <div className="space-y-1">
                    {!collapsed && (
                        <p className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                            Workspaces
                        </p>
                    )}
                    {workspaces.map((ws) => {
                        const active = location.pathname === `/dashboard/workspace/${ws.id}`;
                        const Icon = ws.type === "shared" ? Users : FileText;
                        return (
                            <button
                                key={ws.id}
                                onClick={() => navigate(`/dashboard/workspace/${ws.id}`)}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${active
                                    ? "bg-primary/15 text-primary font-medium"
                                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                    } ${collapsed ? "justify-center" : ""}`}
                            >
                                <Icon size={18} />
                                {!collapsed && <span className="truncate">{ws.name || "Untitled"}</span>}
                            </button>
                        );
                    })}
                </div>
            </nav>

            {/* Logout */}
            <div className="p-2 border-t border-border">
                <button
                    onClick={() => { logout(); navigate("/login"); }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors ${collapsed ? "justify-center" : ""}`}
                >
                    <LogOut size={18} />
                    {!collapsed && <span>Log out</span>}
                </button>
            </div>
        </aside>
    );
};

export default AppSidebar;
