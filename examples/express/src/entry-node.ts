import { createMiddleware } from "rakkasjs/node-adapter";
import hattipHandler from "./entry-hattip";
import express from "express";

const app = express();

app.get("/express", (_req, res) => {
	res.json({ message: "Hello from express!" });
});

app.use(createMiddleware(hattipHandler));

export default app;
