
// src/components/StatusBadge.jsx
export function StatusBadge({ status }) {
  const isOk = status === "Configured";

  const style = {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: "9999px",
    fontSize: "12px",
    fontWeight: 600,
    backgroundColor: isOk ? "rgba(34,197,94,0.1)" : "rgba(248,113,113,0.1)",
    color: isOk ? "rgb(34,197,94)" : "rgb(239,68,68)",
    border: `1px solid ${isOk ? "rgba(34,197,94,0.4)" : "rgba(248,113,113,0.4)"}`
  };

  return (
    <span style={style}>
      {isOk ? "Configured" : "Not configured"}
    </span>
  );
}


