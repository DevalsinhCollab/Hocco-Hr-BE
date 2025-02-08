const express = require("express");
const app = express();
const fs = require("fs");
const cors = require("cors");
const connectDB = require("./DB/db");
const env = require("dotenv");
const { setBranchFromGit } = require("./currentBranch");
const employeeCron = require("./cronJobs/employeeCron");
const dfCron = require("./cronJobs/dfCron");

// Allow requests from your frontend
const allowedOrigins = ["https://hocco-hr-fe.vercel.app", "http://localhost:5173"];

app.use(cors({
  origin: allowedOrigins,
  methods: "GET,POST,PUT,DELETE,OPTIONS",
  credentials: true, // Allow cookies or authentication headers
}));
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

app.get("/", (req, res) => {
  res.send("Hello world");
});

// common routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/document", require("./routes/document"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api/Template", require("./routes/TemplateRoute"));
app.use("/api/Template", require("./routes/template"));
app.use("/api/aws", require("./routes/aws"));

// hr routes
app.use("/api/company", require("./routes/company"));
app.use("/api/employee", require("./routes/employee"));

// df routes
app.use("/api/aadhar", require("./routes/AadharRoute"));
app.use("/api/agreement", require("./routes/agreement"));
app.use("/api/dfmaster", require("./routes/df_master"));
app.use("/api/customer", require("./routes/customer"));
app.use("/api/store", require("./routes/df_store"));
app.use("/api/deliveryChallan", require("./routes/deliveryChallan"));
app.use("/api/ewaybill", require("./routes/eWayBill"));
app.use("/api/AssetTracker", require("./routes/AssetTrackerRoute"));
app.use("/api/signAgreement", require("./routes/SignAgreementRoute"));

// dis routes
app.use("/api/distributor", require("./routes/DistributorRoute"));
app.use("/api/cfa", require("./routes/CfaRoute"));
app.use("/api/vrs", require("./routes/VrsRoute"));
app.use(
  "/api/distributorDocument",
  require("./routes/DistributorDocumentRoute")
);
app.use("/api/cfaDocument", require("./routes/CfaDocumentRoute"));
app.use("/api/vrsDocument", require("./routes/VrsDocumentRoute"));

dfCron()
employeeCron()

app.listen(PORT, () => {
  console.log(`Backend run on port ${PORT}`);
});
