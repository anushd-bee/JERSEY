import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader } from 'lucide-react';
import Modal from '../../components/Modal/Modal';
import ImageUploader from '../../components/ImageUploader/ImageUploader';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import { slugify, SIZES } from '../../utils/helpers';
import styles from './ProductFormModal.module.css';

const schema = z.object({
    name: z.string().min(1, 'Name is required'),
    slug: z.string().min(1, 'Slug is required'),
    description: z.string().optional(),
    price: z.coerce.number({ invalid_type_error: 'Price is required' }).positive('Price must be greater than 0'),
    compare_price: z.coerce.number().positive('Must be positive').optional().or(z.literal('')),
    category_id: z.string().min(1, 'Please select a category.'),
    stock: z.coerce.number().int().min(0, 'Stock cannot be negative').default(0),
    is_active: z.boolean().default(true),
    is_featured: z.boolean().default(false),
    is_offer: z.boolean().default(false),
});

export default function ProductFormModal({ isOpen, onClose, product, onSuccess }) {
    const isEditing = Boolean(product);
    const [categories, setCategories] = useState([]);
    const [categoriesLoading, setCategoriesLoading] = useState(false);
    const [categoriesError, setCategoriesError] = useState('');
    const [selectedSizes, setSelectedSizes] = useState([]);
    const [imageFiles, setImageFiles] = useState([]);       // File objects pending upload
    const [existingImages, setExistingImages] = useState([]); // Already-saved URLs (edit mode)
    const [primaryIndex, setPrimaryIndex] = useState(0);     // Which image is primary
    const [uploading, setUploading] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [submitSuccess, setSubmitSuccess] = useState('');

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            name: '',
            slug: '',
            description: '',
            price: '',
            compare_price: '',
            category_id: '',
            stock: 0,
            is_active: true,
            is_featured: false,
            is_offer: false,
        },
    });

    const watchedName = watch('name');
    const watchedIsOffer = watch('is_offer');

    // Auto-generate slug from name (only when NOT editing, or slug is still pristine)
    useEffect(() => {
        if (!isEditing && watchedName) {
            setValue('slug', slugify(watchedName), { shouldValidate: false });
        }
    }, [watchedName, isEditing, setValue]);

    // Load ACTIVE categories only (inactive categories must not appear for new products)
    useEffect(() => {
        if (!isOpen) return;

        let active = true;
        async function loadCategories() {
            setCategoriesLoading(true);
            setCategoriesError('');

            try {
                const { data, error } = await categoryService.getActive();
                if (!active) return;

                if (error) {
                    setCategories([]);
                    setCategoriesError('Unable to load categories right now.');
                    return;
                }

                let nextCategories = [...(data || [])];

                if (product?.category_id && !nextCategories.some(cat => cat.id === product.category_id)) {
                    const { data: currentCategory, error: categoryError } = await categoryService.getById(product.category_id);
                    if (!active) return;
                    if (!categoryError && currentCategory) {
                        nextCategories = [...nextCategories, currentCategory];
                    }
                }

                nextCategories.sort((a, b) => a.name.localeCompare(b.name));
                setCategories(nextCategories);
            } finally {
                if (active) {
                    setCategoriesLoading(false);
                }
            }
        }

        loadCategories();
        return () => { active = false; };
    }, [isOpen, product?.id]);

    // Populate form when editing
    useEffect(() => {
        if (isOpen) {
            if (product) {
                reset({
                    name: product.name ?? '',
                    slug: product.slug ?? '',
                    description: product.description ?? '',
                    price: product.price ?? '',
                    compare_price: product.compare_price ?? '',
                    category_id: product.category_id ?? '',
                    stock: product.stock ?? 0,
                    is_active: product.is_active ?? true,
                    is_featured: product.is_featured ?? false,
                    is_offer: product.is_offer ?? false,
                });
                setSelectedSizes(product.sizes ?? []);
                setExistingImages(product.images ?? []);
                setPrimaryIndex(0);
            } else {
                reset();
                setSelectedSizes([]);
                setExistingImages([]);
                setPrimaryIndex(0);
            }
            setImageFiles([]);
            setSubmitError('');
            setSubmitSuccess('');
        }
    }, [isOpen, product, reset]);

    function handleSizeToggle(size) {
        setSelectedSizes(prev =>
            prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
        );
    }

    async function onSubmit(values) {
        setSubmitError('');
        setSubmitSuccess('');

        if (!values.category_id) {
            setSubmitError('Please select a category.');
            return;
        }

        setUploading(true);

        try {
            // Upload new files
            const uploadedUrls = [];
            for (const file of imageFiles) {
                const path = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
                const { data: url, error: uploadErr } = await productService.uploadImage(file, path);
                if (uploadErr) throw new Error(`Image upload failed: ${uploadErr.message}`);
                uploadedUrls.push(url);
            }

            // Build final images array with primary image first
            const allImages = [...existingImages, ...uploadedUrls];
            // Move the primary image to position [0]
            if (primaryIndex > 0 && primaryIndex < allImages.length) {
                const [primary] = allImages.splice(primaryIndex, 1);
                allImages.unshift(primary);
            }

            const payload = {
                ...values,
                compare_price: values.compare_price === '' ? null : Number(values.compare_price),
                sizes: selectedSizes,
                images: allImages,
            };

            let result;
            if (isEditing) {
                result = await productService.update(product.id, payload);
            } else {
                result = await productService.create(payload);
            }

            if (result.error) throw new Error(result.error.message);

            setSubmitSuccess(isEditing ? 'Product updated!' : 'Product created!');
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 800);
        } catch (err) {
            setSubmitError(err.message || 'Something went wrong.');
        } finally {
            setUploading(false);
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? 'Edit Product' : 'Add Product'}
            size="xl"
        >
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <div className="modal__body">
                    {submitError && (
                        <div className="alert alert--danger mb-md">{submitError}</div>
                    )}
                    {submitSuccess && (
                        <div className="alert alert--success mb-md">{submitSuccess}</div>
                    )}

                    <div className={styles.grid2}>
                        {/* Name */}
                        <div className={`form-group ${styles.colSpan2}`}>
                            <label className="form-label" htmlFor="prod-name">Name *</label>
                            <input
                                id="prod-name"
                                className={`form-input${errors.name ? ' form-input--error' : ''}`}
                                placeholder="e.g. Brazil Home Jersey 2024"
                                {...register('name')}
                            />
                            {errors.name && <p className="form-error">{errors.name.message}</p>}
                        </div>

                        {/* Slug */}
                        <div className={`form-group ${styles.colSpan2}`}>
                            <label className="form-label" htmlFor="prod-slug">Slug *</label>
                            <input
                                id="prod-slug"
                                className={`form-input${errors.slug ? ' form-input--error' : ''}`}
                                placeholder="auto-generated from name"
                                {...register('slug')}
                            />
                            {errors.slug && <p className="form-error">{errors.slug.message}</p>}
                        </div>

                        {/* Description */}
                        <div className={`form-group ${styles.colSpan2}`}>
                            <label className="form-label" htmlFor="prod-desc">Description</label>
                            <textarea
                                id="prod-desc"
                                className="form-textarea"
                                rows={3}
                                placeholder="Describe the jersey..."
                                {...register('description')}
                            />
                        </div>

                        {/* Price */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="prod-price">Price (₹) *</label>
                            <input
                                id="prod-price"
                                type="number"
                                min="0"
                                step="1"
                                className={`form-input${errors.price ? ' form-input--error' : ''}`}
                                placeholder="999"
                                {...register('price')}
                            />
                            {errors.price && <p className="form-error">{errors.price.message}</p>}
                        </div>

                        {/* Compare Price */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="prod-compare">Compare Price (₹)</label>
                            <input
                                id="prod-compare"
                                type="number"
                                min="0"
                                step="1"
                                className="form-input"
                                placeholder="1299 (optional)"
                                {...register('compare_price')}
                            />
                        </div>

                        {/* Category */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="prod-cat">Category *</label>
                            {categoriesLoading ? (
                                <p className="form-helper">Loading categories...</p>
                            ) : categoriesError ? (
                                <p className="form-error">{categoriesError}</p>
                            ) : categories.length === 0 ? (
                                <p className="form-helper">No categories available. Create a category first.</p>
                            ) : (
                                <select
                                    id="prod-cat"
                                    className={`form-select${errors.category_id ? ' form-select--error' : ''}`}
                                    {...register('category_id')}
                                    disabled={categoriesLoading}
                                >
                                    <option value="">Select category…</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            )}
                            {errors.category_id && <p className="form-error">{errors.category_id.message}</p>}
                        </div>

                        {/* Stock */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="prod-stock">Stock</label>
                            <input
                                id="prod-stock"
                                type="number"
                                min="0"
                                step="1"
                                className="form-input"
                                {...register('stock')}
                            />
                        </div>

                        {/* ── Offer Section ── */}
                        <div className={`form-group ${styles.colSpan2}`}>
                            <div className={styles.sectionDivider}>
                                <span className={styles.sectionDividerLabel}>Offer / Discount</span>
                            </div>
                        </div>

                        <div className={`form-group ${styles.colSpan2} ${styles.toggleRow}`}>
                            <label className={styles.toggle}>
                                <input type="checkbox" {...register('is_offer')} />
                                <span className={styles.toggleTrack} />
                                <span className="form-label">Enable Offer</span>
                            </label>
                        </div>

                        {watchedIsOffer && (
                            <div className={`form-group ${styles.colSpan2}`}>
                                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)', margin: '0 0 8px' }}>
                                    Set the <strong>Price</strong> field above as the discounted/offer price. Set <strong>Compare Price</strong> as the original price. The discount % will be calculated automatically on display.
                                </p>
                            </div>
                        )}

                        {/* Sizes */}
                        <div className={`form-group ${styles.colSpan2}`}>
                            <span className="form-label">Sizes</span>
                            <div className={styles.sizeGrid}>
                                {SIZES.map(size => (
                                    <button
                                        key={size}
                                        type="button"
                                        className={`${styles.sizeBtn} ${selectedSizes.includes(size) ? styles.sizeBtnActive : ''}`}
                                        onClick={() => handleSizeToggle(size)}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Toggles */}
                        <div className={`form-group ${styles.toggleRow}`}>
                            <label className={styles.toggle}>
                                <input type="checkbox" {...register('is_active')} />
                                <span className={styles.toggleTrack} />
                                <span className="form-label">Active</span>
                            </label>
                            <label className={styles.toggle}>
                                <input type="checkbox" {...register('is_featured')} />
                                <span className={styles.toggleTrack} />
                                <span className="form-label">Featured</span>
                            </label>
                            <label className={styles.toggle}>
                                <input type="checkbox" {...register('is_offer')} />
                                <span className={styles.toggleTrack} />
                                <span className="form-label">Show in Offers</span>
                            </label>
                        </div>

                        {/* Images — Premium Uploader */}
                        <div className={`form-group ${styles.colSpan2}`}>
                            <ImageUploader
                                existingImages={existingImages}
                                newFiles={imageFiles}
                                onExistingChange={setExistingImages}
                                onFilesChange={setImageFiles}
                                primaryIndex={primaryIndex}
                                onPrimaryChange={setPrimaryIndex}
                            />
                        </div>
                    </div>
                </div>

                <div className="modal__footer">
                    <button type="button" className="btn btn--ghost" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="btn btn--primary"
                        disabled={isSubmitting || uploading}
                    >
                        {(isSubmitting || uploading) && <Loader size={16} className={styles.spin} />}
                        {isEditing ? 'Save Changes' : 'Create Product'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
