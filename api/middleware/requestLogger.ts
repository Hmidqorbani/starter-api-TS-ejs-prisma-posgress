import morgan from "morgan";

morgan.token("status-emoji", (req, res) => {
  const s = res.statusCode;
  if (s >= 500) return "🔥";
  if (s >= 400) return "⚠️";
  if (s >= 300) return "↪️";
  return "✅";
});

export default morgan(":status-emoji :method :url :status - :response-time ms");