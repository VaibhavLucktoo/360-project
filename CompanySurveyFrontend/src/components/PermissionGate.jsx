import { useAuth } from "../context/useAuth";
export default function PermissionGate({ permission, children }) {
    const { can } = useAuth();
    return can(permission) ? children : null;
}
