import axios from "axios";

// Create a separate API instance for authenticated requests
const API = axios.create({
    baseURL: "http://127.0.0.1:8000/api/workspaces",
});

// Interceptor to attach the token to all requests
API.interceptors.request.use((req) => {
    const token = localStorage.getItem("token");
    if (token) {
        req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
});

export const getWorkspaces = () => API.get("/");
export const createWorkspace = (data) => API.post("/", data);
export const updateWorkspace = (id, data) => API.patch(`/${id}`, data);
export const deleteWorkspace = (id) => API.delete(`/${id}`);
export const inviteUser = (id, email) => API.post(`/${id}/invite`, { email });

// Invitations
export const getInvitations = () => API.get("/invitations");
export const acceptInvitation = (id) => API.post(`/invitations/${id}/accept`);
export const declineInvitation = (id) => API.post(`/invitations/${id}/decline`);
export const toggleFavorite = (id, isFavorite) => API.patch(`/${id}/favorite`, { is_favorite: isFavorite });
