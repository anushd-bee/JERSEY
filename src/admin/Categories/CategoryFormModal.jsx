import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader } from 'lucide-react';
import Modal from '../../components/Modal/Modal';
import { categoryService } from '../../services/categoryService';
import { slugify } from '../../utils/helpers';
import styles from './CategoryFormModal.module.css';

const schema = z.object({
    name: z.string().min(1, 'Name is required'),
    slug: z.string().min(1, 'Slug is required'),
    description: z.string().optional(),
});

export default function CategoryFormModal({ isOpen, onClose, category, onSuccess }) {
    const isEditing = Boolean(category);
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
        defaultValues: { name: '', slug: '', description: '' },
    });

    const watchedName = watch('name');

    // Auto-generate slug from name (only in create mode)
    useEffect(() => {
        if (!isEditing && watchedName) {
            setValue('slug', slugify(watchedName), { shouldValidate: false });
        }
    }, [watchedName, isEditing, setValue]);

    // Populate form when editing
    useEffect(() => {
        if (isOpen) {
            if (category) {
                reset({
                    name: category.name ?? '',
                    slug: category.slug ?? '',
                    description: category.description ?? '',
                });
            } else {
                reset({ name: '', slug: '', description: '' });
            }
            setSubmitError('');
            setSubmitSuccess('');
        }
    }, [isOpen, category, reset]);

    async function onSubmit(values) {
        setSubmitError('');
        setSubmitSuccess('');

        try {
            let result;
            if (isEditing) {
                result = await categoryService.update(category.id, values);
            } else {
                result = await categoryService.create(values);
            }

            if (result.error) {
                // Surface Postgres unique constraint error legibly
                const msg = result.error.message || '';
                if (msg.includes('duplicate') || msg.includes('unique')) {
                    throw new Error(`A category with slug "${values.slug}" already exists. Choose a different name or slug.`);
                }
                throw new Error(msg || 'Something went wrong.');
            }

            setSubmitSuccess(isEditing ? 'Category updated!' : 'Category created!');
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 800);
        } catch (err) {
            setSubmitError(err.message);
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? 'Edit Category' : 'Add Category'}
        >
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <div className="modal__body">
                    {submitError && (
                        <div className="alert alert--danger mb-md">{submitError}</div>
                    )}
                    {submitSuccess && (
                        <div className="alert alert--success mb-md">{submitSuccess}</div>
                    )}

                    <div className={styles.formStack}>
                        {/* Name */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="cat-name">Name *</label>
                            <input
                                id="cat-name"
                                className={`form-input${errors.name ? ' form-input--error' : ''}`}
                                placeholder="e.g. Club Jerseys"
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
                                placeholder="club-jerseys"
                                {...register('slug')}
                            />
                            {errors.slug && <p className="form-error">{errors.slug.message}</p>}
                            <p className="form-helper">Must be unique. Auto-generated from name.</p>
                        </div>

                        {/* Description */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="cat-desc">Description</label>
                            <textarea
                                id="cat-desc"
                                className="form-textarea"
                                rows={3}
                                placeholder="Optional description…"
                                {...register('description')}
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
                        disabled={isSubmitting}
                    >
                        {isSubmitting && <Loader size={16} className={styles.spin} />}
                        {isEditing ? 'Save Changes' : 'Create Category'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
