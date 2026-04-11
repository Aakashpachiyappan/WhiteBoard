import { useEffect , useState , useLayoutEffect} from "react";
import rough from "roughjs";
import "./whiteboard.css";

const roughGenerator = rough.generator();

const Whiteboard = ({ canvasRef, ctxRef , elements, setElements , tool , setHistory , setRedoStack , color , size , userId , socket }) => {

  const[isDrawing, setIsDrawing] = useState(false);
  
  const[img , setImg] = useState(null);

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
      roughCanvas.linearPath(element.path, {
        stroke: element.stroke,
        strokeWidth: element.strokeWidth,
        roughness: 0,
        bowing: 0,
      });
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
    // 🧽 ERASER
    if (element.type === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = 20;
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
    const canvasImage = canvasRef.current.toDataURL();
    socket.emit("whiteboard-data",canvasImage)

  }

}, [elements]);

const handleMouseDown = (e) => {

  setRedoStack([]);

  const { offsetX, offsetY } = e.nativeEvent;

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

  if (tool === "line" || tool === "rectangle") {
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
        path: [[offsetX, offsetY]]
      }
    ]);
  }

  setIsDrawing(true);
};

  const handleMouseMove = (e) => {
  const { offsetX, offsetY } = e.nativeEvent;

  if (!isDrawing) return;

  setElements((prevElements) => {
    const index = prevElements.length - 1;
    const element = prevElements[index];

    // ✏️ Pencil
    if (element.type === "pencil") {
      const newPath = [...element.path, [offsetX, offsetY]];

      return prevElements.map((el, i) =>
        i === index ? { ...el, path: newPath } : el
      );
    }

    // 📏 Line / ⬛ Rectangle
    if (element.type === "line" || element.type === "rectangle") {
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
  };
  

 if (!userId?.presenter) {
    return (
      <div className="whiteboard-container shadow border bg-white" style={{ width: "1000px", height: "550px" }}>
        {img ? (
          <img 
            src={img} 
            alt="Shared Board" 
            style={{ 
              width: "1000px", 
              height: "550px", 
              display: "block",
              backgroundColor: "white" // 👈 Ensure visibility
            }} 
          />
        ) : (
          <div className="h-100 d-flex align-items-center justify-content-center">
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