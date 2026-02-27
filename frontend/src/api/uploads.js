import axios from "axios";

const API = axios.create({
    baseURL: "http://127.0.0.1:8000/api/uploads",
});

API.interceptors.request.use((req) => {
    const token = localStorage.getItem("token");
    if (token) {
        req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
});

export const uploadImage = (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return API.post("/", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
};
