import { useState, useEffect, useCallback } from "react";
import { Inbox as InboxIcon, Check, X, Users, Clock } from "lucide-react";
import { getInvitations, acceptInvitation, declineInvitation } from "../api/workspaces";
import { useWorkspaces } from "../context/WorkspacesContext";

const InboxPage = () => {
    const [invitations, setInvitations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const { refresh } = useWorkspaces();

    const fetchInvitations = useCallback(async () => {
        try {
            const { data } = await getInvitations();
            setInvitations(data);
        } catch (err) {
            console.error("Failed to fetch invitations", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInvitations();
        // Poll every 10 seconds for new invitations
        const interval = setInterval(fetchInvitations, 10000);
        return () => clearInterval(interval);
    }, [fetchInvitations]);

    const handleAccept = async (id) => {
        setActionLoading(id);
        try {
            await acceptInvitation(id);
            setInvitations((prev) => prev.filter((inv) => inv.id !== id));
            // Refresh workspaces so the new workspace appears in sidebar
            await refresh();
        } catch (err) {
            console.error("Failed to accept invitation", err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDecline = async (id) => {
        setActionLoading(id);
        try {
            await declineInvitation(id);
            setInvitations((prev) => prev.filter((inv) => inv.id !== id));
        } catch (err) {
            console.error("Failed to decline invitation", err);
        } finally {
            setActionLoading(null);
        }
    };

    const timeAgo = (isoStr) => {
        if (!isoStr) return "";
        const diff = Date.now() - new Date(isoStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return "Just now";
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    return (
        <div className="max-w-2xl mx-auto px-6 py-12 animate-fade-in">
            <div className="flex items-center gap-3 mb-8">
                <InboxIcon size={24} className="text-primary" />
                <h1 className="text-2xl font-bold text-foreground">Inbox</h1>
                {invitations.length > 0 && (
                    <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                        {invitations.length}
                    </span>
                )}
            </div>

            {loading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
            ) : invitations.length === 0 ? (
                <div className="text-center py-16">
                    <InboxIcon size={48} className="text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground text-sm">No pending invitations</p>
                    <p className="text-muted-foreground/60 text-xs mt-1">
                        When someone invites you to a workspace, it will show up here.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {invitations.map((inv) => (
                        <div
                            key={inv.id}
                            className="flex items-center gap-4 p-4 rounded-xl bg-surface-800 border border-border animate-fade-in"
                        >
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <Users size={20} className="text-primary" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground">
                                    Invitation to <span className="text-primary">{inv.workspace_name}</span>
                                </p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                    <span>From {inv.invited_by}</span>
                                    <span>·</span>
                                    <Clock size={10} />
                                    <span>{timeAgo(inv.created_at)}</span>
                                </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    onClick={() => handleAccept(inv.id)}
                                    disabled={actionLoading === inv.id}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                                >
                                    <Check size={14} />
                                    Accept
                                </button>
                                <button
                                    onClick={() => handleDecline(inv.id)}
                                    disabled={actionLoading === inv.id}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors disabled:opacity-50"
                                >
                                    <X size={14} />
                                    Decline
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default InboxPage;
