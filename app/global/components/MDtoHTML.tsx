"use client";

import React from "react";
import { marked } from "marked";

interface MDtoHTMLProps {
  markdown: string;
  className?: string;
}

const MDtoHTML: React.FC<MDtoHTMLProps> = ({ markdown, className }) => {
  const html = marked.parse(markdown || "");
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default MDtoHTML;
