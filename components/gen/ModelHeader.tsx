"use client";

import type { ModelInput } from "@/lib/modelInput";

import CompanyLogo from "../companyLogos/CompanyLogo";
import VideoCostTable from "./VideoCostTable";

type Props = {
  name: string;
  unitCost: number;
  schema: ModelInput;
  description?: string;
  companyWebsite: string;
  kind: "IMAGE" | "VIDEO";
  creditUnitLabel: string; // e.g. "اعتبار/تصویر" or "اعتبار/ثانیه"
  creditUnitValue: number; // in credits
};

export default function ModelHeader({
  kind,
  name,
  schema,
  unitCost,
  description,
  companyWebsite,
  creditUnitLabel,
  creditUnitValue,
}: Props) {
  return (
    <div>
      <div className="font-semibold text-center">{name}</div>
      <div className="flex items-center flex-col">
        <CompanyLogo
          companyWebsite={companyWebsite}
          className="w-30 h-30 px-2"
        />
        <div>
          {description && (
            <p className="rtl text-justify text-sm text-foreground/70 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="mt-3">
        {kind === "IMAGE" ? (
          <div className="flex w-full justify-center items-center">
            <div className="rounded-xl border-2 border-accent/70 p-2">
              <span className="text-sm text-foreground/90">
                <span className="text-accent/90 font-bold underline">
                  {creditUnitValue}
                </span>{" "}
                اعتبار به ازای هر
                {" " + creditUnitLabel}
              </span>
            </div>
          </div>
        ) : (
          <VideoCostTable schema={schema} creditCostPerSecond={unitCost} />
        )}
      </div>
    </div>
  );
}
