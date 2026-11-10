import { cn } from "@/lib/utils";

export function RemaxIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 200 50"
            className={cn("w-auto", className)}
            aria-label="RE/MAX Logo"
        >
            <style>{`.remax-red{fill:#e01e3a}.remax-blue{fill:#0054a4}`}</style>
            <path
                className="remax-red"
                d="M33.6 37.9h-5.8L22.6 25l5.2-12.9h5.8l-5.2 12.9z"
            />
            <path
                className="remax-red"
                d="M49.4 37.9h-5.8L38.4 25l5.2-12.9h5.8L44.2 25z"
            />
            <path
                className="remax-red"
                d="M10.8 12.1h13.3v4.9H16.6v3.7h6.6v4.9h-6.6v3.7h7.5v4.9H10.8z"
            />
            <path
                className="remax-red"
                d="M54.2 37.9V12.1h5.8l6.8 12.1V12.1h5.3v25.8h-5.4l-7.1-12.7v12.7z"
            />
            <path
                className="remax-blue"
                d="M93.3 25.1c0-7.3-5.2-13.1-13-13.1s-13 5.8-13 13.1c0 7.3 5.2 13.1 13 13.1s13-5.8 13-13.1zm-5.8 0c0 4.1-2.7 7.7-7.2 7.7s-7.2-3.6-7.2-7.7c0-4.1 2.7-7.7 7.2-7.7s7.2 3.6 7.2 7.7z"
            />
            <path
                className="remax-blue"
                d="M100.2 37.9V12.1h5.8v25.8zM113.8 37.9l-5.2-12.9h5.8l5.2-12.9h5.8l-5.2 12.9h-5.8l-5.2 12.9z"
            />
            <path
                className="remax-blue"
                d="M139.7 37.9h-5.8l-5.2-12.9h5.8l5.2-12.9h5.8l-5.2 12.9h-5.8z"
            />
            <path
                className="remax-blue"
                d="M149.2 12.1h13.3v4.9h-7.5v3.7h6.6v4.9h-6.6v3.7h7.5v4.9h-13.3z"
            />
        </svg>
    );
}
