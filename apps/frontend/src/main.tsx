import React, { type ErrorInfo, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "@/App.tsx";
import "./index.css";

class ErrorBoundary extends React.Component<
	{ children: React.ReactNode },
	{ hasError: boolean; error: Error | null }
> {
	constructor(props: { children: React.ReactNode }) {
		super(props);
		this.state = { hasError: false, error: null };
	}
	static getDerivedStateFromError(error: Error) {
		return { hasError: true, error };
	}
	componentDidCatch(error: Error, info: ErrorInfo) {
		console.error("ErrorBoundary caught an error", error, info);
	}
	render() {
		if (this.state.hasError) {
			return (
				<div style={{ padding: "20px", color: "red", fontFamily: "monospace" }}>
					<h2>Something went wrong.</h2>
					<details style={{ whiteSpace: "pre-wrap" }}>
						{this.state.error?.toString()}
						<br />
						{this.state.error?.stack}
					</details>
				</div>
			);
		}
		return this.props.children;
	}
}

const rootElement = document.getElementById("root");
if (rootElement) {
	createRoot(rootElement).render(
		<StrictMode>
			<ErrorBoundary>
				<App />
			</ErrorBoundary>
		</StrictMode>,
	);
}
