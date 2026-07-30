import axios from "axios";

const api = axios.create({
  baseURL: "https://nexuslens-api.onrender.com"
});

export default api;