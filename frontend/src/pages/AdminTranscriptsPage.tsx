import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  adminListChatTranscripts,
  adminGetChatTranscript,
  ChatTranscriptSummary,
  ChatTranscriptDetail,
} from "../api";

const fmtDateTime = (iso: string) => {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
};

const AdminTranscriptsPage = () => {
  const [transcripts, setTranscripts] = useState<ChatTranscriptSummary[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 50;
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<ChatTranscriptDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [onlyLinked, setOnlyLinked] = useState(false);

  useEffect(() => {
    load(page);
  }, [page]);

  const load = async (p: number) => {
    try {
      const data = await adminListChatTranscripts(p);
      setTranscripts(data.transcripts);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
      setError("Failed to load transcripts");
    }
  };

  const openDetail = async (id: string) => {
    setLoadingDetail(true);
    try {
      const detail = await adminGetChatTranscript(id);
      setSelected(detail);
    } catch (err) {
      console.error(err);
      setError("Failed to load transcript");
    } finally {
      setLoadingDetail(false);
    }
  };

  const filtered = onlyLinked ? transcripts.filter((t) => t.inquiryId) : transcripts;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="page page-admin-transcripts">
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3 page-header">
          <div>
            <p className="eyebrow mb-1">Admin</p>
            <h2 className="mb-0">Chat Transcripts</h2>
          </div>
          <div className="d-flex gap-2 flex-wrap page-header-actions">
            <Link className="btn btn-outline-secondary" to="/admin/inquiries">
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
            <Link className="btn btn-primary" to="/admin/transcripts">
              Transcripts
            </Link>
          </div>
        </div>

        {error && <div className="alert alert-warning">{error}</div>}

        <div className="d-flex align-items-center gap-3 mb-3">
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              id="onlyLinked"
              checked={onlyLinked}
              onChange={(e) => setOnlyLinked(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="onlyLinked">
              Only submitted inquiries
            </label>
          </div>
          <div className="text-muted small">
            {filtered.length} of {total} conversations
          </div>
        </div>

        <div className="row g-3">
          <div className="col-lg-6">
            <div className="card">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Last message</th>
                      <th>Contact</th>
                      <th>Msgs</th>
                      <th>Submitted</th>
                      <th>Preview</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((t) => (
                      <tr
                        key={t.id}
                        onClick={() => openDetail(t.id)}
                        style={{ cursor: "pointer" }}
                        className={selected?.id === t.id ? "table-active" : ""}
                      >
                        <td className="small">{fmtDateTime(t.lastMessageAt)}</td>
                        <td className="small">
                          {t.contactName || t.contactEmail || (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td className="small">{t.messageCount}</td>
                        <td className="small">
                          {t.inquiryId ? (
                            <span className="badge bg-success">Yes</span>
                          ) : (
                            <span className="badge bg-secondary">No</span>
                          )}
                        </td>
                        <td
                          className="small text-truncate"
                          style={{ maxWidth: 240 }}
                        >
                          {t.preview || <span className="text-muted">(no user message)</span>}
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center text-muted py-4">
                          No transcripts yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="d-flex gap-2 mt-3 align-items-center">
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                >
                  ‹ Prev
                </button>
                <span className="small text-muted">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                >
                  Next ›
                </button>
              </div>
            )}
          </div>

          <div className="col-lg-6">
            <div className="card" style={{ position: "sticky", top: 80 }}>
              <div className="card-body">
                {loadingDetail && <div className="text-muted small">Loading…</div>}
                {!loadingDetail && !selected && (
                  <div className="text-muted small">
                    Select a conversation on the left to view the full transcript.
                  </div>
                )}
                {selected && (
                  <>
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <h5 className="mb-1">
                          {selected.contactName || selected.contactEmail || "Anonymous"}
                        </h5>
                        <div className="text-muted small">
                          {fmtDateTime(selected.createdAt)} · {selected.messageCount} messages
                          {selected.inquiryId && (
                            <>
                              {" · "}
                              <Link to={`/admin/inquiries`}>linked inquiry</Link>
                            </>
                          )}
                        </div>
                      </div>
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => setSelected(null)}
                      >
                        Close
                      </button>
                    </div>

                    <div
                      style={{
                        maxHeight: "70vh",
                        overflowY: "auto",
                        paddingRight: 4,
                      }}
                    >
                      {selected.transcript.map((turn, i) => (
                        <div
                          key={i}
                          className="mb-3 pb-2 border-bottom"
                          style={{ borderColor: "#eee" }}
                        >
                          <div
                            className="small text-uppercase mb-1"
                            style={{
                              color:
                                turn.role === "user"
                                  ? "#0d6efd"
                                  : turn.role === "assistant"
                                  ? "#198754"
                                  : "#6c757d",
                              fontWeight: 600,
                              letterSpacing: "0.05em",
                            }}
                          >
                            {turn.role} · {fmtDateTime(turn.timestamp)}
                          </div>
                          {turn.content && (
                            <div style={{ whiteSpace: "pre-wrap" }}>{turn.content}</div>
                          )}
                          {turn.tool_calls && turn.tool_calls.length > 0 && (
                            <div className="mt-2">
                              {turn.tool_calls.map((tc, j) => (
                                <details
                                  key={j}
                                  className="small text-muted mt-1"
                                  style={{
                                    background: "#f8f9fa",
                                    padding: "4px 8px",
                                    borderRadius: 4,
                                  }}
                                >
                                  <summary style={{ cursor: "pointer" }}>
                                    🛠 {tc.name}
                                  </summary>
                                  <div className="mt-1">
                                    <div>
                                      <strong>input:</strong>{" "}
                                      <code>{JSON.stringify(tc.input)}</code>
                                    </div>
                                    {tc.result && (
                                      <div className="mt-1">
                                        <strong>result:</strong>{" "}
                                        <span style={{ whiteSpace: "pre-wrap" }}>
                                          {tc.result.slice(0, 400)}
                                          {tc.result.length > 400 ? "…" : ""}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </details>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTranscriptsPage;
