import "./room.css";
import { useState, useRef, useEffect } from "react";
import Whiteboard from "../../components/WhiteBoard/whiteboard";
import { useNavigate } from "react-router-dom";

const Room = ({ userId, socket }) => {
  const [tool, setTool] = useState("pencil");
  const [color, setColor] = useState("#3b82f6");
  const [elements, setElements] = useState([]);
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [size, setSize] = useState(2);
  const [members, setMembers] = useState([]);
  
  // Local state dictating if this specific user is allowed to edit.
  // The host (`presenter: true`) is always true by default.
  const [canEdit, setCanEdit] = useState(userId?.presenter || false);

  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Member tracking for host / everyone
    socket.on("update-members", (updatedMembers) => {
      setMembers(updatedMembers);
    });

    socket.on("approved-to-edit", () => {
      setCanEdit(true);
    });

    socket.on("kicked", () => {
      alert("You have been banned from this room by the host.");
      navigate("/");
    });

    return () => {
      socket.off("update-members");
      socket.off("approved-to-edit");
      socket.off("kicked");
    };
  }, [socket, navigate]);

  const handleUndo = () => {
    if (history.length === 0) return;
    const lastState = history[history.length - 1];
    setRedoStack((prev) => [elements, ...prev]);
    setElements(lastState);
    setHistory((prev) => prev.slice(0, -1));
    
    // Broadcast undone state globally to sync everyone
    socket.emit("whiteboard-undo", lastState);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const nextState = redoStack[0];
    setElements(nextState);
    setRedoStack((prev) => prev.slice(1));
    setHistory((prev) => [...prev, nextState]);
    
    // Broadcast redone state
    socket.emit("whiteboard-undo", nextState);
  };

  const handleClear = () => {
    setElements([]);     
    setHistory([]);      
    setRedoStack([]);    
    socket.emit("whiteboard-clear");
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `whiteboard-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  const handleApprove = (targetUserId) => {
    socket.emit("approve-user", { roomId: userId.roomId, targetUserId });
  };

  const handleKick = (targetUserId) => {
    socket.emit("kick-user", { roomId: userId.roomId, targetUserId });
  };

  const tools = [
    { id: "pencil", label: "✏️ Pencil" },
    { id: "eraser", label: "🧽 Eraser" },
    { id: "line", label: "📏 Line" },
    { id: "rectangle", label: "⬛ Rectangle" },
    { id: "circle", label: "⭕ Circle" },
  ];

  return (
    <div className="container-fluid d-flex flex-row p-0 m-0" style={{ height: '100vh', overflow: 'hidden', background: 'var(--bg-main)' }}>
      
      {/* LEFT SIDE: FULL WHITEBOARD */}
      <div className="flex-grow-1 position-relative d-flex justify-content-center align-items-center p-4">
        <div className="whiteboard-container w-100 h-100 d-flex justify-content-center align-items-center">
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
              canEdit={canEdit}
              socket={socket}
            />
        </div>
      </div>

      {/* RIGHT SIDEBAR: TOOLS & MEMBERS */}
      <div className="sidebar shadow-lg bg-white d-flex flex-column border-start" style={{ width: '380px', height: '100%', zIndex: 10 }}>
        <div className="p-4 border-bottom">
            <h4 className="fw-bold text-center mb-0" style={{ color: 'var(--text-main)' }}>🛠️ Workspace Controls</h4>
        </div>
        
        <div className="flex-grow-1 overflow-auto p-4 d-flex flex-column gap-4">
            {/* Tools Area - Only visible if user has permission to edit */}
            <div className="glass-panel p-3">
                <h6 className="fw-bold text-muted mb-3">Drawing Tools</h6>
                {!canEdit ? (
                    <div className="alert alert-warning p-2 text-center small mb-0 rounded" style={{ fontSize: '0.85rem' }}>
                        You must be approved by the host to draw.
                    </div>
                ) : (
                    <>
                        <div className="d-flex flex-wrap gap-2 mb-4">
                        {tools.map((t) => (
                            <button
                            key={t.id}
                            className={`btn btn-sm flex-grow-1 ${tool === t.id ? 'btn-primary' : 'btn-outline-secondary'}`}
                            onClick={() => setTool(t.id)}
                            style={{ fontWeight: 500 }}
                            >
                            {t.label}
                            </button>
                        ))}
                        </div>

                        <div className="d-flex align-items-center justify-content-between mb-4">
                            <div className="d-flex flex-column w-50 pe-2 border-end">
                                <label className="text-muted small fw-bold mb-1">Thickness: {size}</label>
                                <input
                                type="range"
                                min="1"
                                max="10"
                                value={size}
                                className="form-range"
                                onChange={(e) => setSize(e.target.value)}
                                />
                            </div>

                            <div className="d-flex flex-column align-items-center w-50 ps-2">
                                <label htmlFor="color" className="text-muted small fw-bold mb-1">Color</label>
                                <input
                                type="color"
                                id="color"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                title="Choose Color"
                                style={{ width: '40px', height: '30px', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
                                />
                            </div>
                        </div>

                        <div className="d-flex gap-2">
                            <button className="btn btn-sm btn-outline-secondary flex-grow-1" onClick={handleUndo} title="Undo">↩️</button>
                            <button className="btn btn-sm btn-outline-secondary flex-grow-1" onClick={handleRedo} title="Redo">↪️</button>
                            <button className="btn btn-sm btn-danger flex-grow-1" onClick={handleClear} title="Clear Board">🗑</button>
                            <button className="btn btn-sm btn-success flex-grow-1" onClick={handleDownload} title="Save Image">💾</button>
                        </div>
                    </>
                )}
            </div>

            {/* Host Area: Member Management */}
            {userId?.presenter && (
                <div className="glass-panel p-3 flex-grow-1">
                    <h6 className="fw-bold text-muted mb-3">Room Members ({members.length})</h6>
                    <ul className="list-group list-group-flush">
                        {members.map(member => (
                            <li key={member.userId} className="list-group-item bg-transparent px-0 py-2 d-flex justify-content-between align-items-center border-bottom">
                                <div>
                                    <span className="fw-bold text-dark d-block" style={{ fontSize: '0.9rem' }}>{member.name} {member.userId === userId.userId && '(You)'}</span>
                                    <span className="text-muted small">{member.canEdit ? "Can Edit ✅" : "Viewing 👁️"}</span>
                                </div>
                                {member.userId !== userId.userId && (
                                    <div className="d-flex gap-1">
                                        {!member.canEdit && (
                                            <button className="btn btn-sm btn-success" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }} onClick={() => handleApprove(member.userId)}>Approve</button>
                                        )}
                                        <button className="btn btn-sm btn-danger" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }} onClick={() => handleKick(member.userId)}>Kick</button>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Room;