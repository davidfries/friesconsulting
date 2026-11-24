import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { business } from "../generated/content";

interface ContactLocationState {
  prefilledMessage?: string;
}

export function ContactPage() {
  const location = useLocation();
  const state = (location.state as ContactLocationState | null) ?? null;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("Charter / K-12 School");
  const [urgent, setUrgent] = useState(false);
  const [message, setMessage] = useState(state?.prefilledMessage ?? "");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    if (state?.prefilledMessage) {
      setMessage(state.prefilledMessage);
      return;
    }
    const params = new URLSearchParams(location.search);
    const brief = params.get("brief");
    if (brief) {
      setMessage(brief);
    }
  }, [state, location.search]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("submitting");
    setErrorText("");

    try {
      const formData = new FormData(event.currentTarget);
      if (urgent) {
        const rawMsg = String(formData.get("message") ?? "");
        formData.set("message", `[URGENT / ACTIVE INCIDENT]\n\n${rawMsg}`);
      }

      const response = await fetch(business.formspreeAction, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: formData,
      });

      if (response.ok) {
        setStatus("success");
        setName("");
        setEmail("");
        setUrgent(false);
        setMessage("");
      } else {
        const data = (await response.json().catch(() => null)) as
          | { errors?: Array<{ message: string }> }
          | null;
        setErrorText(
          data?.errors?.map((e) => e.message).join(" ") ||
            "Submission failed. Please check your details and try again."
        );
        setStatus("error");
      }
    } catch {
      setErrorText("Network error while sending your message. Please try again.");
      setStatus("error");
    }
  };

  return (
    <section className="section section--compact-top">
      <div className="container">
        <nav className="breadcrumbs" aria-label="Breadcrumb" style={{ marginBottom: "0.65rem" }}>
          <Link to="/">Home</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Contact</span>
        </nav>

        <div className="eyebrow" style={{ marginBottom: "0.35rem" }}>Scoping &amp; Direct Inquiries</div>
        <h1 style={{ marginBottom: "0.35rem" }}>Contact {business.legalName}</h1>
        <p className="lead" style={{ marginBottom: "1rem" }}>
          Tell us about your environment and what you are trying to solve. Every inquiry receives a
          direct reply.
        </p>

        <div className="contact-grid">
          <div style={{ display: "grid", gap: "1rem" }}>
            <div className="card" style={{ padding: "1.15rem 1.25rem" }}>
              <h2 style={{ fontSize: "1.18rem", marginBottom: "0.4rem" }}>What to include</h2>
              <p className="small muted" style={{ marginBottom: "0.65rem" }}>
                Covering these gets you a substantive engineering reply rather than a round of
                clarifying questions:
              </p>
              <ol className="contact-list-compact">
                {business.contactChecklist.map((item) => (
                  <li key={item.title} style={{ fontSize: "0.9rem" }}>
                    <strong>{item.title}</strong> —{" "}
                    <span className="muted">{item.description}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="card card--subtle" style={{ padding: "1rem 1.25rem", gap: "0.4rem" }}>
              <h3 className="card__title">Response &amp; service area</h3>
              <p className="small muted">{business.responsePromise}</p>
              <p className="small muted">
                <strong>Service area:</strong> {business.serviceArea.summary}
              </p>
            </div>
          </div>

          <div className="form-card" style={{ padding: "1.1rem 1.25rem" }}>
            <h2 style={{ fontSize: "1.15rem", marginBottom: "0.2rem" }}>Send a scoping message</h2>
            <p className="small muted" style={{ marginBottom: "0.75rem" }}>
              Active ransomware incident? Check the urgent box below and we will prioritize it.
            </p>

            {status === "success" ? (
              <div className="alert alert--success" role="status">
                <strong>Message received.</strong> Thank you for reaching out — we will review your
                environment details and respond directly.
              </div>
            ) : null}

            {status === "error" ? (
              <div className="alert alert--error" role="alert">
                <strong>Unable to send:</strong> {errorText}
              </div>
            ) : null}

            <form action={business.formspreeAction} method="POST" onSubmit={handleSubmit}>
              <input
                type="text"
                name="_gotcha"
                style={{ display: "none" }}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />

              <div className="grid-2" style={{ gap: "0.75rem" }}>
                <div className="form-field" style={{ marginBottom: "0.75rem" }}>
                  <label htmlFor="contact-name" className="form-label">
                    Your name
                  </label>
                  <input
                    id="contact-name"
                    name="name"
                    type="text"
                    required
                    className="form-input"
                    placeholder="Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="form-field" style={{ marginBottom: "0.75rem" }}>
                  <label htmlFor="contact-email" className="form-label">
                    Email address
                  </label>
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    required
                    className="form-input"
                    placeholder="jane@organization.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-field" style={{ marginBottom: "0.75rem" }}>
                <label htmlFor="contact-org" className="form-label">
                  Organization type
                </label>
                <select
                  id="contact-org"
                  name="organization_type"
                  className="form-select"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                >
                  <option value="Charter / K-12 School">Charter / K-12 School</option>
                  <option value="Non-Profit Organization">Non-Profit Organization</option>
                  <option value="Small Business">Small Business</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <label className="checkbox-row" style={{ marginBottom: "0.75rem" }}>
                <input
                  type="checkbox"
                  name="urgent"
                  value="yes"
                  checked={urgent}
                  onChange={(e) => setUrgent(e.target.checked)}
                />
                <span>
                  <strong>Urgent / active incident</strong> (ransomware or critical outage)
                </span>
              </label>

              <div className="form-field" style={{ marginBottom: "0.85rem" }}>
                <label htmlFor="contact-message" className="form-label">
                  Environment, problem, timeline &amp; staffing context
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  required
                  className="form-textarea form-textarea--compact"
                  placeholder="Approximate users/sites, what you run today, what problem you are solving, hard dates, and whether internal IT staff are involved."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn btn--primary"
                disabled={status === "submitting"}
                style={{ width: "100%" }}
              >
                {status === "submitting" ? "Sending inquiry..." : "Send Scoping Inquiry"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
