import { useEffect, useState, useMemo } from "react";

export default function App() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [showControls, setShowControls] = useState(false);
  const [jumpPage, setJumpPage] = useState("");

  const [sentimentFilter, setSentimentFilter] = useState("ALL");
  const [assetFilter, setAssetFilter] = useState("ALL");

  const pageSize = 8;

  // ----------------------------
  // SENTIMENT
  // ----------------------------
  const getSentiment = (title = "") => {
    const text = title.toLowerCase();

    const bullishWords = [
      "surge","rally","gain","up","rise","beat","bullish",
      "growth","record high","strong","buy","breakout",
      "optimistic","profit","approval"
    ];

    const bearishWords = [
      "crash","drop","fall","down","bearish","selloff",
      "recession","fear","loss","weak","decline",
      "inflation","war","bankruptcy","lawsuit"
    ];

    const bullishScore = bullishWords.filter(w => text.includes(w)).length;
    const bearishScore = bearishWords.filter(w => text.includes(w)).length;

    if (bullishScore > bearishScore) {
      return { label: "Bullish", color: "#16a34a", emoji: "🟢" };
    }

    if (bearishScore > bullishScore) {
      return { label: "Bearish", color: "#dc2626", emoji: "🔴" };
    }

    return { label: "Neutral", color: "#64748b", emoji: "⚪" };
  };

  // ----------------------------
  // ASSET DETECTION
  // ----------------------------
  const getAssets = (text = "") => {
    const t = text.toUpperCase();
    const assets = [];

    if (t.includes("BTC") || t.includes("BITCOIN")) assets.push("BTC");
    if (t.includes("ETH") || t.includes("ETHEREUM")) assets.push("ETH");
    if (t.includes("SOL")) assets.push("SOL");

    if (t.includes("USD")) assets.push("USD");
    if (t.includes("EUR")) assets.push("EUR");
    if (t.includes("JPY")) assets.push("JPY");
    if (t.includes("GBP")) assets.push("GBP");

    if (t.includes("GOLD")) assets.push("GOLD");
    if (t.includes("OIL") || t.includes("CRUDE")) assets.push("OIL");

    if (t.includes("NASDAQ")) assets.push("NASDAQ");
    if (t.includes("S&P") || t.includes("SP500")) assets.push("S&P 500");
    if (t.includes("DOW")) assets.push("DOW");

    return assets.length ? assets : ["UNKNOWN"];
  };

  // ----------------------------
  // FETCH NEWS
  // ----------------------------
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

  // reset page
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sentimentFilter, assetFilter]);

  // ----------------------------
  // BUILD UNIQUE ASSETS LIST (NEW FEATURE)
  // ----------------------------
  const allAssets = useMemo(() => {
    const set = new Set();

    news.forEach(item => {
      getAssets(item.title).forEach(a => set.add(a));
    });

    return ["ALL", ...Array.from(set)];
  }, [news]);

  // ----------------------------
  // FILTERING
  // ----------------------------
  const filteredNews = news.filter((item) => {
    const q = searchQuery.toLowerCase();
    const sentiment = getSentiment(item.title);
    const assets = getAssets(item.title);

    const matchesSearch =
      !searchQuery ||
      item.title?.toLowerCase().includes(q) ||
      item.source?.toLowerCase().includes(q);

    const matchesSentiment =
      sentimentFilter === "ALL" ||
      sentiment.label.toUpperCase() === sentimentFilter;

    const matchesAsset =
      assetFilter === "ALL" ||
      assets.includes(assetFilter);

    return matchesSearch && matchesSentiment && matchesAsset;
  });

  const totalPages = Math.ceil(filteredNews.length / pageSize);

  const paginatedNews = filteredNews.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // ----------------------------
  // KEYBOARD NAV
  // ----------------------------
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (document.activeElement.tagName === "INPUT") return;

      if (e.key === "ArrowLeft") {
        setCurrentPage(p => Math.max(p - 1, 1));
      }

      if (e.key === "ArrowRight") {
        setCurrentPage(p => Math.min(p + 1, totalPages));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [totalPages]);

  return (
    <div
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "white",
        padding: "12px",
        fontFamily: "Arial"
      }}
    >
      {/* HEADER */}
      <h1>⚡ Financial News Terminal</h1>

      {/* SEARCH */}
      <input
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search news..."
        style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
      />

      {/* SENTIMENT FILTER */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
        {["ALL", "BULLISH", "BEARISH", "NEUTRAL"].map((f) => (
          <button
            key={f}
            onClick={() => setSentimentFilter(f)}
            style={{
              padding: "6px 10px",
              border: "1px solid #334155",
              background: sentimentFilter === f ? "#1e293b" : "transparent",
              color: "white",
              borderRadius: "8px"
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* 🆕 ASSET FILTER TABS */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "15px",
          flexWrap: "wrap"
        }}
      >
        {allAssets.map((a) => (
          <button
            key={a}
            onClick={() => setAssetFilter(a)}
            style={{
              padding: "5px 10px",
              borderRadius: "8px",
              border: "1px solid #334155",
              background: assetFilter === a ? "#1e293b" : "transparent",
              color: "white",
              fontSize: "12px"
            }}
          >
            {a}
          </button>
        ))}
      </div>

      {/* NEWS */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        paginatedNews.map((item, i) => {
          const sentiment = getSentiment(item.title);
          const assets = getAssets(item.title);

          return (
            <a
              key={i}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "block",
                padding: "14px",
                marginBottom: "10px",
                borderRadius: "12px",
                background: "#1e293b",
                border: `1px solid ${sentiment.color}`,
                color: "white",
                textDecoration: "none"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                  {item.source}
                </div>

                <div
                  style={{
                    background: sentiment.color,
                    padding: "4px 10px",
                    borderRadius: "999px",
                    fontSize: "11px"
                  }}
                >
                  {sentiment.emoji} {sentiment.label}
                </div>
              </div>

              <div style={{ marginTop: "8px", fontSize: "15px" }}>
                {item.title}
              </div>

              <div style={{ marginTop: "8px", fontSize: "12px", color: "#94a3b8" }}>
                📊 {assets.join(", ")}
              </div>
            </a>
          );
        })
      )}

      {/* CENTER PAGINATION (UNCHANGED FEATURE) */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          background: "rgba(15,23,42,0.95)",
          border: "1px solid #334155",
          padding: "10px 14px",
          borderRadius: "999px",
          backdropFilter: "blur(12px)",
          opacity: showControls ? 1 : 0,
          transition: "0.25s ease",
          pointerEvents: "auto"
        }}
      >
        <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}>
          ⬅
        </button>

        <span>
          {currentPage} / {totalPages || 1}
        </span>

        <input
          type="number"
          value={jumpPage}
          onChange={(e) => setJumpPage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const page = Number(jumpPage);
              if (page >= 1 && page <= totalPages) setCurrentPage(page);
              setJumpPage("");
            }
          }}
          style={{
            width: "50px",
            textAlign: "center",
            background: "#0f172a",
            color: "white",
            border: "1px solid #334155"
          }}
        />

        <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}>
          ➡
        </button>
      </div>
    </div>
  );
}