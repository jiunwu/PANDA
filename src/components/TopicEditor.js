'use client';

import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { useEffect } from "react";

export default function TopicEditor({ initialContent, onChange }) {
  let parsedContent = undefined;
  if (initialContent) {
    try {
      parsedContent = JSON.parse(initialContent);
    } catch (e) {
      console.error("Failed to parse initialContent", e);
    }
  }

  const editor = useCreateBlockNote({
    initialContent: parsedContent
  });

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', minHeight: '300px', background: 'var(--white)' }}>
      <BlockNoteView
        editor={editor}
        onChange={() => {
          onChange(JSON.stringify(editor.document));
        }}
        theme="light"
      />
    </div>
  );
}
