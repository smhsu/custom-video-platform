import express from "express";
import dotenv from "dotenv";

dotenv.config(); // Read the .env file in the current working directory, and load values into process.env.
const PORT = process.env.PORT || 3000;

const app = express();

app.get("/", (req, res) => {
    res.send("Hello, World");
});

app.get("/hello", (req, res) => {
    res.send("Hello Again!");
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
