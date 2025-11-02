import { Section, Row, Column, Text, Hr } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";
import { Field } from "./components/Field";
import { PriorityBadge } from "./components/PriorityBadge";

interface InternalRequestEmailProps {
  requester: string;
  department: string;
  requestType: string;
  priority: "low" | "normal" | "high";
  description: string;
  filesCount?: number;
  submittedAt: string;
}

export function InternalRequestEmail({
  requester,
  department,
  requestType,
  priority,
  description,
  filesCount,
  submittedAt,
}: InternalRequestEmailProps) {
  return (
    <EmailLayout title="Internal Token Operation Request">
      <Section>
        <Field label="Requester" value={requester} />
        <Field label="Department" value={department} />
        <Field label="Request Type" value={requestType} />
        <Field
          label="Priority"
          value={<PriorityBadge priority={priority} />}
        />
        <Field label="Description" value={description} />
        {filesCount && filesCount > 0 && (
          <Field label="Attached Files" value={`${filesCount} file(s)`} />
        )}
        <Hr style={dividerStyle} />
        <Text style={footerNoteStyle}>
          This request was submitted through the internal dashboard at {submittedAt}.
        </Text>
      </Section>
    </EmailLayout>
  );
}

const dividerStyle = {
  border: "none",
  borderTop: "1px solid #E5E7EB",
  margin: "24px 0",
};

const footerNoteStyle = {
  fontSize: "12px",
  color: "#6B7280",
  margin: "0",
  fontStyle: "italic",
};

