/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from "react";

const WorkspacesContext = createContext(null);

const STORAGE_KEY = "notion_workspaces";

const load = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
    catch { return []; }
};

import { getWorkspaces, createWorkspace, updateWorkspace, deleteWorkspace } from "../api/workspaces";

export const WorkspacesProvider = ({ children }) => {
    const [allWorkspaces, setAllWorkspaces] = useState(load);

    // Sync from API on mount
    useEffect(() => {
        const fetchWorkspaces = async () => {
            try {
                if (localStorage.getItem("token")) {
                    const { data } = await getWorkspaces();
                    setAllWorkspaces(data);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
                }
            } catch (err) {
                console.error("Failed to fetch workspaces from API", err);
            }
        };
        fetchWorkspaces();
        window.addEventListener("storage", fetchWorkspaces);
        return () => window.removeEventListener("storage", fetchWorkspaces);
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

    const active = allWorkspaces.filter((w) => !w.deleted);
    const trashed = allWorkspaces.filter((w) => w.deleted);

    return (
        <WorkspacesContext.Provider value={{ workspaces: active, trashed, create, update, trash, restore, permanentDelete }}>
            {children}
        </WorkspacesContext.Provider>
    );
};

export const useWorkspaces = () => {
    const ctx = useContext(WorkspacesContext);
    if (!ctx) throw new Error("useWorkspaces must be used within WorkspacesProvider");
    return ctx;
};
