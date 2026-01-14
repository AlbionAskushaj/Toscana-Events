import { useEffect, useState } from "react";
import { adminGetInquiries, adminUpdateInquiryStatus, getMenuItems, getRooms } from "../api";
import { EventInquiry, InquiryStatus, MenuItem, RoomLayout } from "../types";
import { Link } from "react-router-dom";

const statusOptions: InquiryStatus[] = ["new", "reviewing", "approved", "declined", "completed"];

const AdminInquiriesPage = () => {
  const [inquiries, setInquiries] = useState<EventInquiry[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [rooms, setRooms] = useState<RoomLayout[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const [data, itemData, roomData] = await Promise.all([
        adminGetInquiries(),
        getMenuItems(),
        getRooms(),
      ]);
      setInquiries(data);
      setMenuItems(itemData);
      setRooms(roomData);
    } catch (err) {
      console.error(err);
      setError("Failed to load inquiries");
    }
  };

  const updateStatus = async (id: string, status: InquiryStatus) => {
    try {
      await adminUpdateInquiryStatus(id, status);
      await load();
    } catch (err) {
      console.error(err);
      setError("Failed to update status");
    }
  };

  const selected = inquiries.find((i) => i._id === selectedId);
  const menuItemById = new Map(menuItems.map((item) => [item._id, item.name]));
  const roomById = new Map(rooms.map((room) => [room._id, room.name]));
  const byEventDate = (list: EventInquiry[]) =>
    [...list].sort((a, b) => {
      const left = `${a.eventDate || ""} ${a.eventTime || ""}`.trim();
      const right = `${b.eventDate || ""} ${b.eventTime || ""}`.trim();
      return left.localeCompare(right);
    });

  const activeInquiries = byEventDate(inquiries.filter((inq) => inq.status !== "completed"));
  const archivedInquiries = byEventDate(inquiries.filter((inq) => inq.status === "completed"));

  return (
    <div className="page page-admin-inquiries">
      <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
        <div>
          <p className="eyebrow mb-1">Admin</p>
          <h2 className="mb-0">Inquiries</h2>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <Link className="btn btn-primary" to="/admin/inquiries">
            Inquiries
          </Link>
          <Link className="btn btn-outline-secondary" to="/admin/menu">
            Menu
          </Link>
          <Link className="btn btn-outline-secondary" to="/admin/templates">
            Templates
          </Link>
          <Link className="btn btn-outline-secondary" to="/admin/rooms">
            Rooms
          </Link>
        </div>
      </div>
      {error && <div className="alert alert-warning">{error}</div>}
      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
          <thead>
            <tr>
              <th>Event Date</th>
              <th>Contact</th>
              <th>Guests</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {activeInquiries.map((inq) => (
              <tr key={inq._id} className={selectedId === inq._id ? "selected" : ""}>
                <td>
                  {inq.eventDate} @ {inq.eventTime}
                </td>
                <td>
                  <strong>{inq.contactName}</strong>
                  <div className="text-muted">{inq.contactEmail}</div>
                </td>
                <td>{inq.guestCount}</td>
                <td>
                  <select
                    className="form-select form-select-sm"
                    value={inq.status}
                    onChange={(e) => updateStatus(inq._id, e.target.value as InquiryStatus)}
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <button className="btn btn-outline-secondary btn-sm" onClick={() => setSelectedId(inq._id)}>
                    View
                  </button>
                </td>
              </tr>
            ))}
            {activeInquiries.length === 0 && (
              <tr>
                <td colSpan={5} className="text-muted">
                  No active inquiries.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      <div className="card mt-3">
        <div className="card-body d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h3 className="h6 mb-0">Event Archive</h3>
          <span className="text-muted small">Completed events</span>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Event Date</th>
                <th>Contact</th>
                <th>Guests</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {archivedInquiries.map((inq) => (
                <tr key={inq._id} className={selectedId === inq._id ? "selected" : ""}>
                  <td>
                    {inq.eventDate} @ {inq.eventTime}
                  </td>
                  <td>
                    <strong>{inq.contactName}</strong>
                    <div className="text-muted">{inq.contactEmail}</div>
                  </td>
                  <td>{inq.guestCount}</td>
                  <td>
                    <span className="badge text-bg-light">Completed</span>
                  </td>
                  <td>
                    <button className="btn btn-outline-secondary btn-sm" onClick={() => setSelectedId(inq._id)}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {archivedInquiries.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-muted">
                    No archived events yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="card mt-3">
          <div className="card-body">
            <h3 className="h5">Inquiry Details</h3>
          <p>
            <strong>{selected.contactName}</strong> · {selected.contactEmail} · {selected.contactPhone}
          </p>
          <p>
            {selected.eventDate} at {selected.eventTime} — {selected.guestCount} guests
          </p>
          <p>Occasion: {selected.occasionType}</p>
          <h4>Menu</h4>
          {selected.menuSelection.courses.map((course) => (
            <div key={course.courseType} className="text-muted">
              <strong>{course.courseType.toUpperCase()}</strong>:{" "}
              {course.itemIds
                .map((id) => menuItemById.get(id) || id)
                .join(", ")}
            </div>
          ))}
          <h4>Seating</h4>
          <ul>
            <li>Room: {roomById.get(selected.roomLayoutId) || selected.roomLayoutId}</li>
            <li>Tables for 2: {selected.seatingConfig.tablesFor2}</li>
            <li>Tables for 4: {selected.seatingConfig.tablesFor4}</li>
            <li>Tables for 6: {selected.seatingConfig.tablesFor6}</li>
            <li>Long tables: {selected.seatingConfig.longTables}</li>
          </ul>
          <h4>Pricing</h4>
          <p>
            Per person ${selected.estimatedPricePerPerson.toFixed(2)} | Total ${selected.estimatedTotal.toFixed(2)}
          </p>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default AdminInquiriesPage;
