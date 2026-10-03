export function Field({ label, name, error, required, hint, children }) {
  return (
    <div>
      {label && (
        <label htmlFor={name} className="label">
          {label} {required && <span className="text-risk-high">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${name}-error`} className="mt-1 text-xs text-risk-high">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-ink-400">{hint}</p>
      ) : null}
    </div>
  );
}

const describe = (name, error) => ({ 'aria-invalid': Boolean(error), 'aria-describedby': error ? `${name}-error` : undefined });

export function TextInput({ label, name, value, onChange, error, required, hint, ...rest }) {
  return (
    <Field label={label} name={name} error={error} required={required} hint={hint}>
      <input id={name} name={name} value={value ?? ''} onChange={onChange} className={`input ${error ? 'input-error' : ''}`} {...describe(name, error)} {...rest} />
    </Field>
  );
}

export function SelectInput({ label, name, value, onChange, options, error, required, placeholder = 'Select…', hint, ...rest }) {
  return (
    <Field label={label} name={name} error={error} required={required} hint={hint}>
      <select id={name} name={name} value={value ?? ''} onChange={onChange} className={`input ${error ? 'input-error' : ''}`} {...describe(name, error)} {...rest}>
        <option value="">{placeholder}</option>
        {options.map((o) => {
          const opt = typeof o === 'string' ? { value: o, label: o } : o;
          return <option key={opt.value} value={opt.value}>{opt.label}</option>;
        })}
      </select>
    </Field>
  );
}

export function TextArea({ label, name, value, onChange, error, required, hint, rows = 4, ...rest }) {
  return (
    <Field label={label} name={name} error={error} required={required} hint={hint}>
      <textarea id={name} name={name} rows={rows} value={value ?? ''} onChange={onChange} className={`input ${error ? 'input-error' : ''}`} {...describe(name, error)} {...rest} />
    </Field>
  );
}
