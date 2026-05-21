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
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 50;

  useEffect(() => {
    load(page);
  }, [page]);

  const load = async (p: number) => {
    try {
      const [data, itemData, roomData] = await Promise.all([
        adminGetInquiries(p),
        getMenuItems(),
        getRooms(),
      ]);
      setInquiries(data.inquiries);
      setTotal(data.total);
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
      await load(page);
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
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3 page-header">
        <div>
          <p className="eyebrow mb-1">Admin</p>
          <h2 className="mb-0">Inquiries</h2>
        </div>
        <div className="d-flex gap-2 flex-wrap page-header-actions">
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
          <Link className="btn btn-outline-secondary" to="/admin/transcripts">
            Transcripts
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

      {total > limit && (
        <div className="d-flex justify-content-between align-items-center mt-3">
          <button className="btn btn-outline-secondary btn-sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            Previous
          </button>
          <span className="text-muted small">Page {page + 1} of {Math.ceil(total / limit)}</span>
          <button className="btn btn-outline-secondary btn-sm" disabled={(page + 1) * limit >= total} onClick={() => setPage((p) => p + 1)}>
            Next
          </button>
        </div>
      )}

      {selected && (
        <div className="card mt-3">
          <div className="card-body">
            <h3 className="h5">Inquiry Details</h3>
            <div className="row g-3">
              <div className="col-12 col-lg-6">
                <h4 className="h6 text-uppercase text-muted">Contact</h4>
                <div>
                  <strong>{selected.contactName}</strong>
                </div>
                <div>{selected.contactEmail}</div>
                <div>{selected.contactPhone}</div>
              </div>
              <div className="col-12 col-lg-6">
                <h4 className="h6 text-uppercase text-muted">Event</h4>
                <div>{selected.eventDate} at {selected.eventTime}</div>
                <div>{selected.guestCount} guests</div>
                <div>Occasion: {selected.occasionType}</div>
                <div>Status: {selected.status}</div>
                <div className="text-muted small">Created: {new Date(selected.createdAt).toLocaleString()}</div>
                <div className="text-muted small">Updated: {new Date(selected.updatedAt).toLocaleString()}</div>
              </div>
            </div>

            <div className="mt-3">
              <h4 className="h6 text-uppercase text-muted">Buyout</h4>
              <div>{selected.isBuyout ? "Yes" : "No"}</div>
              {selected.isBuyout && selected.buyoutAmount && (
                <div>Buyout amount: ${Number(selected.buyoutAmount).toLocaleString()}</div>
              )}
              {selected.isBuyout && (
                <div>
                  Buyout details:{" "}
                  {selected.specialRequests
                    ?.split("\n")
                    .find((line) => line.startsWith("Buyout details:"))
                    ?.replace("Buyout details:", "")
                    .trim() || "Provided in special requests."}
                </div>
              )}
            </div>

            <div className="mt-3">
              <h4 className="h6 text-uppercase text-muted">Menu</h4>
              {selected.menuSelection.courses.map((course) => (
                <div key={course.courseType}>
                  <strong>{course.courseType}</strong>:{" "}
                  {course.itemIds.length > 0
                    ? course.itemIds.map((id) => menuItemById.get(id) || id).join(", ")
                    : "None"}
                </div>
              ))}
            </div>

            <div className="mt-3">
              <h4 className="h6 text-uppercase text-muted">Room</h4>
              {selected.roomLayoutId ? (
                (() => {
                  const room = rooms.find((r) => r._id === selected.roomLayoutId);
                  return room ? (
                    <>
                      <div>{room.name}</div>
                      <div className="text-muted small">Capacity: {room.capacity} guests</div>
                    </>
                  ) : (
                    <div className="text-muted">Room ID: {selected.roomLayoutId}</div>
                  );
                })()
              ) : (
                <div className="text-muted">To be assigned by team</div>
              )}
            </div>

            <div className="mt-3">
              <h4 className="h6 text-uppercase text-muted">Notes</h4>
              <div>Dietary notes: {selected.dietaryNotes || "None"}</div>
              <div>Special requests: {selected.specialRequests || "None"}</div>
            </div>

            <div className="mt-3">
              <h4 className="h6 text-uppercase text-muted">Pricing</h4>
              <div>Per person: ${selected.estimatedPricePerPerson.toFixed(2)}</div>
              <div>Subtotal: ${selected.estimatedSubtotal.toFixed(2)}</div>
              <div>Service charge: ${selected.estimatedServiceCharge.toFixed(2)}</div>
              <div>Tax: ${selected.estimatedTax.toFixed(2)}</div>
              <div><strong>Total: ${selected.estimatedTotal.toFixed(2)}</strong></div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default AdminInquiriesPage;
