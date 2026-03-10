"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class SceneErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error in 3D Scene:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#050505] text-[#00FF41] font-mono border-4 border-[#FF0000]/50 box-border rounded shadow-[0_0_30px_rgba(255,0,0,0.2)]">
                    <h1 className="text-xl font-bold mb-2 uppercase text-[#FF0000]">Visualizer Offline</h1>
                    <p className="opacity-70 text-sm max-w-md text-center">
                        The geographic rendering engine encountered a fatal exception. WebGL context may have been lost or the coordinate payload was corrupted.
                    </p>
                    <p className="mt-4 text-xs opacity-50 font-sans break-all">
                        {this.state.error?.message}
                    </p>
                    <button
                        className="mt-6 border border-[#FF0000]/50 px-4 py-2 text-xs uppercase hover:bg-[#FF0000]/20 transition-colors"
                        onClick={() => this.setState({ hasError: false, error: null })}
                    >
                        [Force Re-initialize]
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default SceneErrorBoundary;
