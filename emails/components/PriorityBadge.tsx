import { Section, Text } from "@react-email/components";

interface PriorityBadgeProps {
  priority: "low" | "normal" | "high";
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const styles = {
    low: {
      backgroundColor: "#FCD34D",
      color: "#92400E",
    },
    normal: {
      backgroundColor: "#FBBF24",
      color: "#78350F",
    },
    high: {
      backgroundColor: "#2563EB",
      color: "#FFFFFF",
    },
  };

  const style = styles[priority];

  return (
    <Section style={badgeContainerStyle}>
      <Text style={{ ...badgeStyle, ...style }}>
        {priority.toUpperCase()}
      </Text>
    </Section>
  );
}

const badgeContainerStyle = {
  display: "inline-block",
};

const badgeStyle = {
  display: "inline-block",
  padding: "6px 16px",
  borderRadius: "20px",
  fontSize: "12px",
  fontWeight: "700",
  letterSpacing: "0.5px",
};

