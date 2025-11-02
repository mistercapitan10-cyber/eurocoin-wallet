import React from "react";
import { Html, Head, Body, Container, Section, Row, Column, Text } from "@react-email/components";

interface EmailLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function EmailLayout({ children, title }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          {/* Header with blue-yellow gradient */}
          <Section style={headerStyle}>
            <Row>
              <Column>
                <Section style={logoContainerStyle}>
                  <Row>
                    <Column style={logoCircleWrapperStyle}>
                      <Section style={logoCircleStyle}>
                        <Text style={euroSymbolStyle}>€</Text>
                      </Section>
                    </Column>
                    <Column style={logoTextColumnStyle}>
                      <Text style={logoMainTextStyle}>EURO</Text>
                      <Text style={logoSubTextStyle}>COIN</Text>
                    </Column>
                  </Row>
                </Section>
              </Column>
            </Row>
            {title && (
              <Row>
                <Column>
                  <Text style={titleStyle}>{title}</Text>
                </Column>
              </Row>
            )}
          </Section>

          {/* Content */}
          <Section style={contentStyle}>{children}</Section>

          {/* Footer */}
          <Section style={footerStyle}>
            <Row>
              <Column>
                <Text style={footerTextStyle}>
                  © {new Date().getFullYear()} EuroCoin. All rights reserved.
                </Text>
              </Column>
            </Row>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Color scheme: Blue (#2563EB) and Yellow (#FCD34D)
const mainStyle = {
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  backgroundColor: "#F3F4F6",
  padding: "20px 0",
};

const containerStyle = {
  maxWidth: "600px",
  margin: "0 auto",
  backgroundColor: "#FFFFFF",
  borderRadius: "12px",
  overflow: "hidden",
  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
};

const headerStyle = {
  background: "linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)",
  padding: "32px 24px",
  textAlign: "center" as const,
};

const logoContainerStyle = {
  marginBottom: "16px",
  textAlign: "center" as const,
};

const logoCircleWrapperStyle = {
  width: "56px",
  verticalAlign: "middle",
  padding: "0 12px 0 0",
};

const logoCircleStyle = {
  width: "56px",
  height: "56px",
  borderRadius: "50%",
  backgroundColor: "#FCD34D",
  margin: "0 auto",
  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
  padding: "12px 0",
  textAlign: "center" as const,
};

const euroSymbolStyle = {
  fontSize: "28px",
  fontWeight: "bold",
  color: "#1E40AF",
  margin: "0",
  padding: "0",
  textAlign: "center" as const,
  lineHeight: "32px",
  display: "block",
};

const logoTextColumnStyle = {
  verticalAlign: "middle",
  padding: "0",
};

const logoMainTextStyle = {
  fontSize: "24px",
  fontWeight: "700",
  color: "#FFFFFF",
  letterSpacing: "2px",
  lineHeight: "1",
  margin: "0",
  textAlign: "center" as const,
};

const logoSubTextStyle = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#FCD34D",
  letterSpacing: "1px",
  lineHeight: "1",
  margin: "2px 0 0 0",
  textAlign: "center" as const,
};

const titleStyle = {
  fontSize: "24px",
  fontWeight: "600",
  color: "#FFFFFF",
  margin: "0",
  padding: "0",
};

const contentStyle = {
  padding: "32px 24px",
  backgroundColor: "#FFFFFF",
};

const footerStyle = {
  backgroundColor: "#F9FAFB",
  padding: "24px",
  textAlign: "center" as const,
  borderTop: "1px solid #E5E7EB",
};

const footerTextStyle = {
  fontSize: "12px",
  color: "#6B7280",
  margin: "0",
};
