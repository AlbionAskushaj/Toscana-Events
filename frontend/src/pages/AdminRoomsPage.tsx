import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { adminCreateRoom, adminDeleteRoom, adminUpdateRoom, getRooms } from "../api";
import { RoomLayout, TableArea, TableMeta, AreaLine } from "../types";

const GRID_SIZE = 20;

type RoomDraft = {
  _id?: string;
  name: string;
  capacity: number;
  description: string;
  tables: TableMeta[];
  areas: TableArea[];
};

type Tool = "select" | "table" | "line";

type TableDraft = {
  label: string;
  seats: number;
  width: number;
  height: number;
  areaId?: string;
};

const emptyRoom = (): RoomDraft => ({
  name: "",
  capacity: 0,
  description: "",
  tables: [],
  areas: [],
});

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const AdminRoomsPage = () => {
  const [rooms, setRooms] = useState<RoomLayout[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [draft, setDraft] = useState<RoomDraft>(emptyRoom());
  const [tool, setTool] = useState<Tool>("select");
  const [activeAreaId, setActiveAreaId] = useState<string | undefined>(undefined);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [selectedLine, setSelectedLine] = useState<{ areaId: string; index: number } | null>(null);
  const [tableDraft, setTableDraft] = useState<TableDraft>({
    label: "",
    seats: 4,
    width: 1,
    height: 1,
    areaId: undefined,
  });
  const [lineStart, setLineStart] = useState<{ x: number; y: number } | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const loadRooms = async () => {
    try {
      const data = await getRooms();
      setRooms(data);
      if (data.length > 0 && !selectedRoomId) {
        selectRoom(data[0]);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load rooms");
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const selectRoom = (room: RoomLayout) => {
    setSelectedRoomId(room._id);
    setDraft({
      _id: room._id,
      name: room.name,
      capacity: room.capacity,
      description: room.description,
      tables: room.tables || [],
      areas: room.areas || [],
    });
    setActiveAreaId(room.areas?.[0]?.id);
    setSelectedTableId(null);
    setSelectedLine(null);
    setNotice("");
    setError("");
  };

  const handleCreateRoom = () => {
    setDraft(emptyRoom());
    setSelectedRoomId(null);
    setSelectedTableId(null);
    setSelectedLine(null);
  };

  const handleSaveRoom = async () => {
    if (!draft.name || !draft.capacity) {
      setError("Room name and capacity are required.");
      return;
    }

    try {
      if (draft._id) {
        const updated = await adminUpdateRoom(draft._id, draft);
        setRooms((prev) => prev.map((room) => (room._id === updated._id ? updated : room)));
        setNotice("Room updated.");
      } else {
        const created = await adminCreateRoom(draft);
        setRooms((prev) => [created, ...prev]);
        selectRoom(created);
        setNotice("Room created.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to save room.");
    }
  };

  const handleDeleteRoom = async () => {
    if (!draft._id) return;
    if (!confirm("Delete this room layout?")) return;
    try {
      await adminDeleteRoom(draft._id);
      setRooms((prev) => prev.filter((room) => room._id !== draft._id));
      setDraft(emptyRoom());
      setSelectedRoomId(null);
      setNotice("Room deleted.");
    } catch (err) {
      console.error(err);
      setError("Failed to delete room.");
    }
  };

  const areaOptions = useMemo(() => draft.areas, [draft.areas]);

  const selectedTable = useMemo(
    () => draft.tables.find((table) => table.id === selectedTableId) || null,
    [draft.tables, selectedTableId]
  );

  const updateTable = (id: string, updates: Partial<TableMeta>) => {
    setDraft((prev) => ({
      ...prev,
      tables: prev.tables.map((table) => (table.id === id ? { ...table, ...updates } : table)),
    }));
  };

  const handleDeleteTable = () => {
    if (!selectedTableId) return;
    setDraft((prev) => ({
      ...prev,
      tables: prev.tables.filter((table) => table.id !== selectedTableId),
    }));
    setSelectedTableId(null);
  };

  const addArea = () => {
    const id = createId();
    const name = `Area ${draft.areas.length + 1}`;
    const next = { id, name, lines: [] };
    setDraft((prev) => ({ ...prev, areas: [...prev.areas, next] }));
    setActiveAreaId(id);
  };

  const removeArea = (id: string) => {
    setDraft((prev) => ({
      ...prev,
      areas: prev.areas.filter((area) => area.id !== id),
      tables: prev.tables.map((table) => (table.areaId === id ? { ...table, areaId: undefined } : table)),
    }));
    if (activeAreaId === id) {
      setActiveAreaId(draft.areas.find((area) => area.id !== id)?.id);
    }
    if (selectedLine?.areaId === id) {
      setSelectedLine(null);
    }
  };

  const updateAreaName = (id: string, name: string) => {
    setDraft((prev) => ({
      ...prev,
      areas: prev.areas.map((area) => (area.id === id ? { ...area, name } : area)),
    }));
  };

  const addLine = (line: AreaLine, areaId: string) => {
    setDraft((prev) => {
      const nextAreas = prev.areas.map((area) =>
        area.id === areaId
          ? { ...area, lines: [...(area.lines || []), line] }
          : area
      );
      const target = nextAreas.find((area) => area.id === areaId);
      const index = target?.lines ? target.lines.length - 1 : 0;
      setSelectedLine({ areaId, index });
      return { ...prev, areas: nextAreas };
    });
  };

  const removeLine = (areaId: string, index: number) => {
    setDraft((prev) => ({
      ...prev,
      areas: prev.areas.map((area) =>
        area.id === areaId
          ? { ...area, lines: (area.lines || []).filter((_, idx) => idx !== index) }
          : area
      ),
    }));
    setSelectedLine(null);
  };

  const handleCanvasClick = (x: number, y: number) => {
    setError("");
    setSelectedLine(null);
    if (tool === "line") {
      if (!activeAreaId) {
        setError("Select an area to draw lines.");
        return;
      }
      if (!lineStart) {
        setLineStart({ x, y });
        return;
      }
      const line = { x1: lineStart.x, y1: lineStart.y, x2: x, y2: y };
      if (line.x1 !== line.x2 && line.y1 !== line.y2) {
        setError("Lines must be horizontal or vertical.");
        setLineStart(null);
        return;
      }
      addLine(line, activeAreaId);
      setLineStart(null);
      return;
    }

    if (tool === "table") {
      const width = clamp(tableDraft.width, 1, GRID_SIZE);
      const height = clamp(tableDraft.height, 1, GRID_SIZE);
      const xPos = clamp(x, 0, GRID_SIZE - width);
      const yPos = clamp(y, 0, GRID_SIZE - height);

      const overlaps = draft.tables.some((table) => {
        const xOverlap = xPos < table.x + table.width && xPos + width > table.x;
        const yOverlap = yPos < table.y + table.height && yPos + height > table.y;
        return xOverlap && yOverlap;
      });

      if (overlaps) {
        setError("That placement overlaps an existing table.");
        return;
      }

      const newTable: TableMeta = {
        id: createId(),
        label: tableDraft.label || `T${draft.tables.length + 1}`,
        seats: tableDraft.seats,
        shape: "rect",
        x: xPos,
        y: yPos,
        width,
        height,
        areaId: tableDraft.areaId || activeAreaId,
      };

      setDraft((prev) => ({ ...prev, tables: [...prev.tables, newTable] }));
      setSelectedTableId(newTable.id);
      setTool("select");
      return;
    }
  };

  const moveTable = (id: string, x: number, y: number) => {
    const moving = draft.tables.find((table) => table.id === id);
    if (!moving) return;
    const next = { ...moving, x, y };
    const overlaps = draft.tables.some((table) => {
      if (table.id === id) return false;
      const xOverlap = next.x < table.x + table.width && next.x + next.width > table.x;
      const yOverlap = next.y < table.y + table.height && next.y + next.height > table.y;
      return xOverlap && yOverlap;
    });
    if (overlaps) return;
    updateTable(id, { x, y });
  };

  return (
    <div className="page page-admin-rooms">
      <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
        <div>
          <p className="eyebrow mb-1">Admin</p>
          <h2 className="mb-0">Room Layouts</h2>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <Link className="btn btn-outline-secondary" to="/admin/inquiries">
            Inquiries
          </Link>
          <Link className="btn btn-outline-secondary" to="/admin/menu">
            Menu
          </Link>
          <Link className="btn btn-outline-secondary" to="/admin/templates">
            Templates
          </Link>
          <Link className="btn btn-primary" to="/admin/rooms">
            Rooms
          </Link>
        </div>
      </div>

      {error && <div className="alert alert-warning">{error}</div>}
      {notice && <div className="alert alert-success">{notice}</div>}

      <div className="row g-4">
        <div className="col-12 col-xl-3">
          <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h3 className="h6 mb-0">Rooms</h3>
                <button className="btn btn-outline-primary btn-sm" onClick={handleCreateRoom}>
                  New
                </button>
              </div>
              <div className="list-group">
                {rooms.map((room) => (
                  <button
                    key={room._id}
                    className={`list-group-item list-group-item-action ${room._id === selectedRoomId ? "active" : ""}`}
                    onClick={() => selectRoom(room)}
                  >
                    <div className="fw-semibold">{room.name}</div>
                    <div className="small text-muted">Capacity {room.capacity}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-9">
          <div className="card">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label">Room Name</label>
                  <input
                    className="form-control"
                    value={draft.name}
                    onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="col-12 col-md-3">
                  <label className="form-label">Capacity</label>
                  <input
                    className="form-control"
                    type="number"
                    value={draft.capacity}
                    onChange={(e) => setDraft((prev) => ({ ...prev, capacity: Number(e.target.value) }))}
                  />
                </div>
                <div className="col-12 col-md-3">
                  <label className="form-label">Grid Size</label>
                  <input className="form-control" value={`${GRID_SIZE} x ${GRID_SIZE}`} readOnly />
                </div>
                <div className="col-12">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    value={draft.description}
                    onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>
              </div>

              <div className="d-flex gap-2 mt-3 flex-wrap">
                <button className="btn btn-primary" onClick={handleSaveRoom}>
                  Save Room
                </button>
                <button className="btn btn-outline-danger" onClick={handleDeleteRoom} disabled={!draft._id}>
                  Delete Room
                </button>
              </div>
            </div>
          </div>

          <div className="row g-4 mt-1">
            <div className="col-12 col-lg-4">
              <div className="card h-100">
                <div className="card-body">
                  <h3 className="h6">Tools</h3>
                  <div className="btn-group w-100 mb-3">
                    {(["select", "table", "line"] as Tool[]).map((value) => (
                      <button
                        key={value}
                        className={`btn btn-outline-secondary ${tool === value ? "active" : ""}`}
                        onClick={() => setTool(value)}
                      >
                        {value === "select" ? "Select" : value === "table" ? "Add Table" : "Draw Line"}
                      </button>
                    ))}
                  </div>

                  <h4 className="h6">Areas</h4>
                  <div className="list-group mb-2">
                    {areaOptions.map((area) => (
                      <div key={area.id} className="list-group-item">
                        <div className="d-flex justify-content-between align-items-center gap-2">
                          <input
                            className="form-control form-control-sm"
                            value={area.name}
                            onChange={(e) => updateAreaName(area.id, e.target.value)}
                          />
                          <button className="btn btn-outline-danger btn-sm" onClick={() => removeArea(area.id)}>
                            Remove
                          </button>
                        </div>
                        <div className="form-check mt-2">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="active-area"
                            checked={activeAreaId === area.id}
                            onChange={() => setActiveAreaId(area.id)}
                          />
                          <label className="form-check-label">Use this area</label>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="btn btn-outline-primary btn-sm" onClick={addArea}>
                    Add Area
                  </button>
                  {selectedLine && (
                    <button
                      className="btn btn-outline-danger btn-sm mt-2"
                      onClick={() => removeLine(selectedLine.areaId, selectedLine.index)}
                    >
                      Delete Selected Line
                    </button>
                  )}

                  <hr />

                  <h4 className="h6">New Table</h4>
                  <div className="row g-2">
                    <div className="col-6">
                      <label className="form-label">Label</label>
                      <input
                        className="form-control form-control-sm"
                        value={tableDraft.label}
                        onChange={(e) => setTableDraft((prev) => ({ ...prev, label: e.target.value }))}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label">Seats</label>
                      <input
                        className="form-control form-control-sm"
                        type="number"
                        value={tableDraft.seats}
                        onChange={(e) => setTableDraft((prev) => ({ ...prev, seats: Number(e.target.value) }))}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label">Width</label>
                      <input
                        className="form-control form-control-sm"
                        type="number"
                        value={tableDraft.width}
                        onChange={(e) => setTableDraft((prev) => ({ ...prev, width: Number(e.target.value) }))}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label">Height</label>
                      <input
                        className="form-control form-control-sm"
                        type="number"
                        value={tableDraft.height}
                        onChange={(e) => setTableDraft((prev) => ({ ...prev, height: Number(e.target.value) }))}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Area</label>
                      <select
                        className="form-select form-select-sm"
                        value={tableDraft.areaId || ""}
                        onChange={(e) => setTableDraft((prev) => ({ ...prev, areaId: e.target.value || undefined }))}
                      >
                        <option value="">Unassigned</option>
                        {areaOptions.map((area) => (
                          <option key={area.id} value={area.id}>
                            {area.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  <div className="d-flex justify-content-end mt-2">
                    <button className="btn btn-outline-primary btn-sm" type="button" onClick={() => setTool("table")}>
                      Place table on grid
                    </button>
                  </div>
                  <div className="text-muted small mt-1">Then click a grid cell to place it.</div>
                  </div>

                  {selectedTable && (
                    <>
                      <hr />
                      <h4 className="h6">Selected Table</h4>
                      <div className="row g-2">
                        <div className="col-6">
                          <label className="form-label">Label</label>
                          <input
                            className="form-control form-control-sm"
                            value={selectedTable.label}
                            onChange={(e) => updateTable(selectedTable.id, { label: e.target.value })}
                          />
                        </div>
                        <div className="col-6">
                          <label className="form-label">Seats</label>
                          <input
                            className="form-control form-control-sm"
                            type="number"
                            value={selectedTable.seats}
                            onChange={(e) => updateTable(selectedTable.id, { seats: Number(e.target.value) })}
                          />
                        </div>
                        <div className="col-6">
                          <label className="form-label">X</label>
                          <input
                            className="form-control form-control-sm"
                            type="number"
                            value={selectedTable.x}
                            onChange={(e) => updateTable(selectedTable.id, { x: Number(e.target.value) })}
                          />
                        </div>
                        <div className="col-6">
                          <label className="form-label">Y</label>
                          <input
                            className="form-control form-control-sm"
                            type="number"
                            value={selectedTable.y}
                            onChange={(e) => updateTable(selectedTable.id, { y: Number(e.target.value) })}
                          />
                        </div>
                        <div className="col-6">
                          <label className="form-label">Width</label>
                          <input
                            className="form-control form-control-sm"
                            type="number"
                            value={selectedTable.width}
                            onChange={(e) => updateTable(selectedTable.id, { width: Number(e.target.value) })}
                          />
                        </div>
                        <div className="col-6">
                          <label className="form-label">Height</label>
                          <input
                            className="form-control form-control-sm"
                            type="number"
                            value={selectedTable.height}
                            onChange={(e) => updateTable(selectedTable.id, { height: Number(e.target.value) })}
                          />
                        </div>
                        <div className="col-12">
                          <label className="form-label">Area</label>
                          <select
                            className="form-select form-select-sm"
                            value={selectedTable.areaId || ""}
                            onChange={(e) => updateTable(selectedTable.id, { areaId: e.target.value || undefined })}
                          >
                            <option value="">Unassigned</option>
                            {areaOptions.map((area) => (
                              <option key={area.id} value={area.id}>
                                {area.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="d-flex justify-content-end mt-2">
                        <button className="btn btn-outline-danger btn-sm" onClick={handleDeleteTable}>
                          Delete Table
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="col-12 col-lg-8">
              <div className="card">
                <div className="card-body">
                  <div className="grid-editor">
                    <GridCanvas
                      tables={draft.tables}
                      areas={draft.areas}
                      gridSize={GRID_SIZE}
                      activeAreaId={activeAreaId}
                      tool={tool}
                      selectedLine={selectedLine}
                      onCellClick={handleCanvasClick}
                      onSelectTable={(id) => {
                        setSelectedTableId(id);
                        setTool("select");
                        setSelectedLine(null);
                      }}
                      onMoveTable={moveTable}
                      onSelectLine={(areaId, index) => {
                        setSelectedLine({ areaId, index });
                        setSelectedTableId(null);
                        setTool("select");
                      }}
                    />
                  </div>
                  {lineStart && tool === "line" && (
                    <div className="text-muted small mt-2">Select an end cell to finish the line.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

type GridCanvasProps = {
  tables: TableMeta[];
  areas: TableArea[];
  gridSize: number;
  tool: Tool;
  activeAreaId?: string;
  selectedLine: { areaId: string; index: number } | null;
  onCellClick: (x: number, y: number) => void;
  onSelectTable: (id: string) => void;
  onMoveTable: (id: string, x: number, y: number) => void;
  onSelectLine: (areaId: string, index: number) => void;
};

const GridCanvas = ({
  tables,
  areas,
  gridSize,
  tool,
  activeAreaId,
  selectedLine,
  onCellClick,
  onSelectTable,
  onMoveTable,
  onSelectLine,
}: GridCanvasProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState(600);
  const dragRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const tableMap = useMemo(() => new Map(tables.map((table) => [table.id, table])), [tables]);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setSize(entry.contentRect.width);
      }
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const cell = size / gridSize;

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = clamp(Math.floor((event.clientX - rect.left) / cell), 0, gridSize - 1);
    const y = clamp(Math.floor((event.clientY - rect.top) / cell), 0, gridSize - 1);
    onCellClick(x, y);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const table = tableMap.get(dragRef.current.id);
    if (!table) return;
    const pxX = event.clientX - rect.left - dragRef.current.offsetX;
    const pxY = event.clientY - rect.top - dragRef.current.offsetY;
    const x = clamp(Math.round(pxX / cell), 0, gridSize - table.width);
    const y = clamp(Math.round(pxY / cell), 0, gridSize - table.height);
    onMoveTable(table.id, x, y);
  };

  const handleMouseUp = () => {
    dragRef.current = null;
  };

  return (
    <div
      ref={containerRef}
      className="grid-canvas"
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <svg className="grid-lines" viewBox={`0 0 ${gridSize} ${gridSize}`}>
        {[...Array(gridSize + 1)].map((_, idx) => (
          <line key={`h-${idx}`} x1={0} y1={idx} x2={gridSize} y2={idx} />
        ))}
        {[...Array(gridSize + 1)].map((_, idx) => (
          <line key={`v-${idx}`} x1={idx} y1={0} x2={idx} y2={gridSize} />
        ))}
        {areas.flatMap((area) =>
          (area.lines || []).map((line, idx) => (
            <line
              key={`${area.id}-line-${idx}`}
              x1={line.x1 + 0.5}
              y1={line.y1 + 0.5}
              x2={line.x2 + 0.5}
              y2={line.y2 + 0.5}
              className={`grid-area-line ${area.id === activeAreaId ? "active" : ""} ${
                selectedLine?.areaId === area.id && selectedLine?.index === idx ? "selected" : ""
              }`}
              onClick={(event) => {
                event.stopPropagation();
                onSelectLine(area.id, idx);
              }}
            />
          ))
        )}
      </svg>
      {tables.map((table) => (
        <div
          key={table.id}
          className="grid-table"
          style={{
            left: table.x * cell,
            top: table.y * cell,
            width: table.width * cell,
            height: table.height * cell,
          }}
          onClick={(event) => {
            event.stopPropagation();
            onSelectTable(table.id);
          }}
          onMouseDown={(event) => {
            if (tool !== "select") return;
            event.stopPropagation();
            const rect = (event.currentTarget as HTMLDivElement).getBoundingClientRect();
            dragRef.current = {
              id: table.id,
              offsetX: event.clientX - rect.left,
              offsetY: event.clientY - rect.top,
            };
            onSelectTable(table.id);
          }}
          title={`${table.label} · ${table.seats} seats`}
        >
          <div className="grid-table-label">{table.label}</div>
          <div className="grid-table-seats">{table.seats}</div>
        </div>
      ))}
      {tool === "line" && <div className="grid-tool-hint">Line tool active</div>}
    </div>
  );
};

export default AdminRoomsPage;
