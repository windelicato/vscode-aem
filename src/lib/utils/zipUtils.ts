import * as fs from "fs";
import * as path from "path";
import * as unzipper from "unzipper";

/**
 * Extracts the first file matching filePattern from a zip archive to destDir.
 * Returns the destination path if successful, or undefined if not found or error.
 */
export async function extractFileFromZip(
  zipPath: string,
  destDir: string,
  filePattern: RegExp,
  infoLabel: string,
  progress?: (msg: string) => void
): Promise<string | undefined> {
  try {
    const directory: any = await unzipper.Open.file(zipPath);
    const entry = directory.files.find((f: any) => filePattern.test(f.path));
    if (!entry) {
      console.error(
        `[ERROR] No ${infoLabel} found in ${path.basename(zipPath)}.`
      );
      if (progress) {
        progress(`[ERROR] No ${infoLabel} found in ${path.basename(zipPath)}.`);
      }
      return undefined;
    }
    const dest = path.join(destDir, path.basename(entry.path));
    if (!fs.existsSync(dest)) {
      await new Promise((resolve, reject) => {
        let finished = false;
        const outStream = fs.createWriteStream(dest);
        const onError = (err: any) => {
          if (!finished) {
            finished = true;
            console.error(`[ERROR] Extraction failed: ${err.message}`);
            if (progress) {
              progress(`[ERROR] Extraction failed: ${err.message}`);
            }
            reject(err);
          }
        };
        outStream.once("error", onError);
        const inStream = entry.stream();
        inStream.once("error", onError);
        outStream.on("finish", () => {
          if (!finished) {
            finished = true;
            resolve(undefined);
          }
        });
        if (progress) {
          progress(`Extracting ${entry.path}...`);
        }
        inStream.pipe(outStream);
        setTimeout(() => {
          if (!finished) {
            finished = true;
            console.error("[ERROR] Extraction timed out.");
            if (progress) {
              progress("[ERROR] Extraction timed out.");
            }
            reject(new Error("Extraction timed out"));
          }
        }, 60000);
      });
      if (progress) {
        progress(`Extraction complete.`);
      }
      console.log(
        `[INFO] Extracted ${entry.path} from ${path.basename(
          zipPath
        )} to ${destDir}`
      );
    }
    return dest;
  } catch (e: any) {
    console.error(`[ERROR] Failed to extract ${infoLabel}: ${e.message}`);
    if (progress) {
      progress(`[ERROR] Failed to extract ${infoLabel}: ${e.message}`);
    }
    return undefined;
  }
}
