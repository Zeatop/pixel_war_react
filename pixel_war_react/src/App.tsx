import { useState } from "react";
import Grid from "./frontend/grid/grid";
import "./App.css";

const PALETTE = [
  "#000000", "#ffffff", "#ff0000", "#00ff00", "#0000ff",
  "#ffff00", "#ff00ff", "#00ffff", "#ff8800", "#8800ff",
  "#00ff88", "#ff0088", "#884400", "#004488", "#448800",
  "#888888", "#ff4444", "#44ff44", "#4444ff", "#ffaa44",
];

function App() {
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [customColor, setCustomColor] = useState("#000000");

  const handleCustomColor = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomColor(e.target.value);
    setSelectedColor(e.target.value);
  };

  return (
    <div className="app">
      <header className="toolbar">
        <h1 className="toolbar__title">Pixel War</h1>
        <div className="toolbar__palette">
          {PALETTE.map((color) => (
            <button
              key={color}
              className={`palette-swatch ${selectedColor === color ? "palette-swatch--active" : ""}`}
              style={{ backgroundColor: color }}
              onClick={() => setSelectedColor(color)}
              title={color}
            />
          ))}
          <label className="palette-swatch palette-swatch--custom" title="Couleur personnalisée">
            <input
              type="color"
              value={customColor}
              onChange={handleCustomColor}
            />
            <span style={{ fontSize: 16 }}>🎨</span>
          </label>
        </div>
        <div className="toolbar__selected">
          <span
            className="selected-preview"
            style={{ backgroundColor: selectedColor }}
          />
          <code>{selectedColor}</code>
        </div>
      </header>

      <main className="canvas-container">
        <Grid w={100} h={100} selectedColor={selectedColor} />
      </main>
    </div>
  );
}

export default App;