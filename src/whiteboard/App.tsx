import { Canvas } from '../components/Canvas/Canvas';
import { DialogHost } from '../components/Dialog/Dialog';
import { StylePanel } from '../components/StylePanel/StylePanel';
import { Toolbar } from '../components/Toolbar/Toolbar';
import { ZoomControls } from '../components/ZoomControls/ZoomControls';
import { useHotkeys } from '../lib/hotkeys';
import { useImagePasteAndDrop } from '../lib/imageInsert';
import { usePersistence } from '../lib/persistence';

export function App() {
  useHotkeys();
  useImagePasteAndDrop();
  usePersistence();

  return (
    <div className="app">
      <Canvas />
      <Toolbar />
      <StylePanel />
      <ZoomControls />
      <DialogHost />
    </div>
  );
}
