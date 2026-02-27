import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useWorkspaces } from "../context/WorkspacesContext";
import {
    Plus, CheckSquare, FileText, Share2, Trash2, X, Table, Image as ImageIcon, Star
} from "lucide-react";
import { inviteUser } from "../api/workspaces";
import { uploadImage } from "../api/uploads";

const ShareDialog = ({ ws, onClose }) => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null); // { type: 'success' | 'error', message: string }

    const handleSendInvite = async () => {
        if (!email) return;
        const normalizedEmail = email.trim().toLowerCase();
        setLoading(true);
        setStatus(null);
        try {
            await inviteUser(ws.id, normalizedEmail);
            setStatus({ type: "success", message: `Invite sent to ${normalizedEmail}!` });
            setEmail("");
        } catch (err) {
            setStatus({ type: "error", message: err.response?.data?.detail || "Failed to send invite." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={onClose}>
            <div className="card-gradient p-8 w-full max-w-sm animate-fade-in" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-foreground">Share Workspace</h3>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
                </div>

                {status && (
                    <div className={`mb-4 p-3 rounded text-xs ${status.type === 'success' ? 'bg-success/10 text-success border border-success/20' : 'bg-destructive/10 text-destructive border border-destructive/20'}`}>
                        {status.message}
                    </div>
                )}

                <p className="text-sm text-muted-foreground mb-4">Invite collaborators by email:</p>
                <input
                    type="email"
                    placeholder="colleague@example.com"
                    className="input-dark mb-4"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <button
                    className="btn-primary w-full"
                    onClick={handleSendInvite}
                    disabled={loading || !email}
                >
                    {loading ? "Sending..." : "Send Invite"}
                </button>
            </div>
        </div>
    );
};

const FlyoutItem = ({ icon: Icon, label, onClick, destructive }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${destructive
            ? "text-destructive hover:bg-destructive/10"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
    >
        <Icon size={16} />
        <span>{label}</span>
    </button>
);

const WorkspaceEditor = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { workspaces, update, trash, refresh, toggleFavorite } = useWorkspaces();
    const ws = workspaces.find((w) => w.id === id);
    const [showFlyout, setShowFlyout] = useState(false);
    const [showShareDialog, setShowShareDialog] = useState(false);
    const contentRef = useRef(null);
    const fileInputRef = useRef(null);

    // Poll for updates on shared workspaces every 5 seconds
    useEffect(() => {
        if (!ws || ws.type !== "shared") return;
        const interval = setInterval(() => {
            refresh();
        }, 5000);
        return () => clearInterval(interval);
    }, [ws?.type, refresh]);

    // Sync content from backend when it changes remotely
    useEffect(() => {
        if (!ws || !contentRef.current) return;
        // Only update if the editor doesn't have focus (avoid overwriting while typing)
        if (document.activeElement !== contentRef.current && contentRef.current.innerHTML !== ws.content) {
            contentRef.current.innerHTML = ws.content || "";
        }
    }, [ws?.content]);

    if (!ws) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>Workspace not found. <button onClick={() => navigate("/dashboard")} className="text-primary hover:underline">Go home</button></p>
            </div>
        );
    }

    const handleTitleChange = (e) => {
        update(ws.id, { name: e.target.value });
    };

    const handleContentChange = () => {
        if (contentRef.current) {
            update(ws.id, { content: contentRef.current.innerHTML });
        }
    };

    const addTodo = () => {
        const newTodo = { id: crypto.randomUUID(), text: "", done: false };
        update(ws.id, { todos: [...ws.todos, newTodo] });
        setShowFlyout(false);
    };

    const updateTodo = (todoId, data) => {
        update(ws.id, {
            todos: ws.todos.map((t) => (t.id === todoId ? { ...t, ...data } : t)),
        });
    };

    const deleteTodo = (todoId) => {
        update(ws.id, { todos: ws.todos.filter((t) => t.id !== todoId) });
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const { data } = await uploadImage(file);
            if (contentRef.current) {
                const img = `<img src="${data.url}" alt="Uploaded image" style="max-width:100%; height:auto; border-radius:8px; margin:16px 0; display:block;" />`;
                contentRef.current.innerHTML += img;
                handleContentChange();
            }
        } catch (err) {
            console.error("Image upload failed", err);
            alert("Failed to upload image. Please try again.");
        } finally {
            setShowFlyout(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const triggerImageUpload = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const insertMockTable = () => {
        if (contentRef.current) {
            const table = `<table style="width:100%;border-collapse:collapse;margin:16px 0;"><thead><tr><th style="border:1px solid hsl(240 10% 16%);padding:8px 12px;text-align:left;background:hsl(240 14% 15%);color:hsl(215 28% 90%);">Column A</th><th style="border:1px solid hsl(240 10% 16%);padding:8px 12px;text-align:left;background:hsl(240 14% 15%);color:hsl(215 28% 90%);">Column B</th><th style="border:1px solid hsl(240 10% 16%);padding:8px 12px;text-align:left;background:hsl(240 14% 15%);color:hsl(215 28% 90%);">Column C</th></tr></thead><tbody><tr><td style="border:1px solid hsl(240 10% 16%);padding:8px 12px;color:hsl(215 15% 60%);">Data 1</td><td style="border:1px solid hsl(240 10% 16%);padding:8px 12px;color:hsl(215 15% 60%);">Data 2</td><td style="border:1px solid hsl(240 10% 16%);padding:8px 12px;color:hsl(215 15% 60%);">Data 3</td></tr><tr><td style="border:1px solid hsl(240 10% 16%);padding:8px 12px;color:hsl(215 15% 60%);">Data 4</td><td style="border:1px solid hsl(240 10% 16%);padding:8px 12px;color:hsl(215 15% 60%);">Data 5</td><td style="border:1px solid hsl(240 10% 16%);padding:8px 12px;color:hsl(215 15% 60%);">Data 6</td></tr></tbody></table>`;
            contentRef.current.innerHTML += table;
            handleContentChange();
        }
        setShowFlyout(false);
    };

    const handleTrash = () => {
        trash(ws.id);
        navigate("/dashboard");
    };

    return (
        <div className="flex h-full">
            {/* Hidden image upload input */}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
            />
            {/* Flyout trigger */}
            <div className="relative">
                <button
                    onClick={() => setShowFlyout((v) => !v)}
                    className="absolute top-4 left-4 z-30 w-9 h-9 flex items-center justify-center rounded-lg bg-surface-700 border border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-all"
                >
                    <Plus size={18} />
                </button>

                {/* Flyout menu */}
                {showFlyout && (
                    <div className="absolute top-14 left-4 z-30 w-56 card-gradient p-2 shadow-xl animate-fade-in">
                        <FlyoutItem icon={CheckSquare} label="Add To-Do" onClick={addTodo} />
                        <FlyoutItem icon={FileText} label="Add Note" onClick={() => { contentRef.current?.focus(); setShowFlyout(false); }} />
                        <FlyoutItem icon={Table} label="Insert Table" onClick={insertMockTable} />
                        <FlyoutItem icon={ImageIcon} label="Insert Image" onClick={triggerImageUpload} />
                        {ws.role === "owner" && (
                            <>
                                <FlyoutItem icon={Share2} label="Share Workspace" onClick={() => { setShowShareDialog(true); setShowFlyout(false); }} />
                                <div className="border-t border-border my-1" />
                                <FlyoutItem icon={Trash2} label="Trash Workspace" onClick={handleTrash} destructive />
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Editor area */}
            <div className="flex-1 max-w-3xl mx-auto px-6 py-12 animate-fade-in">
                {/* Page heading */}
                <input
                    type="text"
                    value={ws.name}
                    onChange={handleTitleChange}
                    className="w-full text-4xl md:text-5xl font-bold bg-transparent border-none outline-none text-foreground placeholder-muted-foreground mb-2"
                    placeholder="Untitled"
                />

                {/* Favorite Toggle (Star) */}
                <button
                    onClick={() => toggleFavorite(ws.id)}
                    className={`absolute top-12 right-6 p-2 rounded-full transition-all hover:bg-surface-600 ${ws.is_favorite ? "text-primary" : "text-muted-foreground"}`}
                    title={ws.is_favorite ? "Remove from favorites" : "Add to favorites"}
                >
                    <Star size={24} fill={ws.is_favorite ? "currentColor" : "none"} />
                </button>

                <p className="text-xs text-muted-foreground mb-8">
                    {ws.type === "shared" ? "🌐 Shared workspace" : "🔒 Private workspace"} · {ws.role === "owner" ? "🛡️ Owner" : "👤 Participant"} · Created {new Date(ws.createdAt).toLocaleDateString()}
                </p>

                {/* Todos */}
                {ws.todos.length > 0 && (
                    <div className="mb-6 space-y-2">
                        {ws.todos.map((todo) => (
                            <div key={todo.id} className="flex items-center gap-3 group">
                                <button
                                    onClick={() => updateTodo(todo.id, { done: !todo.done })}
                                    className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${todo.done
                                        ? "bg-primary border-primary text-primary-foreground"
                                        : "border-border hover:border-primary/50"
                                        }`}
                                >
                                    {todo.done && <CheckSquare size={12} />}
                                </button>
                                <input
                                    type="text"
                                    value={todo.text}
                                    onChange={(e) => updateTodo(todo.id, { text: e.target.value })}
                                    placeholder="To-do item..."
                                    className={`flex-1 bg-transparent border-none outline-none text-sm ${todo.done ? "line-through text-muted-foreground" : "text-foreground"
                                        }`}
                                />
                                <button
                                    onClick={() => deleteTodo(todo.id)}
                                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Content editable */}
                <div
                    ref={contentRef}
                    contentEditable
                    suppressContentEditableWarning
                    data-placeholder="Start writing here... Use the + menu to add blocks."
                    className="min-h-[300px] outline-none text-foreground text-base leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: ws.content }}
                    onBlur={handleContentChange}
                />
            </div>

            {/* Share dialog */}
            {showShareDialog && (
                <ShareDialog ws={ws} onClose={() => setShowShareDialog(false)} />
            )}
        </div>
    );
};

export default WorkspaceEditor;
