import "./room.css";
import { useState, useRef, use } from "react";
import Whiteboard from "../../components/WhiteBoard/whiteboard";
import "./room.css";

const Room = ({ userId , socket }) => {

  const [tool, setTool] = useState("pencil");
  const [color, setColor] = useState("#000000");
  const [elements, setElements] = useState([]);
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [size, setSize] = useState(2);

  const canvasRef = useRef(null);
  const ctxRef = useRef(null);

  

  const handleUndo = () => {
    if (history.length === 0) return;

    const lastState = history[history.length - 1];

    setRedoStack((prev) => [elements, ...prev]);
    setElements(lastState);
    setHistory((prev) => prev.slice(0, -1));
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;

    const nextState = redoStack[0];

    setElements(nextState);
    setRedoStack((prev) => prev.slice(1));

    setHistory((prev) => [...prev, nextState]);
  };

  const handleClear = () => {
    setElements([]);     // clear canvas
    setHistory([]);      // reset undo
    setRedoStack([]);    // reset redo
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `whiteboard-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  const tools = [
    { id: "pencil", label: "✏️ Pencil" },
    { id: "eraser", label: "🧽 Eraser" },
    { id: "line", label: "📏 Line" },
    { id: "rectangle", label: "⬛ Rectangle" },
    { id: "circle", label: "⭕ Circle" },
  ];

  return (
    <div className="container-fluid d-flex flex-column" style={{ minHeight: '100vh', padding: '0 20px' }}>
      <h1 className="text-center py-4 text-primary fw-bold" style={{ textShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
        ✨ Real-Time Whiteboard
      </h1>

      {userId && userId.presenter && (
        <div className="toolbar glass-panel d-flex flex-wrap justify-content-center align-items-center gap-4 py-3 px-4 mx-auto mb-4" style={{ maxWidth: '1000px', width: '100%' }}>
          
          {/* Tool Selector */}
          <div className="d-flex gap-2">
            {tools.map((t) => (
              <button
                key={t.id}
                className={`btn ${tool === t.id ? 'btn-primary' : 'btn-light dropdown-shadow'}`}
                onClick={() => setTool(t.id)}
                title={t.label}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Stroke Size & Color */}
          <div className="d-flex align-items-center gap-3 border-start border-end px-4">
            <div className="d-flex flex-column align-items-center">
              <label className="text-muted small fw-bold mb-1">Thickness: {size}</label>
              <input
                type="range"
                min="1"
                max="10"
                value={size}
                className="form-range"
                onChange={(e) => setSize(e.target.value)}
                style={{ width: '100px' }}
              />
            </div>

            <div className="d-flex flex-column align-items-center">
              <label htmlFor="color" className="text-muted small fw-bold mb-1">Color</label>
              <input
                type="color"
                id="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                title="Choose Color"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary" onClick={handleUndo} title="Undo">↩️ Undo</button>
            <button className="btn btn-outline-secondary" onClick={handleRedo} title="Redo">↪️ Redo</button>
            <button className="btn btn-danger" onClick={handleClear} title="Clear Board">🗑 Clear</button>
            <button className="btn btn-success" onClick={handleDownload} title="Save Image">💾 Save</button>
          </div>

        </div>
      )}

      <div className="whiteboard-container">
  <Whiteboard
    canvasRef={canvasRef}
    ctxRef={ctxRef}
    elements={elements}
    setElements={setElements}
    tool={tool}
    setHistory={setHistory}
    setRedoStack={setRedoStack}
    color={color}
    size={size}
    userId={userId}
    socket={socket}
  />
</div>
    </div>
  );
};

export default Room;