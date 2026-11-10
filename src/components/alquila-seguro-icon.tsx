
import { cn } from "@/lib/utils";

export function AlquilaSeguroIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 500 100"
      className={cn("w-auto", className)}
      aria-label="ALQUILA SEGURO Logo"
    >
      <style>{`.alquila-blue{fill:#0949A1;}.alquila-red{fill:#E62429;}.alquila-font{font-family:Poppins-Black, Poppins;font-size:35px;font-weight:800;}`}</style>
      <text className="alquila-font" transform="translate(0 69.89)">
        <tspan className="alquila-blue" x="0" y="0">
          ALQUILA
        </tspan>
      </text>
      <text className="alquila-font" transform="translate(193.38 69.89)">
        <tspan className="alquila-red" x="0" y="0">
          SEGURO
        </tspan>
      </text>
    </svg>
  );
}

    