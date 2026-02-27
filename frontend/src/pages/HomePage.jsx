import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { useWorkspaces } from "../context/WorkspacesContext";
import { getEvents } from "../api/calendar";
import { Plus, Calendar, Lock, Users, X, Loader2, ChevronRight } from "lucide-react";

const HomePage = () => {
    const { user } = useAuth();
    const { workspaces: activeWorkspaces, create } = useWorkspaces();
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);
    const [events, setEvents] = useState([]);
    const [loadingEvents, setLoadingEvents] = useState(true);

    const rawName = user?.displayName || user?.email?.split("@")[0] || "";
    const firstName = rawName
        ? rawName.charAt(0).toUpperCase() + rawName.slice(1)
        : "there";

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const { data } = await getEvents();
                // Sort by start time and take top 5
                const sorted = data
                    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
                    // Filter out past events if desired, but for now just show upcoming
                    .filter(ev => new Date(ev.start_time) >= new Date(new Date().setHours(0, 0, 0, 0)))
                    .slice(0, 5);
                setEvents(sorted);
            } catch (err) {
                console.error("Failed to fetch calendar events:", err);
            } finally {
                setLoadingEvents(false);
            }
        };
        fetchEvents();
    }, []);

    const handleCreate = (type) => {
        const id = create("Untitled Workspace", type);
        setShowModal(false);
        navigate(`/dashboard/workspace/${id}`);
    };

    const formatEventDate = (isoString) => {
        const date = new Date(isoString);
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);

        const isToday = date.toDateString() === today.toDateString();
        const isTomorrow = date.toDateString() === tomorrow.toDateString();

        const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        if (isToday) return `Today, ${time}`;
        if (isTomorrow) return `Tomorrow, ${time}`;
        return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${time}`;
    };

    return (
        <div className="flex flex-col items-center px-6 py-16 animate-fade-in">
            {/* Greeting */}
            <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight text-center">
                Good to see you, <span className="text-primary">{firstName}</span>
            </h1>
            <p className="mt-3 text-muted-foreground text-center max-w-md">
                Here's what's on your schedule. Ready to get productive?
            </p>

            {/* Calendar widget */}
            <div className="mt-10 w-full max-w-lg card-gradient p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Calendar size={20} className="text-primary" />
                        <h2 className="text-lg font-semibold text-foreground">Upcoming Events</h2>
                    </div>
                    <button
                        onClick={() => navigate("/dashboard/calendar")}
                        className="text-xs text-primary hover:underline flex items-center gap-0.5"
                    >
                        View Calendar <ChevronRight size={12} />
                    </button>
                </div>

                <div className="space-y-3">
                    {loadingEvents ? (
                        <div className="flex flex-col items-center justify-center py-8 gap-3 text-muted-foreground">
                            <Loader2 size={24} className="animate-spin text-primary/40" />
                            <p className="text-xs">Fetching your schedule...</p>
                        </div>
                    ) : events.length > 0 ? (
                        events.map((ev) => (
                            <div
                                key={ev.id}
                                onClick={() => navigate("/dashboard/calendar")}
                                className="flex items-center gap-3 p-3 rounded-lg bg-surface-700/50 hover:bg-surface-600/50 cursor-pointer transition-colors border border-transparent hover:border-primary/20"
                            >
                                <div
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: ev.color || "var(--primary)" }}
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">{ev.title}</p>
                                    <p className="text-xs text-muted-foreground">{formatEventDate(ev.start_time)}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 rounded-lg border border-dashed border-border text-muted-foreground">
                            <p className="text-sm italic">No upcoming events found</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create workspace button */}
            <button
                onClick={() => setShowModal(true)}
                className="btn-primary mt-8 max-w-xs flex items-center justify-center gap-2"
            >
                <Plus size={18} /> Create Workspace
            </button>

            {/* Workspaces Grid */}
            <div className="mt-16 w-full max-w-4xl">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-foreground">Your Workspaces</h2>
                    <span className="text-xs text-muted-foreground">{activeWorkspaces.length} workspaces</span>
                </div>

                {activeWorkspaces.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {activeWorkspaces.map((ws) => {
                            const Icon = ws.type === "shared" ? Users : Lock;
                            return (
                                <button
                                    key={ws.id}
                                    onClick={() => navigate(`/dashboard/workspace/${ws.id}`)}
                                    className="flex flex-col gap-4 p-5 rounded-xl border border-border bg-surface-700/30 hover:bg-surface-600/30 hover:border-primary/30 transition-all text-left group"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                            <Icon size={18} />
                                        </div>
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                            {ws.type}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                                            {ws.name || "Untitled Workspace"}
                                        </h3>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Created {new Date(ws.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-dashed border-border text-muted-foreground">
                        <p className="text-sm">No workspaces yet. Create one to get started!</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    onClick={() => setShowModal(false)}>
                    <div className="card-gradient p-8 w-full max-w-sm animate-fade-in" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-foreground">New Workspace</h3>
                            <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <p className="text-sm text-muted-foreground mb-5">Choose your workspace type:</p>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => handleCreate("private")}
                                className="flex flex-col items-center gap-3 p-5 rounded-xl border border-border bg-surface-700/50 hover:bg-surface-600/50 hover:border-primary/30 transition-all"
                            >
                                <Lock size={24} className="text-primary" />
                                <span className="text-sm font-medium text-foreground">Private</span>
                                <span className="text-xs text-muted-foreground text-center">Only you can access</span>
                            </button>
                            <button
                                onClick={() => handleCreate("shared")}
                                className="flex flex-col items-center gap-3 p-5 rounded-xl border border-border bg-surface-700/50 hover:bg-surface-600/50 hover:border-primary/30 transition-all"
                            >
                                <Users size={24} className="text-primary" />
                                <span className="text-sm font-medium text-foreground">Shared</span>
                                <span className="text-xs text-muted-foreground text-center">Collaborate with others</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HomePage;
