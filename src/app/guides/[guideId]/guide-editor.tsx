"use client";

import {
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import {
  deletePlaceAction,
  deletePlacePhotoAction,
  reorderPlacePhotosAction,
  savePlaceAction,
  uploadPlacePhotoAction,
} from "@/app/guides/[guideId]/place-actions";
import { placeActionInitialState } from "@/app/guides/[guideId]/place-state";
import { GuideMap, type GuideMapDraftPin } from "@/components/guide-map";
import { SignedPhoto } from "@/components/signed-photo";
import { getCurrentPlaceLocation } from "@/lib/browser-geolocation";
import { isValidPlaceLocation } from "@/lib/place-location";
import {
  guidePhotoUploadLimitMessage,
  PHOTO_FILE_INPUT_ACCEPT,
  validatePhotoUploadBatch,
} from "@/lib/place-photos";
import {
  resolvePhotoLocation,
  type PhotoLocationSuggestion,
} from "@/lib/resolve-photo-location";
import type { Place, PlaceLocation } from "@/types/place";
import type { SignedPlacePhoto } from "@/types/photo";
import styles from "./guide-editor.module.css";

const CATEGORY_SUGGESTIONS = [
  "cafe",
  "restaurant",
  "bar",
  "museum",
  "park",
  "shop",
  "hotel",
  "landmark",
  "viewpoint",
];

export type GuideEditorPlace = Place & {
  photos: SignedPlacePhoto[];
};

type GuideEditorProps = {
  guideId: string;
  places: GuideEditorPlace[];
};

type EditorMode = "idle" | "new" | "edit";

type PendingPhoto = {
  id: string;
  file: File;
  previewUrl: string;
};

type PhotoPlaceDraft = {
  id: string;
  file: File;
  previewUrl: string;
  location: PlaceLocation | null;
  name: string;
};

type PlaceFormState = {
  name: string;
  notes: string;
  category: string;
  rating: string;
  location: PlaceLocation | null;
};

const emptyFormState = (): PlaceFormState => ({
  name: "",
  notes: "",
  category: "",
  rating: "",
  location: null,
});

function placeToFormState(place: GuideEditorPlace): PlaceFormState {
  return {
    name: place.name,
    notes: place.notes ?? "",
    category: place.category ?? "",
    rating: place.rating ? String(place.rating) : "",
    location: place.location,
  };
}

function moveItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (toIndex < 0 || toIndex >= items.length || fromIndex === toIndex) {
    return items;
  }

  const next = [...items];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

function defaultNameFromFile(file: File): string {
  return file.name
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .trim();
}

export function GuideEditor({ guideId, places }: GuideEditorProps) {
  const router = useRouter();
  const listRef = useRef<HTMLDivElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const photoFirstInputRef = useRef<HTMLInputElement>(null);
  const pendingUploadsRef = useRef<PendingPhoto[]>([]);

  const [mode, setMode] = useState<EditorMode>("idle");
  const [editingPlaceId, setEditingPlaceId] = useState<string | null>(null);
  const [formState, setFormState] = useState<PlaceFormState>(emptyFormState);
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const [photoPlaceDrafts, setPhotoPlaceDrafts] = useState<PhotoPlaceDraft[]>([]);
  const [activePhotoDraftId, setActivePhotoDraftId] = useState<string | null>(null);
  const [suggestedLocation, setSuggestedLocation] =
    useState<PhotoLocationSuggestion | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [uploadLimitError, setUploadLimitError] = useState<string | null>(null);
  const [locationAssistError, setLocationAssistError] = useState<string | null>(null);
  const [isUploadingPending, startUploadPending] = useTransition();
  const [isResolvingLocation, startResolveLocation] = useTransition();

  const [saveState, saveAction, savePending] = useActionState(
    savePlaceAction,
    placeActionInitialState,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deletePlaceAction,
    placeActionInitialState,
  );
  const [uploadState, uploadAction, uploadPending] = useActionState(
    uploadPlacePhotoAction,
    placeActionInitialState,
  );
  const [deletePhotoState, deletePhotoAction, deletePhotoPending] =
    useActionState(deletePlacePhotoAction, placeActionInitialState);
  const [reorderState, reorderAction, reorderPending] = useActionState(
    reorderPlacePhotosAction,
    placeActionInitialState,
  );

  const editingPlace = editingPlaceId
    ? places.find((place) => place.id === editingPlaceId)
    : null;
  const isFormOpen = mode === "new" || mode === "edit";
  const isPending =
    savePending ||
    deletePending ||
    uploadPending ||
    deletePhotoPending ||
    reorderPending ||
    isUploadingPending ||
    isResolvingLocation;

  const activePlaceId = selectedPlaceId ?? editingPlaceId ?? undefined;

  const visiblePhotoDrafts = photoPlaceDrafts.filter(
    (draft) => draft.id !== activePhotoDraftId,
  );

  const mapDraftPins = useMemo((): GuideMapDraftPin[] => {
    const pins: GuideMapDraftPin[] = visiblePhotoDrafts.flatMap((draft) =>
      isValidPlaceLocation(draft.location)
        ? [{ id: draft.id, location: draft.location, label: draft.name }]
        : [],
    );

    if (isFormOpen && isValidPlaceLocation(formState.location)) {
      pins.push({
        id: activePhotoDraftId ?? "__form__",
        location: formState.location,
        label: formState.name.trim() || "New place",
      });
    }

    return pins;
  }, [
    activePhotoDraftId,
    formState.location,
    formState.name,
    isFormOpen,
    visiblePhotoDrafts,
  ]);

  const resetForm = useCallback(() => {
    setMode("idle");
    setEditingPlaceId(null);
    setActivePhotoDraftId(null);
    setFormState(emptyFormState());
    setPendingPhotos((current) => {
      for (const photo of current) {
        URL.revokeObjectURL(photo.previewUrl);
      }
      return [];
    });
    setSuggestedLocation(null);
    setUploadLimitError(null);
    pendingUploadsRef.current = [];
  }, []);

  const openNewPlace = useCallback((location: PlaceLocation) => {
    setMode("new");
    setEditingPlaceId(null);
    setActivePhotoDraftId(null);
    setSelectedPlaceId(null);
    setFormState({ ...emptyFormState(), location });
    setPendingPhotos((current) => {
      for (const photo of current) {
        URL.revokeObjectURL(photo.previewUrl);
      }
      return [];
    });
    setSuggestedLocation(null);
    setUploadLimitError(null);
    pendingUploadsRef.current = [];
  }, []);

  const openPhotoDraft = useCallback((draft: PhotoPlaceDraft) => {
    setMode("new");
    setEditingPlaceId(null);
    setActivePhotoDraftId(draft.id);
    setSelectedPlaceId(null);
    setFormState({
      name: draft.name,
      notes: "",
      category: "",
      rating: "",
      location: draft.location,
    });
    setPendingPhotos([
      {
        id: draft.id,
        file: draft.file,
        previewUrl: draft.previewUrl,
      },
    ]);
    setSuggestedLocation(null);
    pendingUploadsRef.current = [];
  }, []);

  const removePhotoDraft = useCallback((draftId: string) => {
    setPhotoPlaceDrafts((current) => {
      const removed = current.find((draft) => draft.id === draftId);
      if (removed) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      return current.filter((draft) => draft.id !== draftId);
    });

    if (activePhotoDraftId === draftId) {
      resetForm();
    }
  }, [activePhotoDraftId, resetForm]);

  const openEditPlace = useCallback((place: GuideEditorPlace) => {
    setMode("edit");
    setEditingPlaceId(place.id);
    setActivePhotoDraftId(null);
    setSelectedPlaceId(place.id);
    setFormState(placeToFormState(place));
    setPendingPhotos((current) => {
      for (const photo of current) {
        URL.revokeObjectURL(photo.previewUrl);
      }
      return [];
    });
    setSuggestedLocation(null);
    pendingUploadsRef.current = [];
  }, []);

  const handleMapClick = useCallback(
    (location: PlaceLocation) => {
      if (isFormOpen) {
        setFormState((current) => ({ ...current, location }));
        return;
      }

      openNewPlace(location);
    },
    [isFormOpen, openNewPlace],
  );

  const handlePinClick = useCallback(
    (placeId: string) => {
      const place = places.find((item) => item.id === placeId);
      if (!place) {
        return;
      }

      openEditPlace(place);
      const card = listRef.current?.querySelector<HTMLElement>(
        `[data-place-id="${placeId}"]`,
      );
      card?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    },
    [openEditPlace, places],
  );

  const handleDraftPinClick = useCallback(
    (draftId: string) => {
      if (draftId === "__form__") {
        return;
      }

      const draft = photoPlaceDrafts.find((item) => item.id === draftId);
      if (draft) {
        openPhotoDraft(draft);
        return;
      }

      if (activePhotoDraftId === draftId && isFormOpen) {
        return;
      }
    },
    [activePhotoDraftId, isFormOpen, openPhotoDraft, photoPlaceDrafts],
  );

  const offerLocationSuggestion = useCallback(async (file: File) => {
    const suggestion = await resolvePhotoLocation(file);
    if (suggestion) {
      setSuggestedLocation(suggestion);
    }
  }, []);

  const handlePhotoFirstUpload = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) {
        return;
      }

      const selected = Array.from(files);
      const batchError = validatePhotoUploadBatch(selected);
      if (batchError) {
        setUploadLimitError(batchError);
        return;
      }

      setUploadLimitError(null);
      startResolveLocation(async () => {
        const newDrafts: PhotoPlaceDraft[] = [];

        for (const file of selected) {
          const suggestion = await resolvePhotoLocation(file);
          newDrafts.push({
            id: crypto.randomUUID(),
            file,
            previewUrl: URL.createObjectURL(file),
            location: suggestion?.location ?? null,
            name: defaultNameFromFile(file) || "Untitled place",
          });
        }

        setPhotoPlaceDrafts((current) => [...current, ...newDrafts]);
      });
    },
    [startResolveLocation],
  );

  const handlePhotoFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) {
        return;
      }

      const file = files[0];
      await offerLocationSuggestion(file);

      if (mode === "edit" && editingPlaceId) {
        const batchError = validatePhotoUploadBatch([file]);
        if (batchError) {
          setUploadLimitError(batchError);
          return;
        }

        setUploadLimitError(null);
        const formData = new FormData();
        formData.set("guideId", guideId);
        formData.set("placeId", editingPlaceId);
        formData.set("photo", file);
        uploadAction(formData);
        return;
      }

      const batchError = validatePhotoUploadBatch([
        ...pendingPhotos.map((photo) => photo.file),
        file,
      ]);
      if (batchError) {
        setUploadLimitError(batchError);
        return;
      }

      setUploadLimitError(null);
      setPendingPhotos((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          file,
          previewUrl: URL.createObjectURL(file),
        },
      ]);
    },
    [editingPlaceId, guideId, mode, offerLocationSuggestion, pendingPhotos, uploadAction],
  );

  const uploadPendingPhotos = useCallback(
    async (placeId: string, photos: PendingPhoto[]): Promise<string | null> => {
      for (const pending of photos) {
        const formData = new FormData();
        formData.set("guideId", guideId);
        formData.set("placeId", placeId);
        formData.set("photo", pending.file);
        const result = await uploadPlacePhotoAction(
          placeActionInitialState,
          formData,
        );
        if (result.error) {
          return result.error;
        }
      }

      return null;
    },
    [guideId],
  );

  useEffect(() => {
    if (!saveState.success || !saveState.placeId) {
      return;
    }

    const savedPlaceId = saveState.placeId;
    const toUpload = pendingUploadsRef.current;

    if (toUpload.length > 0) {
      startUploadPending(async () => {
        const uploadError = await uploadPendingPhotos(savedPlaceId, toUpload);
        if (uploadError) {
          setUploadLimitError(uploadError);
          for (const photo of toUpload) {
            URL.revokeObjectURL(photo.previewUrl);
          }
          pendingUploadsRef.current = [];
          if (activePhotoDraftId) {
            setPhotoPlaceDrafts((current) =>
              current.filter((draft) => draft.id !== activePhotoDraftId),
            );
            setActivePhotoDraftId(null);
          }
          resetForm();
          router.refresh();
          return;
        }

        for (const photo of toUpload) {
          URL.revokeObjectURL(photo.previewUrl);
        }
        pendingUploadsRef.current = [];
        if (activePhotoDraftId) {
          setPhotoPlaceDrafts((current) =>
            current.filter((draft) => draft.id !== activePhotoDraftId),
          );
          setActivePhotoDraftId(null);
        }
        resetForm();
        router.refresh();
      });
      return;
    }

    if (activePhotoDraftId) {
      setPhotoPlaceDrafts((current) =>
        current.filter((draft) => draft.id !== activePhotoDraftId),
      );
      setActivePhotoDraftId(null);
    }

    resetForm();
    router.refresh();
  }, [
    resetForm,
    router,
    saveState.placeId,
    saveState.success,
    uploadPendingPhotos,
    activePhotoDraftId,
  ]);

  useEffect(() => {
    if (
      uploadState.success ||
      deletePhotoState.success ||
      reorderState.success
    ) {
      router.refresh();
    }

    if (deleteState.success) {
      resetForm();
      router.refresh();
    }
  }, [
    deletePhotoState.success,
    deleteState.success,
    reorderState.success,
    resetForm,
    router,
    uploadState.success,
  ]);

  const handleSaveSubmit = (formData: FormData) => {
    const batchError = validatePhotoUploadBatch(
      pendingPhotos.map((photo) => photo.file),
    );
    if (batchError) {
      setUploadLimitError(batchError);
      return;
    }

    setUploadLimitError(null);
    pendingUploadsRef.current = [...pendingPhotos];
    saveAction(formData);
  };

  const acceptSuggestedLocation = () => {
    if (!suggestedLocation) {
      return;
    }

    setFormState((current) => ({
      ...current,
      location: suggestedLocation.location,
    }));
    setSuggestedLocation(null);
    setLocationAssistError(null);
  };

  const assignCurrentLocationToForm = useCallback(() => {
    startResolveLocation(async () => {
      setLocationAssistError(null);
      const location = await getCurrentPlaceLocation();
      if (!location) {
        setLocationAssistError(
          "Could not read your current location. Allow location access in the browser, or drop the pin on the map.",
        );
        return;
      }

      setFormState((current) => ({ ...current, location }));
    });
  }, []);

  const assignCurrentLocationToDraft = useCallback((draftId: string) => {
    startResolveLocation(async () => {
      setLocationAssistError(null);
      const location = await getCurrentPlaceLocation();
      if (!location) {
        setLocationAssistError(
          "Could not read your current location. Allow location access in the browser, or set the pin when editing.",
        );
        return;
      }

      setPhotoPlaceDrafts((current) =>
        current.map((draft) =>
          draft.id === draftId ? { ...draft, location } : draft,
        ),
      );
    });
  }, []);

  const dismissSuggestedLocation = () => {
    setSuggestedLocation(null);
  };

  const removePendingPhoto = (photoId: string) => {
    setPendingPhotos((current) => {
      const next = current.filter((photo) => photo.id !== photoId);
      const removed = current.find((photo) => photo.id === photoId);
      if (removed) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      return next;
    });
  };

  const movePendingPhoto = (index: number, direction: -1 | 1) => {
    setPendingPhotos((current) => moveItem(current, index, index + direction));
  };

  const moveSavedPhoto = (photoId: string, direction: -1 | 1) => {
    if (!editingPlace) {
      return;
    }

    const photos = [...editingPlace.photos];
    const index = photos.findIndex((photo) => photo.id === photoId);
    if (index === -1) {
      return;
    }

    const reordered = moveItem(photos, index, index + direction);
    const formData = new FormData();
    formData.set("guideId", guideId);
    formData.set("placeId", editingPlace.id);
    formData.set("photoIds", JSON.stringify(reordered.map((photo) => photo.id)));
    reorderAction(formData);
  };

  const feedback =
    uploadLimitError ??
    locationAssistError ??
    saveState.error ??
    deleteState.error ??
    uploadState.error ??
    deletePhotoState.error ??
    reorderState.error;
  const successMessage =
    saveState.success ??
    deleteState.success ??
    uploadState.success ??
    deletePhotoState.success ??
    reorderState.success;

  return (
    <section className={styles.editor}>
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2 className={styles.sectionTitle}>Places</h2>
          <p className={styles.sectionCopy}>
            Click the map to drop a place, upload photos with GPS to add pins
            automatically, or select a place below to edit.
          </p>
          <p className={styles.limitNotice}>{guidePhotoUploadLimitMessage()}</p>
        </div>

        <section className={styles.photoImport}>
          <h3 className={styles.photoImportTitle}>From photos</h3>
          <p className={styles.photoImportCopy}>
            Upload one or more photos. Pins are placed from GPS or filename hints
            when available. On Android, choose Browse or Files — not Photos — so
            location data is preserved.
          </p>
          <button
            className={styles.button}
            type="button"
            onClick={() => photoFirstInputRef.current?.click()}
            disabled={isPending}
          >
            Upload photos
          </button>
          <input
            ref={photoFirstInputRef}
            className={styles.hiddenInput}
            type="file"
            accept={PHOTO_FILE_INPUT_ACCEPT}
            multiple
            onChange={(event) => {
              handlePhotoFirstUpload(event.target.files);
              event.target.value = "";
            }}
            disabled={isPending}
          />
        </section>

        {visiblePhotoDrafts.length > 0 ? (
          <ul className={styles.draftList}>
            {visiblePhotoDrafts.map((draft) => (
              <li key={draft.id} className={styles.draftItem}>
                {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
                <img
                  className={styles.draftThumb}
                  src={draft.previewUrl}
                  alt=""
                />
                <div className={styles.draftBody}>
                  <p className={styles.draftName}>{draft.name}</p>
                  {draft.location ? (
                    <p className={styles.coords}>
                      {draft.location.lat.toFixed(5)}, {draft.location.lng.toFixed(5)}
                    </p>
                  ) : (
                    <div className={styles.draftLocationActions}>
                      <p className={styles.helper}>
                        No GPS in this photo — set the location when editing.
                      </p>
                      <button
                        className={styles.textButton}
                        type="button"
                        onClick={() => assignCurrentLocationToDraft(draft.id)}
                        disabled={isPending}
                      >
                        Use current location
                      </button>
                    </div>
                  )}
                  <div className={styles.draftActions}>
                    <button
                      className={styles.textButton}
                      type="button"
                      onClick={() => openPhotoDraft(draft)}
                      disabled={isPending}
                    >
                      Set up
                    </button>
                    <button
                      className={styles.textButton}
                      type="button"
                      onClick={() => removePhotoDraft(draft.id)}
                      disabled={isPending}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : null}

        {isFormOpen ? (
          <form className={styles.form} action={handleSaveSubmit}>
            <input type="hidden" name="guideId" value={guideId} />
            {editingPlaceId ? (
              <input type="hidden" name="placeId" value={editingPlaceId} />
            ) : null}
            {formState.location ? (
              <>
                <input type="hidden" name="lat" value={formState.location.lat} />
                <input type="hidden" name="lng" value={formState.location.lng} />
              </>
            ) : null}

            <div className={styles.formHeader}>
              <h3 className={styles.formTitle}>
                {mode === "new" ? "New place" : "Edit place"}
              </h3>
              <button
                className={styles.textButton}
                type="button"
                onClick={resetForm}
                disabled={isPending}
              >
                Cancel
              </button>
            </div>

            {!formState.location ? (
              <div className={styles.locationAssist}>
                <p className={styles.helper}>
                  {activePhotoDraftId
                    ? "This photo has no GPS data. Click the map, or use your current location if you are at the place."
                    : "Click the map to set this place's location, or use your current location if you are there now."}
                </p>
                <button
                  className={styles.button}
                  type="button"
                  onClick={assignCurrentLocationToForm}
                  disabled={isPending}
                >
                  Use current location
                </button>
              </div>
            ) : (
              <p className={styles.coords}>
                {formState.location.lat.toFixed(5)}, {formState.location.lng.toFixed(5)}
              </p>
            )}

            {suggestedLocation && !activePhotoDraftId ? (
              <div className={styles.suggestion}>
                <p className={styles.suggestionCopy}>
                  {suggestedLocation.source === "filename" ? (
                    <>
                      Filename &ldquo;{suggestedLocation.query}&rdquo; suggests (
                      {suggestedLocation.location.lat.toFixed(5)},{" "}
                      {suggestedLocation.location.lng.toFixed(5)}). Use as the place
                      location?
                    </>
                  ) : (
                    <>
                      This photo includes GPS coordinates (
                      {suggestedLocation.location.lat.toFixed(5)},{" "}
                      {suggestedLocation.location.lng.toFixed(5)}). Use as the place
                      location?
                    </>
                  )}
                </p>
                <div className={styles.suggestionActions}>
                  <button
                    className={`${styles.button} ${styles.buttonPrimary}`}
                    type="button"
                    onClick={acceptSuggestedLocation}
                    disabled={isPending}
                  >
                    Use location
                  </button>
                  <button
                    className={styles.button}
                    type="button"
                    onClick={dismissSuggestedLocation}
                    disabled={isPending}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ) : null}

            <label className={styles.field}>
              <span className={styles.label}>Name</span>
              <input
                className={styles.input}
                name="name"
                value={formState.name}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                required
                disabled={isPending}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Notes</span>
              <textarea
                className={styles.textarea}
                name="notes"
                rows={4}
                value={formState.notes}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    notes: event.target.value,
                  }))
                }
                disabled={isPending}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Category</span>
              <input
                className={styles.input}
                name="category"
                list={`categories-${guideId}`}
                value={formState.category}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    category: event.target.value,
                  }))
                }
                disabled={isPending}
              />
              <datalist id={`categories-${guideId}`}>
                {CATEGORY_SUGGESTIONS.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Rating</span>
              <select
                className={styles.input}
                name="rating"
                value={formState.rating}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    rating: event.target.value,
                  }))
                }
                disabled={isPending}
              >
                <option value="">No rating</option>
                {[1, 2, 3, 4, 5].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <div className={styles.photosSection}>
              <div className={styles.photosHeader}>
                <span className={styles.label}>Photos</span>
                <button
                  className={styles.textButton}
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={isPending}
                >
                  Add photo
                </button>
                <input
                  ref={photoInputRef}
                  className={styles.hiddenInput}
                  type="file"
                  accept={PHOTO_FILE_INPUT_ACCEPT}
                  onChange={(event) => {
                    void handlePhotoFiles(event.target.files);
                    event.target.value = "";
                  }}
                  disabled={isPending}
                />
              </div>
              <p className={styles.limitNotice}>{guidePhotoUploadLimitMessage()}</p>

              {mode === "edit" && editingPlace && editingPlace.photos.length > 0 ? (
                <ul className={styles.photoList}>
                  {editingPlace.photos.map((photo, index) => (
                    <li key={photo.id} className={styles.photoItem}>
                      <SignedPhoto
                        photoId={photo.id}
                        src={photo.url}
                        expiresAt={photo.expiresAt}
                        alt={photo.caption ?? editingPlace.name}
                        className={styles.photoThumb}
                      />
                      <div className={styles.photoActions}>
                        <button
                          className={styles.iconButton}
                          type="button"
                          aria-label="Move photo earlier"
                          disabled={isPending || index === 0}
                          onClick={() => moveSavedPhoto(photo.id, -1)}
                        >
                          ↑
                        </button>
                        <button
                          className={styles.iconButton}
                          type="button"
                          aria-label="Move photo later"
                          disabled={
                            isPending || index === editingPlace.photos.length - 1
                          }
                          onClick={() => moveSavedPhoto(photo.id, 1)}
                        >
                          ↓
                        </button>
                        <button
                          className={styles.iconButton}
                          type="button"
                          aria-label="Remove photo"
                          disabled={isPending}
                          onClick={() => {
                            const formData = new FormData();
                            formData.set("guideId", guideId);
                            formData.set("placeId", editingPlace.id);
                            formData.set("photoId", photo.id);
                            deletePhotoAction(formData);
                          }}
                        >
                          ×
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}

              {mode === "new" && pendingPhotos.length > 0 ? (
                <ul className={styles.photoList}>
                  {pendingPhotos.map((photo, index) => (
                    <li key={photo.id} className={styles.photoItem}>
                      {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
                      <img
                        className={styles.photoThumb}
                        src={photo.previewUrl}
                        alt=""
                      />
                      <div className={styles.photoActions}>
                        <button
                          className={styles.iconButton}
                          type="button"
                          aria-label="Move photo earlier"
                          disabled={isPending || index === 0}
                          onClick={() => movePendingPhoto(index, -1)}
                        >
                          ↑
                        </button>
                        <button
                          className={styles.iconButton}
                          type="button"
                          aria-label="Move photo later"
                          disabled={isPending || index === pendingPhotos.length - 1}
                          onClick={() => movePendingPhoto(index, 1)}
                        >
                          ↓
                        </button>
                        <button
                          className={styles.iconButton}
                          type="button"
                          aria-label="Remove photo"
                          disabled={isPending}
                          onClick={() => removePendingPhoto(photo.id)}
                        >
                          ×
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}

              {mode === "edit" &&
              editingPlace &&
              editingPlace.photos.length === 0 ? (
                <p className={styles.helper}>No photos yet.</p>
              ) : null}
            </div>

            <div className={styles.formActions}>
              <button
                className={`${styles.button} ${styles.buttonPrimary}`}
                type="submit"
                disabled={isPending || !formState.location}
              >
                {savePending ? "Saving…" : "Save place"}
              </button>

              {mode === "edit" && editingPlaceId ? (
                <button
                  className={styles.button}
                  type="submit"
                  formAction={deleteAction}
                  disabled={isPending}
                >
                  {deletePending ? "Removing…" : "Remove place"}
                </button>
              ) : null}
            </div>
          </form>
        ) : null}

        <div ref={listRef} className={styles.placeList} role="list">
          {places.length === 0 && visiblePhotoDrafts.length === 0 ? (
            <p className={styles.empty}>
              No places yet. Click the map or upload photos to add one.
            </p>
          ) : (
            places.map((place) => {
              const primaryPhoto = place.photos[0];
              const isActive = place.id === activePlaceId;

              return (
                <article
                  key={place.id}
                  className={
                    isActive ? `${styles.placeCard} ${styles.placeCardActive}` : styles.placeCard
                  }
                  data-place-id={place.id}
                  role="listitem"
                >
                  {primaryPhoto ? (
                    <div className={styles.placeThumbFrame}>
                      <SignedPhoto
                        photoId={primaryPhoto.id}
                        src={primaryPhoto.url}
                        expiresAt={primaryPhoto.expiresAt}
                        alt={primaryPhoto.caption ?? place.name}
                        className={styles.placeThumb}
                      />
                    </div>
                  ) : null}
                  <div className={styles.placeBody}>
                    <h3 className={styles.placeName}>{place.name}</h3>
                    {place.category ? (
                      <span className={styles.category}>{place.category}</span>
                    ) : null}
                    {place.rating ? (
                      <p className={styles.rating}>{place.rating}/5</p>
                    ) : null}
                    {place.notes ? (
                      <p className={styles.notesPreview}>{place.notes}</p>
                    ) : null}
                    <button
                      className={styles.textButton}
                      type="button"
                      onClick={() => openEditPlace(place)}
                    >
                      Edit
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>

        {feedback ? <p className={styles.error}>{feedback}</p> : null}
        {successMessage && !isFormOpen ? (
          <p className={styles.success}>{successMessage}</p>
        ) : null}
      </div>

      <div className={styles.mapPanel}>
        <GuideMap
          places={places}
          activePlaceId={activePlaceId}
          draftPins={mapDraftPins}
          onPinClick={handlePinClick}
          onDraftPinClick={handleDraftPinClick}
          onMapClick={handleMapClick}
          autoFitViewport={places.length > 0 || mapDraftPins.length > 0}
        />
      </div>
    </section>
  );
}
