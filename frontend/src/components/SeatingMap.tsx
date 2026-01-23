import React, { useEffect, useMemo, useRef, useState } from "react";
import { RoomLayout, SeatingConfig, TableMeta } from "../types";

interface Props {
  room: RoomLayout;
  seatingConfig: SeatingConfig;
  isBuyout?: boolean;
  onChange: (config: SeatingConfig) => void;
}

const SeatingMap: React.FC<Props> = ({ room, seatingConfig, isBuyout, onChange }) => {
  const [hovered, setHovered] = useState<{ table: TableMeta; x: number; y: number } | null>(null);
  const tables = room.tables || [];
  const [selected, setSelected] = useState<Set<string>>(new Set(seatingConfig.selectedTableIds || []));
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState(560);
  const gridSize = room.gridSize || 20;

  useEffect(() => {
    setSelected(new Set(seatingConfig.selectedTableIds || []));
  }, [seatingConfig.selectedTableIds]);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        const max = width < 680 ? width : Math.min(width, 720);
        setSize(Math.max(280, max));
      }
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const cell = size / gridSize;

  const areaNameById = useMemo(() => {
    return new Map((room.areas || []).map((area) => [area.id, area.name]));
  }, [room.areas]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      onChange({ ...seatingConfig, selectedTableIds: Array.from(next) });
      return next;
    });
  };

  return (
    <div className="card">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
          <div>
            <h3 className="h5 mb-1">Seating Map</h3>
            <p className="text-muted mb-0">
              Please select your ideal seating arrangement in the room you have chosen for your guest count.
            </p>
          </div>
          {isBuyout && <span className="badge text-bg-warning">Buyout editor coming next</span>}
        </div>
      </div>
      <div
        ref={containerRef}
        className="seating-grid"
        style={{ width: size, height: size, margin: "0 auto" }}
      >
        <svg className="grid-lines" viewBox={`0 0 ${gridSize} ${gridSize}`}>
          {[...Array(gridSize + 1)].map((_, idx) => (
            <line key={`h-${idx}`} x1={0} y1={idx} x2={gridSize} y2={idx} />
          ))}
          {[...Array(gridSize + 1)].map((_, idx) => (
            <line key={`v-${idx}`} x1={idx} y1={0} x2={idx} y2={gridSize} />
          ))}
          {(room.areas || []).flatMap((area) =>
            (area.lines || []).map((line, idx) => (
              <line
                key={`${area.id}-line-${idx}`}
                x1={line.x1 + 0.5}
                y1={line.y1 + 0.5}
                x2={line.x2 + 0.5}
                y2={line.y2 + 0.5}
                className="grid-area-line"
              />
            ))
          )}
        </svg>

        {tables.map((table) => {
          const selectedState = selected.has(table.id);
          return (
            <div
              key={table.id}
              className={`grid-table seating-table ${selectedState ? "selected" : ""}`}
              style={{
                left: table.x * cell,
                top: table.y * cell,
                width: table.width * cell,
                height: table.height * cell,
              }}
              onClick={() => toggleSelect(table.id)}
              onMouseEnter={(e) => {
                const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                setHovered({
                  table,
                  x: rect.left + rect.width / 2,
                  y: rect.top,
                });
              }}
              onMouseLeave={() => setHovered(null)}
            >
              <div className="grid-table-label">{table.label}</div>
              <div className="grid-table-seats">{table.seats}</div>
            </div>
          );
        })}

        {hovered && (
          <div
            className="table-tooltip"
            style={{
              left: hovered.x,
              top: hovered.y,
            }}
          >
            <strong>Table {hovered.table.label}</strong>
            <div>{hovered.table.seats} seats</div>
            <div className="text-uppercase small">
              {areaNameById.get(hovered.table.areaId || "") || "Main"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeatingMap;
