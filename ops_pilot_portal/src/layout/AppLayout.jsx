import { useEffect, useState } from "react";
import { Outlet } from "react-router";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

export default function AppLayout() {
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");

	useEffect(() => {
		if (!sidebarOpen) return;
		const closeOnEscape = (event) => {
			if (event.key === "Escape") setSidebarOpen(false);
		};
		document.addEventListener("keydown", closeOnEscape);
		return () => document.removeEventListener("keydown", closeOnEscape);
	}, [sidebarOpen]);

	return (
		<div className="flex min-h-screen bg-[#f8faff]">
			{sidebarOpen && (
				<button type="button" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-40 bg-black/40 lg:hidden" />
			)}
			<Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} searchQuery={searchQuery} />
			<div className="min-w-0 flex-1">
				<Header onOpenSidebar={() => setSidebarOpen(true)} searchQuery={searchQuery} onSearchChange={setSearchQuery} />
				<main className="px-5 py-6 sm:px-8"><Outlet /></main>
			</div>
		</div>
	);
}
