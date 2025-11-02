import { Section, Link } from "@react-email/components";

interface ButtonProps {
  href: string;
  children: React.ReactNode;
}

export function Button({ href, children }: ButtonProps) {
  return (
    <Section style={buttonContainerStyle}>
      <Link href={href} style={buttonStyle}>
        {children}
      </Link>
    </Section>
  );
}

const buttonContainerStyle = {
  margin: "24px 0",
  textAlign: "center" as const,
};

const buttonStyle = {
  display: "inline-block",
  padding: "14px 32px",
  backgroundColor: "#2563EB",
  color: "#FFFFFF",
  textDecoration: "none",
  borderRadius: "8px",
  fontWeight: "600",
  fontSize: "16px",
  boxShadow: "0 4px 6px rgba(37, 99, 235, 0.3)",
};

