import {
  BriefcaseBusiness,
  Boxes,
  CodeXml,
  LockKeyhole,
  Network,
} from "lucide-react";

export const projectIconOptions = [
  {
    key: "briefcase",
    label: "Briefcase",
    Icon: BriefcaseBusiness,
    colorClassName: "bg-blue-100 text-blue-700",
  },
  {
    key: "network",
    label: "Network",
    Icon: Network,
    colorClassName: "bg-indigo-100 text-indigo-700",
  },
  {
    key: "box",
    label: "Box",
    Icon: Boxes,
    colorClassName: "bg-emerald-100 text-emerald-700",
  },
  {
    key: "lock",
    label: "Lock",
    Icon: LockKeyhole,
    colorClassName: "bg-amber-100 text-amber-700",
  },
  {
    key: "code",
    label: "Code",
    Icon: CodeXml,
    colorClassName: "bg-rose-100 text-rose-700",
  },
];

export const getProjectIconOption = (key) =>
  projectIconOptions.find((option) => option.key === key) ?? projectIconOptions[0];