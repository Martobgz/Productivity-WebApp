import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { User, Mail, FileText, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

const Profile = () => {
    const { user, updateProfile } = useContext(AuthContext);
    const [displayName, setDisplayName] = useState(user?.displayName || "");
    const [bio, setBio] = useState(user?.bio || "");
    const [loading, setLoading] = useState(false);

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await updateProfile({ display_name: displayName, bio });
            toast.success("Profile updated successfully!");
        } catch (err) {
            toast.error("Failed to update profile.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 max-w-2xl mx-auto px-6 py-12 animate-fade-in">
            <header className="mb-12">
                <h1 className="text-3xl font-bold text-foreground mb-2">Public Profile</h1>
                <p className="text-muted-foreground">Manage your identity and how others see you.</p>
            </header>

            <form onSubmit={handleSave} className="space-y-8">
                {/* Avatar Placeholder */}
                <div className="flex items-center gap-6 p-6 rounded-2xl bg-surface-700 border border-border">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 text-primary font-bold text-2xl">
                        {user?.displayName?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div>
                        <h3 className="font-semibold text-foreground">{user?.displayName}</h3>
                        <p className="text-sm text-muted-foreground">{user?.email}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                            <User size={14} className="text-primary" />
                            Display Name
                        </label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="input-dark"
                            placeholder="Your name"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                            <Mail size={14} className="text-primary" />
                            Email Address
                        </label>
                        <div className="input-dark opacity-50 cursor-not-allowed flex items-center gap-2">
                            {user?.email}
                            <span className="text-[10px] bg-surface-600 px-1.5 py-0.5 rounded border border-border">READ-ONLY</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                            <FileText size={14} className="text-primary" />
                            Bio
                        </label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            className="input-dark min-h-[120px] resize-none"
                            placeholder="Tell us a bit about yourself..."
                        />
                        <p className="text-xs text-muted-foreground">Brief description for your profile.</p>
                    </div>
                </div>

                <div className="flex justify-end border-t border-border pt-6">
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary flex items-center gap-2 px-6"
                    >
                        {loading ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <Check size={16} />
                        )}
                        {loading ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Profile;
