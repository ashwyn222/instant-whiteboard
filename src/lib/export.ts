import type Konva from 'konva';

export function exportStageToPNG(
  stage: Konva.Stage,
  filename = 'whiteboard.png',
): void {
  const pixelRatio = 2;
  const stageCanvas = stage.toCanvas({ pixelRatio });

  const out = document.createElement('canvas');
  out.width = stageCanvas.width;
  out.height = stageCanvas.height;
  const ctx = out.getContext('2d');
  if (!ctx) return;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(stageCanvas, 0, 0);

  triggerDownload(out.toDataURL('image/png'), filename);
}

function triggerDownload(dataURL: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataURL;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
