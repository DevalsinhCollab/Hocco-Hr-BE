const express = require("express");
const app = express();
const fs = require("fs");
const cors = require("cors");
const connectDB = require("./DB/db");
const env = require("dotenv");
const { setBranchFromGit } = require("./currentBranch");
const employeeCron = require("./cronJobs/employeeCron");

app.use(cors());
app.use(express.json({ limit: "500mb" }));

setBranchFromGit();

const envFileMap = {
  main: ".env.main",
  development: ".env.development",
};

const envFile = envFileMap[process.env.BRANCH] || ".env.development";

if (fs.existsSync(envFile)) {
  console.log(`Loading environment variables from ${envFile}`);
  env.config({ path: envFile });
} else {
  console.error(`Environment file not found: ${envFile}`);
}

connectDB();

const PORT = process.env.BACKEND_PORT;

employeeCron()

app.use("/api/auth", require("./routes/auth"));
app.use("/api/company", require("./routes/company"));
app.use("/api/employee", require("./routes/employee"));
app.use("/api/document", require("./routes/document"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api/template", require("./routes/template"));

app.listen(PORT, () => {
  console.log(`Backend run on port ${PORT}`);
});
