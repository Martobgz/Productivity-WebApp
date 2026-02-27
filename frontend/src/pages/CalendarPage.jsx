import { useState, useEffect, useCallback } from "react";
import { Calendar as CalendarIcon, Plus, Trash2, X, Clock, ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import { getEvents, createEvent, updateEvent, deleteEvent } from "../api/calendar";

const COLORS = [
    { label: "Blue", value: "#3b82f6" },
    { label: "Purple", value: "#8b5cf6" },
    { label: "Emerald", value: "#10b981" },
    { label: "Amber", value: "#f59e0b" },
    { label: "Rose", value: "#f43f5e" },
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

/* ─── Add Event Dialog ─── */
const AddEventDialog = ({ onClose, onSave, selectedDate }) => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState(selectedDate || new Date().toISOString().split("T")[0]);
    const [startTime, setStartTime] = useState("09:00");
    const [endTime, setEndTime] = useState("10:00");
    const [allDay, setAllDay] = useState(false);
    const [color, setColor] = useState(COLORS[0].value);
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title) return;
        setSaving(true);

        const startIso = allDay
            ? new Date(`${date}T00:00:00`).toISOString()
            : new Date(`${date}T${startTime}:00`).toISOString();
        const endIso = allDay
            ? new Date(`${date}T23:59:59`).toISOString()
            : new Date(`${date}T${endTime}:00`).toISOString();

        try {
            await onSave({
                title,
                description,
                start_time: startIso,
                end_time: endIso,
                all_day: allDay,
                color,
            });
            onClose();
        } catch {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={onClose}>
            <div className="card-gradient p-8 w-full max-w-sm animate-fade-in" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-foreground">New Event</h3>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        placeholder="Event title"
                        className="input-dark"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        autoFocus
                    />

                    <textarea
                        placeholder="Description (optional)"
                        className="input-dark min-h-[60px] resize-none"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />

                    <input
                        type="date"
                        className="input-dark"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />

                    <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                        <input
                            type="checkbox"
                            checked={allDay}
                            onChange={(e) => setAllDay(e.target.checked)}
                            className="accent-primary"
                        />
                        All day
                    </label>

                    {!allDay && (
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <label className="text-xs text-muted-foreground mb-1 block">Start</label>
                                <input type="time" className="input-dark" value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)} />
                            </div>
                            <div className="flex-1">
                                <label className="text-xs text-muted-foreground mb-1 block">End</label>
                                <input type="time" className="input-dark" value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)} />
                            </div>
                        </div>
                    )}

                    {/* Color picker */}
                    <div>
                        <label className="text-xs text-muted-foreground mb-2 block">Color</label>
                        <div className="flex gap-2">
                            {COLORS.map((c) => (
                                <button key={c.value} type="button"
                                    onClick={() => setColor(c.value)}
                                    className={`w-7 h-7 rounded-full border-2 transition-all ${color === c.value ? "border-white scale-110" : "border-transparent opacity-60 hover:opacity-100"}`}
                                    style={{ background: c.value }}
                                />
                            ))}
                        </div>
                    </div>

                    <button type="submit" className="btn-primary w-full" disabled={saving || !title}>
                        {saving ? "Saving..." : "Create Event"}
                    </button>
                </form>
            </div>
        </div>
    );
};

/* ─── Edit Event Dialog ─── */
const EditEventDialog = ({ event, onClose, onSave }) => {
    const [title, setTitle] = useState(event.title);
    const [description, setDescription] = useState(event.description || "");
    const dt = new Date(event.start_time);
    const dtEnd = new Date(event.end_time);
    const [date, setDate] = useState(dt.toISOString().split("T")[0]);
    const [startTime, setStartTime] = useState(dt.toTimeString().slice(0, 5));
    const [endTime, setEndTime] = useState(dtEnd.toTimeString().slice(0, 5));
    const [allDay, setAllDay] = useState(event.all_day || false);
    const [color, setColor] = useState(event.color || COLORS[0].value);
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title) return;
        setSaving(true);
        const startIso = allDay
            ? new Date(`${date}T00:00:00`).toISOString()
            : new Date(`${date}T${startTime}:00`).toISOString();
        const endIso = allDay
            ? new Date(`${date}T23:59:59`).toISOString()
            : new Date(`${date}T${endTime}:00`).toISOString();
        try {
            await onSave(event.id, { title, description, start_time: startIso, end_time: endIso, all_day: allDay, color });
            onClose();
        } catch { setSaving(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="card-gradient p-8 w-full max-w-sm animate-fade-in" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-foreground">Edit Event</h3>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" placeholder="Event title" className="input-dark" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
                    <textarea placeholder="Description (optional)" className="input-dark min-h-[60px] resize-none" value={description} onChange={(e) => setDescription(e.target.value)} />
                    <input type="date" className="input-dark" value={date} onChange={(e) => setDate(e.target.value)} />
                    <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                        <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} className="accent-primary" /> All day
                    </label>
                    {!allDay && (
                        <div className="flex gap-3">
                            <div className="flex-1"><label className="text-xs text-muted-foreground mb-1 block">Start</label><input type="time" className="input-dark" value={startTime} onChange={(e) => setStartTime(e.target.value)} /></div>
                            <div className="flex-1"><label className="text-xs text-muted-foreground mb-1 block">End</label><input type="time" className="input-dark" value={endTime} onChange={(e) => setEndTime(e.target.value)} /></div>
                        </div>
                    )}
                    <div>
                        <label className="text-xs text-muted-foreground mb-2 block">Color</label>
                        <div className="flex gap-2">
                            {COLORS.map((c) => (
                                <button key={c.value} type="button" onClick={() => setColor(c.value)}
                                    className={`w-7 h-7 rounded-full border-2 transition-all ${color === c.value ? "border-white scale-110" : "border-transparent opacity-60 hover:opacity-100"}`}
                                    style={{ background: c.value }} />
                            ))}
                        </div>
                    </div>
                    <button type="submit" className="btn-primary w-full" disabled={saving || !title}>{saving ? "Saving..." : "Save Changes"}</button>
                </form>
            </div>
        </div>
    );
};

/* ─── Calendar Page ─── */
const CalendarPage = () => {
    const [events, setEvents] = useState([]);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);

    const fetchEvents = useCallback(async () => {
        try {
            const res = await getEvents();
            setEvents(res.data);
        } catch (err) {
            console.error("Failed to fetch events", err);
        }
    }, []);

    useEffect(() => { fetchEvents(); }, [fetchEvents]);

    const handleSaveEvent = async (eventData) => {
        await createEvent(eventData);
        await fetchEvents();
    };

    const handleUpdateEvent = async (id, data) => {
        await updateEvent(id, data);
        await fetchEvents();
    };

    const handleDeleteEvent = async (id) => {
        try {
            await deleteEvent(id);
            await fetchEvents();
        } catch (err) {
            console.error("Failed to delete event", err);
        }
    };

    /* ─── Calendar grid helpers ─── */
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    const today = new Date();
    const isToday = (d) =>
        d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

    /* events for a specific day */
    const eventsForDay = (day) => {
        const dayStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        return events.filter((ev) => ev.start_time?.startsWith(dayStr));
    };

    /* build grid cells: blanks + days */
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    const handleDayClick = (day) => {
        if (!day) return;
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        setSelectedDate(dateStr);
        setShowAddDialog(true);
    };

    return (
        <div className="max-w-4xl mx-auto px-6 py-12 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 mb-8">
                <div className="flex items-center gap-3">
                    <CalendarIcon size={24} className="text-primary" />
                    <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
                </div>
                <button
                    onClick={() => { setSelectedDate(null); setShowAddDialog(true); }}
                    className="btn-primary flex items-center gap-2 px-4 h-9 text-xs"
                >
                    <Plus size={14} /> Add Event
                </button>
            </div>

            {/* Month navigation */}
            <div className="flex items-center justify-between mb-6">
                <button onClick={prevMonth}
                    className="p-2 rounded-lg hover:bg-accent text-muted-foreground transition-colors">
                    <ChevronLeft size={20} />
                </button>
                <h2 className="text-lg font-semibold text-foreground">
                    {MONTH_NAMES[month]} {year}
                </h2>
                <button onClick={nextMonth}
                    className="p-2 rounded-lg hover:bg-accent text-muted-foreground transition-colors">
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
                {DAY_NAMES.map((d) => (
                    <div key={d} className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider py-2">
                        {d}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
                {cells.map((day, idx) => {
                    const dayEvents = day ? eventsForDay(day) : [];
                    return (
                        <div
                            key={idx}
                            onClick={() => handleDayClick(day)}
                            className={`min-h-[90px] rounded-lg p-2 border transition-all cursor-pointer
                                ${day ? "border-border/50 hover:border-primary/30 hover:bg-surface-700/30" : "border-transparent"}
                                ${isToday(day) ? "bg-primary/5 border-primary/30" : ""}`}
                        >
                            {day && (
                                <>
                                    <span className={`text-xs font-medium ${isToday(day) ? "text-primary" : "text-muted-foreground"}`}>
                                        {day}
                                    </span>
                                    <div className="mt-1 space-y-1">
                                        {dayEvents.slice(0, 3).map((ev) => (
                                            <div
                                                key={ev.id}
                                                onClick={(e) => { e.stopPropagation(); setEditingEvent(ev); }}
                                                className="group flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] truncate cursor-pointer"
                                                style={{ backgroundColor: `${ev.color || "#3b82f6"}20`, color: ev.color || "#3b82f6" }}
                                            >
                                                <span className="truncate flex-1">{ev.title}</span>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteEvent(ev.id); }}
                                                    className="opacity-0 group-hover:opacity-100 shrink-0 hover:text-destructive transition-all"
                                                >
                                                    <Trash2 size={10} />
                                                </button>
                                            </div>
                                        ))}
                                        {dayEvents.length > 3 && (
                                            <span className="text-[10px] text-muted-foreground px-1">+{dayEvents.length - 3} more</span>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Upcoming events list */}
            {events.length > 0 && (
                <div className="mt-10">
                    <h3 className="text-sm font-semibold text-foreground mb-4">Upcoming Events</h3>
                    <div className="space-y-2">
                        {events.slice(0, 10).map((ev) => {
                            const dt = new Date(ev.start_time);
                            return (
                                <div key={ev.id} onClick={() => setEditingEvent(ev)} className="flex items-center gap-3 p-3 rounded-lg bg-surface-800 border border-border group cursor-pointer hover:border-primary/30 transition-all">
                                    <div className="w-2 h-8 rounded-full shrink-0" style={{ background: ev.color || "#3b82f6" }} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">{ev.title}</p>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Clock size={10} />
                                            {dt.toLocaleDateString()} · {ev.all_day ? "All day" : dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                        </p>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteEvent(ev.id); }}
                                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Edit dialog */}
            {editingEvent && (
                <EditEventDialog
                    event={editingEvent}
                    onClose={() => setEditingEvent(null)}
                    onSave={handleUpdateEvent}
                />
            )}

            {/* Add dialog */}
            {showAddDialog && (
                <AddEventDialog
                    selectedDate={selectedDate}
                    onClose={() => setShowAddDialog(false)}
                    onSave={handleSaveEvent}
                />
            )}
        </div>
    );
};

export default CalendarPage;
