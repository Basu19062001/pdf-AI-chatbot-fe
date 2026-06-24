export function TextField({
  label,
  name,
  type = 'text',
  register,
  error,
  placeholder,
  autoComplete,
}) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <input
        className={`field__input ${error ? 'field__input--error' : ''}`}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        {...register(name)}
      />
      {error ? <span className="field__error">{error.message}</span> : null}
    </label>
  );
}

