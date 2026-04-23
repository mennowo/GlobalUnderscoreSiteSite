import { createElement } from 'react';

type Tag = 'span' | 'p' | 'div' | 'h1' | 'h2' | 'h3' | 'h4';

type Props = {
  value: string;
  canEdit: boolean;
  onChange?: (v: string) => void;
  as?: Tag;
  multiline?: boolean;
  className?: string;
};

export default function EditableText({
  value,
  canEdit,
  onChange,
  as = 'span',
  multiline = false,
  className = '',
}: Props) {
  // In multiline mode the wrapper holds <p> children (view) or is a contentEditable
  // block (edit). Either way it must be a block-level element that can contain
  // paragraphs, so we ignore `as` and use <div>.
  const wrapperTag: Tag = multiline ? 'div' : as;

  if (!canEdit) {
    if (multiline) {
      const paras = value.split(/\n\n+/);
      return createElement(
        wrapperTag,
        { className },
        paras.map((p, i) =>
          createElement('p', { key: i, className: i > 0 ? 'mt-4' : '' }, p),
        ),
      );
    }
    return createElement(wrapperTag, { className }, value);
  }

  const editableClass =
    `${className} outline-none rounded-md px-1 -mx-1 ring-2 ring-coral/30 hover:ring-coral/60 focus:ring-coral focus:bg-white/60 transition` +
    (multiline ? ' whitespace-pre-wrap block' : '');

  return createElement(
    wrapperTag,
    {
      contentEditable: true,
      suppressContentEditableWarning: true,
      spellCheck: true,
      className: editableClass,
      onBlur: (e: React.FocusEvent<HTMLElement>) => {
        const text = multiline ? e.currentTarget.innerText : e.currentTarget.textContent || '';
        onChange?.(text);
      },
      onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
        if (!multiline && e.key === 'Enter') {
          e.preventDefault();
          (e.currentTarget as HTMLElement).blur();
        }
      },
    },
    value,
  );
}
