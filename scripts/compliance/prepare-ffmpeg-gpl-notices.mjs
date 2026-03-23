import fs from "fs/promises";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const projectRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");
const outDir = path.join(projectRoot, "THIRD_PARTY_LICENSES");
const outLicensePath = path.join(outDir, "ffmpeg-static-GPL-3.0-or-later.txt");

async function main() {
  await fs.mkdir(outDir, { recursive: true });

  let copied = false;
  try {
    const ffmpegPkgJsonPath = require.resolve("ffmpeg-static/package.json", { paths: [projectRoot] });
    const ffmpegPkgDir = path.dirname(ffmpegPkgJsonPath);
    const candidateLicenseFiles = ["LICENSE", "LICENSE.txt", "COPYING"];

    for (const file of candidateLicenseFiles) {
      const fullPath = path.join(ffmpegPkgDir, file);
      try {
        const content = await fs.readFile(fullPath, "utf8");
        await fs.writeFile(outLicensePath, content, "utf8");
        copied = true;
        break;
      } catch {
        // Keep trying candidate files.
      }
    }
  } catch {
    // Ignore and fall back to a canonical GPL reference notice.
  }

  if (!copied) {
    const fallback = [
      "GPL-3.0-or-later license text was not found in local node_modules.",
      "",
      "Download the canonical GNU GPL v3 text from:",
      "https://www.gnu.org/licenses/gpl-3.0.txt",
      "",
      "This project uses ffmpeg-static, which declares GPL-3.0-or-later.",
      "Ensure this license text is shipped with your distribution artifact.",
      "",
    ].join("\n");
    await fs.writeFile(outLicensePath, fallback, "utf8");
  }

  console.log(`Prepared: ${path.relative(projectRoot, outLicensePath)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
