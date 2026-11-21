"use client";

/**
 * Gráficos del tablero (RF-T2) con Chart.js y react-chartjs-2 (§9).
 * Son Client Components porque Chart.js dibuja en un <canvas> del navegador.
 */
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
  type TooltipItem,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import { formatMoney } from "@/lib/formato";
import { formaPagoLabels } from "@/lib/etiquetas";

// Chart.js solo incluye lo que se registra: barras, torta, ejes, leyenda y tooltip.
ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Legend, Tooltip);

// Los mismos colores que --chart-1 a --chart-3 de globals.css.
const COLORS = ["#1f6b4f", "#e0a21b", "#b3306a"];

const pesos = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });
/** Eje en pesos sin centavos: "$ 120.000". */
const axisMoney = (cents: number | string) => `$ ${pesos.format(Number(cents) / 100)}`;

/** Ventas diarias de los últimos 30 días (barras). */
export function DailySalesChart({ data }: { data: { fecha: string; importe: number }[] }) {
  return (
    <div className="h-64">
      <Bar
        data={{
          // "2026-11-21" -> "21/11"
          labels: data.map((d) => `${d.fecha.slice(8, 10)}/${d.fecha.slice(5, 7)}`),
          datasets: [{ label: "Ventas", data: data.map((d) => d.importe), backgroundColor: COLORS[0], borderRadius: 4 }],
        }}
        options={{
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: (item: TooltipItem<"bar">) => formatMoney(Number(item.raw)) } },
          },
          scales: {
            x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkipPadding: 8 } },
            y: { beginAtZero: true, ticks: { callback: axisMoney } },
          },
        }}
      />
    </div>
  );
}

/** Ventas del mes por forma de pago (torta). */
export function PaymentFormsChart({
  data,
}: {
  data: { forma: keyof typeof formaPagoLabels; importe: number }[];
}) {
  return (
    <div className="h-64">
      <Doughnut
        data={{
          labels: data.map((d) => formaPagoLabels[d.forma]),
          datasets: [{ data: data.map((d) => d.importe), backgroundColor: COLORS, borderWidth: 0 }],
        }}
        options={{
          maintainAspectRatio: false,
          cutout: "60%",
          plugins: {
            legend: { position: "bottom" },
            tooltip: { callbacks: { label: (item: TooltipItem<"doughnut">) => formatMoney(Number(item.raw)) } },
          },
        }}
      />
    </div>
  );
}
