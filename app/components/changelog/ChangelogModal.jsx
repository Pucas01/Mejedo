"use client";
import { useState, useEffect } from "react";
import { useCurrentUser } from "../../hooks/CurrentUser.js";
import { useAchievements } from "../../hooks/useAchievements.js";

export default function ChangelogModal({ show, onClose }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingVersion, setEditingVersion] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const { isAdmin } = useCurrentUser();
  const { unlock } = useAchievements();

  const fetchChangelog = () => {
    fetch("/api/changelog")
      .then((res) => res.json())
      .then((data) => {
        setVersions(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch changelog:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (show) {
      fetchChangelog();
      unlock("changelog_reader");
    }
  }, [show, unlock]);

  const handleDelete = async (version) => {
    if (!confirm(`Delete version ${version}?`)) return;

    try {
      const res = await fetch(`/api/changelog/${version}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        fetchChangelog();
      }
    } catch (err) {
      console.error("Failed to delete version:", err);
    }
  };

  const handleSave = async (versionData) => {
    try {
      const res = await fetch("/api/changelog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(versionData),
      });

      if (res.ok) {
        fetchChangelog();
        setEditingVersion(null);
        setIsAdding(false);
      } else {
        const error = await res.json();
        alert(`Failed to save: ${error.error || "Unknown error"}`);
        console.error("Save failed:", error);
      }
    } catch (err) {
      console.error("Failed to save version:", err);
      alert("Failed to save version. Check console for details.");
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!show) return null;

  if (editingVersion || isAdding) {
    return (
      <VersionEditor
        version={editingVersion}
        onSave={handleSave}
        onCancel={() => {
          setEditingVersion(null);
          setIsAdding(false);
        }}
      />
    );
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="bg-[#121217] border-2 border-[#39ff14] shadow-lg max-w-[700px] w-full max-h-[80vh] overflow-hidden flex flex-col animate-slideUp">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 bg-[#090909] border-b-2 border-[#39ff14]">
          <div className="font-mono">
            <span className="text-[#39ff14]">pucas01</span>
            <span className="text-white">@</span>
            <span className="text-[#D73DA3]">PucasArch</span>
            <span className="text-white">:</span>
            <span className="text-[#FF5555]">~</span>
            <span className="text-white">$</span>
            <span className="text-gray-400 ml-2">cat CHANGELOG.md</span>
          </div>
          <div className="flex gap-3 items-center">
            {isAdmin && (
              <button
                onClick={() => setIsAdding(true)}
                className="text-gray-500 cursor-pointer hover:text-[#39ff14] font-mono transition-colors"
              >
                [+]
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
              }}
              className="text-gray-500 cursor-pointer hover:text-[#39ff14] font-mono transition-colors"
            >
              [X]
            </button>
          </div>
        </div>

        {/* Changelog list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="text-center text-gray-400">Loading changelog...</div>
          ) : versions.length === 0 ? (
            <div className="text-center text-gray-400">No changelog entries found</div>
          ) : (
            versions.map((version, idx) => (
              <div key={idx} className="border-l-2 border-[#39ff14] pl-4 relative group">
                {/* Admin controls */}
                {isAdmin && (
                  <div className="absolute -right-2 top-0 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditingVersion(version)}
                      className="text-blue-400 hover:text-blue-300 text-sm cursor-pointer"
                    >
                      [Edit]
                    </button>
                    <button
                      onClick={() => handleDelete(version.version)}
                      className="text-red-400 hover:text-red-300 text-sm cursor-pointer"
                    >
                      [Del]
                    </button>
                  </div>
                )}

                {/* Version header */}
                <div className="flex items-baseline gap-3 mb-2">
                  <h3 className="text-[#39ff14] text-xl font-bold">
                    v{version.version}
                  </h3>
                  <span className="text-gray-500 text-sm">{version.date}</span>
                </div>

                {/* Changes by category */}
                {version.added && version.added.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-green-400 font-semibold mb-1">Things added</h4>
                    <ul className="list-none space-y-1 text-gray-300">
                      {version.added.map((item, i) => (
                        <li key={i} className="pl-4">
                          <span className="text-[#39ff14]">→</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {version.changed && version.changed.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-blue-400 font-semibold mb-1">Stuff changed</h4>
                    <ul className="list-none space-y-1 text-gray-300">
                      {version.changed.map((item, i) => (
                        <li key={i} className="pl-4">
                          <span className="text-[#39ff14]">→</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {version.fixed && version.fixed.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-yellow-400 font-semibold mb-1">Bugs Fixed</h4>
                    <ul className="list-none space-y-1 text-gray-300">
                      {version.fixed.map((item, i) => (
                        <li key={i} className="pl-4">
                          <span className="text-[#39ff14]">→</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {version.removed && version.removed.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-red-400 font-semibold mb-1">Stuff removed</h4>
                    <ul className="list-none space-y-1 text-gray-300">
                      {version.removed.map((item, i) => (
                        <li key={i} className="pl-4">
                          <span className="text-[#39ff14]">→</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#090909] border-t border-[#39ff14]/30 text-center text-gray-500 text-sm">
          Stay updated with the latest changes!
        </div>
      </div>
    </div>
  );
}

function VersionEditor({ version, onSave, onCancel }) {
  const [formData, setFormData] = useState(
    version || {
      version: "",
      date: new Date().toISOString().split("T")[0],
      added: [],
      changed: [],
      fixed: [],
      removed: [],
    }
  );

  const [newItems, setNewItems] = useState({
    added: "",
    changed: "",
    fixed: "",
    removed: "",
  });

  const handleAddItem = (category) => {
    if (!newItems[category].trim()) return;
    setFormData({
      ...formData,
      [category]: [...formData[category], newItems[category].trim()],
    });
    setNewItems({ ...newItems, [category]: "" });
  };

  const handleRemoveItem = (category, index) => {
    setFormData({
      ...formData,
      [category]: formData[category].filter((_, i) => i !== index),
    });
  };

  const handleSubmit = () => {
    if (!formData.version.trim()) {
      alert("Version number is required");
      return;
    }
    console.log("Submitting changelog data:", formData);
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 animate-fadeIn">
      <div className="bg-[#121217] border-2 border-[#39ff14] shadow-lg max-w-[700px] w-full max-h-[80vh] overflow-hidden flex flex-col animate-slideUp">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 bg-[#090909] border-b-2 border-[#39ff14]">
          <div className="font-mono text-[#39ff14]">
            {version ? "Edit Version" : "New Version"}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCancel();
            }}
            className="text-gray-500 cursor-pointer hover:text-[#39ff14] font-mono transition-colors"
          >
            [X]
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Version and Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Version</label>
              <input
                type="text"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                className="w-full bg-[#090909] border border-[#39ff14] text-white px-3 py-2 focus:outline-none focus:border-[#39ff14]"
                placeholder="2.0.4"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full bg-[#090909] border border-[#39ff14] text-white px-3 py-2 focus:outline-none focus:border-[#39ff14]"
              />
            </div>
          </div>

          {/* Categories */}
          {[
            { key: "added", label: "Things added", color: "green-400" },
            { key: "changed", label: "Stuff changed", color: "blue-400" },
            { key: "fixed", label: "Bugs Fixed", color: "yellow-400" },
            { key: "removed", label: "Stuff removed", color: "red-400" },
          ].map(({ key, label, color }) => (
            <div key={key}>
              <label className={`text-${color} font-semibold mb-2 block`}>{label}</label>
              <div className="space-y-2">
                {formData[key].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-gray-300 flex-1">{item}</span>
                    <button
                      onClick={() => handleRemoveItem(key, idx)}
                      className="text-red-400 hover:text-red-300 text-sm cursor-pointer"
                    >
                      [X]
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newItems[key]}
                    onChange={(e) => setNewItems({ ...newItems, [key]: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddItem(key);
                      }
                    }}
                    className="flex-1 bg-[#090909] border border-gray-600 text-white px-3 py-2 focus:outline-none focus:border-[#39ff14]"
                    placeholder="Add item..."
                  />
                  <button
                    onClick={() => handleAddItem(key)}
                    className="bg-[#39ff14] text-black px-4 py-2 cursor-pointer hover:bg-[#2dd10d] transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#090909] border-t border-[#39ff14]/30 flex justify-end gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCancel();
            }}
            className="px-4 py-2 border border-gray-600 text-gray-400 cursor-pointer hover:border-[#39ff14] hover:text-[#39ff14] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-[#39ff14] text-black cursor-pointer hover:bg-[#2dd10d] transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
