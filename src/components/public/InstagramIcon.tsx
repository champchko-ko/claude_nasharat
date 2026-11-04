import type { SVGProps } from "react";

export function InstagramIcon({ className = "size-8", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <defs>
        <radialGradient id="instagram-gradient" r="150%" cx="30%" cy="107%">
          <stop stopColor="#fdf497" offset="0%" />
          <stop stopColor="#fdf497" offset="5%" />
          <stop stopColor="#fd5949" offset="45%" />
          <stop stopColor="#d6249f" offset="60%" />
          <stop stopColor="#285aeb" offset="90%" />
        </radialGradient>
      </defs>
      <rect width="24" height="24" rx="6.5" ry="6.5" fill="url(#instagram-gradient)" />
      <rect
        x="4.5"
        y="4.5"
        width="15"
        height="15"
        rx="4.2"
        ry="4.2"
        fill="none"
        stroke="#ffffff"
        strokeWidth="1.75"
      />
      <circle cx="12" cy="12" r="3.75" fill="none" stroke="#ffffff" strokeWidth="1.75" />
      <circle cx="16.5" cy="7.5" r="1.15" fill="#ffffff" />
    </svg>
  );
}
