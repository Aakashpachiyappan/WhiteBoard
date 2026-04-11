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


  return (
    <div className="row">
      <h1 className="text-center py-4">
        White Board Sharing App{" "}
        <span className="text-primary">[Users Online : 0]</span>
      </h1>

      {userId && userId.presenter && (
        <div className="col-md-12 d-flex align-items-center justify-content-around">

          <div className="d-flex col-md-4 justify-content-between gap-1">

            {["pencil", "eraser", "line", "rectangle"].map((item) => (
              <div key={item} className="d-flex gap-1 align-items-center">
                <label htmlFor={item}>{item}</label>
                <input
                  type="radio"
                  id={item}
                  checked={tool === item}
                  name="tool"
                  value={item}
                  onChange={(e) => setTool(e.target.value)}
                />
              </div>
            ))
            }
          </div>

          <div className="d-flex flex-column align-items-center m-3" >
            <label>Size: {size}</label>
            <input
              type="range"
              min="1"
              max="10"
              value={size}
              onChange={(e) => setSize(e.target.value)}
            />
          </div>

          <div className="col-md-2">
            <div className="d-flex flex-row m-3 align-items-center">
              <label htmlFor="color">Select Color:</label>
              <input
                type="color"
                id="color"
                className="mt-1"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
            </div>
          </div>

          <div className="col-md-3 d-flex gap-2">
            <button className="btn btn-primary mt-1" onClick={handleUndo}>
              Undo
            </button>
            <button className="btn btn-outline-primary mt-1" onClick={handleRedo}>Redo</button>
          </div>

          <div className="col-md-3">
            <button className="btn btn-danger mt-1" onClick={handleClear}>Clear Board</button>
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