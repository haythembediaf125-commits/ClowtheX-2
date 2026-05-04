import JsBarcode from "jsbarcode";

export function generateBarcodeValue(): string {
  const digits = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10));
  const sum = digits.reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 1 : 3), 0);
  const check = (10 - (sum % 10)) % 10;
  return digits.join("") + check;
}

export function renderBarcodeToSvg(value: string): string {
  try {
    const canvas = document.createElement("canvas");
    JsBarcode(canvas, value, {
      format: "CODE128",
      displayValue: true,
      fontSize: 14,
      margin: 6,
      width: 2,
      height: 60,
    });
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svg.setAttribute("width", canvas.width.toString());
    svg.setAttribute("height", canvas.height.toString());
    const img = document.createElementNS("http://www.w3.org/2000/svg", "image");
    img.setAttribute("href", canvas.toDataURL());
    img.setAttribute("width", canvas.width.toString());
    img.setAttribute("height", canvas.height.toString());
    svg.appendChild(img);
    return svg.outerHTML;
  } catch {
    return "";
  }
}

export function printBarcode(value: string, productName: string): void {
  try {
    const canvas = document.createElement("canvas");
    JsBarcode(canvas, value, {
      format: "CODE128",
      displayValue: true,
      fontSize: 14,
      margin: 10,
      width: 2,
      height: 80,
    });

    const dataUrl = canvas.toDataURL("image/png");
    const win = window.open("", "_blank", "width=400,height=300");
    if (!win) return;

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Barcode</title>
          <style>
            body { margin: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; font-family: sans-serif; background: #fff; }
            .name { font-size: 14px; font-weight: bold; margin-bottom: 8px; text-align: center; }
            img { max-width: 100%; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="name">${productName}</div>
          <img src="${dataUrl}" />
          <script>window.onload = () => { window.print(); window.close(); }<\/script>
        </body>
      </html>
    `);
    win.document.close();
  } catch {
    console.warn("printBarcode failed");
  }
}
