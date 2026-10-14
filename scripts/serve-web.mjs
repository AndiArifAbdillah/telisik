// Serves the dashboard locally with correct MIME types (Python's http.server on Windows
// sends .js as text/plain, which browsers refuse for module scripts).
import path from "node:path";
import express from "express";
import { ROOT } from "../shared/chain.mjs";

const dir = process.argv[2] ? path.resolve(process.argv[2]) : path.join(ROOT, "web");
const port = Number(process.env.PORT ?? 8080);
const app = express();
app.use(express.static(dir, { setHeaders: (res) => res.setHeader("Cache-Control", "no-store") }));
app.listen(port, () => console.log(`Dashboard: http://localhost:${port}  (serving ${dir})`));
