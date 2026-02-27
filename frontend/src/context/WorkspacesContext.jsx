/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getWorkspaces, createWorkspace, updateWorkspace, deleteWorkspace, toggleFavorite as toggleFavoriteAPI } from "../api/workspaces";

const WorkspacesContext = createContext(null);

const STORAGE_KEY = "notion_workspaces";

export const WorkspacesProvider = ({ children }) => {
    const [allWorkspaces, setAllWorkspaces] = useState([]);

    // Sync from API on mount and whenever the token changes
    useEffect(() => {
        const fetchWorkspaces = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                // No user logged in — clear everything
                setAllWorkspaces([]);
                localStorage.removeItem(STORAGE_KEY);
                return;
            }
            try {
                const { data } = await getWorkspaces();
                setAllWorkspaces(data);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            } catch (err) {
                console.error("Failed to fetch workspaces from API", err);
            }
        };
        fetchWorkspaces();

    }, []);

    // Manual refresh from API (used for polling)
    const refresh = useCallback(async () => {
        const token = localStorage.getItem("token");
        if (!token) return;
        try {
            const { data } = await getWorkspaces();
            setAllWorkspaces(data);
        } catch (err) {
            console.error("Failed to refresh workspaces", err);
        }
    }, []);

    // Sync local changes to localStorage
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allWorkspaces));
    }, [allWorkspaces]);

    const create = useCallback((name, type) => {
        const ws = {
            id: crypto.randomUUID(),
            name: name || "Untitled",
            type,
            content: "",
            todos: [],
            createdAt: new Date().toISOString(),
            deleted: false,
            role: "owner",
            is_favorite: false
        };
        setAllWorkspaces((prev) => [...prev, ws]);
        // sync to backend
        createWorkspace(ws).catch(console.error);
        return ws.id;
    }, []);

    const update = useCallback((id, data) => {
        setAllWorkspaces((prev) => prev.map((w) => (w.id === id ? { ...w, ...data } : w)));
        // sync back
        updateWorkspace(id, data).catch(console.error);
    }, []);

    const trash = useCallback((id) => {
        setAllWorkspaces((prev) => prev.map((w) => (w.id === id ? { ...w, deleted: true } : w)));
        updateWorkspace(id, { deleted: true }).catch(console.error);
    }, []);

    const restore = useCallback((id) => {
        setAllWorkspaces((prev) => prev.map((w) => (w.id === id ? { ...w, deleted: false } : w)));
        updateWorkspace(id, { deleted: false }).catch(console.error);
    }, []);

    const permanentDelete = useCallback((id) => {
        setAllWorkspaces((prev) => prev.filter((w) => w.id !== id));
        deleteWorkspace(id).catch(console.error);
    }, []);

    const toggleFavorite = useCallback(async (id) => {
        const ws = allWorkspaces.find(w => w.id === id);
        if (!ws) return;

        const newFavorite = !ws.is_favorite;
        // Optimistic update
        setAllWorkspaces((prev) => prev.map((w) => (w.id === id ? { ...w, is_favorite: newFavorite } : w)));

        try {
            await toggleFavoriteAPI(id, newFavorite);
        } catch (err) {
            console.error("Failed to toggle favorite", err);
            // Rollback
            setAllWorkspaces((prev) => prev.map((w) => (w.id === id ? { ...w, is_favorite: !newFavorite } : w)));
        }
    }, [allWorkspaces]);

    const active = allWorkspaces.filter((w) => !w.deleted);
    const trashed = allWorkspaces.filter((w) => w.deleted);

    return (
        <WorkspacesContext.Provider value={{ workspaces: active, trashed, create, update, trash, restore, permanentDelete, refresh, toggleFavorite }}>
            {children}
        </WorkspacesContext.Provider>
    );
};

export const useWorkspaces = () => {
    const ctx = useContext(WorkspacesContext);
    if (!ctx) throw new Error("useWorkspaces must be used within WorkspacesProvider");
    return ctx;
};
