const { execSync } = require("child_process");

function setBranchFromGit() {
  try {
    // Run the Git command to get the branch name
    const branch = execSync("git rev-parse --abbrev-ref HEAD")
      .toString()
      .trim();
    process.env.BRANCH = branch; // Set the branch as an environment variable
    console.log(`Branch detected: ${process.env.BRANCH}`);
  } catch (err) {
    console.error('Error detecting Git branch, defaulting to "development"');
    process.env.BRANCH = "development"; // Default to 'development' if there's an issue
  }
}

module.exports = { setBranchFromGit };