import { Section, Row, Column, Text, Link, Hr } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";

interface NewsletterEmailProps {
  message: string;
  unsubscribeUrl?: string;
}

export function NewsletterEmail({ message, unsubscribeUrl }: NewsletterEmailProps) {
  return (
    <EmailLayout title="EuroCoin Newsletter">
      <Section>
        <Row>
          <Column>
            <Section style={messageContainerStyle}>
              {message.split("\n").map((line, index) => (
                <Text key={index} style={messageStyle}>
                  {line || "\u00A0"}
                </Text>
              ))}
            </Section>
          </Column>
        </Row>

        <Hr style={dividerStyle} />

        <Row>
          <Column>
            <Text style={footerTextStyle}>
              You received this email because you are subscribed to EuroCoin newsletter.
            </Text>
            {unsubscribeUrl && (
              <Text style={unsubscribeTextStyle}>
                <Link href={unsubscribeUrl} style={unsubscribeLinkStyle}>
                  Unsubscribe from newsletter
                </Link>
              </Text>
            )}
          </Column>
        </Row>
      </Section>
    </EmailLayout>
  );
}

const messageContainerStyle = {
  backgroundColor: "#F9FAFB",
  padding: "24px",
  borderRadius: "8px",
  margin: "24px 0",
  borderLeft: "4px solid #2563EB",
};

const messageStyle = {
  fontSize: "16px",
  color: "#111827",
  lineHeight: "1.6",
  margin: "0",
};

const dividerStyle = {
  border: "none",
  borderTop: "1px solid #E5E7EB",
  margin: "32px 0 24px 0",
};

const footerTextStyle = {
  fontSize: "14px",
  color: "#6B7280",
  margin: "0 0 12px 0",
  textAlign: "center" as const,
};

const unsubscribeTextStyle = {
  fontSize: "14px",
  margin: "0",
  textAlign: "center" as const,
};

const unsubscribeLinkStyle = {
  color: "#2563EB",
  textDecoration: "underline",
};
