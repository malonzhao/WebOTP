import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

export function FormErrors({
  errors,
  labels,
}: {
  errors: Record<string, string | undefined>;
  labels: Record<string, string>;
}) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const previousCount = useRef(0);
  const entries = Object.entries(errors).filter(([, message]) => message);
  useEffect(() => {
    const count = Object.values(errors).filter(Boolean).length;
    if (count > 0 && count >= previousCount.current) ref.current?.focus();
    previousCount.current = count;
  }, [errors]);
  if (!entries.length) return null;
  return (
    <div ref={ref} tabIndex={-1} role="alert" className="error-message">
      <p className="font-medium">{t("validation.checkFields")}</p>
      <ul className="mt-2 list-disc pl-5">
        {entries.map(([field, message]) => (
          <li key={field}>
            <a
              className="underline"
              href={`#${field}`}
              onClick={(event) => {
                event.preventDefault();
                document.getElementById(field)?.focus();
              }}
            >
              {labels[field]}: {message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
