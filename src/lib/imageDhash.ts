export async function imageDHash64(file: File): Promise<string> {
  const img = await loadImageFromFile(file);

  // dHash uses 9x8 so we get 8 comparisons per row * 8 rows = 64 bits
  const w = 9,
    h = 8;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  // Draw resized
  ctx.drawImage(img, 0, 0, w, h);

  const { data } = ctx.getImageData(0, 0, w, h);

  // grayscale matrix [h][w]
  const gray: number[][] = [];
  for (let y = 0; y < h; y++) {
    const row: number[] = [];
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const r = data[i],
        g = data[i + 1],
        b = data[i + 2];
      // perceptual luminance
      const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      row.push(lum);
    }
    gray.push(row);
  }

  // build 64-bit hash as bits
  const bits: number[] = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w - 1; x++) {
      bits.push(gray[y][x] > gray[y][x + 1] ? 1 : 0);
    }
  }

  // convert bits -> 16 hex chars (64 bits)
  let hex = "";
  for (let i = 0; i < 64; i += 4) {
    const v =
      (bits[i] << 3) | (bits[i + 1] << 2) | (bits[i + 2] << 1) | bits[i + 3];
    hex += v.toString(16);
  }

  // return as 0x + 16 hex chars (64-bit)
  return "0x" + hex;
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}
