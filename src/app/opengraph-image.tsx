import { ImageResponse } from "next/og";

import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export const alt = `${SITE_NAME} — travel guides`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          backgroundColor: "#F6F1E9",
          padding: "72px 80px",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 28,
          }}
        >
          <svg
            width="88"
            height="88"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="32" height="32" rx="6" fill="#F6F1E9" />
            <circle
              cx="16"
              cy="16"
              r="11.5"
              fill="#E8EDE5"
              stroke="#2A2521"
              strokeWidth="1.25"
            />
            <ellipse
              cx="16"
              cy="16"
              rx="5.75"
              ry="11.5"
              stroke="#5A6B52"
              strokeWidth="0.9"
              opacity="0.9"
            />
            <ellipse
              cx="16"
              cy="16"
              rx="11.5"
              ry="4.25"
              stroke="#5A6B52"
              strokeWidth="0.9"
              opacity="0.9"
            />
            <circle cx="20.5" cy="11.5" r="2.6" fill="#C4552D" />
          </svg>
          <div
            style={{
              fontSize: 80,
              fontWeight: 600,
              color: "#2A2521",
              fontFamily: "Georgia, serif",
              letterSpacing: "-0.02em",
            }}
          >
            {SITE_NAME}
          </div>
        </div>

        <div
          style={{
            fontSize: 34,
            color: "#6B635C",
            maxWidth: 900,
            lineHeight: 1.45,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          {SITE_DESCRIPTION}
        </div>
      </div>
    ),
    { ...size },
  );
}
