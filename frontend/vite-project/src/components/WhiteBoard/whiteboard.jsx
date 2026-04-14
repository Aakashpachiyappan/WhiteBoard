import { useEffect, useState, useLayoutEffect, useRef } from "react";
import rough from "roughjs";
import "./whiteboard.css";

const Whiteboard = ({ canvasRef, ctxRef, elements, setElements, tool, setHistory, setRedoStack, color, size, canEdit, socket }) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const lastEmitTime = useRef(0);
  const currentDrawId = useRef(null);

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

  // Resize canvas internally to its computed flex size once rendered
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const parent = canvasRef.current.parentElement;
        canvasRef.current.width = parent.clientWidth;
        canvasRef.current.height = parent.clientHeight;

        // After resize, context is cleared, so we force a re-render hook by recreating context
        const ctx = canvasRef.current.getContext("2d");
        ctxRef.current = ctx;

        // trigger roughjs re-draw (hacky but works: map elements to themselves)
        setElements(el => [...el]);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    // 1. Initial bulk load of all elements (Join or Undo)
    socket.on("whiteboard-data-response", (serverElements) => {
      setElements(serverElements);
    });

    // 2. Real-time individual vector sync
    socket.on("element-update", (element) => {
      setElements(prev => {
        const index = prev.findIndex(e => e.id === element.id);
        if (index !== -1) {
          const newArr = [...prev];
          newArr[index] = element;
          return newArr;
        } else {
          return [...prev, element];
        }
      });
    });

    // 3. Clear board
    socket.on("whiteboard-clear", () => {
      setElements([]);
    });

    return () => {
      socket.off("whiteboard-data-response");
      socket.off("element-update");
      socket.off("whiteboard-clear");
    }
  }, [socket]);

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
          element.x1, element.y1, element.x2, element.y2,
          { stroke: element.stroke, strokeWidth: element.strokeWidth, roughness: 0, bowing: 0 }
        );
      }

      if (element.type === "rectangle") {
        roughCanvas.rectangle(
          element.x1, element.y1, element.x2 - element.x1, element.y2 - element.y1,
          { stroke: element.stroke, strokeWidth: element.strokeWidth, roughness: 0, bowing: 0 }
        );
      }

      if (element.type === "circle") {
        const radiusX = Math.abs(element.x2 - element.x1) / 2;
        const radiusY = Math.abs(element.y2 - element.y1) / 2;
        const centerX = element.x1 + (element.x2 - element.x1) / 2;
        const centerY = element.y1 + (element.y2 - element.y1) / 2;
        roughCanvas.ellipse(
          centerX, centerY, radiusX * 2, radiusY * 2,
          { stroke: element.stroke, strokeWidth: element.strokeWidth, roughness: 0, bowing: 0 }
        );
      }

      // 🧽 ERASER
      if (element.type === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
        ctx.lineWidth = element.strokeWidth ? element.strokeWidth * 4 : 20;
        ctx.lineCap = "round";

        ctx.beginPath();
        element.path.forEach((point, index) => {
          if (index === 0) ctx.moveTo(point[0], point[1]);
          else ctx.lineTo(point[0], point[1]);
        });
        ctx.stroke();
        ctx.globalCompositeOperation = "source-over"; // reset
      }
    });

  }, [elements]);

  const handleMouseDown = (e) => {
    if (!canEdit) return; // Disallow interactions if not approved

    setRedoStack([]);
    const { offsetX, offsetY } = getMappedCoordinates(e);

    // Save history BEFORE drawing
    setHistory((prev) => [...prev, elements]);

    const elementId = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    currentDrawId.current = elementId;

    let newElement = {};

    if (tool === "pencil" || tool === "eraser") {
      newElement = {
        id: elementId,
        type: tool,
        path: [[offsetX, offsetY]],
        stroke: color,
        strokeWidth: size
      };
    } else if (tool === "line" || tool === "rectangle" || tool === "circle") {
      newElement = {
        id: elementId,
        type: tool,
        x1: offsetX, y1: offsetY,
        x2: offsetX, y2: offsetY,
        stroke: color,
        strokeWidth: size
      };
    }

    setElements((prev) => [...prev, newElement]);
    socket.emit("element-update", newElement);

    setIsDrawing(true);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !canEdit || !currentDrawId.current) return;
    const { offsetX, offsetY } = getMappedCoordinates(e);

    let updatedElementWrapper = null;

    setElements((prevElements) => {
      if (prevElements.length === 0) return prevElements;
      const index = prevElements.findIndex(el => el.id === currentDrawId.current);
      if (index === -1) return prevElements;

      const element = prevElements[index];
      let newElement = null;

      if (element.type === "pencil" || element.type === "eraser") {
        const newPath = [...element.path, [offsetX, offsetY]];
        newElement = { ...element, path: newPath };
      } else {
        newElement = { ...element, x2: offsetX, y2: offsetY };
      }

      updatedElementWrapper = newElement;

      const newArray = [...prevElements];
      newArray[index] = newElement;
      return newArray;
    });

    // Throttle WebSocket emission to ~30fps to avoid network flood
    const now = Date.now();
    if (now - lastEmitTime.current >= 30 && updatedElementWrapper) {
      lastEmitTime.current = now;
      socket.emit("element-update", updatedElementWrapper);
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    // Final sync for perfection
    if (canEdit && currentDrawId.current) {
      const element = elements.find(e => e.id === currentDrawId.current);
      if (element) {
        socket.emit("element-update", element);
      }
    }
    currentDrawId.current = null;
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseOut={handleMouseUp}
      className={tool === "eraser" ? "canvas-eraser" : "canvas-pencil"}
      style={{ pointerEvents: canEdit ? 'auto' : 'none' }} // Ensure no click events slip through if they can't edit
    />
  );
};

export default Whiteboard;