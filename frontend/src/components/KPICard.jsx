import { ArrowUpRight, ArrowDownRight } from "@phosphor-icons/react";

const KPICard = ({ label, value, delta, deltaLabel, testid, accent = false }) => {
  const positive = (delta ?? 0) >= 0;
  return (
    <div
      data-testid={testid}
      className={`rounded-xl border p-6 sm:p-7 transition-all duration-200 hover:-translate-y-[2px] hover:border-[#cfcec7] ${
        accent ? "bg-[#1A362D] text-[#F9F9F8] border-[#1A362D]" : "bg-white border-[#E6E5E1]"
      } card-shadow`}
    >
      <div
        className={`overline mb-3`}
        style={accent ? { color: "#D4A373" } : undefined}
      >
        {label}
      </div>
      <div
        className={`font-heading font-medium tracking-tight ${
          accent ? "text-[#F9F9F8]" : "text-[#1C1C19]"
        }`}
        style={{ fontSize: "30px", lineHeight: 1.05 }}
      >
        {value}
      </div>
      {delta !== undefined && (
        <div className="mt-4 flex items-center gap-1.5 text-xs font-mono-data">
          {positive ? (
            <ArrowUpRight size={14} weight="bold" className={accent ? "text-[#D4A373]" : "text-[#3C6E47]"} />
          ) : (
            <ArrowDownRight size={14} weight="bold" className="text-[#B94A48]" />
          )}
          <span className={positive ? (accent ? "text-[#D4A373]" : "text-[#3C6E47]") : "text-[#B94A48]"}>
            {deltaLabel}
          </span>
          <span className={accent ? "text-[#9D9C96]" : "text-[#9D9C96]"}>vs cost basis</span>
        </div>
      )}
    </div>
  );
};

export default KPICard;
