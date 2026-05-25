import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { basename, extname, join } from "node:path";
import sharp from "sharp";

const sourceRoot = "assets-originals";
const publicRoot = "apps/web/public/images";
const supportedExtensions = new Set([".png", ".jpg", ".jpeg", ".webp"]);

const imageGroups = [
  {
    sourceDir: join(sourceRoot, "branding"),
    outputDir: join(publicRoot, "branding"),
    quality: 84,
    removeLightBackground: new Set(["marlon-zusk-character", "zusk-logo"]),
    sizes: {
      "ai-capitalist-job-killer-hero": { width: 1600 },
      "marlon-zusk-character": { width: 900 },
      "zusk-logo": { width: 640 }
    }
  },
  {
    sourceDir: join(sourceRoot, "ventures"),
    outputDir: join(publicRoot, "ventures"),
    quality: 82,
    removeLightBackground: true,
    defaultSize: { width: 512, height: 512 },
    sizes: {
      "zusk-venture-icons-sheet": { width: 1200 }
    }
  }
];

/**
 * Converts every supported image in the configured original-art folders into optimized WebP files.
 */
async function optimizeImages() {
  for (const group of imageGroups) {
    if (!existsSync(group.sourceDir)) continue;

    mkdirSync(group.outputDir, { recursive: true });

    const files = readdirSync(group.sourceDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && supportedExtensions.has(extname(entry.name).toLowerCase()))
      .map((entry) => entry.name);

    for (const filename of files) {
      await optimizeImage(group, filename);
    }
  }
}

/**
 * Converts one source image to a resized WebP file, optionally removing fake checkerboard transparency.
 *
 * @param group - The source/output folder configuration.
 * @param filename - The source image filename inside the group source directory.
 */
async function optimizeImage(group, filename) {
  const imageName = basename(filename, extname(filename));
  const size = group.sizes?.[imageName] ?? group.defaultSize ?? { width: 1200 };
  const sourcePath = join(group.sourceDir, filename);
  const outputPath = join(group.outputDir, `${imageName}.webp`);
  const shouldRemoveBackground =
    group.removeLightBackground === true || group.removeLightBackground?.has?.(imageName) === true;
  const image = shouldRemoveBackground ? await removeConnectedLightBackground(sourcePath) : sharp(sourcePath);

  await image
    .resize({
      width: size.width,
      height: size.height,
      fit: "inside",
      withoutEnlargement: true
    })
    .webp({
      alphaQuality: 92,
      effort: 6,
      quality: group.quality
    })
    .toFile(outputPath);

  console.log(`${sourcePath} -> ${outputPath}`);
}

/**
 * Removes a baked light-gray or white checkerboard by making only edge-connected background pixels transparent.
 *
 * @param sourcePath - The original source image to process.
 * @returns A Sharp image instance backed by RGBA pixels with real alpha.
 */
async function removeConnectedLightBackground(sourcePath) {
  const { data, info } = await sharp(sourcePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const visited = new Uint8Array(width * height);
  const queue = [];

  for (let x = 0; x < width; x += 1) {
    pushIfBackground(x, 0);
    pushIfBackground(x, height - 1);
  }

  for (let y = 1; y < height - 1; y += 1) {
    pushIfBackground(0, y);
    pushIfBackground(width - 1, y);
  }

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const pixel = queue[cursor];
    const x = pixel % width;
    const y = Math.floor(pixel / width);

    data[pixel * channels + 3] = 0;
    visitNeighbor(x + 1, y);
    visitNeighbor(x - 1, y);
    visitNeighbor(x, y + 1);
    visitNeighbor(x, y - 1);
  }

  return sharp(data, { raw: { width, height, channels } });

  /**
   * Adds a pixel to the flood fill queue when it is connected fake-transparency background.
   *
   * @param x - The pixel x coordinate.
   * @param y - The pixel y coordinate.
   */
  function pushIfBackground(x, y) {
    const pixel = y * width + x;

    if (visited[pixel]) return;
    visited[pixel] = 1;
    if (isLightNeutralPixel(data, pixel, channels)) queue.push(pixel);
  }

  /**
   * Checks bounds before attempting to enqueue a flood fill neighbor.
   *
   * @param x - The neighbor x coordinate.
   * @param y - The neighbor y coordinate.
   */
  function visitNeighbor(x, y) {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    pushIfBackground(x, y);
  }
}

/**
 * Detects the light neutral colors commonly used in fake transparent checkerboard backgrounds.
 *
 * @param data - Raw RGBA image data.
 * @param pixel - The pixel index.
 * @param channels - The number of channels in the raw image.
 * @returns True when the pixel looks like background rather than artwork.
 */
function isLightNeutralPixel(data, pixel, channels) {
  const offset = pixel * channels;
  const red = data[offset];
  const green = data[offset + 1];
  const blue = data[offset + 2];
  const alpha = data[offset + 3];
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);

  return alpha > 240 && min >= 214 && max - min <= 18;
}

await optimizeImages();
