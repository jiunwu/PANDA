'use client';

import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

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
    initialContent: parsedContent,
    // Default schema already includes:
    // - paragraph, heading (h1, h2, h3)
    // - bulletListItem, numberedListItem, checkListItem
    // - table, image, video, audio, file
    // - codeBlock
    // Slash menu items are auto-generated from the schema
    domAttributes: {
      editor: {
        class: "topic-blocknote-editor",
      },
    },
  });

  return (
    <div className="topic-editor-wrapper">
      {/* Hint bar */}
      <div className="topic-editor-hint">
        <span>Type <kbd>/</kbd> for commands</span>
        <span className="topic-editor-hint-sep">·</span>
        <span>Select text for formatting</span>
        <span className="topic-editor-hint-sep">·</span>
        <span>Drag blocks with <kbd>⠿</kbd></span>
      </div>
      <BlockNoteView
        editor={editor}
        onChange={() => {
          onChange(JSON.stringify(editor.document));
        }}
        theme="light"
        sideMenu={true}
        slashMenu={true}
        formattingToolbar={true}
      />
    </div>
  );
}
