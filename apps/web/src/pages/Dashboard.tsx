import { useCallback, useEffect, useRef, useState } from "react";
import { Menu } from "@headlessui/react";
import { useTranslation } from "react-i18next";
import {
  ArrowPathIcon,
  DocumentDuplicateIcon,
  EllipsisHorizontalIcon,
  PlusIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import type { Platform, UserPlatformWithPlatform } from "@webotp/shared/types";
import { useUserPlatformsStore } from "../stores/user-platforms.store";
import { usePlatformsStore } from "../stores/platforms.store";
import LanguageSwitcher from "../components/common/LanguageSwitcher";
import UserSettingsDropdown from "../components/common/UserSettingsDropdown";
import { UserSettingsForm } from "../components/auth/UserSettingsForm";
import { Modal } from "../components/common/Modal";
import { FormErrors } from "../components/common/FormErrors";

const emptyBinding = { platformId: "", accountName: "", secret: "" };

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const {
    userPlatforms,
    total,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadUserPlatforms,
    loadMoreUserPlatforms,
    createUserPlatform,
    deleteUserPlatform,
    refreshOTPs,
    refreshingPlatforms,
    otpData,
    clearOTPData,
  } = useUserPlatformsStore();
  const {
    platforms,
    isLoading: platformsLoading,
    error: platformLoadError,
    loadPlatforms,
    createPlatform,
    updatePlatform,
    deletePlatform,
  } = usePlatformsStore();
  const [search, setSearch] = useState("");
  const [initialized, setInitialized] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [notice, setNotice] = useState("");
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const [bindOpen, setBindOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [binding, setBinding] = useState(emptyBinding);
  const platformSelectRef = useRef<HTMLSelectElement>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] =
    useState<UserPlatformWithPlatform | null>(null);
  const [deletePlatformTarget, setDeletePlatformTarget] =
    useState<Platform | null>(null);
  const [platformEditor, setPlatformEditor] = useState<{
    id?: string;
    name: string;
  } | null>(null);
  const [inlinePlatformName, setInlinePlatformName] = useState("");
  const [showInlinePlatform, setShowInlinePlatform] = useState(false);
  const [inlineError, setInlineError] = useState("");

  useEffect(() => {
    void loadPlatforms();
  }, [loadPlatforms]);
  useEffect(() => {
    const timer = setTimeout(
      () => {
        void loadUserPlatforms(1, 20, search.trim()).then(() =>
          setInitialized(true),
        );
      },
      search ? 300 : 0,
    );
    return () => clearTimeout(timer);
  }, [search, loadUserPlatforms]);
  useEffect(() => {
    const synchronize = () => {
      if (document.visibilityState === "hidden") return;
      setNow((current) =>
        Math.floor(current / 1000) === Math.floor(Date.now() / 1000)
          ? current
          : Date.now(),
      );
      void refreshOTPs(userPlatforms.map((item) => item.id));
    };
    synchronize();
    const timer = window.setInterval(synchronize, 250);
    document.addEventListener("visibilitychange", synchronize);
    window.addEventListener("pageshow", synchronize);
    window.addEventListener("online", synchronize);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", synchronize);
      window.removeEventListener("pageshow", synchronize);
      window.removeEventListener("online", synchronize);
    };
  }, [refreshOTPs, userPlatforms]);
  useEffect(() => () => clearTimeout(noticeTimer.current), []);

  const announce = useCallback((message: string) => {
    clearTimeout(noticeTimer.current);
    setNotice(message);
    noticeTimer.current = setTimeout(() => setNotice(""), 5000);
  }, []);
  const settingsSuccess = useCallback(() => {
    setSettingsOpen(false);
    announce(t("common.success"));
  }, [announce, t]);
  const remaining = (id: string) =>
    Math.max(
      0,
      Math.ceil(
        ((otpData.get(id)?.localExpiresAt ?? 0) - Math.max(now, Date.now())) /
          1000,
      ),
    );
  const openBinding = () => {
    setErrors({});
    setFormError("");
    setBindOpen(true);
  };
  const closeBinding = () => {
    setBindOpen(false);
    setBinding(emptyBinding);
    setShowSecret(false);
    setShowInlinePlatform(false);
    setInlinePlatformName("");
  };
  const changeBinding = (field: keyof typeof emptyBinding, value: string) => {
    setBinding(current => ({ ...current, [field]: value }));
    setErrors(current => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };
  const copy = async (item: UserPlatformWithPlatform) => {
    if (!remaining(item.id)) return;
    try {
      await navigator.clipboard.writeText(otpData.get(item.id)?.token || "");
      announce(t("dashboard.copiedAccount", { account: item.accountName }));
    } catch {
      announce(t("dashboard.copyFailed"));
    }
  };
  const bind = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const nextErrors: Record<string, string> = {};
    for (const key of ["platformId", "accountName", "secret"] as const)
      if (!binding[key].trim()) nextErrors[key] = t("validation.required");
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setBusy(true);
    setFormError("");
    try {
      await createUserPlatform({
        ...binding,
        accountName: binding.accountName.trim(),
        secret: binding.secret.replace(/\s+/g, ""),
      });
      closeBinding();
      setSearch("");
      announce(t("dashboard.accountAdded"));
    } catch {
      setFormError(useUserPlatformsStore.getState().error || t("errors.createUserPlatformFailed"));
    } finally {
      setBusy(false);
    }
  };
  const createInlinePlatform = async () => {
    if (busy) return;
    if (!inlinePlatformName.trim()) {
      setInlineError(t("validation.required"));
      return;
    }
    setBusy(true);
    setInlineError("");
    try {
      const platform = await createPlatform({
        name: inlinePlatformName.trim(),
      });
      changeBinding("platformId", platform.id);
      platformSelectRef.current?.focus();
      setShowInlinePlatform(false);
      setInlinePlatformName("");
    } catch {
      setInlineError(usePlatformsStore.getState().error || t("errors.createPlatformFailed"));
    } finally {
      setBusy(false);
    }
  };
  const savePlatform = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!platformEditor || busy) return;
    if (!platformEditor.name.trim()) {
      setErrors({ platformName: t("validation.required") });
      return;
    }
    setBusy(true);
    setFormError("");
    try {
      if (platformEditor.id)
        await updatePlatform(platformEditor.id, {
          name: platformEditor.name.trim(),
        });
      else await createPlatform({ name: platformEditor.name.trim() });
      setPlatformEditor(null);
      void loadUserPlatforms();
      announce(t("common.success"));
    } catch {
      setFormError(
        t(
          platformEditor.id
            ? "errors.updatePlatformFailed"
            : "errors.createPlatformFailed",
        ),
      );
    } finally {
      setBusy(false);
    }
  };
  const confirmDelete = async () => {
    if (busy) return;
    setBusy(true);
    setFormError("");
    try {
      if (deleteTarget) {
        await deleteUserPlatform(deleteTarget.id);
        clearOTPData(deleteTarget.id);
        setDeleteTarget(null);
      } else if (deletePlatformTarget) {
        await deletePlatform(deletePlatformTarget.id);
        setDeletePlatformTarget(null);
        await loadUserPlatforms();
      }
      announce(t("dashboard.deleted"));
    } catch {
      setFormError(
        t(
          deleteTarget
            ? "errors.deleteUserPlatformFailed"
            : "errors.deletePlatformFailed",
        ),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <h1 className="text-xl font-bold">{t("common.appName")}</h1>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <UserSettingsDropdown
              onShowUserSettings={() => setSettingsOpen(true)}
              onShowPlatformsManagement={() => setManageOpen(true)}
            />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">
              {t("dashboard.boundPlatforms")}
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {t("dashboard.subtitle")}
            </p>
          </div>
          <button
            className="btn-primary inline-flex items-center gap-2"
            onClick={openBinding}
          >
            <PlusIcon className="h-5 w-5" aria-hidden="true" />
            {t("dashboard.bindPlatform")}
          </button>
        </div>
        <label htmlFor="account-search" className="sr-only">
          {t("dashboard.searchAccounts")}
        </label>
        <div className="relative mb-3 max-w-xl">
          <MagnifyingGlassIcon
            className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-gray-500"
            aria-hidden="true"
          />
          <input
            id="account-search"
            type="search"
            value={search}
            maxLength={200}
            onChange={(event) => setSearch(event.target.value)}
            className="field pl-10"
            placeholder={t("dashboard.searchAccounts")}
          />
        </div>
        <p
          className="mb-1 text-sm text-gray-600 dark:text-gray-300"
          role="status"
        >
          {isLoading
            ? t("common.loading")
            : t("dashboard.accountCount", { count: total })}
        </p>
        {error && (
          <div className="error-message mb-4" role="alert">
            {error}
            <button
              className="ml-3 underline"
              onClick={() => void loadUserPlatforms()}
            >
              {t("common.retry")}
            </button>
          </div>
        )}
        <div
          role="status"
          aria-live="polite"
          className="mb-4 h-6 truncate text-sm font-medium text-blue-800 dark:text-blue-200"
          title={notice || undefined}
        >
          {notice}
        </div>
        <div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          aria-busy={isLoading}
        >
          {!initialized &&
            isLoading &&
            Array.from({ length: 6 }, (_, index) => (
              <div
                key={index}
                aria-hidden="true"
                className="h-48 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800"
              />
            ))}
          {userPlatforms.map((item) => {
            const seconds = remaining(item.id);
            const token = otpData.get(item.id)?.token;
            return (
              <article
                key={item.id}
                className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="mb-4 flex flex-1 items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="break-words font-semibold">
                      {item.platform?.name || t("dashboard.unknownPlatform")}
                    </h3>
                    <p className="mt-1 break-all text-sm text-gray-600 dark:text-gray-300">
                      {item.accountName}
                    </p>
                  </div>
                  <Menu as="div" className="relative shrink-0">
                    <Menu.Button
                      className="icon-button -mr-2 -mt-2"
                      aria-label={t("dashboard.accountActions", {
                        account: item.accountName,
                      })}
                    >
                      <EllipsisHorizontalIcon
                        className="h-5 w-5"
                        aria-hidden="true"
                      />
                    </Menu.Button>
                    <Menu.Items className="absolute right-0 z-10 w-56 rounded-lg border border-gray-200 bg-white p-1 shadow-lg focus:outline-none dark:border-gray-600 dark:bg-gray-800">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            className={`menu-action ${active ? "bg-gray-100 dark:bg-gray-700" : ""}`}
                            disabled={refreshingPlatforms.has(item.id)}
                            onClick={() => void refreshOTPs([item.id])}
                          >
                            <ArrowPathIcon
                              className="h-4 w-4"
                              aria-hidden="true"
                            />
                            {t("dashboard.refreshOTP")}
                          </button>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            className={`menu-action text-red-700 dark:text-red-300 ${active ? "bg-red-50 dark:bg-red-950" : ""}`}
                            onClick={() => {
                              setFormError("");
                              setDeleteTarget(item);
                            }}
                          >
                            {t("dashboard.deleteBinding")}
                          </button>
                        )}
                      </Menu.Item>
                      <p className="border-t border-gray-200 px-3 py-2 text-xs text-gray-600 dark:border-gray-600 dark:text-gray-300">
                        {t("dashboard.boundAt")}:{" "}
                        {new Date(item.createdAt).toLocaleDateString(
                          i18n.language,
                        )}
                      </p>
                    </Menu.Items>
                  </Menu>
                </div>
                <div className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 p-3 dark:bg-gray-900">
                  <p className="select-text whitespace-nowrap font-mono text-3xl font-semibold tabular-nums tracking-wider text-blue-700 dark:text-blue-300">
                    {seconds && token
                      ? token.replace(/(.{3})(?=.)/g, "$1 ")
                      : "— — —"}
                  </p>
                  <button
                    type="button"
                    className="icon-button text-blue-700 dark:text-blue-300"
                    disabled={!seconds || !token}
                    onClick={() => void copy(item)}
                    aria-label={t("dashboard.copyAccount", {
                      account: item.accountName,
                    })}
                  >
                    <DocumentDuplicateIcon
                      className="h-5 w-5"
                      aria-hidden="true"
                    />
                  </button>
                </div>
                <p
                  className={`mt-3 text-sm tabular-nums ${seconds > 0 && seconds <= 5 ? "font-medium text-amber-800 dark:text-amber-300" : "text-gray-600 dark:text-gray-300"}`}
                >
                  {seconds > 0
                    ? t(
                        seconds <= 5
                          ? "dashboard.expiring"
                          : "dashboard.remaining",
                        { count: seconds },
                      )
                    : t(
                        refreshingPlatforms.has(item.id)
                          ? "dashboard.updating"
                          : "dashboard.waitingRetry",
                      )}
                </p>
              </article>
            );
          })}
        </div>
        {initialized && !isLoading && !userPlatforms.length && !error && (
          <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center dark:border-gray-600">
            <h3 className="font-semibold">
              {t(search ? "dashboard.noResults" : "dashboard.emptyTitle")}
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              {t(search ? "dashboard.trySearch" : "dashboard.emptyHint")}
            </p>
            <button
              className="btn-primary mt-4"
              onClick={search ? () => setSearch("") : openBinding}
            >
              {t(search ? "dashboard.clearSearch" : "dashboard.bindPlatform")}
            </button>
          </div>
        )}
        {hasMore && (
          <div className="mt-6 text-center">
            <button
              className="btn-secondary"
              disabled={isLoading || isLoadingMore}
              onClick={() => void loadMoreUserPlatforms()}
            >
              {t(isLoadingMore ? "common.loading" : "dashboard.loadMore")}
            </button>
          </div>
        )}
      </main>

      <Modal
        open={bindOpen}
        title={t("dashboard.bindPlatform")}
        onClose={closeBinding}
        busy={busy}
      >
        <form onSubmit={bind} className="space-y-4" noValidate>
          <FormErrors
            errors={errors}
            labels={{
              platformId: t("dashboard.platform"),
              accountName: t("dashboard.accountName"),
              secret: t("dashboard.otpSecret"),
            }}
          />
          {formError && (
            <p role="alert" className="error-message">
              {formError}
            </p>
          )}
          {platformLoadError && (
            <div className="error-message" role="alert">
              {platformLoadError}
              <button
                type="button"
                className="ml-2 underline"
                disabled={busy || platformsLoading}
                onClick={() => void loadPlatforms()}
              >
                {t("common.retry")}
              </button>
            </div>
          )}
          <div>
            <label htmlFor="platformId" className="field-label">
              {t("dashboard.selectPlatform")}
            </label>
            <select
              id="platformId"
              ref={platformSelectRef}
              className="field"
              value={binding.platformId}
              onChange={(e) =>
                changeBinding("platformId", e.target.value)
              }
              aria-invalid={!!errors.platformId}
              aria-describedby={
                errors.platformId ? "platformId-error" : undefined
              }
            >
              <option value="">{t("dashboard.selectPlatform")}</option>
              {platforms.map((platform) => (
                <option value={platform.id} key={platform.id}>
                  {platform.name}
                </option>
              ))}
            </select>
            {errors.platformId && (
              <p id="platformId-error" className="field-error">
                {errors.platformId}
              </p>
            )}
            <button
              type="button"
              className="mt-2 min-h-11 text-sm font-medium text-blue-700 underline dark:text-blue-300"
              onClick={() => {
                setShowInlinePlatform(!showInlinePlatform);
                setInlineError("");
              }}
              aria-expanded={showInlinePlatform}
            >
              {t("platforms.addPlatform")}
            </button>
            {showInlinePlatform && (
              <div className="mt-2 rounded-lg border border-gray-200 p-3 dark:border-gray-600">
                <label htmlFor="inline-platform" className="field-label">
                  {t("platforms.platformName")}
                </label>
                <input
                  id="inline-platform"
                  className="field"
                  value={inlinePlatformName}
                  onChange={(e) => setInlinePlatformName(e.target.value)}
                  aria-invalid={!!inlineError}
                  aria-describedby={
                    inlineError ? "inline-platform-error" : undefined
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void createInlinePlatform();
                    }
                  }}
                />
                {inlineError && (
                  <p
                    id="inline-platform-error"
                    role="alert"
                    className="field-error"
                  >
                    {inlineError}
                  </p>
                )}
                <button
                  type="button"
                  className="btn-secondary mt-2"
                  disabled={busy}
                  onClick={() => void createInlinePlatform()}
                >
                  {t(busy ? "common.loading" : "common.add")}
                </button>
              </div>
            )}
          </div>
          <div>
            <label htmlFor="accountName" className="field-label">
              {t("dashboard.accountName")}
            </label>
            <input
              id="accountName"
              className="field"
              value={binding.accountName}
              onChange={(e) =>
                changeBinding("accountName", e.target.value)
              }
              placeholder="name@example.com"
              aria-invalid={!!errors.accountName}
              aria-describedby={
                errors.accountName ? "accountName-error" : undefined
              }
            />
            {errors.accountName && (
              <p id="accountName-error" className="field-error">
                {errors.accountName}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="secret" className="field-label">
              {t("dashboard.otpSecret")}
            </label>
            <div className="relative">
              <input
                id="secret"
                className="field pr-20"
                type={showSecret ? "text" : "password"}
                autoComplete="off"
                spellCheck={false}
                autoCapitalize="off"
                value={binding.secret}
                onChange={(e) =>
                  changeBinding("secret", e.target.value)
                }
                aria-invalid={!!errors.secret}
                aria-describedby={`secret-hint${errors.secret ? " secret-error" : ""}`}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 min-w-16 px-3 text-sm text-blue-700 dark:text-blue-300"
                aria-pressed={showSecret}
                onClick={() => setShowSecret(!showSecret)}
              >
                {t(showSecret ? "auth.hide" : "auth.show")}
              </button>
            </div>
            <p
              id="secret-hint"
              className="mt-2 text-sm text-gray-600 dark:text-gray-300"
            >
              {t("dashboard.secretHint")}
            </p>
            {errors.secret && (
              <p id="secret-error" className="field-error">
                {errors.secret}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={closeBinding}
              disabled={busy}
            >
              {t("common.cancel")}
            </button>
            <button type="submit" className="btn-primary" disabled={busy}>
              {t(busy ? "common.loading" : "dashboard.bindPlatform")}
            </button>
          </div>
        </form>
      </Modal>
      <Modal
        open={!!deleteTarget || !!deletePlatformTarget}
        title={t(
          deleteTarget ? "dashboard.deleteBinding" : "platforms.deletePlatform",
        )}
        onClose={() => {
          setDeleteTarget(null);
          setDeletePlatformTarget(null);
        }}
        busy={busy}
      >
        <p className="mb-3 break-words font-medium">
          {deleteTarget
            ? `${deleteTarget.platform?.name || ""} · ${deleteTarget.accountName}`
            : deletePlatformTarget?.name}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {t(
            deleteTarget
              ? "dashboard.deleteWarning"
              : "platforms.deletePlatformConfirm",
          )}
        </p>
        {formError && (
          <p role="alert" className="error-message mt-3">
            {formError}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <button
            autoFocus
            className="btn-secondary"
            disabled={busy}
            onClick={() => {
              setDeleteTarget(null);
              setDeletePlatformTarget(null);
            }}
          >
            {t("common.cancel")}
          </button>
          <button
            className="btn-danger"
            disabled={busy}
            onClick={() => void confirmDelete()}
          >
            {t(busy ? "common.loading" : "common.delete")}
          </button>
        </div>
      </Modal>
      <Modal
        open={manageOpen}
        title={t("dashboard.platformManagement")}
        onClose={() => setManageOpen(false)}
      >
        <button
          className="btn-primary mb-4"
          onClick={() => {
            setErrors({});
            setFormError("");
            setPlatformEditor({ name: "" });
          }}
        >
          {t("platforms.addPlatform")}
        </button>
        {platformLoadError && (
          <div role="alert" className="error-message">
            {platformLoadError}
            <button
              className="ml-2 underline"
              onClick={() => void loadPlatforms()}
            >
              {t("common.retry")}
            </button>
          </div>
        )}
        {platformsLoading && <p role="status">{t("common.loading")}</p>}
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {platforms.map((platform) => (
            <li
              key={platform.id}
              className="flex flex-wrap items-center justify-between gap-2 py-3"
            >
              <span className="min-w-0 break-all font-medium">
                {platform.name}
              </span>
              <div className="flex gap-2">
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setErrors({});
                    setFormError("");
                    setPlatformEditor({ id: platform.id, name: platform.name });
                  }}
                  aria-label={`${t("common.edit")} ${platform.name}`}
                >
                  {t("common.edit")}
                </button>
                <button
                  className="icon-button text-red-700 dark:text-red-300"
                  onClick={() => {
                    setFormError("");
                    setDeletePlatformTarget(platform);
                  }}
                  aria-label={`${t("common.delete")} ${platform.name}`}
                >
                  {t("common.delete")}
                </button>
              </div>
            </li>
          ))}
        </ul>
        {!platforms.length && !platformsLoading && (
          <p>{t("platforms.noPlatformData")}</p>
        )}
      </Modal>
      <Modal
        open={!!platformEditor}
        title={t(
          platformEditor?.id
            ? "platforms.editPlatform"
            : "platforms.addPlatform",
        )}
        onClose={() => setPlatformEditor(null)}
        busy={busy}
      >
        <form onSubmit={savePlatform} className="space-y-4" noValidate>
          <FormErrors
            errors={errors}
            labels={{ platformName: t("platforms.platformName") }}
          />
          {formError && (
            <p role="alert" className="error-message">
              {formError}
            </p>
          )}
          <label htmlFor="platformName" className="field-label">
            {t("platforms.platformName")}
          </label>
          <input
            id="platformName"
            className="field"
            value={platformEditor?.name || ""}
            onChange={(e) =>
              setPlatformEditor((current) =>
                current ? { ...current, name: e.target.value } : null,
              )
            }
            aria-invalid={!!errors.platformName}
            aria-describedby={
              errors.platformName ? "platformName-error" : undefined
            }
          />
          {errors.platformName && (
            <p id="platformName-error" className="field-error">
              {errors.platformName}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="btn-secondary"
              disabled={busy}
              onClick={() => setPlatformEditor(null)}
            >
              {t("common.cancel")}
            </button>
            <button className="btn-primary" type="submit" disabled={busy}>
              {t(busy ? "common.loading" : "common.save")}
            </button>
          </div>
        </form>
      </Modal>
      <Modal
        open={settingsOpen}
        title={t("auth.userSettings")}
        onClose={() => setSettingsOpen(false)}
      >
        <UserSettingsForm onSuccess={settingsSuccess} />
      </Modal>
    </div>
  );
}
