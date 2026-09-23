import { useCallback, useEffect, useRef, useState } from "react";

// Ignore stale requests when navigating or reloading after a mutation.
export function useManagementData(loader, initialData) {
    const [data, setData] = useState(initialData);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const version = useRef(0);
    const reload = useCallback(async () => {
        const request = ++version.current;
        try {
            const next = await loader();
            if (request !== version.current) return;
            setData(next);
            setError("");
            return next;
        } catch (failure) {
            if (request === version.current) setError(failure.message || "Unable to load data. Please retry.");
        } finally {
            if (request === version.current) setLoading(false);
        }
    }, [loader]);
    useEffect(() => {
        const timer = window.setTimeout(reload, 0);
        return () => { window.clearTimeout(timer); version.current += 1; };
    }, [reload]);
    return { data, loading, error, reload };
}
