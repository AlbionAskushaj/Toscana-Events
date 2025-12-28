import { useEffect, useState } from "react";
import { getInquiries, updateInquiryStatus } from "../api";
import { EventInquiry, InquiryStatus } from "../types";
import { Link } from "react-router-dom";

const statusOptions: InquiryStatus[] = ["new", "reviewing", "approved", "declined"];

const AdminInquiriesPage = () => {
  const [inquiries, setInquiries] = useState<EventInquiry[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const data = await getInquiries();
      setInquiries(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load inquiries");
    }
  };

  const updateStatus = async (id: string, status: InquiryStatus) => {
    try {
      await updateInquiryStatus(id, status);
      await load();
    } catch (err) {
      console.error(err);
      setError("Failed to update status");
    }
  };

  const selected = inquiries.find((i) => i._id === selectedId);

  return (
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
              <th>Created</th>
              <th>Contact</th>
              <th>Event</th>
              <th>Guests</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {inquiries.map((inq) => (
              <tr key={inq._id} className={selectedId === inq._id ? "selected" : ""}>
                <td>{new Date(inq.createdAt).toLocaleString()}</td>
                <td>
                  <strong>{inq.contactName}</strong>
                  <div className="text-muted">{inq.contactEmail}</div>
                </td>
                <td>
                  {inq.eventDate} @ {inq.eventTime}
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
              <strong>{course.courseType.toUpperCase()}</strong>: {course.itemIds.join(", ")}
            </div>
          ))}
          <h4>Seating</h4>
          <ul>
            <li>Room: {selected.roomLayoutId}</li>
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
  );
};

export default AdminInquiriesPage;
