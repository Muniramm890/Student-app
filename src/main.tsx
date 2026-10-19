// FILE: student-app/src/main.tsx

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/global.css";
import { initNative } from "./native";

initNative(); // Android app me hi kuch karta hai; web/PWA par no-op

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
