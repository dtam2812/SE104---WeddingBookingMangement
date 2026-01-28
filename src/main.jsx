import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { createBrowserRouter, RouterProvider } from "react-router";
import RootLayout from "./RootLayout.jsx";

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [{}],
  },
]);

createRoot(document.getElementById("root")).render(
  <RouterProvider router={router} />,
);
