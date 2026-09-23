export default function FieldError({ id, children }) {
    return children ? <span id={id} className="access-field-error">{children}</span> : null;
}
