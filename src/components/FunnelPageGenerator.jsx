//   frontend/src/components/FunnelPageGenerator.jsx

// frontend/src/components/FunnelPageGenerator.jsx

import {
  generateFunnelPage,
  getFunnelPage,
  getFunnelPages,
  getLandingPreview,
  getThankYouPreview,
  publishFunnelPage,
  updateFunnelPage,
} from "../api/funnelPages";


import React, { useEffect, useMemo, useState } from "react";


const EMPTY_PRODUCT = {
  title: "",
  description: "",
  image_url: "",
  product_url: "",
};


function cloneProducts(products = []) {
  const normalized = Array.isArray(products)
    ? products.slice(0, 4).map((product) => ({
        ...EMPTY_PRODUCT,
        ...product,
      }))
    : [];

  while (normalized.length < 4) {
    normalized.push({ ...EMPTY_PRODUCT });
  }

  return normalized;
}


export default function FunnelPageGenerator() {
  const [funnels, setFunnels] = useState([]);
  const [selectedFunnelId, setSelectedFunnelId] = useState("");

  const [config, setConfig] = useState(null);

  const [publishing, setPublishing] = useState(false);

  const [loadingList, setLoadingList] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const [previewType, setPreviewType] = useState("landing");
  const [previewHtml, setPreviewHtml] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedSummary = useMemo(
    () =>
      funnels.find(
        (item) => String(item.funnel_id) === String(selectedFunnelId)
      ) || null,
    [funnels, selectedFunnelId]
  );


  // ============================================================
  // LOAD FUNNEL LIST
  // ============================================================

  async function loadFunnels() {
    setLoadingList(true);
    setError("");

    try {
      const data = await getFunnelPages();
      const list = Array.isArray(data) ? data : [];

      setFunnels(list);

      if (!selectedFunnelId && list.length > 0) {
        setSelectedFunnelId(list[0].funnel_id);
      }
    } catch (err) {
      console.error(err);
      setError(err?.message || "Unable to load funnel page configurations.");
    } finally {
      setLoadingList(false);
    }
  }


  // ============================================================
  // LOAD ONE FUNNEL
  // ============================================================

  async function loadConfig(funnelId) {
    if (!funnelId) {
      setConfig(null);
      setPreviewHtml("");
      return;
    }

    setLoadingConfig(true);
    setError("");
    setSuccess("");
    setPreviewHtml("");

    try {
      const data = await getFunnelPage(funnelId);

      setConfig({
        ...data,
        featured_products: cloneProducts(data.featured_products),
      });
    } catch (err) {
      console.error(err);
      setError(err?.message || "Unable to load funnel configuration.");
    } finally {
      setLoadingConfig(false);
    }
  }


  useEffect(() => {
    loadFunnels();
  }, []);


  useEffect(() => {
    if (!selectedFunnelId) return;

    loadConfig(selectedFunnelId);
  }, [selectedFunnelId]);


  // ============================================================
  // FORM HELPERS
  // ============================================================

  function updateField(field, value) {
    setConfig((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        [field]: value,
      };
    });
  }


  function updateProduct(index, field, value) {
    setConfig((prev) => {
      if (!prev) return prev;

      const products = cloneProducts(prev.featured_products);

      products[index] = {
        ...products[index],
        [field]: value,
      };

      return {
        ...prev,
        featured_products: products,
      };
    });
  }


  // ============================================================
  // SAVE
  // ============================================================

  async function handleSave() {
    if (!selectedFunnelId || !config) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        ...config,
        featured_products: cloneProducts(config.featured_products),
      };

      const updated = await updateFunnelPage(
        selectedFunnelId,
        payload
      );

      setConfig({
        ...updated,
        featured_products: cloneProducts(updated.featured_products),
      });

      setSuccess("Configuration saved successfully.");

      await loadFunnels();
    } catch (err) {
      console.error(err);
      setError(err?.message || "Unable to save funnel configuration.");
    } finally {
      setSaving(false);
    }
  }


  // ============================================================
  // GENERATE
  // ============================================================

  async function handleGenerate() {
    if (!selectedFunnelId) return;

    setGenerating(true);
    setError("");
    setSuccess("");

    try {
      await generateFunnelPage(selectedFunnelId);

      setSuccess("Funnel generated successfully.");

      await handlePreview(previewType);
    } catch (err) {
      console.error(err);
      setError(err?.message || "Unable to generate funnel.");
    } finally {
      setGenerating(false);
    }
  }


  // ============================================================
// PUBLISH
// ============================================================

async function handlePublish() {
  if (!selectedFunnelId) return;

  const confirmed = window.confirm(
    `Publish "${selectedFunnelId}" to the production server?`
  );

  if (!confirmed) return;

  setPublishing(true);
  setError("");
  setSuccess("");

  try {
    const result = await publishFunnelPage(selectedFunnelId);

    setSuccess(
      `Funnel published successfully (${result.files_uploaded} file(s)).`
    );

    await loadFunnels();
  } catch (err) {
    console.error(err);
    setError(err?.message || "Unable to publish funnel.");
  } finally {
    setPublishing(false);
  }
}





  // ============================================================
  // PREVIEW
  // ============================================================

  async function handlePreview(type) {
    if (!selectedFunnelId) return;

    setLoadingPreview(true);
    setError("");
    setPreviewType(type);

    try {
      const html =
        type === "thank-you"
          ? await getThankYouPreview(selectedFunnelId)
          : await getLandingPreview(selectedFunnelId);

      setPreviewHtml(typeof html === "string" ? html : "");
    } catch (err) {
      console.error(err);
      setError(err?.message || "Unable to load preview.");
      setPreviewHtml("");
    } finally {
      setLoadingPreview(false);
    }
  }


  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">
          Page Generator
        </h1>

        <p className="text-xs text-slate-500">
          Build, generate, and preview premium landing funnels.
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


      <div className="grid gap-4 lg:grid-cols-[320px,minmax(0,1fr)]">

        {/* ====================================================== */}
        {/* LEFT PANEL                                             */}
        {/* ====================================================== */}

        <div className="space-y-4">

          <section className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">
                Funnel pages
              </h2>

              <button
                type="button"
                onClick={loadFunnels}
                disabled={loadingList}
                className="px-3 py-1 rounded-lg border text-xs hover:bg-slate-50 disabled:opacity-60"
              >
                {loadingList ? "Refreshing..." : "Refresh"}
              </button>
            </div>


            {funnels.length === 0 ? (
              <p className="text-sm text-slate-500">
                No funnel configurations available.
              </p>
            ) : (
              <div className="space-y-2 max-h-[520px] overflow-y-auto">
                {funnels.map((funnel) => (
                  <button
                    key={funnel.funnel_id}
                    type="button"
                    onClick={() =>
                      setSelectedFunnelId(funnel.funnel_id)
                    }
                    className={[
                      "w-full text-left border rounded-lg px-3 py-3 transition",
                      String(selectedFunnelId) === String(funnel.funnel_id)
                        ? "border-slate-900 bg-slate-50"
                        : "border-slate-200 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <div className="text-sm font-medium">
                      {funnel.funnel_name}
                    </div>

                    <div className="text-xs text-slate-500 mt-1">
                      {funnel.category_name}
                    </div>

                    <div className="flex items-center justify-between mt-2 text-xs">
                      <span className="text-slate-500">
                        {funnel.funnel_id}
                      </span>

                      <span
                        className={[
                          "px-2 py-0.5 rounded-full border",
                          funnel.status === "active"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200",
                        ].join(" ")}
                      >
                        {funnel.status || "draft"}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>


          {selectedSummary && (
            <section className="bg-white rounded-lg border border-slate-200 p-4">
              <h2 className="text-sm font-semibold mb-3">
                Selected funnel
              </h2>

              <div className="space-y-2 text-sm">
                <div>
                  <div className="text-xs text-slate-500">
                    Funnel ID
                  </div>

                  <div className="font-medium">
                    {selectedSummary.funnel_id}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-500">
                    Publish folder
                  </div>

                  <div className="font-medium break-all">
                    {selectedSummary.publish_folder || "-"}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-500">
                    Landing URL
                  </div>

                  <div className="text-xs break-all">
                    {selectedSummary.landing_public_url || "-"}
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>


        {/* ====================================================== */}
        {/* RIGHT PANEL                                            */}
        {/* ====================================================== */}

        <div className="space-y-4">

          {/* ==================================================== */}
          {/* ACTION BAR                                           */}
          {/* ==================================================== */}

          <section className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex flex-wrap items-center gap-2">

              <button
                type="button"
                onClick={handleSave}
                disabled={!config || saving}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save configuration"}
              </button>


              <button
                type="button"
                onClick={handleGenerate}
                disabled={!selectedFunnelId || generating}
                className="px-4 py-2 rounded-lg bg-blue-700 text-white text-sm disabled:opacity-60"
              >
                {generating ? "Generating..." : "Generate funnel"}
              </button>


              <button
                type="button"
                onClick={() => handlePreview("landing")}
                disabled={!selectedFunnelId || loadingPreview}
                className="px-4 py-2 rounded-lg border border-slate-300 text-sm bg-white hover:bg-slate-50 disabled:opacity-60"
              >
                Landing preview
              </button>


              <button
                type="button"
                onClick={() => handlePreview("thank-you")}
                disabled={!selectedFunnelId || loadingPreview}
                className="px-4 py-2 rounded-lg border border-slate-300 text-sm bg-white hover:bg-slate-50 disabled:opacity-60"
              >
                Thank-you preview
              </button>

             <button
               type="button"
               onClick={handlePublish}
               disabled={!selectedFunnelId || publishing || generating || saving}
               className="px-4 py-2 rounded-lg bg-emerald-700 text-white text-sm disabled:opacity-60"
               >
                 {publishing ? "Publishing..." : "Publish"}
             </button>

           </div>
           </section>




          {/* ==================================================== */}
          {/* CONFIG FORM                                          */}
          {/* ==================================================== */}

          <section className="bg-white rounded-lg border border-slate-200 p-4">

            <h2 className="text-sm font-semibold mb-4">
              Configuration
            </h2>


            {loadingConfig ? (
              <p className="text-sm text-slate-500">
                Loading configuration...
              </p>
            ) : !config ? (
              <p className="text-sm text-slate-500">
                Select a funnel configuration.
              </p>
            ) : (
              <div className="space-y-6">

                {/* GENERAL */}

                <div>
                  <h3 className="text-sm font-semibold mb-3">
                    General
                  </h3>

                  <div className="grid gap-3 md:grid-cols-2">

                    <Field
                      label="Funnel ID"
                      value={config.funnel_id}
                      disabled
                    />

                    <Field
                      label="Funnel name"
                      value={config.funnel_name}
                      onChange={(value) =>
                        updateField("funnel_name", value)
                      }
                    />

                    <Field
                      label="Category"
                      value={config.category_name}
                      onChange={(value) =>
                        updateField("category_name", value)
                      }
                    />

                    <SelectField
                      label="Status"
                      value={config.status}
                      onChange={(value) =>
                        updateField("status", value)
                      }
                      options={[
                        { value: "draft", label: "Draft" },
                        { value: "active", label: "Active" },
                        { value: "archived", label: "Archived" },
                      ]}
                    />

                  </div>
                </div>


                {/* HERO */}

                <div>
                  <h3 className="text-sm font-semibold mb-3">
                    Hero & Guide
                  </h3>

                  <div className="space-y-3">

                    <Field
                      label="Guide title"
                      value={config.guide_title}
                      onChange={(value) =>
                        updateField("guide_title", value)
                      }
                    />

                    <Field
                      label="Headline"
                      value={config.headline}
                      onChange={(value) =>
                        updateField("headline", value)
                      }
                    />

                    <TextAreaField
                      label="Subtitle"
                      value={config.subtitle}
                      onChange={(value) =>
                        updateField("subtitle", value)
                      }
                    />

                    <Field
                      label="CTA text"
                      value={config.cta_text}
                      onChange={(value) =>
                        updateField("cta_text", value)
                      }
                    />

                    <Field
                      label="Guide cover URL"
                      value={config.guide_cover_url}
                      onChange={(value) =>
                        updateField("guide_cover_url", value)
                      }
                    />

                    <Field
                      label="Hero image URL"
                      value={config.hero_image_url}
                      onChange={(value) =>
                        updateField("hero_image_url", value)
                      }
                    />

                  </div>
                </div>


                {/* PDF / LEAD */}

                <div>
                  <h3 className="text-sm font-semibold mb-3">
                    Lead Magnet
                  </h3>

                  <div className="space-y-3">

                    <Field
                      label="PDF English URL"
                      value={config.pdf_en_url}
                      onChange={(value) =>
                        updateField("pdf_en_url", value)
                      }
                    />

                    <Field
                      label="PDF French URL"
                      value={config.pdf_fr_url}
                      onChange={(value) =>
                        updateField("pdf_fr_url", value)
                      }
                    />

                    <Field
                      label="Lead capture URL"
                      value={config.lead_capture_url}
                      onChange={(value) =>
                        updateField("lead_capture_url", value)
                      }
                    />

                    <Field
                      label="Thank-you URL"
                      value={config.thankyou_url}
                      onChange={(value) =>
                        updateField("thankyou_url", value)
                      }
                    />

                  </div>
                </div>


                {/* BRANDING */}

                <div>
                  <h3 className="text-sm font-semibold mb-3">
                    Branding
                  </h3>

                  <div className="grid gap-3 md:grid-cols-2">

                    <Field
                      label="Brand name"
                      value={config.brand_name}
                      onChange={(value) =>
                        updateField("brand_name", value)
                      }
                    />

                    <Field
                      label="Logo URL"
                      value={config.logo_url}
                      onChange={(value) =>
                        updateField("logo_url", value)
                      }
                    />

                    <Field
                      label="Primary color"
                      value={config.primary_color}
                      onChange={(value) =>
                        updateField("primary_color", value)
                      }
                    />

                    <Field
                      label="Secondary color"
                      value={config.secondary_color}
                      onChange={(value) =>
                        updateField("secondary_color", value)
                      }
                    />

                  </div>
                </div>


                {/* FEATURED PRODUCTS */}

                <div>
                  <h3 className="text-sm font-semibold mb-3">
                    Featured Products
                  </h3>

                  <div className="space-y-3">

                    <Field
                      label="Section title"
                      value={config.featured_section_title}
                      onChange={(value) =>
                        updateField("featured_section_title", value)
                      }
                    />

                    <TextAreaField
                      label="Section subtitle"
                      value={config.featured_section_subtitle}
                      onChange={(value) =>
                        updateField("featured_section_subtitle", value)
                      }
                    />


                    <div className="grid gap-4 xl:grid-cols-2">

                      {cloneProducts(config.featured_products).map(
                        (product, index) => (
                          <div
                            key={index}
                            className="border border-slate-200 rounded-lg p-3 space-y-3"
                          >
                            <div className="text-sm font-semibold">
                              Product {index + 1}
                            </div>

                            <Field
                              label="Title"
                              value={product.title}
                              onChange={(value) =>
                                updateProduct(index, "title", value)
                              }
                            />

                            <TextAreaField
                              label="Description"
                              value={product.description}
                              onChange={(value) =>
                                updateProduct(
                                  index,
                                  "description",
                                  value
                                )
                              }
                            />

                            <Field
                              label="Image URL"
                              value={product.image_url}
                              onChange={(value) =>
                                updateProduct(
                                  index,
                                  "image_url",
                                  value
                                )
                              }
                            />

                            <Field
                              label="Product URL"
                              value={product.product_url}
                              onChange={(value) =>
                                updateProduct(
                                  index,
                                  "product_url",
                                  value
                                )
                              }
                            />
                          </div>
                        )
                      )}

                    </div>

                  </div>
                </div>


                {/* EMAIL */}

                <div>
                  <h3 className="text-sm font-semibold mb-3">
                    Email
                  </h3>

                  <div className="space-y-3">

                    <Field
                      label="Subject EN"
                      value={config.email_subject_en}
                      onChange={(value) =>
                        updateField("email_subject_en", value)
                      }
                    />

                    <Field
                      label="Subject FR"
                      value={config.email_subject_fr}
                      onChange={(value) =>
                        updateField("email_subject_fr", value)
                      }
                    />

                    <TextAreaField
                      label="Body EN"
                      value={config.email_body_en}
                      onChange={(value) =>
                        updateField("email_body_en", value)
                      }
                    />

                    <TextAreaField
                      label="Body FR"
                      value={config.email_body_fr}
                      onChange={(value) =>
                        updateField("email_body_fr", value)
                      }
                    />

                  </div>
                </div>


                {/* PUBLISHING */}

                <div>
                  <h3 className="text-sm font-semibold mb-3">
                    Publishing
                  </h3>

                  <div className="grid gap-3 md:grid-cols-2">

                    <Field
                      label="Publish folder"
                      value={config.publish_folder}
                      onChange={(value) =>
                        updateField("publish_folder", value)
                      }
                    />

                    <Field
                      label="UTM campaign"
                      value={config.utm_campaign}
                      onChange={(value) =>
                        updateField("utm_campaign", value)
                      }
                    />

                    <Field
                      label="Landing filename"
                      value={config.landing_filename}
                      onChange={(value) =>
                        updateField("landing_filename", value)
                      }
                    />

                    <Field
                      label="Thank-you filename"
                      value={config.thankyou_filename}
                      onChange={(value) =>
                        updateField("thankyou_filename", value)
                      }
                    />

                    <Field
                      label="Email filename"
                      value={config.email_filename}
                      onChange={(value) =>
                        updateField("email_filename", value)
                      }
                    />

                    <Field
                      label="Config filename"
                      value={config.config_filename}
                      onChange={(value) =>
                        updateField("config_filename", value)
                      }
                    />

                  </div>
                </div>

              </div>
            )}

          </section>


          {/* ==================================================== */}
          {/* PREVIEW                                              */}
          {/* ==================================================== */}

          <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">

            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">
                  Preview
                </h2>

                <p className="text-xs text-slate-500">
                  {previewType === "thank-you"
                    ? "Thank-you page"
                    : "Landing page"}
                </p>
              </div>

              {loadingPreview && (
                <span className="text-xs text-slate-500">
                  Loading...
                </span>
              )}
            </div>


            {previewHtml ? (
              <iframe
                title="Funnel preview"
                srcDoc={previewHtml}

                sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"

                className="w-full border-0 bg-white"
                style={{
                  minHeight: "780px",
                }}
              />
            ) : (
              <div className="p-6 text-sm text-slate-500">
                Generate or select a preview to display the page here.
              </div>
            )}

          </section>

        </div>
      </div>
    </div>
  );
}


// ============================================================
// FIELD COMPONENTS
// ============================================================


function Field({
  label,
  value,
  onChange,
  disabled = false,
}) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-600 mb-1">
        {label}
      </span>

      <input
        type="text"
        value={value ?? ""}
        disabled={disabled}
        onChange={(event) =>
          onChange?.(event.target.value)
        }
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500"
      />
    </label>
  );
}


function TextAreaField({
  label,
  value,
  onChange,
}) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-600 mb-1">
        {label}
      </span>

      <textarea
        rows={3}
        value={value ?? ""}
        onChange={(event) =>
          onChange?.(event.target.value)
        }
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-y"
      />
    </label>
  );
}


function SelectField({
  label,
  value,
  onChange,
  options,
}) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-600 mb-1">
        {label}
      </span>

      <select
        value={value ?? ""}
        onChange={(event) =>
          onChange?.(event.target.value)
        }
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}


