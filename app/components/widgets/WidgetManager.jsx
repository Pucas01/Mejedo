"use client";
import { useWidgets } from "../../hooks/useWidgets";
import WidgetWindow from "./WidgetWindow";
import FloatingWidgetButton from "./FloatingWidgetButton";
import WidgetMenu from "./WidgetMenu";

export default function WidgetManager() {
  const { widgets, isLoaded } = useWidgets();

  if (!isLoaded) return null;

  // Get all non-minimized widgets
  const activeWidgets = Array.from(widgets.values()).filter(w => !w.minimized);

  return (
    <>
      {/* Render all active widgets */}
      {activeWidgets.map(widget => (
        <WidgetWindow key={widget.id} widget={widget} />
      ))}

      {/* Floating '+' button */}
      <FloatingWidgetButton />

      {/* Widget selection menu */}
      <WidgetMenu />
    </>
  );
}
