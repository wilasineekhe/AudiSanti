import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** แสดงเนื้อหา Markdown (ไม่อนุญาต HTML ดิบ เพื่อความปลอดภัย) */
export function Markdown({ content }: { content: string }) {
  return (
    <div className="prose-santi break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => {
            const external = href?.startsWith("http");
            return (
              <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                {children}
              </a>
            );
          },
          // eslint-disable-next-line @next/next/no-img-element
          img: ({ src, alt }) => <img src={typeof src === "string" ? src : ""} alt={alt ?? ""} loading="lazy" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
