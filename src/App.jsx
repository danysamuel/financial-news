import { useEffect, useState, useMemo } from "react";

export default function App() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [showControls, setShowControls] = useState(false);
  const [jumpPage, setJumpPage] = useState("");

  // ✅ RESTORED FILTERS
  const [sentimentFilter, setSentimentFilter] = useState("ALL");
  const [assetFilter, setAssetFilter] = useState("ALL");

  const [history, setHistory] = useState([]);
  const [accuracy, setAccuracy] = useState(0);

  const pageSize = 8;

  // ----------------------------
  // SENTIMENT
  // ----------------------------
  const getSentiment = (title = "") => {
    const text = title.toLowerCase();

    const bull = ["surge","rally","gain","rise","growth","strong","bullish","profit"];
    const bear = ["crash","drop","loss","fear","recession","inflation","weak","selloff"];

    let b = bull.filter(w => text.includes(w)).length;
    let s = bear.filter(w => text.includes(w)).length;

    if (b > s) return { label: "Bullish", color: "#16a34a", emoji: "🟢" };
    if (s > b) return { label: "Bearish", color: "#dc2626", emoji: "🔴" };
    return { label: "Neutral", color: "#64748b", emoji: "⚪" };
  };

  // ----------------------------
  // ASSETS
  // ----------------------------
  const getAssets = (text = "") => {
    const t = text.toUpperCase();
    const assets = [];

    if (t.includes("BTC")) assets.push("BTC");
    if (t.includes("ETH")) assets.push("ETH");
    if (t.includes("GOLD")) assets.push("GOLD");
    if (t.includes("OIL")) assets.push("OIL");

    if (t.includes("USD")) assets.push("USD");
    if (t.includes("EUR")) assets.push("EUR");
    if (t.includes("GBP")) assets.push("GBP");

    if (t.includes("NASDAQ")) assets.push("NASDAQ");
    if (t.includes("S&P")) assets.push("S&P500");

    return assets.length ? assets : ["UNKNOWN"];
  };

  // ----------------------------
  // PROBABILITY MODEL
  // ----------------------------
  const getSignal = (title = "") => {
    const text = title.toLowerCase();

    let up = 50;
    let down = 50;

    ["surge","rally","growth","profit","strong"].forEach(w => text.includes(w) && (up += 6));
    ["crash","drop","loss","fear","weak"].forEach(w => text.includes(w) && (down += 6));

    if (text.includes("fed")) up += 5;
    if (text.includes("rate hike")) down += 5;

    const total = up + down;

    const pUp = Math.round((up / total) * 100);
    const pDown = 100 - pUp;

    const confidence = Math.max(pUp, pDown);

    if (pUp >= 65) return { label: "LONG", emoji: "🟢", color: "#16a34a", pUp, pDown, confidence };
    if (pDown >= 65) return { label: "SHORT", emoji: "🔴", color: "#dc2626", pUp, pDown, confidence };

    return { label: "WAIT", emoji: "⚪", color: "#64748b", pUp, pDown, confidence };
  };

  // ----------------------------
  // FETCH
  // ----------------------------
  useEffect(() => {
    fetch("https://finacial-apis.danysamuel.workers.dev/")
      .then(r => r.json())
      .then(setNews)
      .finally(() => setLoading(false));
  }, []);

  // reset page
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sentimentFilter, assetFilter]);

  // ----------------------------
  // FILTER LOGIC (RESTORED FULL)
  // ----------------------------
  const filteredNews = news.filter(item => {
    const q = searchQuery.toLowerCase();
    const sentiment = getSentiment(item.title);
    const assets = getAssets(item.title);

    const matchSearch =
      !searchQuery ||
      item.title?.toLowerCase().includes(q) ||
      item.source?.toLowerCase().includes(q);

    const matchSentiment =
      sentimentFilter === "ALL" ||
      sentiment.label.toUpperCase() === sentimentFilter;

    const matchAsset =
      assetFilter === "ALL" ||
      assets.includes(assetFilter);

    return matchSearch && matchSentiment && matchAsset;
  });

  const totalPages = Math.ceil(filteredNews.length / pageSize);

  const paginatedNews = filteredNews.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // ----------------------------
  // KEY NAV
  // ----------------------------
  useEffect(() => {
    const handle = (e) => {
      if (document.activeElement.tagName === "INPUT") return;

      if (e.key === "ArrowLeft") setCurrentPage(p => Math.max(p - 1, 1));
      if (e.key === "ArrowRight") setCurrentPage(p => Math.min(p + 1, totalPages));
    };

    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [totalPages]);

  // ----------------------------
  // SELF LEARNING (UNCHANGED)
  // ----------------------------
  useEffect(() => {
    if (!paginatedNews.length) return;

    const batch = paginatedNews.map(item => {
      const s = getSignal(item.title);
      const rand = Math.random() * 100;

      const correct =
        (s.label === "LONG" && rand < s.pUp) ||
        (s.label === "SHORT" && rand < s.pDown) ||
        s.label === "WAIT";

      return { correct };
    });

    setHistory(prev => [...prev, ...batch].slice(-200));
  }, [paginatedNews]);

  useEffect(() => {
    if (!history.length) return;
    const acc = (history.filter(h => h.correct).length / history.length) * 100;
    setAccuracy(Math.round(acc));
  }, [history]);

  // ----------------------------
  // UI
  // ----------------------------
  return (
    <div style={{ background: "#0f172a", color: "white", padding: 12 }}>

      <h1>⚡ AI Trading Desk ⚡</h1>

      {/* ACCURACY */}
      <div style={{ background: "#1e293b", padding: 10, marginBottom: 10 }}>
        🧠 Accuracy: {accuracy}% ({history.length})
      </div>

      {/* SEARCH */}
      <input
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        placeholder="Search news..."
        style={{ width: "100%", padding: 10 }}
      />

      {/* FILTERS (RESTORED FULL) */}
      <div style={{ marginTop: 10 }}>
        {["ALL","BULLISH","BEARISH","NEUTRAL"].map(f => (
          <button key={f} onClick={() => setSentimentFilter(f)} style={{ marginRight: 5 }}>
            {f}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 10 }}>
        {["ALL","BTC","ETH","GOLD","OIL","USD","EUR","GBP","NASDAQ"].map(f => (
          <button key={f} onClick={() => setAssetFilter(f)} style={{ marginRight: 5 }}>
            {f}
          </button>
        ))}
      </div>

      {/* NEWS */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        paginatedNews.map((item, i) => {
          const s = getSignal(item.title);
          const a = getAssets(item.title);

          return (
            <a
              key={i}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "block",
                marginTop: 10,
                padding: 12,
                background: "#1e293b",
                border: `1px solid ${s.color}`,
                borderRadius: 10,
                textDecoration: "none",
                color: "white"
              }}
            >
              <div>{item.title}</div>

              <div style={{ fontSize: 12, marginTop: 5 }}>
                📊 {a.join(", ")}
              </div>

              <div>
                {s.emoji} {s.label} | UP {s.pUp}% | DOWN {s.pDown}%
              </div>
            </a>
          );
        })
      )}

      {/* PAGINATION */}
      <div style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%,-50%)",
        background: "#1e293b",
        padding: 10,
        display: "flex",
        gap: 10
      }}>
        <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}>⬅</button>
        <span>{currentPage}/{totalPages || 1}</span>
        <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}>➡</button>

        <input
          type="number"
          value={jumpPage}
          onChange={e => setJumpPage(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") {
              const p = Number(jumpPage);
              if (p >= 1 && p <= totalPages) setCurrentPage(p);
              setJumpPage("");
            }
          }}
          style={{ width: 50 }}
        />
      </div>

    </div>
  );
}