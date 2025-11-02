import { Section, Row, Column, Text, Link, Hr } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";
import { Button } from "./components/Button";

interface VerificationEmailProps {
  url: string;
  appName: string;
}

export function VerificationEmail({ url, appName }: VerificationEmailProps) {
  return (
    <EmailLayout>
      <Section>
        <Row>
          <Column>
            <Text style={headlineStyle}>Sign In Verification</Text>
            <Text style={mutedStyle}>
              We received a sign-in request for {appName}. Click the button below to complete
              authentication. This link is valid for 24 hours and can only be used once.
            </Text>
          </Column>
        </Row>

        <Button href={url}>Sign In to Account</Button>

        <Row>
          <Column>
            <Text style={mutedStyle}>
              If the button doesn&apos;t work, copy and paste this link into your browser address
              bar:
            </Text>
            <Text style={linkStyle}>
              <Link href={url} style={linkAnchorStyle}>
                {url}
              </Link>
            </Text>
          </Column>
        </Row>

        <Hr style={dividerStyle} />

        <Text style={footerWarningStyle}>
          If you didn&apos;t request to sign in, please ignore this email. The link will expire
          automatically.
        </Text>
      </Section>
    </EmailLayout>
  );
}

const headlineStyle = {
  fontSize: "24px",
  fontWeight: "600",
  color: "#111827",
  margin: "0 0 16px 0",
};

const mutedStyle = {
  fontSize: "16px",
  color: "#6B7280",
  lineHeight: "1.6",
  margin: "0 0 16px 0",
};

const linkStyle = {
  fontSize: "13px",
  color: "#2563EB",
  wordBreak: "break-all" as const,
  margin: "16px 0",
};

const linkAnchorStyle = {
  color: "#2563EB",
  textDecoration: "underline",
};

const dividerStyle = {
  border: "none",
  borderTop: "1px solid #E5E7EB",
  margin: "32px 0 24px 0",
};

const footerWarningStyle = {
  fontSize: "14px",
  color: "#9CA3AF",
  lineHeight: "1.5",
  margin: "0",
  fontStyle: "italic",
};
