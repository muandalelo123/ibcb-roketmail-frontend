

// src/components/FunnelsPage.jsx

import React, { useEffect, useMemo, useState } from "react";
import {
  createFunnel,
  createFunnelStep,
  getFunnelRunSteps,
  getFunnelRuns,
  getFunnels,
} from "../api/funnels";

const PROVIDERS = [
  { value: "gmail", label: "Gmail / Google Workspace" },
  { value: "ses", label: "Amazon SES" },
  { value: "sendgrid", label: "SendGrid" },
  { value: "smtp", label: "Custom SMTP" },
];

function formatDate(value) {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function StatusBadge({ status }) {
  const normalized = (status || "").toLowerCase();

  const classes =
    normalized === "completed" || normalized === "sent"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : normalized === "error"
      ? "bg-rose-50 text-rose-700 border-rose-200"
      : normalized === "running" || normalized === "processing"
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : "bg-amber-50 text-amber-700 border-amber-200";

  return (
    <span
      className={[
        "inline-flex px-2 py-1 rounded-full border text-xs font-medium",
        classes,
      ].join(" ")}
    >
      {status || "-"}
    </span>
  );
}

export default function FunnelsPage() {
  const [funnels, setFunnels] = useState([]);
  const [selectedFunnelId, setSelectedFunnelId] = useState(null);

  const [runs, setRuns] = useState([]);
  const [selectedRunId, setSelectedRunId] = useState(null);
  const [runSteps, setRunSteps] = useState([]);

  const [loadingFunnels, setLoadingFunnels] = useState(false);
  const [loadingRuns, setLoadingRuns] = useState(false);
  const [loadingRunSteps, setLoadingRunSteps] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [funnelForm, setFunnelForm] = useState({
    name: "",
    category: "",
    preferred_provider: "gmail",
    is_active: true,
  });

  const [stepForm, setStepForm] = useState({
    step_order: 1,
    delay_minutes: 0,
    action_type: "email",
    subject: "",
    html: "<p>Hello {{first_name}},</p>",
    is_active: true,
  });

  const selectedFunnel = useMemo(
    () =>
      funnels.find(
        (funnel) => String(funnel.id) === String(selectedFunnelId)
      ) || null,
    [funnels, selectedFunnelId]
  );

  async function loadFunnels() {
    setLoadingFunnels(true);
    setError("");

    try {
      const data = await getFunnels();
      const list = Array.isArray(data) ? data : [];

      setFunnels(list);

      if (list.length > 0 && selectedFunnelId == null) {
        setSelectedFunnelId(list[0].id);
      }
    } catch (err) {
      console.error(err);
      setError(err?.message || "Unable to load funnels.");
    } finally {
      setLoadingFunnels(false);
    }
  }

  async function loadRuns(funnelId) {
    if (funnelId == null) {
      setRuns([]);
      setSelectedRunId(null);
      setRunSteps([]);
      return;
    }

    setLoadingRuns(true);
    setError("");

    try {
      const data = await getFunnelRuns(funnelId);
      const list = Array.isArray(data) ? data : [];

      setRuns(list);

      if (list.length > 0) {
        setSelectedRunId((prev) => {
          if (prev && list.some((run) => String(run.id) === String(prev))) {
            return prev;
          }

          return list[0].id;
        });
      } else {
        setSelectedRunId(null);
        setRunSteps([]);
      }
    } catch (err) {
      console.error(err);
      setError(err?.message || "Unable to load funnel runs.");
    } finally {
      setLoadingRuns(false);
    }
  }

  async function loadRunSteps(runId) {
    if (runId == null) {
      setRunSteps([]);
      return;
    }

    setLoadingRunSteps(true);
    setError("");

    try {
      const data = await getFunnelRunSteps(runId);
      setRunSteps(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(err?.message || "Unable to load funnel step runs.");
    } finally {
      setLoadingRunSteps(false);
    }
  }

  useEffect(() => {
    loadFunnels();
  }, []);

  useEffect(() => {
    loadRuns(selectedFunnelId);
  }, [selectedFunnelId]);

  useEffect(() => {
    loadRunSteps(selectedRunId);
  }, [selectedRunId]);

  useEffect(() => {
    if (!success) return;

    const timer = setTimeout(() => {
      setSuccess("");
    }, 3500);

    return () => clearTimeout(timer);
  }, [success]);

  async function handleCreateFunnel(e) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!funnelForm.name.trim()) {
      setError("Funnel name is required.");
      return;
    }

    if (!funnelForm.category.trim()) {
      setError("Category is required.");
      return;
    }

    try {
      const created = await createFunnel({
        name: funnelForm.name.trim(),
        category: funnelForm.category.trim(),
        preferred_provider: funnelForm.preferred_provider,
        is_active: funnelForm.is_active,
      });

      setSuccess(`Funnel created (id=${created.id}).`);

      setFunnelForm({
        name: "",
        category: "",
        preferred_provider: "gmail",
        is_active: true,
      });

      await loadFunnels();
      setSelectedFunnelId(created.id);
    } catch (err) {
      console.error(err);
      setError(err?.message || "Unable to create funnel.");
    }
  }

  async function handleCreateStep(e) {
    e.preventDefault();

    if (!selectedFunnelId) {
      setError("Select a funnel first.");
      return;
    }

    if (!stepForm.subject.trim()) {
      setError("Step subject is required.");
      return;
    }

    if (!stepForm.html.trim()) {
      setError("Step HTML is required.");
      return;
    }

    setError("");
    setSuccess("");

    try {
      const created = await createFunnelStep(selectedFunnelId, {
        step_order: Number(stepForm.step_order),
        delay_minutes: Number(stepForm.delay_minutes),
        action_type: "email",
        subject: stepForm.subject.trim(),
        html: stepForm.html,
        is_active: stepForm.is_active,
      });

      setSuccess(
        `Step created (id=${created.id}, campaign_id=${created.campaign_id}).`
      );

      setStepForm((prev) => ({
        ...prev,
        step_order: Number(prev.step_order) + 1,
        delay_minutes: 0,
        subject: "",
        html: "<p>Hello {{first_name}},</p>",
      }));

      await loadFunnels();
    } catch (err) {
      console.error(err);
      setError(err?.message || "Unable to create funnel step.");
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">
          Funnels
        </h1>

        <p className="text-xs text-slate-500">
          Build automated lead sequences and monitor execution history.
        </p>
      </div>

      {error && (
        <div className="px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="px-3 py-2 rounded-lg border border-emerald-200 bg-emerald-50 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr,1.4fr]">
        <div className="space-y-4">
          <section className="bg-white rounded-lg border border-slate-200 p-4">
            <h2 className="text-sm font-semibold mb-3">
              Create funnel
            </h2>

            <form onSubmit={handleCreateFunnel} className="space-y-3">
              <input
                type="text"
                value={funnelForm.name}
                onChange={(e) =>
                  setFunnelForm((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder="Funnel name"
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />

              <input
                type="text"
                value={funnelForm.category}
                onChange={(e) =>
                  setFunnelForm((prev) => ({
                    ...prev,
                    category: e.target.value,
                  }))
                }
                placeholder="Category, e.g. baby-care"
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />

              <select
                value={funnelForm.preferred_provider}
                onChange={(e) =>
                  setFunnelForm((prev) => ({
                    ...prev,
                    preferred_provider: e.target.value,
                  }))
                }
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                {PROVIDERS.map((provider) => (
                  <option key={provider.value} value={provider.value}>
                    {provider.label}
                  </option>
                ))}
              </select>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={funnelForm.is_active}
                  onChange={(e) =>
                    setFunnelForm((prev) => ({
                      ...prev,
                      is_active: e.target.checked,
                    }))
                  }
                />
                Active
              </label>

              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm"
              >
                Create funnel
              </button>
            </form>
          </section>

          <section className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">
                Funnels
              </h2>

              <button
                type="button"
                onClick={loadFunnels}
                className="px-3 py-1 rounded-lg border text-xs"
                disabled={loadingFunnels}
              >
                {loadingFunnels ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            {funnels.length === 0 ? (
              <p className="text-sm text-slate-500">
                No funnels available.
              </p>
            ) : (
              <div className="max-h-72 overflow-y-auto space-y-2">
                {funnels.map((funnel) => (
                  <button
                    key={funnel.id}
                    type="button"
                    onClick={() => {
                      setSelectedFunnelId(funnel.id);
                      setSelectedRunId(null);
                    }}
                    className={[
                      "w-full text-left rounded-lg border px-3 py-3",
                      String(selectedFunnelId) === String(funnel.id)
                        ? "border-slate-900 bg-slate-50"
                        : "border-slate-200",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-medium text-sm">
                          #{funnel.id} {funnel.name}
                        </div>

                        <div className="text-xs text-slate-500 mt-1">
                          {funnel.category} · {funnel.preferred_provider}
                        </div>
                      </div>

                      <StatusBadge
                        status={funnel.is_active ? "active" : "inactive"}
                      />
                    </div>

                    <div className="text-xs text-slate-500 mt-2">
                      {Array.isArray(funnel.steps)
                        ? `${funnel.steps.length} step(s)`
                        : "0 step(s)"}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-4">
          <section className="bg-white rounded-lg border border-slate-200 p-4">
            <h2 className="text-sm font-semibold mb-3">
              Selected funnel
            </h2>

            {!selectedFunnel ? (
              <p className="text-sm text-slate-500">
                Select a funnel.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <div>
                    <div className="text-xs text-slate-500">
                      Name
                    </div>
                    <div className="text-sm font-medium">
                      {selectedFunnel.name}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500">
                      Category
                    </div>
                    <div className="text-sm font-medium">
                      {selectedFunnel.category}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500">
                      Provider
                    </div>
                    <div className="text-sm font-medium">
                      {selectedFunnel.preferred_provider}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-2">
                    Steps
                  </h3>

                  {selectedFunnel.steps?.length ? (
                    <div className="space-y-2">
                      {selectedFunnel.steps.map((step) => (
                        <div
                          key={step.id}
                          className="border rounded-lg px-3 py-3"
                        >
                          <div className="flex justify-between gap-3">
                            <div>
                              <div className="text-sm font-medium">
                                Step {step.step_order}: {step.subject}
                              </div>

                              <div className="text-xs text-slate-500 mt-1">
                                Delay: {step.delay_minutes} minute(s)
                              </div>
                            </div>

                            <div className="text-xs text-slate-500">
                              Campaign #{step.campaign_id || "-"}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">
                      No steps configured.
                    </p>
                  )}
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold mb-3">
                    Add step
                  </h3>

                  <form onSubmit={handleCreateStep} className="space-y-3">
                    <div className="grid gap-3 md:grid-cols-2">
                      <input
                        type="number"
                        min="1"
                        value={stepForm.step_order}
                        onChange={(e) =>
                          setStepForm((prev) => ({
                            ...prev,
                            step_order: e.target.value,
                          }))
                        }
                        className="border rounded-lg px-3 py-2 text-sm"
                        placeholder="Step order"
                      />

                      <input
                        type="number"
                        min="0"
                        value={stepForm.delay_minutes}
                        onChange={(e) =>
                          setStepForm((prev) => ({
                            ...prev,
                            delay_minutes: e.target.value,
                          }))
                        }
                        className="border rounded-lg px-3 py-2 text-sm"
                        placeholder="Delay minutes"
                      />
                    </div>

                    <input
                      type="text"
                      value={stepForm.subject}
                      onChange={(e) =>
                        setStepForm((prev) => ({
                          ...prev,
                          subject: e.target.value,
                        }))
                      }
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      placeholder="Email subject"
                    />

                    <textarea
                      rows={6}
                      value={stepForm.html}
                      onChange={(e) =>
                        setStepForm((prev) => ({
                          ...prev,
                          html: e.target.value,
                        }))
                      }
                      className="w-full border rounded-lg px-3 py-2 text-sm font-mono"
                    />

                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm"
                    >
                      Add step
                    </button>
                  </form>
                </div>
              </div>
            )}
          </section>

          <section className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">
                Funnel runs
              </h2>

              <button
                type="button"
                 onClick={async () => {
                 await loadRuns(selectedFunnelId);

                 if (selectedRunId) {
                  await loadRunSteps(selectedRunId);
                 }
                 }}
                 className="px-3 py-1 rounded-lg border text-xs"
                 disabled={!selectedFunnelId || loadingRuns}
>
                 {loadingRuns ? "Refreshing..." : "Refresh"}
</button>



            </div>

            {runs.length === 0 ? (
              <p className="text-sm text-slate-500">
                No runs for this funnel.
              </p>
            ) : (
              <div className="max-h-72 overflow-y-auto space-y-2">
                {runs.map((run) => (
                  <button
                    key={run.id}
                    type="button"
                    onClick={() => setSelectedRunId(run.id)}
                    className={[
                      "w-full text-left border rounded-lg px-3 py-3",
                      String(selectedRunId) === String(run.id)
                        ? "border-slate-900 bg-slate-50"
                        : "border-slate-200",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Run #{run.id}
                      </span>

                      <StatusBadge status={run.status} />
                    </div>

                    <div className="text-xs text-slate-500 mt-2">
                      Contact #{run.contact_id} · Submission #
                      {run.submission_id ?? "-"}
                    </div>

                    <div className="text-xs text-slate-500 mt-1">
                      Started: {formatDate(run.started_at)}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="bg-white rounded-lg border border-slate-200 p-4">
            <h2 className="text-sm font-semibold mb-3">
              Run steps
            </h2>

            {!selectedRunId ? (
              <p className="text-sm text-slate-500">
                Select a run.
              </p>
            ) : loadingRunSteps ? (
              <p className="text-sm text-slate-500">
                Loading...
              </p>
            ) : runSteps.length === 0 ? (
              <p className="text-sm text-slate-500">
                No step runs.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-2 pr-3">Step</th>
                      <th className="py-2 pr-3">Status</th>
                      <th className="py-2 pr-3">Scheduled</th>
                      <th className="py-2 pr-3">Executed</th>
                      <th className="py-2 pr-3">Provider</th>
                      <th className="py-2">Error</th>
                    </tr>
                  </thead>

                  <tbody>
                    {runSteps.map((step) => (
                      <tr
                        key={step.id}
                        className="border-b last:border-b-0"
                      >
                        <td className="py-2 pr-3">
                          #{step.funnel_step_id}
                        </td>

                        <td className="py-2 pr-3">
                          <StatusBadge status={step.status} />
                        </td>

                        <td className="py-2 pr-3 whitespace-nowrap">
                          {formatDate(step.scheduled_at)}
                        </td>

                        <td className="py-2 pr-3 whitespace-nowrap">
                          {formatDate(step.executed_at)}
                        </td>

                        <td className="py-2 pr-3">
                          {step.provider_used || "-"}
                        </td>

                        <td className="py-2">
                          {step.error_message || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}




