import { useState, useRef, useCallback } from 'react';
import {
    Upload,
    X,
    Star,
    AlertCircle,
    CheckCircle2,
    Image as ImageIcon,
    GripVertical,
} from 'lucide-react';
import styles from './ImageUploader.module.css';

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_EXTENSIONS = '.jpg,.jpeg,.png,.webp';

/**
 * Premium image uploader for admin product forms.
 * - Drag-and-drop + browse
 * - File type / size validation
 * - 1:1 white-bg preview (object-fit: contain)
 * - Primary image marking
 * - Remove / replace support
 *
 * @param {string[]}   existingImages  - Already-saved image URLs
 * @param {File[]}     newFiles        - New files pending upload
 * @param {function}   onExistingChange - Callback(newExistingArray)
 * @param {function}   onFilesChange   - Callback(newFilesArray)
 * @param {number}     primaryIndex    - Index in combined array that is primary
 * @param {function}   onPrimaryChange - Callback(combinedIndex)
 */
export default function ImageUploader({
    existingImages = [],
    newFiles = [],
    onExistingChange,
    onFilesChange,
    primaryIndex = 0,
    onPrimaryChange,
}) {
    const [dragOver, setDragOver] = useState(false);
    const [errors, setErrors] = useState([]);
    const inputRef = useRef(null);

    const combinedCount = existingImages.length + newFiles.length;

    // Validate files
    const validateFiles = useCallback((files) => {
        const valid = [];
        const errs = [];

        for (const file of files) {
            if (!ACCEPTED_TYPES.includes(file.type)) {
                errs.push(`"${file.name}" — Invalid file type. Accepted: JPG, PNG, WEBP`);
                continue;
            }
            if (file.size > MAX_FILE_SIZE) {
                errs.push(`"${file.name}" — File too large (max 5MB)`);
                continue;
            }
            valid.push(file);
        }

        if (errs.length) {
            setErrors(errs);
            setTimeout(() => setErrors([]), 5000);
        }
        return valid;
    }, []);

    const handleFiles = useCallback((fileList) => {
        const files = Array.from(fileList);
        const valid = validateFiles(files);
        if (valid.length > 0) {
            onFilesChange([...newFiles, ...valid]);
        }
    }, [newFiles, onFilesChange, validateFiles]);

    // Drag events
    const handleDragOver = (e) => {
        e.preventDefault();
        setDragOver(true);
    };
    const handleDragLeave = (e) => {
        e.preventDefault();
        setDragOver(false);
    };
    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
    };

    // Browse click
    const handleInputChange = (e) => {
        handleFiles(e.target.files);
        e.target.value = '';
    };

    // Remove handlers
    const removeExisting = (index) => {
        const next = existingImages.filter((_, i) => i !== index);
        onExistingChange(next);
        // Adjust primary if needed
        if (primaryIndex === index) {
            onPrimaryChange(0);
        } else if (primaryIndex > index) {
            onPrimaryChange(primaryIndex - 1);
        }
    };

    const removeNew = (index) => {
        const next = newFiles.filter((_, i) => i !== index);
        onFilesChange(next);
        const combinedIndex = existingImages.length + index;
        if (primaryIndex === combinedIndex) {
            onPrimaryChange(0);
        } else if (primaryIndex > combinedIndex) {
            onPrimaryChange(primaryIndex - 1);
        }
    };

    const setPrimary = (combinedIndex) => {
        onPrimaryChange(combinedIndex);
    };

    return (
        <div className={styles.uploader}>
            <div className={styles.labelRow}>
                <span className="form-label">Product Images</span>
                <span className={styles.countBadge}>
                    {combinedCount} image{combinedCount !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Drop zone */}
            <div
                className={`${styles.dropZone} ${dragOver ? styles.dropZoneActive : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                role="button"
                tabIndex={0}
                aria-label="Upload product images"
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        inputRef.current?.click();
                    }
                }}
            >
                <div className={styles.dropZoneIcon}>
                    <Upload size={24} strokeWidth={1.5} />
                </div>
                <div className={styles.dropZoneText}>
                    <p className={styles.dropZoneTitle}>
                        Drag & drop images here
                    </p>
                    <p className={styles.dropZoneSub}>
                        or <span className={styles.browseLink}>Browse Files</span>
                    </p>
                </div>
                <p className={styles.dropZoneHint}>
                    JPG, PNG, WEBP — Max 5MB each
                </p>
                <input
                    ref={inputRef}
                    type="file"
                    accept={ACCEPTED_EXTENSIONS}
                    multiple
                    className={styles.hiddenInput}
                    onChange={handleInputChange}
                    aria-hidden="true"
                    tabIndex={-1}
                />
            </div>

            {/* Validation errors */}
            {errors.length > 0 && (
                <div className={styles.errorList}>
                    {errors.map((err, i) => (
                        <div key={i} className={styles.errorItem}>
                            <AlertCircle size={14} />
                            <span>{err}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Preview grid */}
            {combinedCount > 0 && (
                <div className={styles.previewGrid}>
                    {/* Existing images */}
                    {existingImages.map((url, i) => (
                        <div
                            key={`existing-${i}`}
                            className={`${styles.previewCard} ${primaryIndex === i ? styles.previewCardPrimary : ''}`}
                        >
                            <div className={styles.previewImageWrap}>
                                <img
                                    src={url}
                                    alt={`Product image ${i + 1}`}
                                    className={styles.previewImage}
                                />
                            </div>
                            <div className={styles.previewActions}>
                                <button
                                    type="button"
                                    className={`${styles.primaryBtn} ${primaryIndex === i ? styles.primaryBtnActive : ''}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setPrimary(i);
                                    }}
                                    title={primaryIndex === i ? 'Primary image' : 'Set as primary'}
                                    aria-label={primaryIndex === i ? 'Primary image' : 'Set as primary'}
                                >
                                    <Star
                                        size={12}
                                        fill={primaryIndex === i ? 'currentColor' : 'none'}
                                    />
                                </button>
                                <button
                                    type="button"
                                    className={styles.removeBtn}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeExisting(i);
                                    }}
                                    title="Remove image"
                                    aria-label="Remove image"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                            {primaryIndex === i && (
                                <span className={styles.primaryLabel}>★ Primary</span>
                            )}
                        </div>
                    ))}

                    {/* New files */}
                    {newFiles.map((file, i) => {
                        const combinedIdx = existingImages.length + i;
                        return (
                            <div
                                key={`new-${i}`}
                                className={`${styles.previewCard} ${primaryIndex === combinedIdx ? styles.previewCardPrimary : ''}`}
                            >
                                <div className={styles.previewImageWrap}>
                                    <img
                                        src={URL.createObjectURL(file)}
                                        alt={`New upload ${i + 1}`}
                                        className={styles.previewImage}
                                    />
                                </div>
                                <div className={styles.previewActions}>
                                    <button
                                        type="button"
                                        className={`${styles.primaryBtn} ${primaryIndex === combinedIdx ? styles.primaryBtnActive : ''}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setPrimary(combinedIdx);
                                        }}
                                        title={primaryIndex === combinedIdx ? 'Primary image' : 'Set as primary'}
                                        aria-label={primaryIndex === combinedIdx ? 'Primary image' : 'Set as primary'}
                                    >
                                        <Star
                                            size={12}
                                            fill={primaryIndex === combinedIdx ? 'currentColor' : 'none'}
                                        />
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.removeBtn}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeNew(i);
                                        }}
                                        title="Remove image"
                                        aria-label="Remove image"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                                <span className={styles.newBadge}>NEW</span>
                                {primaryIndex === combinedIdx && (
                                    <span className={styles.primaryLabel}>★ Primary</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Tip */}
            {combinedCount > 0 && (
                <p className={styles.tip}>
                    <Star size={11} /> Click the ★ icon to set the primary image used on product cards and search results.
                </p>
            )}
        </div>
    );
}
