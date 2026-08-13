// src/components/EmailEditor.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

/**
 * EmailEditor
 * - Compat: (value,onChange) OU (content,setContent)
 * - Safe HTML string (jamais undefined/null)
 * - Mode contrôlé si onChange fourni, sinon fallback local (avec warning)
 * - Toolbar stable pour emails (évite code-block)
 */

export default function EmailEditor(props) {
  // Compat: ancien usage <EmailEditor content={content} setContent={setContent} />
  // Usage recommandé: <EmailEditor value={value} onChange={setValue} />
  const valueProp = props.value ?? props.content ?? "";
  const onChangeProp = props.onChange ?? props.setContent;

  const isControlled = typeof onChangeProp === "function";

  // Toujours string
  const safeValueProp = typeof valueProp === "string" ? valueProp : "";

  // En mode non contrôlé, on garde un state local
  const [localValue, setLocalValue] = useState(safeValueProp);

  // Évite de resync en boucle (utile si Quill renvoie un HTML équivalent mais différent)
  const lastSyncedRef = useRef(safeValueProp);

  useEffect(() => {
    if (isControlled) return; // en contrôlé, on ne gère pas le local
    if (safeValueProp === lastSyncedRef.current) return;

    lastSyncedRef.current = safeValueProp;
    setLocalValue(safeValueProp);
  }, [safeValueProp, isControlled]);

  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ color: [] }, { background: [] }],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ align: [] }],
        ["link", "blockquote"],
        ["clean"],
      ],
      clipboard: { matchVisual: false },
    }),
    []
  );

  const formats = useMemo(
    () => [
      "header",
      "bold",
      "italic",
      "underline",
      "strike",
      "color",
      "background",
      "list",
      "bullet",
      "align",
      "link",
      "blockquote",
    ],
    []
  );

  function handleChange(html) {
    const next = typeof html === "string" ? html : "";

    if (isControlled) {
      onChangeProp(next);
    } else {
      setLocalValue(next);
    }
  }

  const value = isControlled ? safeValueProp : localValue;

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <label className="block text-sm font-medium">Email HTML</label>
        {!isControlled && (
          <span className="text-xs text-amber-700">
            (Attention: onChange manquant — l’éditeur ne remonte pas la valeur)
          </span>
        )}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <ReactQuill
          theme="snow"
          value={value}
          onChange={handleChange}
          modules={modules}
          formats={formats}
          placeholder="Rédige ton email ici…"
        />
      </div>

      <p className="text-xs text-slate-500">
        Conseil: pour un rendu email stable, évite les mises en page trop complexes (tables/images à gérer
        côté template).
      </p>
    </div>
  );
}


