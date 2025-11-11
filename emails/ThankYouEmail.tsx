import { Section, Row, Column, Text } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";

interface ThankYouEmailProps {
  email?: string;
}

export function ThankYouEmail({ email }: ThankYouEmailProps) {
  return (
    <EmailLayout title="Thank You for Subscribing!">
      <Section>
        <Row>
          <Column>
            <Text style={greetingStyle}>Thank you for subscribing!</Text>
          </Column>
        </Row>

        <Row>
          <Column>
            <Text style={messageStyle}>
              We&apos;re excited to have you join the EuroCoin community! You&apos;ll now receive
              the latest news, updates, and exclusive content directly to your inbox.
            </Text>
          </Column>
        </Row>

        <Section style={infoContainerStyle}>
          <Row>
            <Column>
              <Text style={infoTitleStyle}>What to expect:</Text>
            </Column>
          </Row>
          <Row>
            <Column>
              <Text style={infoItemStyle}>📰 Latest news and updates</Text>
              <Text style={infoItemStyle}>💡 Exclusive insights and tips</Text>
              <Text style={infoItemStyle}>🎯 Special offers and promotions</Text>
              <Text style={infoItemStyle}>🚀 Product announcements</Text>
            </Column>
          </Row>
        </Section>

        <Row>
          <Column>
            <Text style={closingStyle}>
              If you have any questions, feel free to reach out to our support team. We&apos;re here
              to help!
            </Text>
          </Column>
        </Row>

        <Row>
          <Column>
            <Text style={signatureStyle}>Best regards,</Text>
            <Text style={signatureStyle}>The EuroCoin Team</Text>
          </Column>
        </Row>
      </Section>
    </EmailLayout>
  );
}

const greetingStyle = {
  fontSize: "28px",
  fontWeight: "700",
  color: "#2563EB",
  margin: "0 0 24px 0",
  textAlign: "center" as const,
};

const messageStyle = {
  fontSize: "16px",
  color: "#111827",
  lineHeight: "1.6",
  margin: "0 0 32px 0",
  textAlign: "center" as const,
};

const infoContainerStyle = {
  backgroundColor: "#F0F9FF",
  padding: "24px",
  borderRadius: "12px",
  margin: "0 0 32px 0",
  border: "2px solid #2563EB",
};

const infoTitleStyle = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#1E40AF",
  margin: "0 0 16px 0",
  textAlign: "center" as const,
};

const infoItemStyle = {
  fontSize: "15px",
  color: "#111827",
  lineHeight: "1.8",
  margin: "0 0 8px 0",
  paddingLeft: "8px",
};

const closingStyle = {
  fontSize: "15px",
  color: "#374151",
  lineHeight: "1.6",
  margin: "0 0 24px 0",
  textAlign: "center" as const,
};

const signatureStyle = {
  fontSize: "15px",
  color: "#111827",
  margin: "0",
  textAlign: "center" as const,
  fontWeight: "500",
};
