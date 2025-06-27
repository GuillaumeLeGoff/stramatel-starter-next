import React, { useEffect, useRef } from "react";
import { Html } from "react-konva-utils";
import Konva from "konva";

interface KonvaTextEditorProps {
  textNode: Konva.Text;
  onClose: () => void;
  onTextChange: (newText: string) => void;
  onFinalize: (newText: string) => Promise<void>;
}

export const KonvaTextEditor: React.FC<KonvaTextEditorProps> = ({
  textNode,
  onClose,
  onTextChange,
  onFinalize,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;

    const textPosition = textNode.position();

    const areaPosition = {
      x: textPosition.x,
      y: textPosition.y,
    };

    // Match styles with the text node
    textarea.value = textNode.text();
    textarea.style.position = "absolute";
    textarea.style.top = `${areaPosition.y}px`;
    textarea.style.left = `${areaPosition.x}px`;
    textarea.style.width = `${textNode.width() - textNode.padding() * 2}px`;
    textarea.style.height = `${
      textNode.height() - textNode.padding() * 2 + 5
    }px`;
    textarea.style.fontSize = `${textNode.fontSize()}px`;
    textarea.style.border = "none";
    textarea.style.padding = "0px";
    textarea.style.margin = "0px";
    textarea.style.overflow = "hidden";
    textarea.style.background = "none";
    textarea.style.outline = "none";
    textarea.style.resize = "none";
    textarea.style.lineHeight = textNode.lineHeight().toString();
    textarea.style.fontFamily = textNode.fontFamily();
    textarea.style.transformOrigin = "left top";
    textarea.style.textAlign = textNode.align() as CanvasTextAlign;
    textarea.style.color = textNode.fill() as string;

    const rotation = textNode.rotation();
    let transform = "";
    if (rotation) {
      transform += `rotateZ(${rotation}deg)`;
    }
    textarea.style.transform = transform;

    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight + 3}px`;

    textarea.focus();

    const handleOutsideClick = async (e: MouseEvent) => {
      // Vérifier si le clic est à l'extérieur du textarea
      if (e.target !== textarea && !textarea.contains(e.target as Node)) {
        await onFinalize(textarea.value);
        onClose();
      }
    };

    // Add event listeners
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        await onFinalize(textarea.value);
        onClose();
      }
      if (e.key === "Escape") {
        onClose();
      }
    };

    const handleInput = () => {
      // Mettre à jour pendant l'édition
      onTextChange(textarea.value);

      const scale = textNode.getAbsoluteScale().x;
      textarea.style.width = `${textNode.width() * scale}px`;
      textarea.style.height = "auto";
      textarea.style.height = `${
        textarea.scrollHeight + textNode.fontSize()
      }px`;
    };

    // Empêcher la propagation des clics sur le textarea
    const handleTextareaClick = (e: MouseEvent) => {
      e.stopPropagation();
    };

    textarea.addEventListener("keydown", handleKeyDown);
    textarea.addEventListener("input", handleInput);
    textarea.addEventListener("click", handleTextareaClick);

    // Ajouter l'événement de clic extérieur avec un délai pour éviter les conflits
    const timeoutId = setTimeout(() => {
      document.addEventListener("click", handleOutsideClick, true);
    }, 100);

    return () => {
      textarea.removeEventListener("keydown", handleKeyDown);
      textarea.removeEventListener("input", handleInput);
      textarea.removeEventListener("click", handleTextareaClick);
      document.removeEventListener("click", handleOutsideClick, true);
      clearTimeout(timeoutId);
    };
  }, [textNode, onTextChange, onFinalize, onClose]);

  return (
    <Html>
      <textarea
        ref={textareaRef}
        style={{
          minHeight: "1em",
          position: "absolute",
        }}
      />
    </Html>
  );
};
