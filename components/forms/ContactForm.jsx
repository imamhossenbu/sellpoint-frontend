// components/forms/ContactForm.jsx
"use client";

import { useState } from "react";

export default function ContactForm() {
    const [values, setValues] = useState({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
    });
    const [status, setStatus] = useState({ sending: false, ok: null, msg: "" });

    const onChange = (e) => {
        const { name, value } = e.target;
        setValues((s) => ({ ...s, [name]: value }));
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setStatus({ sending: true, ok: null, msg: "" });

        // Basic required fields check
        if (!values.name || !values.email || !values.message) {
            setStatus({ sending: false, ok: false, msg: "Please fill the required fields." });
            return;
        }

        try {
            // TODO: replace with your API route
            // await fetch("/api/contact", { method: "POST", body: JSON.stringify(values) });
            await new Promise((r) => setTimeout(r, 800)); // demo delay

            setStatus({ sending: false, ok: true, msg: "Thanks! We’ll get back to you soon." });
            setValues({ name: "", email: "", phone: "", subject: "", message: "" });
        } catch (e) {
            setStatus({
                sending: false,
                ok: false,
                msg: "Something went wrong. Please try again later.",
            });
        }
    };

    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
                <Field
                    label="Name"
                    name="name"
                    value={values.name}
                    onChange={onChange}
                    required
                    placeholder="Your full name"
                />
                <Field
                    label="Email"
                    name="email"
                    type="email"
                    value={values.email}
                    onChange={onChange}
                    required
                    placeholder="you@example.com"
                />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
                <Field
                    label="Phone"
                    name="phone"
                    value={values.phone}
                    onChange={onChange}
                    placeholder="+880 1234-567890"
                />
                <Field
                    label="Subject"
                    name="subject"
                    value={values.subject}
                    onChange={onChange}
                    placeholder="How can we help?"
                />
            </div>
            <Field
                label="Message"
                name="message"
                textarea
                value={values.message}
                onChange={onChange}
                required
                placeholder="Write your message..."
            />

            <div className="flex items-center gap-3">
                <button
                    type="submit"
                    disabled={status.sending}
                    className="inline-flex items-center justify-center rounded-xl bg-[var(--sp-primary)] px-4 py-2.5 text-white font-medium hover:opacity-90 disabled:opacity-60"
                >
                    {status.sending ? "Sending..." : "Send Message"}
                </button>
                {status.msg ? (
                    <p className={`text-sm ${status.ok ? "text-emerald-600" : "text-rose-600"}`}>
                        {status.msg}
                    </p>
                ) : null}
            </div>
        </form>
    );
}

function Field({
    label,
    name,
    value,
    onChange,
    type = "text",
    textarea = false,
    required = false,
    placeholder = "",
}) {
    return (
        <label className="block text-sm">
            <span className="text-slate-700">
                {label} {required ? <span className="text-rose-500">*</span> : null}
            </span>
            {textarea ? (
                <textarea
                    name={name}
                    value={value}
                    onChange={onChange}
                    required={required}
                    placeholder={placeholder}
                    rows={5}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none ring-[var(--sp-primary)]/20 focus:ring-2"
                />
            ) : (
                <input
                    name={name}
                    type={type}
                    value={value}
                    onChange={onChange}
                    required={required}
                    placeholder={placeholder}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none ring-[var(--sp-primary)]/20 focus:ring-2"
                />
            )}
        </label>
    );
}
