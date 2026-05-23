import CalculatorFlow from "./CalculatorFlow";

export const metadata = {
  title: "SFI26 Calculator — Estimate your Sustainable Farming Incentive payment",
  description:
    "Free SFI26 payment calculator. Enter your land, pick the actions you want to do, and see your estimated annual Sustainable Farming Incentive 2026 payment.",
};

export default function CalculatorPage() {
  return <CalculatorFlow />;
}
