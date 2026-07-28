import { callbackHourOptions } from "../data/site";

export interface CallbackField {
  label: string;
  name: string;
  type?: "text" | "email" | "tel" | "textarea" | "hidden" | "date" | "select";
  placeholder: string;
  helper?: string;
  required?: boolean;
  autocomplete?: string;
  value?: string;
  readOnly?: boolean;
  span?: "full";
  min?: string;
  options?: readonly {
    value: string;
    label: string;
  }[];
}

export function getTodayIsoDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function createCallbackFields({
  enquiryType,
  sourcePage,
  keyStage = "",
  subject = "",
  yearGroupLabel = "Student year group or key stage",
  yearGroupPlaceholder = "For example: Year 10 or KS4",
  includeSchool = false,
  schoolRequired = false,
  messagePlaceholder = "Share current attainment, confidence or timetable context if helpful."
}: {
  enquiryType: string;
  sourcePage: string;
  keyStage?: string;
  subject?: string;
  yearGroupLabel?: string;
  yearGroupPlaceholder?: string;
  includeSchool?: boolean;
  schoolRequired?: boolean;
  messagePlaceholder?: string;
}) {
  const fields: CallbackField[] = [
    { label: "Enquiry type", name: "enquiry-type", type: "hidden", placeholder: "", value: enquiryType },
    { label: "Page source", name: "page-source", type: "hidden", placeholder: "", value: sourcePage },
    { label: "Key stage", name: "key-stage", type: "hidden", placeholder: "", value: keyStage },
    { label: "Subject", name: "subject", type: "hidden", placeholder: "", value: subject },
    { label: "Parent name", name: "parent-name", placeholder: "Your full name", required: true, autocomplete: "name" },
    { label: "Student name", name: "student-name", placeholder: "Student's name", required: true },
    { label: yearGroupLabel, name: "student-year-group", placeholder: yearGroupPlaceholder, required: true }
  ];

  if (includeSchool) {
    fields.push({ label: "School", name: "school", placeholder: "Current school", required: schoolRequired });
  }

  fields.push(
    { label: "Email", name: "email", type: "email", placeholder: "you@example.com", required: true, autocomplete: "email" },
    { label: "Phone number", name: "phone", type: "tel", placeholder: "Best number to reach you", required: true, autocomplete: "tel" },
    {
      label: "Preferred callback date",
      name: "preferred-callback-date",
      type: "date",
      placeholder: "",
      required: true,
      min: getTodayIsoDate()
    },
    {
      label: "Preferred callback hour",
      name: "preferred-callback-hour",
      type: "select",
      placeholder: "",
      required: true,
      helper: "This is your preferred callback time. FlyBridge will contact you to confirm the arrangement.",
      options: callbackHourOptions
    },
    {
      label: "Optional message",
      name: "message",
      type: "textarea",
      placeholder: messagePlaceholder,
      span: "full"
    }
  );

  return fields;
}
