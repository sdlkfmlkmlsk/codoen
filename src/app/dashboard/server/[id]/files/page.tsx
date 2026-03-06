"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { FolderOpen, File, FileText, ChevronRight, Search, Loader2, HardDrive, MoreVertical, Trash2, Download, Edit2, Plus, ArrowLeft, Pencil, ArrowRight, Shield, Archive } from "lucide-react";

export default function FileManagerPage() {
    const params = useParams();
    const serverId = params?.id as string;

    const [files, setFiles] = useState<any[]>([]);
    const [directory, setDirectory] = useState("/");
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
    const filteredFiles = files.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const [showBanner, setShowBanner] = useState(true);

    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [editingFile, setEditingFile] = useState<any | null>(null);
    const [editedContent, setEditedContent] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isNewFileModalOpen, setIsNewFileModalOpen] = useState(false);
    const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
    const [newItemName, setNewItemName] = useState("");
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const [actionModal, setActionModal] = useState<{
        isOpen: boolean;
        title: string;
        label: string;
        value: string;
        placeholder: string;
        icon: React.ReactNode;
        onConfirm: (val: string) => void;
    }>({
        isOpen: false,
        title: "",
        label: "",
        value: "",
        placeholder: "",
        icon: null,
        onConfirm: () => { }
    });

    const [uploadState, setUploadState] = useState<{
        isUploading: boolean;
        fileName: string;
        progress: number;
        loaded: number;
        total: number;
    }>({
        isUploading: false,
        fileName: "",
        progress: 0,
        loaded: 0,
        total: 0
    });

    const fetchFiles = useCallback(async (dir: string) => {
        setLoading(true);
        setSelectedFiles([]);
        try {
            const res = await fetch(`/api/panel/servers/${serverId}/files/list?directory=${encodeURIComponent(dir)}`);
            const data = await res.json();
            if (data.data) {
                // Map with exhaustive directory detection
                setFiles(data.data.map((f: any) => {
                    const isDir = f.attributes.is_directory || f.object === "directory" || f.attributes.mimetype === "inode/directory";
                    return {
                        ...f.attributes,
                        is_directory: !!isDir,
                        object_type: f.object,
                        mode: f.attributes.mode || "-"
                    };
                }));
            } else {
                setFiles([]);
            }
        } catch (err) {
            console.error("Failed to fetch files:", err);
        } finally {
            setLoading(false);
        }
    }, [serverId]);

    const isDirItem = (file: any) => !!(file.is_directory || file.object_type === 'directory');

    useEffect(() => {
        if (serverId) fetchFiles(directory);
    }, [serverId, directory, fetchFiles]);

    const toggleSelectAll = () => {
        if (selectedFiles.length === filteredFiles.length) {
            setSelectedFiles([]);
        } else {
            setSelectedFiles(filteredFiles.map(f => f.name));
        }
    };

    const toggleSelectFile = (name: string) => {
        setSelectedFiles(prev =>
            prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
        );
    };

    const openEditor = async (file: any) => {
        if (isDirItem(file)) return;
        setEditingFile(file);
        setLoading(true);
        try {
            const path = directory === "/" ? `/${file.name}` : `${directory}/${file.name}`;
            const res = await fetch(`/api/panel/servers/${serverId}/files/content?file=${encodeURIComponent(path)}`);
            const content = await res.text();
            setEditedContent(content);
        } catch (err) {
            console.error("Failed to fetch file content:", err);
        } finally {
            setLoading(false);
        }
    };

    const saveFile = async () => {
        if (!editingFile) return;
        setIsSaving(true);
        try {
            const path = directory === "/" ? `/${editingFile.name}` : `${directory.replace(/\/$/, "")}/${editingFile.name}`;
            const res = await fetch(`/api/panel/servers/${serverId}/files/content?file=${encodeURIComponent(path)}`, {
                method: "POST",
                body: editedContent
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || "Failed to save file content");
            }

            setEditingFile(null);
            fetchFiles(directory);
        } catch (err: any) {
            console.error("Failed to save file:", err);
            alert(`Error: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (file: any) => {
        if (!confirm(`Are you sure you want to delete ${file.name}?`)) return;
        try {
            await fetch(`/api/panel/servers/${serverId}/files/delete`, {
                method: "POST",
                body: JSON.stringify({ root: directory, files: [file.name] })
            });
            fetchFiles(directory);
        } catch (err) {
            console.error("Failed to delete file:", err);
        }
    };

    const handleCreateFolder = async () => {
        if (!newItemName) return;
        try {
            await fetch(`/api/panel/servers/${serverId}/files/create-folder`, {
                method: "POST",
                body: JSON.stringify({ root: directory, name: newItemName })
            });
            setNewItemName("");
            setIsNewFolderModalOpen(false);
            fetchFiles(directory);
        } catch (err) {
            console.error("Failed to create folder:", err);
        }
    };

    const handleCreateFile = async () => {
        if (!newItemName) return;
        try {
            const path = directory === "/" ? `/${newItemName}` : `${directory}/${newItemName}`;
            await fetch(`/api/panel/servers/${serverId}/files/content?file=${encodeURIComponent(path)}`, {
                method: "POST",
                body: ""
            });
            setNewItemName("");
            setIsNewFileModalOpen(false);
            fetchFiles(directory);
        } catch (err) {
            console.error("Failed to create file:", err);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadState({
            isUploading: true,
            fileName: file.name,
            progress: 0,
            loaded: 0,
            total: file.size
        });

        try {
            const formData = new FormData();
            formData.append("files", file);

            const xhr = new XMLHttpRequest();
            xhr.open("POST", `/api/panel/servers/${serverId}/files/upload?directory=${encodeURIComponent(directory)}`);

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const progress = Math.round((event.loaded / event.total) * 100);
                    setUploadState(prev => ({
                        ...prev,
                        progress,
                        loaded: event.loaded,
                        total: event.total
                    }));
                }
            };

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    fetchFiles(directory);
                    setTimeout(() => {
                        setUploadState(prev => ({ ...prev, isUploading: false }));
                    }, 500);
                } else {
                    alert("Upload failed. Please try again.");
                    setUploadState(prev => ({ ...prev, isUploading: false }));
                }
            };

            xhr.onerror = () => {
                alert("Upload failed. Please try again.");
                setUploadState(prev => ({ ...prev, isUploading: false }));
            };

            xhr.send(formData);
        } catch (err) {
            console.error("Upload failed:", err);
            alert("Upload failed. Please try again.");
            setUploadState(prev => ({ ...prev, isUploading: false }));
        }
    };

    const handleAction = async (action: string, body: any) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/panel/servers/${serverId}/files/${action}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });
            if (!res.ok) throw new Error(`${action} failed`);
            fetchFiles(directory);
        } catch (err) {
            console.error(`${action} failed:`, err);
            alert(`${action} failed. Please try again.`);
        } finally {
            setLoading(false);
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const getRelativeTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return "just now";
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        if (diffInSeconds < 172800) return "yesterday";
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;

        return formatDate(dateStr);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const m = months[date.getMonth()];
        const d = date.getDate();
        const y = date.getFullYear();

        let hours = date.getHours();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        const mins = date.getMinutes().toString().padStart(2, '0');

        const suffix = (d: number) => {
            if (d > 3 && d < 21) return 'th';
            switch (d % 10) {
                case 1: return "st";
                case 2: return "nd";
                case 3: return "rd";
                default: return "th";
            }
        };

        return `${m} ${d}${suffix(d)}, ${y} ${hours}:${mins}${ampm}`;
    };

    const navigateTo = (name: string) => {
        setDirectory(prev => {
            if (prev === "/") return `/${name}`;
            return `${prev.replace(/\/$/, "")}/${name}`;
        });
    };

    const navigateToPath = (pathParts: string[]) => {
        if (pathParts.length === 0) {
            setDirectory("/");
        } else {
            setDirectory("/" + pathParts.join("/"));
        }
    };

    const goBack = () => {
        if (directory === "/") return;
        const parts = directory.split("/").filter(Boolean);
        parts.pop();
        setDirectory(parts.length === 0 ? "/" : "/" + parts.join("/"));
    };

    const breadcrumbs = directory.split("/").filter(Boolean);

    const handleMassDelete = async () => {
        if (selectedFiles.length === 0) return;
        if (!confirm(`Are you sure you want to delete ${selectedFiles.length} items?`)) return;

        try {
            await fetch(`/api/panel/servers/${serverId}/files/delete`, {
                method: "POST",
                body: JSON.stringify({ root: directory, files: selectedFiles })
            });
            setSelectedFiles([]);
            fetchFiles(directory);
        } catch (err) {
            console.error("Failed to delete files:", err);
        }
    };

    return (
        <div className="p-4 md:p-8 flex flex-col min-h-screen text-white font-sans max-w-[1200px] mx-auto w-full">

            {/* Header / Path & Actions */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 bg-[#0B1021]/50 border border-white/5 rounded-xl p-4 shadow-lg backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded border border-white/10 flex items-center justify-center bg-white/5 mr-2 overflow-hidden transition-colors">
                        <input
                            type="checkbox"
                            checked={selectedFiles.length === filteredFiles.length && filteredFiles.length > 0}
                            onChange={toggleSelectAll}
                            className="w-full h-full appearance-none checked:bg-blue-600 cursor-pointer transition-colors"
                        />
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-tight uppercase">
                        <button onClick={() => setDirectory("/")} className="text-white/40 hover:text-white transition-colors">/ home / container /</button>
                        {breadcrumbs.map((part, i) => (
                            <React.Fragment key={i}>
                                <button
                                    onClick={() => i < breadcrumbs.length - 1 && navigateToPath(breadcrumbs.slice(0, i + 1))}
                                    className={i === breadcrumbs.length - 1 ? "text-white/80 cursor-default" : "text-white/40 hover:text-white transition-colors"}
                                >
                                    {part}
                                </button>
                                {i < breadcrumbs.length - 1 && <span className="text-white/20">/</span>}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {selectedFiles.length > 0 && (
                        <button
                            onClick={handleMassDelete}
                            className="h-9 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-[10px] font-black uppercase tracking-widest border border-red-500/20 transition-all flex items-center gap-2"
                        >
                            <Trash2 size={12} /> Delete ({selectedFiles.length})
                        </button>
                    )}
                    <button
                        onClick={() => setIsNewFolderModalOpen(true)}
                        className="h-9 px-4 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-500/20 transition-all flex items-center gap-2"
                    >
                        Create Directory
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleUpload}
                        className="hidden"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="h-9 px-4 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-500/20 transition-all flex items-center gap-2"
                    >
                        Upload
                    </button>
                    <button
                        onClick={() => setIsNewFileModalOpen(true)}
                        className="h-9 px-4 bg-blue-600 text-white hover:bg-blue-500 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center gap-2"
                    >
                        New File
                    </button>
                </div>
            </div>

            {/* Sub-header / Search */}
            <div className="mb-4 relative group">
                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-blue-400 transition-colors" />
                <input
                    type="text"
                    placeholder="Search files..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-[#0B1021]/30 border border-white/5 rounded-xl pl-11 pr-4 py-3 text-xs text-white placeholder:text-white/20 outline-none focus:border-blue-500/30 transition-all"
                />
            </div>

            {/* File List */}
            <div className="bg-[#0B1021]/30 border border-white/5 rounded-xl overflow-hidden shadow-2xl flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="h-64 flex flex-col items-center justify-center gap-3">
                            <Loader2 size={32} className="animate-spin text-blue-500/40" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Syncing...</span>
                        </div>
                    ) : filteredFiles.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center gap-4 text-white/5">
                            <HardDrive size={48} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/10">Directory is empty</span>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {filteredFiles.sort((a, b) => (isDirItem(b) ? 1 : 0) - (isDirItem(a) ? 1 : 0)).map((file) => {
                                const isDir = isDirItem(file);
                                const isSelected = selectedFiles.includes(file.name);
                                return (
                                    <div
                                        key={file.name}
                                        onClick={() => isDir ? navigateTo(file.name) : openEditor(file)}
                                        className={`relative flex items-center justify-between px-6 py-3 transition-all group hover:bg-white/[0.02] cursor-pointer ${isSelected ? 'bg-blue-600/5' : ''}`}
                                    >
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            <div
                                                className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${isSelected ? 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-500/20' : 'bg-white/5 border-white/10 group-hover:border-white/20'}`}
                                                onClick={(e) => { e.stopPropagation(); toggleSelectFile(file.name); }}
                                            >
                                                {isSelected && <Plus className="rotate-45 text-white" size={10} strokeWidth={4} />}
                                            </div>

                                            <div className={`${isDir ? 'text-blue-400' : 'text-white/40'}`}>
                                                {isDir ? <FolderOpen size={18} /> : <File size={18} />}
                                            </div>

                                            <div className="flex flex-col min-w-0">
                                                <span className="text-sm font-bold text-white/80 group-hover:text-white transition-colors truncate">{file.name}</span>
                                                <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-wider text-white/20">
                                                    <span>{isDir ? "Directory" : formatSize(file.size)}</span>
                                                    <span>•</span>
                                                    <span>{getRelativeTime(file.modified_at)}</span>
                                                    {isDir && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="text-blue-400/40 lowercase italic font-medium tracking-normal">Click to enter</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <span className="hidden md:block text-[9px] font-mono font-bold text-white/10 uppercase tracking-widest">{file.mode}</span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveMenu(activeMenu === file.name ? null : file.name);
                                                }}
                                                className="text-white/10 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5"
                                            >
                                                <MoreVertical size={16} />
                                            </button>

                                            {activeMenu === file.name && (
                                                <div
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="absolute right-12 top-0 bg-[#0B1021] border border-white/10 rounded-xl py-2 w-48 shadow-2xl z-[100] animate-in fade-in zoom-in duration-200"
                                                >
                                                    {!isDir && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); openEditor(file); setActiveMenu(null); }}
                                                            className="w-full text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/5 flex items-center gap-3 transition-colors text-white/70 hover:text-white"
                                                        >
                                                            <Edit2 size={12} className="text-blue-400" /> Edit File
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActionModal({
                                                                isOpen: true,
                                                                title: "Rename Item",
                                                                label: `Rename ${file.name} to:`,
                                                                value: file.name,
                                                                placeholder: "New name...",
                                                                icon: <Pencil size={32} className="text-blue-400" />,
                                                                onConfirm: (val: string) => {
                                                                    if (val && val !== file.name) {
                                                                        handleAction("rename", { root: directory, files: [{ from: file.name, to: val }] });
                                                                    }
                                                                }
                                                            });
                                                            setActiveMenu(null);
                                                        }}
                                                        className="w-full text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/5 flex items-center gap-3 transition-colors text-white/70 hover:text-white"
                                                    >
                                                        <Pencil size={12} className="text-blue-400" /> Rename
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActionModal({
                                                                isOpen: true,
                                                                title: "Move Item",
                                                                label: `Move ${file.name} to:`,
                                                                value: directory,
                                                                placeholder: "/path/to/destination",
                                                                icon: <ArrowRight size={32} className="text-blue-400" />,
                                                                onConfirm: (val: string) => {
                                                                    if (val) {
                                                                        handleAction("rename", {
                                                                            root: "/",
                                                                            files: [{
                                                                                from: (directory === "/" ? "" : directory) + "/" + file.name,
                                                                                to: (val === "/" ? "" : val) + "/" + file.name
                                                                            }]
                                                                        });
                                                                    }
                                                                }
                                                            });
                                                            setActiveMenu(null);
                                                        }}
                                                        className="w-full text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/5 flex items-center gap-3 transition-colors text-white/70 hover:text-white"
                                                    >
                                                        <ArrowRight size={12} className="text-blue-400" /> Move
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActionModal({
                                                                isOpen: true,
                                                                title: "Set Permissions",
                                                                label: `Permissions for ${file.name}:`,
                                                                value: file.mode,
                                                                placeholder: "644",
                                                                icon: <Shield size={32} className="text-blue-400" />,
                                                                onConfirm: (val: string) => {
                                                                    if (val) {
                                                                        handleAction("chmod", { root: directory, files: [{ file: file.name, mode: val }] });
                                                                    }
                                                                }
                                                            });
                                                            setActiveMenu(null);
                                                        }}
                                                        className="w-full text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/5 flex items-center gap-3 transition-colors text-white/70 hover:text-white"
                                                    >
                                                        <Shield size={12} className="text-blue-400" /> Permissions
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleAction("compress", { root: directory, files: [file.name] });
                                                            setActiveMenu(null);
                                                        }}
                                                        className="w-full text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/5 flex items-center gap-3 transition-colors text-white/70 hover:text-white"
                                                    >
                                                        <Archive size={12} className="text-blue-400" /> Compress
                                                    </button>
                                                    {!isDir && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setActiveMenu(null); }}
                                                            className="w-full text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/5 flex items-center gap-3 transition-colors text-white/70 hover:text-white"
                                                        >
                                                            <Download size={12} className="text-blue-400" /> Download
                                                        </button>
                                                    )}
                                                    <div className="h-px bg-white/5 my-1" />
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(file); setActiveMenu(null); }}
                                                        className="w-full text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-500/10 text-red-500/80 hover:text-red-500 flex items-center gap-3 transition-colors"
                                                    >
                                                        <Trash2 size={12} /> Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="mt-6 flex justify-center items-center gap-6 text-[9px] font-bold text-white/10 uppercase tracking-[0.3em]">
                <span>CODEON® Panel © 2024 - 2026</span>
            </div>

            {/* Editor Modal */}
            {editingFile && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[200] flex items-center justify-center p-6">
                    <div className="bg-[#0b0b1a] border border-white/5 w-full max-w-6xl h-[90vh] rounded-[3rem] overflow-hidden flex flex-col shadow-3xl animate-in zoom-in slide-in-from-bottom-8 duration-500">
                        <div className="p-10 border-b border-white/5 flex justify-between items-center bg-[#0d0d1e]">
                            <div className="flex items-center gap-6">
                                <div className="p-4 bg-blue-500/10 rounded-[1.5rem] flex items-center justify-center">
                                    <FileText size={24} className="text-blue-400" />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="font-bold text-2xl tracking-tighter text-white/95">{editingFile.name}</span>
                                    <span className="text-xs text-blue-400/40 uppercase tracking-widest font-extrabold">Editing {directory}</span>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setEditingFile(null)} className="px-8 py-4 bg-[#1a1a2e] hover:bg-[#252545] text-white rounded-2xl text-xs font-bold transition-all border border-white/10">
                                    Cancel
                                </button>
                                <button
                                    onClick={saveFile}
                                    disabled={isSaving}
                                    className="px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold transition-all shadow-2xl shadow-blue-500/20 active:scale-95"
                                >
                                    {isSaving ? "Saving..." : "Save Content"}
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 p-2 bg-black/20">
                            <textarea
                                value={editedContent}
                                onChange={(e) => setEditedContent(e.target.value)}
                                className="w-full h-full bg-transparent p-12 text-sm font-mono text-white/70 focus:outline-none resize-none custom-scrollbar leading-relaxed selection:bg-blue-500/30"
                                spellCheck={false}
                                placeholder="Write content here..."
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* New Item Modals */}
            {(isNewFileModalOpen || isNewFolderModalOpen) && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[300] flex items-center justify-center p-4">
                    <div className="bg-[#0d0d1e] border border-white/10 w-full max-w-md rounded-[3.5rem] p-12 shadow-3xl animate-in zoom-in duration-300">
                        <div className="mb-10 text-center">
                            <div className="w-16 h-16 bg-blue-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                {isNewFileModalOpen ? <File size={32} className="text-blue-400" /> : <FolderOpen size={32} className="text-blue-400" />}
                            </div>
                            <h3 className="text-2xl font-black mb-2 tracking-tight text-white/95">{isNewFileModalOpen ? "New File" : "New Folder"}</h3>
                            <p className="text-xs text-white/20 font-bold tracking-[0.2em] uppercase">Set name in {directory}</p>
                        </div>

                        <div className="relative mb-12 group">
                            <input
                                autoFocus
                                type="text"
                                value={newItemName}
                                onChange={(e) => setNewItemName(e.target.value)}
                                placeholder={isNewFileModalOpen ? "example.js" : "configs"}
                                className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-5 text-sm font-bold focus:outline-none focus:border-blue-500/40 transition-all text-white placeholder:text-white/10"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => { setIsNewFileModalOpen(false); setIsNewFolderModalOpen(false); setNewItemName(""); }}
                                className="flex-1 py-5 bg-[#1a1a2e] hover:bg-[#252545] text-white rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/5"
                            >
                                Close
                            </button>
                            <button
                                onClick={isNewFileModalOpen ? handleCreateFile : handleCreateFolder}
                                className="flex-1 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-500/20"
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Action Modal (Rename, Move, Permissions) */}
            {actionModal.isOpen && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[400] flex items-center justify-center p-4">
                    <div className="bg-[#0d0d1e] border border-white/10 w-full max-w-md rounded-[3.5rem] p-12 shadow-3xl animate-in zoom-in duration-300">
                        <div className="mb-10 text-center">
                            <div className="w-16 h-16 bg-blue-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                {actionModal.icon}
                            </div>
                            <h3 className="text-2xl font-black mb-2 tracking-tight text-white/95">{actionModal.title}</h3>
                            <p className="text-xs text-white/20 font-bold tracking-[0.2em] uppercase">{actionModal.label}</p>
                        </div>

                        <div className="relative mb-12 group">
                            <input
                                autoFocus
                                type="text"
                                value={actionModal.value}
                                onChange={(e) => setActionModal({ ...actionModal, value: e.target.value })}
                                placeholder={actionModal.placeholder}
                                className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-8 py-5 text-sm text-white placeholder:text-white/10 outline-none focus:border-blue-500/30 focus:bg-white/[0.05] transition-all"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        actionModal.onConfirm(actionModal.value);
                                        setActionModal({ ...actionModal, isOpen: false });
                                    } else if (e.key === "Escape") {
                                        setActionModal({ ...actionModal, isOpen: false });
                                    }
                                }}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setActionModal({ ...actionModal, isOpen: false })}
                                className="py-5 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-white/5 active:scale-95"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    actionModal.onConfirm(actionModal.value);
                                    setActionModal({ ...actionModal, isOpen: false });
                                }}
                                className="py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-2xl shadow-blue-500/20 active:scale-95"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Upload Progress Modal */}
            {uploadState.isUploading && (
                <div className="fixed bottom-12 right-12 z-[500] animate-in slide-in-from-right-12 duration-500">
                    <div className="bg-[#0d0d1e] border border-white/10 w-96 rounded-[2.5rem] p-8 shadow-3xl overflow-hidden relative">
                        {/* Progress Bar Background */}
                        <div className="absolute inset-0 bg-blue-500/5 -z-10" />

                        <div className="flex items-center gap-6 mb-6">
                            <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center shrink-0">
                                <Loader2 className="animate-spin text-blue-400" size={24} />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-sm font-bold text-white/95 truncate block">{uploadState.fileName}</span>
                                <span className="text-[10px] text-white/20 font-black uppercase tracking-[0.2em]">Uploading to {directory}</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Progress</span>
                                    <span className="text-2xl font-black text-white leading-none">{uploadState.progress}%</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-[9px] font-mono font-bold text-blue-400/40 uppercase tracking-widest block mb-1">Data Transferred</span>
                                    <span className="text-xs font-bold text-white/60">{formatSize(uploadState.loaded)} / {formatSize(uploadState.total)}</span>
                                </div>
                            </div>

                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-600 transition-all duration-300 ease-out shadow-[0_0_20px_rgba(37,99,235,0.4)]"
                                    style={{ width: `${uploadState.progress}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
