import React, { useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2, Upload, X, GripVertical } from 'lucide-react';

interface Category {
    id: number;
    name: string;
    is_accessory: boolean;
    products_count: number;
}

interface Props {
    categories: Category[];
}

interface UnitType {
    label: string;
    price: string;
    is_default: boolean;
}

interface MiscOption {
    label: string;
    value: string;
    is_default: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Products',
        href: '/dashboard/products',
    },
    {
        title: 'Create',
        href: '/dashboard/products/create',
    },
];

interface ImagePreview {
    file: File;
    url: string;
    id: string;
}

export default function ProductCreate({ categories }: Props) {
    const [unitTypes, setUnitTypes] = useState<UnitType[]>([
        { label: '', price: '', is_default: true }
    ]);
    const [miscOptions, setMiscOptions] = useState<MiscOption[]>([]);
    const [imagesPreviews, setImagesPreviews] = useState<ImagePreview[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('');

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        categories: [] as number[],
        unit_types: unitTypes,
        misc_options: miscOptions,
        images: [] as File[]
    });

    // Sync unitTypes and miscOptions with form data
    useEffect(() => {
        setData('unit_types', unitTypes);
    }, [unitTypes]);

    useEffect(() => {
        setData('misc_options', miscOptions);
    }, [miscOptions]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        post('/dashboard/products');
    };

    const addUnitType = () => {
        setUnitTypes([...unitTypes, { label: '', price: '', is_default: false }]);
    };

    const removeUnitType = (index: number) => {
        if (unitTypes.length > 1) {
            const newUnitTypes = unitTypes.filter((_, i) => i !== index);
            setUnitTypes(newUnitTypes);
        }
    };

    const updateUnitType = (index: number, field: keyof UnitType, value: string | boolean) => {
        const newUnitTypes = [...unitTypes];
        if (field === 'is_default' && value === true) {
            // Only one can be default
            newUnitTypes.forEach((ut, i) => {
                ut.is_default = i === index;
            });
        } else {
            newUnitTypes[index] = { ...newUnitTypes[index], [field]: value };
        }
        setUnitTypes(newUnitTypes);
    };

    const addMiscOption = () => {
        setMiscOptions([...miscOptions, { label: '', value: '', is_default: false }]);
    };

    const removeMiscOption = (index: number) => {
        const newMiscOptions = miscOptions.filter((_, i) => i !== index);
        setMiscOptions(newMiscOptions);
    };

    const updateMiscOption = (index: number, field: keyof MiscOption, value: string | boolean) => {
        const newMiscOptions = [...miscOptions];
        newMiscOptions[index] = { ...newMiscOptions[index], [field]: value };
        setMiscOptions(newMiscOptions);
    };

    const handleCategoryChange = (value: string) => {
        if (value && !data.categories.includes(parseInt(value))) {
            setData('categories', [...data.categories, parseInt(value)]);
            setSelectedCategory('');
        }
    };

    const removeCategoryFromSelection = (categoryId: number) => {
        setData('categories', data.categories.filter(id => id !== categoryId));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const newPreviews: ImagePreview[] = files.map(file => ({
                file,
                url: URL.createObjectURL(file),
                id: Math.random().toString(36).substr(2, 9)
            }));

            setImagesPreviews(prev => [...prev, ...newPreviews]);
            setData('images', [...data.images, ...files]);
        }
    };

    const removeImage = (imageId: string) => {
        const imageToRemove = imagesPreviews.find(img => img.id === imageId);
        if (imageToRemove) {
            URL.revokeObjectURL(imageToRemove.url);
            setImagesPreviews(prev => prev.filter(img => img.id !== imageId));
            setData('images', data.images.filter(file => file !== imageToRemove.file));
        }
    };

    const moveImage = (fromIndex: number, toIndex: number) => {
        const newPreviews = [...imagesPreviews];
        const newImages = [...data.images];

        // Move preview
        const [movedPreview] = newPreviews.splice(fromIndex, 1);
        newPreviews.splice(toIndex, 0, movedPreview);

        // Move file
        const [movedFile] = newImages.splice(fromIndex, 1);
        newImages.splice(toIndex, 0, movedFile);

        setImagesPreviews(newPreviews);
        setData('images', newImages);
    };

    // Cleanup object URLs on unmount
    useEffect(() => {
        return () => {
            imagesPreviews.forEach(image => {
                URL.revokeObjectURL(image.url);
            });
        };
    }, [imagesPreviews]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Product" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Create Product</h1>
                        <p className="text-muted-foreground">
                            Add a new product to your catalog.
                        </p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href="/dashboard/products">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Products
                        </Link>
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="name">Product Name</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Enter product name"
                                />
                                {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                            </div>

                            <div>
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Enter product description"
                                    rows={4}
                                />
                                {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Categories */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Categories</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="category-select">Add Category</Label>
                                <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a category to add" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories
                                            .filter(category => !data.categories.includes(category.id))
                                            .map((category) => (
                                                <SelectItem key={category.id} value={category.id.toString()}>
                                                    <div className="flex items-center justify-between w-full">
                                                        <span>
                                                            {category.name}
                                                            {category.is_accessory && (
                                                                <span className="ml-1 text-xs text-muted-foreground">(Accessory)</span>
                                                            )}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground ml-2">
                                                            {category.products_count} products
                                                        </span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Selected Categories */}
                            {data.categories.length > 0 && (
                                <div>
                                    <Label>Selected Categories</Label>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {data.categories.map((categoryId) => {
                                            const category = categories.find(c => c.id === categoryId);
                                            return category ? (
                                                <div key={categoryId} className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                                                    <span>
                                                        {category.name}
                                                        {category.is_accessory && (
                                                            <span className="ml-1 text-xs">(Accessory)</span>
                                                        )}
                                                        <span className="ml-2 text-xs text-muted-foreground">
                                                            ({category.products_count} products)
                                                        </span>
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeCategoryFromSelection(categoryId)}
                                                        className="ml-2 hover:text-blue-900"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            ) : null;
                                        })}
                                    </div>
                                </div>
                            )}
                            {errors.categories && <p className="text-sm text-red-600">{errors.categories}</p>}
                        </CardContent>
                    </Card>

                    {/* Unit Types */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Unit Types & Pricing</CardTitle>
                                <Button type="button" variant="outline" size="sm" onClick={addUnitType}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Unit Type
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {unitTypes.map((unitType, index) => (
                                <div key={index} className="flex items-end space-x-4 p-4 border rounded-lg">
                                    <div className="flex-1">
                                        <Label htmlFor={`unit-label-${index}`}>Label</Label>
                                        <Input
                                            id={`unit-label-${index}`}
                                            value={unitType.label}
                                            onChange={(e) => updateUnitType(index, 'label', e.target.value)}
                                            placeholder="e.g., 2.4x2.7m"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <Label htmlFor={`unit-price-${index}`}>Price (IDR)</Label>
                                        <Input
                                            id={`unit-price-${index}`}
                                            type="number"
                                            value={unitType.price}
                                            onChange={(e) => updateUnitType(index, 'price', e.target.value)}
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`unit-default-${index}`}
                                            checked={unitType.is_default}
                                            onCheckedChange={(checked) =>
                                                updateUnitType(index, 'is_default', checked as boolean)
                                            }
                                        />
                                        <Label htmlFor={`unit-default-${index}`} className="text-sm">Default</Label>
                                    </div>
                                    {unitTypes.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => removeUnitType(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                            {errors.unit_types && <p className="text-sm text-red-600">{errors.unit_types}</p>}
                        </CardContent>
                    </Card>

                    {/* Misc Options */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Misc Options (Colors, Themes, etc.)</CardTitle>
                                <Button type="button" variant="outline" size="sm" onClick={addMiscOption}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Option
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {miscOptions.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No misc options added yet.</p>
                            ) : (
                                miscOptions.map((miscOption, index) => (
                                    <div key={index} className="flex items-end space-x-4 p-4 border rounded-lg">
                                        <div className="flex-1">
                                            <Label htmlFor={`misc-label-${index}`}>Label</Label>
                                            <Input
                                                id={`misc-label-${index}`}
                                                value={miscOption.label}
                                                onChange={(e) => updateMiscOption(index, 'label', e.target.value)}
                                                placeholder="e.g., Warna"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <Label htmlFor={`misc-value-${index}`}>Value</Label>
                                            <Input
                                                id={`misc-value-${index}`}
                                                value={miscOption.value}
                                                onChange={(e) => updateMiscOption(index, 'value', e.target.value)}
                                                placeholder="e.g., Hitam"
                                            />
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`misc-default-${index}`}
                                                checked={miscOption.is_default}
                                                onCheckedChange={(checked) =>
                                                    updateMiscOption(index, 'is_default', checked as boolean)
                                                }
                                            />
                                            <Label htmlFor={`misc-default-${index}`} className="text-sm">Default</Label>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => removeMiscOption(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>

                    {/* Images */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Product Images</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="images">Upload Images</Label>
                                <div className="mt-2">
                                    <Input
                                        id="images"
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                    />
                                    <Label
                                        htmlFor="images"
                                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                                    >
                                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                        <span className="text-sm text-gray-600">Click to upload images</span>
                                        <span className="text-xs text-gray-400">PNG, JPG, GIF up to 2MB each</span>
                                    </Label>
                                </div>
                                {errors.images && <p className="text-sm text-red-600 mt-1">{errors.images}</p>}
                            </div>

                            {/* Image Previews */}
                            {imagesPreviews.length > 0 && (
                                <div>
                                    <Label>Image Preview & Order</Label>
                                    <p className="text-sm text-muted-foreground mb-3">
                                        Drag to reorder. The first image will be used as the thumbnail.
                                    </p>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {imagesPreviews.map((image, index) => (
                                            <div
                                                key={image.id}
                                                className="relative group border rounded-lg overflow-hidden"
                                                draggable
                                                onDragStart={(e) => {
                                                    e.dataTransfer.setData('text/plain', index.toString());
                                                }}
                                                onDragOver={(e) => e.preventDefault()}
                                                onDrop={(e) => {
                                                    e.preventDefault();
                                                    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                                                    moveImage(fromIndex, index);
                                                }}
                                            >
                                                <div className="aspect-square relative">
                                                    <img
                                                        src={image.url}
                                                        alt={`Preview ${index + 1}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    {index === 0 && (
                                                        <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                                                            Thumbnail
                                                        </div>
                                                    )}
                                                    <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                                                        {index + 1}
                                                    </div>
                                                </div>

                                                {/* Controls */}
                                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                                                    <div className="opacity-0 group-hover:opacity-100 flex space-x-2">
                                                        <button
                                                            type="button"
                                                            className="p-1 bg-white rounded-full hover:bg-gray-100"
                                                            title="Drag to reorder"
                                                        >
                                                            <GripVertical className="h-4 w-4 text-gray-600" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeImage(image.id)}
                                                            className="p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                                                            title="Remove image"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Submit */}
                    <div className="flex items-center justify-end space-x-4">
                        <Button variant="outline" asChild>
                            <Link href="/dashboard/products">Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Creating...' : 'Create Product'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}