import { createMiddleware } from "rakkasjs/node-adapter";
import hattipHandler from "./entry-hattip";
import express from "express";

const app = express();

// You can use Express routes and middleware here
app.get("/express", (_req, res) => {
	res.json({ message: "Hello from Express!" });
});

app.use(createMiddleware(hattipHandler));

// An Express app is actually a request handler function
export default app;
