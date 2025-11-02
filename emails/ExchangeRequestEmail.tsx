import { Section, Text, Hr } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";
import { Field } from "./components/Field";

interface ExchangeRequestEmailProps {
  requestId: string;
  tokenAmount: string;
  fiatAmount: string;
  rate: string;
  commission: string;
  walletAddress: string;
  email: string;
  comment?: string;
  filesCount?: number;
  submittedAt: string;
}

export function ExchangeRequestEmail({
  requestId,
  tokenAmount,
  fiatAmount,
  rate,
  commission,
  walletAddress,
  email,
  comment,
  filesCount,
  submittedAt,
}: ExchangeRequestEmailProps) {
  return (
    <EmailLayout title="New Token Exchange Request">
      <Section>
        <Field label="Request ID" value={requestId} />
        <Field label="Token Amount" value={`${tokenAmount} TOKEN`} />
        <Field label="Fiat Amount" value={`${fiatAmount} EUR`} />
        <Field label="Exchange Rate" value={rate} />
        <Field label="Commission" value={`${commission}%`} />
        <Field label="Wallet Address" value={walletAddress} />
        <Field label="Client Email" value={email} />
        {comment && <Field label="Comment" value={comment} />}
        {filesCount && filesCount > 0 && (
          <Field label="Attached Files" value={`${filesCount} file(s)`} />
        )}
        <Hr style={dividerStyle} />
        <Text style={footerNoteStyle}>Submitted at: {submittedAt}</Text>
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

