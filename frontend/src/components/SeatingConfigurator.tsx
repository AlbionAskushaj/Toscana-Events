import React, { useEffect, useMemo, useState } from "react";
import { RoomLayout, SeatingConfig } from "../types";
import SeatingMap from "./SeatingMap";

interface Props {
  rooms: RoomLayout[];
  roomLayoutId: string;
  seatingConfig: SeatingConfig;
  isBuyout?: boolean;
  guestCount: number;
  onChange: (roomLayoutId: string, seatingConfig: SeatingConfig) => void;
  showRoomSelect?: boolean;
}

const SeatingConfigurator: React.FC<Props> = ({
  rooms,
  roomLayoutId,
  seatingConfig,
  isBuyout,
  guestCount,
  onChange,
  showRoomSelect = true,
}) => {
  const [autoAssign, setAutoAssign] = useState(false);
  const availableRooms = rooms;
  const selectedRoom = rooms.find((room) => room._id === roomLayoutId) || rooms[0];

  const handleRoomChange = (id: string) => {
    const room = rooms.find((r) => r._id === id);
    if (room) {
      onChange(id, room.defaultTableConfig);
    } else {
      onChange(id, seatingConfig);
    }
  };

  const tables = selectedRoom?.tables || [];
  const selectedTableIds = seatingConfig.selectedTableIds || [];

  const tableById = useMemo(() => new Map(tables.map((t) => [t.id, t])), [tables]);
  const selectedTables = selectedTableIds.map((id) => tableById.get(id)).filter(Boolean);
  const totalSeats = selectedTables.reduce((sum, table) => sum + (table?.seats || 0), 0);

  const capacityUsage = selectedRoom ? Math.min(totalSeats / selectedRoom.capacity, 1) : 0;

  const capacityWarning = selectedRoom && totalSeats > selectedRoom.capacity;
  const guestWarning = guestCount > 0 && totalSeats < guestCount;

  const areaNameById = useMemo(() => {
    return new Map((selectedRoom?.areas || []).map((area) => [area.id, area.name]));
  }, [selectedRoom?.areas]);

  const applySelection = (selected: string[]) => {
    const nextTables = selected.map((id) => tableById.get(id)).filter(Boolean);
    const nextConfig: SeatingConfig = {
      ...seatingConfig,
      selectedTableIds: selected,
      tablesFor2: nextTables.filter((t) => (t?.seats || 0) <= 2).length,
      tablesFor4: nextTables.filter((t) => (t?.seats || 0) > 2 && (t?.seats || 0) <= 4).length,
      tablesFor6: nextTables.filter((t) => (t?.seats || 0) > 4 && (t?.seats || 0) <= 6).length,
      longTables: nextTables.filter((t) => (t?.seats || 0) > 6).length,
    };
    onChange(selectedRoom?._id || "", nextConfig);
  };

  const autoAssignTables = () => {
    if (!selectedRoom || guestCount <= 0) {
      applySelection([]);
      return;
    }
    const sorted = [...tables].sort((a, b) => b.seats - a.seats);
    const picked: string[] = [];
    let total = 0;
    for (const table of sorted) {
      if (total >= guestCount) break;
      picked.push(table.id);
      total += table.seats;
    }
    applySelection(picked);
  };

  useEffect(() => {
    if (!autoAssign) return;
    const current = (seatingConfig.selectedTableIds || []).slice().sort().join(",");
    const sorted = [...tables].sort((a, b) => b.seats - a.seats);
    const picked: string[] = [];
    let total = 0;
    for (const table of sorted) {
      if (total >= guestCount) break;
      picked.push(table.id);
      total += table.seats;
    }
    const next = picked.slice().sort().join(",");
    if (current !== next) {
      applySelection(picked);
    }
  }, [autoAssign, guestCount, selectedRoom?._id, tables]);

  const groupedTables = useMemo(() => {
    const groups = new Map<string, string[]>();
    tables.forEach((table) => {
      const name = areaNameById.get(table.areaId || "") || "Main";
      const current = groups.get(name) || [];
      current.push(table.id);
      groups.set(name, current);
    });
    return groups;
  }, [tables, areaNameById]);

  return (
    <div className="card">
      <div className="card-body">
        <p className="text-muted mb-3">Not sure about seating? Leave auto-assign on and we’ll refine it later.</p>
        <div className="row g-3">
          {showRoomSelect && (
            <div className="col-12 col-lg-6">
              <label className="form-label">Select Room</label>
              <select className="form-select" value={selectedRoom?._id || ""} onChange={(e) => handleRoomChange(e.target.value)}>
                {availableRooms.map((room) => (
                  <option key={room._id} value={room._id}>
                    {room.name} (Capacity {room.capacity})
                  </option>
                ))}
              </select>
            </div>
          )}
          {selectedRoom && (
            <div className={`col-12 ${showRoomSelect ? "col-lg-6" : ""}`}>
              <h3 className="h6 mb-1">{selectedRoom.name}</h3>
              <p className="text-muted mb-0">{selectedRoom.description}</p>
            </div>
          )}
        </div>

        <div className="mt-3">
          <div className="d-flex align-items-center gap-3 flex-wrap">
            <span>
              Selected seats: <strong>{totalSeats}</strong> / {selectedRoom?.capacity || "?"}
            </span>
            <div className="progress flex-grow-1" style={{ minWidth: 200, height: 8 }}>
              <div
                className={`progress-bar ${capacityWarning ? "bg-danger" : "bg-success"}`}
                role="progressbar"
                style={{ width: `${capacityUsage * 100}%` }}
                aria-valuenow={capacityUsage * 100}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>
        </div>
        {guestWarning && <div className="alert alert-warning mt-2">Seats are below guest count. Add more tables.</div>}
        {capacityWarning && <div className="alert alert-danger mt-2">Layout exceeds room capacity.</div>}

        <div className="d-flex gap-2 flex-wrap mt-3">
          <button
            className="btn btn-outline-secondary btn-sm"
            type="button"
            onClick={() => setAutoAssign((prev) => !prev)}
          >
            {autoAssign ? "Customize seating" : "Use auto-assign"}
          </button>
          {!autoAssign && (
            <button
              className="btn btn-outline-secondary btn-sm"
              type="button"
              onClick={() => applySelection([])}
              disabled={selectedTableIds.length === 0}
            >
              Clear selection
            </button>
          )}
        </div>

        <div className="mt-3">
          <div className="text-uppercase text-muted small mb-2">Selected tables by area</div>
          {groupedTables.size === 0 && <div className="text-muted">No tables available.</div>}
          {Array.from(groupedTables.entries()).map(([area, ids]) => {
            const selectedInArea = ids.filter((id) => selectedTableIds.includes(id));
            const selectedLabels = selectedInArea
              .map((id) => tableById.get(id)?.label || id)
              .filter(Boolean);
            return (
              <div key={area} className="mb-2">
                <strong className="text-muted text-uppercase small">{area}</strong>
                <div>
                  {selectedLabels.length > 0 ? selectedLabels.join(", ") : <span className="text-muted">None</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {!autoAssign && selectedRoom?.tables && selectedRoom.tables.length > 0 && (
        <SeatingMap
          room={selectedRoom}
          seatingConfig={seatingConfig}
          isBuyout={isBuyout}
          onChange={(config) => applySelection(config.selectedTableIds || [])}
        />
      )}
    </div>
  );
};

export default SeatingConfigurator;
