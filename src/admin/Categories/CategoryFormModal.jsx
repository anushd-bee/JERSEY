import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader, Upload, X, ImageIcon, ToggleLeft, ToggleRight } from 'lucide-react';
import Modal from '../../components/Modal/Modal';
import { categoryService } from '../../services/categoryService';
import { slugify } from '../../utils/helpers';
import styles from './CategoryFormModal.module.css';

const schema = z.object({
    name: z.string().min(1, 'Category name is required'),
    slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9_-]+$/, 'Slug: lowercase letters, digits, _ and - only'),
    description: z.string().optional(),
    is_active: z.boolean().optional().default(true),
});

export default function CategoryFormModal({ isOpen, onClose, category, onSuccess }) {
    const isEditing = Boolean(category);
    const [submitError, setSubmitError] = useState('');
    const [submitSuccess, setSubmitSuccess] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [uploadingImage, setUploadingImage] = useState(false);
    const fileInputRef = useRef(null);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues: { name: '', slug: '', description: '', is_active: true },
    });

    const watchedName = watch('name');
    const watchedActive = watch('is_active');

    // Auto-generate slug from name (create mode only)
    useEffect(() => {
        if (!isEditing && watchedName) {
            setValue('slug', slugify(watchedName).replace(/-/g, '_'), { shouldValidate: false });
        }
    }, [watchedName, isEditing, setValue]);

    // Populate on open
    useEffect(() => {
        if (isOpen) {
            if (category) {
                reset({
                    name: category.name ?? '',
                    slug: category.slug ?? '',
                    description: category.description ?? '',
                    is_active: category.is_active ?? true,
                });
                setImagePreview(category.image || '');
            } else {
                reset({ name: '', slug: '', description: '', is_active: true });
                setImagePreview('');
            }
            setImageFile(null);
            setSubmitError('');
            setSubmitSuccess('');
        }
    }, [isOpen, category, reset]);

    function handleFileChange(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setSubmitError('Please select an image file.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setSubmitError('Image must be smaller than 5 MB.');
            return;
        }
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
        setSubmitError('');
    }

    function clearImage() {
        setImageFile(null);
        setImagePreview('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    }

    async function onSubmit(values) {
        setSubmitError('');
        setSubmitSuccess('');

        try {
            let imageUrl = isEditing ? (category.image || '') : '';

            // Upload new image if selected
            if (imageFile) {
                setUploadingImage(true);
                const { data: url, error: uploadErr } = await categoryService.uploadImage(imageFile);
                setUploadingImage(false);
                if (uploadErr) throw new Error(`Image upload failed: ${uploadErr.message}`);
                imageUrl = url;
            } else if (!imagePreview) {
                // User cleared existing image
                imageUrl = null;
            }

            const payload = { ...values, image: imageUrl };

            let result;
            if (isEditing) {
                result = await categoryService.update(category.id, payload);
            } else {
                result = await categoryService.create(payload);
            }

            if (result.error) {
                const msg = result.error.message || '';
                if (msg.includes('duplicate') || msg.includes('unique')) {
                    throw new Error(`A category with slug "${values.slug}" already exists.`);
                }
                throw new Error(msg || 'Something went wrong.');
            }

            setSubmitSuccess(isEditing ? 'Category updated!' : 'Category created!');
            setTimeout(() => { onSuccess(); onClose(); }, 700);
        } catch (err) {
            setSubmitError(err.message);
        }
    }

    const isLoading = isSubmitting || uploadingImage;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? 'Edit Category' : 'Add Category'}
        >
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <div className="modal__body">
                    {submitError && <div className="alert alert--danger mb-md">{submitError}</div>}
                    {submitSuccess && <div className="alert alert--success mb-md">{submitSuccess}</div>}

                    <div className={styles.formStack}>
                        {/* Name */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="cat-name">Category Name *</label>
                            <input
                                id="cat-name"
                                className={`form-input${errors.name ? ' form-input--error' : ''}`}
                                placeholder="e.g. Premium Jerseys"
                                {...register('name')}
                            />
                            {errors.name && <p className="form-error">{errors.name.message}</p>}
                        </div>

                        {/* Slug */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="cat-slug">Slug *</label>
                            <input
                                id="cat-slug"
                                className={`form-input${errors.slug ? ' form-input--error' : ''}`}
                                placeholder="premium_jerseys"
                                {...register('slug')}
                            />
                            {errors.slug && <p className="form-error">{errors.slug.message}</p>}
                            <p className="form-helper">Auto-generated. Must be unique. Use lowercase, digits, _ only.</p>
                        </div>

                        {/* Description */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="cat-desc">Description</label>
                            <textarea
                                id="cat-desc"
                                className="form-textarea"
                                rows={2}
                                placeholder="Optional short description shown on the shop page…"
                                {...register('description')}
                            />
                        </div>

                        {/* Category Image */}
                        <div className="form-group">
                            <label className="form-label">Category Image</label>
                            {imagePreview ? (
                                <div className={styles.imgPreviewWrap}>
                                    <img src={imagePreview} alt="Preview" className={styles.imgPreview} />
                                    <button
                                        type="button"
                                        className={styles.imgRemoveBtn}
                                        onClick={clearImage}
                                        aria-label="Remove image"
                                    >
                                        <X size={14} strokeWidth={2.5} />
                                    </button>
                                </div>
                            ) : (
                                <div
                                    className={styles.imgUploadArea}
                                    onClick={() => fileInputRef.current?.click()}
                                    onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
                                    role="button"
                                    tabIndex={0}
                                    aria-label="Upload category image"
                                >
                                    <ImageIcon size={28} strokeWidth={1.2} className={styles.imgUploadIcon} />
                                    <span className={styles.imgUploadText}>Click to upload image</span>
                                    <span className={styles.imgUploadHint}>PNG, JPG, WEBP · max 5 MB</span>
                                </div>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className={styles.hiddenFileInput}
                                onChange={handleFileChange}
                            />
                        </div>

                        {/* Active Status */}
                        <div className={styles.toggleRow}>
                            <div>
                                <div className={styles.toggleLabel}>Visible on Shop</div>
                                <p className={styles.toggleHint}>
                                    {watchedActive
                                        ? 'Category is active — visible to customers.'
                                        : 'Category is inactive — hidden from the shop, products preserved.'}
                                </p>
                            </div>
                            <button
                                type="button"
                                className={`${styles.toggleBtn} ${watchedActive ? styles.toggleBtnOn : ''}`}
                                onClick={() => setValue('is_active', !watchedActive)}
                                aria-label={`Toggle category ${watchedActive ? 'inactive' : 'active'}`}
                            >
                                {watchedActive
                                    ? <ToggleRight size={28} strokeWidth={1.8} />
                                    : <ToggleLeft size={28} strokeWidth={1.8} />}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="modal__footer">
                    <button type="button" className="btn btn--ghost" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </button>
                    <button type="submit" className="btn btn--primary" disabled={isLoading}>
                        {isLoading && <Loader size={16} className={styles.spin} />}
                        {isEditing ? 'Save Changes' : 'Create Category'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
