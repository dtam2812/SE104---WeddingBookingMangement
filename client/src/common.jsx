import axios from "axios";

axios.defaults.baseURL = "http://localhost:8080";

axios.interceptors.request.use(
  function (config) {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  function (error) {
    return Promise.reject(error);
  },
);

axios.interceptors.response.use(
  function (response) { return response; },
  function (error) {
    if (error.response?.status === 401) {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("expiresAt");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default axios;
