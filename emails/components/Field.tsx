import { Section, Row, Column, Text } from "@react-email/components";
import React from "react";

interface FieldProps {
  label: string;
  value: string | React.ReactNode;
}

export function Field({ label, value }: FieldProps) {
  const isString = typeof value === "string";

  return (
    <Section style={fieldContainerStyle}>
      <Row>
        <Column>
          <Text style={labelStyle}>{label}</Text>
        </Column>
      </Row>
      <Row>
        <Column>
          <Section style={valueContainerStyle}>
            {isString ? (
              <Text style={valueStyle}>{value}</Text>
            ) : (
              value
            )}
          </Section>
        </Column>
      </Row>
    </Section>
  );
}

const fieldContainerStyle = {
  marginBottom: "20px",
};

const labelStyle = {
  fontSize: "12px",
  fontWeight: "600",
  color: "#2563EB",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 8px 0",
};

const valueContainerStyle = {
  backgroundColor: "#F9FAFB",
  padding: "16px",
  borderRadius: "8px",
  borderLeft: "4px solid #2563EB",
};

const valueStyle = {
  fontSize: "16px",
  color: "#111827",
  margin: "0",
  lineHeight: "1.5",
};

