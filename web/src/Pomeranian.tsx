export function Pomeranian({
  sleepy,
  happy,
}: {
  sleepy: boolean;
  happy: boolean;
}) {
  return (
    <svg
      className={`dog ${happy ? "happy" : ""}`}
      viewBox="0 0 360 330"
      role="img"
      aria-label="Chú Pomeranian trắng đang ngồi trên thảm"
    >
      <defs>
        <radialGradient id="fur">
          <stop stopColor="#fff" />
          <stop offset="1" stopColor="#efece3" />
        </radialGradient>
        <linearGradient id="ear" x2="0" y2="1">
          <stop stopColor="#e7cec1" />
          <stop offset="1" stopColor="#f8e9df" />
        </linearGradient>
      </defs>
      <ellipse
        cx="183"
        cy="295"
        rx="108"
        ry="17"
        fill="#626d56"
        opacity=".12"
      />
      <path
        className="tail"
        d="M246 263C336 273 326 177 276 197c-31 14 21 48-16 47"
        fill="url(#fur)"
        stroke="#e5e1d7"
        strokeWidth="3"
      />
      <path
        d="M107 202Q93 223 103 260L94 278 113 287Q176 304 248 282L264 259 254 226 246 202Z"
        fill="url(#fur)"
      />
      <ellipse cx="135" cy="279" rx="31" ry="19" fill="#fffdf8" />
      <ellipse cx="223" cy="279" rx="31" ry="19" fill="#fffdf8" />
      <path
        d="M99 137Q68 103 84 46Q121 45 150 92M211 92Q247 45 278 50Q289 109 262 139"
        fill="url(#fur)"
        stroke="#e8e3d9"
        strokeWidth="2"
      />
      <path
        d="M96 65Q119 71 132 97L100 113Z M259 68Q235 72 221 98L257 115Z"
        fill="url(#ear)"
      />
      <path
        d="M107 100L124 94 137 81 151 87 166 75 181 84 200 76 209 89 229 86 239 103 262 108 263 127 281 138 272 153 287 174 274 186 279 202 257 212 253 229 231 232 219 248 197 243 181 255 164 244 144 249 131 234 112 235 104 216 84 211 88 192 73 179 85 163 79 148 94 135 91 117Z"
        fill="url(#fur)"
        stroke="#e8e3da"
        strokeWidth="1.5"
      />
      <ellipse cx="133" cy="181" rx="20" ry="10" fill="#f4d7cd" opacity=".55" />
      <ellipse cx="227" cy="181" rx="20" ry="10" fill="#f4d7cd" opacity=".55" />
      {sleepy ? (
        <g fill="none" stroke="#413c35" strokeWidth="5" strokeLinecap="round">
          <path d="M125 158q12 10 22 0" />
          <path d="M213 158q12 10 22 0" />
        </g>
      ) : (
        <g fill="#393630">
          <ellipse cx="137" cy="158" rx="9" ry="12" />
          <ellipse cx="223" cy="158" rx="9" ry="12" />
          <g fill="white">
            <circle cx="134" cy="154" r="3" />
            <circle cx="220" cy="154" r="3" />
          </g>
        </g>
      )}
      <ellipse cx="180" cy="197" rx="34" ry="25" fill="#fffdf8" />
      <path
        d="M170 183Q180 176 190 183Q191 191 180 195Q169 191 170 183"
        fill="#393630"
      />
      <path
        d="M180 193v7m-13 0q7 11 13 0q8 11 14 0"
        stroke="#514339"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      {happy && <path d="M172 207q8 4 16 0v7q-8 16-16 0Z" fill="#dd9e96" />}
      <path
        d="M129 234Q180 258 235 232"
        stroke="#839478"
        strokeWidth="9"
        fill="none"
      />
      <circle cx="181" cy="250" r="11" fill="#dab775" />
      <path d="M178 246l7 4-7 4Z" fill="#fff8e8" />
    </svg>
  );
}
