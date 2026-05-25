import { useEffect, useState } from "react";

export default function App() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 8;

  const normalize = (url, data) => {
    if (url.includes("finnhub")) {
      return (data || []).map((item) => ({
        title: item.headline,
        url: item.url,
        source: item.source || "finnhub",
      }));
    }

    if (url.includes("marketaux")) {
      return (data.data || []).map((item) => ({
        title: item.title,
        url: item.url,
        source: item.source || "marketaux",
      }));
    }

    if (url.includes("alphavantage")) {
      return (data.feed || []).map((item) => ({
        title: item.title,
        url: item.url,
        source: item.source || "alphavantage",
      }));
    }

    return [];
  };

  useEffect(() => {
  const fetchNews = async () => {
    try {
      const res = await fetch(
        "https://finacial-apis.danysamuel.workers.dev/"
      );
      const data = await res.json();
      setNews(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  fetchNews();
}, []);


  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const filteredNews = news.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.title?.toLowerCase().includes(q) ||
      item.source?.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filteredNews.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;

  const paginatedNews = filteredNews.slice(
    startIndex,
    startIndex + pageSize
  );

  return (
    <div
      style={{
        height: "100vh",
        width: "100%",
        overflowX: "hidden",
        background: "#0f172a",
        color: "white",
        fontFamily: "Arial",
        padding: "10px",
        boxSizing: "border-box",
      }}
    >
      {/* HEADER */}
      <div style={{ marginBottom: "15px" }}>
        <h1 style={{ margin: 0, fontSize: "28px" }}>
          ⚡ Financial News Terminal
        </h1>

        <p style={{ margin: "5px 0", color: "#94a3b8" }}>
         • Live aggregated market news •
        </p>
      </div>

      {/* SEARCH */}
      <input
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search news..."
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: "8px",
          border: "1px solid #334155",
          background: "#0f172a",
          color: "white",
          marginBottom: "10px",
          boxSizing: "border-box",
        }}
      />

      {/* STATUS */}
      <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "10px" }}>
        🔄 Auto-refresh every 20 seconds • Page {currentPage} / {totalPages || 1}
      </div>

      {/* LIST */}
      {loading ? (
        <p style={{ color: "#94a3b8" }}>Loading...</p>
      ) : (
        <div>
          {paginatedNews.map((item, i) => (
            <a
              key={i}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "block",
                padding: "12px",
                marginBottom: "10px",
                borderRadius: "10px",
                background: "#1e293b",
                border: "1px solid #334155",
                textDecoration: "none",
                color: "white",
              }}
            >
              <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                {item.source}
              </div>

              <div style={{ fontSize: "14px" }}>{item.title}</div>
            </a>
          ))}
        </div>
      )}

      {/* PAGINATION */}
      {/* FLOATING PAGINATION CONTROLS */}
<div
  style={{
    position: "fixed",
    top: "50%",
    left: 0,
    right: 0,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    transform: "translateY(-50%)",
    pointerEvents: "none", // allow clicks only on buttons
    padding: "0 10px",
  }}
>
  {/* LEFT - PREV */}
  <button
    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
    style={{
      pointerEvents: "auto",
      background: "#1e293b",
      border: "1px solid #334155",
      color: "white",
      padding: "10px 14px",
      borderRadius: "10px",
      cursor: "pointer",
      opacity: currentPage === 1 ? 0.4 : 1,
    }}
    disabled={currentPage === 1}
  >
    ⬅ Prev
  </button>

  {/* CENTER - PAGE INFO */}
  <div
    style={{
      pointerEvents: "none",
      background: "#0f172a",
      border: "1px solid #334155",
      padding: "8px 14px",
      borderRadius: "999px",
      fontSize: "13px",
      color: "#94a3b8",
      backdropFilter: "blur(10px)",
    }}
  >
    Page {currentPage} / {totalPages || 1}
  </div>

  {/* RIGHT - NEXT */}
  <button
    onClick={() =>
      setCurrentPage((p) => Math.min(p + 1, totalPages))
    }
    style={{
      pointerEvents: "auto",
      background: "#1e293b",
      border: "1px solid #334155",
      color: "white",
      padding: "10px 14px",
      borderRadius: "10px",
      cursor: "pointer",
      opacity: currentPage === totalPages ? 0.4 : 1,
    }}
    disabled={currentPage === totalPages}
  >
    Next ➡
  </button>
  </div>
    </div>
  );
}