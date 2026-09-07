'use client';

import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { useEffect, useState } from 'react';
import { validateTopicImage } from '@/lib/topic-images';
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

export default function TopicEditor({ initialContent, onChange, onUploadingChange }) {
  const [uploads, setUploads] = useState(0);
  const [uploadError, setUploadError] = useState('');
  useEffect(() => {
    onUploadingChange?.(uploads > 0);
    return () => onUploadingChange?.(false);
  }, [uploads, onUploadingChange]);

  async function uploadImage(file) {
    setUploadError('');
    setUploads(count => count + 1);
    try {
      const error = validateTopicImage(file);
      if (error) throw new Error(error);
      const body = new FormData();
      body.append('file', file);
      const response = await fetch('/api/topics/images', { method: 'POST', body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to upload image.');
      return data.url;
    } catch (error) {
      setUploadError(error.message || 'Failed to upload image. Please try again.');
      throw error;
    } finally {
      setUploads(count => count - 1);
    }
  }
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
    uploadFile: uploadImage,
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

  async function handleDrop(event) {
    const files = Array.from(event.dataTransfer.files);
    if (!files.length) return;
    event.preventDefault();
    event.stopPropagation();
    let anchor = event.target.closest('[data-id]')?.getAttribute('data-id');
    if (!anchor || !editor.getBlock(anchor)) anchor = editor.getTextCursorPosition().block.id;
    for (const file of files) {
      try {
        const url = await uploadImage(file);
        const target = editor.getBlock(anchor) || editor.document[editor.document.length - 1];
        const inserted = editor.insertBlocks([{ type: 'image', props: { url, name: file.name } }], target, 'after');
        anchor = inserted[0].id;
      } catch {
        // uploadImage displays the error; continue with other dropped images.
      }
    }
  }

  return (
    <div className="topic-editor-wrapper"
      onDropCapture={handleDrop}
      onDragOverCapture={event => {
        if (Array.from(event.dataTransfer.types).includes('Files')) {
          event.preventDefault();
          event.dataTransfer.dropEffect = 'copy';
        }
      }}
    >
      {/* Hint bar */}
      <div className="topic-editor-hint">
        <span>Type <kbd>/</kbd> for commands</span>
        <span className="topic-editor-hint-sep">·</span>
        <span>Select text for formatting</span>
        <span className="topic-editor-hint-sep">·</span>
        <span>Drag blocks with <kbd>⠿</kbd></span>
        <span className="topic-editor-hint-sep">·</span>
        <span>Drop images here or use <kbd>/image</kbd> to upload (max 4 MB)</span>
      </div>
      {uploads > 0 && <p role="status">Uploading images… Wait for uploads to finish before saving.</p>}
      {uploadError && <p role="alert" style={{ color: 'var(--red)' }}>{uploadError}</p>}
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
