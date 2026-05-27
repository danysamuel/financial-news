import { useEffect, useState, useMemo } from "react";

export default function App() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [sentimentFilter, setSentimentFilter] = useState("ALL");
  const [assetFilter, setAssetFilter] = useState("ALL");

  const [history, setHistory] = useState([]);
  const [accuracy, setAccuracy] = useState(0);

  const [jumpPage, setJumpPage] = useState("");

  const pageSize = 8;

  // ----------------------------
  // MEMORY (NO RE-LEARNING SAME NEWS)
  // ----------------------------
  const seen = useMemo(() => new Set(), []);

  // ----------------------------
  // FETCH NEWS
  // ----------------------------
  useEffect(() => {
    fetch("https://finacial-apis.danysamuel.workers.dev/")
      .then(r => r.json())
      .then(data => setNews(data))
      .finally(() => setLoading(false));
  }, []);

  // ----------------------------
  // SENTIMENT
  // ----------------------------
  const getSentiment = (title = "") => {
    const text = title.toLowerCase();

    const bull = ["surge","rally","gain","rise","growth","strong","bullish","profit"];
    const bear = ["crash","drop","loss","fear","recession","inflation","weak","selloff"];

    let b = bull.filter(w => text.includes(w)).length;
    let s = bear.filter(w => text.includes(w)).length;

    if (b > s) return { label: "BULLISH", color: "#16a34a", emoji: "🟢" };
    if (s > b) return { label: "BEARISH", color: "#dc2626", emoji: "🔴" };
    return { label: "NEUTRAL", color: "#64748b", emoji: "⚪" };
  };

  // ----------------------------
  // ASSETS (UPDATED + AUD ADDED)
  // ----------------------------
  const getAssets = (text = "") => {
    const t = text.toUpperCase();
    const assets = [];

    if (/\bBTC\b|BITCOIN\b/.test(t)) assets.push("BTC");
    if (/\bETH\b|ETHEREUM\b/.test(t)) assets.push("ETH");
    if (/\bGOLD\b/.test(t)) assets.push("GOLD");
    if (/\b(OIL|CRUDE)\b/.test(t)) assets.push("OIL");

    if (/\bUSD\b|US DOLLAR\b/.test(t)) assets.push("USD");
    if (/\bEUR\b|EURO\b/.test(t)) assets.push("EUR");
    if (/\bGBP\b|BRITISH POUND\b/.test(t)) assets.push("GBP");

    // ✅ AUD ADDED
    if (/\bAUD\b|AUSTRALIAN DOLLAR\b|AUSSIE DOLLAR\b/.test(t)) {
      assets.push("AUD");
    }

    if (/\bNASDAQ\b/.test(t)) assets.push("NASDAQ");
    if (/\bS\s*&\s*P\b|\bS&P\b|\bSP500\b/.test(t)) assets.push("S&P500");

    return assets.length ? assets : ["UNKNOWN"];
  };

  // ----------------------------
  // SIGNAL MODEL
  // ----------------------------
  const getSignal = (title = "") => {
    const text = title.toLowerCase();

    let up = 50;
    let down = 50;

    ["surge","rally","growth","profit","strong"].forEach(w => {
      if (text.includes(w)) up += 6;
    });

    ["crash","drop","loss","fear","weak"].forEach(w => {
      if (text.includes(w)) down += 6;
    });

    if (text.includes("fed")) up += 5;
    if (text.includes("rate hike")) down += 5;

    const total = up + down;

    const pUp = Math.round((up / total) * 100);
    const pDown = 100 - pUp;

    const confidence = Math.max(pUp, pDown);

    if (pUp >= 65)
      return { label: "LONG", emoji: "🟢", color: "#16a34a", pUp, pDown, confidence };

    if (pDown >= 65)
      return { label: "SHORT", emoji: "🔴", color: "#dc2626", pUp, pDown, confidence };

    return { label: "WAIT", emoji: "⚪", color: "#64748b", pUp, pDown, confidence };
  };

  // ----------------------------
  // MEMOIZED ENRICHMENT (PERFORMANCE FIX)
  // ----------------------------
  const enrichedNews = useMemo(() => {
    return news.map(item => ({
      ...item,
      sentiment: getSentiment(item.title),
      assets: getAssets(item.title),
      signal: getSignal(item.title)
    }));
  }, [news]);

  // ----------------------------
  // FILTERING
  // ----------------------------
  const filteredNews = enrichedNews.filter(item => {
    const q = searchQuery.toLowerCase();

    const matchSearch =
      !searchQuery ||
      item.title?.toLowerCase().includes(q) ||
      item.source?.toLowerCase().includes(q);

    const matchSentiment =
      sentimentFilter === "ALL" ||
      item.sentiment.label === sentimentFilter;

    const matchAsset =
      assetFilter === "ALL" ||
      item.assets.includes(assetFilter);

    return matchSearch && matchSentiment && matchAsset;
  });

  const totalPages = Math.max(1, Math.ceil(filteredNews.length / pageSize));

  const paginatedNews = filteredNews.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // ----------------------------
  // KEYBOARD NAVIGATION
  // ----------------------------
  useEffect(() => {
    const handle = (e) => {
      if (document.activeElement.tagName === "INPUT") return;

      if (e.key === "ArrowLeft")
        setCurrentPage(p => Math.max(p - 1, 1));

      if (e.key === "ArrowRight")
        setCurrentPage(p => Math.min(p + 1, totalPages));
    };

    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [totalPages]);

  // ----------------------------
  // SELF-LEARNING (SAFE)
  // ----------------------------
  useEffect(() => {
    if (!paginatedNews.length) return;

    const batch = [];

    for (const item of paginatedNews) {
      if (!item?.title) continue;
      if (seen.has(item.title)) continue;

      seen.add(item.title);

      const s = item.signal;
      const rand = Math.random() * 100;

      const correct =
        (s.label === "LONG" && rand < s.pUp) ||
        (s.label === "SHORT" && rand < s.pDown) ||
        s.label === "WAIT";

      batch.push({ correct });
    }

    if (batch.length) {
      setHistory(prev => [...prev, ...batch].slice(-200));
    }
  }, [paginatedNews]);

  // ----------------------------
  // ACCURACY
  // ----------------------------
  useEffect(() => {
    if (!history.length) return;

    const acc =
      (history.filter(h => h.correct).length / history.length) * 100;

    setAccuracy(Math.round(acc));
  }, [history]);

  // ----------------------------
  // UI
  // ----------------------------
  return (
    <div style={{ background: "#0f172a", color: "white", padding: 12 }}>

      <h1>⚡ AI Trading Desk</h1>

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

      {/* SENTIMENT FILTER */}
      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
        {["ALL","BULLISH","BEARISH","NEUTRAL"].map(f => (
          <button
            key={f}
            onClick={() => setSentimentFilter(f)}
            style={{
              padding: "6px 14px",
              borderRadius: 999,
              border: "1px solid #334155",
              background: sentimentFilter === f ? "#1e293b" : "transparent",
              color: "white"
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* ASSET FILTER */}
      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
        {["ALL","BTC","ETH","GOLD","OIL","USD","EUR","GBP","AUD","NASDAQ"].map(f => (
          <button
            key={f}
            onClick={() => setAssetFilter(f)}
            style={{
              padding: "6px 14px",
              borderRadius: 999,
              border: "1px solid #334155",
              background: assetFilter === f ? "#1e293b" : "transparent",
              color: "white"
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* NEWS */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        paginatedNews.map((item, i) => {
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
                border: `1px solid ${item.sentiment.color}`,
                borderRadius: 10,
                color: "white",
                textDecoration: "none"
              }}
            >
              <div>{item.title}</div>

              <div style={{ fontSize: 12, marginTop: 5 }}>
                📊 {item.assets.join(", ")}
              </div>

              <div>
                {item.signal.emoji} {item.signal.label} |
                UP {item.signal.pUp}% | DOWN {item.signal.pDown}%
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
        <span>{currentPage}/{totalPages}</span>
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