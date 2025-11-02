import { Section, Row, Column, Text } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";

interface VerificationCodeEmailProps {
  code: string;
}

export function VerificationCodeEmail({ code }: VerificationCodeEmailProps) {
  return (
    <EmailLayout title="Newsletter Subscription Confirmation">
      <Section>
        <Row>
          <Column>
            <Text style={instructionStyle}>Your verification code:</Text>
          </Column>
        </Row>

        <Section style={codeContainerStyle}>
          <Text style={codeStyle}>{code}</Text>
        </Section>

        <Row>
          <Column>
            <Text style={noteStyle}>This code is valid for 5 minutes.</Text>
          </Column>
        </Row>

        <Row>
          <Column>
            <Text style={warningStyle}>
              If you didn&apos;t request this code, please ignore this email.
            </Text>
          </Column>
        </Row>
      </Section>
    </EmailLayout>
  );
}

const instructionStyle = {
  fontSize: "18px",
  color: "#111827",
  margin: "0 0 24px 0",
  textAlign: "center" as const,
  fontWeight: "500",
};

const codeContainerStyle = {
  backgroundColor: "#FCD34D",
  padding: "32px",
  borderRadius: "12px",
  textAlign: "center" as const,
  margin: "0 0 24px 0",
  border: "2px solid #FBBF24",
};

const codeStyle = {
  fontSize: "42px",
  fontWeight: "700",
  letterSpacing: "12px",
  color: "#1E40AF",
  margin: "0",
  fontFamily: "monospace",
};

const noteStyle = {
  fontSize: "14px",
  color: "#6B7280",
  margin: "0 0 16px 0",
  textAlign: "center" as const,
};

const warningStyle = {
  fontSize: "12px",
  color: "#9CA3AF",
  margin: "0",
  textAlign: "center" as const,
  fontStyle: "italic",
};
