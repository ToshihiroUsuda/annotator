import React from "react";
import ReactDOMClient from "react-dom/client";
import "../node_modules/@fortawesome/fontawesome-free/css/all.css";
import App from "./App";
import "./index.css";
import registerMixins from "./registerMixins";
import registerProviders from "./registerProviders";
import * as serviceWorker from "./serviceWorker";

registerMixins();
registerProviders();

const rootElement = document.getElementById("root");
if (rootElement !== null && rootElement.childNodes.length === 0) {
  const root = ReactDOMClient.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
