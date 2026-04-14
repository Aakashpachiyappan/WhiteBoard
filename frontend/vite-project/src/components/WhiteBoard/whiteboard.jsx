import { useEffect , useState , useLayoutEffect, useRef } from "react";
import rough from "roughjs";
import "./whiteboard.css";

const roughGenerator = rough.generator();

const Whiteboard = ({ canvasRef, ctxRef , elements, setElements , tool , setHistory , setRedoStack , color , size , userId , socket }) => {

  const[isDrawing, setIsDrawing] = useState(false);
  
  const[img , setImg] = useState(null);
  const lastEmitTime = useRef(0);

  // Helper to map mouse coordinates correctly when canvas is scaled via CSS
  const getMappedCoordinates = (e) => {
    if (!canvasRef.current) return { offsetX: 0, offsetY: 0 };
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      offsetX: (e.clientX - rect.left) * scaleX,
      offsetY: (e.clientY - rect.top) * scaleY
    };
  };

  useEffect(() => {
    socket.on("whiteboard-data-response", (data) => {
      setImg(data.imgUrl);
    });
    return () => {
      socket.off("whiteboard-data-response");
    }
  }, [socket]);

  useEffect(() => {
    if(!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctxRef.current = ctx;
  }, []);

  useLayoutEffect(() => {
    if (!canvasRef.current) return;
  const canvas = canvasRef.current;
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const roughCanvas = rough.canvas(canvas);

  elements.forEach((element) => {

    if (element.type === "pencil") {
      if (element.path.length > 1) {
        roughCanvas.linearPath(element.path, {
          stroke: element.stroke,
          strokeWidth: element.strokeWidth,
          roughness: 0,
          bowing: 0,
        });
      }
    }

    if (element.type === "line") {
      roughCanvas.line(
        element.x1,
        element.y1,
        element.x2,
        element.y2,
        {
          stroke: element.stroke,
          strokeWidth: element.strokeWidth,
          roughness: 0,
          bowing: 0,
        }
      );
    }

    if (element.type === "rectangle") {
      roughCanvas.rectangle(
        element.x1,
        element.y1,
        element.x2 - element.x1,
        element.y2 - element.y1,
        {
          stroke: element.stroke,
          strokeWidth: element.strokeWidth,
          roughness: 0,
          bowing: 0,
        }
      );
    }

    if (element.type === "circle") {
      const radiusX = Math.abs(element.x2 - element.x1) / 2;
      const radiusY = Math.abs(element.y2 - element.y1) / 2;
      const centerX = element.x1 + (element.x2 - element.x1) / 2;
      const centerY = element.y1 + (element.y2 - element.y1) / 2;
      roughCanvas.ellipse(
        centerX,
        centerY,
        radiusX * 2,
        radiusY * 2,
        {
          stroke: element.stroke,
          strokeWidth: element.strokeWidth,
          roughness: 0,
          bowing: 0,
        }
      );
    }
    // 🧽 ERASER
    if (element.type === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = element.strokeWidth ? element.strokeWidth * 4 : 20; // dynamic eraser size
      ctx.lineCap = "round";

      ctx.beginPath();

      element.path.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point[0], point[1]);
        } else {
          ctx.lineTo(point[0], point[1]);
        }
      });

      ctx.stroke();

      ctx.globalCompositeOperation = "source-over"; // reset
    }
    
  });

  if(userId?.presenter) {
    const now = Date.now();
    if (now - lastEmitTime.current >= 30) { // ~33 FPS throttle
      lastEmitTime.current = now;
      const canvasImage = canvasRef.current.toDataURL();
      socket.emit("whiteboard-data", canvasImage);
    }
  }

}, [elements]);

const handleMouseDown = (e) => {

  setRedoStack([]);

  const { offsetX, offsetY } = getMappedCoordinates(e);

  // ✅ SAVE history BEFORE drawing
  setHistory((prev) => [...prev, elements]);

  if (tool === "pencil") {
    setElements((prev) => [
      ...prev,
      {
        type: "pencil",
        path: [[offsetX, offsetY]],
        stroke: color,
        strokeWidth: size
      }
    ]);
  }

  if (tool === "line" || tool === "rectangle" || tool === "circle") {
    setElements((prev) => [
      ...prev,
      {
        type: tool,
        x1: offsetX,
        y1: offsetY,
        x2: offsetX,
        y2: offsetY,
        stroke: color,
        strokeWidth: size
      }
    ]);
  }

  if (tool === "eraser") {
    setElements((prev) => [
      ...prev,
      {
        type: "eraser",
        path: [[offsetX, offsetY]],
        strokeWidth: size // pass size for eraser
      }
    ]);
  }

  setIsDrawing(true);
};

  const handleMouseMove = (e) => {
  const { offsetX, offsetY } = getMappedCoordinates(e);

  if (!isDrawing) return;

  setElements((prevElements) => {
    if (prevElements.length === 0) return prevElements;
    const index = prevElements.length - 1;
    const element = prevElements[index];

    // ✏️ Pencil
    if (element.type === "pencil") {
      const newPath = [...element.path, [offsetX, offsetY]];

      return prevElements.map((el, i) =>
        i === index ? { ...el, path: newPath } : el
      );
    }

    // 📏 Line / ⬛ Rectangle / ⭕ Circle
    if (element.type === "line" || element.type === "rectangle" || element.type === "circle") {
      return prevElements.map((el, i) =>
        i === index
          ? { ...el, x2: offsetX, y2: offsetY }
          : el
      );
    }
    if (element.type === "eraser") {
  const newPath = [...element.path, [offsetX, offsetY]];

  return prevElements.map((el, i) =>
    i === index ? { ...el, path: newPath } : el
  );
}

    return prevElements;
  });
};

  const handleMouseUp = () => {
    setIsDrawing(false);
    
    // Ensure final state after stroke finishes is perfectly synced
    if(userId?.presenter) {
      if(canvasRef.current) {
        const canvasImage = canvasRef.current.toDataURL();
        socket.emit("whiteboard-data", canvasImage);
      }
    }
  };
  

 if (!userId?.presenter) {
    return (
      <div className="w-100 d-flex justify-content-center">
        {img ? (
          <img 
            src={img} 
            alt="Shared Board" 
            style={{ 
              display: "block",
              backgroundColor: "white", // 👈 Ensure visibility
              width: "100%",
              maxWidth: "1000px",
              aspectRatio: "1000/550"
            }} 
          />
        ) : (
          <div className="d-flex align-items-center justify-content-center bg-white border rounded shadow-sm" style={{ width: "100%", maxWidth: "1000px", aspectRatio: "1000/550" }}>
             <p className="text-muted">Connecting to presenter...</p>
          </div>
        )}
      </div>
    );
  }
  return (
    <>
      <canvas
        width={1000}
        height={550}
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className={tool === "eraser" ? "canvas-eraser" : "canvas-pencil"}
      />
    </>
  );
};

export default Whiteboard;