// Reusable Input Component
// React Icons
import { FaEnvelope } from "react-icons/fa";
import { FaLock } from "react-icons/fa";
import { FaEye } from "react-icons/fa";
import { FaEyeSlash } from "react-icons/fa";
function Input(props) {
    return (

        <div className="input-group">

            {/* Input Label */}
            <label htmlFor={props.id}>
                {props.label}
            </label>

<div className="input-wrapper">

    {/* Email Icon */}
    {props.type === "email" && (
        <FaEnvelope className="input-icon" />
    )}

    {/* Password Icon */}
    {(props.type === "password" || props.type === "text") && (
        <FaLock className="input-icon" />
    )}

    {/* Input Field */}
    <input
        id={props.id}
        name={props.name}
        type={props.type}
        placeholder={props.placeholder}
        value={props.value}
        onChange={props.onChange}
        required={props.required}
    />

    {/* Show / Hide Password */}
    {props.showToggle && (

        <span
            className="toggle-password"
            onClick={props.onToggle}
        >
            {props.showPassword ? <FaEyeSlash /> : <FaEye />}
        </span>

    )}

</div>

        </div>

    );

}

export default Input;