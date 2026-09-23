// Reusable Button Component
// Can be used anywhere in the project

function Button(props) {
    return (
        <button
            // Runs when the button is clicked
            onClick={props.onClick}

            // Button type (default is "button")
            type={props.type || "button"}

            disabled={props.disabled}
        >
            {/* Button text */}
            {props.text}
        </button>
    );
}

// Export component
export default Button;
