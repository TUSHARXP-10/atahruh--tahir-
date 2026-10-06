"use client";

import { Printer } from "lucide-react";
import { buttonClass } from "./ui";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className={buttonClass("primary")}>
      <Printer /> Print / save as PDF
    </button>
  );
}
